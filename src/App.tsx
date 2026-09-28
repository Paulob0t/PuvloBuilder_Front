import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SuperAdminLogin } from './pages/SuperAdminLogin';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { ProjectUserLogin } from './pages/ProjectUserLogin';
import { ProjectSiteView } from './pages/ProjectSiteView';

import { ProjectEditor } from './pages/ProjectEditor';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Master SuperAdmin Routes */}
          <Route path="/login" element={<SuperAdminLogin />} />
          <Route path="/admin" element={<SuperAdminDashboard />} />
          <Route path="/admin/proyectos/:id/editor" element={<ProjectEditor />} />

          {/* Dynamic Prefix & Slug Tenant Routes (e.g. /app/:slug, /tienda/:slug, /sitio/:slug) */}
          <Route path="/:prefix/:slug/login" element={<ProjectUserLogin />} />
          <Route path="/:prefix/:slug" element={<ProjectSiteView />} />

          {/* Fallback & Root redirect */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
