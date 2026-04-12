
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, User, DollarSign, FileText,
  Activity, Mail, Phone, CheckCircle, XCircle, Video,
  Download, CreditCard, AlertCircle, Stethoscope, PartyPopper, Sparkles
} from 'lucide-react';

const DoctorAppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptData, setAcceptData] = useState(null);

  useEffect(() => {
    console.log('Appointment ID from params:', id);
    fetchAppointmentDetails();
  }, [id]);

  // Real-time status tracking
  useEffect(() => {
    let pollInterval;
    if (appointment && ['pending', 'accepted'].includes(appointment.status)) {
      pollInterval = setInterval(() => {
        fetchAppointmentDetails(true);
      }, 5000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [appointment?.status, id]);

  // Handle viewing report from Cloudinary
  const handleViewReport = (report) => {
    try {
      if (report.filePath) {
        window.open(report.filePath, '_blank');
      } else {
        alert('Unable to view report: Invalid file path');
      }
    } catch (error) {
      console.error('Error opening report:', error);
      alert('Unable to view report. Please try again later.');
    }
  };

  const fetchAppointmentDetails = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);

      const url = `http://localhost:5015/api/appointments/${id}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.appointment) {
        setAppointment(data.appointment);
      } else {
        setError('Appointment not found');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      setError('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setProcessing(true);
    try {
      const url = `http://localhost:5015/api/appointments/accept/${id}`;
      const response = await fetch(url, { method: 'PUT' });
      const data = await response.json();

      if (data.success) {
        await fetchAppointmentDetails();
        setAcceptData({
          patientName: appointment.patientName,
          date: formatDate(appointment.date),
          time: `${appointment.startTime} - ${appointment.endTime}`,
          consultationFee: appointment.consultationFee
        });
        setShowAcceptModal(true);
      } else {
        alert('Failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error accepting appointment:', error);
      alert('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      const url = `http://localhost:5015/api/appointments/reject/${id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReason })
      });
      const data = await response.json();

      if (data.success) {
        setShowRejectModal(false);
        setRejectionReason('');
        await fetchAppointmentDetails();
        alert('Appointment rejected successfully');
      } else {
        alert('Failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const closeAcceptModal = () => {
    setShowAcceptModal(false);
    setAcceptData(null);
  };

  const handleJoinCall = () => {
    window.open(`/telemedicine/${appointment._id}`, '_blank');
  };

  const canJoinCall = () => {
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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'accepted': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'completed': return 'bg-green-50 border-green-200 text-green-800';
      case 'rejected': return 'bg-red-50 border-red-200 text-red-800';
      case 'cancelled': return 'bg-gray-50 border-gray-200 text-gray-800';
      case 'no_show': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'doctor_no_show': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'accepted': return CheckCircle;
      case 'completed': return CheckCircle;
      case 'rejected': return XCircle;
      case 'cancelled': return XCircle;
      case 'no_show': return AlertCircle;
      case 'doctor_no_show': return AlertCircle;
      default: return AlertCircle;
    }
  };

  // Accept Success Modal Component
  const AcceptSuccessModal = () => {
    if (!showAcceptModal || !acceptData) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
        onClick={closeAcceptModal}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="absolute -top-10 left-1/2 transform -translate-x-1/2"
            >
              <div className="bg-white rounded-full p-3 shadow-xl">
                <PartyPopper size={48} className="text-green-500" />
              </div>
            </motion.div>
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mt-4"
            >
              Appointment Accepted!
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-green-100 mt-1"
            >
              Patient has been notified
            </motion.p>
          </div>

          <div className="p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mb-4"
            >
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                  >
                    <Sparkles size={20} className="text-yellow-500" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3 mb-6"
            >
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="font-semibold text-green-800">Appointment Confirmed</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient:</span>
                    <span className="font-medium text-gray-800">{acceptData?.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-800">{acceptData?.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium text-gray-800">{acceptData?.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consultation Fee:</span>
                    <span className="font-medium text-green-600">LKR {acceptData?.consultationFee?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-blue-50 rounded-xl p-3 mb-6"
            >
              <p className="text-xs text-blue-800">
                <span className="font-semibold">📌 Payment Information:</span><br />
                • Patient has 10 minutes before appointment start to complete payment<br />
                • Telemedicine link will be available after payment is completed<br />
                • You can join the session 20 minutes before the scheduled time
              </p>
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={closeAcceptModal}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />
              Got it
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant">Loading appointment details...</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="text-center py-12">
        <div className="bg-error-container text-error p-4 rounded-2xl inline-block">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p>{error || 'Appointment not found'}</p>
        </div>
        <button
          onClick={() => navigate('/doctor/appointments')}
          className="mt-4 text-primary hover:underline flex items-center gap-2 mx-auto"
        >
          <ArrowLeft size={16} /> Back to Appointments
        </button>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(appointment.status);
  const statusColorClass = getStatusColor(appointment.status);

  return (
    <div className="space-y-6 pb-8">
    
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/doctor/appointments')}
          className="p-2 hover:bg-surface-container-low rounded-xl transition-all duration-200"
        >
          <ArrowLeft size={20} className="text-on-surface-variant" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-headline">Appointment Details</h1>
          <p className="text-on-surface-variant mt-0.5">View and manage appointment information</p>
        </div>
      </div>

  
      <div className={`p-5 rounded-2xl border ${statusColorClass} backdrop-blur-sm`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <StatusIcon size={22} />
            <span className="font-semibold capitalize text-base">
              {appointment.status === 'no_show' ? 'Patient No-Show' :
                appointment.status === 'doctor_no_show' ? 'Doctor No-Show' :
                  appointment.status}
            </span>
            {appointment.status === 'accepted' && appointment.paymentStatus === 'pending' && (
              <span className="text-sm text-orange-600 ml-2 bg-orange-100 px-2 py-0.5 rounded-full">⏰ Waiting for payment</span>
            )}
            {appointment.paymentStatus === 'completed' && (
              <span className="text-sm text-green-600 ml-2 bg-green-100 px-2 py-0.5 rounded-full">✓ Payment received</span>
            )}
          </div>
          {appointment.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                disabled={processing}
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Accept Appointment
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <XCircle size={16} />
                Reject
              </button>
            </div>
          )}
        </div>

    
        {appointment.status === 'no_show' && (
          <div className="mt-4 p-3 bg-orange-100 rounded-xl border border-orange-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-800">Patient No-Show</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              The patient did not join the telemedicine session. This appointment is marked as no-show.
            </p>
          </div>
        )}

   
        {appointment.status === 'doctor_no_show' && (
          <div className="mt-4 p-3 bg-purple-100 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">Doctor No-Show</span>
            </div>
            <p className="text-sm text-purple-700 mt-1">
              You did not join the telemedicine session. Patient may request a refund.
            </p>
          </div>
        )}

        {appointment.rejectionReason && (
          <div className="mt-3 p-3 bg-red-50 rounded-xl text-sm text-red-700 border border-red-100">
            <strong>Rejection Reason:</strong> {appointment.rejectionReason}
          </div>
        )}
      </div>

    
      <div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        style={{ overflow: 'visible' }}
      >
       
        <div className="lg:col-span-2 space-y-6">
 
          <div className="bg-white rounded-2xl shadow-ambient p-6 border border-outline-variant/20 hover:shadow-elevated transition-all duration-300">
            <h2 className="text-lg font-semibold text-on-surface mb-5 flex items-center gap-2 font-headline">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                <User size={18} className="text-primary" />
              </div>
              Patient Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-3 bg-surface-container-low rounded-xl">
                <p className="text-xs text-on-surface-variant mb-1">Full Name</p>
                <p className="font-semibold text-on-surface">{appointment.patientName || 'N/A'}</p>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl">
                <p className="text-xs text-on-surface-variant mb-1">Email</p>
                <p className="font-semibold text-on-surface flex items-center gap-2">
                  <Mail size={14} className="text-on-surface-variant" /> {appointment.patientEmail || 'N/A'}
                </p>
              </div>
            </div>
          </div>

   
          <div className="bg-white rounded-2xl shadow-ambient p-6 border border-outline-variant/20 hover:shadow-elevated transition-all duration-300">
            <h2 className="text-lg font-semibold text-on-surface mb-5 flex items-center gap-2 font-headline">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                <Calendar size={18} className="text-primary" />
              </div>
              Appointment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                <Calendar size={18} className="text-primary" />
                <div>
                  <p className="text-xs text-on-surface-variant">Date</p>
                  <p className="font-medium text-on-surface">{formatDate(appointment.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                <Clock size={18} className="text-primary" />
                <div>
                  <p className="text-xs text-on-surface-variant">Time</p>
                  <p className="font-medium text-on-surface">{appointment.startTime} - {appointment.endTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                <DollarSign size={18} className="text-secondary" />
                <div>
                  <p className="text-xs text-on-surface-variant">Consultation Fee</p>
                  <p className="font-semibold text-secondary">LKR {appointment.consultationFee?.toLocaleString() || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                <CreditCard size={18} className="text-primary" />
                <div>
                  <p className="text-xs text-on-surface-variant">Payment Status</p>
                  <p className={`font-semibold ${appointment.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                    {appointment.paymentStatus === 'completed' ? 'Paid ✓' : 'Pending ⏰'}
                  </p>
                </div>
              </div>
            </div>
          </div>

      
          <div className="bg-white rounded-2xl shadow-ambient p-6 border border-outline-variant/20 hover:shadow-elevated transition-all duration-300">
            <h2 className="text-lg font-semibold text-on-surface mb-5 flex items-center gap-2 font-headline">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                <Stethoscope size={18} className="text-primary" />
              </div>
              Medical Information
            </h2>

            {appointment.symptoms && (
              <div className="mb-5">
                <p className="text-sm text-on-surface-variant mb-2 font-medium">Symptoms / Reason for Visit</p>
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <p className="text-on-surface">{appointment.symptoms}</p>
                </div>
              </div>
            )}

            {appointment.medicalHistory && (
              <div className="mb-5">
                <p className="text-sm text-on-surface-variant mb-2 font-medium"> History</p>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-on-surface">{appointment.medicalHistory}</p>
                </div>
              </div>
            )}

            {appointment.uploadedReports && appointment.uploadedReports.length > 0 && (
              <div>
                <p className="text-sm text-on-surface-variant mb-2 font-medium">Uploaded Reports ({appointment.uploadedReports.length})</p>
                <div className="space-y-2">
                  {appointment.uploadedReports.map((report, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-all duration-200 group">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-primary" />
                        <span className="text-sm text-on-surface">{report.fileName}</span>
                      </div>
                      <button
                        onClick={() => handleViewReport(report)}
                        className="text-primary text-sm hover:underline flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      >
                        <Download size={14} /> View Report
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-ambient p-6 border border-outline-variant/20">
            <h2 className="text-lg font-semibold text-on-surface mb-4 font-headline">Additional Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-outline-variant/20">
                <span className="text-on-surface-variant">Booking Date</span>
                <span className="font-medium text-on-surface">{new Date(appointment.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-on-surface-variant">Appointment ID</span>
                <span className="font-mono text-xs text-on-surface">{appointment._id?.slice(-8)}</span>
              </div>
            </div>
          </div>

        
          {appointment.paymentStatus === 'completed' && appointment.status === 'accepted' && (
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20">
              <h2 className="text-lg font-semibold text-on-surface mb-3 flex items-center gap-2 font-headline">
                <Video size={20} className="text-primary" /> Telemedicine Session
              </h2>

              {canJoinCall() ? (
                <button
                  onClick={handleJoinCall}
                  className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <Video size={20} className="group-hover:scale-110 transition-transform" />
                  Join Telemedicine Session
                </button>
              ) : (
                <div className="text-center p-5 bg-white rounded-xl">
                  <Clock size={40} className="mx-auto text-on-surface-variant/50 mb-3" />
                  <p className="text-on-surface font-medium">Meeting Available 20 Minutes Before</p>
                  <p className="text-sm text-on-surface-variant mt-2">
                    Scheduled Time: {appointment.startTime} - {appointment.endTime}
                  </p>
                </div>
              )}
            </div>
          )}
      
   
          {appointment.paymentStatus !== 'completed' && appointment.status === 'accepted' && (
            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard size={20} className="text-orange-600" />
                <h2 className="text-lg font-semibold text-on-surface">Awaiting Payment</h2>
              </div>
              <p className="text-sm text-on-surface-variant">
                The patient needs to complete the payment before the telemedicine session can begin.
              </p>
              <p className="text-xs text-orange-600 mt-3 pt-2 border-t border-orange-200">
                Payment deadline: {appointment.paymentDeadline ? new Date(appointment.paymentDeadline).toLocaleString() : '10 minutes before meeting start'}
              </p>
            </div>
          )}

       
          {appointment.status === 'no_show' && (
            <div className="bg-orange-100 rounded-2xl p-6 border border-orange-300">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle size={20} className="text-orange-700" />
                <h2 className="text-lg font-semibold text-orange-800">Appointment Status: No-Show</h2>
              </div>
              <p className="text-sm text-orange-700">
                The patient did not join the scheduled telemedicine session.
              </p>
            </div>
          )}

          {appointment.status === 'doctor_no_show' && (
            <div className="bg-purple-100 rounded-2xl p-6 border border-purple-300">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-purple-700" />
                <h2 className="text-lg font-semibold text-purple-800">Appointment Status: Doctor No-Show</h2>
              </div>
              <p className="text-sm text-purple-700">
                You missed this scheduled telemedicine session.
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => {
              setShowRejectModal(false);
              setRejectionReason('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Reject Appointment</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-on-surface-variant mb-4">
                  Please provide a reason for rejecting appointment with <strong className="text-on-surface">{appointment.patientName}</strong>
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full p-3 border border-outline-variant rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-5 resize-none"
                  rows="4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-4 py-2.5 bg-surface-container-low text-on-surface-variant rounded-xl font-semibold hover:bg-surface-container transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

  
      <AnimatePresence>
        {showAcceptModal && <AcceptSuccessModal />}
      </AnimatePresence>
    </div>
  );
};

export default DoctorAppointmentDetail;