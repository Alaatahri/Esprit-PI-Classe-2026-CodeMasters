import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import type { Project } from '../services/projectService';
import type { User } from '../services/userService';

/* ── Inline SVG Icons ── */
const IcoFolder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoActivity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IcoCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IcoUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoDollar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const IcoPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcoArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IcoRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

/* ── Sparkline SVG ── */
function Sparkline({ data, color = '#f59e0b' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 72; const H = 26;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 2) - 1}`)
    .join(' ');
  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Status badge ── */
function StatusBadge({ statut }: { statut: string }) {
  if (statut === 'En cours')  return <span className="os-badge os-badge-info">{statut}</span>;
  if (statut === 'Terminé')   return <span className="os-badge os-badge-success">{statut}</span>;
  return <span className="os-badge os-badge-warning">{statut}</span>;
}

/* ── Role colors ── */
const ROLE_COLORS: Record<string, string> = {
  client:       '#3b82f6',
  expert:       '#10b981',
  artisan:      '#8b5cf6',
  manufacturer: '#f59e0b',
  admin:        '#ef4444',
};
const ROLE_LABELS: Record<string, string> = {
  client: 'Clients', expert: 'Experts', artisan: 'Artisans',
  manufacturer: 'Fabricants', admin: 'Admins',
};

/* ── Avatar color helper ── */
const AVATAR_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
const avatarColor = (s: string) => AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length];

/* ── Fake sparkline data ending at current value ── */
function trendLine(end: number, points = 8): number[] {
  const base = Math.max(0, end - Math.round(end * 0.4));
  const arr: number[] = [];
  for (let i = 0; i < points - 1; i++) {
    arr.push(base + Math.round(Math.random() * (end - base)));
  }
  arr.push(end);
  return arr;
}

/* ════════════════════════════════════════════════════════ */

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const { projects: p, users: u } = await dashboardService.getData();
      setProjects(p || []);
      setUsers(u || []);
    } catch (e) {
      setErr('Erreur de chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) {
    return (
      <div className="os-page">
        <div className="os-kpi-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="os-kpi">
              <div className="os-skeleton" style={{ height: 14, width: '60%', marginBottom: 12 }} />
              <div className="os-skeleton" style={{ height: 28, width: '40%', marginBottom: 8 }} />
              <div className="os-skeleton" style={{ height: 10, width: '80%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* Stats */
  const enAttente  = projects.filter(p => p.statut === 'En attente').length;
  const enCours    = projects.filter(p => p.statut === 'En cours').length;
  const termines   = projects.filter(p => p.statut === 'Terminé').length;
  const budget     = projects.reduce((s, p) => s + (p.budget_estime || 0), 0);
  const avancement = projects.length
    ? Math.round(projects.reduce((s, p) => s + (p.avancement_global || 0), 0) / projects.length)
    : 0;
  const roleCount  = (['client','expert','artisan','manufacturer','admin'] as const).map(r => ({
    role: r, count: users.filter(u => u.role === r).length,
  }));
  const maxRole = Math.max(...roleCount.map(r => r.count), 1);

  /* Simulated sparklines */
  const sparkProjects = trendLine(projects.length);
  const sparkUsers    = trendLine(users.length);
  const sparkBudget   = trendLine(Math.round(budget / 1000));

  return (
    <div className="os-page">
      {/* ── Header ── */}
      <div className="os-page-header os-animate">
        <div>
          <div className="os-page-eyebrow">Construction OS</div>
          <h1 className="os-page-title">Vue d'ensemble</h1>
          <p className="os-page-subtitle">
            Supervision complète de la plateforme BMP.tn
          </p>
        </div>
        <div className="os-page-actions">
          <button className="os-btn os-btn-secondary os-btn-sm" onClick={() => void load()}>
            <IcoRefresh /> Actualiser
          </button>
          <Link to="/projects/add" className="os-btn os-btn-primary os-btn-sm">
            <IcoPlus /> Nouveau projet
          </Link>
        </div>
      </div>

      {err && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10, padding: '10px 16px', fontSize: 12.5, color: '#ef4444' }}>
          {err}
        </div>
      )}

      {/* ── KPI Grid ── */}
      <div className="os-kpi-grid os-animate os-animate-d1">
        {/* Total projets */}
        <div className="os-kpi">
          <div className="os-kpi-accent" style={{ background: '#3b82f6' }} />
          <div className="os-kpi-header">
            <span className="os-kpi-label">Total Projets</span>
            <div className="os-kpi-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
              <IcoFolder />
            </div>
          </div>
          <div className="os-kpi-value">{projects.length}</div>
          <div className="os-kpi-footer">
            <span className="os-kpi-trend up">↑ {enCours} actifs</span>
            <Sparkline data={sparkProjects} color="#3b82f6" />
          </div>
        </div>

        {/* En attente */}
        <div className="os-kpi">
          <div className="os-kpi-accent" style={{ background: '#f59e0b' }} />
          <div className="os-kpi-header">
            <span className="os-kpi-label">En attente</span>
            <div className="os-kpi-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              <IcoClock />
            </div>
          </div>
          <div className="os-kpi-value">{enAttente}</div>
          <div className="os-kpi-desc">En attente de démarrage</div>
        </div>

        {/* En cours */}
        <div className="os-kpi">
          <div className="os-kpi-accent" style={{ background: '#6366f1' }} />
          <div className="os-kpi-header">
            <span className="os-kpi-label">En cours</span>
            <div className="os-kpi-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
              <IcoActivity />
            </div>
          </div>
          <div className="os-kpi-value">{enCours}</div>
          <div className="os-kpi-desc">Projets actifs</div>
        </div>

        {/* Terminés */}
        <div className="os-kpi">
          <div className="os-kpi-accent" style={{ background: '#10b981' }} />
          <div className="os-kpi-header">
            <span className="os-kpi-label">Terminés</span>
            <div className="os-kpi-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <IcoCheck />
            </div>
          </div>
          <div className="os-kpi-value">{termines}</div>
          <div className="os-kpi-trend up" style={{ marginTop: 8 }}>
            {projects.length > 0 ? Math.round((termines / projects.length) * 100) : 0}% taux completion
          </div>
        </div>

        {/* Utilisateurs */}
        <div className="os-kpi">
          <div className="os-kpi-accent" style={{ background: '#8b5cf6' }} />
          <div className="os-kpi-header">
            <span className="os-kpi-label">Utilisateurs</span>
            <div className="os-kpi-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
              <IcoUsers />
            </div>
          </div>
          <div className="os-kpi-value">{users.length}</div>
          <div className="os-kpi-footer">
            <span className="os-kpi-trend up">Inscrits</span>
            <Sparkline data={sparkUsers} color="#8b5cf6" />
          </div>
        </div>

        {/* Budget */}
        <div className="os-kpi">
          <div className="os-kpi-accent" style={{ background: '#f59e0b' }} />
          <div className="os-kpi-header">
            <span className="os-kpi-label">Budget total</span>
            <div className="os-kpi-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              <IcoDollar />
            </div>
          </div>
          <div className="os-kpi-value" style={{ fontSize: 20 }}>
            {budget >= 1000 ? `${(budget / 1000).toFixed(0)}K` : budget}
          </div>
          <div className="os-kpi-footer">
            <span className="os-kpi-trend flat">TND estimé</span>
            <Sparkline data={sparkBudget} color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="os-grid-2 os-animate os-animate-d2" style={{ gap: 20 }}>
        {/* Project status distribution */}
        <div className="os-card">
          <div className="os-card-header">
            <span className="os-card-title" style={{ color: '#3b82f6' }}>
              <IcoActivity />
              <span style={{ color: '#0f172a' }}>Distribution des statuts</span>
            </span>
          </div>
          <div className="os-card-body">
            <div className="os-chart-bar-group">
              {[
                { label: 'En attente', count: enAttente, color: '#f59e0b' },
                { label: 'En cours',   count: enCours,   color: '#6366f1' },
                { label: 'Terminé',    count: termines,  color: '#10b981' },
              ].map(item => (
                <div key={item.label} className="os-chart-bar-item">
                  <span className="os-chart-bar-label">{item.label}</span>
                  <div className="os-chart-bar-track">
                    <div
                      className="os-chart-bar-fill"
                      style={{
                        width: projects.length ? `${(item.count / projects.length) * 100}%` : '0%',
                        background: item.color,
                      }}
                    />
                  </div>
                  <span className="os-chart-bar-pct">{item.count}</span>
                </div>
              ))}
            </div>
            {/* Avancement moyen */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Avancement moyen</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{avancement}%</span>
              </div>
              <div className="os-progress-track">
                <div className="os-progress-fill" style={{ width: `${avancement}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Role distribution */}
        <div className="os-card">
          <div className="os-card-header">
            <span className="os-card-title" style={{ color: '#8b5cf6' }}>
              <IcoUsers />
              <span style={{ color: '#0f172a' }}>Répartition des rôles</span>
            </span>
          </div>
          <div className="os-card-body">
            {users.length === 0 ? (
              <div className="os-empty">
                <div className="os-empty-icon"><IcoUsers /></div>
                <p className="os-empty-title">Aucun utilisateur</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {roleCount.filter(r => r.count > 0).map(({ role, count }) => (
                  <div key={role} className="os-stat-bar-row">
                    <span className="os-stat-bar-label">{ROLE_LABELS[role]}</span>
                    <div className="os-stat-bar-track">
                      <div
                        className="os-stat-bar-fill"
                        style={{ width: `${(count / maxRole) * 100}%`, background: ROLE_COLORS[role] }}
                      />
                    </div>
                    <span className="os-stat-bar-count">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom grid: projects table + recent users ── */}
      <div className="os-animate os-animate-d3"
        style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Recent projects table */}
        <div className="os-card">
          <div className="os-card-header">
            <span className="os-card-title" style={{ color: '#f59e0b' }}>
              <IcoFolder />
              <span style={{ color: '#0f172a' }}>Projets récents</span>
            </span>
            <Link to="/projects" className="os-btn os-btn-ghost os-btn-xs">
              Voir tout <IcoArrow />
            </Link>
          </div>
          <div className="os-card-body no-pad">
            {projects.length === 0 ? (
              <div className="os-empty">
                <div className="os-empty-icon"><IcoFolder /></div>
                <p className="os-empty-title">Aucun projet</p>
                <p className="os-empty-sub">Créez votre premier projet</p>
              </div>
            ) : (
              <div className="os-table-wrap">
                <table className="os-table">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Statut</th>
                      <th>Avancement</th>
                      <th>Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.slice(0, 6).map(p => (
                      <tr key={p._id}>
                        <td>
                          <Link to={`/projects/${p._id}`}
                            style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600 }}>
                            <span className="os-truncate" style={{ display: 'block', maxWidth: 180 }}>
                              {p.titre}
                            </span>
                          </Link>
                        </td>
                        <td><StatusBadge statut={p.statut} /></td>
                        <td style={{ minWidth: 120 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="os-progress-track" style={{ flex: 1 }}>
                              <div
                                className="os-progress-fill"
                                style={{
                                  width: `${p.avancement_global}%`,
                                  background: p.avancement_global >= 80 ? '#10b981' : '#3b82f6',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', width: 28, textAlign: 'right' }}>
                              {p.avancement_global}%
                            </span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: '#f59e0b', fontSize: 12 }}>
                          {p.budget_estime.toLocaleString('fr-FR')} TND
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent users */}
        <div className="os-card">
          <div className="os-card-header">
            <span className="os-card-title" style={{ color: '#8b5cf6' }}>
              <IcoUsers />
              <span style={{ color: '#0f172a' }}>Utilisateurs récents</span>
            </span>
            <Link to="/users" className="os-btn os-btn-ghost os-btn-xs">
              Voir tout <IcoArrow />
            </Link>
          </div>
          <div className="os-card-body no-pad">
            {users.length === 0 ? (
              <div className="os-empty">
                <div className="os-empty-icon"><IcoUsers /></div>
                <p className="os-empty-title">Aucun utilisateur</p>
              </div>
            ) : (
              <div>
                {users.slice(0, 6).map(u => (
                  <div key={u._id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 20px', borderBottom: '1px solid #f1f5f9',
                  }}>
                    <div
                      className="os-avatar"
                      style={{ background: avatarColor(u.nom) }}
                    >
                      {u.nom.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="os-truncate" style={{ fontWeight: 600, fontSize: 12.5, color: '#0f172a' }}>
                        {u.nom}
                      </div>
                      <div className="os-truncate" style={{ fontSize: 11, color: '#94a3b8' }}>{u.email}</div>
                    </div>
                    <span
                      className="os-badge"
                      style={{
                        background: `${ROLE_COLORS[u.role]}18`,
                        color: ROLE_COLORS[u.role],
                      }}
                    >
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
