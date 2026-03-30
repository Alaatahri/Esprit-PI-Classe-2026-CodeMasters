import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import ExpertMatchCard from '../components/ExpertMatchCard';
import {
  fetchMatchingProjects,
  runMatching,
  type MatchingProject,
  type MatchingRunResponse,
} from '../services/matchingService';
import './MatchingPage.css';

const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:5050';

function workerTypeBadgeClass(wt: string) {
  const k = wt.toLowerCase();
  if (k === 'artisan') return 'mp-wt mp-wt--artisan';
  if (k === 'ouvrier') return 'mp-wt mp-wt--ouvrier';
  if (k === 'electricien') return 'mp-wt mp-wt--electricien';
  if (k === 'expert') return 'mp-wt mp-wt--expert';
  if (k === 'architecte') return 'mp-wt mp-wt--architecte';
  return 'mp-wt mp-wt--artisan';
}

function workerTypeLabel(wt: string) {
  const k = wt.toLowerCase();
  if (k === 'electricien') return 'Électricien';
  if (k === 'architecte') return 'Architecte';
  if (k === 'ouvrier') return 'Ouvrier';
  if (k === 'expert') return 'Expert';
  if (k === 'artisan') return 'Artisan';
  return wt;
}

function complexityRowBadge(cx: string | undefined) {
  const k = (cx || '').toLowerCase();
  if (k === 'simple') return { cls: 'mp-cx mp-cx--simple', text: '🟢 Simple' };
  if (k === 'moyen') return { cls: 'mp-cx mp-cx--moyen', text: '🟡 Moyen' };
  if (k === 'complexe') return { cls: 'mp-cx mp-cx--complexe', text: '🔴 Complexe' };
  return { cls: 'mp-cx', text: '—' };
}

