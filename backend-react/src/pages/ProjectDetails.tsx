import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import projectService, { Project } from '../services/projectService';
import suiviProjectService, { SuiviProjectEntry } from '../services/suiviProjectService';
import { useAuth } from '../contexts/AuthContext';
import './ProjectDetails.css';

const ProjectDetails = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [suivis, setSuivis] = useState<SuiviProjectEntry[]>([]);
  const [suiviLoading, setSuiviLoading] = useState(false);
  const [suiviError, setSuiviError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setSuiviLoading(true);
      setSuiviError(null);
      try {
        const res = await suiviProjectService.getByProjectId(id);
        if (!cancelled) {
          const list = Array.isArray(res.data) ? res.data : [];
          setSuivis(
            [...list].sort((a, b) => {
              const ta = new Date(a.date_suivi || a.createdAt || 0).getTime();
              const tb = new Date(b.date_suivi || b.createdAt || 0).getTime();
              return tb - ta;
            }),
          );
        }
      } catch (e) {
        if (!cancelled) {
          setSuiviError('Impossible de charger le journal de suivi.');
          setSuivis([]);
        }
      } finally {
        if (!cancelled) setSuiviLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

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

  if (
    user?.role === 'client' &&
    user._id &&
    String(project.clientId) !== String(user._id)
  ) {
    return (
      <div className="error-state">
        <p>Accès refusé : ce projet n’est pas associé à votre compte client.</p>
        <Link to="/projects" className="btn btn-secondary">
          Retour à mes projets
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

        <div className="details-section suivi-section">
          <h2>Journal de suivi (suiviprojects)</h2>
          <p className="suivi-intro">
            Historique des points de contrôle : pourcentage, description, photo et coût actuel
            tel que stocké en base.
          </p>
          {suiviLoading && <p className="suivi-muted">Chargement du suivi…</p>}
          {suiviError && <p className="suivi-error">{suiviError}</p>}
          {!suiviLoading && !suiviError && suivis.length === 0 && (
            <p className="suivi-muted">Aucune entrée de suivi pour ce projet.</p>
          )}
          {!suiviLoading && suivis.length > 0 && (
            <div className="suivi-table-wrap">
              <table className="suivi-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>%</th>
                    <th>Description</th>
                    <th>Coût</th>
                    <th>Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {suivis.map((s) => {
                    const pct =
                      typeof s.progressPercent === 'number'
                        ? s.progressPercent
                        : s.pourcentage_avancement;
                    const photo = s.photoUrl || s.photo_url;
                    return (
                      <tr key={s._id}>
                        <td>
                          {s.date_suivi
                            ? new Date(s.date_suivi).toLocaleString('fr-FR')
                            : '-'}
                        </td>
                        <td>
                          <strong>{pct ?? '-'}%</strong>
                          {typeof s.progressIndex === 'number' && (
                            <span className="suivi-index"> #{s.progressIndex}</span>
                          )}
                        </td>
                        <td className="suivi-desc">{s.description_progression}</td>
                        <td>
                          {typeof s.cout_actuel === 'number'
                            ? `${s.cout_actuel.toLocaleString('fr-FR')} TND`
                            : '-'}
                        </td>
                        <td>
                          {photo ? (
                            <a href={photo} target="_blank" rel="noopener noreferrer" className="suivi-photo-link">
                              Voir
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
