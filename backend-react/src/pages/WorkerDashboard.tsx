import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { isFieldWorkerRole } from '../constants/workerRoles';
import './WorkerDashboard.css';

/** Matching + Socket.io : toujours sur Express (5050) sauf surcharge */
const MATCHING_API =
  (import.meta.env.VITE_MATCHING_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:5050/api';
const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:5050';

interface WorkerProfile {
  _id: string;
  name: string;
  workerType: string;
  specialite?: string;
  rating?: number;
  reviewsCount?: number;
  isAvailable?: boolean;
  activeProjects?: number;
}

interface Breakdown {
  skills?: number;
  reputation?: number;
  location?: number;
  experience?: number;
  availability?: number;
}

interface MatchProject {
  _id: string;
  title: string;
  description?: string;
  projectCategory?: string;
  complexity?: string;
  requiredSkills?: string[];
  budget?: number;
  surface?: number;
  location?: {
    lat?: number;
    lng?: number;
    city?: string;
    gouvernorat?: string;
  };
}

interface MatchInfo {
  score?: number;
  breakdown?: Breakdown;
  explanation?: string;
  status?: string;
  expiresAt?: string;
  timeRemainingMs?: number | null;
}

interface RequestRow {
  project: MatchProject;
  match: MatchInfo;
}

const CATEGORY_LABELS: Record<string, string> = {
  renovation_simple: 'Rénovation simple',
  renovation_complexe: 'Rénovation complexe',
  construction_neuve: 'Construction neuve',
  gros_oeuvre: 'Gros œuvre',
  installation_technique: 'Installation technique',
  amenagement: 'Aménagement',
  expertise_etude: 'Expertise / étude',
};

function formatBudget(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toLocaleString('fr-FR').replace(/,/g, ' ')} TND`;
}

function workerTypeBadgeClass(wt: string) {
  const k = (wt || '').toLowerCase();
  if (k === 'artisan') return 'badge-wt badge-wt--artisan';
  if (k === 'ouvrier') return 'badge-wt badge-wt--ouvrier';
  if (k === 'electricien') return 'badge-wt badge-wt--electricien';
  if (k === 'expert') return 'badge-wt badge-wt--expert';
  if (k === 'architecte') return 'badge-wt badge-wt--architecte';
  return 'badge-wt badge-wt--artisan';
}

function complexityBorderVar(cx: string | undefined) {
  const k = (cx || '').toLowerCase();
  if (k === 'simple') return '#2E6B4F';
  if (k === 'moyen') return '#856404';
  if (k === 'complexe') return '#8B1A1A';
  return '#7C4A3A';
}

function complexityBadgeClass(cx: string | undefined) {
  const k = (cx || '').toLowerCase();
  if (k === 'simple') return 'badge-wt badge-cx--simple';
  if (k === 'moyen') return 'badge-wt badge-cx--moyen';
  if (k === 'complexe') return 'badge-wt badge-cx--complexe';
  return 'badge-wt';
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="worker-dash__stars" aria-label={`${rating.toFixed(1)} sur 5`}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(Math.max(0, empty))}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const r = 44;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" className="wd-ring-wrap">
      <circle cx="56" cy="56" r={r} fill="none" stroke="#ede8e0" strokeWidth="12" />
      <circle
        cx="56"
        cy="56"
        r={r}
        fill="none"
        stroke="#7C4A3A"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 56 56)"
      />
      <text x="56" y="58" textAnchor="middle" dominantBaseline="middle" fontSize="1.35rem" fontWeight="700" fill="#1A0A02">
        {pct.toFixed(0)}%
      </text>
      <text x="56" y="78" textAnchor="middle" fontSize="0.65rem" fill="#666">
        Score IA
      </text>
    </svg>
  );
}

function BreakdownBars({ b }: { b: Breakdown | undefined }) {
  const rows: { label: string; weight: string; val: number; color: string }[] = [
    { label: 'Compétences', weight: '35%', val: b?.skills ?? 0, color: '#7C4A3A' },
    { label: 'Réputation', weight: '25%', val: b?.reputation ?? 0, color: '#B8860B' },
    { label: 'Proximité', weight: '20%', val: b?.location ?? 0, color: '#2E6B4F' },
    { label: 'Expérience', weight: '15%', val: b?.experience ?? 0, color: '#2E4A6B' },
    { label: 'Disponibilité', weight: '5%', val: b?.availability ?? 0, color: '#6B2E6B' },
  ];
  return (
    <div className="wd-bars">
      {rows.map((row) => (
        <div key={row.label} className="wd-bar-row">
          <span className="wd-bar-label">
            {row.label} {row.weight}
          </span>
          <div className="wd-bar-track">
            <div
              className="wd-bar-fill"
              style={{
                width: `${Math.round((row.val || 0) * 100)}%`,
                background: row.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function useCountdown(expiresAt: string | undefined) {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setMs(null);
      return;
    }
    const tick = () => {
      const end = new Date(expiresAt).getTime();
      setMs(Math.max(0, end - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return ms;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${String(m).padStart(2, '0')}min ${String(s).padStart(2, '0')}s`;
}

