import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Layout      from './components/layout/Layout';
import Login       from './auth/Login';
import Register    from './auth/Register';

import Dashboard    from './pages/Dashboard';
import Projects     from './pages/Projects';
import MyTasks      from './pages/MyTasks';
import Kanban       from './pages/Kanban';
import Calendar     from './pages/Calendar';
import Team         from './pages/Team';
import Reports      from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings     from './pages/Settings';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent 
                        rounded-full animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Public route wrapper (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent 
                        rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <SocketProvider>
            <Layout />
          </SocketProvider>
        </ProtectedRoute>
      }>
        <Route index          element={<Dashboard />} />
        <Route path="projects"     element={<Projects />} />
        <Route path="my-tasks"     element={<MyTasks />} />
        <Route path="kanban"       element={<Kanban />} />
        <Route path="calendar"     element={<Calendar />} />
        <Route path="team"         element={<Team />} />
        <Route path="reports"      element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings"     element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1d27',
              color:      '#ffffff',
              border:     '1px solid #2a2d3e',
              borderRadius: '0.75rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;