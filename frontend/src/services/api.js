// src/services/api.js
import axios from 'axios';

// 1. Create a configured Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor (SMART TOKEN INJECTION)
api.interceptors.request.use(
  (config) => {
    // If the API request is going to an admin route, use the adminToken
    if (config.url.includes('/admin')) {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      // Otherwise, use the standard patient token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor (SMART REDIRECT)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      
      // Check if the user is currently in the Admin Portal
      if (window.location.pathname.includes('/admin')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      } 
      // Otherwise, they are in the Patient Portal
      else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);


// Appointment API
export const appointmentAPI = {
  getPatientAppointments: async (patientId) => {
    const response = await api.get(`/appointments/patient/${patientId}`);
    return response.data;
  },
  getDoctorAppointments: async (doctorId) => {
    const response = await api.get(`/appointments/doctor/${doctorId}`);
    return response.data;
  },
  getAppointmentById: async (appointmentId) => {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },
  createAppointment: async (appointmentData) => {
    // Use JSON instead of FormData for simpler handling
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },
  updateStatus: async (appointmentId, status, rejectionReason) => {
    const response = await api.put(`/appointments/${appointmentId}/status`, { status, rejectionReason });
    return response.data;
  },
  processPayment: async (appointmentId, paymentData) => {
    const response = await api.post(`/appointments/${appointmentId}/payment`, paymentData);
    return response.data;
  },
  cancelAppointment: async (appointmentId, reason) => {
    const response = await api.put(`/appointments/${appointmentId}/cancel`, { reason });
    return response.data;
  }
};

export default api;