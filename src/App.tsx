import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './lib/auth';
import { RoleProvider } from './lib/role';
import './lib/i18n'; // Initialize i18n
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlayerPage } from './pages/PlayerPage';
import { FrequenciesPage } from './pages/FrequenciesPage';
import { ConditionsPage } from './pages/ConditionsPage';
import { PersonsPage } from './pages/PersonsPage';
import { SequencesPage } from './pages/SequencesPage';
import { ImportPage } from './pages/ImportPage';
import AdminPage from './pages/AdminPage';  // ← FIXED: Removed { } for default export
import { HelpPage } from './pages/HelpPage';
import { AboutPage } from './pages/AboutPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/player"
        element={
          <ProtectedRoute>
            <PlayerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/frequencies"
        element={
          <ProtectedRoute>
            <FrequenciesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conditions"
        element={
          <ProtectedRoute>
            <ConditionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/persons"
        element={
          <ProtectedRoute>
            <PersonsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sequences"
        element={
          <ProtectedRoute>
            <SequencesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/import"
        element={
          <ProtectedRoute>
            <ImportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/about" element={<AboutPage />} /> 
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoleProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
