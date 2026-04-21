import { useEffect, useMemo, useState } from 'react';
import matchingService, { AdminMatchingRequest } from '../services/matchingService';
import projectService, { Project } from '../services/projectService';
import userService, { User } from '../services/userService';

function idOf(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && '_id' in v) return String((v as any)._id);
  return String(v);
}

function labelOfUser(v: unknown): string {
  if (!v) return '—';
  if (typeof v === 'string') return v;
  const u = v as any;
  return `${u.nom ?? 'Utilisateur'}${u.email ? ` · ${u.email}` : ''}`;
}

function labelOfProject(v: unknown): string {
  if (!v) return '—';
  if (typeof v === 'string') return v;
  const p = v as any;
  return p.titre ?? String(p._id ?? 'Projet');
}

const MatchingAdmin = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [aiUrl, setAiUrl] = useState<string>(() => localStorage.getItem('bmp:matching:aiUrl') ?? '');
  const [aiKey, setAiKey] = useState<string>(() => localStorage.getItem('bmp:matching:aiKey') ?? '');
  const [requests, setRequests] = useState<AdminMatchingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find(p => p._id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [pRes, uRes] = await Promise.all([projectService.getAll(), userService.getAll()]);
      const p = (pRes.data ?? []) as Project[];
      const u = (uRes.data ?? []) as User[];
      setProjects(p);
      void u; // keep request for future enrichment (admin view), avoid unused variable warning
      const defaultProject = p.find(x => x.statut === 'En attente' && !x.expertId) ?? p[0];
      if (defaultProject?._id) setSelectedProjectId(defaultProject._id);
    } catch (e) {
      setErr('Impossible de charger les projets/utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async (projectId: string) => {
    setErr(null);
    setInfo(null);
    try {
      const list = await matchingService.adminListPending(projectId);
      setRequests(list);
    } catch {
      setErr("Impossible de charger les invitations de matching.");
      setRequests([]);
    }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!selectedProjectId) return;
    void loadRequests(selectedProjectId);
  }, [selectedProjectId]);

  const autoMatch = async () => {
    if (!selectedProjectId) return;
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      if (!aiUrl.trim()) {
        setErr("Veuillez renseigner l'AI URL (ou configurer MATCHING_AI_URL côté backend).");
        return;
      }
      if (aiUrl.trim()) localStorage.setItem('bmp:matching:aiUrl', aiUrl.trim());
      else localStorage.removeItem('bmp:matching:aiUrl');
      if (aiKey.trim()) localStorage.setItem('bmp:matching:aiKey', aiKey.trim());
      else localStorage.removeItem('bmp:matching:aiKey');
      const result: any = await matchingService.adminAutoMatch(selectedProjectId, {
        limit: 25,
        expiresInDays: 1,
        aiUrl: aiUrl.trim() || undefined,
        aiKey: aiKey.trim() || undefined,
      });

      if (result?.action === 'waiting') {
        setInfo("Une invitation est déjà active pour ce projet (attente réponse / expiration 24h).");
      } else if (result?.action === 'invited') {
        const score =
          typeof result?.invited?.score === 'number'
            ? ` (score ${Math.round(result.invited.score)}%)`
            : '';
        setInfo(`Invitation envoyée automatiquement au meilleur expert${score}.`);
      } else if (result?.action === 'no-candidates') {
        setInfo("Aucun expert candidat retourné par l'API AI (ou tous déjà invités).");
      } else {
        setInfo('Matching automatique exécuté.');
      }
      await loadRequests(selectedProjectId);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? 'Matching automatique impossible.');
    } finally {
      setBusy(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="os-page">
      <div className="os-page-header os-animate">
        <div>
          <div className="os-page-eyebrow">Matching</div>
          <h1 className="os-page-title">Matching Admin</h1>
          <p className="os-page-subtitle">
            Analyse d’un projet et gestion des invitations envoyées aux experts
          </p>
        </div>
      </div>

      {err && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10, padding: '10px 16px', fontSize: 12.5, color: '#ef4444' }}>
          {err}
        </div>
      )}

      {info && !err && (
        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 10, padding: '10px 16px', fontSize: 12.5, color: '#2563eb' }}>
          {info}
        </div>
      )}

      <div className="os-card os-animate os-animate-d1">
        <div className="os-card-header">
          <span className="os-card-title" style={{ color: '#f59e0b' }}>
            <span style={{ color: '#0f172a' }}>Sélection</span>
          </span>
        </div>
        <div className="os-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Projet</div>
            <select
              className="os-form-input"
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              disabled={loading || busy}
            >
              {projects.map(p => (
                <option key={p._id} value={p._id}>
                  {p.titre} · {p.statut}{p.expertId ? ' · expert assigné' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              className="os-btn os-btn-secondary"
              onClick={() => void autoMatch()}
              disabled={loading || busy || !selectedProjectId || !aiUrl.trim()}
              title="Appelle l'API AI et envoie plusieurs invitations automatiquement"
            >
              {busy ? 'Traitement…' : 'Matching auto (AI)'}
            </button>
          </div>
        </div>
      </div>

      <div className="os-card os-animate os-animate-d2">
        <div className="os-card-header">
          <span className="os-card-title" style={{ color: '#3b82f6' }}>
            <span style={{ color: '#0f172a' }}>Configuration Matching AI</span>
          </span>
        </div>
        <div className="os-card-body" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>AI URL</div>
            <input
              className="os-form-input"
              placeholder="https://.../match"
              value={aiUrl}
              onChange={e => setAiUrl(e.target.value)}
              disabled={busy}
            />
            <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
              Tu peux laisser vide si `MATCHING_AI_URL` est configurée côté backend.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>AI Key (optionnel)</div>
            <input
              className="os-form-input"
              type="password"
              placeholder="Bearer token…"
              value={aiKey}
              onChange={e => setAiKey(e.target.value)}
              disabled={busy}
            />
            <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
              Stockée localement dans le navigateur (localStorage).
            </div>
          </div>
        </div>
      </div>

      {selectedProject && (
        <div className="os-kpi-grid os-animate os-animate-d3">
          <div className="os-kpi">
            <div className="os-kpi-accent" style={{ background: '#3b82f6' }} />
            <div className="os-kpi-label">Projet</div>
            <div className="os-kpi-value" style={{ fontSize: 18 }}>{selectedProject.titre}</div>
            <div className="os-kpi-desc">{selectedProject.statut} · {selectedProject.budget_estime.toLocaleString('fr-FR')} TND</div>
          </div>
          <div className="os-kpi">
            <div className="os-kpi-accent" style={{ background: '#f59e0b' }} />
            <div className="os-kpi-label">Invitations (pending)</div>
            <div className="os-kpi-value">{pendingCount}</div>
            <div className="os-kpi-desc">En attente de réponse</div>
          </div>
          <div className="os-kpi">
            <div className="os-kpi-accent" style={{ background: '#10b981' }} />
            <div className="os-kpi-label">Expert assigné</div>
            <div className="os-kpi-value" style={{ fontSize: 18 }}>{selectedProject.expertId ? 'Oui' : 'Non'}</div>
            <div className="os-kpi-desc">{selectedProject.expertId ? selectedProject.expertId : '—'}</div>
          </div>
        </div>
      )}

      <div className="os-card os-animate os-animate-d4">
        <div className="os-card-header">
          <span className="os-card-title" style={{ color: '#6366f1' }}>
            <span style={{ color: '#0f172a' }}>Invitations en attente</span>
          </span>
        </div>
        <div className="os-card-body no-pad">
          <div className="os-table-wrap">
            <table className="os-table">
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Expert</th>
                  <th>Score</th>
                  <th>Expire</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 20, color: '#64748b' }}>
                      Aucune invitation pending pour ce projet.
                    </td>
                  </tr>
                ) : (
                  requests.map(r => (
                    <tr key={r._id}>
                      <td>
                        <div className="os-table-name os-truncate" style={{ maxWidth: 240 }}>
                          {labelOfProject(r.projectId)}
                        </div>
                        <div className="os-table-sub">{idOf(r.projectId)}</div>
                      </td>
                      <td>
                        <div className="os-table-name os-truncate" style={{ maxWidth: 240 }}>
                          {labelOfUser(r.expertId)}
                        </div>
                        <div className="os-table-sub">{idOf(r.expertId)}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#f59e0b' }}>
                        {typeof r.matchScore === 'number' ? r.matchScore : '—'}
                      </td>
                      <td style={{ color: '#64748b', fontSize: 12 }}>
                        {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}>
                        {r._id}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingAdmin;

