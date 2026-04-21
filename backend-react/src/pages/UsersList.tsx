import { useEffect, useState } from 'react';
import userService, { User } from '../services/userService';
import './UsersList.css';

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userService.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#e74c3c';
      case 'expert':
        return '#3498db';
      case 'artisan':
        return '#9b59b6';
      case 'manufacturer':
        return '#f39c12';
      case 'client':
        return '#27ae60';
      default:
        return '#7f8c8d';
    }
  };

  if (loading) {
    return <div className="loading">Chargement des utilisateurs...</div>;
  }

  return (
    <div className="users-list">
      <h1>Liste des Utilisateurs</h1>

      {users.length === 0 ? (
        <div className="empty-state">
          <p>Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Email vérifié</th>
                <th>Téléphone</th>
                <th>Rôle</th>
                <th>Date de Création</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.nom}</td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className="role-badge"
                      style={{
                        backgroundColor:
                          user.isEmailVerified === false ? '#e74c3c' : '#27ae60',
                      }}
                      title={
                        user.isEmailVerified === false
                          ? 'E-mail non vérifié'
                          : 'E-mail vérifié'
                      }
                    >
                      {user.isEmailVerified === false ? '✗ Non' : '✓ Oui'}
                    </span>
                  </td>
                  <td>{user.telephone}</td>
                  <td>
                    <span 
                      className="role-badge"
                      style={{ backgroundColor: getRoleColor(user.role) }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('fr-FR')
                      : '-'
                    }
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

export default UsersList;