function formatBudget(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toLocaleString('fr-FR').replace(/,/g, ' ')} TND`;
}

export default function MatchingPage() {
  const [projects, setProjects] = useState<MatchingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [iaOpen, setIaOpen] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; kind: 'ok' | 'warn'; text: string }[]>([]);

  const pushToast = useCallback((text: string, kind: 'ok' | 'warn' = 'ok') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMatchingProjects();
      setProjects(data);
      setSelectedId((prev) => {
        if (prev && data.some((p) => p._id === prev)) return prev;
        return data[0]?._id ?? null;
      });
    } catch (e) {
      console.error(e);
      pushToast('Impossible de charger les projets (Express + /api/matching).', 'warn');
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.emit('join_admin_room');

    const onDone = (payload: { projectTitle?: string }) => {
      pushToast(`✓ Matching automatique terminé pour : ${payload?.projectTitle || 'Projet'}`);
      load();
    };
    const onAccepted = (payload: {
      projectId?: string;
      projectTitle?: string;
      workerName?: string;
    }) => {
      pushToast(
        `${payload?.workerName || 'Un travailleur'} a accepté le projet ${payload?.projectTitle || ''}`,
      );
      load();
    };
    const onRetry = () => {
      pushToast('⚠ Tous les experts ont refusé — relance automatique en cours...', 'warn');
      load();
    };

    socket.on('new_auto_match_done', onDone);
    socket.on('match_accepted', onAccepted);
    socket.on('all_matches_rejected_retrying', onRetry);

    return () => {
      socket.disconnect();
    };
  }, [load, pushToast]);

  const selected = useMemo(
    () => projects.find((p) => p._id === selectedId) || null,
    [projects, selectedId],
  );

  const stats = useMemo(() => {
    let pending = 0;
    let matched = 0;
    let active = 0;
    for (const p of projects) {
      const ms = p.matchingStatus || p.status;
      if (ms === 'matched') matched += 1;
      else if (ms === 'searching' || p.statut === 'En cours') active += 1;
      else if (ms === 'pending' || ms === undefined) pending += 1;
    }
    return { pending, matched, active };
  }, [projects]);

  const canRelaunch = useMemo(() => {
    if (!selected?.aiMatches?.length) return false;
    return selected.aiMatches.every(
      (m) => m.status === 'rejected' || m.status === 'expired',
    );
  }, [selected]);

  const toastMatchingMeta = (meta: MatchingRunResponse['matchingMeta']) => {
    if (!meta || meta.ok !== false) {
      pushToast(
        `Matching terminé : ${meta?.matchCount ?? 0} proposition(s).`,
      );
      return;
    }
    if (meta.reason === 'no_workers') {
      pushToast(
        'Aucun travailleur ne correspond (ou base vide). Lancez le seed : npm run seed:workers dans le dossier backend.',
        'warn',
      );
      return;
    }
    if (meta.reason === 'offset_exhausted') {
      pushToast('Plus de profils disponibles pour cette relance.', 'warn');
      return;
    }
    if (meta.reason === 'error') {
      pushToast(
        `Service matching indisponible (vérifiez Python sur le port 8001) : ${meta.message || 'erreur'}`,
        'warn',
      );
      return;
    }
    pushToast('Le matching n’a pas produit de nouvelles propositions.', 'warn');
  };

  const handleRunMatching = async () => {
    if (!selected?._id) return;
    setRunLoading(true);
    try {
      const res = await runMatching(selected._id, 3, 0);
      await load();
      toastMatchingMeta(res.matchingMeta);
    } catch (e) {
      console.error(e);
      pushToast('Échec du lancement du matching.', 'warn');
    } finally {
      setRunLoading(false);
    }
  };

  const handleRelaunch = async () => {
    if (!selected?._id) return;
    setRunLoading(true);
    try {
      const res = await runMatching(selected._id, 3, 3);
      await load();
      toastMatchingMeta(res.matchingMeta);
    } catch (e) {
      console.error(e);
      pushToast('Échec du relancement.', 'warn');
    } finally {
      setRunLoading(false);
    }
  };

  return (
    <div className="mp-page">
      <div className="mp-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`mp-toast mp-toast--${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>

      <header className="mp-header">
        <h1 className="mp-title">Matching IA — Administration</h1>
        <p className="mp-context-note">
          Chaque proposition pointe vers un utilisateur dans la collection <code>users</code> (rôle artisan,
          expert, électricien, etc.). Voir aussi la liste filtrée{' '}
          <Link to="/workers">Travailleurs</Link>.
        </p>
        <div className="mp-stats">
          <div className="mp-stat">
            <span className="mp-stat__val">{stats.pending}</span>
            <span className="mp-stat__label">En attente</span>
          </div>
          <div className="mp-stat">
            <span className="mp-stat__val">{stats.matched}</span>
            <span className="mp-stat__label">Matchés</span>
          </div>
          <div className="mp-stat">
            <span className="mp-stat__val">{stats.active}</span>
            <span className="mp-stat__label">En cours</span>
          </div>
        </div>
        <div className="mp-legend">
          <span className="mp-legend__pill" style={{ background: '#7C4A3A' }}>
            Compétences 35%
          </span>
          <span className="mp-legend__pill" style={{ background: '#B8860B' }}>
            Réputation 25%
          </span>
          <span className="mp-legend__pill" style={{ background: '#2E6B4F' }}>
            Proximité 20%
          </span>
          <span className="mp-legend__pill" style={{ background: '#2E4A6B' }}>
            Expérience 15%
          </span>
          <span className="mp-legend__pill" style={{ background: '#6B2E6B' }}>
            Disponibilité 5%
          </span>
        </div>
      </header>

      <div className="mp-panels">
        <aside className="mp-left">
          <h2 className="mp-left__title">Projets</h2>
          {loading ? (
            <div className="mp-skel" />
          ) : (
            <ul className="mp-list">
              {projects.map((p) => {
                const cx = complexityRowBadge(p.complexity);
                const activeRow = p._id === selectedId;
                return (
                  <li key={p._id}>
                    <button
                      type="button"
                      className={`mp-row ${activeRow ? 'mp-row--active' : ''}`}
                      onClick={() => setSelectedId(p._id)}
                    >
                      <div className="mp-row__title">{p.titre || p.title}</div>
                      <span className={cx.cls}>{cx.text}</span>
                      <div className="mp-row__types">
                        {(p.requiredWorkerTypes || []).map((wt) => (
                          <span key={wt} className={workerTypeBadgeClass(wt)}>
                            {workerTypeLabel(wt)}
                          </span>
                        ))}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <main className="mp-right">
          {!selected ? (
            <p className="mp-placeholder">Sélectionnez un projet.</p>
          ) : (
            <>
              <div className="mp-detail-head">
                <h2 className="mp-detail-title">{selected.titre || selected.title}</h2>
                <p className="mp-detail-desc">{selected.description}</p>
                <p className="mp-detail-budget">
                  Budget :{' '}
                  <strong>
                    {formatBudget(
                      selected.budget != null ? selected.budget : selected.budget_estime,
                    )}
                  </strong>
                </p>

                <button
                  type="button"
                  className="mp-ia-toggle"
                  onClick={() => setIaOpen((v) => !v)}
                >
                  {iaOpen ? '▼' : '▶'} Analyse IA
                </button>
                {iaOpen && (
                  <div className="mp-ia-panel">
                    {selected.complexity ? (
                      <div className={complexityRowBadge(selected.complexity).cls} style={{ fontSize: '1rem', padding: '0.35rem 0.75rem', marginBottom: '0.75rem' }}>
                        {complexityRowBadge(selected.complexity).text}
                      </div>
                    ) : null}
                    {selected.complexityReasoning ? (
                      <div className="mp-ia-reason">{selected.complexityReasoning}</div>
                    ) : null}
                    <div className="mp-ia-types">
                      {(selected.requiredWorkerTypes || []).map((wt) => (
                        <span key={wt} className={workerTypeBadgeClass(wt)}>
                          {workerTypeLabel(wt)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mp-actions-bar">
                {!selected.aiMatches?.length ? (
                  <button
                    type="button"
                    className="mp-btn-relaunch"
                    disabled={runLoading}
                    onClick={handleRunMatching}
                  >
                    {runLoading ? 'Matching…' : 'Lancer le matching IA'}
                  </button>
                ) : null}
                {canRelaunch ? (
                  <button
                    type="button"
                    className="mp-btn-relaunch"
                    disabled={runLoading}
                    onClick={handleRelaunch}
                  >
                    {runLoading ? 'Relance…' : 'Relancer le matching'}
                  </button>
                ) : null}
              </div>

              <h3 className="mp-matches-title">Propositions ({selected.aiMatches?.length || 0})</h3>
              {(selected.aiMatches || []).length > 0 ? (
                <p className="mp-worker-flow-hint">
                  Les offres sont liées au <strong>compte utilisateur</strong> du travailleur (même id MongoDB).
                  Il doit se connecter avec <strong>son e-mail</strong> (ex. seed{' '}
                  <code>sami.bouazizi@seed.bmp.tn</code>) puis ouvrir{' '}
                  <Link to="/worker/dashboard">Mes offres projet</Link>, ou utiliser le lien sur chaque carte.{' '}
                  Express + Socket sur le <strong>port 5050</strong> pour les notifications instantanées.
                </p>
              ) : null}
              <div className="mp-cards">
                {(selected.aiMatches || []).map((m, idx) => (
                  <ExpertMatchCard
                    key={m._id?.toString() || `${m.workerId}-${idx}`}
                    match={m}
                  />
                ))}
              </div>
              {!selected.aiMatches?.length ? (
                <p className="mp-placeholder">Aucun match IA pour ce projet.</p>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
