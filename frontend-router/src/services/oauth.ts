/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: consultar acceso social sin exponer tokens.
 */
export type SocialProvider = { id: string; label: string; enabled: boolean };
export type LinkedAccount = {
  id: number;
  provider: string;
  email: string | null;
  createdAt: string;
};
const messages: Record<string, string> = {
  oauth_cancelled: 'Cancelaste el acceso social. Podés intentarlo otra vez.',
  oauth_invalid_state: 'El intento venció o no pertenece a este navegador. Volvé a comenzar.',
  oauth_not_configured: 'Este proveedor todavía no está configurado.',
  oauth_configuration: 'La configuración del proveedor necesita revisión.',
  oauth_unsupported_provider: 'Ese proveedor no está disponible.',
  oauth_invalid_origin: 'La dirección de regreso no está autorizada.',
  oauth_provider_unavailable: 'El proveedor no respondió correctamente. Intentá más tarde.',
  oauth_invalid_profile: 'No pudimos validar los datos enviados por el proveedor.',
  oauth_email_required:
    'El proveedor no compartió un email verificado. Autorizá el permiso de email, o vinculá desde tu perfil.',
  oauth_link_required:
    'Ingresá con tu método habitual y vinculá esta cuenta desde tu perfil. No fusionamos emails sin verificar.',
  oauth_already_linked: 'Esa cuenta social ya está vinculada a otro usuario.',
  oauth_verification_required:
    'Revisá tu correo y verificá el email. Después volvé a ingresar con el mismo proveedor.',
  oauth_verification_unavailable:
    'No se pudo enviar la verificación. Revisá la configuración de correo y volvé a intentar.',
  oauth_rate_limited: 'Demasiados intentos. Esperá unos minutos antes de volver a probar.',
  oauth_server_error:
    'No se pudo completar el acceso social. Revisá el servidor y la migración OAuth.'
};
export const oauthMessage = (code: string): string =>
  messages[code] ?? 'No se pudo completar el acceso social. Volvé a intentarlo.';

// Solo se intercambian metadatos publicos o vinculos del usuario autenticado.
const request = async <Result>(path: string, post = false): Promise<Result> => {
  const response = await fetch(`/api/auth/oauth${path}`, {
    method: post ? 'POST' : 'GET',
    credentials: 'include',
    ...(post ? { headers: { 'Content-Type': 'application/json' }, body: '{}' } : {})
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.message?.startsWith('oauth_')
        ? oauthMessage(data.message)
        : 'No se pudo consultar el acceso social.'
    );
  return data as Result;
};
export const oauthApi = {
  providers: () => request<{ providers: SocialProvider[] }>('/providers'),
  accounts: () => request<{ accounts: LinkedAccount[] }>('/accounts', true),
  link: (provider: string) =>
    request<{ url: string }>(
      `/${encodeURIComponent(provider)}/link?origin=${encodeURIComponent(window.location.origin)}`,
      true
    ),
  start: (provider: string) =>
    window.location.assign(
      `/api/auth/oauth/${encodeURIComponent(provider)}?origin=${encodeURIComponent(window.location.origin)}`
    )
};
// This file exports: oauthApi, oauthMessage y tipos OAuth.
// It is used by: componentes sociales.
// It imports from: APIs del navegador.
