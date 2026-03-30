import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import projectService, { Project } from '../services/projectService';
import './AddProject.css';

const AddProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({
    titre: '',
    description: '',
    date_debut: '',
    date_fin_prevue: '',
    budget_estime: 0,
    statut: 'En attente',
    avancement_global: 0,
    clientId: '',
    expertId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget_estime' || name === 'avancement_global' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await projectService.create(formData);
      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-project">
      <h1>Ajouter un Nouveau Projet</h1>

      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-group">
          <label htmlFor="titre">Titre *</label>
          <input
            type="text"
            id="titre"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date_debut">Date de Début *</label>
            <input
              type="date"
              id="date_debut"
              name="date_debut"
              value={formData.date_debut}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date_fin_prevue">Date de Fin Prévue *</label>
            <input
              type="date"
              id="date_fin_prevue"
              name="date_fin_prevue"
              value={formData.date_fin_prevue}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="budget_estime">Budget Estimé (TND) *</label>
            <input
              type="number"
              id="budget_estime"
              name="budget_estime"
              value={formData.budget_estime}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="avancement_global">Avancement Global (%)</label>
            <input
              type="number"
              id="avancement_global"
              name="avancement_global"
              value={formData.avancement_global}
              onChange={handleChange}
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="statut">Statut</label>
            <select
              id="statut"
              name="statut"
              value={formData.statut}
              onChange={handleChange}
            >
              <option value="En attente">En attente</option>
              <option value="En cours">En cours</option>
              <option value="Terminé">Terminé</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="clientId">ID Client *</label>
            <input
              type="text"
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="expertId">ID Expert (optionnel)</label>
          <input
            type="text"
            id="expertId"
            name="expertId"
            value={formData.expertId}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/projects')}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer le Projet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProject;
