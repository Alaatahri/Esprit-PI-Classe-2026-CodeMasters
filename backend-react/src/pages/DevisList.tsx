import { useEffect, useState } from 'react';
import devisService, { Devis } from '../services/devisService';
import './DevisList.css';

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string; icon: string }> = {
  accepté:   { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: 'Accepté',   icon: '✓' },
  envoyé:    { color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', label: 'Envoyé',    icon: '●' },
  brouillon: { color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', label: 'Brouillon', icon: '○' },
  refusé:    { color: '#dc2626', bg: '#fff1f2', border: '#fca5a5', label: 'Refusé',    icon: '✕' },
  expiré:    { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', label: 'Expiré',    icon: '⚠' },
};

const DevisList = () => {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [filtered, setFiltered] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('Tous');

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = devis;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        d =>
          d.titre?.toLowerCase().includes(q) ||
          d.numero_devis?.toLowerCase().includes(q) ||
          d.temp_client_nom?.toLowerCase().includes(q)
      );
    }
    if (filterStatut !== 'Tous') {
      const map: Record<string, string> = {
        Brouillons: 'brouillon',
        Envoyés: 'envoyé',
        Acceptés: 'accepté',
        Refusés: 'refusé',
        Expirés: 'expiré',
      };
      result = result.filter(d => d.statut === (map[filterStatut] || filterStatut.toLowerCase()));
    }
    setFiltered(result);
  }, [devis, search, filterStatut]);

  const load = async () => {
    try {
      const res = await devisService.getAll();
      setDevis(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error('Erreur chargement devis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce devis ?')) return;
    try {
      await devisService.remove(id);
      setDevis(prev => prev.filter(d => d._id !== id));
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  // Computed stats
  const total      = devis.length;
  const acceptes   = devis.filter(d => d.statut === 'accepté').length;
  const envoyes    = devis.filter(d => d.statut === 'envoyé').length;
  const brouillons = devis.filter(d => d.statut === 'brouillon').length;
  const refuses    = devis.filter(d => d.statut === 'refusé').length;
  const valeurTotale = devis.reduce((s, d) => s + (d.total || 0), 0);
  const valeurAcceptee = devis.filter(d => d.statut === 'accepté').reduce((s, d) => s + (d.total || 0), 0);
  const acceptRate = total > 0 ? Math.round((acceptes / total) * 100) : 0;

  const handleExportPDF = () => {
    if (filtered.length === 0) {
      alert("Aucun devis à exporter.");
      return;
    }
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Rapport des Devis - BMP.tn</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            :root {
              --primary: #0f172a;
              --accent: #3b82f6;
              --text-main: #334155;
              --text-light: #64748b;
              --border: #e2e8f0;
              --bg-light: #f8fafc;
            }

            body { 
              font-family: 'Inter', -apple-system, sans-serif; 
              padding: 40px; 
              color: var(--text-main); 
              line-height: 1.5; 
              margin: 0;
            }
            
            /* Header */
            header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              border-bottom: 3px solid var(--primary); 
              padding-bottom: 24px; 
              margin-bottom: 32px; 
            }
            
            .brand {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            
            h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 800;
              text-transform: uppercase; 
              color: var(--primary); 
              letter-spacing: -0.5px;
            }
            
            .meta p {
              margin: 4px 0 0 0;
              font-size: 12px;
              color: var(--text-light);
              font-weight: 500;
            }
            
            .summary {
              text-align: right;
              background: var(--bg-light);
              padding: 12px 20px;
              border-radius: 8px;
              border: 1px solid var(--border);
            }
            
            .summary p { margin: 4px 0; }
            .summary-title { font-size: 11px; text-transform: uppercase; color: var(--text-light); font-weight: 600; letter-spacing: 0.5px; }
            .summary-val { font-size: 16px; font-weight: 800; color: var(--primary); }
            
            /* Table */
            table { 
              width: 100%; 
              border-collapse: separate; 
              border-spacing: 0;
              border: 1px solid var(--border);
              border-radius: 8px;
              overflow: hidden;
            }
            
            th { 
              text-align: left; 
              background: var(--primary); 
              padding: 14px 16px; 
              font-size: 11px; 
              text-transform: uppercase; 
              font-weight: 700;
              color: #ffffff; 
              letter-spacing: 0.5px;
            }
            
            td { 
              padding: 14px 16px; 
              border-bottom: 1px solid var(--border); 
              font-size: 13px; 
              color: var(--text-main);
              vertical-align: middle;
            }
            
            tr:last-child td { border-bottom: none; }
            tr:nth-child(even) { background-color: #fcfcfd; }
            
            .col-num { font-family: monospace; font-weight: 600; color: var(--text-light); }
            .col-title { font-weight: 600; color: var(--primary); }
            .montant { font-weight: 800; color: var(--primary); text-align: right; }
            
            /* Badges */
            .statut { 
              display: inline-block;
              font-weight: 700; 
              font-size: 10px; 
              padding: 4px 10px; 
              border-radius: 20px; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
            }
            .st-envoye { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
            .st-accepte { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
            .st-brouillon { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
            .st-refuse { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
            .st-expire { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
            .st-default { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
            
            /* Footer */
            footer { 
              margin-top: 48px; 
              padding-top: 16px;
              border-top: 1px solid var(--border);
              display: flex;
              justify-content: space-between;
              font-size: 11px; 
              color: var(--text-light); 
            }
            
            @media print {
              body { padding: 0; }
              @page { margin: 15mm; size: auto; }
            }
          </style>
        </head>
        <body>
          <header>
            <div class="brand">
              <div class="meta">
                <h1>Rapport des Devis</h1>
                <p>Édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
              </div>
            </div>
            <div class="summary">
              <p><span class="summary-title">Total Dossiers</span><br/><span class="summary-val">${filtered.length}</span></p>
              <p><span class="summary-title">Valeur Affichée</span><br/><span class="summary-val">${filtered.reduce((s, d) => s + (d.total || 0), 0).toLocaleString('fr-TN')} TND</span></p>
            </div>
          </header>
          
          <table>
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Titre du Devis</th>
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th style="text-align: right">Val. Totale</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(d => {
                const st = (d.statut || '').toLowerCase();
                let badgeClass = 'st-default';
                if (st === 'envoyé') badgeClass = 'st-envoye';
                else if (st === 'accepté') badgeClass = 'st-accepte';
                else if (st === 'brouillon') badgeClass = 'st-brouillon';
                else if (st === 'refusé') badgeClass = 'st-refuse';
                else if (st === 'expiré') badgeClass = 'st-expire';
                else if (st === 'en attente') badgeClass = 'st-expire'; // default yellow-ish
                
                return `
                <tr>
                  <td class="col-num">${d.numero_devis?.replace('DEV-', '') || '—'}</td>
                  <td class="col-title">${d.titre || 'Sans titre'}</td>
                  <td>${(d.temp_client_nom || '—')}</td>
                  <td>${d.date_creation ? new Date(d.date_creation).toLocaleDateString('fr-FR') : '—'}</td>
                  <td><span class="statut ${badgeClass}">${d.statut || '—'}</span></td>
                  <td class="montant">${(d.total || 0).toLocaleString('fr-TN')} TND</td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <footer>
            <span>Document confidentiel et sécurisé.</span>
            <strong>Propulsé par BMP.tn</strong>
          </footer>
        </body>
      </html>
    `;
    
    if (iframe.contentWindow) {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(content);
      iframe.contentWindow.document.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    }
  };

  if (loading) return (
    <div className="dv-loading">
      <div className="dv-spinner" />
      <span>Chargement des devis...</span>
    </div>
  );

  return (
    <div className="dv-container">

      {/* ── Header ── */}
      <div className="dv-header">
        <div className="dv-header-left">
          <div className="dv-header-icon">📋</div>
          <div>
            <h2 className="dv-title">Gestion des Devis</h2>
            <p className="dv-subtitle">Suivi de tous les devis de la plateforme</p>
          </div>
        </div>
        <button className="dv-btn-export" onClick={handleExportPDF}>⬇ Exporter Rapport</button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="dv-stats-grid">
        <div className="dv-stat-card dv-stat-indigo">
          <div className="dv-stat-icon-wrap">📋</div>
          <div className="dv-stat-body">
            <div className="dv-stat-label">TOTAL DEVIS</div>
            <div className="dv-stat-value">{total}</div>
          </div>
        </div>

        <div className="dv-stat-card dv-stat-green">
          <div className="dv-stat-icon-wrap">✅</div>
          <div className="dv-stat-body">
            <div className="dv-stat-label">ACCEPTÉS</div>
            <div className="dv-stat-value">{acceptes}</div>
          </div>
        </div>

        <div className="dv-stat-card dv-stat-blue">
          <div className="dv-stat-icon-wrap">📤</div>
          <div className="dv-stat-body">
            <div className="dv-stat-label">ENVOYÉS</div>
            <div className="dv-stat-value">{envoyes}</div>
          </div>
        </div>

        <div className="dv-stat-card dv-stat-slate">
          <div className="dv-stat-icon-wrap">📝</div>
          <div className="dv-stat-body">
            <div className="dv-stat-label">BROUILLONS</div>
            <div className="dv-stat-value">{brouillons}</div>
          </div>
        </div>

        <div className="dv-stat-card dv-stat-red">
          <div className="dv-stat-icon-wrap">❌</div>
          <div className="dv-stat-body">
            <div className="dv-stat-label">REFUSÉS</div>
            <div className="dv-stat-value">{refuses}</div>
          </div>
        </div>

        <div className="dv-stat-card dv-stat-orange">
          <div className="dv-stat-icon-wrap">💰</div>
          <div className="dv-stat-body">
            <div className="dv-stat-label">VALEUR TOTALE</div>
            <div className="dv-stat-value">{valeurTotale.toLocaleString('fr-TN')} <span className="dv-tnd">TND</span></div>
          </div>
        </div>
      </div>

      {/* ── Acceptance Rate Bar ── */}
      <div className="dv-rate-card">
        <div className="dv-rate-header">
          <span className="dv-rate-label">Taux d'acceptation des devis</span>
          <span className="dv-rate-pct">{acceptRate}%</span>
        </div>
        <div className="dv-rate-bar-bg">
          <div className="dv-rate-bar-fill" style={{ width: `${acceptRate}%` }} />
        </div>
        <div className="dv-rate-footer">
          <span>Acceptés : <strong>{acceptes} devis</strong></span>
          <span>Valeur acceptée : <strong>{valeurAcceptee.toLocaleString('fr-TN')} TND</strong></span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="dv-filters">
        <div className="dv-search-box">
          <span className="dv-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher par numéro, titre ou client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="dv-filter-tabs">
          {['Tous', 'Brouillons', 'Envoyés', 'Acceptés', 'Refusés', 'Expirés'].map(f => (
            <button
              key={f}
              className={`dv-filter-tab ${filterStatut === f ? 'active' : ''}`}
              onClick={() => setFilterStatut(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table / Empty ── */}
      {filtered.length === 0 ? (
        <div className="dv-empty">
          <div className="dv-empty-icon">📭</div>
          <div>Aucun devis trouvé.</div>
        </div>
      ) : (
        <div className="dv-table-wrapper">
          <table className="dv-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Titre &amp; Description</th>
                <th>Client</th>
                <th>Date Création</th>
                <th>Valeur Totale</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const sc = statusConfig[d.statut] || { color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', label: d.statut || '—', icon: '○' };
                return (
                  <tr key={d._id}>
                    <td>
                      <span className="dv-num-badge">DEV</span>
                      <span className="dv-num">{d.numero_devis?.replace('DEV-', '')}</span>
                    </td>
                    <td>
                      <div className="dv-titre">{d.titre || 'Sans titre'}</div>
                      <div className="dv-desc">{d.description || 'Aucune description'}</div>
                    </td>
                    <td>
                      <div className="dv-client-nom">{d.temp_client_nom || '—'}</div>
                      <div className="dv-client-email">{d.temp_client_email || ''}</div>
                    </td>
                    <td>
                      <div className="dv-date">{d.date_creation ? new Date(d.date_creation).toLocaleDateString('fr-FR') : '—'}</div>
                    </td>
                    <td>
                      <span className="dv-montant">{(d.total || 0).toLocaleString('fr-TN')} TND</span>
                    </td>
                    <td>
                      <span
                        className="dv-statut-badge"
                        style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
                      >
                        <span>{sc.icon}</span>
                        {sc.label}
                      </span>
                    </td>
                    <td>
                      <button className="dv-btn-delete" onClick={() => handleDelete(d._id)}>
                        🗑 Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DevisList;
