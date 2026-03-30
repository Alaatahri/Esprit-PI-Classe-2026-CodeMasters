import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AiMatchRow } from '../services/matchingService';
import './ExpertMatchCard.css';

function workerTypeBadgeClass(wt: string | undefined) {
  const k = (wt || '').toLowerCase();
  if (k === 'artisan') return 'emc-wt emc-wt--artisan';
  if (k === 'ouvrier') return 'emc-wt emc-wt--ouvrier';
  if (k === 'electricien') return 'emc-wt emc-wt--electricien';
  if (k === 'expert') return 'emc-wt emc-wt--expert';
  if (k === 'architecte') return 'emc-wt emc-wt--architecte';
  return 'emc-wt emc-wt--artisan';
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const r = 40;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="emc-ring">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#ede8e0" strokeWidth="10" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#7C4A3A"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="54" textAnchor="middle" fontSize="1.1rem" fontWeight="700" fill="#1A0A02">
        {pct.toFixed(0)}%
      </text>
    </svg>
  );
}

function BreakdownBars({ b }: { b: AiMatchRow['breakdown'] }) {
  const rows: { label: string; weight: string; val: number; color: string }[] = [
    { label: 'Compétences', weight: '35%', val: b?.skills ?? 0, color: '#7C4A3A' },
    { label: 'Réputation', weight: '25%', val: b?.reputation ?? 0, color: '#B8860B' },
    { label: 'Proximité', weight: '20%', val: b?.location ?? 0, color: '#2E6B4F' },
    { label: 'Expérience', weight: '15%', val: b?.experience ?? 0, color: '#2E4A6B' },
    { label: 'Disponibilité', weight: '5%', val: b?.availability ?? 0, color: '#6B2E6B' },
  ];
  return (
    <div className="emc-bars">
      {rows.map((row) => (
        <div key={row.label} className="emc-bar-row">
          <span className="emc-bar-label">
            {row.label} {row.weight}
          </span>
          <div className="emc-bar-track">
            <div
              className="emc-bar-fill"
              style={{
                width: `${Math.round((row.val || 0) * 100)}%`,
                background: row.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function useExpiryMs(expiresAt: string | undefined) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) {
      setMs(null);
      return;
    }
    const tick = () => {
      const end = new Date(expiresAt).getTime();
      setMs(Math.max(0, end - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);
  return ms;
}

function formatHm(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

const workerTypeLabel = (wt: string | undefined) => {
  const k = (wt || '').toLowerCase();
  if (k === 'electricien') return 'Électricien';
  if (k === 'architecte') return 'Architecte';
  if (k === 'ouvrier') return 'Ouvrier';
  if (k === 'expert') return 'Expert';
  if (k === 'artisan') return 'Artisan';
  return wt || '—';
};

function resolveWorkerId(m: AiMatchRow): string {
  const w = m.worker as { _id?: string } | null | undefined;
  const raw = m.workerId ?? w?._id;
  if (raw == null) return '';
  return typeof raw === 'string' ? raw : String(raw);
}

export default function ExpertMatchCard({ match }: { match: AiMatchRow }) {
  const wt = match.worker?.workerType || match.workerType;
  const name = match.worker?.name || 'Travailleur';
  const expY = match.worker?.experienceYears ?? 0;
  const wid = resolveWorkerId(match);
  const st = match.status || 'pending';
  const leftMs = useExpiryMs(match.expiresAt);
  const expired = match.expiresAt ? new Date(match.expiresAt).getTime() <= Date.now() : false;

  return (
    <article className="emc-card">
      <div className="emc-card__head">
        <div>
          <h3 className="emc-name">{name}</h3>
          {expY > 0 ? <p className="emc-exp">💼 {expY} ans d&apos;expérience</p> : null}
        </div>
        <span className={workerTypeBadgeClass(wt)}>{workerTypeLabel(wt)}</span>
      </div>

      <div className="emc-score-row">
        <ScoreRing score={match.score ?? 0} />
        <BreakdownBars b={match.breakdown} />
      </div>

      {match.explanation ? (
        <div className="emc-explain">{match.explanation}</div>
      ) : null}

      <div className="emc-status-wrap">
        {st === 'pending' && !expired && (leftMs == null || leftMs > 0) && (
          <span className="emc-status emc-status--wait">
            🟡 En attente — expire dans {leftMs != null ? formatHm(leftMs) : '…'}
          </span>
        )}
        {st === 'pending' && expired && (
          <span className="emc-status emc-status--exp">⏰ Expiré</span>
        )}
        {st === 'accepted' && (
          <span className="emc-status emc-status--ok">🟢 ✓ Accepté</span>
        )}
        {st === 'rejected' && (
          <span className="emc-status emc-status--no">🔴 ✗ Refusé</span>
        )}
        {st === 'expired' && (
          <span className="emc-status emc-status--exp">⏰ Expiré</span>
        )}
      </div>

      {wid && st === 'pending' && !expired && (
        <div className="emc-worker-link-wrap">
          <Link className="emc-worker-link" to={`/worker/dashboard?workerId=${encodeURIComponent(wid)}`}>
            Ouvrir le tableau de bord travailleur (répondre au projet) →
          </Link>
          <span className="emc-worker-hint">
            Le travailleur doit être connecté avec cet identifiant ; la liste se rafraîchit toutes les 20 s.
          </span>
        </div>
      )}
    </article>
  );
}
