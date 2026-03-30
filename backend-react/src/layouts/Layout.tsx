import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isFieldWorkerRole } from '../constants/workerRoles';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

// Icônes SVG pour la sidebar
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconProjects = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconMenu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconX = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const IconProfile = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const IconMatching = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      <path d="m4.93 4.93 1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );

  const IconLogout = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );

  const IconWorkers = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M12 11v4M10 13h4" strokeLinecap="round" />
    </svg>
  );

  const IconOffers = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M13 8H7" />
      <path d="M17 12H7" />
    </svg>
  );

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: IconDashboard },
    { path: '/projects', label: 'Projets', icon: IconProjects },
    { path: '/matching', label: 'Matching IA', icon: IconMatching },
    ...(isFieldWorkerRole(user?.role)
      ? [{ path: '/worker/dashboard', label: 'Mes offres projet', icon: IconOffers }]
      : []),
    { path: '/workers', label: 'Travailleurs', icon: IconWorkers },
    { path: '/users', label: 'Utilisateurs', icon: IconUsers },
    { path: '/profile', label: 'Mon Profil', icon: IconProfile },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-fullscreen">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">B</div>
            {sidebarOpen && (
              <div className="brand-text">
                <h1>BMP.tn</h1>
                <span>Admin Panel</span>
              </div>
            )}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    className={`nav-item ${active ? 'active' : ''}`}
                    title={sidebarOpen ? '' : item.label}
                  >
                    <span className="nav-icon">
                      <Icon />
                    </span>
                    {sidebarOpen && <span className="nav-label">{item.label}</span>}
                    {active && <span className="nav-indicator"></span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {sidebarOpen && (
          <div className="sidebar-footer">
            <div className="sidebar-footer-content">
              <div className="footer-icon">B</div>
              <div className="footer-text">
                <p className="footer-title">BMP.tn Platform</p>
                <p className="footer-subtitle">Version 1.0.0</p>
              </div>
            </div>
            <button 
              className="sidebar-logout"
              onClick={handleLogout}
              title="Déconnexion"
            >
              <IconLogout />
              <span>Déconnexion</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        <header className="top-header">
          <div className="header-content">
            <h2 className="page-title">
              {location.pathname === '/' && 'Tableau de Bord'}
              {location.pathname.startsWith('/projects') && location.pathname !== '/projects/add' && 'Gestion des Projets'}
              {location.pathname === '/projects/add' && 'Nouveau Projet'}
              {location.pathname.startsWith('/projects/') && !location.pathname.includes('/add') && 'Détails du Projet'}
              {location.pathname === '/users' && 'Gestion des Utilisateurs'}
              {location.pathname.startsWith('/worker/dashboard') && 'Mes offres projet'}
              {location.pathname === '/profile' && 'Mon Profil'}
            </h2>
            <div className="header-actions">
              <Link to="/profile" className="user-profile">
                <div className="profile-avatar">
                  {user?.nom?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="profile-info">
                  <span className="profile-name">{user?.nom || 'Utilisateur'}</span>
                  <span className="profile-role">{user?.role || 'Utilisateur'}</span>
                </div>
              </Link>
              <button className="logout-button" onClick={handleLogout} title="Déconnexion">
                <IconLogout />
              </button>
            </div>
          </div>
        </header>

        <main className="main-content-fullscreen">
          {children}
        </main>
      </div>

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
