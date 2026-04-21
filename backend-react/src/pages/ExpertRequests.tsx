import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './ExpertRequests.css';

type RequestItem = {
  _id: string;
  status: 'pending' | 'accepted' | 'refused';
  isExpired?: boolean;
  matchScore?: number;
  requiredCompetences?: string[];
  sentAt?: string;
  projectId?: {
    _id?: string;
    titre?: string;
    nom?: string;
    description?: string;
  };
};

const ExpertRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pending = useMemo(
    () => requests.filter((r) => r.status === 'pending' && !r.isExpired),
    [requests],
  );
  const done = useMemo(
    () => requests.filter((r) => r.status !== 'pending' || r.isExpired),
    [requests],
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<RequestItem[]>('/matching/my-requests');
      setRequests(res.data || []);
    } catch (e) {
      console.error('Error loading expert requests:', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const respond = async (requestId: string, response: 'accepted' | 'refused') => {
    setErrors((prev) => ({ ...prev, [requestId]: '' }));
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const res = await api.patch(`/matching/respond/${requestId}`, { response });
      const updated = res.data as any;
      setRequests((prev) =>
        prev.map((r) =>
          r._id === requestId ? { ...r, status: updated.status, respondedAt: updated.respondedAt } : r,
        ),
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Erreur';
      setErrors((prev) => ({ ...prev, [requestId]: msg }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  if (user?.role !== 'expert') {
    return (
      <div className="expert-requests">
        <div className="page-header">
          <h1>Mes demandes de matching</h1>
        </div>
        <div className="empty-state">
          <p>Page réservée aux experts.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    // DESIGN FIX : conteneur chargement cohérent thème dark
    return (
      <div className="loading expert-requests-loading">Chargement des demandes...</div>
    );
  }

  return (
    <div className="expert-requests">
      <div className="page-header">
        <h1>Mes demandes de matching</h1>
      </div>

      <section className="requests-section">
        <h2>Demandes en attente</h2>
        {pending.length === 0 ? (
          <div className="empty-state">
            <p>Aucune demande en attente.</p>
          </div>
        ) : (
          <div className="request-cards">
            {pending.map((r) => {
              const title = r?.projectId?.titre || r?.projectId?.nom || 'Projet';
              const desc = r?.projectId?.description || '';
              const isLoading = !!actionLoading[r._id];
              const err = errors[r._id];
              const comps = Array.isArray(r.requiredCompetences) ? r.requiredCompetences : [];
              const score = typeof r.matchScore === 'number' ? `${r.matchScore}/100` : '-';

              return (
                <div key={r._id} className="request-card">
                  <div className="request-top">
                    <div>
                      <h3>{title}</h3>
                      <p className="desc">{desc}</p>
                    </div>
                    <div className="score">{score}</div>
                  </div>

                  <div className="tags">
                    {comps.map((c) => (
                      <span key={c} className="tag">
                        {c}
                      </span>
                    ))}
                  </div>

                  {err && <div className="inline-error">{err}</div>}

                  <div className="actions">
                    <button
                      className="btn btn-success"
                      disabled={isLoading}
                      onClick={() => respond(r._id, 'accepted')}
                    >
                      {isLoading ? '...' : 'Accepter ✓'}
                    </button>
                    <button
                      className="btn btn-danger"
                      disabled={isLoading}
                      onClick={() => respond(r._id, 'refused')}
                    >
                      {isLoading ? '...' : 'Refuser ✗'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="requests-section">
        <h2>Demandes traitées</h2>
        {done.length === 0 ? (
          <div className="empty-state">
            <p>Aucune demande traitée.</p>
          </div>
        ) : (
          <div className="request-cards">
            {done.map((r) => {
              const title = r?.projectId?.titre || r?.projectId?.nom || 'Projet';
              const desc = r?.projectId?.description || '';
              const comps = Array.isArray(r.requiredCompetences) ? r.requiredCompetences : [];
              const score = typeof r.matchScore === 'number' ? `${r.matchScore}/100` : '-';
              const displayStatus = r.isExpired && r.status === 'pending' ? 'refused' : r.status;

              return (
                <div key={r._id} className="request-card">
                  <div className="request-top">
                    <div>
                      <h3>{title}</h3>
                      <p className="desc">{desc}</p>
                    </div>
                    <div className="right">
                      <span className={`status ${displayStatus}`}>{displayStatus}</span>
                      <div className="score">{score}</div>
                    </div>
                  </div>

                  <div className="tags">
                    {comps.map((c) => (
                      <span key={c} className="tag">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ExpertRequests;

