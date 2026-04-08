// src/components/appointment/PatientAppointmentCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, DollarSign, Video, CheckCircle, XCircle, Clock as ClockIcon } from 'lucide-react';

const PatientAppointmentCard = ({ appointment, isLatest = false }) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);

    const getStatusBadge = () => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Pending Approval' },
            accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Accepted - Payment Required' },
            rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' },
            completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'Completed' },
            cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Cancelled' }
        };
        const config = statusConfig[appointment.status] || statusConfig.pending;
        const Icon = config.icon;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
                <Icon size={12} /> {config.text}
            </span>
        );
    };

    const getPaymentBadge = () => {
        if (appointment.paymentStatus === 'completed') {
            return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Paid</span>;
        }
        if (appointment.paymentStatus === 'pending' && appointment.status === 'accepted') {
            return <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs">Payment Due</span>;
        }
        return null;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleViewDetails = () => {
        navigate(`/appointments/${appointment._id}`);
    };

    return (
        <div className={`bg-white rounded-2xl shadow-elevated border border-outline-variant/30 overflow-hidden transition-all duration-300 ${isLatest ? 'ring-2 ring-primary/20' : ''}`}>
            {isLatest && (
                <div className="bg-primary px-4 py-1.5 text-white text-xs font-medium text-center">
                    Latest Appointment
                </div>
            )}
            
            <div className="p-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">
                            Dr. {appointment.doctorName}
                        </h3>
                        <p className="text-sm text-gray-500">{appointment.doctorSpecialty}</p>
                    </div>
                    {getStatusBadge()}
                </div>

                {/* Appointment Info */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} className="text-primary" />
                        <span>{formatDate(appointment.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} className="text-primary" />
                        <span>{appointment.startTime} - {appointment.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign size={16} className="text-primary" />
                        <span>LKR {appointment.consultationFee?.toLocaleString()}</span>
                        {getPaymentBadge()}
                    </div>
                </div>

                {/* Symptoms Preview */}
                {appointment.symptoms && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        <span className="font-medium">Symptoms:</span> {appointment.symptoms}
                    </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleViewDetails}
                        className="flex-1 px-4 py-2 bg-primary/10 text-primary rounded-xl font-medium text-sm hover:bg-primary/20 transition-colors"
                    >
                        View Details
                    </button>
                    
                    {appointment.paymentStatus === 'completed' && appointment.telemedicineLink && appointment.status === 'accepted' && (
                        <button
                            onClick={() => navigate(`/telemedicine/${appointment._id}`)}
                            className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium text-sm hover:bg-green-600 transition-colors flex items-center gap-2"
                        >
                            <Video size={16} /> Join
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientAppointmentCard;