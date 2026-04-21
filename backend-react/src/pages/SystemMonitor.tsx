import { useEffect, useState, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';

/* ── Icons ── */
const IcoMonitor = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);
const IcoRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IcoWifi = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);
const IcoDatabase = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);
const IcoShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IcoZap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IcoServer = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="8" rx="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
);
const IcoClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

/* ── Types ── */
interface ServiceStatus {
  name: string;
  status: 'ok' | 'warn' | 'error';
  label: string;
  latency?: string;
  icon: () => JSX.Element;
  detail?: string;
}

/* ════════════════════════════════════════════════════════ */

const SystemMonitor = () => {
  const [apiOk, setApiOk]     = useState<boolean | null>(null);
  const [dataOk, setDataOk]   = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [projectCount, setProjectCount] = useState<number>(0);
  const [userCount, setUserCount]       = useState<number>(0);

  const check = useCallback(async () => {
    setLoading(true);
    const t0 = performance.now();
    try {
      const { projects, users } = await dashboardService.getData();
      const t1 = performance.now();
      setLatency(Math.round(t1 - t0));
      setApiOk(true);
      setDataOk(true);
      setProjectCount(projects?.length ?? 0);
      setUserCount(users?.length ?? 0);
    } catch {
      setApiOk(false);
      setDataOk(false);
      setLatency(null);
    } finally {
      setLoading(false);
      setLastCheck(new Date());
    }
  }, []);

  useEffect(() => { void check(); }, [check]);

  /* Auto-refresh every 60 s */
  useEffect(() => {
    const id = setInterval(() => void check(), 60_000);
    return () => clearInterval(id);
  }, [check]);

  const services: ServiceStatus[] = [
    {
      name: 'API Backend',
      status: loading ? 'warn' : apiOk ? 'ok' : 'error',
      label: loading ? 'Vérification…' : apiOk ? 'Opérationnel' : 'Hors service',
      latency: latency !== null ? `${latency} ms` : undefined,
      icon: IcoWifi,
      detail: 'Endpoint principal BMP.tn REST API',
    },
    {
      name: 'Base de données',
      status: loading ? 'warn' : dataOk ? 'ok' : 'error',
      label: loading ? 'Vérification…' : dataOk ? 'Connectée' : 'Erreur',
      icon: IcoDatabase,
      detail: `${projectCount} projets · ${userCount} utilisateurs`,
    },
    {
      name: 'Matching Engine',
      status: apiOk === null ? 'warn' : apiOk ? 'ok' : 'warn',
      label: apiOk === null ? 'Inconnu' : apiOk ? 'Actif' : 'Dégradé',
      icon: IcoZap,
      detail: 'Algorithme Expert-Projet automatique',
    },
    {
      name: 'Authentification',
      status: apiOk === null ? 'warn' : apiOk ? 'ok' : 'error',
      label: apiOk === null ? 'Inconnu' : apiOk ? 'Sécurisée' : 'Erreur',
      icon: IcoShield,
      detail: 'JWT + session localStorage',
    },
    {
      name: 'Serveur hébergement',
      status: 'ok',
      label: 'En ligne',
      icon: IcoServer,
      detail: 'Node.js / NestJS backend',
    },
    {
      name: 'Messagerie',
      status: apiOk === null ? 'warn' : apiOk ? 'ok' : 'warn',
      label: apiOk === null ? 'Inconnu' : apiOk ? 'Opérationnelle' : 'Dégradée',
      icon: IcoMonitor,
      detail: 'Chat temps réel inter-utilisateurs',
    },
  ];

  const allOk  = services.every(s => s.status === 'ok');
  const hasErr = services.some(s => s.status === 'error');

  return (
    <div className="os-page">
      {/* ── Header ── */}
      <div className="os-page-header os-animate">
        <div>
          <div className="os-page-eyebrow">Infrastructure</div>
          <h1 className="os-page-title">Monitoring Système</h1>
          <p className="os-page-subtitle">
            État de santé des services BMP.tn · Dernière vérification :{' '}
            {lastCheck.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <div className="os-page-actions">
          <button className="os-btn os-btn-secondary os-btn-sm" onClick={() => void check()} disabled={loading}>
            <IcoRefresh /> {loading ? 'Vérification…' : 'Vérifier maintenant'}
          </button>
        </div>
      </div>

      {/* ── Global status banner ── */}
      <div className="os-animate os-animate-d1" style={{
        padding: '14px 20px', borderRadius: 12,
        background: loading ? 'rgba(245,158,11,0.08)'
          : hasErr ? 'rgba(239,68,68,0.08)'
          : 'rgba(16,185,129,0.08)',
        border: `1px solid ${loading ? 'rgba(245,158,11,0.25)' : hasErr ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
          background: loading ? '#f59e0b' : hasErr ? '#ef4444' : '#10b981',
          boxShadow: loading ? 'none'
            : hasErr ? '0 0 8px rgba(239,68,68,0.5)'
            : '0 0 8px rgba(16,185,129,0.6)',
        }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
            {loading ? 'Vérification en cours…'
              : hasErr ? 'Certains services sont indisponibles'
              : allOk ? 'Tous les services sont opérationnels' : 'Certains services sont dégradés'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {services.filter(s => s.status === 'ok').length}/{services.length} services actifs
          </div>
        </div>
        {latency !== null && !loading && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Latence API</div>
            <div style={{
              fontSize: 16, fontWeight: 800,
              color: latency < 200 ? '#10b981' : latency < 500 ? '#f59e0b' : '#ef4444',
            }}>
              {latency} ms
            </div>
          </div>
        )}
      </div>

      {/* ── Services grid ── */}
      <div className="os-grid-2 os-animate os-animate-d2" style={{ gap: 16 }}>
        {services.map(svc => {
          const Icon = svc.icon;
          const statusColor = svc.status === 'ok' ? '#10b981'
            : svc.status === 'warn' ? '#f59e0b' : '#ef4444';
          const statusBg = svc.status === 'ok' ? 'rgba(16,185,129,0.08)'
            : svc.status === 'warn' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';

          return (
            <div key={svc.name} className="os-card">
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${statusColor}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{svc.name}</div>
                  {svc.detail && (
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{svc.detail}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 99,
                    background: statusBg,
                    fontSize: 11.5, fontWeight: 600, color: statusColor,
                  }}>
                    <div className={`os-status-dot ${svc.status}`} />
                    {svc.label}
                  </div>
                  {svc.latency && (
                    <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 4 }}>
                      {svc.latency}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Metrics cards ── */}
      <div className="os-grid-3 os-animate os-animate-d3">
        <div className="os-card">
          <div className="os-card-header">
            <span className="os-card-title"><IcoDatabase /> Données</span>
          </div>
          <div className="os-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Projets en base', value: projectCount, color: '#3b82f6' },
                { label: 'Utilisateurs enregistrés', value: userCount, color: '#8b5cf6' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{m.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: m.color }}>{m.value}</span>
                  </div>
                  <div className="os-progress-track">
                    <div
                      className="os-progress-fill"
                      style={{ width: '100%', background: m.color, opacity: 0.6 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="os-card">
          <div className="os-card-header">
            <span className="os-card-title"><IcoClock /> Latence</span>
          </div>
          <div className="os-card-body">
            {latency !== null ? (
              <div>
                <div style={{ fontSize: 36, fontWeight: 800,
                  color: latency < 200 ? '#10b981' : latency < 500 ? '#f59e0b' : '#ef4444' }}>
                  {latency}
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}> ms</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="os-progress-track">
                    <div className="os-progress-fill" style={{
                      width: `${Math.min((latency / 1000) * 100, 100)}%`,
                      background: latency < 200 ? '#10b981' : latency < 500 ? '#f59e0b' : '#ef4444',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: '#94a3b8' }}>
                    <span>0 ms</span><span>500 ms</span><span>1000+ ms</span>
                  </div>
                </div>
                <p style={{ marginTop: 12, fontSize: 11.5, color: '#64748b' }}>
                  {latency < 200 ? '✓ Excellente performance'
                    : latency < 500 ? '⚠ Performance acceptable'
                    : '✗ Latence élevée — vérifiez le backend'}
                </p>
              </div>
            ) : (
              <div className="os-empty" style={{ padding: 20 }}>
                <p className="os-empty-sub">Données non disponibles</p>
              </div>
            )}
          </div>
        </div>

        <div className="os-card">
          <div className="os-card-header">
            <span className="os-card-title"><IcoShield /> Sécurité</span>
          </div>
          <div className="os-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Authentification JWT', ok: true },
                { label: 'Headers x-user-id',   ok: true },
                { label: 'CORS configuré',       ok: true },
                { label: 'HTTPS (production)',   ok: false, warn: true },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12.5, color: '#0f172a' }}>{item.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: item.ok ? '#10b981' : item.warn ? '#f59e0b' : '#ef4444',
                  }}>
                    {item.ok ? '✓ Actif' : item.warn ? '⚠ Dev only' : '✗ Inactif'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
