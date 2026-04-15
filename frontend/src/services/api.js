// src/services/api.js
import axios from 'axios';

// 1. Create a configured Axios instance
// Updated to point to the Kubernetes Ingress (Port 80)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost/api', 
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
      
      if (window.location.pathname.includes('/admin')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      } 
      
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
    console.log('📡 Fetching patient appointments for:', patientId);
    const response = await api.get(`/appointments/patient/${patientId}`);
    return response.data;
  },
  getUpcomingAppointment: async (patientId) => {
    console.log('📡 Fetching upcoming appointment for:', patientId);
    const response = await api.get(`/appointments/patient/${patientId}/upcoming`);
    return response.data;
  },
  getDoctorAppointments: async (doctorId) => {
    console.log('📡 Fetching doctor appointments for:', doctorId);
    const response = await api.get(`/appointments/doctor/${doctorId}`);
    return response.data;
  },
  getAppointmentById: async (appointmentId) => {
    console.log('📡 Fetching appointment by ID:', appointmentId);
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },
  createAppointment: async (appointmentData) => {
    console.log('📡 Creating appointment:', appointmentData);
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },
  updateStatus: async (appointmentId, status, rejectionReason) => {
    console.log('📡 Updating appointment status:', appointmentId, status);
    const response = await api.put(`/appointments/${appointmentId}/status`, { status, rejectionReason });
    return response.data;
  },
  processPayment: async (appointmentId, paymentData) => {
    console.log('📡 Processing payment for:', appointmentId);
    const response = await api.post(`/appointments/${appointmentId}/payment`, paymentData);
    return response.data;
  },
  
  cancelAppointment: async (appointmentId, reason) => {
    console.log('📡 Cancelling appointment:', appointmentId);
    const response = await api.put(`/appointments/${appointmentId}/cancel`, { reason });
    return response.data;
  },

   completeAppointment: async (appointmentId, consultationNotes, prescription, status = 'completed') => {
    console.log('📡 Completing appointment:', appointmentId, 'Status:', status);
    const response = await api.post(`/appointments/${appointmentId}/complete`, { 
      consultationNotes, 
      prescription,
      status 
    });
    return response.data;
  },

  getTelemedicineInfo: async (appointmentId) => {
    console.log('📡 Fetching telemedicine info for:', appointmentId);
    const response = await api.get(`/appointments/${appointmentId}/telemedicine`);
    return response.data;
  },
  
  checkSlotAvailability: async (doctorId, date, startTime) => {
    console.log('📡 Checking slot availability:', { doctorId, date, startTime });
    const response = await api.get(`/appointments/check-slot?doctorId=${doctorId}&date=${date}&startTime=${startTime}`);
    return response.data;
  }
};


export const telemedicineAPI = {
  // UPDATED: Now uses the custom axios instance instead of raw fetch
  // It automatically gets the correct Kubernetes URL and injects the token!
  getSessionInfo: async (appointmentId) => {
    console.log('📡 Fetching telemedicine session info for:', appointmentId);
    const response = await api.get(`/appointments/${appointmentId}/telemedicine`);
    return response.data;
  }
};

export default api;