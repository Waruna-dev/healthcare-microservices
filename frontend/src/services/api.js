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
  // Get all appointments for a patient
  getPatientAppointments: async (patientId) => {
    console.log('📡 Fetching patient appointments for:', patientId);
    const response = await api.get(`/appointments/patient/${patientId}`);
    return response.data;
  },
  
  // Get upcoming appointment for a patient
  getUpcomingAppointment: async (patientId) => {
    console.log('📡 Fetching upcoming appointment for:', patientId);
    const response = await api.get(`/appointments/patient/${patientId}/upcoming`);
    return response.data;
  },
  
  // Get all appointments for a doctor
  getDoctorAppointments: async (doctorId) => {
    console.log('📡 Fetching doctor appointments for:', doctorId);
    const response = await api.get(`/appointments/doctor/${doctorId}`);
    return response.data;
  },
  
  // Get appointment by ID
  getAppointmentById: async (appointmentId) => {
    console.log('📡 Fetching appointment by ID:', appointmentId);
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },
  
  // Create a new appointment
  createAppointment: async (appointmentData) => {
    console.log('📡 Creating appointment:', appointmentData);
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },
  
  // Update appointment status (accept/reject)
  updateStatus: async (appointmentId, status, rejectionReason) => {
    console.log('📡 Updating appointment status:', appointmentId, status);
    const response = await api.put(`/appointments/${appointmentId}/status`, { status, rejectionReason });
    return response.data;
  },
  
  // Process payment for appointment
  processPayment: async (appointmentId, paymentData) => {
    console.log('📡 Processing payment for:', appointmentId);
    const response = await api.post(`/appointments/${appointmentId}/payment`, paymentData);
    return response.data;
  },
  
  // Cancel appointment
  cancelAppointment: async (appointmentId, reason) => {
    console.log('📡 Cancelling appointment:', appointmentId);
    const response = await api.put(`/appointments/${appointmentId}/cancel`, { reason });
    return response.data;
  },
  
  // Complete appointment
  completeAppointment: async (appointmentId, consultationNotes, prescription) => {
    console.log('📡 Completing appointment:', appointmentId);
    const response = await api.post(`/appointments/${appointmentId}/complete`, { consultationNotes, prescription });
    return response.data;
  },
  
  // Get telemedicine info
  getTelemedicineInfo: async (appointmentId) => {
    console.log('📡 Fetching telemedicine info for:', appointmentId);
    const response = await api.get(`/appointments/${appointmentId}/telemedicine`);
    return response.data;
  },
  
  // Check slot availability
  checkSlotAvailability: async (doctorId, date, startTime) => {
    console.log('📡 Checking slot availability:', { doctorId, date, startTime });
    const response = await api.get(`/appointments/check-slot?doctorId=${doctorId}&date=${date}&startTime=${startTime}`);
    return response.data;
  }
};

export default api;