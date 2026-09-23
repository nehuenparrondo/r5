import type { InputHTMLAttributes } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
};

export const TextField = ({ label, registration, error, id, ...inputProps }: Props) => {
  const inputId = id ?? registration.name;

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        {...registration}
        {...inputProps}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <span className="field-error" id={`${inputId}-error`}>
          {error.message}
        </span>
      )}
    </div>
  );
};

// Este archivo exporta: TextField.
// Se usa en: formularios del sistema.
// Importa de: React y react-hook-form.
