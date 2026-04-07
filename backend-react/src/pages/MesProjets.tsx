import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import projectService, { Project } from '../services/projectService';
import { uploadSuiviPhoto } from '../services/suiviPhotoService';
import { useAuth } from '../contexts/AuthContext';
import { fileToBase64 } from '../utils/imageUtils';
import './MesProjets.css';

function clampPct(n: unknown) {
  const x = Number(n ?? 0);
  if (!Number.isFinite(x)) return 0;
  return Math.min(100, Math.max(0, x));
}

/**
 * Chantiers assignés à l’utilisateur (artisan ou expert) avec envoi de photo
 * et analyse IA via l’API Nest existante.
 */
const MesProjets = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploadProjectId, setUploadProjectId] = useState<string | null>(null);
  const [fileByProject, setFileByProject] = useState<Record<string, File | null>>({});
  const [commentByProject, setCommentByProject] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [feedbackByProject, setFeedbackByProject] = useState<
    Record<
      string,
      | { ok: boolean; text: string; hasDelay?: boolean; percent?: number }
      | undefined
    >
  >({});

  const load = useCallback(async () => {
    if (!user?._id) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (user.role === 'artisan') {
        const res = await projectService.getAcceptedByArtisan(user._id);
        setProjects(Array.isArray(res.data) ? res.data : []);
      } else if (user.role === 'expert') {
        const res = await api.get<Project[]>('/projects');
        const all = Array.isArray(res.data) ? res.data : [];
        setProjects(
          all.filter((p) => String(p.expertId ?? '') === String(user._id)),
        );
      } else {
        setProjects([]);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Impossible de charger vos projets.',
      );
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFile = (projectId: string, file: File | null) => {
    setFileByProject((prev) => ({ ...prev, [projectId]: file }));
    setFeedbackByProject((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  };

  const submitPhoto = async (projectId: string) => {
    const file = fileByProject[projectId];
    if (!file || !user?._id) {
      setFeedbackByProject((prev) => ({
        ...prev,
        [projectId]: { ok: false, text: 'Choisissez une image.' },
      }));
      return;
    }

    setSubmittingId(projectId);
    setFeedbackByProject((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });

    try {
      const photoBase64 = await fileToBase64(file);
      const photoUrl = `backoffice-upload-${Date.now()}`;
      const { data } = await uploadSuiviPhoto({
        projectId,
        workerId: user._id,
        photoUrl,
        photoBase64,
      });
      const comment = commentByProject[projectId]?.trim();
      if (comment) {
        console.log('[MesProjets] commentaire (non persisté par l’API actuelle):', comment);
      }

      const pct = data?.ai?.percent;
      const reason = data?.ai?.reason;
      const hasDelay = data?.ai?.hasDelay === true;
      const lines: string[] = ['Photo envoyée.'];
      if (typeof pct === 'number' && Number.isFinite(pct)) {
        lines.push(`Avancement projet : ${Math.round(pct)}%.`);
      }
      if (reason) lines.push(reason);
      if (hasDelay) {
        lines.push(
          'Retard ou perturbation signalé : le client et les admins ont été notifiés.',
        );
      }

      setFeedbackByProject((prev) => ({
        ...prev,
        [projectId]: {
          ok: true,
          text: lines.join(' '),
          hasDelay,
          percent: typeof pct === 'number' ? pct : undefined,
        },
      }));
      setFileByProject((prev) => ({ ...prev, [projectId]: null }));
      setCommentByProject((prev) => ({ ...prev, [projectId]: '' }));
      await load();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string | string[] } } }).response?.data
              ?.message
          : undefined;
      const text = Array.isArray(msg)
        ? msg.join(' ')
        : typeof msg === 'string'
          ? msg
          : e instanceof Error
            ? e.message
            : 'Erreur envoi';
      setFeedbackByProject((prev) => ({
        ...prev,
        [projectId]: { ok: false, text },
      }));
    } finally {
      setSubmittingId(null);
    }
  };

  if (!user || (user.role !== 'artisan' && user.role !== 'expert')) {
    return (
      <div className="mes-projets-page">
        <p className="mes-projets-muted">
          Cette page est réservée aux artisans et experts assignés à des chantiers.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mes-projets-page">
        <div className="loading">Chargement de vos projets…</div>
      </div>
    );
  }

  return (
    <div className="mes-projets-page">
      <div className="mes-projets-header">
        <div>
          <h1>Mes projets</h1>
          <p className="mes-projets-sub">
            Projets qui vous sont assignés : envoyez une photo du chantier pour
            analyse IA et mise à jour du taux d’avancement. Le serveur notifie
            automatiquement le client, les administrateurs et les artisans du
            chantier (journal structuré).
          </p>
        </div>
      </div>

      {error && <div className="mes-projets-error">{error}</div>}

      {projects.length === 0 ? (
        <div className="mes-projets-empty">
          <p>Aucun projet assigné pour le moment.</p>
        </div>
      ) : (
        <div className="mes-projets-grid">
          {projects.map((p) => (
            <article key={p._id} className="mes-projets-card">
              <div className="mes-projets-card-head">
                <h2>{p.titre}</h2>
                <span
                  className="mes-projets-status"
                  data-status={p.statut === 'En cours' ? 'progress' : 'other'}
                >
                  {p.statut}
                </span>
              </div>
              <p className="mes-projets-desc">{p.description}</p>
              <div className="mes-projets-progress-wrap">
                <div className="mes-projets-progress-label">
                  <span>Avancement global</span>
                  <span>{clampPct(p.avancement_global)}%</span>
                </div>
                <div className="mes-projets-bar">
                  <div
                    style={{ width: `${clampPct(p.avancement_global)}%` }}
                    className="mes-projets-bar-fill"
                  />
                </div>
              </div>
              <div className="mes-projets-actions">
                <Link to={`/projects/${p._id}`} className="mes-projets-link">
                  Voir la fiche projet
                </Link>
                <button
                  type="button"
                  className="mes-projets-btn-photo"
                  onClick={() =>
                    setUploadProjectId((id) => (id === p._id ? null : p._id ?? null))
                  }
                >
                  📷 Envoyer une photo du chantier
                </button>
              </div>

              {uploadProjectId === p._id && (
                <div className="mes-projets-upload">
                  <label className="mes-projets-file">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFile(p._id!, e.target.files?.[0] ?? null)
                      }
                    />
                    <span>Choisir une image</span>
                  </label>
                  {fileByProject[p._id!] && (
                    <span className="mes-projets-filename">
                      {fileByProject[p._id!]!.name}
                    </span>
                  )}
                  <textarea
                    rows={2}
                    placeholder="Commentaire (optionnel)"
                    value={commentByProject[p._id!] ?? ''}
                    onChange={(e) =>
                      setCommentByProject((prev) => ({
                        ...prev,
                        [p._id!]: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="mes-projets-submit"
                    disabled={submittingId === p._id}
                    onClick={() => void submitPhoto(p._id!)}
                  >
                    {submittingId === p._id ? 'Analyse en cours…' : 'Envoyer et analyser'}
                  </button>
                  {feedbackByProject[p._id!] && (
                    <p
                      className={
                        feedbackByProject[p._id!]!.ok
                          ? feedbackByProject[p._id!]!.hasDelay
                            ? 'mes-projets-feedback ok warn'
                            : 'mes-projets-feedback ok'
                          : 'mes-projets-feedback err'
                      }
                    >
                      {feedbackByProject[p._id!]!.text}
                    </p>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default MesProjets;
