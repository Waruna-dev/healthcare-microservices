import axios from 'axios';

// API Base URL (using gateway)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Add timeout
});

// Single request interceptor (combine both into one)
api.interceptors.request.use(
  (config) => {
    // For admin routes
    if (config.url && config.url.includes('/admin')) {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } 
    // For patient routes (default)
    else {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Debug logging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
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
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        if (!['/login', '/register', '/'].includes(window.location.pathname)) {
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

// Telemedicine API
export const telemedicineAPI = {
  getSession: async (appointmentId) => {
    const response = await api.get(`/telemedicine/${appointmentId}`);
    return response.data;
  },
  startSession: async (appointmentId) => {
    const response = await api.post(`/telemedicine/${appointmentId}/start`);
    return response.data;
  },
  endSession: async (appointmentId, notes, prescription) => {
    const response = await api.post(`/telemedicine/${appointmentId}/end`, {
      consultationNotes: notes,
      prescription
    });
    return response.data;
  },
  getPrescription: async (appointmentId) => {
    const response = await api.get(`/telemedicine/${appointmentId}/prescription`);
    return response.data;
  },
};

export default api;