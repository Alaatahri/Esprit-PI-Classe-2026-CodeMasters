import type { ReactNode } from 'react';

type AuthFooterProps = {
  children?: ReactNode;
  /** Quick-fill chips for local development (login only). */
  devQuickFill?: ReactNode;
};

export function AuthFooter({ children, devQuickFill }: AuthFooterProps) {
  return (
    <footer className="auth-footer">
      {children}
      {import.meta.env.DEV && devQuickFill ? <div className="auth-footer__dev">{devQuickFill}</div> : null}
      <p style={{ marginTop: 14 }}>
        © {new Date().getFullYear()} BMP.tn — Admin console
      </p>
    </footer>
  );
}
