/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: decidir si una identidad social ingresa, se registra o se vincula.
 */
import { OAuthError, type OAuthProfile } from '../types/oauth.js';

export type IdentityUser = {
  id: number;
  role: 'user' | 'admin';
  email: string;
  displayName: string;
  emailVerified: boolean;
};
export type IdentityStore = {
  findLinked: (provider: string, subject: string) => Promise<IdentityUser | null>;
  findByEmail: (email: string) => Promise<IdentityUser | null>;
  findById: (id: number) => Promise<IdentityUser | null>;
  createUser: (profile: OAuthProfile & { email: string }) => Promise<IdentityUser>;
  link: (userId: number, provider: string, profile: OAuthProfile) => Promise<void>;
  audit: (userId: number, event: string) => Promise<void>;
  requestVerification: (user: IdentityUser) => Promise<void>;
};

export const resolveOAuthIdentity = async (
  store: IdentityStore,
  provider: string,
  profile: OAuthProfile,
  linkUserId: number | null = null
): Promise<{ user: IdentityUser; requiresVerification: boolean }> => {
  const linked = await store.findLinked(provider, profile.providerUserId);
  if (linked && linkUserId !== null && linked.id !== linkUserId)
    throw new OAuthError('already_linked');
  let user = linked;
  if (!user) {
    // La vinculacion explicita demuestra posesion de la sesion local y de la cuenta social.
    if (linkUserId !== null) {
      user = await store.findById(linkUserId);
      if (!user || !user.emailVerified) throw new OAuthError('verification_required');
    } else {
      if (!profile.email) throw new OAuthError('email_required');
      user = await store.findByEmail(profile.email);
      // Ambos lados deben haber verificado el correo; una cuenta pendiente no se fusiona.
      if (user && (!profile.emailVerified || !user.emailVerified))
        throw new OAuthError('link_required');
      if (!user) {
        user = await store.createUser({ ...profile, email: profile.email });
        await store.audit(user.id, 'oauth_register');
      }
    }
    await store.link(user.id, provider, profile);
    await store.audit(user.id, 'oauth_link');
  }
  if (!user.emailVerified) {
    await store.requestVerification(user);
    return { user, requiresVerification: true };
  }
  await store.audit(user.id, 'oauth_login');
  return { user, requiresVerification: false };
};
// This file exports: resolveOAuthIdentity, IdentityUser e IdentityStore.
// It is used by: oauthAccountModel y tests sin red.
// It imports from: types/oauth.
