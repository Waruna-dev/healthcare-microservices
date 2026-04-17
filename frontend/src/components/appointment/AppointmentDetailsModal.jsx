import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Stethoscope, FileText, AlertCircle, CreditCard, Video, CheckCircle, XCircle, Download } from 'lucide-react';
import { appointmentAPI } from '../../services/api';

const AppointmentDetailsModal = ({ appointment, type, onClose, onPaymentComplete, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [paymentWindowExpired, setPaymentWindowExpired] = useState(false);

  useEffect(() => {
    if (type === 'patient' && appointment.status === 'accepted' && appointment.paymentStatus === 'pending') {
      const acceptedDate = new Date(appointment.updatedAt);
      const now = new Date();
      const hoursSinceAcceptance = (now - acceptedDate) / (1000 * 60 * 60);
      setPaymentWindowExpired(hoursSinceAcceptance > 48);
    }
  }, [appointment, type]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const response = await appointmentAPI.updateStatus(appointment._id, 'accepted');
      onStatusUpdate?.(response.appointment);
    } catch (error) {
      console.error('Error accepting appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setLoading(true);
    try {
      const response = await appointmentAPI.updateStatus(appointment._id, 'rejected', rejectionReason);
      onStatusUpdate?.(response.appointment);
      setShowRejectionInput(false);
    } catch (error) {
      console.error('Error rejecting appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    onPaymentComplete?.(appointment);
  };

  const handleDownloadReport = (report) => {
    // Implement report download logic
    window.open(`/uploads/${report.filePath}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl ${
            appointment.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
            appointment.status === 'accepted' ? 'bg-blue-50 border border-blue-200' :
            appointment.status === 'completed' ? 'bg-green-50 border border-green-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {appointment.status === 'pending' && <ClockIcon className="w-5 h-5 text-yellow-600" />}
              {appointment.status === 'accepted' && <CheckCircle className="w-5 h-5 text-blue-600" />}
              {appointment.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {appointment.status === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
              <div>
                <p className="font-semibold">
                  Status: {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </p>
                {appointment.rejectionReason && (
                  <p className="text-sm mt-1">Reason: {appointment.rejectionReason}</p>
                )}
                {paymentWindowExpired && appointment.paymentStatus === 'pending' && (
                  <p className="text-sm text-red-600 mt-2">
                    Payment window has expired (48 hours). This appointment has been cancelled.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Doctor/Patient Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {type === 'patient' ? 'Doctor Information' : 'Patient Information'}
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {type === 'patient' 
                  ? appointment.doctorName?.charAt(0) || 'D'
                  : appointment.patientName?.charAt(0) || 'P'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {type === 'patient' ? `Dr. ${appointment.doctorName}` : appointment.patientName}
                </p>
                <p className="text-sm text-gray-500">{appointment.doctorSpecialty}</p>
                {type === 'patient' && (
                  <p className="text-sm text-gray-500">{appointment.patientEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Appointment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formatDate(appointment.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{appointment.startTime} - {appointment.endTime}</span>
              </div>
            </div>
          </div>

          {/* Symptoms and Medical History */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Medical Information</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Symptoms</p>
                <p className="text-sm text-gray-600 mt-1">{appointment.symptoms}</p>
              </div>
              {appointment.medicalHistory && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Medical History</p>
                  <p className="text-sm text-gray-600 mt-1">{appointment.medicalHistory}</p>
                </div>
              )}
            </div>
          </div>

          {/* Uploaded Reports */}
          {appointment.uploadedReports && appointment.uploadedReports.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Uploaded Reports</h3>
              <div className="space-y-2">
                {appointment.uploadedReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">{report.fileName}</span>
                    </div>
                    <button
                      onClick={() => handleDownloadReport(report)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consultation Notes (for completed appointments) */}
          {appointment.consultationNotes && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Consultation Notes</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">{appointment.consultationNotes}</p>
              </div>
            </div>
          )}

          {/* Prescription (for completed appointments) */}
          {appointment.prescription && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Prescription</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {typeof appointment.prescription === 'string' 
                    ? appointment.prescription 
                    : JSON.stringify(appointment.prescription, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Doctor Actions */}
          {type === 'doctor' && appointment.status === 'pending' && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Accept Appointment'}
              </button>
              <button
                onClick={() => setShowRejectionInput(true)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}

          {showRejectionInput && (
            <div className="space-y-3 pt-2">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setShowRejectionInput(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Patient Payment Button */}
          {type === 'patient' && appointment.paymentStatus === 'pending' && appointment.status === 'accepted' && !paymentWindowExpired && (
            <button
              onClick={handlePayment}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Pay LKR {appointment.consultationFee?.toLocaleString()}
            </button>
          )}

          {type === 'patient' && paymentWindowExpired && appointment.paymentStatus === 'pending' && (
            <div className="p-4 bg-red-50 rounded-xl text-center">
              <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-red-600">
                Payment window has expired. Please book a new appointment.
              </p>
            </div>
          )}

          {/* Join Call Button */}
          {appointment.paymentStatus === 'completed' && appointment.status === 'accepted' && appointment.telemedicineLink && (
            <button
              onClick={() => window.open(`/telemedicine/${appointment._id}`, '_blank')}
              className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Video className="w-5 h-5" />
              Join Telemedicine Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;