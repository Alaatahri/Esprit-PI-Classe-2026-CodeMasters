import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import projectService, { Project } from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';
import './ProjectsList.css';

function isSameId(a: string | undefined, b: string | undefined) {
  if (!a || !b) return false;
  return String(a) === String(b);
}

const ProjectsList = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const visibleProjects = useMemo(() => {
    if (user?.role === 'client' && user._id) {
      return projects.filter((p) => isSameId(p.clientId, user._id));
    }
    return projects;
  }, [projects, user]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'En attente':
        return '#f39c12';
      case 'En cours':
        return '#3498db';
      case 'Terminé':
        return '#27ae60';
      default:
        return '#7f8c8d';
    }
  };

  if (loading) {
    return <div className="loading">Chargement des projets...</div>;
  }

  const isClient = user?.role === 'client';

  return (
    <div className="projects-list">
      <div className="page-header">
        <div>
          <h1>{isClient ? 'Mes projets' : 'Liste des Projets'}</h1>
          {isClient && (
            <p className="page-subtitle-client">
              Projets dont vous êtes le client — avancement global affiché pour chaque chantier.
            </p>
          )}
        </div>
        <Link to="/projects/add" className="btn btn-primary">
          + Ajouter un Projet
        </Link>
      </div>

      {visibleProjects.length === 0 ? (
        <div className="empty-state">
          <p>
            {isClient
              ? 'Vous n’avez aucun projet associé à votre compte pour le moment.'
              : 'Aucun projet trouvé.'}
          </p>
          <Link to="/projects/add" className="btn btn-primary">
            Créer le premier projet
          </Link>
        </div>
      ) : (
        <div className="projects-table">
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Description</th>
                <th>Date Début</th>
                <th>Date Fin Prévue</th>
                <th>Budget</th>
                <th>Statut</th>
                <th>Avancement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProjects.map((project) => (
                <tr key={project._id}>
                  <td>{project.titre}</td>
                  <td className="description-cell">
                    {project.description.substring(0, 50)}...
                  </td>
                  <td>{new Date(project.date_debut).toLocaleDateString('fr-FR')}</td>
                  <td>{new Date(project.date_fin_prevue).toLocaleDateString('fr-FR')}</td>
                  <td>{project.budget_estime.toLocaleString('fr-FR')} TND</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(project.statut) }}
                    >
                      {project.statut}
                    </span>
                  </td>
                  <td>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${project.avancement_global}%` }}
                      />
                      <span className="progress-text">{project.avancement_global}%</span>
                    </div>
                  </td>
                  <td>
                    <Link 
                      to={`/projects/${project._id}`}
                      className="btn-link"
                    >
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
