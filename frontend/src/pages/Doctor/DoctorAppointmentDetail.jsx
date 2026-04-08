// src/pages/doctor/DoctorAppointmentDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, User, DollarSign, FileText, 
  Activity, Mail, Phone, CheckCircle, XCircle, Video,
  Download, CreditCard, AlertCircle, Stethoscope
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

  useEffect(() => {
    console.log('Appointment ID from params:', id);
    fetchAppointmentDetails();
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the single appointment endpoint
      const url = `http://localhost:5015/api/appointments/${id}`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Response:', data);
      
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
      console.log('Accepting appointment:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      console.log('Accept response:', data);
      
      if (data.success) {
        await fetchAppointmentDetails();
        alert('Appointment accepted successfully! Patient has 48 hours to complete payment.');
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
      console.log('Rejecting appointment:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReason })
      });
      const data = await response.json();
      
      console.log('Reject response:', data);
      
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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'accepted': return CheckCircle;
      case 'completed': return CheckCircle;
      case 'rejected': return XCircle;
      default: return AlertCircle;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading appointment details...</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p>{error || 'Appointment not found'}</p>
        </div>
        <button 
          onClick={() => navigate('/doctor/appointments')} 
          className="mt-4 text-blue-600 hover:underline flex items-center gap-2 mx-auto"
        >
          <ArrowLeft size={16} /> Back to Appointments
        </button>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(appointment.status);
  const statusColorClass = getStatusColor(appointment.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/doctor/appointments')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Appointment Details</h1>
          <p className="text-gray-500">View and manage appointment information</p>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl border ${statusColorClass}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <StatusIcon size={20} />
            <span className="font-semibold capitalize">{appointment.status}</span>
            {appointment.status === 'accepted' && appointment.paymentStatus === 'pending' && (
              <span className="text-sm text-orange-600 ml-2">⏰ Waiting for payment (48 hours)</span>
            )}
            {appointment.paymentStatus === 'completed' && (
              <span className="text-sm text-green-600 ml-2">✓ Payment received</span>
            )}
          </div>
          {appointment.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={handleAccept}
                disabled={processing}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Accept Appointment
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition flex items-center gap-2"
              >
                <XCircle size={16} />
                Reject
              </button>
            </div>
          )}
        </div>
        {appointment.rejectionReason && (
          <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
            <strong>Rejection Reason:</strong> {appointment.rejectionReason}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-blue-600" /> Patient Information
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{appointment.patientName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" /> {appointment.patientEmail || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" /> Appointment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={18} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">{formatDate(appointment.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock size={18} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-medium text-gray-900">{appointment.startTime} - {appointment.endTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <DollarSign size={18} className="text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Consultation Fee</p>
                  <p className="font-medium text-green-600">LKR {appointment.consultationFee?.toLocaleString() || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CreditCard size={18} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <p className={`font-medium ${appointment.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                    {appointment.paymentStatus === 'completed' ? 'Paid ✓' : 'Pending ⏰'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Stethoscope size={20} className="text-blue-600" /> Medical Information
            </h2>
            
            {appointment.symptoms && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Symptoms / Reason for Visit</p>
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-gray-700">{appointment.symptoms}</p>
                </div>
              </div>
            )}

            {appointment.medicalHistory && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Medical History</p>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-gray-700">{appointment.medicalHistory}</p>
                </div>
              </div>
            )}

            {appointment.uploadedReports && appointment.uploadedReports.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Uploaded Reports ({appointment.uploadedReports.length})</p>
                <div className="space-y-2">
                  {appointment.uploadedReports.map((report, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-600" />
                        <span className="text-sm text-gray-700">{report.fileName}</span>
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
          </div>
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Booking Date</span>
                <span className="text-gray-700">{new Date(appointment.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Appointment ID</span>
                <span className="text-gray-700 font-mono text-xs">{appointment._id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Reject Appointment</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting appointment with <strong>{appointment.patientName}</strong>
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
                disabled={processing}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
              >
                {processing ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default DoctorAppointmentDetail;