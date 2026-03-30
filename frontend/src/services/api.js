import axios from 'axios';

// 1. Create a configured Axios instance
const api = axios.create({
  // Update this URL if your API Gateway runs on a different port!
  // If your routes don't use '/api', just remove it to be 'http://localhost:5000'
  baseURL: 'http://localhost:5000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Add a Request Interceptor
// This intercepts EVERY outgoing request and automatically attaches the JWT token
// if the user is logged in. This means you don't have to do it manually on every page!
api.interceptors.request.use(
  (config) => {
    // Look for the token we saved during PatientLogin / PatientRegister
    const token = localStorage.getItem('token');
    
    if (token) {
      // If found, attach it to the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Optional: Add a Response Interceptor
// This catches global errors (like an expired token) before they hit your components
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the backend says the token is invalid/expired, automatically log them out
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if they aren't already on the login or register page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;