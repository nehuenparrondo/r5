/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: definir los contratos del modulo OAuth.
 */
export type OAuthProfile = {
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  name: string;
};
export type OAuthProvider = {
  id: string;
  label: string;
  authorizationUrl: string;
  issuer?: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  pkce: boolean;
  authorizationParams?: Record<string, string>;
  profileParams?: Record<string, string>;
  extraProfileUrl?: string;
  mapProfile: (raw: unknown, extra?: unknown) => OAuthProfile;
};
export type OAuthFlow = {
  stateHash: string;
  browserHash: string;
  provider: string;
  verifier: string | null;
  frontendOrigin: string;
  linkUserId: number | null;
  expiresAt: Date;
};
export class OAuthError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = 'OAuthError';
  }
}
// This file exports: OAuthProfile, OAuthProvider, OAuthFlow y OAuthError.
// It is used by: configuracion, modelos, servicios y controlador OAuth.
// It imports from: ninguna dependencia externa.
