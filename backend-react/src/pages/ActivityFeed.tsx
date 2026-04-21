import { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { Project } from '../services/projectService';
import type { User } from '../services/userService';

/* ── Icons ── */
const IcoActivity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IcoFolder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

/* ── Activity event types ── */
interface ActivityEvent {
  id: string;
  type: 'project_created' | 'project_completed' | 'project_started' | 'user_joined';
  title: string;
  meta: string;
  time: string;
  color: string;
  Icon: () => JSX.Element;
}

function buildEvents(projects: Project[], users: User[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  projects.forEach(p => {
    if (p.createdAt) {
      events.push({
        id: `proj-created-${p._id}`,
        type: 'project_created',
        title: `Projet créé : ${p.titre}`,
        meta: `Budget : ${p.budget_estime.toLocaleString('fr-FR')} TND`,
        time: p.createdAt,
        color: '#3b82f6',
        Icon: IcoFolder,
      });
    }
    if (p.statut === 'Terminé' && p.createdAt) {
      events.push({
        id: `proj-done-${p._id}`,
        type: 'project_completed',
        title: `Projet terminé : ${p.titre}`,
        meta: `Avancement : ${p.avancement_global}%`,
        time: p.date_fin_prevue ?? p.createdAt,
        color: '#10b981',
        Icon: IcoCheck,
      });
    }
    if (p.statut === 'En cours' && p.createdAt) {
      events.push({
        id: `proj-started-${p._id}`,
        type: 'project_started',
        title: `Projet démarré : ${p.titre}`,
        meta: `Date début : ${new Date(p.date_debut).toLocaleDateString('fr-FR')}`,
        time: p.date_debut,
        color: '#6366f1',
        Icon: IcoActivity,
      });
    }
  });

  users.forEach(u => {
    if (u.createdAt) {
      events.push({
        id: `user-${u._id}`,
        type: 'user_joined',
        title: `Nouvel utilisateur : ${u.nom}`,
        meta: `Rôle : ${u.role} · ${u.email}`,
        time: u.createdAt,
        color: '#8b5cf6',
        Icon: IcoUser,
      });
    }
  });

  return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)   return "à l'instant";
  if (mins < 60)  return `il y a ${mins} min`;
  if (hrs < 24)   return `il y a ${hrs} h`;
  if (days < 30)  return `il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ════════════════════════════════════════════════════════ */

type EventFilter = 'Tous' | 'Projets' | 'Utilisateurs';

const ActivityFeed = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<EventFilter>('Tous');
  const [shown, setShown]       = useState(15);

  const reload = () => {
    setLoading(true);
    dashboardService.getData()
      .then(({ projects: p, users: u }) => { setProjects(p || []); setUsers(u || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const allEvents = buildEvents(projects, users);
  const filtered = allEvents.filter(e => {
    if (filter === 'Projets')      return e.type !== 'user_joined';
    if (filter === 'Utilisateurs') return e.type === 'user_joined';
    return true;
  });
  const visible = filtered.slice(0, shown);

  return (
    <div className="os-page">
      {/* ── Header ── */}
      <div className="os-page-header os-animate">
        <div>
          <div className="os-page-eyebrow">Activité</div>
          <h1 className="os-page-title">Journal d'Activité</h1>
          <p className="os-page-subtitle">
            {allEvents.length} événements · Activité en temps réel de la plateforme
          </p>
        </div>
        <div className="os-page-actions">
          <button className="os-btn os-btn-secondary os-btn-sm" onClick={reload}>
            <IcoRefresh /> Actualiser
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="os-kpi-grid os-animate os-animate-d1">
        {[
          { label: 'Total événements', value: allEvents.length, color: '#3b82f6' },
          { label: 'Projets créés',    value: projects.length,  color: '#6366f1' },
          { label: 'Projets actifs',   value: projects.filter(p => p.statut === 'En cours').length, color: '#10b981' },
          { label: 'Utilisateurs',     value: users.length,     color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="os-kpi">
            <div className="os-kpi-accent" style={{ background: s.color }} />
            <div className="os-kpi-label">{s.label}</div>
            <div className="os-kpi-value" style={{ marginTop: 8 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Feed card ── */}
      <div className="os-card os-animate os-animate-d2">
        {/* Toolbar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="os-tabs">
            {(['Tous','Projets','Utilisateurs'] as EventFilter[]).map(t => (
              <button
                key={t}
                className={`os-tab${filter === t ? ' active' : ''}`}
                onClick={() => { setFilter(t); setShown(15); }}
              >
                {t}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
            {filtered.length} événement{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Timeline */}
        <div className="os-card-body no-pad">
          {loading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div className="os-skeleton" style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="os-skeleton" style={{ height: 13, width: '60%', marginBottom: 6 }} />
                    <div className="os-skeleton" style={{ height: 11, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="os-empty">
              <div className="os-empty-icon"><IcoActivity /></div>
              <p className="os-empty-title">Aucune activité</p>
              <p className="os-empty-sub">Les événements apparaîtront ici au fil du temps.</p>
            </div>
          ) : (
            <div className="os-timeline">
              {visible.map((ev, idx) => {
                const Icon = ev.Icon;
                return (
                  <div key={ev.id} className={`os-timeline-item os-animate os-animate-d${Math.min(idx + 1, 4)}`}>
                    <div className="os-timeline-dot" style={{ background: `${ev.color}18` }}>
                      <Icon />
                    </div>
                    <div className="os-timeline-body">
                      <div className="os-timeline-title">{ev.title}</div>
                      <div className="os-timeline-meta">{ev.meta}</div>
                    </div>
                    <div className="os-timeline-time">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IcoClock />
                        {timeAgo(ev.time)}
                      </div>
                      <div style={{ marginTop: 3, color: '#cbd5e1', fontSize: 10 }}>
                        {new Date(ev.time).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Load more */}
        {!loading && shown < filtered.length && (
          <div className="os-card-footer" style={{ textAlign: 'center' }}>
            <button
              className="os-btn os-btn-ghost os-btn-sm"
              onClick={() => setShown(s => s + 15)}
            >
              Charger plus ({filtered.length - shown} restants)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
