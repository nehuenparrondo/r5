/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: recorrer las rutas HTTP OAuth y comprobar regresiones de acceso local.
 */
import './setup.mjs';
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import bcrypt from 'bcrypt';
import { pool } from '../dist/config/db.js';
import { app } from '../dist/app.js';
import { verifyAuthToken, signAuthToken } from '../dist/utils/jwt.js';

// El servidor es real; MySQL y las APIs externas se sustituyen sin tocar datos locales.
const flows = new Map();
const audit = [];
const user = {
  id: 7,
  email: 'ana@example.com',
  username: 'ana',
  role: 'user',
  display_name: 'Ana',
  displayName: 'Ana',
  bio: '',
  emailVerified: true,
  email_verified_at: new Date(),
  password_hash: await bcrypt.hash('Password123!', 4)
};
const originalExecute = pool.execute;
const originalConnection = pool.getConnection;
const originalFetch = globalThis.fetch;
let server;
let base;
let tokenCalls = 0;
let transactionDeletes = 0;

const execute = async (sql, values = []) => {
  if (sql.startsWith('DELETE FROM oauth_flows WHERE expires_at')) return [{ affectedRows: 0 }];
  if (sql.includes('INSERT INTO oauth_flows')) {
    flows.set(values[0], {
      stateHash: values[0],
      browserHash: values[1],
      provider: values[2],
      verifier: values[3],
      frontendOrigin: values[4],
      linkUserId: values[5],
      expiresAt: values[6]
    });
    return [{ affectedRows: 1 }];
  }
  if (sql.trimStart().startsWith('SELECT') && sql.includes('FROM oauth_flows WHERE state_hash'))
    return [[flows.get(values[0])].filter(Boolean)];
  if (sql.startsWith('DELETE FROM oauth_flows WHERE state_hash')) {
    transactionDeletes++;
    flows.delete(values[0]);
    return [{ affectedRows: 1 }];
  }
  if (sql.includes('INSERT INTO audit_logs')) {
    audit.push(values);
    return [{ affectedRows: 1 }];
  }
  if (sql.includes('FROM users u')) return [[user]];
  if (sql.includes('SELECT password_hash FROM users')) return [[user]];
  if (sql.includes('FROM oauth_accounts WHERE user_id'))
    return [
      [
        {
          id: 1,
          provider: 'google',
          email: user.email,
          createdAt: new Date()
        }
      ]
    ];
  throw new Error(`Consulta inesperada en el doble: ${sql}`);
};
before(async () => {
  pool.execute = execute;
  pool.getConnection = async () => ({
    execute,
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {}
  });
  globalThis.fetch = async (address, options) => {
    const url = String(address);
    if (url.startsWith('http://127.0.0.1:')) return originalFetch(address, options);
    if (url.includes('/token') || url.includes('/access_token')) {
      tokenCalls++;
      return Response.json({ access_token: 'external-secret-token' });
    }
    if (url.includes('googleapis.com'))
      return Response.json({ sub: '12345', email: user.email, email_verified: true, name: 'Ana' });
    if (url.includes('/user/emails'))
      return Response.json([{ email: user.email, verified: true, primary: true }]);
    if (url.includes('api.github.com')) return Response.json({ id: 12345, login: 'ana' });
    if (url.includes('discord.com/api/users/@me'))
      return Response.json({
        id: '12345',
        username: 'ana',
        global_name: 'Ana',
        email: user.email,
        verified: true
      });
    throw new Error('Se bloqueo una conexion externa inesperada.');
  };
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  pool.execute = originalExecute;
  pool.getConnection = originalConnection;
  globalThis.fetch = originalFetch;
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});
const post = (path, body = {}, cookie, origin = 'http://localhost:5173') =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: JSON.stringify(body),
    redirect: 'manual'
  });
const startFlow = async (provider) => {
  const response = await fetch(`${base}/api/auth/oauth/${provider}?origin=http://localhost:5174`, {
    redirect: 'manual'
  });
  assert.equal(response.status, 303);
  const location = new URL(response.headers.get('location'));
  const cookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith('oauth_browser_'));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  return { state: location.searchParams.get('state'), cookie: cookie.split(';')[0] };
};

test('metadatos exponen los tres proveedores y ninguna credencial', async () => {
  const response = await fetch(`${base}/api/auth/oauth/providers`);
  const data = await response.json();
  assert.deepEqual(
    data.providers.map((provider) => provider.id),
    ['google', 'github', 'discord']
  );
  assert.equal(JSON.stringify(data).includes('secret'), false);
  assert.equal(JSON.stringify(data).includes('clientId'), false);
});

