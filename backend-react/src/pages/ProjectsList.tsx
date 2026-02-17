import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import projectService, { Project } from '../services/projectService';
import './ProjectsList.css';

const ProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="projects-list">
      <div className="page-header">
        <h1>Liste des Projets</h1>
        <Link to="/projects/add" className="btn btn-primary">
          + Ajouter un Projet
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <p>Aucun projet trouvé.</p>
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
              {projects.map((project) => (
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
