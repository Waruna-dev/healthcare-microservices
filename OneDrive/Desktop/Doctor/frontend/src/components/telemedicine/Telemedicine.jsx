// src/pages/Telemedicine.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Calendar, Clock, User } from 'lucide-react';
import api from '../services/api';

const Telemedicine = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState(null);
    const [sessionStatus, setSessionStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [canJoin, setCanJoin] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [meetingEnded, setMeetingEnded] = useState(false);
    const iframeRef = useRef(null);
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userType = user.role === 'doctor' ? 'doctor' : 'patient';

    useEffect(() => {
        fetchTelemedicineInfo();
        const interval = setInterval(fetchTelemedicineInfo, 30000);
        return () => clearInterval(interval);
    }, [appointmentId]);

    const fetchTelemedicineInfo = async () => {
        try {
            const response = await api.get(`/appointments/${appointmentId}/telemedicine`);
            if (response.data.success) {
                setAppointment(response.data.appointment);
                setSessionStatus(response.data.sessionStatus);
                
                const canJoinNow = response.data.sessionStatus.canJoin;
                setCanJoin(canJoinNow);
                
                if (!canJoinNow && response.data.sessionStatus.isEarly) {
                    setCountdown(response.data.sessionStatus.minutesUntilJoin);
                } else {
                    setCountdown(null);
                }
                
                // Check if meeting is already completed
                if (response.data.appointment.status === 'completed') {
                    setMeetingEnded(true);
                }
            }
        } catch (error) {
            console.error('Error fetching telemedicine info:', error);
            setError(error.response?.data?.message || 'Failed to load session info');
        } finally {
            setLoading(false);
        }
    };

    const markMeetingStarted = async () => {
        try {
            await api.post(`/appointments/${appointmentId}/meeting/start`, { userType });
        } catch (error) {
            console.error('Error marking meeting start:', error);
        }
    };

    const handleJoinMeeting = () => {
        if (!canJoin) return;
        markMeetingStarted();
        // The iframe will load the Jitsi meeting
    };

    const handleEndMeeting = async () => {
        if (window.confirm('End this consultation session?')) {
            try {
                // Call completion endpoint
                await api.post(`/appointments/${appointmentId}/complete`, {
                    consultationNotes: 'Consultation completed via telemedicine'
                });
                setMeetingEnded(true);
                navigate(`/appointments/${appointmentId}`);
            } catch (error) {
                console.error('Error ending meeting:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
                    <p className="text-red-400">{error}</p>
                    <button 
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (meetingEnded || appointment?.status === 'completed') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="bg-gray-800 rounded-xl p-8 text-center max-w-md">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Session Completed</h2>
                    <p className="text-gray-400 mb-6">Your telemedicine consultation has been completed.</p>
                    <button 
                        onClick={() => navigate(userType === 'doctor' ? '/doctor/dashboard' : '/dashboard')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!canJoin && countdown !== null) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="bg-gray-800 rounded-xl p-8 text-center max-w-md">
                    <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Session Not Yet Available</h2>
                    <p className="text-gray-400 mb-4">
                        Your session starts at {appointment?.startTime}
                    </p>
                    <div className="text-3xl font-bold text-blue-500 mb-6">
                        {countdown} minutes until join window opens
                    </div>
                    <div className="space-y-2 text-left text-gray-400 text-sm">
                        <p>📍 You can join 20 minutes before the scheduled time</p>
                        <p>📍 Please ensure you have a stable internet connection</p>
                        <p>📍 Allow camera and microphone access when prompted</p>
                    </div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="mt-6 px-6 py-2 bg-gray-700 text-white rounded-lg"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-900">
            {/* Meeting Header */}
            <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="text-white">
                        <p className="font-semibold">Dr. {appointment?.doctorName}</p>
                        <p className="text-xs text-gray-400">{appointment?.patientName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right text-sm text-gray-400">
                        <p>{new Date(appointment?.date).toLocaleDateString()}</p>
                        <p>{appointment?.startTime} - {appointment?.endTime}</p>
                    </div>
                    {userType === 'doctor' && (
                        <button
                            onClick={handleEndMeeting}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
                        >
                            <PhoneOff size={16} /> End Session
                        </button>
                    )}
                </div>
            </div>
            
            {/* Jitsi Iframe */}
            <div className="flex-1 relative">
                {canJoin && appointment?.telemedicineLink && (
                    <iframe
                        ref={iframeRef}
                        src={appointment.telemedicineLink}
                        title="Telemedicine Session"
                        className="w-full h-full border-0"
                        allow="camera; microphone; fullscreen; display-capture"
                        allowFullScreen
                        onLoad={handleJoinMeeting}
                    />
                )}
            </div>
        </div>
    );
};

export default Telemedicine;