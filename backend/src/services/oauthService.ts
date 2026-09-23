/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: validar OAuth y consultar proveedores con un flujo generico.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { oauthProviders } from '../config/oauthProviders.js';
import { allowedOrigins, env } from '../config/env.js';
import {
  OAuthError,
  type OAuthFlow,
  type OAuthProfile,
  type OAuthProvider
} from '../types/oauth.js';
import { normalizeDisplayName, normalizeEmail } from '../utils/normalize.js';

export const digest = (value: string): string => createHash('sha256').update(value).digest('hex');
export const randomSecret = (): string => randomBytes(32).toString('hex');
export const pkceChallenge = (verifier: string): string =>
  createHash('sha256').update(verifier).digest('base64url');

// Un destino solo puede ser un origen propio, nunca un returnTo arbitrario.
export const frontendOrigin = (value: unknown): string => {
  const candidate = value ?? new URL(env.APP_URL).origin;
  if (
    typeof candidate !== 'string' ||
    !allowedOrigins.includes(candidate) ||
    new URL(candidate).origin !== candidate
  )
    throw new OAuthError('invalid_origin');
  return candidate;
};
export const getProvider = (name: unknown): OAuthProvider => {
  if (typeof name !== 'string' || !Object.hasOwn(oauthProviders, name))
    throw new OAuthError('unsupported_provider');
  const provider = oauthProviders[name];
  if (!provider.clientId || !provider.clientSecret || !provider.redirectUri)
    throw new OAuthError('not_configured');
  const expected = new URL(`/api/auth/oauth/${provider.id}/callback`, env.API_PUBLIC_URL).href;
  if (provider.redirectUri !== expected) throw new OAuthError('configuration');
  const redirect = new URL(provider.redirectUri);
  if (
    redirect.protocol !== 'https:' &&
    !(
      env.NODE_ENV !== 'production' &&
      redirect.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(redirect.hostname)
    )
  )
    throw new OAuthError('configuration');
  return provider;
};
export const buildAuthorizationUrl = (
  provider: OAuthProvider,
  state: string,
  verifier: string | null
): string => {
  const url = new URL(provider.authorizationUrl);
  const params = {
    ...provider.authorizationParams,
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    response_type: 'code',
    scope: provider.scope,
    state
  };
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  if (provider.pkce && verifier) {
    url.searchParams.set('code_challenge', pkceChallenge(verifier));
    url.searchParams.set('code_challenge_method', 'S256');
  }
  return url.href;
};

// Se admiten los metadatos documentados, pero nunca arrays ni objetos anidados.
export const callbackSchema = z
  .object({
    state: z.string().regex(/^[a-f0-9]{64}$/),
    code: z.string().min(1).max(4096).optional(),
    error: z.string().min(1).max(100).optional(),
    error_description: z.string().max(2000).optional(),
    error_reason: z.string().max(200).optional(),
    error_code: z.string().max(50).optional(),
    scope: z.string().max(2000).optional(),
    authuser: z.string().max(20).optional(),
    prompt: z.string().max(100).optional(),
    iss: z.string().max(300).optional()
  })
  .strict()
  .refine((query) => Boolean(query.code) !== Boolean(query.error));

// El state identifica la transaccion; la cookie vincula esa transaccion al navegador.
export const validateFlow = (
  flow: OAuthFlow,
  state: string,
  browser: unknown,
  provider: string
): void => {
  if (
    typeof browser !== 'string' ||
    !/^[a-f0-9]{64}$/.test(browser) ||
    flow.provider !== provider ||
    flow.expiresAt.getTime() <= Date.now() ||
    flow.stateHash !== digest(state) ||
    !timingSafeEqual(Buffer.from(flow.browserHash, 'hex'), Buffer.from(digest(browser), 'hex'))
  )
    throw new OAuthError('invalid_state');
};

// No se siguen redirecciones externas ni se incluyen respuestas sensibles en errores.
const requestJson = async (
  url: string,
  init: RequestInit,
  fetcher: typeof fetch
): Promise<unknown> => {
  try {
    const response = await fetcher(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new OAuthError('provider_unavailable');
    const text = await response.text();
    if (text.length > 1024 * 1024) throw new OAuthError('invalid_profile');
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof OAuthError) throw error;
    throw new OAuthError('provider_unavailable');
  }
};
export const fetchOAuthProfile = async (
  provider: OAuthProvider,
  code: string,
  verifier: string | null,
  fetcher: typeof fetch = fetch
): Promise<OAuthProfile> => {
  const body = new URLSearchParams({
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    redirect_uri: provider.redirectUri,
    grant_type: 'authorization_code',
    code
  });
  if (provider.pkce && verifier) body.set('code_verifier', verifier);
  const tokenResult = await requestJson(
    provider.tokenUrl,
    {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    },
    fetcher
  );
  const token = z.object({ access_token: z.string().min(1).max(8192) }).safeParse(tokenResult);
  if (!token.success) throw new OAuthError('provider_unavailable');
  const headers = {
    Authorization: `Bearer ${token.data.access_token}`,
    Accept: 'application/json',
    'User-Agent': 'SistemaUsuarios-R5'
  };
  const profileUrl = new URL(provider.userInfoUrl);
  for (const [key, value] of Object.entries(provider.profileParams ?? {}))
    profileUrl.searchParams.set(key, value);
  const raw = await requestJson(profileUrl.href, { headers }, fetcher);
  const extra = provider.extraProfileUrl
    ? await requestJson(provider.extraProfileUrl, { headers }, fetcher)
    : undefined;
  try {
    const mapped = provider.mapProfile(raw, extra);
    return {
      ...mapped,
      email: mapped.email ? normalizeEmail(mapped.email) : null,
      name: normalizeDisplayName(mapped.name).slice(0, 80) || 'Usuario'
    };
  } catch {
    throw new OAuthError('invalid_profile');
  }
};
// This file exports: helpers de state, PKCE, proveedores y fetchOAuthProfile.
// It is used by: controlador, modelos OAuth y tests.
// It imports from: node:crypto, zod, configuracion, tipos y normalizadores.
