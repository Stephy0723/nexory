import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/Layout/AppLayout';
import { AuthPage } from '@/pages/Auth/AuthPage';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import { Projects } from '@/pages/Projects/Projects';
import { Credentials } from '@/pages/Credentials/Credentials';
import { Tasks } from '@/pages/Tasks/Tasks';
import { Notes } from '@/pages/Notes/Notes';
import { DatabasePage } from '@/pages/Database/Database';
import { ActivityPage } from '@/pages/Activity/Activity';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  if (!user || !accessToken) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="credentials" element={<Credentials />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="notes" element={<Notes />} />
        <Route path="database" element={<DatabasePage />} />
        <Route path="activity" element={<ActivityPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}