import { useId, useState, type InputHTMLAttributes } from 'react';

type AuthInputProps = {
  label: string;
  hint?: string;
  error?: string;
  showPasswordToggle?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>;

export function AuthInput({
  label,
  hint,
  error,
  id: idProp,
  type = 'text',
  showPasswordToggle,
  disabled,
  ...rest
}: AuthInputProps) {
  const genId = useId();
  const id = idProp ?? `auth-field-${genId}`;
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword && showPasswordToggle && visible ? 'text' : type;

  const inputClass = [
    'os-form-input',
    error ? 'os-form-input--error' : '',
    isPassword && showPasswordToggle ? 'auth-field__input--with-toggle' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="auth-field">
      <div className="auth-field__label-row">
        <label className="auth-field__label" htmlFor={id}>
          {label}
        </label>
        {hint ? <span className="auth-field__hint">{hint}</span> : null}
      </div>
      <div className="auth-field__wrap">
        <input
          id={id}
          type={effectiveType}
          className={inputClass}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          {...rest}
        />
        {isPassword && showPasswordToggle ? (
          <button
            type="button"
            className="auth-field__toggle"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            disabled={disabled}
          >
            {visible ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="auth-field__error" id={`${id}-err`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
