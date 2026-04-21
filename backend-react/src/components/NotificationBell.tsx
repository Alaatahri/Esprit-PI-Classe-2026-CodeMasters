import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';

type InboxNotification = {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: string;
  projectId?: string;
};

type InboxAlert = {
  _id: string;
  expectedProgress: number;
  realProgress: number;
  daysRemaining: number;
  status: string;
  alertDate?: string;
  projectId?: { _id?: string; titre?: string } | string;
};

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function projectTitle(alert: InboxAlert): string {
  const p = alert.projectId;
  if (p && typeof p === 'object' && 'titre' in p) {
    return String((p as { titre?: string }).titre || 'Projet');
  }
  return 'Projet';
}

/**
 * Cloche + badge « Nouveau » et panneau notifications / alertes (API Nest).
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [alerts, setAlerts] = useState<InboxAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try {
      const { data } = await api.get<{
        total: number;
        notificationsUnread: number;
        alertsPending: number;
      }>('/notifications/unread-count');
      setTotalUnread(typeof data?.total === 'number' ? data.total : 0);
    } catch {
      setTotalUnread(0);
    }
  }, []);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{
        notifications: InboxNotification[];
        alerts: InboxAlert[];
      }>('/notifications/inbox');
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setAlerts(Array.isArray(data?.alerts) ? data.alerts : []);
    } catch {
      setNotifications([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCount();
    const t = setInterval(() => void refreshCount(), 45000);
    return () => clearInterval(t);
  }, [refreshCount]);

  useEffect(() => {
    if (open) {
      void loadInbox();
      void refreshCount();
    }
  }, [open, loadInbox, refreshCount]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      void refreshCount();
    } catch {
      /* ignore */
    }
  };

  const typeStyle = (type: string) => {
    if (type === 'delay_alert') return 'notif-type delay';
    if (type === 'progress_update') return 'notif-type progress';
    if (type === 'no_progress') return 'notif-type noprogress';
    return 'notif-type';
  };

  return (
    <div className="notification-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notification-bell-trigger"
        onClick={() => setOpen((v) => !v)}
        title="Notifications et alertes"
        aria-expanded={open}
      >
        <span className="notification-bell-icon" aria-hidden>
          🔔
        </span>
        <span className="notification-bell-text">Notifications</span>
        {totalUnread > 0 ? (
          <span className="notification-bell-badge">
            Nouveau
            <span className="notification-bell-count">{totalUnread}</span>
          </span>
        ) : null}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <h3>Notifications &amp; alertes</h3>
            <button
              type="button"
              className="notification-panel-close"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          {loading ? (
            <p className="notification-panel-loading">Chargement…</p>
          ) : (
            <div className="notification-panel-body">
              <section className="notification-section">
                <h4>Notifications</h4>
                {notifications.length === 0 ? (
                  <p className="notification-empty">Aucune notification.</p>
                ) : (
                  <ul className="notification-list">
                    {notifications.map((n) => (
                      <li
                        key={n._id}
                        className={`notification-item ${n.read ? 'read' : 'unread'}`}
                      >
                        <span className={typeStyle(n.type)}>{n.type}</span>
                        <p className="notification-msg">{n.message}</p>
                        <div className="notification-meta">
                          <time>{formatDate(n.createdAt)}</time>
                          {!n.read && (
                            <button
                              type="button"
                              className="notification-mark-read"
                              onClick={() => void markRead(n._id)}
                            >
                              Marquer lu
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="notification-section">
                <h4>Alertes retard (en attente)</h4>
                {alerts.length === 0 ? (
                  <p className="notification-empty">Aucune alerte en attente.</p>
                ) : (
                  <ul className="notification-list">
                    {alerts.map((a) => (
                      <li key={a._id} className="notification-item alert-item">
                        <span className="notif-type delay">alerte</span>
                        <p className="notification-msg">
                          <strong>{projectTitle(a)}</strong> — réel{' '}
                          {Number(a.realProgress).toFixed(1)}% vs attendu ~{' '}
                          {Number(a.expectedProgress).toFixed(1)}% (≈{' '}
                          {Number(a.daysRemaining).toFixed(1)} j. restants)
                        </p>
                        <div className="notification-meta">
                          <time>{formatDate(a.alertDate)}</time>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
