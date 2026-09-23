/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: mostrar mensajes OAuth sin reflejar texto externo.
 */
import { useEffect, useState } from 'react';
import { oauthMessage } from '../services/oauth';
import { StatusMessage } from './StatusMessage';

export const OAuthFeedback = () => {
  const [code] = useState(() => new URLSearchParams(window.location.search).get('error') ?? '');
  useEffect(() => {
    if (!code.startsWith('oauth_')) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('error');
    window.history.replaceState(window.history.state, '', url);
  }, [code]);
  if (!code.startsWith('oauth_')) return null;
  return (
    <StatusMessage kind={code === 'oauth_verification_required' ? 'info' : 'error'}>
      {oauthMessage(code)}
    </StatusMessage>
  );
};
// This file exports: OAuthFeedback.
// It is used by: login y perfil.
// It imports from: React, servicio OAuth y StatusMessage.
