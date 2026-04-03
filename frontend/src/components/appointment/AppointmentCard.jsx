// src/components/appointment/AppointmentCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, DollarSign, User, Phone, MapPin, Video, 
  CreditCard, CheckCircle, XCircle, Clock as ClockIcon, 
  FileText, Download, Eye, X, MessageCircle, Stethoscope,
  Calendar as CalendarIcon, AlertCircle, Activity, ArrowRight,
  ShieldCheck, Sparkles, HeartPulse, ExternalLink, Upload,
  Image, File, FileArchive, Trash2, ZoomIn
} from 'lucide-react';

const AppointmentCard = ({ appointment, userType, onStatusUpdate, onPaymentComplete }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  // Safe date formatting
  const formatDate = (date) => {
    if (!date) return 'Date not set';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid date';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  // Get file icon based on file type
  const getFileIcon = (filename) => {
    if (!filename) return <File size={20} />;
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return <Image size={20} />;
    }
    if (ext === 'pdf') return <FileText size={20} />;
    if (['zip', 'rar', '7z'].includes(ext)) return <FileArchive size={20} />;
    return <File size={20} />;
  };

  // Get file type badge
  const getFileTypeBadge = (filename) => {
    if (!filename) return 'FILE';
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'IMAGE';
    if (ext === 'pdf') return 'PDF';
    if (['doc', 'docx'].includes(ext)) return 'DOC';
    return ext?.toUpperCase() || 'FILE';
  };

  const statusConfig = {
    pending: { label: 'Pending', icon: ClockIcon, gradient: 'from-amber-50 to-amber-100/50', textColor: 'text-amber-700', borderColor: 'border-amber-200', dotColor: 'bg-amber-500' },
    accepted: { label: 'Awaiting Payment', icon: CreditCard, gradient: 'from-blue-50 to-indigo-100/50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200', dotColor: 'bg-indigo-500' },
    confirmed: { label: 'Confirmed', icon: CheckCircle, gradient: 'from-emerald-50 to-teal-100/50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200', dotColor: 'bg-emerald-500' },
    rejected: { label: 'Declined', icon: XCircle, gradient: 'from-rose-50 to-rose-100/50', textColor: 'text-rose-700', borderColor: 'border-rose-200', dotColor: 'bg-rose-500' },
    cancelled: { label: 'Cancelled', icon: XCircle, gradient: 'from-gray-50 to-gray-100/50', textColor: 'text-gray-600', borderColor: 'border-gray-200', dotColor: 'bg-gray-400' },
    completed: { label: 'Completed', icon: CheckCircle, gradient: 'from-emerald-50 to-emerald-100/50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200', dotColor: 'bg-emerald-500' }
  };

  const getPaymentConfig = () => {
    const status = appointment?.paymentStatus || 'pending';
    const configs = {
      pending: { label: 'Payment Pending', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
      completed: { label: 'Payment Complete', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      paid: { label: 'Paid', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      failed: { label: 'Payment Failed', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
    };
    return configs[status] || configs.pending;
  };

  const handleAccept = async () => {
    if (!appointment?._id) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5015/api/appointments/${appointment._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'accepted' })
      });
      const data = await response.json();
      if (data.success) {
        onStatusUpdate?.(data.appointment);
      } else {
        alert(data.message || 'Failed to accept appointment');
      }
    } catch (error) {
      console.error('Error accepting appointment:', error);
      alert('Failed to accept appointment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5015/api/appointments/${appointment._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'rejected', rejectionReason })
      });
      const data = await response.json();
      if (data.success) {
        onStatusUpdate?.(data.appointment);
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        alert(data.message || 'Failed to reject appointment');
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('Failed to reject appointment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    navigate(`/payment/${appointment._id}`, { state: { appointment } });
  };

  const handleJoinMeeting = () => {
    if (appointment?.telemedicineLink) {
      window.open(appointment.telemedicineLink, '_blank');
    } else {
      alert('Meeting link will be available after payment confirmation');
    }
  };

  const handleDownloadReport = (report) => {
    const fileUrl = report?.filePath 
      ? `http://localhost:5015/${report.filePath}`
      : report?.url 
      ? report.url
      : null;
    
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      alert('File URL not available');
    }
  };

  if (!appointment) return null;

  const currentStatus = appointment?.status || 'pending';
  const status = statusConfig[currentStatus] || statusConfig.pending;
  const StatusIcon = status.icon;
  const paymentConfig = getPaymentConfig();
  const canJoinMeeting = appointment.paymentStatus === 'completed' && appointment.status === 'accepted' && appointment.telemedicineLink;
  const isDoctor = userType === 'doctor';
  const isPatient = userType === 'patient';
  const isPendingDoctorAction = isDoctor && appointment.status === 'pending';
  const isAwaitingPayment = isPatient && appointment.status === 'accepted' && appointment.paymentStatus === 'pending';

  // Safe access to uploaded reports - check multiple possible data structures
  const uploadedReports = appointment?.uploadedReports || appointment?.reports || appointment?.medicalReports || [];
  const hasReports = Array.isArray(uploadedReports) && uploadedReports.length > 0;

  return (
    <>
      {/* Modern Card Design */}
      <div className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-400 hover:shadow-elevated border border-gray-100">
        {/* Status Indicator Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${status.gradient.replace('50', '500').replace('/50', '')}`} />

        <div className="p-5">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${status.gradient} flex items-center justify-center`}>
                <StatusIcon size={18} className={status.textColor} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {isDoctor ? appointment.patientName : `Dr. ${appointment.doctorName || 'Doctor'}`}
                </h3>
                <p className="text-sm text-gray-500">
                  {isDoctor ? (appointment.patientEmail || 'Patient') : (appointment.doctorSpecialty || 'General Medicine')}
                </p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${status.gradient} border ${status.borderColor}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
              <span className={`text-xs font-semibold ${status.textColor}`}>{status.label}</span>
            </div>
          </div>

          {/* Appointment Details Grid */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} className="text-blue-600" />
              <span className="text-sm">{formatDate(appointment.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={14} className="text-blue-600" />
              <span className="text-sm">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign size={14} className="text-green-600" />
              <span className="text-sm font-semibold text-green-700">Rs. {appointment.consultationFee?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              {isDoctor ? <HeartPulse size={14} className="text-rose-500" /> : <Stethoscope size={14} className="text-blue-600" />}
              <span className="text-sm">{isDoctor ? 'Patient' : 'Consultation'}</span>
            </div>
          </div>

          {/* Symptoms Preview */}
          {appointment.symptoms && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Activity size={12} /> Reason for visit
              </p>
              <p className="text-sm text-gray-700 line-clamp-2">{appointment.symptoms}</p>
            </div>
          )}

          
          {/* Payment Status (if applicable) */}
          {appointment.paymentStatus && appointment.paymentStatus !== 'pending' && (
            <div className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-xl ${paymentConfig.bg} border border-${paymentConfig.color.split('-')[1]}/20`}>
              <paymentConfig.icon size={14} className={paymentConfig.color} />
              <span className={`text-xs font-medium ${paymentConfig.color}`}>{paymentConfig.label}</span>
            </div>
          )}

          {/* Telemedicine Ready Badge */}
          {canJoinMeeting && (
            <div className="mb-4 flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Video Consultation Ready</span>
              </div>
              <button
                onClick={handleJoinMeeting}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1"
              >
                Join <ExternalLink size={12} />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              Details
            </button>

            {isPendingDoctorAction && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  {isProcessing ? 'Processing...' : 'Accept'}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-medium text-sm hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={16} />
                  Decline
                </button>
              </>
            )}

            {isAwaitingPayment && (
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                Pay Rs. {appointment.consultationFee?.toLocaleString()}
              </button>
            )}

            {appointment.status === 'completed' && (
              <div className="flex-1 flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl py-2.5">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Consultation Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowDetailsModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CalendarIcon size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Appointment Details</h2>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-white/80 hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
              {/* Status Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl bg-gradient-to-br ${status.gradient} border ${status.borderColor}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusIcon size={16} className={status.textColor} />
                    <span className="text-xs uppercase tracking-wider text-gray-500">Status</span>
                  </div>
                  <p className={`font-semibold ${status.textColor}`}>{status.label}</p>
                </div>
                {appointment.paymentStatus && (
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${paymentConfig.bg} border border-${paymentConfig.color.split('-')[1]}/20`}>
                    <div className="flex items-center gap-2 mb-2">
                      <paymentConfig.icon size={16} className={paymentConfig.color} />
                      <span className="text-xs uppercase tracking-wider text-gray-500">Payment</span>
                    </div>
                    <p className={`font-semibold ${paymentConfig.color}`}>{paymentConfig.label}</p>
                  </div>
                )}
              </div>

              {/* Schedule Section */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600" />
                    Schedule
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Date</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(appointment.date)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Time</span>
                    <span className="text-sm font-medium text-gray-900">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Consultation Fee</span>
                    <span className="text-sm font-semibold text-green-700">Rs. {appointment.consultationFee?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Doctor/Patient Info */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    {isDoctor ? <HeartPulse size={18} className="text-rose-500" /> : <Stethoscope size={18} className="text-blue-600" />}
                    {isDoctor ? "Patient Information" : "Doctor Information"}
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  {isDoctor ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Full Name</span>
                        <span className="text-sm font-medium text-gray-900">{appointment.patientName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Email</span>
                        <span className="text-sm font-medium text-gray-900">{appointment.patientEmail || 'N/A'}</span>
                      </div>
                      {appointment.patientPhone && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 uppercase tracking-wider">Phone</span>
                          <span className="text-sm font-medium text-gray-900">{appointment.patientPhone}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Doctor</span>
                        <span className="text-sm font-medium text-gray-900">Dr. {appointment.doctorName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Specialty</span>
                        <span className="text-sm font-medium text-gray-900">{appointment.doctorSpecialty || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Experience</span>
                        <span className="text-sm font-medium text-gray-900">{appointment.doctorExperience || 5}+ years</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Medical Details */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Activity size={18} className="text-blue-600" />
                    Medical Details
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Symptoms / Reason</span>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{appointment.symptoms || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Medical History</span>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{appointment.medicalHistory || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Medical Reports Section - FIXED */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />
                    Medical Reports
                    {hasReports && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{uploadedReports.length}</span>}
                  </h3>
                </div>
                <div className="p-5">
                  {hasReports ? (
                    <div className="space-y-3">
                      {uploadedReports.map((report, idx) => {
                        const fileName = report.fileName || report.name || `report_${idx + 1}`;
                        const fileUrl = report.filePath 
                          ? `http://localhost:5015/${report.filePath}`
                          : report.url || null;
                        const fileType = getFileTypeBadge(fileName);
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => fileName.toLowerCase().endsWith(ext));
                        
                        return (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                fileType === 'IMAGE' ? 'bg-blue-100 text-blue-600' :
                                fileType === 'PDF' ? 'bg-red-100 text-red-600' :
                                'bg-gray-200 text-gray-600'
                              }`}>
                                {getFileIcon(fileName)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    fileType === 'IMAGE' ? 'bg-blue-100 text-blue-700' :
                                    fileType === 'PDF' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-200 text-gray-600'
                                  }`}>
                                    {fileType}
                                  </span>
                                  {report.uploadedAt && (
                                    <span className="text-xs text-gray-400">
                                      {new Date(report.uploadedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              {isImage && fileUrl && (
                                <button
                                  onClick={() => setSelectedReport({ url: fileUrl, name: fileName })}
                                  className="p-2 hover:bg-white rounded-lg transition-colors"
                                  title="Preview"
                                >
                                  <ZoomIn size={16} className="text-gray-500" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDownloadReport(report)}
                                className="p-2 hover:bg-white rounded-lg transition-colors"
                                title="Download"
                                disabled={!fileUrl}
                              >
                                <Download size={16} className={fileUrl ? "text-blue-600" : "text-gray-300"} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload size={20} className="text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No medical reports uploaded</p>
                      <p className="text-xs text-gray-400 mt-1">Reports will appear here when uploaded</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason */}
              {appointment.status === 'rejected' && appointment.rejectionReason && (
                <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50">
                  <div className="px-5 py-3 bg-rose-100 border-b border-rose-200">
                    <h3 className="font-semibold text-rose-700 flex items-center gap-2">
                      <XCircle size={18} />
                      Rejection Reason
                    </h3>
                  </div>
                  <div className="p-5">
                    <p className="text-rose-700 text-sm">{appointment.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Consultation Notes */}
              {appointment.consultationNotes && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <MessageCircle size={18} className="text-blue-600" />
                      Consultation Notes
                    </h3>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-700 text-sm leading-relaxed">{appointment.consultationNotes}</p>
                  </div>
                </div>
              )}
            </div>

            
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
          <div className="max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={28} />
            </button>
            <img
              src={selectedReport.url}
              alt={selectedReport.name}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            <p className="text-white text-center mt-4 text-sm">{selectedReport.name}</p>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-5 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Decline Appointment</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Please provide a reason for declining this appointment:</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
                placeholder="Enter reason..."
              />
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleReject} disabled={isProcessing} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-all disabled:opacity-50">
                  {isProcessing ? 'Processing...' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppointmentCard;