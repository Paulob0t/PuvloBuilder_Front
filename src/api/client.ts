import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const superAdminToken = localStorage.getItem('superadmin_token');
  const projectUserToken = localStorage.getItem('project_user_token');

  // If requesting project-auth or tenant endpoints, use projectUserToken if available, else superadmin
  if (config.url?.includes('/projects/') && config.url?.includes('/auth/') && projectUserToken) {
    config.headers.Authorization = `Bearer ${projectUserToken}`;
  } else if (superAdminToken) {
    config.headers.Authorization = `Bearer ${superAdminToken}`;
  } else if (projectUserToken) {
    config.headers.Authorization = `Bearer ${projectUserToken}`;
  }

  return config;
});
