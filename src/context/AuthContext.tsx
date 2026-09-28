import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface SuperAdminUser {
  id: string;
  email: string;
  name: string;
}

export interface ProjectUser {
  id: string;
  email: string;
  name: string;
  role: string;
  projectId: string;
  project?: {
    id: string;
    slug: string;
    title: string;
  };
}

interface AuthContextType {
  superAdmin: SuperAdminUser | null;
  projectUser: ProjectUser | null;
  isLoading: boolean;
  loginSuperAdmin: (token: string, user: SuperAdminUser) => void;
  logoutSuperAdmin: () => void;
  loginProjectUser: (token: string, user: ProjectUser) => void;
  logoutProjectUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [superAdmin, setSuperAdmin] = useState<SuperAdminUser | null>(null);
  const [projectUser, setProjectUser] = useState<ProjectUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const superToken = localStorage.getItem('superadmin_token');
      const projectToken = localStorage.getItem('project_user_token');

      if (superToken) {
        try {
          const res = await api.get('/superadmin/auth/me');
          setSuperAdmin(res.data.user);
        } catch {
          localStorage.removeItem('superadmin_token');
          setSuperAdmin(null);
        }
      }

      if (projectToken) {
        const savedProjectSlug = localStorage.getItem('project_user_slug');
        if (savedProjectSlug) {
          try {
            const res = await api.get(`/projects/${savedProjectSlug}/auth/me`);
            setProjectUser(res.data.user);
          } catch {
            localStorage.removeItem('project_user_token');
            localStorage.removeItem('project_user_slug');
            setProjectUser(null);
          }
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const loginSuperAdmin = (token: string, user: SuperAdminUser) => {
    localStorage.setItem('superadmin_token', token);
    setSuperAdmin(user);
  };

  const logoutSuperAdmin = () => {
    localStorage.removeItem('superadmin_token');
    setSuperAdmin(null);
  };

  const loginProjectUser = (token: string, user: ProjectUser) => {
    localStorage.setItem('project_user_token', token);
    if (user.project?.slug) {
      localStorage.setItem('project_user_slug', user.project.slug);
    }
    setProjectUser(user);
  };

  const logoutProjectUser = () => {
    localStorage.removeItem('project_user_token');
    localStorage.removeItem('project_user_slug');
    setProjectUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        superAdmin,
        projectUser,
        isLoading,
        loginSuperAdmin,
        logoutSuperAdmin,
        loginProjectUser,
        logoutProjectUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
