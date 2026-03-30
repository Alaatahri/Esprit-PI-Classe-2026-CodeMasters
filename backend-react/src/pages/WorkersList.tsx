import { useEffect, useState } from 'react';
import { fetchWorkers, type WorkerRow } from '../services/workersService';
import './UsersList.css';
import './WorkersList.css';

function workerTypeColor(wt: string) {
  const k = wt?.toLowerCase() || '';
  if (k === 'expert') return '#2E4A6B';
  if (k === 'electricien') return '#B8860B';
  if (k === 'architecte') return '#6B2E6B';
  if (k === 'ouvrier') return '#7f8c8d';
  return '#7C4A3A';
}

export default function WorkersList() {
  const [rows, setRows] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchWorkers();
        setRows(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="loading">Chargement du répertoire travailleurs…</div>;
  }

  return (
    <div className="users-list workers-page">
      <h1>Répertoire des travailleurs</h1>
      <p className="workers-page__intro">
        Même collection MongoDB <code>users</code> que la page Utilisateurs : ici sont listés uniquement les
        rôles <strong>terrain</strong> (artisan, expert, électricien, etc.) avec leurs champs métier
        (compétences, zone, disponibilité).
      </p>

      {rows.length === 0 ? (
        <div className="empty-state">
          <p>
            Aucun profil terrain en base. Lancez <code>npm run seed:workers</code> dans le dossier backend
            (Nest doit tourner sur le port 3001 — le front appelle <code>/api/workers</code> via le proxy Vite).
          </p>
        </div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Type</th>
                <th>Spécialité</th>
                <th>Exp. (ans)</th>
                <th>Note</th>
                <th>Zone</th>
                <th>Dispo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w._id}>
                  <td>{w.name}</td>
                  <td>{w.email ?? '—'}</td>
                  <td>
                    {w.workerType ? (
                      <span
                        className="role-badge"
                        style={{ backgroundColor: workerTypeColor(w.workerType) }}
                      >
                        {w.workerType}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{w.specialite ?? '—'}</td>
                  <td>{w.experienceYears ?? '—'}</td>
                  <td>{w.rating != null ? `${w.rating}/5` : '—'}</td>
                  <td>
                    {[w.location?.city, w.location?.gouvernorat].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td>{w.isAvailable === false ? 'Non' : 'Oui'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
