import type { ReactNode } from 'react';
import './auth.css';

type AuthLayoutProps = {
  children: ReactNode;
};

/**
 * Page d’auth centrée — fond identique à la zone `.os-content` du dashboard.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-os-page">
      <div className="auth-os-page__inner">{children}</div>
    </div>
  );
}
