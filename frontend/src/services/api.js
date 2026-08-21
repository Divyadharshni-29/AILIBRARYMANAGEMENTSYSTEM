import axios from 'axios';

// Dynamically determine the backend API base URL.
// When running in the browser (localhost or LAN phone/laptop), using relative '/api'
// routes all requests through the Vite dev server proxy on port 5173 directly to FastAPI on 8000.
// This guarantees 100% connectivity and bypasses any Windows Firewall blocking of port 8000.
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Dynamically set baseURL and attach JWT token
api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem('library_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 Unauthorized & logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Network/Auth Error]', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      detail: error.response?.data?.detail,
      message: error.message,
    });

    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('library_token');
        localStorage.removeItem('library_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
