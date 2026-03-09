import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Attach CSRF token from cookie to every mutating request
api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    // Grab CSRF cookie
    const csrfToken = document.cookie
      .split('; ')
      .find(r => r.startsWith('csrftoken='))
      ?.split('=')[1];
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  return config;
});

// Auth
export const fetchCSRF = () => api.get('/csrf/');
export const login = (username, password) =>
  api.post('/auth/login/', { username, password });
export const logout = () => api.post('/auth/logout/');
export const me = () => api.get('/auth/me/');

// Data
export const fetchMeta = () => api.get('/indicators/');
export const fetchSummary = (country = 'US') =>
  api.get('/summary/', { params: { country } });
export const fetchTimeSeries = (indicator, country, start, end) =>
  api.get('/timeseries/', { params: { indicator, country, start, end } });
export const fetchComparison = (indicator, countries, year) =>
  api.get('/comparison/', { params: { indicator, countries: countries.join(';'), year } });
export const fetchScatter = (x, y, year) =>
  api.get('/scatter/', { params: { x, y, year } });

export default api;
