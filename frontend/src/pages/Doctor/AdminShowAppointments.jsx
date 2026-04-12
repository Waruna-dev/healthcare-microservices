import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, Stethoscope, CheckCircle, XCircle,
  Eye, Filter, Search, AlertCircle, Activity,
  FileText, Mail, Phone, MapPin,
  TrendingUp, Calendar as CalendarIcon,
  Grid3x3, List, ChevronLeft, ChevronRight,
  Download, Video, CreditCard, RefreshCw,
  DollarSign, Star, Award, Heart, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminShowAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    rejected: 0,
    no_show: 0,
    totalRevenue: 0
  });

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: 'all',
    minFee: '',
    maxFee: '',
    patientName: '',
    doctorName: '',
    startDate: '',
    endDate: ''
  });

  const statusFilters = [
    { value: 'all', label: 'All', icon: CalendarIcon, color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'Pending', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'accepted', label: 'Accepted', icon: CheckCircle, color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', icon: TrendingUp, color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800' },
    { value: 'no_show', label: 'No-Show', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' },
    { value: 'doctor_no_show', label: 'Doctor No-Show', icon: AlertCircle, color: 'bg-purple-100 text-purple-800' },
  ];

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
      case 'accepted':
        return { label: 'Accepted', color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle };
      case 'no_show':
        return { label: 'Patient No-Show', color: 'bg-orange-100 text-orange-800', icon: XCircle };
      case 'doctor_no_show':
        return { label: 'Doctor No-Show', color: 'bg-purple-100 text-purple-800', icon: XCircle };
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
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Fetch all appointments (admin view - all doctors)
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5015/api/appointments/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success && data.appointments) {
        setAppointments(data.appointments);
        calculateStats(data.appointments);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateStats = (appts) => {
    const total = appts.length;
    const pending = appts.filter(a => a.status === 'pending').length;
    const accepted = appts.filter(a => a.status === 'accepted').length;
    const completed = appts.filter(a => a.status === 'completed').length;
    const rejected = appts.filter(a => a.status === 'rejected').length;
    const no_show = appts.filter(a => a.status === 'doctor_no_show').length;
    const totalRevenue = appts
      .filter(a => a.paymentStatus === 'completed')
      .reduce((sum, a) => sum + (a.consultationFee || 0), 0);

    setStats({
      total,
      pending,
      accepted,
      completed,
      rejected,
      no_show,
      totalRevenue
    });
  };

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Filter appointments
  useEffect(() => {
    let filtered = [...appointments];

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(apt => apt.status === filter);
    }

    // Apply search term filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(apt =>
        (apt.patientName && apt.patientName.toLowerCase().includes(searchLower)) ||
        (apt.patientEmail && apt.patientEmail.toLowerCase().includes(searchLower)) ||
        (apt.doctorName && apt.doctorName.toLowerCase().includes(searchLower)) ||
        (apt.symptoms && apt.symptoms.toLowerCase().includes(searchLower))
      );
    }

    // Apply advanced filters
    if (advancedFilters.patientName && advancedFilters.patientName.trim()) {
      const patientNameLower = advancedFilters.patientName.toLowerCase().trim();
      filtered = filtered.filter(apt =>
        apt.patientName && apt.patientName.toLowerCase().includes(patientNameLower)
      );
    }

    if (advancedFilters.doctorName && advancedFilters.doctorName.trim()) {
      const doctorNameLower = advancedFilters.doctorName.toLowerCase().trim();
      filtered = filtered.filter(apt =>
        apt.doctorName && apt.doctorName.toLowerCase().includes(doctorNameLower)
      );
    }

    if (advancedFilters.minFee && advancedFilters.minFee !== '') {
      const minFee = parseFloat(advancedFilters.minFee);
      if (!isNaN(minFee)) {
        filtered = filtered.filter(apt => (apt.consultationFee || 0) >= minFee);
      }
    }

    if (advancedFilters.maxFee && advancedFilters.maxFee !== '') {
      const maxFee = parseFloat(advancedFilters.maxFee);
      if (!isNaN(maxFee)) {
        filtered = filtered.filter(apt => (apt.consultationFee || 0) <= maxFee);
      }
    }

    // Date range filters 
    if (advancedFilters.startDate && advancedFilters.startDate !== '') {
      const startDate = new Date(advancedFilters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(apt => {
        if (!apt.date) return false;
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= startDate;
      });
    }

    if (advancedFilters.endDate && advancedFilters.endDate !== '') {
      const endDate = new Date(advancedFilters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(apt => {
        if (!apt.date) return false;
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate <= endDate;
      });
    }

    // Apply date range preset
    if (advancedFilters.dateRange && advancedFilters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (advancedFilters.dateRange) {
        case 'today':
          filtered = filtered.filter(apt => {
            if (!apt.date) return false;
            const aptDate = new Date(apt.date);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate.getTime() === today.getTime();
          });
          break;
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          filtered = filtered.filter(apt => {
            if (!apt.date) return false;
            const aptDate = new Date(apt.date);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate.getTime() === tomorrow.getTime();
          });
          break;
        case 'week':
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          filtered = filtered.filter(apt => {
            if (!apt.date) return false;
            const aptDate = new Date(apt.date);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate >= today && aptDate <= weekEnd;
          });
          break;
        case 'month':
          const monthEnd = new Date(today);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          filtered = filtered.filter(apt => {
            if (!apt.date) return false;
            const aptDate = new Date(apt.date);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate >= today && aptDate <= monthEnd;
          });
          break;
        default:
          break;
      }
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [filter, searchTerm, appointments, advancedFilters]);

  // pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleFilterChange = (key, value) => {
    setAdvancedFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setAdvancedFilters({
      dateRange: 'all',
      minFee: '',
      maxFee: '',
      patientName: '',
      doctorName: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
    setFilter('all');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filter !== 'all') count++;
    if (searchTerm && searchTerm.trim()) count++;
    if (advancedFilters.patientName && advancedFilters.patientName.trim()) count++;
    if (advancedFilters.doctorName && advancedFilters.doctorName.trim()) count++;
    if (advancedFilters.minFee && advancedFilters.minFee !== '') count++;
    if (advancedFilters.maxFee && advancedFilters.maxFee !== '') count++;
    if (advancedFilters.startDate && advancedFilters.startDate !== '') count++;
    if (advancedFilters.endDate && advancedFilters.endDate !== '') count++;
    if (advancedFilters.dateRange && advancedFilters.dateRange !== 'all') count++;
    return count;
  };

  const handleViewReport = (report) => {
    try {
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
        alert('Unable to view report: Invalid file path');
        return;
      }
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error opening report:', error);
      alert('Unable to view report. Please try again later.');
    }
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
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <XCircle size={24} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className={`p-4 rounded-xl ${statusConfig.color} border`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <StatusIcon size={20} />
                  <span className="font-semibold capitalize">{statusConfig.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-gray-500" />
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${paymentConfig.color}`}>
                    {paymentConfig.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  Patient Information
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p><span className="text-sm text-gray-500">Name:</span> <span className="font-medium">{appointment.patientName}</span></p>
                  <p><span className="text-sm text-gray-500">Email:</span> <span className="font-medium">{appointment.patientEmail}</span></p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Stethoscope size={18} className="text-green-600" />
                  Doctor Information
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p><span className="text-sm text-gray-500">Name:</span> <span className="font-medium">Dr. {appointment.doctorName}</span></p>
                  <p><span className="text-sm text-gray-500">Specialty:</span> <span className="font-medium">{appointment.doctorSpecialty}</span></p>
                </div>
              </div>
            </div>

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
                
                <div>
                  <p className="text-xs text-gray-500">Consultation Fee</p>
                  <p className="font-medium text-green-600">{formatCurrency(appointment.consultationFee)}</p>
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

            {appointment.symptoms && (
              <div className="p-4 bg-yellow-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={18} className="text-yellow-600" />
                  <h3 className="font-semibold">Symptoms / Reason for Visit</h3>
                </div>
                <p className="text-gray-700">{appointment.symptoms}</p>
              </div>
            )}

            {appointment.medicalHistory && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={18} className="text-blue-600" />
                  <h3 className="font-semibold">Medical History</h3>
                </div>
                <p className="text-gray-700">{appointment.medicalHistory}</p>
              </div>
            )}

            {appointment.uploadedReports && appointment.uploadedReports.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  Uploaded Reports ({appointment.uploadedReports.length})
                </h3>
                <div className="space-y-2">
                  {appointment.uploadedReports.map((report, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-600" />
                        <span className="text-sm">{report.fileName}</span>
                      </div>
                      <button
                        onClick={() => handleViewReport(report)}
                        className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                      >
                        <Download size={14} /> View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {appointment.consultationNotes && (
              <div className="p-4 bg-green-50 rounded-xl">
                <h3 className="font-semibold mb-2">Consultation Notes</h3>
                <p className="text-gray-700">{appointment.consultationNotes}</p>
                {appointment.prescription && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <h3 className="font-semibold mb-2">Prescription</h3>
                    <p className="text-gray-700">{appointment.prescription}</p>
                  </div>
                )}
              </div>
            )}

            {(appointment.rejectionReason || appointment.cancellationReason) && (
              <div className="p-4 bg-red-50 rounded-xl">
                <p className="text-sm text-red-700">
                  <span className="font-semibold">Reason:</span> {appointment.rejectionReason || appointment.cancellationReason}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Appointment Card Component
  const AppointmentCard = ({ appointment, index }) => {
    const statusConfig = getStatusConfig(appointment.status);
    const StatusIcon = statusConfig.icon;
    const paymentConfig = getPaymentStatusConfig(appointment.paymentStatus);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
        onClick={() => handleViewDetails(appointment)}
      >
        <div className={`h-1 ${
          appointment.status === 'pending' ? 'bg-yellow-500' :
          appointment.status === 'accepted' ? 'bg-blue-500' :
          appointment.status === 'completed' ? 'bg-green-500' :
          appointment.status === 'rejected' ? 'bg-red-500' :
          'bg-gray-400'
        }`} />
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Dr. {appointment.doctorName}</h3>
                <p className="text-xs text-gray-500">{appointment.doctorSpecialty}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                <StatusIcon size={12} />
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
              <User size={12} className="text-gray-400" />
              <span className="font-medium">{appointment.patientName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Calendar size={12} className="text-gray-400" />
              <span>{formatShortDate(appointment.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Clock size={12} className="text-gray-400" />
              <span>{appointment.startTime} - {appointment.endTime}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Fee</p>
              <p className="font-semibold text-green-600 text-sm">{formatCurrency(appointment.consultationFee)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Payment</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${paymentConfig.color}`}>
                {paymentConfig.label}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
     
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">All Appointments</h1>
            <p className="text-gray-500 mt-1">View and manage all appointments across the platform</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <CalendarIcon className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Total</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <AlertCircle className="w-8 h-8 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.pending}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Pending</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <CheckCircle className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.accepted}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Accepted</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.completed}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Completed</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <XCircle className="w-8 h-8 text-red-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.rejected}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Rejected</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <AlertCircle className="w-8 h-8 text-orange-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.no_show}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Doctor-No-Show</p>
            </div>
            
          </div>

        
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by patient name, doctor name, email or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${showAdvancedFilters || getActiveFiltersCount() > 0
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
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {statusFilters.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient Name</label>
                      <input
                        type="text"
                        placeholder="Search patient..."
                        value={advancedFilters.patientName}
                        onChange={(e) => handleFilterChange('patientName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Doctor Name</label>
                      <input
                        type="text"
                        placeholder="Search doctor..."
                        value={advancedFilters.doctorName}
                        onChange={(e) => handleFilterChange('doctorName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Fee Range (LKR)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={advancedFilters.minFee}
                          onChange={(e) => handleFilterChange('minFee', e.target.value)}
                          className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={advancedFilters.maxFee}
                          onChange={(e) => handleFilterChange('maxFee', e.target.value)}
                          className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Date Range</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          placeholder="Start Date"
                          value={advancedFilters.startDate}
                          onChange={(e) => handleFilterChange('startDate', e.target.value)}
                          className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="date"
                          placeholder="End Date"
                          value={advancedFilters.endDate}
                          onChange={(e) => handleFilterChange('endDate', e.target.value)}
                          className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{currentItems.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{filteredAppointments.length}</span> appointments
            </p>
            <button
              onClick={fetchAppointments}
              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-1">No Appointments Found</h3>
              <p className="text-sm text-gray-500">No appointments match your current filters</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentItems.map((appointment, index) => (
                <AppointmentCard key={appointment._id} appointment={appointment} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {currentItems.map((appointment, index) => (
                <div key={appointment._id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => handleViewDetails(appointment)}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {appointment.patientName?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-gray-900">{appointment.patientName}</h4>
                          <span className="text-xs text-gray-500">with</span>
                          <span className="font-medium text-sm text-gray-900">Dr. {appointment.doctorName}</span>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusConfig(appointment.status).color}`}>
                            {getStatusConfig(appointment.status).label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar size={12} />{formatShortDate(appointment.date)}</span>
                          <span className="flex items-center gap-1"><Clock size={12} />{appointment.startTime}</span>
                          <span className="flex items-center gap-1 text-green-600 font-semibold">{formatCurrency(appointment.consultationFee)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(appointment); }}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <Eye size={12} /> View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-6">
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
        </div>
      </div>

     
      {showDetailsModal && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

export default AdminShowAppointments;