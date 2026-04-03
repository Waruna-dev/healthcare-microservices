import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TelemedicineSession = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [sessionInfo, setSessionInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [prescription, setPrescription] = useState('');
    const [consultationNotes, setConsultationNotes] = useState('');
    const [isEnding, setIsEnding] = useState(false);
    const jitsiContainerRef = useRef(null);
    const apiRef = useRef(null);

    useEffect(() => {
        fetchSessionInfo();
    }, [appointmentId]);

    const fetchSessionInfo = async () => {
        try {
            const response = await api.get(`/telemedicine/${appointmentId}`);
            if (response.data.success) {
                setSessionInfo(response.data);
                initJitsi(response.data);
            } else {
                setError('Unable to load session information');
            }
        } catch (err) {
            console.error('Error fetching session:', err);
            setError(err.response?.data?.message || 'Failed to load telemedicine session');
        } finally {
            setLoading(false);
        }
    };

    const initJitsi = (info) => {
        if (!info.telemedicineLink || !window.JitsiMeetExternalAPI) {
            console.error('Jitsi API not loaded');
            return;
        }

        const domain = 'meet.jit.si';
        const options = {
            roomName: info.roomName || `CareSync_${appointmentId}`,
            width: '100%',
            height: 500,
            parentNode: jitsiContainerRef.current,
            userInfo: {
                displayName: info.appointment?.patient?.name || 'Patient'
            },
            configOverwrite: {
                startWithAudioMuted: true,
                startWithVideoMuted: false,
                disableDeepLinking: true,
                prejoinPageEnabled: false
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'feedback', 'tileview', 'download',
                    'help', 'mute-everyone', 'security'
                ]
            }
        };

        apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
    };

    const handleEndSession = async () => {
        if (!consultationNotes.trim()) {
            alert('Please add consultation notes before ending the session');
            return;
        }

        setIsEnding(true);
        try {
            let prescriptionData = null;
            if (prescription) {
                try {
                    prescriptionData = JSON.parse(prescription);
                } catch {
                    prescriptionData = { notes: prescription };
                }
            }

            const response = await api.post(`/telemedicine/${appointmentId}/end`, {
                consultationNotes,
                prescription: prescriptionData
            });

            if (response.data.success) {
                alert('Session ended successfully! Prescription has been shared with the patient.');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error ending session:', error);
            alert('Failed to end session');
        } finally {
            setIsEnding(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
                    <h3 className="font-bold mb-2">Unable to Join Session</h3>
                    <p>{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const isDoctor = sessionInfo?.appointment?.doctor?._id === localStorage.getItem('userId');

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <div className="bg-gray-800 text-white p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">Telemedicine Consultation</h1>
                        <p className="text-sm text-gray-400">
                            {sessionInfo?.appointment?.date && new Date(sessionInfo.appointment.date).toLocaleDateString()} 
                            {' '}at {sessionInfo?.appointment?.startTime}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                    >
                        Leave
                    </button>
                </div>
            </div>

            {/* Jitsi Container */}
            <div className="max-w-7xl mx-auto p-4">
                <div ref={jitsiContainerRef} className="rounded-lg overflow-hidden shadow-2xl" />

                {/* Doctor Controls - After Session */}
                {isDoctor && (
                    <div className="mt-6 bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Post-Consultation</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Consultation Notes *
                                </label>
                                <textarea
                                    value={consultationNotes}
                                    onChange={(e) => setConsultationNotes(e.target.value)}
                                    rows="4"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Document key findings, diagnosis, and recommendations..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Prescription (JSON format or text)
                                </label>
                                <textarea
                                    value={prescription}
                                    onChange={(e) => setPrescription(e.target.value)}
                                    rows="6"
                                    className="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
                                    placeholder={`{
  "medications": [
    {
      "name": "Medicine Name",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "duration": "7 days"
    }
  ],
  "instructions": "Take with food",
  "followUp": "Schedule follow-up in 2 weeks"
}`}
                                />
                            </div>
                            <button
                                onClick={handleEndSession}
                                disabled={isEnding}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {isEnding ? 'Ending Session...' : 'End Session & Share Prescription'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Load Jitsi script */}
            <script src="https://meet.jit.si/external_api.js" async />
        </div>
    );
};

export default TelemedicineSession;