/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: verificar reglas de registro y vinculacion con un almacen simulado.
 */
import './setup.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOAuthIdentity } from '../dist/services/oauthIdentityService.js';

const profile = {
  providerUserId: 'subject-1',
  email: 'ana@example.com',
  emailVerified: true,
  name: 'Ana'
};
const existing = {
  id: 7,
  email: profile.email,
  emailVerified: true,
  role: 'admin',
  displayName: 'Ana'
};
const makeStore = (overrides = {}) => {
  const events = [];
  const links = [];
  let created = 0;
  let verification = 0;
  return {
    events,
    links,
    get created() {
      return created;
    },
    get verification() {
      return verification;
    },
    async findLinked() {
      return null;
    },
    async findByEmail() {
      return null;
    },
    async findById() {
      return existing;
    },
    async createUser(data) {
      created++;
      return {
        id: 10,
        email: data.email,
        emailVerified: data.emailVerified,
        role: 'user',
        displayName: data.name
      };
    },
    async link(...values) {
      links.push(values);
    },
    async audit(_id, action) {
      events.push(action);
    },
    async requestVerification() {
      verification++;
    },
    ...overrides
  };
};
test('registro social crea usuario normal, vinculo y auditoria', async () => {
  const store = makeStore();
  const result = await resolveOAuthIdentity(store, 'google', profile);
  assert.equal(result.user.role, 'user');
  assert.equal(result.requiresVerification, false);
  assert.equal(store.created, 1);
  assert.equal(store.links.length, 1);
  assert.deepEqual(store.events, ['oauth_register', 'oauth_link', 'oauth_login']);
});
test('identidad vinculada reutiliza usuario y rol sin depender del email actual del proveedor', async () => {
  const store = makeStore({
    async findLinked() {
      return existing;
    }
  });
  const result = await resolveOAuthIdentity(store, 'github', { ...profile, email: null });
  assert.equal(result.user.id, existing.id);
  assert.equal(result.user.role, 'admin');
  assert.equal(store.links.length, 0);
  assert.equal(store.created, 0);
});
test('email verificado vincula al usuario verificado existente y conserva su rol', async () => {
  const store = makeStore({
    async findByEmail() {
      return existing;
    }
  });
  const result = await resolveOAuthIdentity(store, 'google', profile);
  assert.equal(result.user.id, existing.id);
  assert.equal(store.created, 0);
  assert.equal(store.links[0][0], existing.id);
});
test('un proveedor sin email verificado no toma una cuenta existente por coincidencia', async () => {
  const store = makeStore({
    async findByEmail() {
      return existing;
    }
  });
  await assert.rejects(
    resolveOAuthIdentity(store, 'external', { ...profile, emailVerified: false }),
    { reason: 'link_required' }
  );
  assert.equal(store.links.length, 0);
});
test('un registro local pendiente no se fusiona aunque Google confirme el correo', async () => {
  const store = makeStore({
    async findByEmail() {
      return { ...existing, emailVerified: false };
    }
  });
  await assert.rejects(resolveOAuthIdentity(store, 'google', profile), { reason: 'link_required' });
  assert.equal(store.links.length, 0);
});
test('una identidad con email no verificado requiere confirmacion antes de emitir sesion', async () => {
  const store = makeStore();
  const result = await resolveOAuthIdentity(store, 'external', {
    ...profile,
    emailVerified: false
  });
  assert.equal(result.requiresVerification, true);
  assert.equal(store.verification, 1);
  assert.equal(store.events.includes('oauth_login'), false);
});
test('la vinculacion explicita permite un proveedor sin email en una sesion verificada', async () => {
  const store = makeStore();
  const result = await resolveOAuthIdentity(
    store,
    'external',
    { ...profile, email: null, emailVerified: false },
    existing.id
  );
  assert.equal(result.user.id, existing.id);
  assert.equal(store.links.length, 1);
});
test('no se puede trasladar un vinculo ajeno ni vincular desde una cuenta sin verificar', async () => {
  const linked = makeStore({
    async findLinked() {
      return existing;
    }
  });
  await assert.rejects(resolveOAuthIdentity(linked, 'google', profile, 99), {
    reason: 'already_linked'
  });
  const unverified = makeStore({
    async findById() {
      return { ...existing, emailVerified: false };
    }
  });
  await assert.rejects(resolveOAuthIdentity(unverified, 'google', profile, existing.id), {
    reason: 'verification_required'
  });
});
test('no crea identidades sin email ni inventa direcciones ficticias', async () => {
  const store = makeStore();
  await assert.rejects(resolveOAuthIdentity(store, 'github', { ...profile, email: null }), {
    reason: 'email_required'
  });
  assert.equal(store.created, 0);
});
// This file exports: pruebas de identidad.
// It is used by: npm test.
// It imports from: setup, Node y oauthIdentityService.
