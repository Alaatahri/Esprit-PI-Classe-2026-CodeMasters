import { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { Project } from '../services/projectService';
import type { User } from '../services/userService';

/* ── Icons ── */
const IcoBar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IcoUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoTrend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IcoDollar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

/* ── Role config ── */
const ROLE_COLORS: Record<string, string> = {
  client: '#3b82f6', expert: '#10b981', artisan: '#8b5cf6',
  manufacturer: '#f59e0b', admin: '#ef4444',
};
const ROLE_LABELS: Record<string, string> = {
  client: 'Clients', expert: 'Experts', artisan: 'Artisans',
  manufacturer: 'Fabricants', admin: 'Admins',
};

/* ── SVG Donut chart ── */
interface DonutSlice { label: string; value: number; color: string; }

function DonutChart({ data, total }: { data: DonutSlice[]; total: number }) {
  const size = 120; const stroke = 18; const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.filter(d => d.value > 0).map(d => {
    const pct = d.value / total;
    const dash = pct * circ;
    const gap = circ - dash;
    const slice = { ...d, dasharray: `${dash} ${gap}`, dashoffset: -offset * circ };
    offset += pct;
    return slice;
  });

  return (
    <div className="os-donut-wrap">
      <div className="os-donut" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {slices.map(s => (
            <circle key={s.label}
              cx={size/2} cy={size/2} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="os-donut-center">
          <span className="os-donut-center-value">{total}</span>
          <span className="os-donut-center-label">total</span>
        </div>
      </div>
      <div className="os-donut-legend">
        {data.filter(d => d.value > 0).map(d => (
          <div key={d.label} className="os-donut-legend-item">
            <div className="os-donut-legend-dot" style={{ background: d.color }} />
            <span className="os-donut-legend-label">{d.label}</span>
            <span className="os-donut-legend-value">{d.value}</span>
            <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }}>
              ({Math.round((d.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════ */

const Analytics = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    dashboardService.getData()
      .then(({ projects: p, users: u }) => { setProjects(p || []); setUsers(u || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Computed stats ── */
  const enAttente = projects.filter(p => p.statut === 'En attente').length;
  const enCours   = projects.filter(p => p.statut === 'En cours').length;
  const termines  = projects.filter(p => p.statut === 'Terminé').length;
  const budget    = projects.reduce((s, p) => s + (p.budget_estime || 0), 0);
  const avgAdv    = projects.length
    ? Math.round(projects.reduce((s, p) => s + (p.avancement_global || 0), 0) / projects.length)
    : 0;

  const roleData: DonutSlice[] = ['client','expert','artisan','manufacturer','admin'].map(r => ({
    label: ROLE_LABELS[r] ?? r,
    value: users.filter(u => u.role === r).length,
    color: ROLE_COLORS[r] ?? '#94a3b8',
  }));

  const statusData: DonutSlice[] = [
    { label: 'En attente', value: enAttente, color: '#f59e0b' },
    { label: 'En cours',   value: enCours,   color: '#6366f1' },
    { label: 'Terminé',    value: termines,  color: '#10b981' },
  ];

  /* Budget by project — top 6 */
  const topBudget = [...projects]
    .sort((a, b) => b.budget_estime - a.budget_estime)
    .slice(0, 6);
  const maxBudget = topBudget[0]?.budget_estime || 1;

  return (
    <div className="os-page">
      {/* ── Header ── */}
      <div className="os-page-header os-animate">
        <div>
          <div className="os-page-eyebrow">Analytics</div>
          <h1 className="os-page-title">Statistiques Avancées</h1>
          <p className="os-page-subtitle">Vue analytique complète de la plateforme BMP.tn</p>
        </div>
      </div>

      {loading ? (
        <div className="os-kpi-grid">
          {[1,2,3,4].map(i => <div key={i} className="os-skeleton" style={{ height: 100 }} />)}
        </div>
      ) : (
        <>
          {/* ── KPIs ── */}
          <div className="os-kpi-grid os-animate os-animate-d1">
            <div className="os-kpi">
              <div className="os-kpi-accent" style={{ background: '#3b82f6' }} />
              <div className="os-kpi-header">
                <span className="os-kpi-label">Projets</span>
                <div className="os-kpi-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                  <IcoBar />
                </div>
              </div>
              <div className="os-kpi-value">{projects.length}</div>
              <div className="os-kpi-desc">{termines} terminés · {enCours} actifs</div>
            </div>
            <div className="os-kpi">
              <div className="os-kpi-accent" style={{ background: '#8b5cf6' }} />
              <div className="os-kpi-header">
                <span className="os-kpi-label">Utilisateurs</span>
                <div className="os-kpi-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                  <IcoUsers />
                </div>
              </div>
              <div className="os-kpi-value">{users.length}</div>
              <div className="os-kpi-desc">{roleData.filter(r => r.value > 0).length} rôles actifs</div>
            </div>
            <div className="os-kpi">
              <div className="os-kpi-accent" style={{ background: '#10b981' }} />
              <div className="os-kpi-header">
                <span className="os-kpi-label">Avancement moyen</span>
                <div className="os-kpi-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                  <IcoTrend />
                </div>
              </div>
              <div className="os-kpi-value">{avgAdv}%</div>
              <div style={{ marginTop: 8 }}>
                <div className="os-progress-track">
                  <div className="os-progress-fill success" style={{ width: `${avgAdv}%` }} />
                </div>
              </div>
            </div>
            <div className="os-kpi">
              <div className="os-kpi-accent" style={{ background: '#f59e0b' }} />
              <div className="os-kpi-header">
                <span className="os-kpi-label">Budget total</span>
                <div className="os-kpi-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                  <IcoDollar />
                </div>
              </div>
              <div className="os-kpi-value" style={{ fontSize: 22 }}>
                {budget >= 1_000_000
                  ? `${(budget / 1_000_000).toFixed(1)}M`
                  : budget >= 1000
                  ? `${(budget / 1000).toFixed(0)}K`
                  : budget}
              </div>
              <div className="os-kpi-desc">TND · tous projets</div>
            </div>
          </div>

          {/* ── Charts row ── */}
          <div className="os-grid-2 os-animate os-animate-d2" style={{ gap: 20 }}>
            {/* Status donut */}
            <div className="os-card">
              <div className="os-card-header">
                <span className="os-card-title" style={{ color: '#6366f1' }}>
                  <IcoBar />
                  <span style={{ color: '#0f172a' }}>Statuts des projets</span>
                </span>
              </div>
              <div className="os-card-body">
                {projects.length === 0 ? (
                  <div className="os-empty" style={{ padding: 32 }}>
                    <p className="os-empty-sub">Aucun projet</p>
                  </div>
                ) : (
                  <DonutChart data={statusData} total={projects.length} />
                )}
              </div>
            </div>

            {/* Role donut */}
            <div className="os-card">
              <div className="os-card-header">
                <span className="os-card-title" style={{ color: '#8b5cf6' }}>
                  <IcoUsers />
                  <span style={{ color: '#0f172a' }}>Répartition des rôles</span>
                </span>
              </div>
              <div className="os-card-body">
                {users.length === 0 ? (
                  <div className="os-empty" style={{ padding: 32 }}>
                    <p className="os-empty-sub">Aucun utilisateur</p>
                  </div>
                ) : (
                  <DonutChart data={roleData} total={users.length} />
                )}
              </div>
            </div>
          </div>

          {/* ── Top budgets bar chart ── */}
          {topBudget.length > 0 && (
            <div className="os-card os-animate os-animate-d3">
              <div className="os-card-header">
                <span className="os-card-title" style={{ color: '#f59e0b' }}>
                  <IcoDollar />
                  <span style={{ color: '#0f172a' }}>Top projets par budget</span>
                </span>
              </div>
              <div className="os-card-body">
                <div className="os-chart-bar-group">
                  {topBudget.map(p => (
                    <div key={p._id} className="os-chart-bar-item">
                      <span className="os-chart-bar-label os-truncate" style={{ width: 120 }}>
                        {p.titre}
                      </span>
                      <div className="os-chart-bar-track">
                        <div
                          className="os-chart-bar-fill"
                          style={{
                            width: `${(p.budget_estime / maxBudget) * 100}%`,
                            background: '#f59e0b',
                          }}
                        />
                      </div>
                      <span className="os-chart-bar-pct" style={{ width: 80, textAlign: 'right', fontSize: 11.5 }}>
                        {p.budget_estime.toLocaleString('fr-FR')} TND
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Project avancement table ── */}
          <div className="os-card os-animate os-animate-d4">
            <div className="os-card-header">
              <span className="os-card-title" style={{ color: '#10b981' }}>
                <IcoTrend />
                <span style={{ color: '#0f172a' }}>Avancement par projet</span>
              </span>
            </div>
            <div className="os-card-body no-pad">
              <div className="os-table-wrap">
                <table className="os-table">
                  <thead>
                    <tr>
                      <th>Projet</th>
                      <th>Statut</th>
                      <th>Avancement</th>
                      <th>Budget</th>
                      <th>Fin prévue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...projects]
                      .sort((a, b) => b.avancement_global - a.avancement_global)
                      .map(p => (
                        <tr key={p._id}>
                          <td>
                            <div className="os-table-name os-truncate" style={{ maxWidth: 200 }}>{p.titre}</div>
                          </td>
                          <td>
                            {p.statut === 'Terminé' && <span className="os-badge os-badge-success">{p.statut}</span>}
                            {p.statut === 'En cours' && <span className="os-badge os-badge-info">{p.statut}</span>}
                            {p.statut === 'En attente' && <span className="os-badge os-badge-warning">{p.statut}</span>}
                          </td>
                          <td style={{ minWidth: 140 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="os-progress-track" style={{ flex: 1 }}>
                                <div
                                  className="os-progress-fill"
                                  style={{
                                    width: `${p.avancement_global}%`,
                                    background: p.avancement_global >= 80 ? '#10b981'
                                      : p.avancement_global >= 40 ? '#6366f1' : '#f59e0b',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', width: 32, textAlign: 'right' }}>
                                {p.avancement_global}%
                              </span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: '#f59e0b', fontSize: 12 }}>
                            {p.budget_estime.toLocaleString('fr-FR')} TND
                          </td>
                          <td style={{ color: '#64748b', fontSize: 12 }}>
                            {new Date(p.date_fin_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
