// src/pages/doctor/DoctorAppointments.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, Stethoscope, CheckCircle, XCircle,
  Eye, Filter, Search, AlertCircle, Activity,
  FileText, Mail,
  TrendingUp, Calendar as CalendarIcon,
  Grid3x3, List, ChevronLeft, ChevronRight,
  Download, Video, CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DoctorAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
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
    { value: 'all', label: 'All', icon: CalendarIcon },
    { value: 'pending', label: 'Pending', icon: AlertCircle },
    { value: 'accepted', label: 'Accepted', icon: CheckCircle },
    { value: 'completed', label: 'Completed', icon: TrendingUp },
    { value: 'rejected', label: 'Rejected', icon: XCircle },
    { value: 'no_show', label: 'No-Show', icon: AlertCircle },      // NEW
    { value: 'doctor_no_show', label: 'Doctor No-Show', icon: AlertCircle }, // NEW
  ];

  // In DoctorAppointments.jsx - Update getStatusConfig
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
      // NEW STATUSES
      case 'no_show':
        return { label: 'Patient No-Show', color: 'bg-orange-100 text-orange-800', icon: AlertCircle };
      case 'doctor_no_show':
        return { label: 'Doctor No-Show', color: 'bg-purple-100 text-purple-800', icon: AlertCircle };
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

  const getDateRangeFilter = (appointmentDate, range) => {
    if (!appointmentDate) return false;
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

    if (filter !== 'all') {
      filtered = filtered.filter(apt => apt.status === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.symptoms?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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
      const response = await fetch(url, { method: 'PUT' });
      const data = await response.json();

      if (data.success) {
        await fetchAppointments();
        alert('✅ Appointment accepted successfully!');
      } else {
        alert('❌ Failed: ' + (data.message || 'Unknown error'));
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
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() })
      });
      const data = await response.json();

      if (data.success) {
        setShowRejectModal(false);
        setRejectionReason('');
        await fetchAppointments();
        alert('✅ Appointment rejected successfully');
      } else {
        alert('❌ Failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setSelectedAppointment(null);
  };

  // View Details handler - opens modal instead of navigating
  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleJoinCall = (appointment) => {
    window.open(`/telemedicine/${appointment._id}`, '_blank');
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
                  {appointment.status === 'accepted' && appointment.paymentStatus === 'pending' && (
                    <span className="text-sm text-orange-600 ml-2">
                      ⏰ {formatTimeRemaining(appointment.paymentDeadline)}
                    </span>
                  )}
                  {appointment.paymentStatus === 'completed' && (
                    <span className="text-sm text-green-600 ml-2">✓ Payment received</span>
                  )}
                </div>
                {appointment.rejectionReason && (
                  <div className="text-sm text-red-600">
                    Reason: {appointment.rejectionReason}
                  </div>
                )}
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

                <div>
                  <p className="text-xs text-gray-500">Consultation Fee</p>
                  <p className="font-medium text-green-600">LKR {appointment.consultationFee?.toLocaleString()}</p>
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

            {/* Medical History */}
            {appointment.medicalHistory && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={18} className="text-blue-600" />
                  <h3 className="font-semibold">Medical History</h3>
                </div>
                <p className="text-gray-700">{appointment.medicalHistory}</p>
              </div>
            )}

            {/* Uploaded Reports */}
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
                      <a
                        href={`http://localhost:5015/${report.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                      >
                        <Download size={14} /> View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consultation Notes (if completed) */}
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

            {/* Action Buttons for Doctor */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              {appointment.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      handleAccept(appointment);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Accept Appointment
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      setSelectedAppointment(appointment);
                      setShowRejectModal(true);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} />
                    Reject
                  </button>
                </div>
              )}

              {canJoinCall(appointment) && (
                <button
                  onClick={() => {
                    onClose();
                    handleJoinCall(appointment);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Video size={20} />
                  Join Telemedicine Session
                </button>
              )}

              {appointment.paymentStatus === 'completed' && appointment.status === 'accepted' && !canJoinCall(appointment) && (
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Clock size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">Meeting will be available 20 minutes before the scheduled time</p>
                  <p className="text-sm text-gray-500 mt-1">Scheduled: {appointment.startTime}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Appointment Card Component - WITHOUT colored status bar
  const AppointmentCard = ({ appointment, index }) => {
    const statusConfig = getStatusConfig(appointment.status);
    const StatusIcon = statusConfig.icon;
    const paymentConfig = getPaymentStatusConfig(appointment.paymentStatus);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
      >
        {/* No colored status bar at the top */}

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">{appointment.patientName}</h3>
                <p className="text-xs text-gray-500">{appointment.patientEmail?.split('@')[0]}</p>
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

          {/* Appointment Details */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Calendar size={12} className="text-gray-400" />
              <span>{formatShortDate(appointment.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Clock size={12} className="text-gray-400" />
              <span>{appointment.startTime} - {appointment.endTime}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600 col-span-2">

              <span className="font-semibold text-green-600">LKR {appointment.consultationFee?.toLocaleString()}</span>
            </div>
          </div>

          {/* Rejection Reason */}
          {appointment.rejectionReason && (
            <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs text-red-600 font-medium mb-0.5">Cancellation Reason:</p>
              <p className="text-xs text-red-700">{appointment.rejectionReason}</p>
            </div>
          )}

          {/* Symptoms Preview */}
          {appointment.symptoms && (
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-0.5">Symptoms:</p>
              <p className="text-xs text-gray-700 line-clamp-2">{appointment.symptoms}</p>
            </div>
          )}

          {/* Reports Indicator */}
          {appointment.uploadedReports && appointment.uploadedReports.length > 0 && (
            <div className="mb-3 flex items-center gap-1.5 text-xs text-blue-600">
              <FileText size={12} />
              <span>{appointment.uploadedReports.length} report(s) attached</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => handleViewDetails(appointment)}
              className="flex-1 px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
            >
              <Eye size={12} />
              View Full Details
            </button>

            {appointment.status === 'pending' && (
              <>
                <button
                  onClick={() => handleAccept(appointment)}
                  disabled={processingId === appointment._id}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircle size={12} />
                  Accept
                </button>
                <button
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setShowRejectModal(true);
                  }}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                >
                  <XCircle size={12} />
                  Reject
                </button>
              </>
            )}

            {canJoinCall(appointment) && (
              <button
                onClick={() => handleJoinCall(appointment)}
                className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
              >
                <Video size={12} />
                Join Call
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // List View Item Component - WITHOUT colored status bar
  const AppointmentListItem = ({ appointment, index }) => {
    const statusConfig = getStatusConfig(appointment.status);
    const StatusIcon = statusConfig.icon;
    const paymentConfig = getPaymentStatusConfig(appointment.paymentStatus);

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {appointment.patientName?.charAt(0) || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm text-gray-900">{appointment.patientName}</h4>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                  <StatusIcon size={12} />
                  {statusConfig.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentConfig.color}`}>
                  {paymentConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {formatShortDate(appointment.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {appointment.startTime}
                </span>
                <span className="flex items-center gap-1 text-green-600 font-semibold">

                  LKR {appointment.consultationFee?.toLocaleString()}
                </span>
              </div>
              {appointment.symptoms && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  <span className="font-medium">Symptoms:</span> {appointment.symptoms.substring(0, 60)}...
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleViewDetails(appointment)}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <Eye size={12} />
              View Details
            </button>

            {appointment.status === 'pending' && (
              <>
                <button
                  onClick={() => handleAccept(appointment)}
                  disabled={processingId === appointment._id}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <CheckCircle size={12} />
                  Accept
                </button>
                <button
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setShowRejectModal(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                >
                  <XCircle size={12} />
                  Reject
                </button>
              </>
            )}

            {canJoinCall(appointment) && (
              <button
                onClick={() => handleJoinCall(appointment)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Video size={12} />
                Join Call
              </button>
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
          <button
            key={status.value}
            onClick={() => setFilter(status.value)}
            className={`p-3 rounded-xl text-center transition-all ${filter === status.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-500/50'
              }`}
          >
            <status.icon className={`w-5 h-5 mx-auto mb-1 ${filter === status.value ? 'text-white' : 'text-gray-500'
              }`} />
            <p className="text-xl font-bold">
              {status.value === 'all'
                ? appointments.length
                : appointments.filter(apt => apt.status === status.value).length}
            </p>
            <p className="text-xs">{status.label}</p>
          </button>
        ))}
      </div>

      {/* Search and Filter Section */}
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

          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${showAdvancedFilters || Object.values(advancedFilters).some(v => v && v !== 'all')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

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
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={advancedFilters.dateRange}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    placeholder="Search patient..."
                    value={advancedFilters.patientName}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, patientName: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

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
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
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
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeRejectModal}
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
                Please provide a reason for rejecting appointment with <strong>{selectedAppointment.patientName}</strong>
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                rows="4"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={processingId === selectedAppointment._id}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {processingId === selectedAppointment._id ? 'Processing...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={closeRejectModal}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorAppointments;