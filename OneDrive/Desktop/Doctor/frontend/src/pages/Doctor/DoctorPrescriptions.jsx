import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, User, Stethoscope, CheckCircle, XCircle, 
  Eye, Filter, Search, AlertCircle, Activity,
  FileText, Mail, TrendingUp, Calendar as CalendarIcon,
  Grid3x3, List, ChevronLeft, ChevronRight,
  Download, Video, CreditCard, Plus, Edit2, Save, X,
  Pill, Syringe, FlaskConical, Heart, Brain, Bone, Trash2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DoctorPrescriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState('completed');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  
  // Prescription states
  const [prescriptions, setPrescriptions] = useState([]);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    appointmentId: '',
    patientName: '',
    patientEmail: '',
    medicines: [],
    notes: '',
    followUpDate: '',
    diagnosis: ''
  });

  const statusFilters = [
    { value: 'completed', label: 'Completed', icon: CheckCircle },
    { value: 'prescriptions', label: 'Created Prescriptions', icon: Pill },
    { value: 'all', label: 'All', icon: CalendarIcon },
  ];

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
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
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatShortDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const canJoinCall = (appointment) => {
    if (!appointment) return false;
    if (appointment.paymentStatus !== 'completed') return false;
    if (appointment.status !== 'completed') return false;
    
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

  // Fetch appointments using PUBLIC endpoint
  const fetchAppointments = async () => {
    const doctorId = user?._id || user?.id;
    
    if (!doctorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = `http://localhost:5015/api/appointments/doctor/public/${doctorId}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.appointments) {
        const completedAppointments = data.appointments.filter(apt => 
          apt.status === 'completed'
        );
        setAppointments(completedAppointments);
        setFilteredAppointments(completedAppointments);
      } else {
        setAppointments([]);
        setFilteredAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    try {
      const doctorId = user?._id || user?.id;
      const response = await fetch(`http://localhost:5025/api/prescriptions/doctor/${doctorId}`);
      const data = await response.json();
      
      if (data.success) {
        setPrescriptions(data.prescriptions || []);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchPrescriptions();
    }
  }, [user]);

  // Filter and sort appointments
  useEffect(() => {
    let filtered = [...appointments];
    
    if (filter === 'prescriptions') {
      // Show only appointments that have prescriptions
      filtered = filtered.filter(apt => 
        prescriptions.some(presc => presc.appointmentId === apt._id)
      );
    } else if (filter !== 'all') {
      filtered = filtered.filter(apt => apt.status === filter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.symptoms?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by date and time (most recent first, but today's appointments sorted by time ascending)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + (a.startTime || '00:00'));
      const dateB = new Date(b.date + ' ' + (b.startTime || '00:00'));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const isAToday = dateA.toDateString() === today.toDateString();
      const isBToday = dateB.toDateString() === today.toDateString();
      
      // If both are today, sort by time ascending
      if (isAToday && isBToday) {
        return dateA - dateB;
      }
      
      // Otherwise sort by date descending
      return dateB - dateA;
    });
    
    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [filter, searchTerm, appointments, prescriptions]);

  // Group appointments by date
  const groupAppointmentsByDate = (appointments) => {
    const groups = {};
    
    appointments.forEach(appointment => {
      const date = new Date(appointment.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let dateLabel;
      if (date.toDateString() === today.toDateString()) {
        dateLabel = 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        dateLabel = 'Tomorrow';
      } else if (date < today) {
        const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          dateLabel = 'Yesterday';
        } else if (daysDiff <= 7) {
          dateLabel = `${daysDiff} days ago`;
        } else {
          dateLabel = formatDate(appointment.date);
        }
      } else {
        dateLabel = formatDate(appointment.date);
      }
      
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(appointment);
    });
    
    return groups;
  };

  const groupedAppointments = groupAppointmentsByDate(filteredAppointments);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  const handleJoinCall = (appointment) => {
    window.open(`/telemedicine/${appointment._id}`, '_blank');
  };

  const handleSelectAppointment = (appointment) => {
    if (selectedAppointments.find(apt => apt._id === appointment._id)) {
      setSelectedAppointments(selectedAppointments.filter(apt => apt._id !== appointment._id));
    } else {
      setSelectedAppointments([...selectedAppointments, appointment]);
    }
  };

  const handleCreatePrescription = (appointment) => {
    navigate(`/doctor/prescriptions/create/${appointment._id}`);
  };

  const handleAddMedicine = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '' }]
    }));
  };

  const handleRemoveMedicine = (index) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.map((medicine, i) => 
        i === index ? { ...medicine, [field]: value } : medicine
      )
    }));
  };

  const handleSavePrescription = async () => {
    try {
      const response = await fetch('http://localhost:5015/api/prescriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prescriptionForm,
          doctorId: user?._id || user?.id,
          doctorName: user?.name || 'Dr. ' + user?.email?.split('@')[0]
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Prescription created successfully!');
        setShowPrescriptionModal(false);
        fetchPrescriptions();
        fetchAppointments();
      } else {
        alert('Failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleDeletePrescription = async (appointmentId) => {
    const prescription = prescriptions.find(p => p.appointmentId === appointmentId);
    if (!prescription) {
      alert('Prescription not found');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the prescription for ${prescription.patientName || 'this patient'}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://localhost:5015/api/prescriptions/${prescription._id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Prescription deleted successfully!');
        fetchPrescriptions();
        fetchAppointments();
      } else {
        alert('Failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
  };

  // Enhanced Appointment Card Component
  const AppointmentCard = ({ appointment, index }) => {
    const statusConfig = getStatusConfig(appointment.status);
    const StatusIcon = statusConfig.icon;
    const paymentConfig = getPaymentStatusConfig(appointment.paymentStatus);
    const isSelected = selectedAppointments.find(apt => apt._id === appointment._id);
    
    // Get time-based styling
    const appointmentTime = new Date(appointment.date + ' ' + (appointment.startTime || '00:00'));
    const now = new Date();
    const isToday = appointmentTime.toDateString() === now.toDateString();
    const isPast = appointmentTime < now;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.4 }}
        className={`bg-white rounded-2xl border-2 overflow-hidden hover:shadow-xl transition-all duration-300 ${
          isSelected ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' : 'border-gray-200'
        } ${isToday ? 'ring-2 ring-blue-100' : ''}`}
      >
        {/* Time indicator strip */}
        <div className={`h-1 ${isToday ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : isPast ? 'bg-gray-300' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`} />
        
        <div className="p-5">
          {/* Header with enhanced styling */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isToday ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Stethoscope className={`w-5 h-5 ${isToday ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{appointment.patientName}</h3>
                <p className="text-sm text-gray-500">{appointment.patientEmail}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                <StatusIcon size={12} />
                {statusConfig.label}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentConfig.color}`}>
                {paymentConfig.label}
              </span>
            </div>
          </div>
          
          {/* Enhanced Appointment Details */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className={`p-2 rounded-lg ${isToday ? 'bg-blue-200' : 'bg-gray-200'}`}>
                <Calendar size={16} className={isToday ? 'text-blue-700' : 'text-gray-600'} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-semibold text-sm">{formatDate(appointment.date)}</p>
              </div>
              {isToday && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  TODAY
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className={`p-2 rounded-lg ${canJoinCall(appointment) ? 'bg-green-200' : 'bg-gray-200'}`}>
                <Clock size={16} className={canJoinCall(appointment) ? 'text-green-700' : 'text-gray-600'} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-semibold text-sm">{appointment.startTime} - {appointment.endTime}</p>
              </div>
              {canJoinCall(appointment) && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full animate-pulse">
                  LIVE NOW
                </span>
              )}
            </div>
          </div>
          
          {/* Enhanced Symptoms Preview */}
          {appointment.symptoms && (
            <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-yellow-600" />
                <p className="text-xs font-semibold text-yellow-800">Symptoms / Reason for Visit</p>
              </div>
              <p className="text-sm text-gray-700 line-clamp-3">{appointment.symptoms}</p>
            </div>
          )}
          
          {/* Enhanced Action Buttons */}
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleViewDetails(appointment)}
              className="px-3 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
            >
              <Eye size={14} />
              View Details
            </button>
            
            {canJoinCall(appointment) && (
              <button
                onClick={() => handleJoinCall(appointment)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Video size={20} />
                Join Live Call
              </button>
            )}
            
            <button
              onClick={() => handleCreatePrescription(appointment)}
              className="px-3 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <FileText size={14} />
              Create Prescription
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const handleViewDetails = (appointment) => {
    navigate(`/doctor/prescriptions/${appointment._id}`);
  };

  // Appointment Details Modal Component
  const AppointmentDetailsModal = ({ appointment, onClose }) => {
    if (!appointment) return null;
    
    const statusConfig = getStatusConfig(appointment.status);
    const StatusIcon = statusConfig.icon;
    const paymentConfig = getPaymentStatusConfig(appointment.paymentStatus);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <XCircle size={24} className="text-gray-500" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Status Banner */}
            <div className={`p-4 rounded-xl ${statusConfig.color.replace('text', 'bg').replace('800', '50')} border`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <StatusIcon size={20} />
                  <span className="font-semibold capitalize">{statusConfig.label}</span>
                  {appointment.paymentStatus === 'completed' && (
                    <span className="text-sm text-green-600 ml-2">✓ Payment received</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Patient Info */}
            <div className="flex items-start gap-4 pb-4 border-b">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {appointment.patientName?.charAt(0) || 'P'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{appointment.patientName}</h3>
                <p className="text-gray-500">{appointment.patientEmail}</p>
              </div>
            </div>
            
            {/* Appointment Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar size={20} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(appointment.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Clock size={20} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-medium">{appointment.startTime} - {appointment.endTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <CreditCard size={20} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${paymentConfig.color}`}>
                    {paymentConfig.label}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Symptoms */}
            {appointment.symptoms && (
              <div className="p-4 bg-yellow-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={18} className="text-yellow-600" />
                  <h3 className="font-semibold">Symptoms / Reason for Visit</h3>
                </div>
                <p className="text-gray-700">{appointment.symptoms}</p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    handleSelectAppointment(appointment);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Select for Prescription
                </button>
                <button
                  onClick={() => {
                    onClose();
                    handleCreatePrescription(appointment);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <FileText size={20} />
                  Create Prescription
                </button>
              </div>
              
              {canJoinCall(appointment) && (
                <button
                  onClick={() => {
                    onClose();
                    handleJoinCall(appointment);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Video size={20} />
                  Join Telemedicine Session
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Prescription Modal Component
  const PrescriptionModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Create Prescription</h2>
            <button onClick={() => setShowPrescriptionModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <XCircle size={24} className="text-gray-500" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Patient Info */}
            <div className="p-4 bg-blue-50 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-2">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{prescriptionForm.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{prescriptionForm.patientEmail}</p>
                </div>
              </div>
            </div>
            
            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
              <textarea
                value={prescriptionForm.diagnosis}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Enter diagnosis..."
              />
            </div>
            
            {/* Medicines */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">Medicines</label>
                <button
                  onClick={handleAddMedicine}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Medicine
                </button>
              </div>
              
              <div className="space-y-3">
                {prescriptionForm.medicines.map((medicine, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Medicine name"
                        value={medicine.name}
                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g., 500mg)"
                        value={medicine.dosage}
                        onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g., 2x daily)"
                        value={medicine.frequency}
                        onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Duration (e.g., 7 days)"
                          value={medicine.duration}
                          onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {prescriptionForm.medicines.length > 1 && (
                          <button
                            onClick={() => handleRemoveMedicine(index)}
                            className="px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                value={prescriptionForm.notes}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Additional instructions for the patient..."
              />
            </div>
            
            {/* Follow-up Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date (Optional)</label>
              <input
                type="date"
                value={prescriptionForm.followUpDate}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSavePrescription}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Save Prescription
              </button>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
        <p className="text-gray-500 mt-1">Create and manage patient prescriptions</p>
      </div>

      {/* Selected Appointments Summary */}
      {selectedAppointments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Selected Appointments</h3>
              <p className="text-sm text-blue-700">
                {selectedAppointments.length} appointment(s) selected for prescription creation
              </p>
            </div>
            <button
              onClick={() => setSelectedAppointments([])}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Selection
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedAppointments.map(apt => (
              <div key={apt._id} className="bg-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span>{apt.patientName}</span>
                <button
                  onClick={() => handleSelectAppointment(apt)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statusFilters.map((status) => (
          <button
            key={status.value}
            onClick={() => setFilter(status.value)}
            className={`p-3 rounded-xl text-center transition-all ${
              filter === status.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-500/50'
            }`}
          >
            <status.icon className={`w-5 h-5 mx-auto mb-1 ${
              filter === status.value ? 'text-white' : 'text-gray-500'
            }`} />
            <p className="text-xl font-bold">
              {status.value === 'all' 
                ? appointments.length 
                : status.value === 'prescriptions' 
                  ? filteredAppointments.length 
                  : appointments.filter(apt => apt.status === status.value).length}
            </p>
            <p className="text-xs">{status.label}</p>
          </button>
        ))}
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, email or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{currentItems.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{filteredAppointments.length}</span> {filter === 'prescriptions' ? 'prescriptions' : 'appointments'}
        </p>
      </div>

      {/* Beautiful Date-Grouped Appointments */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">No Appointments Found</h3>
          <p className="text-sm text-gray-500">No completed appointments match your current filters</p>
        </div>
      ) : filter === 'prescriptions' ? (
        /* Created Prescriptions View */
        <div className="space-y-6">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-1">No Prescriptions Created</h3>
              <p className="text-sm text-gray-500">No prescriptions have been created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppointments.map((appointment, index) => {
                const prescription = prescriptions.find(p => p.appointmentId === appointment._id);
                return (
                  <motion.div
                    key={appointment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                    className="bg-white rounded-2xl border-2 border-green-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-green-100">
                            <Pill className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{appointment.patientName}</h3>
                            <p className="text-sm text-gray-500">{appointment.patientEmail}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Prescription Created
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 mb-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 rounded-lg bg-blue-200">
                            <Calendar size={16} className="text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="font-semibold text-sm">{formatDate(appointment.date)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 rounded-lg bg-green-200">
                            <Pill size={16} className="text-green-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Diagnosis</p>
                            <p className="font-semibold text-sm line-clamp-2">{prescription?.diagnosis || 'Not specified'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="p-2 rounded-lg bg-purple-200">
                            <FileText size={16} className="text-purple-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Medicines</p>
                            <p className="font-semibold text-sm">{prescription?.medicines?.length || 0} medications</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => navigate(`/doctor/prescriptions/${appointment._id}`)}
                          className="px-3 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Eye size={14} />
                          View Prescription
                        </button>
                        
                        <button
                          onClick={() => navigate(`/doctor/prescriptions/${appointment._id}/edit`)}
                          className="px-3 py-2.5 text-sm font-medium text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Edit2 size={14} />
                          Edit Prescription
                        </button>
                        
                        <button
                          onClick={() => handleDeletePrescription(appointment._id)}
                          className="px-3 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAppointments).map(([dateLabel, appointments]) => (
            <motion.div
              key={dateLabel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Beautiful Date Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${
                    dateLabel === 'Today' ? 'bg-blue-100' : 
                    dateLabel === 'Tomorrow' ? 'bg-purple-100' : 
                    dateLabel.includes('ago') ? 'bg-gray-100' : 'bg-green-100'
                  }`}>
                    <Calendar className={`w-6 h-6 ${
                      dateLabel === 'Today' ? 'text-blue-600' : 
                      dateLabel === 'Tomorrow' ? 'text-purple-600' : 
                      dateLabel.includes('ago') ? 'text-gray-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{dateLabel}</h2>
                    <p className="text-sm text-gray-500">
                      {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                {/* Time indicators for special dates */}
                {dateLabel === 'Today' && (
                  <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-blue-700">Active Today</span>
                  </div>
                )}
                {dateLabel === 'Tomorrow' && (
                  <div className="ml-auto px-3 py-1 bg-purple-100 rounded-full">
                    <span className="text-xs font-semibold text-purple-700">Upcoming</span>
                  </div>
                )}
              </div>
              
              {/* Appointments Grid for this date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {appointments.map((appointment, index) => (
                  <AppointmentCard key={appointment._id} appointment={appointment} index={index} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showDetailsModal && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && <PrescriptionModal />}
    </div>
  );
};

export default DoctorPrescriptions;