for (const provider of ['google', 'github', 'discord']) {
  test(`${provider}: boton/inicio → callback → JWT HttpOnly → perfil activo`, async () => {
    const flow = await startFlow(provider);
    const issuer = provider === 'github' ? '&iss=https%3A%2F%2Fgithub.com%2Flogin%2Foauth' : '';
    const response = await fetch(
      `${base}/api/auth/oauth/${provider}/callback?state=${flow.state}&code=provider-code${issuer}`,
      { headers: { Cookie: flow.cookie }, redirect: 'manual' }
    );
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('location'), 'http://localhost:5174/perfil');
    const cookies = response.headers.getSetCookie();
    const authCookie = cookies.find((value) => value.startsWith('auth_token='));
    assert.ok(authCookie);
    assert.match(authCookie, /HttpOnly/);
    assert.match(authCookie, /SameSite=Strict/);
    assert.equal(authCookie.includes('external-secret-token'), false);
    assert.ok(
      cookies.some((value) => value.startsWith('oauth_browser_') && value.includes('Expires='))
    );
    const payload = verifyAuthToken(
      decodeURIComponent(authCookie.split(';')[0].slice('auth_token='.length))
    );
    assert.equal(payload.sub, '7');
    assert.equal(payload.provider, provider);
    const me = await post('/api/auth/me', {}, authCookie.split(';')[0]);
    assert.equal(me.status, 200);
    const data = await me.json();
    assert.equal(data.user.authProvider, provider);
    assert.equal('password_hash' in data.user, false);
    assert.ok(audit.some((entry) => entry[1] === 'oauth_login'));
    const repeated = await fetch(
      `${base}/api/auth/oauth/${provider}/callback?state=${flow.state}&code=provider-code`,
      { headers: { Cookie: flow.cookie }, redirect: 'manual' }
    );
    assert.match(repeated.headers.get('location'), /oauth_invalid_state/);
  });
}
test('cancelacion y navegador incorrecto no intercambian codes por tokens', async () => {
  const prior = tokenCalls;
  const flow = await startFlow('google');
  const invalid = await fetch(
    `${base}/api/auth/oauth/google/callback?state=${flow.state}&code=code`,
    { redirect: 'manual' }
  );
  assert.match(invalid.headers.get('location'), /oauth_invalid_state/);
  const cancelled = await fetch(
    `${base}/api/auth/oauth/google/callback?state=${flow.state}&error=access_denied`,
    { headers: { Cookie: flow.cookie }, redirect: 'manual' }
  );
  assert.match(cancelled.headers.get('location'), /oauth_cancelled/);
  assert.equal(tokenCalls, prior);
  assert.ok(transactionDeletes >= 3);
});
test('el inicio no redirige a destinos elegidos por un atacante', async () => {
  const response = await fetch(`${base}/api/auth/oauth/google?origin=https://evil.test`, {
    redirect: 'manual'
  });
  assert.equal(new URL(response.headers.get('location')).origin, 'http://localhost:5173');
});
test('login local, me y logout mantienen el contrato y las cookies', async () => {
  const response = await post('/api/auth/login', { login: user.email, password: 'Password123!' });
  assert.equal(response.status, 200);
  const cookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith('auth_token='))
    .split(';')[0];
  const me = await post('/api/auth/me', {}, cookie);
  const data = await me.json();
  assert.equal(data.user.hasPassword, true);
  assert.equal(data.user.authProvider, null);
  assert.equal(data.user.role, 'user');
  assert.equal((await post('/api/auth/logout', {}, cookie)).status, 200);
});
test('contraseña incorrecta y cuenta social sin hash se rechazan sin llamar bcrypt con null', async () => {
  assert.equal(
    (await post('/api/auth/login', { login: user.email, password: 'wrong' })).status,
    401
  );
  const saved = user.password_hash;
  user.password_hash = null;
  try {
    assert.equal(
      (await post('/api/auth/login', { login: user.email, password: 'anything' })).status,
      401
    );
    const cookie = `auth_token=${signAuthToken({ sub: '7', role: 'user', provider: 'github' })}`;
    assert.equal(
      (
        await post(
          '/api/profile/change-password',
          {
            currentPassword: 'anything',
            newPassword: 'NewPassword123!',
            confirmNewPassword: 'NewPassword123!'
          },
          cookie
        )
      ).status,
      400
    );
  } finally {
    user.password_hash = saved;
  }
});
test('vinculos privados y vinculacion explicita requieren sesion y Origin valido', async () => {
  assert.equal((await post('/api/auth/oauth/accounts')).status, 401);
  const cookie = `auth_token=${signAuthToken({ sub: '7', role: 'user' })}`;
  const accounts = await post('/api/auth/oauth/accounts', {}, cookie);
  assert.equal(accounts.status, 200);
  const response = await fetch(`${base}/api/auth/oauth/github/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: '{}'
  });
  assert.equal(response.status, 403);
});
test('un usuario normal sigue sin acceder al panel admin', async () => {
  const cookie = `auth_token=${signAuthToken({ sub: '7', role: 'user' })}`;
  assert.equal((await post('/api/admin/users', {}, cookie)).status, 403);
});
// This file exports: pruebas HTTP y regresion.
// It is used by: npm test.
// It imports from: setup, Node, bcrypt y modulos backend compilados.
