import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, User, Stethoscope, 
  DollarSign, FileText, Activity, AlertCircle, 
  CheckCircle, XCircle, Download, Eye, CreditCard, Video
} from 'lucide-react';

const AllAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon size={20} />
                  <span className="font-semibold capitalize">{statusConfig.label}</span>
                  {appointment.status === 'accepted' && appointment.paymentStatus === 'pending' && (
                    <span className="text-sm text-orange-600 ml-2">
                      ⏰ {formatTimeRemaining(appointment.paymentDeadline)}
                    </span>
                  )}
                </div>
                {appointment.rejectionReason && (
                  <div className="text-sm text-red-600">
                    Reason: {appointment.rejectionReason}
                  </div>
                )}
              </div>
            </div>
            
            {/* Doctor Info */}
            <div className="flex items-start gap-4 pb-4 border-b">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {appointment.doctorName?.charAt(0) || 'D'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Dr. {appointment.doctorName}</h3>
                <p className="text-gray-500">{appointment.doctorSpecialty}</p>
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
                <DollarSign size={20} className="text-green-600" />
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
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              {appointment.status === 'accepted' && appointment.paymentStatus === 'pending' && (
                <button
                  onClick={() => {
                    onClose();
                    handlePayment(appointment);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={20} />
                  Pay LKR {appointment.consultationFee?.toLocaleString()}
                </button>
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

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Appointments</h1>
            <p className="text-gray-500 mt-1">View all your appointment history and details</p>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-full">
            <span className="text-sm font-semibold text-blue-600">
              Total: {appointments.length} appointments
            </span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
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
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => {
              const statusConfig = getStatusConfig(apt.status);
              const StatusIcon = statusConfig.icon;
              const paymentConfig = getPaymentStatusConfig(apt.paymentStatus);
              
              return (
                <div key={apt._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                  {/* Status Bar */}
                  <div className={`h-1.5 ${
                    apt.status === 'pending' ? 'bg-yellow-500' :
                    apt.status === 'accepted' ? 'bg-blue-500' :
                    apt.status === 'completed' ? 'bg-green-500' :
                    apt.status === 'rejected' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-xl">
                          <Stethoscope className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">Dr. {apt.doctorName}</h3>
                          <p className="text-sm text-gray-500">{apt.doctorSpecialty}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${paymentConfig.color}`}>
                          {paymentConfig.label}
                        </span>
                      </div>
                    </div>
                    
                    {/* Appointment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{formatDate(apt.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} className="text-gray-400" />
                        <span>{apt.startTime} - {apt.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign size={16} className="text-green-500" />
                        <span className="font-semibold text-green-600">LKR {apt.consultationFee?.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Symptoms Preview */}
                    {apt.symptoms && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Symptoms:</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{apt.symptoms}</p>
                      </div>
                    )}
                    
                    {/* Reports Indicator */}
                    {apt.uploadedReports && apt.uploadedReports.length > 0 && (
                      <div className="mb-4 flex items-center gap-2 text-xs text-blue-600">
                        <FileText size={14} />
                        <span>{apt.uploadedReports.length} report(s) attached</span>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleViewDetails(apt)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        View Full Details
                      </button>
                      
                      {apt.status === 'accepted' && apt.paymentStatus === 'pending' && (
                        <button
                          onClick={() => handlePayment(apt)}
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <CreditCard size={16} />
                          Pay Now
                        </button>
                      )}
                      
                      {canJoinCall(apt) && (
                        <button
                          onClick={() => handleJoinCall(apt)}
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <Video size={16} />
                          Join Call
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
      
      {/* Details Modal */}
      {showDetailsModal && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

export default AllAppointments;