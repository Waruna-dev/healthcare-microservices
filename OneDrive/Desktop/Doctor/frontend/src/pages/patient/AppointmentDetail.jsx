// src/pages/patient/AppointmentDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, DollarSign, FileText, Activity, CreditCard, Video, Clock as ClockIcon, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

const AppointmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentDeadline, setPaymentDeadline] = useState(null);

    useEffect(() => {
        fetchAppointmentDetails();
    }, [id]);

    useEffect(() => {
        if (appointment?.paymentDeadline) {
            const timer = setInterval(() => {
                const now = new Date();
                const deadline = new Date(appointment.paymentDeadline);
                if (now > deadline && appointment.paymentStatus === 'pending') {
                    fetchAppointmentDetails();
                }
            }, 60000);
            return () => clearInterval(timer);
        }
    }, [appointment]);

    const fetchAppointmentDetails = async () => {
        try {
            const response = await api.get(`/appointments/${id}`);
            if (response.data.success) {
                setAppointment(response.data.appointment);
                if (response.data.appointment.paymentDeadline) {
                    setPaymentDeadline(new Date(response.data.appointment.paymentDeadline));
                }
            }
        } catch (error) {
            console.error('Error fetching appointment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        setProcessingPayment(true);
        try {
            // This will call your friend's payment service
            const response = await api.post(`/appointments/${id}/payment`, {
                paymentMethod: 'card'
            });
            
            if (response.data.success) {
                // Refresh appointment details
                await fetchAppointmentDetails();
                alert('Payment successful! Telemedicine link has been generated.');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert(error.response?.data?.message || 'Payment failed. Please try again.');
        } finally {
            setProcessingPayment(false);
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

    const getTimeRemaining = () => {
        if (!paymentDeadline) return null;
        const now = new Date();
        const diff = paymentDeadline - now;
        if (diff <= 0) return 'Expired';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m remaining`;
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
                <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary">Go back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-surface-container-low rounded-xl transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-on-surface">Appointment Details</h1>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-elevated overflow-hidden">
                    {/* Status Header */}
                    <div className={`p-4 ${
                        appointment.status === 'accepted' ? 'bg-green-50 border-b border-green-100' :
                        appointment.status === 'pending' ? 'bg-yellow-50 border-b border-yellow-100' :
                        appointment.status === 'rejected' ? 'bg-red-50 border-b border-red-100' :
                        'bg-gray-50'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {appointment.status === 'accepted' && <CheckCircle className="text-green-600" size={20} />}
                                {appointment.status === 'pending' && <ClockIcon className="text-yellow-600" size={20} />}
                                {appointment.status === 'rejected' && <XCircle className="text-red-600" size={20} />}
                                <span className="font-semibold capitalize">{appointment.status}</span>
                            </div>
                            {appointment.status === 'accepted' && appointment.paymentStatus === 'pending' && paymentDeadline && (
                                <span className="text-sm text-orange-600 font-medium">
                                    ⏰ {getTimeRemaining()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Doctor Info */}
                        <div className="flex items-start gap-4 pb-4 border-b">
                            <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/70 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                {appointment.doctorName?.charAt(0) || 'D'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Dr. {appointment.doctorName}</h2>
                                <p className="text-gray-500">{appointment.doctorSpecialty}</p>
                            </div>
                        </div>

                        {/* Appointment Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <Calendar size={20} className="text-primary" />
                                <div>
                                    <p className="text-xs text-gray-500">Date</p>
                                    <p className="font-medium">{formatDate(appointment.date)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <Clock size={20} className="text-primary" />
                                <div>
                                    <p className="text-xs text-gray-500">Time</p>
                                    <p className="font-medium">{appointment.startTime} - {appointment.endTime}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <DollarSign size={20} className="text-primary" />
                                <div>
                                    <p className="text-xs text-gray-500">Consultation Fee</p>
                                    <p className="font-medium text-green-600">LKR {appointment.consultationFee?.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <CreditCard size={20} className="text-primary" />
                                <div>
                                    <p className="text-xs text-gray-500">Payment Status</p>
                                    <p className={`font-medium ${
                                        appointment.paymentStatus === 'completed' ? 'text-green-600' :
                                        appointment.paymentStatus === 'pending' ? 'text-orange-600' : 'text-red-600'
                                    }`}>
                                        {appointment.paymentStatus === 'completed' ? 'Paid' :
                                         appointment.paymentStatus === 'pending' ? 'Pending' : 'Failed'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Symptoms */}
                        {appointment.symptoms && (
                            <div className="p-4 bg-yellow-50 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity size={18} className="text-yellow-600" />
                                    <h3 className="font-semibold">Symptoms / Reason</h3>
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
                                <h3 className="font-semibold mb-2">Uploaded Reports</h3>
                                <div className="space-y-2">
                                    {appointment.uploadedReports.map((report, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm">{report.fileName}</span>
                                            <a href={`http://localhost:5015/${report.filePath}`} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                                                View
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rejection Reason */}
                        {appointment.status === 'rejected' && appointment.rejectionReason && (
                            <div className="p-4 bg-red-50 rounded-xl">
                                <p className="text-red-700 text-sm">
                                    <span className="font-semibold">Rejection Reason:</span> {appointment.rejectionReason}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 pt-4">
                            {/* Payment Button - Show only when accepted and payment pending */}
                            {appointment.status === 'accepted' && appointment.paymentStatus === 'pending' && (
                                <button
                                    onClick={handlePayment}
                                    disabled={processingPayment}
                                    className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {processingPayment ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <CreditCard size={20} />
                                            Pay LKR {appointment.consultationFee?.toLocaleString()}
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Join Meeting Button - Show only when payment completed and meeting time is within window */}
                            {appointment.paymentStatus === 'completed' && appointment.telemedicineLink && canJoinMeeting() && (
                                <button
                                    onClick={() => navigate(`/telemedicine/${appointment._id}`)}
                                    className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Video size={20} />
                                    Join Telemedicine Session
                                </button>
                            )}

                            {/* Waiting for Meeting */}
                            {appointment.paymentStatus === 'completed' && appointment.status === 'accepted' && !canJoinMeeting() && (
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <ClockIcon size={24} className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-gray-600">Meeting will be available 20 minutes before the scheduled time</p>
                                    <p className="text-sm text-gray-500 mt-1">Scheduled: {appointment.startTime}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentDetail;