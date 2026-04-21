import { useEffect, useState } from 'react';
import paiementService, { Paiement, PaiementStats } from '../services/paiementService';
import './GestionPaiements.css';

const methodIcon: Record<string, string> = {
  carte: '💳',
  virement: '🏦',
  especes: '💵',
};

const GestionPaiements = () => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [filtered, setFiltered] = useState<Paiement[]>([]);
  const [stats, setStats] = useState<PaiementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('Tous');

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let result = paiements;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        p =>
          p.factureId?.numero_facture?.toLowerCase().includes(q) ||
          p.factureId?.temp_client_nom?.toLowerCase().includes(q) ||
          p.factureId?.temp_client_email?.toLowerCase().includes(q)
      );
    }
    if (filterMethod !== 'Tous') {
      const methodMap: Record<string, string> = { Cartes: 'carte', Virements: 'virement', Mobiles: 'especes' };
      result = result.filter(p => p.methode_paiement === methodMap[filterMethod]);
    }
    setFiltered(result);
  }, [paiements, search, filterMethod]);

  const load = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        paiementService.getAll(),
        paiementService.getStats(),
      ]);
      setPaiements(pRes.data);
      setFiltered(pRes.data);
      setStats(sRes.data);
    } catch (err) {
      console.error('Erreur chargement paiements:', err);
    } finally {
      setLoading(false);
    }
  };

  const genRef = (id: string) => 'TRX-' + id.slice(-6).toUpperCase();

  const paymentRate = stats && stats.sommeFactures > 0
    ? Math.min(100, Math.round((stats.sommePayee / stats.sommeFactures) * 100))
    : 0;

  const handleExport = () => {
    if (filtered.length === 0) return;
    const headers = ["Date", "Client", "Contact", "Facture", "Montant (TND)", "Methode", "Reference", "Etat"];
    const rows = filtered.map(p => {
      const d = new Date(p.date_paiement || p.createdAt);
      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      return [
        dateStr,
        (p.details?.nom || p.factureId?.temp_client_nom || '—').replace(/;/g, ' '),
        (p.details?.email || p.factureId?.temp_client_email || '—'),
        (p.factureId?.numero_facture || '—'),
        (p.montant || 0),
        (p.methode_paiement),
        genRef(p._id),
        "Validé"
      ];
    });

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rapport_paiements_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="gp-loading">
      <div className="gp-spinner" />
      <span>Chargement des paiements...</span>
    </div>
  );

  return (
    <div className="gp-container">
      {/* Header */}
      <div className="gp-header">
        <div className="gp-header-left">
          <div className="gp-header-icon">💰</div>
          <div>
            <h2 className="gp-title">Gestion des Paiements</h2>
            <p className="gp-subtitle">Suivi en temps réel des encaissements</p>
          </div>
        </div>
        <button className="gp-btn-export" onClick={handleExport}>
          <span>⬇</span> Exporter Rapport
        </button>
      </div>

      {/* Stats Grid */}
      <div className="gp-stats-grid">
        <div className="gp-stat-card gp-stat-orange">
          <div className="gp-stat-icon-wrap">🔥</div>
          <div className="gp-stat-body">
            <div className="gp-stat-label">VOLUME TOTAL</div>
            <div className="gp-stat-value">{(stats?.volumeTotal || 0).toLocaleString('fr-TN')} <span className="gp-tnd">TND</span></div>
          </div>
        </div>

        <div className="gp-stat-card gp-stat-blue">
          <div className="gp-stat-icon-wrap">📄</div>
          <div className="gp-stat-body">
            <div className="gp-stat-label">SOMME FACTURES</div>
            <div className="gp-stat-value">{(stats?.sommeFactures || 0).toLocaleString('fr-TN')} <span className="gp-tnd">TND</span></div>
          </div>
        </div>

        <div className="gp-stat-card gp-stat-green">
          <div className="gp-stat-icon-wrap">✅</div>
          <div className="gp-stat-body">
            <div className="gp-stat-label">TOTAL PAYÉ</div>
            <div className="gp-stat-value">{(stats?.sommePayee || 0).toLocaleString('fr-TN')} <span className="gp-tnd">TND</span></div>
          </div>
        </div>

        <div className="gp-stat-card gp-stat-indigo">
          <div className="gp-stat-icon-wrap">📋</div>
          <div className="gp-stat-body">
            <div className="gp-stat-label">TRANSACTIONS</div>
            <div className="gp-stat-value">{stats?.transactions || 0}</div>
          </div>
        </div>

        <div className="gp-stat-card gp-stat-purple">
          <div className="gp-stat-icon-wrap">🏦</div>
          <div className="gp-stat-body">
            <div className="gp-stat-label">VIREMENTS BANCAIRES</div>
            <div className="gp-stat-value">{stats?.virement || 0}</div>
          </div>
        </div>

        <div className="gp-stat-card gp-stat-teal">
          <div className="gp-stat-icon-wrap">💳</div>
          <div className="gp-stat-body">
            <div className="gp-stat-label">PAIEMENTS CARTE</div>
            <div className="gp-stat-value">{stats?.carte || 0}</div>
          </div>
        </div>
      </div>

      {/* Payment Rate Progress */}
      <div className="gp-rate-card">
        <div className="gp-rate-header">
          <span className="gp-rate-label">Taux de recouvrement</span>
          <span className="gp-rate-pct">{paymentRate}%</span>
        </div>
        <div className="gp-rate-bar-bg">
          <div className="gp-rate-bar-fill" style={{ width: `${paymentRate}%` }} />
        </div>
        <div className="gp-rate-footer">
          <span>Payé : <strong>{(stats?.sommePayee || 0).toLocaleString('fr-TN')} TND</strong></span>
          <span>Total factures : <strong>{(stats?.sommeFactures || 0).toLocaleString('fr-TN')} TND</strong></span>
        </div>
      </div>

      {/* Filters */}
      <div className="gp-filters">
        <div className="gp-search-box">
          <span className="gp-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher une facture ou un client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="gp-filter-tabs">
          {['Tous', 'Cartes', 'Virements', 'Mobiles'].map(f => (
            <button
              key={f}
              className={`gp-filter-tab ${filterMethod === f ? 'active' : ''}`}
              onClick={() => setFilterMethod(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="gp-empty">
          <div className="gp-empty-icon">📭</div>
          <div>Aucun paiement trouvé.</div>
        </div>
      ) : (
        <div className="gp-table-wrapper">
          <table className="gp-table">
            <thead>
              <tr>
                <th>Date &amp; Heure</th>
                <th>Client &amp; Contact</th>
                <th>Doc. Référence</th>
                <th>Montant</th>
                <th>Méthode</th>
                <th>Référence</th>
                <th>État</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id}>
                  <td>
                    <div className="gp-date">{new Date(p.date_paiement || p.createdAt).toLocaleDateString('fr-FR')}</div>
                    <div className="gp-time">
                      {new Date(p.date_paiement || p.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div className="gp-client-nom">
                      {p.factureId?.temp_client_nom || p.details?.nom
                        ? `${p.details?.nom || ''} ${p.details?.prenom || p.factureId?.temp_client_nom || ''}`.trim()
                        : '—'}
                    </div>
                    <div className="gp-client-email">
                      {p.details?.email || p.factureId?.temp_client_email || ''}
                    </div>
                  </td>
                  <td>
                    <span className="gp-fac-num">
                      {p.factureId?.numero_facture || 'Facture N?'}
                    </span>
                  </td>
                  <td>
                    <span className="gp-montant">{(p.montant || 0).toLocaleString('fr-TN')} TND</span>
                  </td>
                  <td>
                    <span className={`gp-methode-badge gp-methode-${p.methode_paiement}`}>
                      {methodIcon[p.methode_paiement] || '💰'} {p.methode_paiement === 'carte' ? 'Carte' : p.methode_paiement === 'virement' ? 'Virement' : 'Espèces'}
                    </span>
                  </td>
                  <td>
                    <span className="gp-ref-badge">{genRef(p._id)}</span>
                  </td>
                  <td>
                    <span className="gp-statut-valide">
                      <span className="gp-dot" />
                      Validé
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GestionPaiements;
