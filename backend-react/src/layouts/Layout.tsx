import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CommandPalette from '../components/CommandPalette';

interface LayoutProps { children: ReactNode; }

/* ── Inline SVG Icons ── */
const IcoDash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IcoFolder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoBar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IcoActivity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IcoMonitor = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);
const IcoZap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IcoSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IcoLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IcoChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const NAV_SECTIONS = [
  {
    label: 'Principale',
    items: [
      { path: '/',         label: "Vue d'ensemble", Icon: IcoDash,     exact: true },
      { path: '/projects', label: 'Projets',         Icon: IcoFolder,  exact: false },
      { path: '/users',    label: 'Utilisateurs',    Icon: IcoUsers,   exact: false },
    ],
  },
  {
    label: 'Analyse',
    items: [
      { path: '/analytics', label: 'Analytics',  Icon: IcoBar,      exact: false },
      { path: '/matching',  label: 'Matching',   Icon: IcoZap,      exact: false },
      { path: '/activity',  label: 'Activité',   Icon: IcoActivity, exact: false },
      { path: '/system',    label: 'Système',    Icon: IcoMonitor,  exact: false },
    ],
  },
];

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const isActive = useCallback(
    (path: string, exact: boolean) =>
      exact ? location.pathname === path : location.pathname.startsWith(path),
    [location.pathname]
  );

  // Ctrl+K → command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initial = user?.nom ? user.nom.charAt(0).toUpperCase() : 'A';

  /* page title from route */
  const pageTitle = (() => {
    const p = location.pathname;
    if (p === '/')                return "Vue d'ensemble";
    if (p === '/projects/add')    return 'Nouveau Projet';
    if (p.startsWith('/projects/') && p !== '/projects') return 'Détails du Projet';
    if (p.startsWith('/projects')) return 'Projets';
    if (p.startsWith('/users'))   return 'Utilisateurs';
    if (p.startsWith('/analytics')) return 'Analytics';
    if (p.startsWith('/matching')) return 'Matching Admin';
    if (p.startsWith('/activity')) return 'Journal d\'Activité';
    if (p.startsWith('/system'))  return 'Monitoring Système';
    if (p.startsWith('/profile')) return 'Mon Profil';
    return 'Administration';
  })();

  return (
    <div className={`os-shell${collapsed ? ' os-shell--collapsed' : ''}`}>
      {/* ── Sidebar ── */}
      <aside className={`os-sidebar${collapsed ? ' collapsed' : ''}`}>
        {/* Logo */}
        <div className="os-sidebar-logo">
          <div className="os-sidebar-logo-icon">BMP</div>
          {!collapsed && (
            <div>
              <div className="os-sidebar-logo-name">BMP.tn</div>
              <div className="os-sidebar-logo-sub">Admin Console</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="os-sidebar-nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div className="os-sidebar-section-label">{section.label}</div>
              {section.items.map(({ path, label, Icon, exact }) => (
                <Link
                  key={path}
                  to={path}
                  className={`os-nav-item${isActive(path, exact) ? ' active' : ''}`}
                  title={collapsed ? label : undefined}
                >
                  <Icon />
                  {!collapsed && <span className="os-nav-item-label">{label}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer / collapse */}
        <div className="os-sidebar-footer">
          <button className="os-sidebar-collapse-btn" onClick={() => setCollapsed(v => !v)}>
            {collapsed ? <IcoChevronRight /> : <><IcoChevronLeft /><span>Réduire</span></>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="os-main">
        {/* Topbar */}
        <header className="os-topbar">
          <span className="os-topbar-title">{pageTitle}</span>

          {/* Search → palette */}
          <button className="os-topbar-search" onClick={() => setPaletteOpen(true)}>
            <IcoSearch />
            <span className="os-topbar-search-text">Rechercher…</span>
            <span className="os-topbar-search-kbd">⌘K</span>
          </button>

          <div className="os-topbar-actions">
            <button className="os-topbar-icon-btn" title="Notifications">
              <IcoBell />
              <span className="os-topbar-notif-dot" />
            </button>
            <button className="os-topbar-avatar" title={user?.nom ?? 'Utilisateur'}>
              {initial}
            </button>
            <button className="os-topbar-icon-btn" onClick={handleLogout} title="Déconnexion">
              <IcoLogout />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="os-content">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
};

export default Layout;
