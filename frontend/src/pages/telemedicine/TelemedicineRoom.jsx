// src/pages/patient/TelemedicineRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Clock, AlertCircle, Loader } from 'lucide-react';

const TelemedicineRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canJoin, setCanJoin] = useState(false);
  const [timeUntilJoin, setTimeUntilJoin] = useState(null);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [jitsiInitializing, setJitsiInitializing] = useState(false);
  const containerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const intervalRef = useRef(null);

  // Fetch telemedicine info on mount
  useEffect(() => {
    fetchTelemedicineInfo();
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (e) {
          console.log('Error disposing Jitsi:', e);
        }
      }
    };
  }, [id]);

  const fetchTelemedicineInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching telemedicine info for appointment:', id);
      
      const response = await fetch(`http://localhost:5015/api/appointments/${id}/telemedicine`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📡 Telemedicine response:', data);
      
      if (data.success) {
        setAppointment(data.appointment);
        
        if (data.sessionStatus?.canJoin) {
          console.log('✅ Can join immediately');
          setCanJoin(true);
          // Load Jitsi right away
          loadJitsiMeet(data.telemedicineLink, data.telemedicineRoomId, data.appointment);
        } else if (data.sessionStatus?.isEarly) {
          console.log('⏰ Session starts later');
          const canJoinTime = new Date(data.sessionStatus.canJoinTime);
          startCountdown(canJoinTime, data);
        } else if (data.sessionStatus?.isLate) {
          setError('This session has ended. Please contact your doctor for follow-up.');
        } else {
          setError('Unable to determine session status');
        }
      } else {
        setError(data.message || 'Unable to load telemedicine session');
      }
    } catch (error) {
      console.error('Error fetching telemedicine info:', error);
      setError(error.response?.data?.message || 'Failed to load session. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (targetTime, sessionData) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const diff = targetTime - now;
      if (diff <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setCanJoin(true);
        setTimeUntilJoin(null);
        // Load Jitsi when countdown ends
        loadJitsiMeet(sessionData.telemedicineLink, sessionData.telemedicineRoomId, sessionData.appointment);
      } else {
        setTimeUntilJoin(diff);
      }
    }, 1000);
  };

  const loadJitsiMeet = (telemedicineLink, roomId, appointmentData) => {
    if (jitsiLoaded || jitsiInitializing) {
      console.log('Jitsi already loading or loaded');
      return;
    }
    
    if (!containerRef.current) {
      console.error('Container ref is null, retrying in 500ms');
      setTimeout(() => loadJitsiMeet(telemedicineLink, roomId, appointmentData), 500);
      return;
    }

    setJitsiInitializing(true);
    console.log('🎥 Loading Jitsi Meet...');
    console.log('Container element:', containerRef.current);
    
    // Clear container
    containerRef.current.innerHTML = '';
    
    const domain = 'meet.jit.si';
    const roomName = roomId || `CareSync_${id}`;
    
    console.log('Room name:', roomName);
    
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      userInfo: {
        displayName: appointmentData?.patientName || 'Patient',
        email: localStorage.getItem('userEmail') || ''
      },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        disableInviteFunctions: true,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
        toolbarConfig: {
          initials: ['microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen', 'hangup']
        }
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'settings',
          'raisehand', 'videoquality', 'filmstrip', 'tileview', 'help'
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false
      }
    };

    const setupJitsiEvents = (api) => {
      api.addListener('videoConferenceJoined', () => {
        console.log('✅ Successfully joined telemedicine session');
        setJitsiLoaded(true);
        setJitsiInitializing(false);
      });
      
      api.addListener('videoConferenceLeft', () => {
        console.log('👋 Left telemedicine session');
        handleEndCall();
      });
      
      api.addListener('readyToClose', () => {
        console.log('🔚 Session ready to close');
      });
    };

    // Function to initialize Jitsi
    const initJitsi = () => {
      if (!window.JitsiMeetExternalAPI) {
        console.log('Waiting for Jitsi API...');
        return false;
      }
      
      try {
        console.log('Creating Jitsi instance...');
        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
        setupJitsiEvents(jitsiApiRef.current);
        
        // Disable the initializing overlay immediately so user can interact with Jitsi permission prompts!
        setJitsiInitializing(false);
        setJitsiLoaded(true);
        
        return true;
      } catch (err) {
        console.error('Error creating Jitsi instance:', err);
        return false;
      }
    };

    // Check if Jitsi API is already available
    if (window.JitsiMeetExternalAPI) {
      initJitsi();
      return;
    }

    // Load Jitsi script
    console.log('Loading Jitsi script...');
    const scriptId = 'jitsi-external-api-script';
    let script = document.getElementById(scriptId);
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Jitsi script loaded successfully');
        // Small delay to ensure API is ready
        setTimeout(() => {
          const success = initJitsi();
          if (!success) {
            setError('Failed to initialize video conference. Please refresh the page.');
            setJitsiInitializing(false);
          }
        }, 500);
      };
      
      script.onerror = (err) => {
        console.error('Failed to load Jitsi script:', err);
        setError('Failed to load video conference service. Please check your internet connection.');
        setJitsiInitializing(false);
      };
      
      document.body.appendChild(script);
    } else if (window.JitsiMeetExternalAPI) {
      // Script exists and API is ready
      setTimeout(() => {
        const success = initJitsi();
        if (!success) {
          setError('Failed to initialize video conference.');
          setJitsiInitializing(false);
        }
      }, 100);
    } else {
      // Script exists but not loaded yet
      script.onload = () => {
        setTimeout(() => {
          const success = initJitsi();
          if (!success) {
            setError('Failed to initialize video conference.');
            setJitsiInitializing(false);
          }
        }, 500);
      };
    }
  };

  const handleEndCall = async () => {
    try {
      console.log('Sending request to mark appointment fully completed...', id);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5015/api/appointments/${id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ consultationNotes: 'Telemedicine session completed' })
      });
      const data = await response.json();
      console.log('Completion response:', data);
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
    
    // Clean up Jitsi
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch (e) {
        console.error('Error disposing Jitsi:', e);
      }
      jitsiApiRef.current = null;
    }
    
    // Check if doctor
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'doctor') {
          return navigate('/doctor/appointments');
        }
      }
    } catch (err) {
      console.error('Failed to parse user', err);
    }
    
    navigate('/dashboard');
  };

  const formatTimeUntilJoin = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (date) => {
    if (!date) return 'Date not set';
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
          <Loader className="w-12 h-12 text-white animate-spin mx-auto" />
          <p className="text-white mt-4">Loading telemedicine session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
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
              The meeting will start automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex justify-between items-center z-10">
        <div>
          <p className="text-white font-semibold">Dr. {appointment?.doctorName}</p>
          <p className="text-xs text-gray-400">{appointment?.patientName}</p>
        </div>
        <div className="text-right text-sm text-gray-400">
          <p>{appointment && formatDateTime(appointment.date)}</p>
        </div>
      </div>
      
      {/* Jitsi Container - FIXED HEIGHT */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full relative z-0"
        style={{ minHeight: 'calc(100vh - 60px)' }}
      />
      
      {/* Loading overlay while Jitsi script downloads ONLY */}
      {jitsiInitializing && !jitsiLoaded && (
        <div className="absolute inset-x-0 bottom-0 top-[60px] flex items-center justify-center bg-gray-900 z-10 pointer-events-none">
          <div className="text-center">
            <Loader className="w-10 h-10 text-white animate-spin mx-auto mb-4" />
            <p className="text-white text-sm">Preparing secure session...</p>
          </div>
        </div>
      )}
      
      {/* End Call Button */}
      <button
        onClick={handleEndCall}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium shadow-lg transition-all z-20 flex items-center gap-2"
      >
        <PhoneOff className="w-5 h-5" />
        End Call
      </button>
    </div>
  );
};

export default TelemedicineRoom;