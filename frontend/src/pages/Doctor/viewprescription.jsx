import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, User, Stethoscope, CheckCircle, XCircle, 
  Eye, AlertCircle, Activity, FileText, CreditCard, Video,
  ArrowLeft, Download, Mail, Phone, MapPin, Heart, Brain,
  Pill, Syringe, FlaskConical, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ViewPrescription = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

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

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Fetch appointment details
  const fetchAppointmentDetails = async () => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = `http://localhost:5015/api/appointments/${appointmentId}`;
      console.log('Fetching appointment from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Appointment response:', data);
      
      if (data.success && data.appointment) {
        setAppointment(data.appointment);
        // Also fetch prescription if exists
        await fetchPrescription(appointmentId);
      } else {
        console.error('Failed to fetch appointment:', data.message || 'No data received');
        // Try alternative approach - fetch from doctor's appointments and filter
        await fetchFromDoctorAppointments();
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      // Try fallback approach
      await fetchFromDoctorAppointments();
    } finally {
      setLoading(false);
    }
  };

  // Fallback method to fetch from doctor's appointments
  const fetchFromDoctorAppointments = async () => {
    try {
      const doctorId = user?._id || user?.id;
      if (!doctorId) return;
      
      const url = `http://localhost:5015/api/appointments/doctor/public/${doctorId}`;
      console.log('Fallback: fetching from doctor appointments:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.appointments) {
        const foundAppointment = data.appointments.find(apt => apt._id === appointmentId);
        if (foundAppointment) {
          console.log('Found appointment in doctor list:', foundAppointment);
          setAppointment(foundAppointment);
          await fetchPrescription(appointmentId);
        } else {
          console.error('Appointment not found in doctor list either');
        }
      }
    } catch (error) {
      console.error('Error in fallback fetch:', error);
    }
  };

  // Fetch prescription details
  const fetchPrescription = async (aptId) => {
    try {
      const response = await fetch(`http://localhost:5025/api/prescriptions/appointment/${aptId}`);
      const data = await response.json();
      
      if (data.success && data.prescription) {
        setPrescription(data.prescription);
      }
    } catch (error) {
      console.error('Error fetching prescription:', error);
    }
  };

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const handleJoinCall = () => {
    if (appointment) {
      window.open(`/telemedicine/${appointment._id}`, '_blank');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Appointment Not Found</h2>
          <p className="text-gray-600 mb-4">The appointment you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/doctor/prescriptions')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Prescriptions
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(appointment.status);
  const StatusIcon = statusConfig.icon;
  const paymentConfig = getPaymentStatusConfig(appointment.paymentStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/doctor/prescriptions')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Appointment Details</h1>
            </div>
            <div className="flex items-center gap-2">
              {canJoinCall() && (
                <button
                  onClick={handleJoinCall}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Join Call
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
                    {appointment.patientName?.charAt(0) || 'P'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">{appointment.patientName}</h2>
                    <p className="text-blue-100">{appointment.patientEmail}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {statusConfig.label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentConfig.color}`}>
                        {paymentConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <div className="p-2 bg-blue-200 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Appointment Date</p>
                      <p className="font-semibold text-gray-900">{formatDate(appointment.date)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                    <div className="p-2 bg-green-200 rounded-lg">
                      <Clock className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Time Slot</p>
                      <p className="font-semibold text-gray-900">
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Symptoms & Medical History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {appointment.symptoms && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Activity className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Symptoms / Reason for Visit</h3>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-gray-700 leading-relaxed">{appointment.symptoms}</p>
                  </div>
                </div>
              )}

              {appointment.medicalHistory && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Medical History</h3>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-gray-700 leading-relaxed">{appointment.medicalHistory}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Uploaded Reports */}
            {appointment.uploadedReports && appointment.uploadedReports.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Medical Reports</h3>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                    {appointment.uploadedReports.length} files
                  </span>
                </div>
                <div className="space-y-3">
                  {appointment.uploadedReports.map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">{report.fileName}</p>
                          <p className="text-sm text-gray-500">Medical Report</p>
                        </div>
                      </div>
                      <a
                        href={`http://localhost:5015/${report.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prescription Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Pill className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Prescription</h3>
                </div>
              </div>
              
              <div className="p-4">
                {prescription ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Diagnosis</p>
                      <p className="font-medium text-gray-900">{prescription.diagnosis || 'Not specified'}</p>
                    </div>
                    
                    {prescription.medicines && prescription.medicines.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Medicines Prescribed</p>
                        <div className="space-y-2">
                          {prescription.medicines.map((medicine, index) => (
                            <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="font-medium text-green-900">{medicine.name}</p>
                              <p className="text-sm text-green-700">
                                {medicine.dosage} - {medicine.frequency} - {medicine.duration}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {prescription.notes && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Additional Notes</p>
                        <p className="text-sm text-gray-700">{prescription.notes}</p>
                      </div>
                    )}
                    
                    {prescription.followUpDate && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Follow-up Date</p>
                        <p className="font-medium text-gray-900">{formatDate(prescription.followUpDate)}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No prescription created yet</p>
                    <button
                      onClick={() => navigate(`/doctor/prescriptions/${appointmentId}/create`)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Create Prescription
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-4"
            >
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3">
                  <Mail className="w-4 h-4" />
                  Email Patient
                </button>
                <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3">
                  <Phone className="w-4 h-4" />
                  Call Patient
                </button>
                <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  Schedule Follow-up
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPrescription;