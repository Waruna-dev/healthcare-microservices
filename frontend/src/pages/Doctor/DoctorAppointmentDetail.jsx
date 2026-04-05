// src/pages/doctor/DoctorAppointmentDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, User, DollarSign, FileText, 
  Activity, Mail, Phone, CheckCircle, XCircle, Video,
  Download, CreditCard, AlertCircle
} from 'lucide-react';
import api from '../../services/api';

const DoctorAppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      const response = await api.get(`/appointments/${id}`);
      if (response.data.success) {
        setAppointment(response.data.appointment);
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setProcessing(true);
    try {
      const response = await api.put(`/appointments/${id}/accept`, {});
      if (response.data.success) {
        await fetchAppointmentDetails();
        alert('Appointment accepted. Patient has 48 hours to complete payment.');
      }
    } catch (error) {
      console.error('Error accepting appointment:', error);
      alert(error.response?.data?.message || 'Failed to accept appointment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    setProcessing(true);
    try {
      const response = await api.put(`/appointments/${id}/reject`, { rejectionReason: reason });
      if (response.data.success) {
        await fetchAppointmentDetails();
        alert('Appointment rejected');
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert(error.response?.data?.message || 'Failed to reject appointment');
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

  const canJoinMeeting = () => {
    if (!appointment) return false;
    if (appointment.paymentStatus !== 'completed') return false;
    if (appointment.status !== 'accepted') return false;
    
    const now = new Date();
    const meetingDate = new Date(appointment.date);
    const [hour, minute] = appointment.startTime.split(':');
    meetingDate.setHours(parseInt(hour), parseInt(minute), 0);
    
    const joinWindowStart = new Date(meetingDate);
    joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 20);
    
    return now >= joinWindowStart;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Appointment not found</p>
        <button onClick={() => navigate('/doctor/appointments')} className="mt-4 text-primary">
          Go back
        </button>
      </div>
    );
  }

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
      <div className={`p-4 rounded-xl ${
        appointment.status === 'accepted' ? 'bg-green-50 border border-green-200' :
        appointment.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
        appointment.status === 'rejected' ? 'bg-red-50 border border-red-200' :
        'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {appointment.status === 'accepted' && <CheckCircle className="text-green-600" size={20} />}
            {appointment.status === 'pending' && <AlertCircle className="text-yellow-600" size={20} />}
            {appointment.status === 'rejected' && <XCircle className="text-red-600" size={20} />}
            <span className="font-semibold capitalize">{appointment.status}</span>
            {appointment.status === 'accepted' && appointment.paymentStatus === 'pending' && (
              <span className="text-sm text-orange-600 ml-2">Waiting for payment (48 hours)</span>
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
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                {processing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckCircle size={16} />}
                Accept
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle size={16} /> Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Appointment Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={20} className="text-primary" /> Patient Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{appointment.patientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" /> {appointment.patientEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-primary" /> Appointment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{formatDate(appointment.date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{appointment.startTime} - {appointment.endTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Consultation Fee</p>
                <p className="font-medium text-green-600">LKR {appointment.consultationFee?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className={`font-medium ${
                  appointment.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {appointment.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-primary" /> Medical Information
            </h2>
            
            {appointment.symptoms && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Symptoms / Reason for Visit</p>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-gray-700">{appointment.symptoms}</p>
                </div>
              </div>
            )}

            {appointment.medicalHistory && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Medical History</p>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-gray-700">{appointment.medicalHistory}</p>
                </div>
              </div>
            )}

            {appointment.uploadedReports && appointment.uploadedReports.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Uploaded Reports</p>
                <div className="space-y-2">
                  {appointment.uploadedReports.map((report, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <span className="text-sm">{report.fileName}</span>
                      </div>
                      <a 
                        href={`http://localhost:5015/${report.filePath}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary text-sm hover:underline flex items-center gap-1"
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

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Telemedicine */}
          {appointment.paymentStatus === 'completed' && appointment.status === 'accepted' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Video size={20} className="text-primary" /> Telemedicine Session
              </h2>
              {canJoinMeeting() ? (
                <button
                  onClick={() => navigate(`/telemedicine/${appointment._id}`)}
                  className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
                >
                  <Video size={20} /> Join Meeting Now
                </button>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Clock size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 text-sm">
                    Meeting will be available 20 minutes before the scheduled time
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Scheduled: {appointment.startTime} on {formatDate(appointment.date)}
                  </p>
                </div>
              )}
              {appointment.telemedicineLink && (
                <p className="text-xs text-gray-500 mt-3 break-all">
                  Meeting Link: {appointment.telemedicineLink}
                </p>
              )}
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-primary" /> Payment Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Consultation Fee</span>
                <span className="font-semibold">LKR {appointment.consultationFee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className={`font-semibold ${
                  appointment.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {appointment.paymentStatus === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>
              {appointment.paymentDeadline && appointment.paymentStatus === 'pending' && (
                <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-700">
                    Payment deadline: {new Date(appointment.paymentDeadline).toLocaleString()}
                  </p>
                </div>
              )}
              {appointment.paymentId && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Payment ID: {appointment.paymentId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Consultation Notes (if any) */}
          {appointment.consultationNotes && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Consultation Notes</h2>
              <p className="text-gray-600">{appointment.consultationNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointmentDetail;