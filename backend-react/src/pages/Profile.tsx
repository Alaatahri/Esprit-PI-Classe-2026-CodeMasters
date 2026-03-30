import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import userService, { User } from '../services/userService';
import './Profile.css';

const Profile = () => {
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    loadUser();
  }, [currentUser]);

  const loadUser = async () => {
    if (!currentUser?._id) return;
    
    try {
      const response = await userService.getById(currentUser._id);
      setUser(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    try {
      await updateUser(formData);
      await loadUser();
      setEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      client: '#10b981',
      expert: '#3b82f6',
      artisan: '#8b5cf6',
      manufacturer: '#f59e0b',
      admin: '#ef4444',
    };
    return colors[role] || '#64748b';
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (!user) {
    return <div className="profile-error">Utilisateur non trouvé</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {user.nom.charAt(0).toUpperCase()}
        </div>
        <div className="profile-header-info">
          <h1>{user.nom}</h1>
          <span 
            className="profile-role-badge"
            style={{ backgroundColor: getRoleColor(user.role) + '20', color: getRoleColor(user.role) }}
          >
            {user.role}
          </span>
        </div>
        <button 
          className="edit-button"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Annuler' : 'Modifier'}
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Informations Personnelles</h2>
          {editing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rôle</label>
                  <input
                    type="text"
                    value={user.role}
                    disabled
                    className="disabled-input"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">
                  Enregistrer
                </button>
              </div>
            </form>
          ) : (
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Nom</span>
                <span className="info-value">{user.nom}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{user.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Téléphone</span>
                <span className="info-value">{user.telephone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Rôle</span>
                <span 
                  className="info-value role-badge"
                  style={{ backgroundColor: getRoleColor(user.role) + '20', color: getRoleColor(user.role) }}
                >
                  {user.role}
                </span>
              </div>
              {user.createdAt && (
                <div className="info-item">
                  <span className="info-label">Membre depuis</span>
                  <span className="info-value">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2>Statistiques</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <span className="stat-label">Projets</span>
                <span className="stat-number">-</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <span className="stat-label">Complétés</span>
                <span className="stat-number">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
