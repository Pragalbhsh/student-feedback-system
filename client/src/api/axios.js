import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach the stored token to every authenticated request so protected routes can verify the user.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studentFeedbackToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
