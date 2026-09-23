/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: configurar Google, GitHub y Facebook sin duplicar el flujo.
 */
import { z } from 'zod';
import { env } from './env.js';
import type { OAuthProfile, OAuthProvider } from '../types/oauth.js';

// Las respuestas externas se validan antes de convertirlas a un perfil comun.
const googleProfile = z.object({
  sub: z.string().min(1).max(255),
  email: z.string().email().max(254).optional(),
  email_verified: z.boolean().optional(),
  name: z.string().max(500).optional()
});
const githubProfile = z.object({
  id: z.number().int().positive().safe(),
  login: z.string().min(1).max(100),
  name: z.string().max(500).nullable().optional()
});
const githubEmails = z
  .array(
    z.object({
      email: z.string().email().max(254),
      verified: z.boolean(),
      primary: z.boolean()
    })
  )
  .max(100);
const facebookProfile = z.object({
  id: z.string().min(1).max(255),
  name: z.string().max(500).optional(),
  email: z.string().email().max(254).optional()
});
const credentials = (prefix: 'GOOGLE' | 'GITHUB' | 'FACEBOOK') => ({
  clientId: env[`${prefix}_CLIENT_ID`],
  clientSecret: env[`${prefix}_CLIENT_SECRET`],
  redirectUri: env[`${prefix}_REDIRECT_URI`]
});

// Solo Google y GitHub anuncian PKCE S256 para estos flujos web.
export const oauthProviders: Record<string, OAuthProvider> = {
  google: {
    id: 'google',
    label: 'Google',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
    pkce: true,
    ...credentials('GOOGLE'),
    mapProfile(raw): OAuthProfile {
      const profile = googleProfile.parse(raw);
      return {
        providerUserId: profile.sub,
        email: profile.email ?? null,
        emailVerified: profile.email_verified === true,
        name: profile.name ?? 'Usuario Google'
      };
    }
  },
  github: {
    id: 'github',
    label: 'GitHub',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    extraProfileUrl: 'https://api.github.com/user/emails',
    scope: 'read:user user:email',
    pkce: true,
    ...credentials('GITHUB'),
    mapProfile(raw, extra): OAuthProfile {
      const profile = githubProfile.parse(raw);
      const emails = githubEmails.parse(extra);
      const email =
        emails.find((entry) => entry.primary && entry.verified) ??
        emails.find((entry) => entry.verified);
      return {
        providerUserId: String(profile.id),
        email: email?.email ?? null,
        emailVerified: email?.verified === true,
        name: profile.name || profile.login
      };
    }
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    authorizationUrl: `https://www.facebook.com/${env.FACEBOOK_GRAPH_VERSION}/dialog/oauth`,
    tokenUrl: `https://graph.facebook.com/${env.FACEBOOK_GRAPH_VERSION}/oauth/access_token`,
    userInfoUrl: `https://graph.facebook.com/${env.FACEBOOK_GRAPH_VERSION}/me`,
    scope: 'email,public_profile',
    pkce: false,
    profileParams: { fields: 'id,name,email' },
    ...credentials('FACEBOOK'),
    mapProfile(raw): OAuthProfile {
      const profile = facebookProfile.parse(raw);
      // Facebook no proporciona email_verified: no inferimos esa garantia.
      return {
        providerUserId: profile.id,
        email: profile.email ?? null,
        emailVerified: false,
        name: profile.name ?? 'Usuario Facebook'
      };
    }
  }
};
// This file exports: oauthProviders.
// It is used by: oauthService y oauthController.
// It imports from: zod, config/env y types/oauth.