export default function WorkerDashboard() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const workerId = useMemo(() => {
    const fromQuery =
      searchParams.get('workerId') || (import.meta.env.VITE_WORKER_ID as string | undefined);
    if (fromQuery) return fromQuery.trim();
    if (user?._id && isFieldWorkerRole(user.role)) return user._id;
    return '';
  }, [searchParams, user?._id, user?.role]);

  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [localStatus, setLocalStatus] = useState<Record<string, 'accepted' | 'rejected'>>({});

  const pushToast = useCallback((text: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  const fetchWorker = useCallback(async () => {
    if (!workerId) return;
    const { data } = await api.get<WorkerProfile>(`/workers/${workerId}`);
    setWorker(data);
  }, [workerId]);

  const fetchRequests = useCallback(async () => {
    if (!workerId) return;
    const { data } = await axios.get<RequestRow[]>(
      `${MATCHING_API}/matching/my-requests`,
      { params: { workerId } },
    );
    setRows(Array.isArray(data) ? data : []);
  }, [workerId]);

  useEffect(() => {
    if (!workerId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await fetchWorker();
        await fetchRequests();
      } catch (e) {
        console.error(e);
        pushToast(
          'Impossible de charger les données. Vérifiez Nest (port 3001) et, pour le matching, Express (5050) ou VITE_MATCHING_API_URL.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workerId, fetchWorker, fetchRequests, pushToast]);

  useEffect(() => {
    if (!workerId) return;
    const wid = String(workerId).trim();
    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    const joinRoom = () => {
      socket.emit('join_worker_room', wid);
    };

    const onConnect = () => {
      console.log('[WorkerDashboard] Socket connecté, id=', socket.id, '→ join_worker_room', wid);
      joinRoom();
    };

    const onConnectError = (err: Error) => {
      console.error('[WorkerDashboard] Socket connect_error:', err?.message || err);
      pushToast(
        `Connexion temps réel impossible (${SOCKET_URL}). Vérifiez Express sur le port 5050 (npm run start:express).`,
      );
    };

    const onNew = (payload: {
      projectTitle?: string;
      score?: number;
      projectId?: string;
    }) => {
      console.log('[WorkerDashboard] NEW_MATCH_RECEIVED:', payload);
      pushToast(
        `Nouveau projet : ${payload?.projectTitle || 'Projet'} — Score : ${payload?.score ?? '—'} %`,
      );
      fetchRequests();
    };

    const onAssigned = () => {
      fetchRequests();
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('new_match_request', onNew);
    socket.on('project_assigned_confirmed', onAssigned);

    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('new_match_request', onNew);
      socket.off('project_assigned_confirmed', onAssigned);
      socket.disconnect();
    };
  }, [workerId, fetchRequests, pushToast]);

  useEffect(() => {
    if (!workerId) return;
    const id = window.setInterval(() => {
      fetchRequests();
    }, 20000);
    return () => window.clearInterval(id);
  }, [workerId, fetchRequests]);

  useEffect(() => {
    if (!workerId) return;
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchRequests();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [workerId, fetchRequests]);

  const toggleAvailable = async () => {
    if (!worker?._id) return;
    try {
      const { data } = await api.patch<WorkerProfile>(`/workers/${worker._id}`, {
        isAvailable: !worker.isAvailable,
      });
      setWorker(data);
    } catch (e) {
      console.error(e);
      pushToast('Mise à jour de disponibilité impossible.');
    }
  };

  const respond = async (projectId: string, action: 'accepted' | 'rejected') => {
    if (!workerId) return;
    setBusyId(projectId);
    try {
      await axios.patch(`${MATCHING_API}/matching/${projectId}/respond`, { workerId, action });
      setLocalStatus((s) => ({ ...s, [projectId]: action }));
      await fetchRequests();
    } catch (e) {
      console.error(e);
      pushToast('Erreur lors de la réponse.');
    } finally {
      setBusyId(null);
    }
  };

  const pending = useMemo(() => {
    return rows.filter((r) => {
      const st = r.match?.status;
      const loc = localStatus[r.project._id];
      if (loc) return false;
      const pendingLike = !st || st === 'pending';
      return pendingLike;
    });
  }, [rows, localStatus]);

  const active = useMemo(() => {
    return rows.filter((r) => {
      const st = r.match?.status;
      const loc = localStatus[r.project._id];
      if (loc === 'accepted') return true;
      return st === 'accepted';
    });
  }, [rows, localStatus]);

  const history = useMemo(() => {
    return rows.filter((r) => {
      const st = r.match?.status;
      if (localStatus[r.project._id] === 'rejected') return true;
      return st === 'rejected' || st === 'expired';
    });
  }, [rows, localStatus]);

  if (!workerId) {
    return (
      <div className="worker-dash">
        <div className="worker-dash__warn">
          <p>
            <strong>Pour voir les demandes de matching,</strong> il faut l’identifiant MongoDB du
            travailleur concerné (celui affiché sur la carte dans Matching IA).
          </p>
          <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.25rem' }}>
            <li>
              Connectez-vous avec le <strong>compte de ce travailleur</strong> (ex. compte seed{' '}
              <code>sami.bouazizi@seed.bmp.tn</code> / <code>seedWorker123</code>) : votre id est
              alors détecté automatiquement.
            </li>
            <li>
              Ou ouvrez ce tableau de bord avec{' '}
              <strong>
                <code>?workerId=&lt;id&gt;</code>
              </strong>{' '}
              (lien sur chaque carte proposition).
            </li>
          </ul>
          <p style={{ marginTop: '0.75rem', opacity: 0.9 }}>
            Si vous restez connecté en tant que <strong>client</strong>, vous ne recevrez pas les
            offres destinées aux artisans — ce sont des comptes différents dans la base.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-dash">
      <div className="wd-toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className="wd-toast">
            {t.text}
          </div>
        ))}
      </div>

      <header className="worker-dash__header">
        {loading && !worker ? (
          <div className="wd-skel" style={{ height: 120 }} />
        ) : (
          <>
            <div className="worker-dash__header-row">
              <div>
                <h1 className="worker-dash__name">{worker?.name || '…'}</h1>
                <span className={workerTypeBadgeClass(worker?.workerType || '')}>
                  {worker?.workerType || '—'}
                </span>
                {worker?.specialite ? (
                  <p className="worker-dash__subtitle">Spécialité : {worker.specialite}</p>
                ) : null}
              </div>
              <div className="worker-dash__stats">
                <div>
                  <Stars rating={worker?.rating ?? 0} />
                  <span style={{ marginLeft: 8, fontSize: '0.9rem' }}>
                    ({worker?.reviewsCount ?? 0} avis)
                  </span>
                </div>
                <label className="worker-dash__toggle">
                  <input
                    type="checkbox"
                    checked={worker?.isAvailable !== false}
                    onChange={toggleAvailable}
                  />
                  <span style={{ color: worker?.isAvailable !== false ? '#2E6B4F' : '#8B1A1A' }}>
                    {worker?.isAvailable !== false ? 'Disponible' : 'Indisponible'}
                  </span>
                </label>
                <div style={{ fontWeight: 600 }}>
                  Projets actifs : {worker?.activeProjects ?? 0}
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      <h2 className="worker-dash__section-title">Demandes en attente</h2>
      {loading ? (
        <div className="worker-dash__grid">
          <div className="wd-skel" />
          <div className="wd-skel" />
        </div>
      ) : pending.length === 0 ? (
        <div className="wd-empty">
          <p>
            Aucune demande en attente pour le moment.
            <br />
            Complétez votre profil pour recevoir plus de projets.
          </p>
          <Link to="/profile">
            <button type="button">Compléter mon profil</button>
          </Link>
        </div>
      ) : (
        <div className="worker-dash__grid">
          {pending.map((row) => (
            <PendingCard
              key={row.project._id}
              row={row}
              busy={busyId === row.project._id}
              localAction={localStatus[row.project._id]}
              onRespond={respond}
            />
          ))}
        </div>
      )}

      <h2 className="worker-dash__section-title" style={{ marginTop: '2rem' }}>
        Projets actifs
      </h2>
      <div className="worker-dash__grid">
        {active.length === 0 ? (
          <p style={{ opacity: 0.75 }}>Aucun projet accepté pour l’instant.</p>
        ) : (
          active.map((row) => (
            <div key={row.project._id} className="wd-mini">
              <div>
                <strong style={{ fontFamily: 'Georgia, serif' }}>{row.project.title}</strong>
                <div>
                  <span className="badge-wt badge-cx--simple">Accepté</span>
                </div>
              </div>
              <Link to={`/projects/${row.project._id}`}>Voir les détails →</Link>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        className="worker-dash__history-toggle"
        onClick={() => setHistoryOpen((v) => !v)}
      >
        {historyOpen ? '▼' : '▶'} Historique ({history.length})
      </button>
      {historyOpen && (
        <div className="worker-dash__grid">
          {history.length === 0 ? (
            <p style={{ opacity: 0.75 }}>Aucun historique.</p>
          ) : (
            history.map((row) => (
              <div key={row.project._id} className="wd-mini">
                <div>
                  <strong>{row.project.title}</strong>
                  <div style={{ marginTop: 6 }}>
                    <span className="wd-status-badge wd-status-badge--no">
                      {row.match.status === 'expired' ? 'Expiré' : 'Refusé'}
                    </span>
                  </div>
                </div>
                <Link to={`/projects/${row.project._id}`}>Détails</Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PendingCard({
  row,
  busy,
  localAction,
  onRespond,
}: {
  row: RequestRow;
  busy: boolean;
  localAction?: 'accepted' | 'rejected';
  onRespond: (projectId: string, action: 'accepted' | 'rejected') => void;
}) {
  const { project, match } = row;
  const cx = project.complexity;
  const border = complexityBorderVar(cx);
  const cat = project.projectCategory
    ? CATEGORY_LABELS[project.projectCategory] || project.projectCategory
    : '—';
  const loc = project.location;
  const locStr =
    loc?.gouvernorat && loc?.city
      ? `📍 ${loc.gouvernorat} · ${loc.city}`
      : loc?.gouvernorat
        ? `📍 ${loc.gouvernorat}`
        : '—';

  const cd = useCountdown(match.expiresAt);
  const expired = match.expiresAt ? new Date(match.expiresAt).getTime() <= Date.now() : false;

  return (
    <article className="wd-card">
      <div className="wd-card__inner" style={{ ['--border-cx' as string]: border, borderLeftColor: border }}>
        <div className="wd-card__title">{project.title}</div>
        <div className="wd-card__badges">
          <span className="badge-cat">{cat}</span>
          {cx ? (
            <span className={complexityBadgeClass(cx)}>
              {cx === 'simple' ? '🟢' : cx === 'moyen' ? '🟡' : '🔴'} {cx}
            </span>
          ) : null}
        </div>
        <div className="wd-card__budget">{formatBudget(project.budget)}</div>
        <div className="wd-card__loc">{locStr}</div>
        <div className="wd-tags">
          {(project.requiredSkills || []).map((s) => (
            <span key={s} className="wd-tag">
              {s}
            </span>
          ))}
        </div>
        {project.surface != null ? (
          <div style={{ fontSize: '0.88rem', marginTop: 6 }}>📐 {project.surface} m²</div>
        ) : null}

        <hr className="wd-divider" />

        <div className="wd-score-row">
          <ScoreRing score={match.score ?? 0} />
          <BreakdownBars b={match.breakdown} />
        </div>

        {match.explanation ? (
          <div className="wd-explain">{match.explanation}</div>
        ) : null}

        <hr className="wd-divider" />

        {expired ? (
          <div className="wd-expired">⏰ Offre expirée</div>
        ) : cd != null && cd > 0 ? (
          <div className="wd-countdown">
            ⏱️ Il vous reste {formatCountdown(cd)} pour répondre
          </div>
        ) : match.expiresAt ? (
          <div className="wd-expired">⏰ Offre expirée</div>
        ) : null}

        {localAction === 'accepted' && (
          <span className="wd-status-badge wd-status-badge--ok">✓ Accepté</span>
        )}
        {localAction === 'rejected' && (
          <span className="wd-status-badge wd-status-badge--no">✗ Refusé</span>
        )}

        {!localAction && !expired && (cd == null || cd > 0) && (
          <div className="wd-actions">
            <button
              type="button"
              className="wd-btn-accept"
              disabled={busy}
              onClick={() => onRespond(project._id, 'accepted')}
            >
              ✅ Accepter ce projet
            </button>
            <button
              type="button"
              className="wd-btn-reject"
              disabled={busy}
              onClick={() => onRespond(project._id, 'rejected')}
            >
              ❌ Refuser
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
