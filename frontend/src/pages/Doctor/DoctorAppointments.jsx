// src/pages/doctor/DoctorAppointments.jsx - Compact Card Version
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, User, Stethoscope, CheckCircle, XCircle, 
  Eye, Filter, ChevronDown, Search, AlertCircle, Activity,
  FileText, DollarSign, Phone, Mail, MapPin, MessageCircle,
  TrendingUp, Users, Calendar as CalendarIcon, Clock as ClockIcon,
  Grid3x3, List, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DoctorAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: 'all',
    minFee: '',
    maxFee: '',
    patientName: ''
  });

  const statusFilters = [
    { value: 'all', label: 'All', color: 'gray', icon: CalendarIcon, count: appointments.length },
    { value: 'pending', label: 'Pending', color: 'yellow', icon: AlertCircle, count: appointments.filter(apt => apt.status === 'pending').length },
    { value: 'accepted', label: 'Accepted', color: 'blue', icon: CheckCircle, count: appointments.filter(apt => apt.status === 'accepted').length },
    { value: 'completed', label: 'Completed', color: 'green', icon: TrendingUp, count: appointments.filter(apt => apt.status === 'completed').length },
    { value: 'rejected', label: 'Rejected', color: 'red', icon: XCircle, count: appointments.filter(apt => apt.status === 'rejected').length },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'accepted': return CheckCircle;
      case 'completed': return TrendingUp;
      case 'rejected': return XCircle;
      default: return AlertCircle;
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

  const formatShortDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDateRangeFilter = (appointmentDate, range) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aptDate = new Date(appointmentDate);
    aptDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((aptDate - today) / (1000 * 60 * 60 * 24));

    switch (range) {
      case 'today': return diffDays === 0;
      case 'tomorrow': return diffDays === 1;
      case 'week': return diffDays >= 0 && diffDays <= 7;
      case 'month': return diffDays >= 0 && diffDays <= 30;
      case 'past': return diffDays < 0;
      default: return true;
    }
  };

  // Fetch appointments using public endpoint
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
        setAppointments(data.appointments);
        setFilteredAppointments(data.appointments);
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

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  // Filter appointments
  useEffect(() => {
    let filtered = [...appointments];
    
    // Status filter
    if (filter !== 'all') {
      filtered = filtered.filter(apt => apt.status === filter);
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.symptoms?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Advanced filters
    if (advancedFilters.dateRange !== 'all') {
      filtered = filtered.filter(apt => getDateRangeFilter(apt.date, advancedFilters.dateRange));
    }
    
    if (advancedFilters.minFee) {
      filtered = filtered.filter(apt => (apt.consultationFee || 0) >= parseInt(advancedFilters.minFee));
    }
    
    if (advancedFilters.maxFee) {
      filtered = filtered.filter(apt => (apt.consultationFee || 0) <= parseInt(advancedFilters.maxFee));
    }
    
    if (advancedFilters.patientName) {
      filtered = filtered.filter(apt => 
        apt.patientName?.toLowerCase().includes(advancedFilters.patientName.toLowerCase())
      );
    }
    
    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [filter, searchTerm, appointments, advancedFilters]);

  // Update status counts
  useEffect(() => {
    statusFilters.forEach(status => {
      if (status.value === 'all') {
        status.count = appointments.length;
      } else {
        status.count = appointments.filter(apt => apt.status === status.value).length;
      }
    });
  }, [appointments]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  // Accept appointment
  const handleAccept = async (appointment) => {
    setProcessingId(appointment._id);
    
    try {
      const url = `http://localhost:5015/api/appointments/accept/${appointment._id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        fetchAppointments();
      } else {
        alert('❌ Failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Reject appointment
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setProcessingId(selectedAppointment._id);
    
    try {
      const url = `http://localhost:5015/api/appointments/reject/${selectedAppointment._id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReason })
      });
      const data = await response.json();
      
      if (data.success) {
        setShowRejectModal(false);
        setRejectionReason('');
        fetchAppointments();
      } else {
        alert('❌ Failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Calculate stats
  const totalEarnings = appointments
    .filter(apt => apt.status === 'completed')
    .reduce((sum, apt) => sum + (apt.consultationFee || 0), 0);
  
  const completedCount = appointments.filter(apt => apt.status === 'completed').length;
  const pendingCount = appointments.filter(apt => apt.status === 'pending').length;

  // Compact Appointment Card Component
  const AppointmentCard = ({ appointment, index }) => {
    const StatusIconComponent = getStatusIcon(appointment.status);
    const statusColor = getStatusColor(appointment.status);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/20"
      >
        {/* Compact Header */}
        <div className="p-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {appointment.patientName?.charAt(0) || 'P'}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">{appointment.patientName}</h4>
                <p className="text-xs text-gray-500">{appointment.patientEmail?.split('@')[0]}</p>
              </div>
            </div>
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusColor}`}>
              <StatusIconComponent className="w-3 h-3" />
              {appointment.status}
            </div>
          </div>
        </div>
        
        {/* Compact Body */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>{formatShortDate(appointment.date)}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="w-3 h-3" />
              <span>{appointment.startTime}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
              <DollarSign className="w-3 h-3" />
              LKR {appointment.consultationFee?.toLocaleString()}
            </div>
          </div>
          
          {appointment.symptoms && (
            <p className="text-xs text-gray-600 line-clamp-1">
              <span className="font-medium">Symptoms:</span> {appointment.symptoms}
            </p>
          )}
        </div>
        
        {/* Compact Actions */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => {
              setSelectedAppointment(appointment);
              setShowModal(true);
            }}
            className="flex-1 px-2 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
          
          {appointment.status === 'pending' && (
            <>
              <button
                onClick={() => handleAccept(appointment)}
                disabled={processingId === appointment._id}
                className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                Accept
              </button>
              <button
                onClick={() => {
                  setSelectedAppointment(appointment);
                  setShowRejectModal(true);
                }}
                className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
              >
                <XCircle className="w-3 h-3" />
                Reject
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  // List View Item Component
  const AppointmentListItem = ({ appointment, index }) => {
    const StatusIconComponent = getStatusIcon(appointment.status);
    const statusColor = getStatusColor(appointment.status);
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {appointment.patientName?.charAt(0) || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm text-gray-900">{appointment.patientName}</h4>
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusColor}`}>
                  <StatusIconComponent className="w-3 h-3" />
                  {appointment.status}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatShortDate(appointment.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {appointment.startTime}
                </span>
                <span className="flex items-center gap-1 text-green-600 font-semibold">
                  <DollarSign className="w-3 h-3" />
                  LKR {appointment.consultationFee?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedAppointment(appointment);
                setShowModal(true);
              }}
              className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              View
            </button>
            
            {appointment.status === 'pending' && (
              <>
                <button
                  onClick={() => handleAccept(appointment)}
                  disabled={processingId === appointment._id}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Accept
                </button>
                <button
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setShowRejectModal(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-500 mt-1">Manage your patient appointments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statusFilters.map((status) => (
          <motion.button
            key={status.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilter(status.value)}
            className={`p-3 rounded-xl text-center transition-all ${
              filter === status.value
                ? 'bg-primary text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-primary/50'
            }`}
          >
            <status.icon className={`w-5 h-5 mx-auto mb-1 ${
              filter === status.value ? 'text-white' : 'text-gray-500'
            }`} />
            <p className="text-xl font-bold">{status.count}</p>
            <p className="text-xs">{status.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, email or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              showAdvancedFilters || Object.values(advancedFilters).some(v => v && v !== 'all')
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {Object.values(advancedFilters).some(v => v && v !== 'all') && (
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
        
        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={advancedFilters.dateRange}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="week">Next 7 Days</option>
                    <option value="month">Next 30 Days</option>
                    <option value="past">Past Appointments</option>
                  </select>
                </div>
                
                
                
                
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    placeholder="Search patient..."
                    value={advancedFilters.patientName}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, patientName: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              {/* Clear Filters Button */}
              {(searchTerm || advancedFilters.dateRange !== 'all' || advancedFilters.minFee || advancedFilters.maxFee || advancedFilters.patientName) && (
                <div className="mt-3 text-right">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setAdvancedFilters({
                        dateRange: 'all',
                        minFee: '',
                        maxFee: '',
                        patientName: ''
                      });
                    }}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{currentItems.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{filteredAppointments.length}</span> appointments
        </p>
      </div>

      {/* Appointments Grid/List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">No Appointments Found</h3>
          <p className="text-sm text-gray-500">No appointments match your current filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentItems.map((appointment, index) => (
            <AppointmentCard key={appointment._id} appointment={appointment} index={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {currentItems.map((appointment, index) => (
            <AppointmentListItem key={appointment._id} appointment={appointment} index={index} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Keep existing modals from previous version */}
      {/* Appointment Details Modal - Same as before */}
      <AnimatePresence>
        {showModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md">
                    {selectedAppointment.patientName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedAppointment.patientName}</h3>
                    <p className="text-gray-600 flex items-center gap-1 mt-1">
                      <Mail className="w-4 h-4" />
                      {selectedAppointment.patientEmail} 
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(selectedAppointment.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="font-medium">{selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Consultation Fee</p>
                      <p className="font-medium text-green-600">LKR {selectedAppointment.consultationFee?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Activity className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className={`font-medium capitalize ${selectedAppointment.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {selectedAppointment.status}
                      </p>
                    </div>
                  </div>
                </div>
                
                {selectedAppointment.symptoms && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Symptoms & Reason for Visit
                    </p>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-gray-700">{selectedAppointment.symptoms}</p>
                    </div>
                  </div>
                )}
                
                {selectedAppointment.medicalHistory && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Medical History
                    </p>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-gray-700">{selectedAppointment.medicalHistory}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowRejectModal(false);
              setRejectionReason('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Reject Appointment</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting appointment with <strong className="text-gray-900">{selectedAppointment.patientName}</strong>
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                rows="4"
              />
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReject}
                  disabled={processingId === selectedAppointment._id}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                >
                  {processingId === selectedAppointment._id ? 'Processing...' : 'Confirm Rejection'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorAppointments;