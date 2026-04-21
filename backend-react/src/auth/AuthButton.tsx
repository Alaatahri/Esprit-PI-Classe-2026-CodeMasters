import type { ButtonHTMLAttributes, ReactNode } from 'react';

type AuthButtonProps = {
  loading?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function AuthButton({ loading, children, disabled, type = 'submit', ...rest }: AuthButtonProps) {
  return (
    <button
      type={type}
      className="os-btn os-btn-primary auth-os-btn-full"
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="auth-os-btn-spinner" aria-hidden /> : null}
      {children}
    </button>
  );
}
