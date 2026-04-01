import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import type { Project } from '../services/projectService';
import type { User } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

// Icônes SVG simples
const IconProject = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconUsers = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconTrending = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconDollar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconClock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconActivity = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const visibleProjects = useMemo(() => {
    if (user?.role === 'client' && user._id) {
      return projects.filter((p) => String(p.clientId) === String(user._id));
    }
    return projects;
  }, [projects, user]);

  const stats = useMemo(() => {
    const list = visibleProjects;
    return {
      totalProjects: list.length,
      projectsEnAttente: list.filter((p) => p.statut === 'En attente').length,
      projectsEnCours: list.filter((p) => p.statut === 'En cours').length,
      projectsTermines: list.filter((p) => p.statut === 'Terminé').length,
      totalUsers: users.length,
      totalBudget: list.reduce((sum, p) => sum + (p.budget_estime || 0), 0),
      avancementMoyen:
        list.length > 0
          ? Math.round(
              list.reduce((sum, p) => sum + (p.avancement_global || 0), 0) /
                list.length,
            )
          : 0,
      usersByRole: {
        client: users.filter((u) => u.role === 'client').length,
        expert: users.filter((u) => u.role === 'expert').length,
        artisan: users.filter((u) => u.role === 'artisan').length,
        manufacturer: users.filter((u) => u.role === 'manufacturer').length,
        admin: users.filter((u) => u.role === 'admin').length,
      },
    };
  }, [visibleProjects, users]);

  const loadData = async () => {
    try {
      const { projects: p, users: u } = await dashboardService.getData();
      setProjects(p || []);
      setUsers(u || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isClient = user?.role === 'client';

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-modern">
      <div className="dashboard-header">
        <div>
          <h1>Tableau de Bord</h1>
          <p className="dashboard-subtitle">
            {isClient
              ? 'Vue de vos projets et de leur avancement (BMP.tn)'
              : "Vue d'ensemble de votre plateforme BMP.tn"}
          </p>
        </div>
        <div className="header-actions">
          <Link to="/projects/add" className="btn-primary-modern">
            <IconProject />
            <span>Nouveau Projet</span>
          </Link>
        </div>
      </div>
      
      <div className="stats-grid-modern">
        <div className="stat-card-modern stat-primary">
          <div className="stat-icon-wrapper">
            <IconProject />
          </div>
          <div className="stat-content">
            <h3>Total Projets</h3>
            <p className="stat-number-modern">{stats.totalProjects}</p>
            <p className="stat-change positive">+{stats.projectsEnCours} actifs</p>
          </div>
        </div>

        <div className="stat-card-modern stat-warning">
          <div className="stat-icon-wrapper">
            <IconClock />
          </div>
          <div className="stat-content">
            <h3>En Attente</h3>
            <p className="stat-number-modern">{stats.projectsEnAttente}</p>
            <p className="stat-change">En attente de démarrage</p>
          </div>
        </div>

        <div className="stat-card-modern stat-info">
          <div className="stat-icon-wrapper">
            <IconActivity />
          </div>
          <div className="stat-content">
            <h3>En Cours</h3>
            <p className="stat-number-modern">{stats.projectsEnCours}</p>
            <p className="stat-change positive">Projets actifs</p>
          </div>
        </div>

        <div className="stat-card-modern stat-success">
          <div className="stat-icon-wrapper">
            <IconCheckCircle />
          </div>
          <div className="stat-content">
            <h3>Terminés</h3>
            <p className="stat-number-modern">{stats.projectsTermines}</p>
            <p className="stat-change positive">Complétés</p>
          </div>
        </div>

        <div className="stat-card-modern stat-purple">
          <div className="stat-icon-wrapper">
            <IconDollar />
          </div>
          <div className="stat-content">
            <h3>Budget Total</h3>
            <p className="stat-number-modern">{stats.totalBudget.toLocaleString('fr-FR')}</p>
            <p className="stat-change">TND</p>
          </div>
        </div>

        <div className="stat-card-modern stat-gradient">
          <div className="stat-icon-wrapper">
            <IconTrending />
          </div>
          <div className="stat-content">
            <h3>Avancement</h3>
            <p className="stat-number-modern">{stats.avancementMoyen}%</p>
            <div className="mini-progress">
              <div className="mini-progress-bar" style={{ width: `${stats.avancementMoyen}%` }}></div>
            </div>
          </div>
        </div>

        {!isClient && (
          <>
            <div className="stat-card-modern stat-blue">
              <div className="stat-icon-wrapper">
                <IconUsers />
              </div>
              <div className="stat-content">
                <h3>Utilisateurs</h3>
                <p className="stat-number-modern">{stats.totalUsers}</p>
                <p className="stat-change">Inscrits</p>
              </div>
            </div>

            <div className="stat-card-modern stat-users">
              <div className="stat-content-full">
                <h3>Répartition Utilisateurs</h3>
                <div className="users-breakdown-modern">
                  {stats.usersByRole.client > 0 && (
                    <div className="role-item">
                      <span className="role-dot role-client"></span>
                      <span className="role-text">{stats.usersByRole.client} Clients</span>
                    </div>
                  )}
                  {stats.usersByRole.expert > 0 && (
                    <div className="role-item">
                      <span className="role-dot role-expert"></span>
                      <span className="role-text">{stats.usersByRole.expert} Experts</span>
                    </div>
                  )}
                  {stats.usersByRole.artisan > 0 && (
                    <div className="role-item">
                      <span className="role-dot role-artisan"></span>
                      <span className="role-text">{stats.usersByRole.artisan} Artisans</span>
                    </div>
                  )}
                  {stats.usersByRole.manufacturer > 0 && (
                    <div className="role-item">
                      <span className="role-dot role-manufacturer"></span>
                      <span className="role-text">{stats.usersByRole.manufacturer} Fabricants</span>
                    </div>
                  )}
                  {stats.usersByRole.admin > 0 && (
                    <div className="role-item">
                      <span className="role-dot role-admin"></span>
                      <span className="role-text">{stats.usersByRole.admin} Admins</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-content-modern">
        <div className="projects-section-modern">
          <div className="section-header-modern">
            <div>
              <h2>{isClient ? 'Mes projets récents' : 'Projets Récents'}</h2>
              <p className="section-subtitle">
                {isClient
                  ? 'Vos chantiers et leur avancement'
                  : 'Derniers projets ajoutés à la plateforme'}
              </p>
            </div>
            <Link to="/projects" className="btn-link-modern">
              Voir tout <span>→</span>
            </Link>
          </div>
          {visibleProjects.length === 0 ? (
            <div className="empty-state-modern">
              <IconProject />
              <h3>Aucun projet pour le moment</h3>
              <p>
                {isClient
                  ? 'Aucun projet associé à votre compte.'
                  : 'Commencez par créer votre premier projet'}
              </p>
              <Link to="/projects/add" className="btn-primary-modern">
                Créer un projet
              </Link>
            </div>
          ) : (
            <div className="projects-grid-modern">
              {visibleProjects.slice(0, 6).map((project, index) => (
                <div 
                  key={project._id} 
                  className="project-card-modern"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="project-card-header-modern">
                    <div className="project-title-section">
                      <h3>{project.titre}</h3>
                      <span className={`status-badge-modern status-${project.statut.toLowerCase().replace(' ', '-')}`}>
                        {project.statut}
                      </span>
                    </div>
                  </div>
                  <p className="project-description-modern">
                    {project.description.length > 100 
                      ? project.description.substring(0, 100) + '...' 
                      : project.description}
                  </p>
                  <div className="project-stats-modern">
                    <div className="project-stat-item">
                      <span className="stat-label-modern">Budget</span>
                      <span className="stat-value-modern">{project.budget_estime.toLocaleString('fr-FR')} TND</span>
                    </div>
                    <div className="project-stat-item">
                      <span className="stat-label-modern">Début</span>
                      <span className="stat-value-modern">
                        {new Date(project.date_debut).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="project-progress-modern">
                    <div className="progress-header">
                      <span>Avancement</span>
                      <span className="progress-percentage">{project.avancement_global}%</span>
                    </div>
                    <div className="progress-bar-modern">
                      <div 
                        className="progress-fill-modern"
                        style={{ width: `${project.avancement_global}%` }}
                      />
                    </div>
                  </div>
                  <Link to={`/projects/${project._id}`} className="project-link-modern">
                    Voir les détails <span>→</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isClient && (
          <div className="users-section-modern">
            <div className="section-header-modern">
              <div>
                <h2>Utilisateurs Actifs</h2>
                <p className="section-subtitle">Membres récemment inscrits</p>
              </div>
              <Link to="/users" className="btn-link-modern">
                Voir tout <span>→</span>
              </Link>
            </div>
            {users.length === 0 ? (
              <div className="empty-state-modern">
                <IconUsers />
                <h3>Aucun utilisateur</h3>
                <p>Les utilisateurs apparaîtront ici</p>
              </div>
            ) : (
              <div className="users-list-modern">
                {users.slice(0, 5).map((u, index) => (
                  <div
                    key={u._id}
                    className="user-card-modern"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="user-avatar-modern">
                      {u.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details-modern">
                      <h4>{u.nom}</h4>
                      <p className="user-email-modern">{u.email}</p>
                      <span className={`role-badge-modern role-${u.role}`}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
