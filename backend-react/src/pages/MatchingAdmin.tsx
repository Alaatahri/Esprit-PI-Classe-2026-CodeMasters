import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import projectService, { Project } from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';
import './MatchingAdmin.css';

type TriggerResult = {
  complexity: 'simple' | 'medium' | 'complex';
  requiredCompetences: string[];
  matchedExperts: Array<{
    _id: string;
    prenom?: string;
    nom: string;
    score: number;
    competences?: string[];
  }>;
};

type MatchingRequestRow = {
  _id: string;
  status: 'pending' | 'accepted' | 'refused';
  isExpired?: boolean;
  matchScore?: number;
  requiredCompetences?: string[];
  sentAt?: string;
  expertId?: any;
  projectId?: any;
};

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '...' : s);

const getComplexityClass = (c: string) => {
  if (c === 'simple') return 'badge-simple';
  if (c === 'medium') return 'badge-medium';
  if (c === 'complex') return 'badge-complex';
  return 'badge-simple';
};

const getStatusClass = (s: string) => {
  if (s === 'accepted') return 'status-accepted';
  if (s === 'refused') return 'status-refused';
  return 'status-pending';
};

const getStatusLabel = (status: string, isExpired?: boolean) => {
  if (status === 'pending') return isExpired ? 'Refusé (expiré)' : 'En cours';
  if (status === 'accepted') return 'Accepté';
  if (status === 'refused') return 'Refusé';
  return status;
};

const MatchingAdmin = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [requests, setRequests] = useState<MatchingRequestRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState<Record<string, boolean>>({});
  const [triggerResults, setTriggerResults] = useState<Record<string, TriggerResult>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const matchedProjectIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of requests) {
      const pid = r?.projectId?._id?.toString?.() ?? r?.projectId?.toString?.();
      if (!pid) continue;
      if (r.status === 'pending' && !r.isExpired) ids.add(pid);
    }
    return ids;
  }, [requests]);

  useEffect(() => {
    loadProjects();
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await projectService.getAll();
      setProjects(res.data || []);
    } catch (e) {
      console.error('Error loading projects:', e);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await api.get<MatchingRequestRow[]>('/admin/matching/requests');
      setRequests(res.data || []);
    } catch (e) {
      console.error('Error loading matching requests:', e);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const trigger = async (projectId?: string) => {
    if (!projectId) return;
    setErrors((prev) => ({ ...prev, [projectId]: '' }));
    setTriggerLoading((prev) => ({ ...prev, [projectId]: true }));
    try {
      const res = await api.post<TriggerResult>(`/admin/matching/trigger/${projectId}`);
      setTriggerResults((prev) => ({ ...prev, [projectId]: res.data }));
      await loadRequests();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erreur lors du matching';
      setErrors((prev) => ({ ...prev, [projectId]: msg }));
    } finally {
      setTriggerLoading((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="matching-admin">
        <div className="page-header">
          <h1>Matching IA</h1>
        </div>
        <div className="empty-state">
          <p>Accès réservé à l’administrateur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="matching-admin">
      <div className="page-header">
        <h1>Matching IA</h1>
      </div>

      <section className="matching-section">
        <h2>Lancer le Matching</h2>

        {loadingProjects ? (
          <div className="loading">Chargement des projets...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <p>Aucun projet trouvé.</p>
          </div>
        ) : (
          <div className="project-cards">
            {projects.map((p) => {
              const pid = p._id || '';
              const disabled = matchedProjectIds.has(pid);
              const isLoading = !!triggerLoading[pid];
              const result = triggerResults[pid];
              const err = errors[pid];

              return (
                <div key={pid} className="project-card">
                  <div className="project-card-top">
                    <div>
                      <h3 className="project-title">{p.titre}</h3>
                      <p className="project-desc">{truncate(p.description || '', 100)}</p>
                    </div>
                    <button
                      className={`btn btn-primary ${disabled ? 'btn-disabled' : ''}`}
                      disabled={disabled || isLoading}
                      onClick={() => trigger(pid)}
                    >
                      {isLoading ? (
                        <span className="btn-inline-loading">
                          <span className="loading-spinner"></span>
                          <span>Analyse...</span>
                        </span>
                      ) : disabled ? (
                        'Invitation en cours'
                      ) : (
                        'Lancer le Matching IA'
                      )}
                    </button>
                  </div>

                  {err && <div className="inline-error">{err}</div>}

                  {result && (
                    <div className="result-box">
                      <div className="result-row">
                        <span className={`complexity-badge ${getComplexityClass(result.complexity)}`}>
                          {result.complexity}
                        </span>
                        <div className="tags">
                          {(result.requiredCompetences || []).map((c) => (
                            <span key={c} className="tag">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="experts">
                        <h4>Experts matchés</h4>
                        {result.matchedExperts?.length ? (
                          result.matchedExperts.map((ex) => (
                            <div key={ex._id} className="expert-row">
                              <div className="expert-main">
                                <span className="expert-name">
                                  {ex.prenom ? `${ex.prenom} ${ex.nom}` : ex.nom}
                                </span>
                                <span className="expert-score">{ex.score}/100</span>
                              </div>
                              <div className="tags small">
                                {(ex.competences || []).map((c) => (
                                  <span key={c} className="tag small">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="muted">Aucun expert correspondant.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="matching-section">
        <h2>Demandes de Matching envoyées</h2>

        {loadingRequests ? (
          <div className="loading">Chargement des demandes...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <p>Aucune demande de matching.</p>
          </div>
        ) : (
          <div className="requests-table">
            <table>
              <thead>
                <tr>
                  <th>Expert</th>
                  <th>Projet</th>
                  <th>Score</th>
                  <th>Compétences requises</th>
                  <th>Statut</th>
                  <th>Date d'envoi</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const expertName =
                    r?.expertId?.prenom
                      ? `${r.expertId.prenom} ${r.expertId.nom || ''}`.trim()
                      : r?.expertId?.nom || '-';
                  const projectTitle = r?.projectId?.titre || r?.projectId?.nom || '-';
                  const sentAt = r?.sentAt ? new Date(r.sentAt).toLocaleString('fr-FR') : '-';
                  const score = typeof r?.matchScore === 'number' ? `${r.matchScore}/100` : '-';
                  const reqComps = Array.isArray(r?.requiredCompetences) ? r.requiredCompetences : [];

                  return (
                    <tr key={r._id}>
                      <td>{expertName}</td>
                      <td>{projectTitle}</td>
                      <td>{score}</td>
                      <td>
                        <div className="tags small">
                          {reqComps.map((c) => (
                            <span key={c} className="tag small">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(r.status)}`}>
                          {getStatusLabel(r.status, r.isExpired)}
                        </span>
                      </td>
                      <td>{sentAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default MatchingAdmin;

