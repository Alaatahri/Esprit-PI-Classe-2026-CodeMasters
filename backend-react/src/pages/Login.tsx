import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AuthLayout, AuthCard, AuthInput, AuthButton, AuthDivider, AuthFooter } from '../auth';

const REMEMBER_KEY = 'bmp_admin_remember';
const REMEMBER_EMAIL_KEY = 'bmp_admin_remember_email';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const remembered = localStorage.getItem(REMEMBER_KEY) === '1';
    const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (remembered && saved) {
      setRemember(true);
      setEmail(saved);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Email is required.';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email: email.trim(), mot_de_passe: password });
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, '1');
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      pushToast('Signed in successfully.', 'success');
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed.';
      setFormError(msg);
      pushToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFieldErrors({});
    setFormError('');
  };

  return (
    <AuthLayout>
      <AuthCard
        eyebrow="Admin access"
        title="Sign in"
        subtitle={
          <>
            Use your BMP.tn credentials. New to the console?{' '}
            <Link className="auth-os-link" to="/register">
              Create an account
            </Link>
            .
          </>
        }
      >
        <form onSubmit={handleSubmit} noValidate>
          {formError ? (
            <div className="auth-alert" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{formError}</span>
            </div>
          ) : null}

          <AuthInput
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            disabled={loading}
          />

          <AuthInput
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            disabled={loading}
            showPasswordToggle
          />

          <div className="auth-row">
            <label className="auth-checkbox">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={loading} />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() =>
                pushToast('Contact your BMP.tn administrator to reset your password.', 'info')
              }
            >
              Forgot password?
            </button>
          </div>

          <AuthButton loading={loading} disabled={!email.trim() || !password}>
            Sign In
          </AuthButton>
        </form>

        <AuthDivider label="Demo (local)" />

        <AuthFooter
          devQuickFill={
            <>
              <button type="button" className="os-btn os-btn-secondary os-btn-sm" onClick={() => fillDemo('ahmed@example.com', 'password123')}>
                Client
              </button>
              <button type="button" className="os-btn os-btn-secondary os-btn-sm" onClick={() => fillDemo('sara@example.com', 'password123')}>
                Expert
              </button>
              <button type="button" className="os-btn os-btn-secondary os-btn-sm" onClick={() => fillDemo('admin@bmp.tn', 'admin123')}>
                Admin
              </button>
            </>
          }
        />
      </AuthCard>
    </AuthLayout>
  );
}
