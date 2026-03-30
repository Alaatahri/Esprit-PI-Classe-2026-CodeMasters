import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Tentative de connexion avec:', { email, password });
      await login({ email, mot_de_passe: password });
      console.log('Connexion réussie, redirection...');
      navigate('/');
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">B</div>
          </div>
          <h1>BMP.tn</h1>
          <p>Plateforme de Gestion</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <>
                <span className="loading-spinner-small"></span>
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Comptes de test disponibles :</p>
          <div className="test-accounts">
            <button 
              type="button"
              className="test-account-btn"
              onClick={() => {
                setEmail('ahmed@example.com');
                setPassword('password123');
              }}
            >
              Client
            </button>
            <button 
              type="button"
              className="test-account-btn"
              onClick={() => {
                setEmail('sara@example.com');
                setPassword('password123');
              }}
            >
              Expert
            </button>
            <button 
              type="button"
              className="test-account-btn"
              onClick={() => {
                setEmail('admin@bmp.tn');
                setPassword('admin123');
              }}
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
