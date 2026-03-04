import { useEffect, useState } from 'react';
import api from '../services/api';
import projectService, { Project } from '../services/projectService';
import './AiMatching.css';

interface ExpertMatch {
  expert_id: string;
  nom: string;
  email: string;
  role: string;
  competences: string[];
  rating_moyen: number;
  nombre_avis: number;
  projets_termines: number;
  pourcentage: number;
  competences_matchees: string[];
  recommandation: string;
}

const COMPETENCES_DISPONIBLES = [
  'plomberie', 'electricite', 'carrelage', 'maconnerie',
  'peinture', 'menuiserie', 'climatisation', 'toiture',
  'isolation', 'terrassement', 'architecture', 'renovation',
];

const AiMatching = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedCompetences, setSelectedCompetences] = useState<string[]>([]);
  const [topN, setTopN] = useState(3);
  const [results, setResults] = useState<ExpertMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState('');
  const [flaskStatus, setFlaskStatus] = useState<'ok' | 'indisponible' | 'checking'>('checking');

  useEffect(() => {
    loadProjects();
    checkHealth();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAll();
      setProjects(response.data);
    } catch {
      setError('Impossible de charger les projets.');
    } finally {
      setLoadingProjects(false);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await api.get('/ai-matching/health');
      setFlaskStatus(res.data.python_flask === 'ok' ? 'ok' : 'indisponible');
    } catch {
      setFlaskStatus('indisponible');
    }
  };

  const toggleCompetence = (comp: string) => {
    setSelectedCompetences(prev =>
      prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]
    );
  };

  const lancerMatching = async () => {
    if (!selectedProject) { setError('Sélectionne un projet.'); return; }
    if (selectedCompetences.length === 0) { setError('Sélectionne au moins une compétence.'); return; }
    setError('');
    setLoading(true);
    setResults([]);
    try {
      const res = await api.post(`/ai-matching/projet/${selectedProject}/match`, {
        competences_requises: selectedCompetences,
        top_n: topN,
      });
      if (res.data.success) {
        setResults(res.data.experts_recommandes);
        if (res.data.experts_recommandes.length === 0) {
          setError('Aucun expert trouvé. Ajoutez des compétences aux experts via PUT /api/users/:id');
        }
      } else {
        setError(res.data.message || 'Erreur lors du matching.');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return '#10b981';
    if (pct >= 60) return '#f59e0b';
    if (pct >= 40) return '#f97316';
    return '#ef4444';
  };

  const getRank = (index: number) => {
    const medals = ['🥇', '🥈', '🥉'];
    return medals[index] || `#${index + 1}`;
  };

  return (
    <div className="ai-matching">
      {/* Header */}
      <div className="aim-header">
        <div className="aim-header-left">
          <div className="aim-icon">🤖</div>
          <div>
            <h1>Expert Matching IA</h1>
            <p>Trouvez automatiquement les meilleurs experts pour vos projets</p>
          </div>
        </div>
        <div className={`aim-status ${flaskStatus}`}>
          <span className="status-dot" />
          <span>
            {flaskStatus === 'checking' && 'Vérification...'}
            {flaskStatus === 'ok' && 'Service IA actif'}
            {flaskStatus === 'indisponible' && 'Service IA hors ligne'}
          </span>
        </div>
      </div>

      {flaskStatus === 'indisponible' && (
        <div className="aim-alert warning">
          ⚠️ Le service Python Flask n'est pas démarré. Lance <code>python app.py</code> dans le dossier <code>ai-service/</code>
        </div>
      )}

      <div className="aim-body">
        {/* Panneau de configuration */}
        <div className="aim-config-panel">
          <h2>Configuration du matching</h2>

          {/* Sélection du projet */}
          <div className="aim-field">
            <label>1. Sélectionner un projet</label>
            {loadingProjects ? (
              <div className="aim-skeleton" />
            ) : (
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="aim-select"
              >
                <option value="">-- Choisir un projet --</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.titre} — {p.statut}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Compétences requises */}
          <div className="aim-field">
            <label>2. Compétences requises</label>
            <div className="aim-competences-grid">
              {COMPETENCES_DISPONIBLES.map(comp => (
                <button
                  key={comp}
                  className={`aim-comp-tag ${selectedCompetences.includes(comp) ? 'selected' : ''}`}
                  onClick={() => toggleCompetence(comp)}
                >
                  {comp}
                </button>
              ))}
            </div>
            {selectedCompetences.length > 0 && (
              <p className="aim-selected-info">
                ✅ {selectedCompetences.length} compétence(s) sélectionnée(s) : {selectedCompetences.join(', ')}
              </p>
            )}
          </div>

          {/* Top N */}
          <div className="aim-field">
            <label>3. Nombre de résultats</label>
            <div className="aim-topn-buttons">
              {[1, 2, 3, 5].map(n => (
                <button
                  key={n}
                  className={`aim-topn-btn ${topN === n ? 'selected' : ''}`}
                  onClick={() => setTopN(n)}
                >
                  Top {n}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="aim-alert error">{error}</div>}

          <button
            className="aim-launch-btn"
            onClick={lancerMatching}
            disabled={loading || flaskStatus === 'indisponible'}
          >
            {loading ? (
              <span className="aim-spinner" />
            ) : (
              <>🔍 Lancer le matching IA</>
            )}
          </button>
        </div>

        {/* Résultats */}
        <div className="aim-results-panel">
          <h2>
            Résultats
            {results.length > 0 && <span className="aim-badge">{results.length} expert(s)</span>}
          </h2>

          {!loading && results.length === 0 && (
            <div className="aim-empty">
              <div className="aim-empty-icon">🎯</div>
              <p>Lance le matching pour voir les experts recommandés</p>
            </div>
          )}

          {loading && (
            <div className="aim-loading">
              <div className="aim-spinner large" />
              <p>Analyse IA en cours...</p>
            </div>
          )}

          <div className="aim-cards">
            {results.map((expert, i) => (
              <div key={expert.expert_id} className="aim-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="aim-card-header">
                  <div className="aim-rank">{getRank(i)}</div>
                  <div className="aim-card-info">
                    <h3>{expert.nom}</h3>
                    <span className={`aim-role-badge ${expert.role}`}>{expert.role}</span>
                  </div>
                  <div className="aim-score-circle" style={{ '--score-color': getScoreColor(expert.pourcentage) } as any}>
                    <span className="score-value">{expert.pourcentage}%</span>
                    <span className="score-label">match</span>
                  </div>
                </div>

                <div className="aim-recommandation">
                  {expert.recommandation}
                </div>

                <div className="aim-progress-bar">
                  <div
                    className="aim-progress-fill"
                    style={{
                      width: `${expert.pourcentage}%`,
                      backgroundColor: getScoreColor(expert.pourcentage)
                    }}
                  />
                </div>

                <div className="aim-card-stats">
                  <div className="aim-stat">
                    <span className="stat-icon">⭐</span>
                    <span>{expert.rating_moyen > 0 ? `${expert.rating_moyen}/5` : 'N/A'}</span>
                    <span className="stat-label">({expert.nombre_avis} avis)</span>
                  </div>
                  <div className="aim-stat">
                    <span className="stat-icon">✅</span>
                    <span>{expert.projets_termines}</span>
                    <span className="stat-label">projets</span>
                  </div>
                  <div className="aim-stat">
                    <span className="stat-icon">📧</span>
                    <span className="stat-email">{expert.email}</span>
                  </div>
                </div>

                {expert.competences_matchees.length > 0 && (
                  <div className="aim-matched-skills">
                    <span className="matched-label">Compétences matchées :</span>
                    <div className="matched-tags">
                      {expert.competences_matchees.map(c => (
                        <span key={c} className="matched-tag">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {expert.competences.length > 0 && (
                  <div className="aim-all-skills">
                    <span className="all-label">Toutes les compétences :</span>
                    <div className="all-tags">
                      {expert.competences.map(c => (
                        <span key={c} className={`all-tag ${expert.competences_matchees.includes(c) ? 'highlight' : ''}`}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiMatching;
