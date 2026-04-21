import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import projectService, { Project } from '../services/projectService';

/* ── Icons ── */
const IcoFolder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
const IcoChevLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IcoChevRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

/* ── Status badge ── */
function StatusBadge({ statut }: { statut: string }) {
  if (statut === 'En cours')  return <span className="os-badge os-badge-info">{statut}</span>;
  if (statut === 'Terminé')   return <span className="os-badge os-badge-success">{statut}</span>;
  return <span className="os-badge os-badge-warning">{statut}</span>;
}

type FilterTab = 'Tous' | 'En attente' | 'En cours' | 'Terminé';
const TABS: FilterTab[] = ['Tous', 'En attente', 'En cours', 'Terminé'];
const PAGE_SIZE = 10;

const ProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterTab>('Tous');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);

  useEffect(() => {
    projectService.getAll()
      .then(r => setProjects(r.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  /* Reset to page 1 when filter/search changes */
  useEffect(() => { setPage(1); }, [filter, search]);

  const filtered = useMemo(() => {
    let list = projects;
    if (filter !== 'Tous') list = list.filter(p => p.statut === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.titre.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* Tab counts */
  const counts: Record<FilterTab, number> = {
    'Tous':       projects.length,
    'En attente': projects.filter(p => p.statut === 'En attente').length,
    'En cours':   projects.filter(p => p.statut === 'En cours').length,
    'Terminé':    projects.filter(p => p.statut === 'Terminé').length,
  };

  return (
    <div className="os-page">
      {/* ── Header ── */}
      <div className="os-page-header os-animate">
        <div>
          <div className="os-page-eyebrow">Projets</div>
          <h1 className="os-page-title">Gestion des Projets</h1>
          <p className="os-page-subtitle">
            {projects.length} projet{projects.length !== 1 ? 's' : ''} sur la plateforme
          </p>
        </div>
        <div className="os-page-actions">
          <Link to="/projects/add" className="os-btn os-btn-primary os-btn-sm">
            <IcoPlus /> Nouveau projet
          </Link>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="os-card os-animate os-animate-d1">
        {/* Toolbar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Filter tabs */}
          <div className="os-tabs">
            {TABS.map(t => (
              <button
                key={t}
                className={`os-tab${filter === t ? ' active' : ''}`}
                onClick={() => setFilter(t)}
              >
                {t}
                <span style={{
                  marginLeft: 5, fontSize: 10, fontWeight: 700,
                  background: filter === t ? '#f1f5f9' : 'rgba(0,0,0,0.06)',
                  padding: '1px 5px', borderRadius: 99, color: '#64748b',
                }}>
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="os-search-wrap" style={{ marginLeft: 'auto' }}>
            <IcoSearch />
            <input
              className="os-search-input"
              placeholder="Rechercher un projet…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table body */}
        <div className="os-card-body no-pad">
          {loading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="os-skeleton" style={{ height: 44, borderRadius: 8 }} />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="os-empty">
              <div className="os-empty-icon"><IcoFolder /></div>
              <p className="os-empty-title">Aucun projet trouvé</p>
              <p className="os-empty-sub">
                {search ? `Aucun résultat pour « ${search} »` : 'Créez votre premier projet.'}
              </p>
              <Link to="/projects/add" className="os-btn os-btn-primary os-btn-sm">
                <IcoPlus /> Créer un projet
              </Link>
            </div>
          ) : (
            <div className="os-table-wrap">
              <table className="os-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Statut</th>
                    <th>Avancement</th>
                    <th>Budget (TND)</th>
                    <th>Date début</th>
                    <th>Date fin prévue</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(p => (
                    <tr key={p._id}>
                      <td style={{ maxWidth: 220 }}>
                        <div className="os-table-name os-truncate">{p.titre}</div>
                        <div className="os-table-sub os-truncate">
                          {p.description.length > 55 ? p.description.slice(0, 55) + '…' : p.description}
                        </div>
                      </td>
                      <td><StatusBadge statut={p.statut} /></td>
                      <td style={{ minWidth: 130 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div className="os-progress-track" style={{ flex: 1 }}>
                            <div
                              className="os-progress-fill"
                              style={{
                                width: `${p.avancement_global}%`,
                                background: p.avancement_global >= 80 ? '#10b981'
                                  : p.avancement_global >= 40 ? '#3b82f6' : '#f59e0b',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', width: 30, textAlign: 'right' }}>
                            {p.avancement_global}%
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#f59e0b' }}>
                        {p.budget_estime.toLocaleString('fr-FR')}
                      </td>
                      <td style={{ color: '#64748b', fontSize: 12 }}>
                        {new Date(p.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td style={{ color: '#64748b', fontSize: 12 }}>
                        {new Date(p.date_fin_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td>
                        <Link to={`/projects/${p._id}`} className="os-btn os-btn-ghost os-btn-xs">
                          Voir <IcoArrow />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="os-pagination">
            <span className="os-pagination-info">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length} projets
            </span>
            <div className="os-pagination-controls">
              <button
                className="os-pagination-btn"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
              >
                <IcoChevLeft />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === '…' ? (
                    <span key={`ellipsis-${i}`} className="os-pagination-btn" style={{ cursor: 'default' }}>…</span>
                  ) : (
                    <button
                      key={n}
                      className={`os-pagination-btn${page === n ? ' active' : ''}`}
                      onClick={() => setPage(n as number)}
                    >
                      {n}
                    </button>
                  )
                )}
              <button
                className="os-pagination-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
              >
                <IcoChevRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsList;
