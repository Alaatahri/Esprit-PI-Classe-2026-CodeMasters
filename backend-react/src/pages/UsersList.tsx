import { useEffect, useState, useMemo } from 'react';
import userService, { User } from '../services/userService';

/* ── Icons ── */
const IcoUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l.96-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IcoCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
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

/* ── Role config ── */
const ROLE_COLORS: Record<string, string> = {
  client:       '#3b82f6',
  expert:       '#10b981',
  artisan:      '#8b5cf6',
  manufacturer: '#f59e0b',
  admin:        '#ef4444',
};
const ROLE_LABELS: Record<string, string> = {
  client: 'Client', expert: 'Expert', artisan: 'Artisan',
  manufacturer: 'Fabricant', admin: 'Admin',
};
const AVATAR_COLORS = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899'];
const avatarColor = (s: string) => AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length];

type FilterTab = 'Tous' | 'client' | 'expert' | 'artisan' | 'manufacturer' | 'admin';
const TABS: FilterTab[] = ['Tous','client','expert','artisan','manufacturer','admin'];
const TAB_LABELS: Record<FilterTab, string> = {
  Tous: 'Tous', client: 'Clients', expert: 'Experts',
  artisan: 'Artisans', manufacturer: 'Fabricants', admin: 'Admins',
};
const PAGE_SIZE = 12;

const UsersList = () => {
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<FilterTab>('Tous');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);

  useEffect(() => {
    userService.getAll()
      .then(r => setUsers(r.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [filter, search]);

  const filtered = useMemo(() => {
    let list = users;
    if (filter !== 'Tous') list = list.filter(u => u.role === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.nom.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.telephone?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = TABS.reduce<Record<FilterTab, number>>((acc, t) => {
    acc[t] = t === 'Tous' ? users.length : users.filter(u => u.role === t).length;
    return acc;
  }, {} as Record<FilterTab, number>);

  return (
    <div className="os-page">
      {/* ── Header ── */}
      <div className="os-page-header os-animate">
        <div>
          <div className="os-page-eyebrow">Utilisateurs</div>
          <h1 className="os-page-title">Gestion des Utilisateurs</h1>
          <p className="os-page-subtitle">
            {users.length} utilisateur{users.length !== 1 ? 's' : ''} inscrits sur la plateforme
          </p>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="os-card os-animate os-animate-d1">
        {/* Toolbar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="os-tabs">
            {TABS.filter(t => counts[t] > 0 || t === 'Tous').map(t => (
              <button
                key={t}
                className={`os-tab${filter === t ? ' active' : ''}`}
                onClick={() => setFilter(t)}
              >
                {TAB_LABELS[t]}
                {counts[t] > 0 && (
                  <span style={{
                    marginLeft: 5, fontSize: 10, fontWeight: 700,
                    background: filter === t ? '#f1f5f9' : 'rgba(0,0,0,0.06)',
                    padding: '1px 5px', borderRadius: 99, color: '#64748b',
                  }}>
                    {counts[t]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="os-search-wrap" style={{ marginLeft: 'auto' }}>
            <IcoSearch />
            <input
              className="os-search-input"
              placeholder="Rechercher un utilisateur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="os-card-body no-pad">
          {loading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="os-skeleton" style={{ height: 48, borderRadius: 8 }} />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="os-empty">
              <div className="os-empty-icon"><IcoUsers /></div>
              <p className="os-empty-title">Aucun utilisateur trouvé</p>
              <p className="os-empty-sub">
                {search ? `Aucun résultat pour « ${search} »` : 'Aucun utilisateur dans cette catégorie.'}
              </p>
            </div>
          ) : (
            <div className="os-table-wrap">
              <table className="os-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Téléphone</th>
                    <th>Inscription</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            className="os-avatar"
                            style={{ background: avatarColor(u.nom) }}
                          >
                            {u.nom.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="os-table-name">{u.nom}</div>
                            <div className="os-table-sub">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="os-badge"
                          style={{
                            background: `${ROLE_COLORS[u.role] ?? '#64748b'}18`,
                            color: ROLE_COLORS[u.role] ?? '#64748b',
                          }}
                        >
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 12 }}>
                          <IcoPhone />
                          {u.telephone || '—'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 12 }}>
                          <IcoCalendar />
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </div>
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
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
            </span>
            <div className="os-pagination-controls">
              <button className="os-pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
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
                    <span key={`e${i}`} className="os-pagination-btn" style={{ cursor: 'default' }}>…</span>
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
              <button className="os-pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                <IcoChevRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersList;
