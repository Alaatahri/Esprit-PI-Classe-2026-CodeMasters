import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectDetails from './pages/ProjectDetails';
import AddProject from './pages/AddProject';
import UsersList from './pages/UsersList';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import ActivityFeed from './pages/ActivityFeed';
import SystemMonitor from './pages/SystemMonitor';
import MatchingAdmin from './pages/MatchingAdmin';

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b', fontSize: 14 }}>
        Chargement…
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/projects" element={<PrivateRoute><Layout><ProjectsList /></Layout></PrivateRoute>} />
      <Route path="/projects/add" element={<PrivateRoute><Layout><AddProject /></Layout></PrivateRoute>} />
      <Route path="/projects/:id" element={<PrivateRoute><Layout><ProjectDetails /></Layout></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><Layout><UsersList /></Layout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
      <Route path="/activity" element={<PrivateRoute><Layout><ActivityFeed /></Layout></PrivateRoute>} />
      <Route path="/system" element={<PrivateRoute><Layout><SystemMonitor /></Layout></PrivateRoute>} />
      <Route path="/matching" element={<PrivateRoute><Layout><MatchingAdmin /></Layout></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
