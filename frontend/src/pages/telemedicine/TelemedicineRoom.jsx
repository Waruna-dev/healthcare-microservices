import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../../services/api';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Users, Clock, Calendar } from 'lucide-react';

const TelemedicineRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canJoin, setCanJoin] = useState(false);
  const [timeUntilJoin, setTimeUntilJoin] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  useEffect(() => {
    fetchTelemedicineInfo();
  }, [id]);

  useEffect(() => {
    if (canJoin && sessionInfo?.telemedicineLink && !jitsiApiRef.current) {
      loadJitsiMeet();
    }
  }, [canJoin, sessionInfo]);

  const fetchTelemedicineInfo = async () => {
    setLoading(true);
    try {
      const response = await appointmentAPI.getTelemedicineInfo(id);
      if (response.success) {
        setSessionInfo(response);
        setAppointment(response.appointment);
        
        if (response.sessionStatus.canJoin) {
          setCanJoin(true);
        } else if (response.sessionStatus.isEarly) {
          const canJoinTime = new Date(response.sessionStatus.canJoinTime);
          const now = new Date();
          const diff = canJoinTime - now;
          if (diff > 0) {
            setTimeUntilJoin(diff);
            startCountdown(canJoinTime);
          }
        } else if (response.sessionStatus.isLate) {
          setError('This session has ended. Please contact your doctor for follow-up.');
        }
      } else {
        setError(response.message || 'Unable to load telemedicine session');
      }
    } catch (error) {
      console.error('Error fetching telemedicine info:', error);
      setError(error.response?.data?.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (targetTime) => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetTime - now;
      if (diff <= 0) {
        clearInterval(interval);
        setCanJoin(true);
        setTimeUntilJoin(null);
      } else {
        setTimeUntilJoin(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  };

  const loadJitsiMeet = () => {
    if (!jitsiContainerRef.current || jitsiApiRef.current) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: sessionInfo.telemedicineRoomId || sessionInfo.appointment?.id,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: appointment?.patientName || 'Patient'
      },
      configOverwrite: {
        startWithAudioMuted: isMuted,
        startWithVideoMuted: isVideoOff,
        disableDeepLinking: true,
        disableInviteFunctions: true,
        disableProfile: true,
        prejoinPageEnabled: false,
        enableWelcomePage: false
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
        ]
      }
    };

    const script = document.createElement('script');
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = () => {
      if (window.JitsiMeetExternalAPI) {
        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
        
        // Listen for events
        jitsiApiRef.current.addListener('videoConferenceJoined', () => {
          console.log('Joined telemedicine session');
        });
        
        jitsiApiRef.current.addListener('videoConferenceLeft', () => {
          handleEndCall();
        });
      }
    };
    document.body.appendChild(script);
  };

  const handleEndCall = async () => {
    try {
      await appointmentAPI.completeAppointment(id, 'Telemedicine session completed');
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
    navigate('/dashboard');
  };

  const formatTimeUntilJoin = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading telemedicine session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Join</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!canJoin && timeUntilJoin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Starting Soon</h2>
          <p className="text-gray-600 mb-4">
            Your telemedicine session will begin in
          </p>
          <div className="text-4xl font-bold text-blue-600 mb-6">
            {formatTimeUntilJoin(timeUntilJoin)}
          </div>
          <div className="space-y-2 text-sm text-gray-500">
            <p>📅 {appointment && formatDateTime(appointment.date)}</p>
            <p>👨‍⚕️ Dr. {appointment?.doctorName}</p>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">
              Please ensure your camera and microphone are working properly.
              The join button will appear automatically when your doctor is ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Jitsi Container */}
      <div ref={jitsiContainerRef} className="flex-1" />
      
      {/* Control Bar (optional - Jitsi has its own) */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-lg rounded-full px-4 py-2 flex items-center gap-2">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
        </button>
        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          {isVideoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
        </button>
        <button
          onClick={handleEndCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
        >
          <PhoneOff className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default TelemedicineRoom;