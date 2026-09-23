type Props = {
  kind: 'success' | 'error' | 'info';
  children: string;
};

export const StatusMessage = ({ kind, children }: Props) => (
  <p className={`status status--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
    {children}
  </p>
);

// Este archivo exporta: StatusMessage.
// Se usa en: páginas y formularios.
// Importa de: ninguna dependencia externa.
