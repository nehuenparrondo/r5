/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: coordinar inicio, callback y consulta de cuentas OAuth.
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { oauthProviders } from '../config/oauthProviders.js';
import { authenticateOAuthAccount, listOAuthAccounts } from '../models/oauthAccountModel.js';
import { consumeFlow, saveFlow } from '../models/oauthFlowModel.js';
import {
  buildAuthorizationUrl,
  callbackSchema,
  digest,
  fetchOAuthProfile,
  frontendOrigin,
  getProvider,
  randomSecret
} from '../services/oauthService.js';
import { OAuthError } from '../types/oauth.js';
import { issueAuthSession } from '../utils/authSession.js';
import { writeAuditLog } from '../utils/audit.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth/oauth',
  maxAge: 10 * 60 * 1000
};
const cookieName = (provider: string) => `oauth_browser_${provider}`;
const errorReason = (error: unknown) =>
  error instanceof OAuthError ? error.reason : 'server_error';
const redirectError = (res: Response, origin: string, reason: string, linking = false) => {
  const target = new URL(linking ? '/perfil' : '/login', origin);
  target.searchParams.set('error', `oauth_${reason}`);
  res.redirect(303, target.href);
};

export const listProviders = (_req: Request, res: Response): void => {
  const providers = Object.values(oauthProviders).map(({ id, label }) => {
    try {
      getProvider(id);
      return { id, label, enabled: true };
    } catch {
      return { id, label, enabled: false };
    }
  });
  res.set('Cache-Control', 'no-store').json({ ok: true, providers });
};

export const startOAuth = async (req: Request, res: Response): Promise<void> => {
  let origin = new URL(env.APP_URL).origin;
  const linking = req.method === 'POST';
  try {
    const input = z
      .object({ origin: z.string().max(300).optional() })
      .strict()
      .parse(req.query);
    origin = frontendOrigin(input.origin);
    const provider = getProvider(req.params.provider);
    const state = randomSecret();
    const browser = randomSecret();
    const verifier = provider.pkce ? randomSecret() : null;
    await saveFlow({
      stateHash: digest(state),
      browserHash: digest(browser),
      provider: provider.id,
      verifier,
      frontendOrigin: origin,
      linkUserId: linking ? req.auth!.userId : null,
      expiresAt: new Date(Date.now() + cookieOptions.maxAge)
    });
    res.cookie(cookieName(provider.id), browser, cookieOptions);
    res.set('Cache-Control', 'no-store');
    const url = buildAuthorizationUrl(provider, state, verifier);
    if (linking) res.json({ ok: true, url });
    else res.redirect(303, url);
  } catch (error) {
    if (linking) res.status(400).json({ ok: false, message: `oauth_${errorReason(error)}` });
    else redirectError(res, origin, errorReason(error));
  }
};

export const oauthCallback = async (req: Request, res: Response): Promise<void> => {
  let origin = new URL(env.APP_URL).origin;
  let linking = false;
  const providerName = typeof req.params.provider === 'string' ? req.params.provider : '';
  res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  if (Object.hasOwn(oauthProviders, providerName))
    res.clearCookie(cookieName(providerName), { ...cookieOptions, maxAge: undefined });
  try {
    const provider = getProvider(providerName);
    const parsed = callbackSchema.safeParse(req.query);
    if (!parsed.success) throw new OAuthError('invalid_state');
    const query = parsed.data;
    const flow = await consumeFlow(
      query.state,
      req.cookies?.[cookieName(provider.id)],
      provider.id
    );
    origin = frontendOrigin(flow.frontendOrigin);
    linking = flow.linkUserId !== null;
    if (query.error)
      throw new OAuthError(query.error === 'access_denied' ? 'cancelled' : 'provider_unavailable');
    if (query.iss && query.iss !== new URL(provider.authorizationUrl).origin)
      throw new OAuthError('invalid_profile');
    const profile = await fetchOAuthProfile(provider, query.code!, flow.verifier);
    const result = await authenticateOAuthAccount(provider.id, profile, flow.linkUserId, req.ip);
    if (result.requiresVerification) {
      redirectError(res, origin, 'verification_required', linking);
      return;
    }
    issueAuthSession(res, result.user.id, result.user.role, provider.id);
    res.redirect(303, new URL('/perfil', origin).href);
  } catch (error) {
    // Nunca registrar codes, tokens, cookies, secretos ni respuestas crudas.
    await writeAuditLog(null, 'oauth_failed', req.ip, {
      provider: providerName.slice(0, 30),
      reason: errorReason(error)
    }).catch(() => undefined);
    redirectError(res, origin, errorReason(error), linking);
  }
};

export const linkedAccounts = async (req: Request, res: Response): Promise<void> => {
  const accounts = await listOAuthAccounts(req.auth!.userId);
  res.json({ ok: true, accounts });
};
// This file exports: listProviders, startOAuth, oauthCallback y linkedAccounts.
// It is used by: oauthRoutes.
// It imports from: Express, zod, configuracion, modelos, servicios y utilidades.
