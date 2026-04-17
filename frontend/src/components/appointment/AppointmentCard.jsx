import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Stethoscope, CreditCard, Video, CheckCircle, XCircle, Clock as ClockIcon, AlertCircle } from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  no_show: { label: 'Patient No-Show', color: 'bg-orange-100 text-orange-800', icon: XCircle },
  doctor_no_show: { label: 'Doctor No-Show', color: 'bg-purple-100 text-purple-800', icon: XCircle },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon }
};

const paymentStatusConfig = {
  pending: { label: 'Payment Pending', color: 'bg-orange-100 text-orange-800' },
  completed: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Payment Failed', color: 'bg-red-100 text-red-800' }
};

const AppointmentCard = ({ appointment, type = 'patient', onStatusUpdate, onPaymentComplete }) => {
  const navigate = useNavigate();
  const StatusIcon = statusConfig[appointment.status]?.icon || ClockIcon;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewDetails = () => {
    navigate(`/appointments/${appointment._id}`, { state: { appointment, type } });
  };

  const handleJoinCall = () => {
    navigate(`/telemedicine/${appointment._id}`);
  };

  const canJoinCall = appointment.paymentStatus === 'completed' && 
                      appointment.status === 'accepted' &&
                      appointment.telemedicineLink;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
      {/* Status Bar */}
      <div className={`h-1.5 ${
        appointment.status === 'pending' ? 'bg-yellow-500' :
        appointment.status === 'accepted' ? 'bg-blue-500' :
        appointment.status === 'completed' ? 'bg-green-500' :
        appointment.status === 'partial' ? 'bg-yellow-500' :
        appointment.status === 'no_show' ? 'bg-orange-500' :
        appointment.status === 'doctor_no_show' ? 'bg-purple-500' :
        'bg-gray-400'
      }`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              type === 'patient' ? 'bg-blue-50' : 'bg-emerald-50'
            }`}>
              {type === 'patient' ? (
                <Stethoscope className="w-5 h-5 text-blue-600" />
              ) : (
                <User className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {type === 'patient' ? `Dr. ${appointment.doctorName}` : appointment.patientName}
              </h3>
              <p className="text-sm text-gray-500">{appointment.doctorSpecialty}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[appointment.status]?.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusConfig[appointment.status]?.label}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDate(appointment.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{appointment.startTime} - {appointment.endTime}</span>
          </div>
        </div>

        {/* Confirmation Status for Partial Completions */}
        {appointment.completionStatus === 'partial' && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700 font-medium flex items-center gap-1">
              <AlertCircle size={12} />
              {appointment.doctorConfirmed && !appointment.patientConfirmed 
                ? "✓ Doctor confirmed. Waiting for patient confirmation..." 
                : !appointment.doctorConfirmed && appointment.patientConfirmed 
                ? "✓ Patient confirmed. Waiting for doctor confirmation..." 
                : "Awaiting confirmation"}
            </p>
          </div>
        )}

        {appointment.completionStatus === 'completed' && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 font-medium flex items-center gap-1">
              <CheckCircle size={12} />
              Consultation completed and confirmed by both parties ✓
            </p>
          </div>
        )}

        {/* Fee and Payment Status */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100 mb-4">
          <div>
            <p className="text-xs text-gray-500">Consultation Fee</p>
            <p className="font-semibold text-gray-900">LKR {appointment.consultationFee?.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Payment Status</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${paymentStatusConfig[appointment.paymentStatus]?.color}`}>
              {paymentStatusConfig[appointment.paymentStatus]?.label}
            </span>
          </div>
        </div>

        {/* Rejection/Cancellation Reason */}
        {appointment.rejectionReason && (
          <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs text-red-600 font-medium mb-0.5">Reason:</p>
            <p className="text-xs text-red-700">{appointment.rejectionReason}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleViewDetails}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            View Details
          </button>
          
          {type === 'patient' && appointment.paymentStatus === 'pending' && appointment.status === 'accepted' && (
            <button
              onClick={() => onPaymentComplete?.(appointment)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-md transition-all"
            >
              <CreditCard className="w-4 h-4 inline mr-1" />
              Pay Now
            </button>
          )}
          
          {canJoinCall && (
            <button
              onClick={handleJoinCall}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:shadow-md transition-all"
            >
              <Video className="w-4 h-4 inline mr-1" />
              Join Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;