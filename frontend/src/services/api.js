import axios from 'axios';

// API Base URL (using gateway)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
  // Get available slots for a doctor
  getAvailableSlots: async (doctorId) => {
    const response = await api.get(`/appointments/available-slots?doctorId=${doctorId}`);
    return response.data;
  },
  
  // Create appointment
  createAppointment: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },
  
  // Get patient appointments
  getPatientAppointments: async (patientId) => {
    const response = await api.get(`/appointments/patient/${patientId}`);
    return response.data;
  },
  
  // Update appointment status
  updateAppointmentStatus: async (appointmentId, status, notes) => {
    const response = await api.put(`/appointments/${appointmentId}/status`, { status, notes });
    return response.data;
  },
  
  // Process payment
  processPayment: async (appointmentId, paymentMethod) => {
    const response = await api.post(`/appointments/${appointmentId}/payment`, { paymentMethod });
    return response.data;
  },
};

// Telemedicine Service APIs
export const telemedicineAPI = {
  // Get or create telemedicine session
  getSession: async (appointmentId) => {
    const response = await api.get(`/telemedicine/${appointmentId}`);
    return response.data;
  },
  
  // Start session
  startSession: async (appointmentId) => {
    const response = await api.post(`/telemedicine/${appointmentId}/start`);
    return response.data;
  },
  
  // End session with prescription
  endSession: async (appointmentId, notes, prescription) => {
    const response = await api.post(`/telemedicine/${appointmentId}/end`, {
      consultationNotes: notes,
      prescription
    });
    return response.data;
  },
  
  // Get prescription
  getPrescription: async (appointmentId) => {
    const response = await api.get(`/telemedicine/${appointmentId}/prescription`);
    return response.data;
  },
};

export default api;