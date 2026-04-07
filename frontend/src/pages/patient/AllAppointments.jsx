import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, User, Stethoscope,
  FileText, Activity, AlertCircle,
  CheckCircle, XCircle, Download, Eye, CreditCard, Video,
  Bell, Settings, LogOut, Filter, Search, X, DollarSign,
  Edit, Trash2, Upload
} from 'lucide-react';

import UpdateAppointmentForm from '../../components/UpdateAppointmentForm';

const AllAppointments = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form state
  const [updateForm, setUpdateForm] = useState({
    symptoms: '',
    medicalHistory: '',
    reports: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    doctorName: '',
    date: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Add this CSS to hide scrollbars globally for modals
  useEffect(() => {
    // Add style to hide scrollbars when modal is open
    if (showDetailsModal || showUpdateModal || showCancelModal) {
      document.body.style.overflow = 'hidden';
      // Add a class to hide scrollbars
      const style = document.createElement('style');
      style.id = 'hide-scrollbars';
      style.innerHTML = `
        /* Hide scrollbar for Chrome, Safari and Opera */
        .modal-content::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .modal-content {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Hide scrollbar for the modal overlay */
        .modal-overlay {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .modal-overlay::-webkit-scrollbar {
          display: none;
        }
      `;
      document.head.appendChild(style);
    } else {
      document.body.style.overflow = 'auto';
      const existingStyle = document.getElementById('hide-scrollbars');
      if (existingStyle) {
        existingStyle.remove();
      }
    }

    return () => {
      document.body.style.overflow = 'auto';
      const existingStyle = document.getElementById('hide-scrollbars');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [showDetailsModal, showUpdateModal, showCancelModal]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const patient = parsedUser.patient || parsedUser;
      setUser(patient);
    }
    fetchAppointments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [appointments, filters, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAppointments = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      const patient = userData.patient || userData;
      const patientId = patient._id || patient.id;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5015/api/appointments/patient/${patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setAppointments(data.appointments || []);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctorSpecialty?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    if (filters.paymentStatus) {
      filtered = filtered.filter(apt => apt.paymentStatus === filters.paymentStatus);
    }

    if (filters.doctorName) {
      filtered = filtered.filter(apt =>
        apt.doctorName?.toLowerCase().includes(filters.doctorName.toLowerCase())
      );
    }

    if (filters.date) {
      const selectedDate = new Date(filters.date);
      selectedDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === selectedDate.getTime();
      });
    }

    setFilteredAppointments(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      paymentStatus: '',
      doctorName: '',
      date: ''
    });
    setSearchTerm('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.paymentStatus) count++;
    if (filters.doctorName) count++;
    if (filters.date) count++;
    if (searchTerm) count++;
    return count;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('appointments');
    navigate('/login');
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, borderColor: 'border-yellow-700', bgLight: 'bg-yellow-50' };
      case 'accepted':
        return { label: 'Accepted', color: 'bg-blue-100 text-blue-800', icon: CheckCircle, borderColor: 'border-blue-500', bgLight: 'bg-blue-50' };
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle, borderColor: 'border-green-700', bgLight: 'bg-green-50' };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle, borderColor: 'border-red-700', bgLight: 'bg-red-50' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle, borderColor: 'border-gray-700', bgLight: 'bg-gray-50' };
      case 'no_show':
        return { label: 'You Missed', color: 'bg-orange-100 text-orange-800', icon: AlertCircle, borderColor: 'border-orange-700', bgLight: 'bg-orange-50' };
      case 'doctor_no_show':
        return { label: 'Doctor Missed', color: 'bg-purple-100 text-purple-800', icon: AlertCircle, borderColor: 'border-purple-700', bgLight: 'bg-purple-50' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle, borderColor: 'border-gray-700', bgLight: 'bg-gray-50' };
    }
  };

  const getPaymentStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-orange-100 text-orange-800' };
      case 'completed':
        return { label: 'Paid', color: 'bg-green-100 text-green-800' };
      case 'failed':
        return { label: 'Failed', color: 'bg-red-100 text-red-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeRemaining = (paymentDeadline) => {
    if (!paymentDeadline) return null;
    const now = new Date();
    const deadline = new Date(paymentDeadline);
    const diff = deadline - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  /// Open update modal with current appointment data
const handleOpenUpdate = (appointment) => {
  setSelectedAppointment(appointment);
  setUpdateForm({
    symptoms: appointment.symptoms || '',
    medicalHistory: appointment.medicalHistory || '',
    reports: appointment.uploadedReports || []
  });
  setSelectedFiles([]);
  setShowUpdateModal(true);
};

  // Handle update form input changes
  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit update
  const handleUpdateSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('symptoms', updateForm.symptoms);
      formData.append('medicalHistory', updateForm.medicalHistory);

      selectedFiles.forEach(file => {
        formData.append('reports', file);
      });

      const response = await fetch(`http://localhost:5015/api/appointments/${selectedAppointment._id}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Appointment updated successfully!');
        setShowUpdateModal(false);
        fetchAppointments(); // Refresh the list
      } else {
        alert(data.message || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Handle successful update
const handleUpdateSuccess = (updatedAppointment) => {
  // Update the appointments list with the new data
  setAppointments(prevAppointments => 
    prevAppointments.map(apt => 
      apt._id === updatedAppointment._id ? updatedAppointment : apt
    )
  );
  // Also update filtered appointments
  setFilteredAppointments(prevFiltered => 
    prevFiltered.map(apt => 
      apt._id === updatedAppointment._id ? updatedAppointment : apt
    )
  );
  // Show success message
  alert('Appointment updated successfully!');
};

  // Check if appointment can be updated (pending status and future date)
  const canUpdateAppointment = (appointment) => {
    // Only pending appointments can be updated
    if (appointment.status !== 'pending') return false;

    // Check if appointment date is in the future (not past)
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return appointmentDate >= today;
  };

  // Check if appointment can be cancelled
  const canCancelAppointment = (appointment) => {
    // Can cancel if: pending (any payment status for pending)
    if (appointment.status === 'pending') return true;

    // Can cancel if: accepted but payment is still pending
    if (appointment.status === 'accepted' && appointment.paymentStatus === 'pending') return true;

    // Cannot cancel if already completed, rejected, or cancelled
    return false;
  };

  // Handle cancel appointment - WITHOUT REASON
  const handleCancelAppointment = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5015/api/appointments/${selectedAppointment._id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'Cancelled by patient' })
      });

      const data = await response.json();

      if (data.success) {
        alert('Appointment cancelled successfully');
        setShowCancelModal(false);
        fetchAppointments(); // Refresh the list
      } else {
        alert(data.message || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Error cancelling appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = (appointment) => {
    navigate(`/payment/${appointment._id}`, { state: { appointment } });
  };

  const handleJoinCall = (appointment) => {
    navigate(`/telemedicine/${appointment._id}`);
  };

  const canJoinCall = (appointment) => {
    if (!appointment) return false;
    if (appointment.paymentStatus !== 'completed') return false;
    if (appointment.status !== 'accepted') return false;

    const now = new Date();
    const meetingDate = new Date(appointment.date);
    const [hour, minute] = appointment.startTime.split(':');
    meetingDate.setHours(parseInt(hour), parseInt(minute), 0);

    const joinWindowStart = new Date(meetingDate);
    joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 20);
    const joinWindowEnd = new Date(meetingDate);
    joinWindowEnd.setMinutes(joinWindowEnd.getMinutes() + 60);

    return now >= joinWindowStart && now <= joinWindowEnd;
  };

  // Function to handle report view/download
  const handleViewReport = (report) => {
    try {
      console.log('Opening report:', report);

      let fileUrl;
      const baseUrl = 'http://localhost:5015';

      if (report.filePath) {
        if (report.filePath.startsWith('http')) {
          fileUrl = report.filePath;
        } else if (report.filePath.startsWith('/uploads')) {
          fileUrl = `${baseUrl}${report.filePath}`;
        } else {
          const filename = report.filePath.split(/[\\/]/).pop();
          fileUrl = `${baseUrl}/uploads/appointments/${filename}`;
        }
      } else if (report.fileName) {
        fileUrl = `${baseUrl}/uploads/appointments/${report.fileName}`;
      } else {
        console.error('Invalid report path:', report);
        alert('Unable to view report: Invalid file path');
        return;
      }

      console.log('Opening URL:', fileUrl);
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error opening report:', error);
      alert('Unable to view report. Please try again later.');
    }
  };

  // Cancel Modal Component - SIMPLIFIED without reason input
  const CancelModal = ({ appointment, onClose }) => {
    if (!appointment) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
        style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl max-w-md w-full modal-content shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-red-600 px-8 py-5 rounded-t-3xl">
            <h2 className="text-xl font-bold text-white">Cancel Appointment</h2>
          </div>

          <div className="p-6">
            <div className="mb-6 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={40} className="text-red-600" />
              </div>
              <p className="text-gray-800 text-lg font-semibold mb-2">
                Cancel Appointment?
              </p>
              <p className="text-gray-600">
                Are you sure you want to cancel your appointment with <br />
                <strong className="text-gray-900">Dr. {appointment.doctorName}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-3">
                Scheduled for: {formatDate(appointment.date)} at {appointment.startTime}
              </p>
              <p className="text-xs text-red-500 mt-4">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Yes, Cancel Appointment
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Update Modal Component
  const UpdateModal = ({ appointment, onClose }) => {
    if (!appointment) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
        style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto modal-content shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-blue-600 px-8 py-5 rounded-t-3xl sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Update Appointment</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
                <X size={20} className="text-white" />
              </button>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              Dr. {appointment.doctorName} - {formatDate(appointment.date)}
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Symptoms */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Symptoms / Reason for Visit
              </label>
              <textarea
                name="symptoms"
                value={updateForm.symptoms}
                onChange={handleUpdateChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your symptoms..."
              />
            </div>

            {/* Medical History */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medical History
              </label>
              <textarea
                name="medicalHistory"
                value={updateForm.medicalHistory}
                onChange={handleUpdateChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any relevant medical history..."
              />
            </div>

            {/* Existing Reports */}
            {updateForm.reports && updateForm.reports.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Existing Reports ({updateForm.reports.length})
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {updateForm.reports.map((report, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-blue-500" />
                        <span className="text-sm text-gray-600">{report.fileName}</span>
                      </div>
                      <button
                        onClick={() => handleViewReport(report)}
                        className="text-blue-600 text-xs hover:underline"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Reports */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload New Reports (Optional)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition"
              >
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPEG, PNG (Max 5MB each)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">New files to upload:</p>
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-blue-500" />
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        onClick={() => removeSelectedFile(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Message */}
            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-xs text-yellow-700">
                <strong>Note:</strong> Only symptoms, medical history, and reports can be updated.
                Doctor, date, time, and fee cannot be changed. Please cancel and rebook if you need to change these details.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Modern Appointment Details Modal with Blur Background - NO SCROLLBAR
  const AppointmentDetailsModal = ({ appointment, onClose }) => {
    if (!appointment) return null;

    const statusConfig = getStatusConfig(appointment.status);
    const StatusIcon = statusConfig.icon;
    const paymentConfig = getPaymentStatusConfig(appointment.paymentStatus);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
        style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, type: 'spring', damping: 25 }}
          className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto modal-content shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header with Gradient */}
          <div className="sticky top-0 bg-primary px-10 py-5 flex justify-between items-center rounded-t-3xl z-10 shadow-md">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Appointment Details</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <X size={22} className="text-white" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Banner */}
            <div className={`p-4 rounded-2xl ${statusConfig.bgLight} border ${statusConfig.borderColor}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${statusConfig.color} bg-white shadow-sm`}>
                    <StatusIcon size={18} />
                  </div>
                  <div>
                    <span className="font-semibold capitalize text-gray-900">{statusConfig.label}</span>
                    {appointment.status === 'accepted' && appointment.paymentStatus === 'pending' && (
                      <div className="text-xs text-orange-600 mt-0.5">
                        {formatTimeRemaining(appointment.paymentDeadline)}
                      </div>
                    )}
                  </div>
                </div>
                {appointment.paymentStatus === 'completed' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-full">
                    <CheckCircle size={14} className="text-green-600" />
                    <span className="text-xs font-medium text-green-700">Payment Received</span>
                  </div>
                )}
                {appointment.rejectionReason && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-xl">
                    Reason: {appointment.rejectionReason}
                  </div>
                )}
              </div>
            </div>

            {/* Doctor Info */}
            <div className="flex items-start gap-5 p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">Dr. {appointment.doctorName}</h3>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                  <Stethoscope size={14} className="text-blue-500" />
                  {appointment.doctorSpecialty}
                </p>
              </div>
            </div>

            {/* Appointment Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-white rounded-2xl border border-blue-100">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(appointment.date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-white rounded-2xl border border-purple-100">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time</p>
                  <p className="font-semibold text-gray-900">{appointment.startTime} - {appointment.endTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-white rounded-2xl border border-green-100">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Consultation Fee</p>
                  <p className="font-bold text-green-600 text-lg">LKR {appointment.consultationFee?.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-white rounded-2xl border border-orange-100">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${paymentConfig.color}`}>
                    {paymentConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Symptoms Section */}
            {appointment.symptoms && (
              <div className="p-5 bg-gradient-to-r from-yellow-50 to-white rounded-2xl border border-yellow-100">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900">Symptoms / Reason for Visit</h3>
                </div>
                <p className="text-gray-700 ml-3">{appointment.symptoms}</p>
              </div>
            )}

            {/* Medical History Section */}
            {appointment.medicalHistory && (
              <div className="p-5 bg-gradient-to-r from-blue-50 to-white rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900">Medical History</h3>
                </div>
                <p className="text-gray-700 ml-3">{appointment.medicalHistory}</p>
              </div>
            )}

            {/* Uploaded Reports */}
            {appointment.uploadedReports && appointment.uploadedReports.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Uploaded Reports ({appointment.uploadedReports.length})
                  </h3>
                </div>
                <div className="space-y-2 ml-10">
                  {appointment.uploadedReports.map((report, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-blue-500" />
                        <span className="text-sm text-gray-700">{report.fileName || 'Medical Report'}</span>
                      </div>
                      <button
                        onClick={() => handleViewReport(report)}
                        className="text-blue-600 text-sm hover:underline flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      >
                        <Download size={14} /> View Report
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consultation Notes */}
            {appointment.consultationNotes && (
              <div className="p-5 bg-gradient-to-r from-green-50 to-white rounded-2xl border border-green-100">
                <h3 className="font-semibold text-gray-900 mb-2">Consultation Notes</h3>
                <p className="text-gray-700">{appointment.consultationNotes}</p>
                {appointment.prescription && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Prescription</h3>
                    <p className="text-gray-700">{appointment.prescription}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
              {appointment.status === 'accepted' && appointment.paymentStatus === 'pending' && (
                <button
                  onClick={() => {
                    onClose();
                    handlePayment(appointment);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <CreditCard size={20} className="group-hover:scale-110 transition-transform" />
                  Pay LKR {appointment.consultationFee?.toLocaleString()}
                </button>
              )}

              {canJoinCall(appointment) && (
                <button
                  onClick={() => {
                    onClose();
                    handleJoinCall(appointment);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <Video size={20} className="group-hover:scale-110 transition-transform" />
                  Join Telemedicine Session
                </button>
              )}

              {canUpdateAppointment(appointment) && (
                <button
                  onClick={() => {
                    onClose();
                    handleOpenUpdate(appointment);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <Edit size={20} className="group-hover:scale-110 transition-transform" />
                  Update Appointment Details
                </button>
              )}

              {canCancelAppointment(appointment) && (
                <button
                  onClick={() => {
                    onClose();
                    setSelectedAppointment(appointment);
                    setShowCancelModal(true);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                  Cancel Appointment
                </button>
              )}

              {appointment.paymentStatus === 'completed' && appointment.status === 'accepted' && !canJoinCall(appointment) && (
                <div className="text-center p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">Meeting will be available 20 minutes before the scheduled time</p>
                  <p className="text-sm text-gray-500 mt-2">Scheduled: {appointment.startTime}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-24 border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-extrabold text-blue-600 font-headline tracking-tighter hover:opacity-80 transition-opacity">
              CareSync
            </Link>
            <nav className="hidden md:flex items-center gap-8 font-headline font-semibold text-sm text-gray-600">
              <Link to="/dashboard" className="hover:text-blue-600 cursor-pointer transition-colors">Sanctuary</Link>
              <Link to="/doctor/listing" className="hover:text-blue-600 cursor-pointer transition-colors">Specialists</Link>
              <Link to="/appointments/all" className="hover:text-primary cursor-pointer transition-colors">Appointments</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-xl transition-all">
              <Bell size={20} />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full border-2 border-blue-600/20 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all flex items-center justify-center bg-blue-50 text-blue-600 font-bold shadow-sm hover:shadow-md"
              >
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || <User size={20} />
                )}
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                      <p className="font-bold text-gray-900 truncate">{user?.name || 'Patient'}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email || 'Patient Account'}</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <Settings size={18} /> Account Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm font-bold text-red-600 transition-colors w-full text-left"
                      >
                        <LogOut size={18} /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Appointments</h1>
              <p className="text-gray-500 mt-1">View all your appointment history and details</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 px-4 py-2 rounded-full">
                <span className="text-sm font-semibold text-blue-600">
                  Total: {appointments.length} appointments
                </span>
              </div>
              {getActiveFiltersCount() > 0 && (
                <div className="bg-gray-200 px-3 py-2 rounded-full">
                  <span className="text-sm font-semibold text-gray-600">
                    Filtered: {filteredAppointments.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by doctor name, specialty, or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${showFilters || getActiveFiltersCount() > 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Filter size={18} />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold ml-1">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>

              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <X size={18} />
                  Clear All
                </button>
              )}
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Appointment Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">You Missed</option>
                        <option value="doctor_no_show">Doctor Missed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Payment Status
                      </label>
                      <select
                        value={filters.paymentStatus}
                        onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Payments</option>
                        <option value="pending">Pending Payment</option>
                        <option value="completed">Paid</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Doctor Name
                      </label>
                      <input
                        type="text"
                        placeholder="Search by doctor name..."
                        value={filters.doctorName}
                        onChange={(e) => handleFilterChange('doctorName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Specific Date
                      </label>
                      <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Shows appointments on this exact date
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
              {appointments.length === 0 ? (
                <>
                  <Calendar size={64} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Appointments Found</h3>
                  <p className="text-gray-500 mb-6">You haven't booked any appointments yet.</p>
                  <Link
                    to="/doctor/listing"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                  >
                    Browse Doctors
                    <ArrowLeft size={18} className="rotate-180" />
                  </Link>
                </>
              ) : (
                <>
                  <Filter size={64} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Matching Appointments</h3>
                  <p className="text-gray-500 mb-6">Try adjusting your filters to see more results.</p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                  >
                    Clear All Filters
                    <X size={18} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map((apt) => {
                const statusConfig = getStatusConfig(apt.status);
                const StatusIcon = statusConfig.icon;
                const paymentConfig = getPaymentStatusConfig(apt.paymentStatus);

                return (
                  <div key={apt._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                    <div className={`h-1 ${apt.status === 'pending' ? 'bg-yellow-500' :
                        apt.status === 'accepted' ? 'bg-blue-500' :
                          apt.status === 'completed' ? 'bg-green-500' :
                            apt.status === 'rejected' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-50 rounded-lg">
                            <Stethoscope className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-gray-900">Dr. {apt.doctorName}</h3>
                            <p className="text-xs text-gray-500">{apt.doctorSpecialty}</p>
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentConfig.color}`}>
                            {paymentConfig.label}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar size={12} className="text-gray-400" />
                          <span>{formatDate(apt.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Clock size={12} className="text-gray-400" />
                          <span>{apt.startTime} - {apt.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 col-span-2">
                          <span className="font-semibold text-green-600">LKR {apt.consultationFee?.toLocaleString()}</span>
                        </div>
                      </div>

                      {apt.rejectionReason && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-xs text-red-600 font-medium mb-0.5">Cancellation Reason:</p>
                          <p className="text-xs text-red-700">{apt.rejectionReason}</p>
                        </div>
                      )}

                      {apt.symptoms && (
                        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-0.5">Symptoms:</p>
                          <p className="text-xs text-gray-700 line-clamp-2">{apt.symptoms}</p>
                        </div>
                      )}

                      {apt.uploadedReports && apt.uploadedReports.length > 0 && (
                        <div className="mb-3 flex items-center gap-1.5 text-xs text-blue-600">
                          <FileText size={12} />
                          <span>{apt.uploadedReports.length} report(s) attached</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleViewDetails(apt)}
                          className="flex-1 px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye size={12} />
                          View Full Details
                        </button>

                        {canUpdateAppointment(apt) && (
                          <button
                            onClick={() => handleOpenUpdate(apt)}
                            className="flex-1 px-2 py-1.5 text-xs font-medium text-yellow-600 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors flex items-center justify-center gap-1"
                          >
                            <Edit size={12} />
                            Update
                          </button>
                        )}

                        {apt.status === 'accepted' && apt.paymentStatus === 'pending' && (
                          <button
                            onClick={() => handlePayment(apt)}
                            className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:shadow-md transition-all flex items-center justify-center gap-1"
                          >
                            <CreditCard size={12} />
                            Pay Now
                          </button>
                        )}

                        {canJoinCall(apt) && (
                          <button
                            onClick={() => handleJoinCall(apt)}
                            className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:shadow-md transition-all flex items-center justify-center gap-1"
                          >
                            <Video size={12} />
                            Join Call
                          </button>
                        )}

                        {canCancelAppointment(apt) && (
                          <button
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setShowCancelModal(true);
                            }}
                            className="flex-1 px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                          >
                            <Trash2 size={12} />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDetailsModal && (
          <AppointmentDetailsModal
            appointment={selectedAppointment}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
  {showUpdateModal && (
    <UpdateAppointmentForm
      appointment={selectedAppointment}
      onClose={() => {
        setShowUpdateModal(false);
        setSelectedFiles([]);
      }}
      onUpdate={handleUpdateSuccess}
    />
  )}
</AnimatePresence>
      <AnimatePresence>
        {showCancelModal && (
          <CancelModal
            appointment={selectedAppointment}
            onClose={() => {
              setShowCancelModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllAppointments;