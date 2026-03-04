import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import projectService, { Project } from '../services/projectService';
import './ProjectDetails.css';

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await projectService.getById(id!);
      setProject(response.data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!project) {
    return (
      <div className="error-state">
        <p>Projet non trouvé.</p>
        <Link to="/projects" className="btn btn-secondary">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="project-details">
      <div className="details-header">
        <Link to="/projects" className="back-link">← Retour</Link>
        <h1>{project.titre}</h1>
      </div>

      <div className="details-content">
        <div className="details-section">
          <h2>Informations Générales</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Description</label>
              <p>{project.description}</p>
            </div>
            <div className="info-item">
              <label>Date de Début</label>
              <p>{new Date(project.date_debut).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="info-item">
              <label>Date de Fin Prévue</label>
              <p>{new Date(project.date_fin_prevue).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="info-item">
              <label>Budget Estimé</label>
              <p>{project.budget_estime.toLocaleString('fr-FR')} TND</p>
            </div>
            <div className="info-item">
              <label>Statut</label>
              <span className="status-badge-large">{project.statut}</span>
            </div>
            <div className="info-item">
              <label>Avancement Global</label>
              <div className="progress-container">
                <div className="progress-bar-large">
                  <div 
                    className="progress-fill-large"
                    style={{ width: `${project.avancement_global}%` }}
                  />
                </div>
                <span className="progress-percentage">{project.avancement_global}%</span>
              </div>
            </div>
            <div className="info-item">
              <label>ID Client</label>
              <p>{project.clientId}</p>
            </div>
            {project.expertId && (
              <div className="info-item">
                <label>ID Expert</label>
                <p>{project.expertId}</p>
              </div>
            )}
            {project.createdAt && (
              <div className="info-item">
                <label>Date de Création</label>
                <p>{new Date(project.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
