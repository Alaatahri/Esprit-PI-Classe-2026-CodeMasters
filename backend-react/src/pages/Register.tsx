import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import userService, { type User } from '../services/userService';
import { AuthLayout, AuthCard, AuthInput, AuthButton, AuthFooter } from '../auth';

const ROLES: { value: User['role']; label: string }[] = [
  { value: 'client', label: 'Client' },
  { value: 'expert', label: 'Expert' },
  { value: 'artisan', label: 'Artisan' },
  { value: 'manufacturer', label: 'Manufacturer' },
];

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<User['role']>('client');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Name is required.';
    if (!email.trim()) next.email = 'Email is required.';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email address.';
    if (!phone.trim()) next.phone = 'Phone is required.';
    else if (phone.trim().length < 6) next.phone = 'Enter a valid phone number.';
    if (!password) next.password = 'Password is required.';
    else if (password.length < 6) next.password = 'Use at least 6 characters.';
    if (password !== confirm) next.confirm = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    setLoading(true);
    try {
      await userService.create({
        nom: name.trim(),
        email: email.trim(),
        mot_de_passe: password,
        role,
        telephone: phone.trim(),
      });
      pushToast('Account created. You can sign in now.', 'success');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      let msg = 'Registration failed.';
      if (data && typeof data === 'object' && 'message' in data) {
        const m = (data as { message: unknown }).message;
        if (Array.isArray(m)) msg = m.map(String).join(' ');
        else if (typeof m === 'string') msg = m;
      } else if (err instanceof Error) msg = err.message;
      pushToast(msg, 'error');
      setErrors({ _form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        eyebrow="Onboarding"
        title="Create account"
        subtitle={
          <>
            Already have access?{' '}
            <Link className="auth-os-link" to="/login">
              Sign in
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} noValidate>
          {errors._form ? (
            <div className="auth-alert" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errors._form}</span>
            </div>
          ) : null}

          <AuthInput
            label="Full name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            disabled={loading}
          />

          <AuthInput
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            disabled={loading}
          />

          <AuthInput
            label="Phone"
            type="tel"
            name="phone"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            disabled={loading}
            placeholder="+216 …"
          />

          <div className="auth-field">
            <div className="auth-field__label-row">
              <label className="auth-field__label" htmlFor="register-role">
                Role
              </label>
            </div>
            <div className="auth-field__wrap">
              <select
                id="register-role"
                name="role"
                className="os-form-input auth-select"
                value={role}
                onChange={(e) => setRole(e.target.value as User['role'])}
                disabled={loading}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <AuthInput
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            disabled={loading}
            showPasswordToggle
          />

          <AuthInput
            label="Confirm password"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
            disabled={loading}
            showPasswordToggle
          />

          <AuthButton loading={loading}>Create Account</AuthButton>
        </form>

        <AuthFooter />
      </AuthCard>
    </AuthLayout>
  );
}
