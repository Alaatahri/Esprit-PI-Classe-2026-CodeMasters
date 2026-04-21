import { useEffect, useState } from 'react';
import { billingService, Devis, Contract } from '../services/billingService';
import './BillingList.css';

const BillingList = () => {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [resD, resC] = await Promise.all([
          billingService.getDevis(),
          billingService.getContracts(),
        ]);
        setDevis(resD.data || []);
        setContracts(resC.data || []);
      } catch (e) {
        console.error('Error loading billing data:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading">Chargement des données financières...</div>;

  return (
    <div className="billing-admin">
      <div className="page-header">
        <h1>Facturation et Paiements</h1>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <h3>Total Devis</h3>
          <p className="large-number">{devis.length}</p>
        </div>
        <div className="stat-box">
          <h3>Contrats Signés</h3>
          <p className="large-number">{contracts.filter(c => c.clientSignedAt && c.expertSignedAt).length}</p>
        </div>
      </div>

      <section className="billing-section">
        <h2>Derniers Devis (Propositions)</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Projet</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {devis.map(d => (
                <tr key={d._id}>
                  <td>{d._id.slice(-6)}</td>
                  <td>{d.projectId?.titre || 'Projet'}</td>
                  <td>{d.totalTTC?.toLocaleString()} TND</td>
                  <td><span className={`badge ${d.statut?.toLowerCase()}`}>{d.statut}</span></td>
                  <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="billing-section">
        <h2>Gestion des Paiements (Contrats)</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Projet</th>
                <th>Montant Total</th>
                <th>Statut</th>
                <th>Signature Client</th>
                <th>Signature Expert</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(c => (
                <tr key={c._id}>
                  <td>{c.projectId?.titre || 'Dossier'}</td>
                  <td>{c.totalAmount?.toLocaleString()} TND</td>
                  <td>{c.status}</td>
                  <td>{c.clientSignedAt ? '✅' : '⏳'}</td>
                  <td>{c.expertSignedAt ? '✅' : '⏳'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default BillingList;
