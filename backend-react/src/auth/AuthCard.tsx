import type { ReactNode } from 'react';

type AuthCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
};

export function AuthCard({ eyebrow, title, subtitle, children }: AuthCardProps) {
  return (
    <div className="os-card auth-os-card">
      <div className="os-card-body">
        <div className="auth-os-card__brand">
          <div className="os-sidebar-logo-icon">BMP</div>
          <div>
            <div className="auth-os-card__name">BMP.tn</div>
            <div className="auth-os-card__sub">Admin Console</div>
          </div>
        </div>

        {eyebrow ? (
          <p className="os-page-eyebrow auth-os-card__eyebrow-spaced">{eyebrow}</p>
        ) : null}
        <h1 className="auth-os-card__title">{title}</h1>
        {subtitle ? <div className="auth-os-card__subtitle">{subtitle}</div> : null}

        {children}
      </div>
    </div>
  );
}
