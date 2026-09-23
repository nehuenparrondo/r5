/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: probar perfiles, PKCE, state y fallos externos sin APIs reales.
 */
import './setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { oauthProviders } from '../dist/config/oauthProviders.js';
import { OAuthError } from '../dist/types/oauth.js';
import {
  buildAuthorizationUrl,
  callbackSchema,
  digest,
  fetchOAuthProfile,
  frontendOrigin,
  getProvider,
  pkceChallenge,
  randomSecret,
  validateFlow
} from '../dist/services/oauthService.js';

const fixtures = {
  google: { sub: '12345', email: 'USER@example.com', email_verified: true, name: '  Ana  Test ' },
  github: { id: 12345, login: 'ana', name: 'Ana Test' },
  facebook: { id: '12345', email: 'ana@example.com', name: 'Ana Test', verified: true }
};
for (const provider of Object.values(oauthProviders)) {
  test(`${provider.id}: autorizacion, token y perfil por el flujo generico`, async () => {
    const state = randomSecret();
    const verifier = provider.pkce ? randomSecret() : null;
    const url = new URL(buildAuthorizationUrl(provider, state, verifier));
    assert.equal(url.searchParams.get('state'), state);
    assert.equal(url.searchParams.get('redirect_uri'), provider.redirectUri);
    assert.equal(url.searchParams.has('client_secret'), false);
    assert.equal(url.searchParams.get('code_challenge_method'), provider.pkce ? 'S256' : null);
    const calls = [];
    const fakeFetch = async (address, options) => {
      calls.push([address, options]);
      assert.equal(options.redirect, 'error');
      assert.ok(options.signal);
      if (address === provider.tokenUrl) {
        assert.equal(options.method, 'POST');
        assert.equal(options.body.get('client_secret'), provider.clientSecret);
        assert.equal(options.body.get('code_verifier'), verifier);
        return Response.json({ access_token: 'external-token-not-persisted' });
      }
      assert.equal(options.headers.Authorization, 'Bearer external-token-not-persisted');
      if (address === provider.extraProfileUrl)
        return Response.json([
          { email: 'private@example.com', primary: true, verified: false },
          { email: 'USER@example.com', primary: false, verified: true }
        ]);
      return Response.json(fixtures[provider.id]);
    };
    const profile = await fetchOAuthProfile(provider, 'authorization-code', verifier, fakeFetch);
    assert.equal(profile.providerUserId, '12345');
    assert.equal(profile.emailVerified, provider.id !== 'facebook');
    assert.equal(
      profile.email,
      provider.id === 'facebook' ? 'ana@example.com' : 'user@example.com'
    );
    assert.equal('access_token' in profile, false);
    assert.equal(calls.length, provider.extraProfileUrl ? 3 : 2);
  });
}
test('PKCE cumple el vector S256 del RFC 7636', () => {
  assert.equal(
    pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
    'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
  );
});
test('state exige navegador, proveedor, transaccion y vigencia correctos', () => {
  const state = randomSecret();
  const browser = randomSecret();
  const flow = {
    stateHash: digest(state),
    browserHash: digest(browser),
    provider: 'google',
    expiresAt: new Date(Date.now() + 60000)
  };
  assert.doesNotThrow(() => validateFlow(flow, state, browser, 'google'));
  for (const [candidate, cookie, provider] of [
    [randomSecret(), browser, 'google'],
    [state, undefined, 'google'],
    [state, randomSecret(), 'google'],
    [state, browser, 'github']
  ]) {
    assert.throws(() => validateFlow(flow, candidate, cookie, provider), OAuthError);
  }
  assert.throws(
    () => validateFlow({ ...flow, expiresAt: new Date(0) }, state, browser, 'google'),
    OAuthError
  );
});
test('callback rechaza campos ausentes, repetidos, objetos y respuestas ambiguas', () => {
  const state = randomSecret();
  assert.equal(callbackSchema.safeParse({ state, code: 'valid' }).success, true);
  assert.equal(callbackSchema.safeParse({ state, error: 'access_denied' }).success, true);
  for (const query of [
    { code: 'valid' },
    { state },
    { state, code: ['a', 'b'] },
    { state, code: {} },
    { state, code: 'a', error: 'bad' },
    { state, code: 'a', returnTo: 'https://evil.test' }
  ]) {
    assert.equal(callbackSchema.safeParse(query).success, false);
  }
});
test('no admite proveedores heredados ni redirecciones abiertas', () => {
  assert.throws(() => getProvider('__proto__'), OAuthError);
  assert.throws(() => getProvider('discord'), OAuthError);
  assert.throws(() => frontendOrigin('https://evil.test'), OAuthError);
  assert.throws(() => frontendOrigin('http://localhost:5173/redirect'), OAuthError);
  assert.equal(frontendOrigin('http://localhost:5174'), 'http://localhost:5174');
  const previous = oauthProviders.google.redirectUri;
  oauthProviders.google.redirectUri = 'https://evil.test/callback';
  try {
    assert.throws(() => getProvider('google'), OAuthError);
  } finally {
    oauthProviders.google.redirectUri = previous;
  }
});
test('Facebook no infiere email verificado del campo verified', () => {
  assert.equal(oauthProviders.facebook.mapProfile(fixtures.facebook).emailVerified, false);
});
test('Google valida tipos estrictos de email_verified', () => {
  assert.throws(() =>
    oauthProviders.google.mapProfile({ ...fixtures.google, email_verified: 'true' })
  );
});
test('GitHub sin correo verificado no usa el email publico como respaldo', () => {
  const result = oauthProviders.github.mapProfile(
    { ...fixtures.github, email: 'victim@example.com' },
    [{ email: 'victim@example.com', primary: true, verified: false }]
  );
  assert.equal(result.email, null);
  assert.equal(result.emailVerified, false);
});
test('errores HTTP, JSON invalido y tokens ausentes producen fallos seguros', async () => {
  for (const response of [
    new Response('secret response', { status: 500 }),
    new Response('not-json'),
    Response.json({ error: 'invalid_grant' })
  ]) {
    await assert.rejects(
      fetchOAuthProfile(oauthProviders.google, 'code', 'verifier', async () => response),
      OAuthError
    );
  }
});
// This file exports: pruebas node:test.
// It is used by: npm test.
// It imports from: setup, Node y servicios compilados.
