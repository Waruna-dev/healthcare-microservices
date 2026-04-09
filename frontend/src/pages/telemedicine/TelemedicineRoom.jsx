// src/pages/patient/TelemedicineRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, Clock, PhoneOff, CheckCircle, XCircle, UserCheck, UserX } from 'lucide-react';

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
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [userRole, setUserRole] = useState('patient');
  const [callEnded, setCallEnded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Track participants who joined the meeting
  const [participants, setParticipants] = useState({
    doctor: false,
    patient: false,
    doctorName: '',
    patientName: ''
  });
  
  // Track confirmation status from backend
  const [confirmationStatus, setConfirmationStatus] = useState({
    doctorConfirmed: false,
    patientConfirmed: false,
    isFullyCompleted: false,
    completionStatus: 'pending'
  });
  
  const containerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const intervalRef = useRef(null);
  const statusCheckIntervalRef = useRef(null);

  // Fetch telemedicine info on mount
  useEffect(() => {
    fetchTelemedicineInfo();
    // Start polling for status changes
    startStatusPolling();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (statusCheckIntervalRef.current) clearInterval(statusCheckIntervalRef.current);
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (e) {
          console.log('Error disposing Jitsi:', e);
        }
      }
    };
  }, [id]);

  const startStatusPolling = () => {
    // Poll every 3 seconds to check if other party confirmed
    statusCheckIntervalRef.current = setInterval(async () => {
      if (!showOutcomeModal && !callEnded) {
        await fetchCompletionStatus();
      }
    }, 3000);
  };

  const fetchCompletionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5015/api/appointments/${id}/completion-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setConfirmationStatus({
          doctorConfirmed: data.doctorConfirmed,
          patientConfirmed: data.patientConfirmed,
          isFullyCompleted: data.isFullyCompleted,
          completionStatus: data.completionStatus
        });
        
        // If fully completed, show message and redirect
        if (data.isFullyCompleted && !confirmationStatus.isFullyCompleted) {
          alert('✅ Appointment completed successfully! Both doctor and patient have confirmed.');
          setTimeout(() => {
            if (isUserDoctor()) {
              navigate('/doctor/appointments');
            } else {
              navigate('/appointments/all');
            }
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error fetching completion status:', error);
    }
  };

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
        
     
        setParticipants(prev => ({
          ...prev,
          doctorName: data.appointment.doctorName || 'Doctor',
          patientName: data.appointment.patientName || 'Patient'
        }));

        await fetchCompletionStatus();
        
        if (data.appointment.status === 'no_show') {
          setError('This appointment was marked as "Patient No-Show". Please contact support for rescheduling.');
          setLoading(false);
          return;
        }
        
        if (data.appointment.status === 'doctor_no_show') {
          setError('This appointment was marked as "Doctor No-Show". Please contact support for rescheduling.');
          setLoading(false);
          return;
        }
        
        if (data.appointment.status === 'completed') {
          setError('This consultation has already been completed.');
          setLoading(false);
          return;
        }

        if (data.sessionStatus?.canJoin) {
          console.log('✅ Can join immediately');
          setCanJoin(true);
          loadJitsiMeet(data.telemedicineLink, data.telemedicineRoomId, data.appointment);
        } else if (data.sessionStatus?.isEarly) {
          console.log('⏰ Session starts later');
          const canJoinTime = new Date(data.sessionStatus.canJoinTime);
          startCountdown(canJoinTime, data);
        } else if (data.sessionStatus?.isLate) {
          setShowOutcomeModal(true);
          setLoading(false);
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
        loadJitsiMeet(sessionData.telemedicineLink, sessionData.telemedicineRoomId, sessionData.appointment);
      } else {
        setTimeUntilJoin(diff);
      }
    }, 1000);
  };

  const isUserDoctor = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'doctor') return true;
        if (user.user?.role === 'doctor') return true;
        if (user.doctor) return true;
        if (user.type === 'doctor') return true;
        if (user.doctor && user.doctor._id) return true;
      }
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'doctor') return true;
      const isDoctorLogin = localStorage.getItem('isDoctor');
      if (isDoctorLogin === 'true') return true;
      return false;
    } catch (err) {
      console.error('Error checking user role:', err);
      return false;
    }
  };

  const loadJitsiMeet = (telemedicineLink, roomId, appointmentData) => {
    if (jitsiLoaded || jitsiInitializing || callEnded) {
      console.log('Jitsi already loading or loaded or call ended');
      return;
    }

    if (!containerRef.current) {
      console.error('Container ref is null, retrying in 500ms');
      setTimeout(() => loadJitsiMeet(telemedicineLink, roomId, appointmentData), 500);
      return;
    }

    setJitsiInitializing(true);
    console.log('🎥 Loading Jitsi Meet...');

    containerRef.current.innerHTML = '';

    const domain = 'meet.jit.si';
    const roomName = roomId || `CareSync_Consultation_${id}`;

    console.log('🔗 Connecting to Room:', roomName);

    let displayName = appointmentData?.patientName || 'User';
    let role = 'patient';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        displayName = userObj.name || userObj.firstName || userObj.username || displayName;
        if (userObj.role === 'doctor') role = 'doctor';
        else if (userObj.user?.role === 'doctor') role = 'doctor';
        else if (userObj.doctor) role = 'doctor';
        else if (userObj.type === 'doctor') role = 'doctor';
        if (role === 'doctor' && !displayName.toLowerCase().includes('dr')) {
          displayName = `Dr. ${displayName}`;
        }
        setUserRole(role);
      }
    } catch (err) {}

    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      userInfo: {
        displayName: displayName,
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
        console.log(`✅ ${role} joined the telemedicine session`);
        setJitsiLoaded(true);
        setJitsiInitializing(false);
        
        if (role === 'doctor') {
          setParticipants(prev => ({ ...prev, doctor: true }));
        } else {
          setParticipants(prev => ({ ...prev, patient: true }));
        }
      });

      api.addListener('participantJoined', (participant) => {
        console.log('👤 Participant joined:', participant);
        const participantName = participant?.displayName || '';
        console.log('Participant name:', participantName);
        
        if (participantName.toLowerCase().includes('dr') || 
            participantName.toLowerCase().includes('doctor')) {
          console.log('🩺 Doctor joined the session');
          setParticipants(prev => ({ ...prev, doctor: true }));
        } 
        else if (participants.patientName && 
                 participantName.toLowerCase().includes(participants.patientName.toLowerCase().split(' ')[0])) {
          console.log('👤 Patient joined the session');
          setParticipants(prev => ({ ...prev, patient: true }));
        }
        else {
          if (role === 'doctor') {
            console.log('👤 Assuming patient joined');
            setParticipants(prev => ({ ...prev, patient: true }));
          } else {
            console.log('🩺 Assuming doctor joined');
            setParticipants(prev => ({ ...prev, doctor: true }));
          }
        }
      });

      api.addListener('videoConferenceLeft', () => {
        console.log('👋 Left telemedicine session');
        handleEndCall();
      });

      api.addListener('readyToClose', () => {
        console.log('🔚 Session ready to close');
      });
    };

    const initJitsi = () => {
      if (!window.JitsiMeetExternalAPI) {
        console.log('Waiting for Jitsi API...');
        return false;
      }

      try {
        console.log('Creating Jitsi instance...');
        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
        setupJitsiEvents(jitsiApiRef.current);
        setJitsiInitializing(false);
        setJitsiLoaded(true);
        return true;
      } catch (err) {
        console.error('Error creating Jitsi instance:', err);
        return false;
      }
    };

    if (window.JitsiMeetExternalAPI) {
      initJitsi();
      return;
    }

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
      setTimeout(() => {
        const success = initJitsi();
        if (!success) {
          setError('Failed to initialize video conference.');
          setJitsiInitializing(false);
        }
      }, 100);
    } else {
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

  const handleEndCall = () => {
    console.log('Call ended by user interaction');
    
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch (e) {
        console.error('Error disposing Jitsi:', e);
      }
      jitsiApiRef.current = null;
    }
    
    setCallEnded(true);
    setShowOutcomeModal(true);
  };

  const submitOutcome = async (finalStatus) => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      let consultationNotes = '';
      let appointmentStatus = '';
      let userType = userRole === 'doctor' ? 'doctor' : 'patient';
      
      // VALIDATION: Prevent false claims
      if (userRole === 'doctor') {
        if (finalStatus === 'no_show') {
          if (participants.patient) {
            alert('❌ Cannot mark as "Patient No-Show" because the patient was in the meeting!');
            setSubmitting(false);
            return;
          }
          appointmentStatus = 'no_show';
          consultationNotes = 'Doctor reported: Patient did not attend the scheduled telemedicine session.';
        } else if (finalStatus === 'completed') {
          appointmentStatus = 'completed';
          consultationNotes = 'Doctor confirmed consultation completion.';
        }
      } else {
        if (finalStatus === 'doctor_no_show') {
          if (participants.doctor) {
            alert('❌ Cannot mark as "Doctor No-Show" because the doctor was in the meeting!');
            setSubmitting(false);
            return;
          }
          appointmentStatus = 'doctor_no_show';
          consultationNotes = 'Patient reported: Doctor did not attend the scheduled telemedicine session.';
        } else if (finalStatus === 'completed') {
          appointmentStatus = 'completed';
          consultationNotes = 'Patient confirmed consultation completion.';
        }
      }

      console.log(`📝 ${userType} marking appointment as ${appointmentStatus}...`, id);
      
      const response = await fetch(`http://localhost:5015/api/appointments/${id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          consultationNotes: consultationNotes,
          prescription: null,
          status: appointmentStatus,
          userType: userType
        })
      });
      
      const data = await response.json();
      console.log('Outcome submission response:', data);
      
      if (data.success) {
        // Update confirmation status from response
        if (data.appointment) {
          setConfirmationStatus({
            doctorConfirmed: data.appointment.doctorConfirmed,
            patientConfirmed: data.appointment.patientConfirmed,
            isFullyCompleted: data.appointment.isFullyCompleted,
            completionStatus: data.appointment.completionStatus
          });
        }
        
        if (data.appointment?.isFullyCompleted) {
          alert('✅ Appointment completed successfully! Both doctor and patient have confirmed.');
          if (isUserDoctor()) {
            navigate('/doctor/appointments');
          } else {
            navigate('/dashboard');
          }
        } else if (appointmentStatus === 'completed') {
          const waitingFor = userRole === 'doctor' ? 'patient' : 'doctor';
          alert(`📋 Your confirmation has been recorded. Waiting for ${waitingFor} to confirm completion.`);
          setShowOutcomeModal(false);
          setCallEnded(false);
          setSubmitting(false);
        } else if (appointmentStatus === 'no_show' || appointmentStatus === 'doctor_no_show') {
          alert(finalStatus === 'no_show' ? 'Patient no-show recorded' : 'Doctor no-show recorded');
          if (isUserDoctor()) {
            navigate('/doctor/appointments');
          } else {
            navigate('/dashboard');
          }
        } else {
          alert(data.message);
          if (isUserDoctor()) {
            navigate('/doctor/appointments');
          } else {
            navigate('/dashboard');
          }
        }
      } else {
        alert('Error: ' + (data.message || 'Failed to update appointment status'));
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error recording outcome:', error);
      alert('Error recording outcome. Please contact support.');
      setSubmitting(false);
    }
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

  if (error && !showOutcomeModal) {
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
          <p className="text-white font-semibold">
            Telemedicine Consultation
          </p>
          <p className="text-xs text-gray-400">
            Dr. {appointment?.doctorName} • {appointment?.startTime}
          </p>
        </div>
        <div className="text-right text-sm text-gray-400">
          <p>{appointment && formatDateTime(appointment.date)}</p>
        </div>
      </div>

      {/* Jitsi Container */}
      {!showOutcomeModal && !callEnded && (
        <div
          ref={containerRef}
          className="flex-1 w-full relative z-0"
          style={{ minHeight: 'calc(100vh - 60px)' }}
        />
      )}

      {jitsiInitializing && !jitsiLoaded && !showOutcomeModal && !callEnded && (
        <div className="absolute inset-x-0 bottom-0 top-[60px] flex items-center justify-center bg-gray-900/90 z-10">
          <div className="text-center">
            <Loader className="w-10 h-10 text-white animate-spin mx-auto mb-4" />
            <p className="text-white text-sm">Preparing secure session...</p>
          </div>
        </div>
      )}

      {/* Confirmation Status Banner - Show when one party has confirmed */}
      {!showOutcomeModal && !callEnded && (confirmationStatus.doctorConfirmed || confirmationStatus.patientConfirmed) && !confirmationStatus.isFullyCompleted && (
        <div className="absolute top-[60px] left-0 right-0 z-20 bg-yellow-500/90 backdrop-blur-sm p-2 text-center">
          <p className="text-white text-sm font-medium">
            {confirmationStatus.doctorConfirmed && !confirmationStatus.patientConfirmed && (
              <>✓ Doctor has confirmed. Waiting for patient confirmation...</>
            )}
            {!confirmationStatus.doctorConfirmed && confirmationStatus.patientConfirmed && (
              <>✓ Patient has confirmed. Waiting for doctor confirmation...</>
            )}
          </p>
        </div>
      )}

      {showOutcomeModal && (
        <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl transform transition-all">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhoneOff className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Ended</h2>
              <p className="text-gray-600">How did the consultation go?</p>
            </div>

            {/* Show current confirmation status */}
            {(confirmationStatus.doctorConfirmed || confirmationStatus.patientConfirmed) && !confirmationStatus.isFullyCompleted && (
              <div className="mb-4 p-3 bg-yellow-100 rounded-xl">
                <p className="text-sm text-yellow-800">
                  {confirmationStatus.doctorConfirmed && !confirmationStatus.patientConfirmed && (
                    <>✓ Doctor has already confirmed. Waiting for patient confirmation.</>
                  )}
                  {!confirmationStatus.doctorConfirmed && confirmationStatus.patientConfirmed && (
                    <>✓ Patient has already confirmed. Waiting for doctor confirmation.</>
                  )}
                </p>
              </div>
            )}

            {/* Participant Status Display */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <UserCheck size={16} className="text-green-600" />
                    <span className="font-medium">Doctor:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={participants.doctor ? "text-green-600 font-semibold" : "text-red-500"}>
                      {participants.doctor ? "Joined ✓" : "Did not join ✗"}
                    </span>
                    {confirmationStatus.doctorConfirmed && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Confirmed ✓</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <UserCheck size={16} className="text-green-600" />
                    <span className="font-medium">Patient:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={participants.patient ? "text-green-600 font-semibold" : "text-red-500"}>
                      {participants.patient ? "Joined ✓" : "Did not join ✗"}
                    </span>
                    {confirmationStatus.patientConfirmed && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Confirmed ✓</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {userRole === 'doctor' ? (
                <>
                  <button
                    onClick={() => submitOutcome('completed')}
                    disabled={submitting || confirmationStatus.doctorConfirmed}
                    className={`w-full py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2 ${
                      confirmationStatus.doctorConfirmed
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200'
                    }`}
                    title={confirmationStatus.doctorConfirmed ? "You have already confirmed" : "Confirm that consultation was successful"}
                  >
                    {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle size={20} />}
                    {confirmationStatus.doctorConfirmed ? 'Already Confirmed' : 'Consultation Successful'}
                  </button>
                  <button
                    onClick={() => submitOutcome('no_show')}
                    disabled={submitting || participants.patient}
                    className={`w-full py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2 ${
                      participants.patient
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-2 border-orange-200'
                    }`}
                    title={participants.patient ? "Cannot mark as no-show because patient joined the meeting" : "Mark that patient did not attend"}
                  >
                    {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <XCircle size={20} />}
                    Patient Did Not Show
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => submitOutcome('completed')}
                    disabled={submitting || confirmationStatus.patientConfirmed}
                    className={`w-full py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2 ${
                      confirmationStatus.patientConfirmed
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200'
                    }`}
                    title={confirmationStatus.patientConfirmed ? "You have already confirmed" : "Confirm that consultation was successful"}
                  >
                    {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle size={20} />}
                    {confirmationStatus.patientConfirmed ? 'Already Confirmed' : 'Consultation Successful'}
                  </button>
                  <button
                    onClick={() => submitOutcome('doctor_no_show')}
                    disabled={submitting || participants.doctor}
                    className={`w-full py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2 ${
                      participants.doctor
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-200'
                    }`}
                    title={participants.doctor ? "Cannot mark as no-show because doctor joined the meeting" : "Mark that doctor did not attend"}
                  >
                    {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <XCircle size={20} />}
                    Doctor Did Not Show
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => navigate(userRole === 'doctor' ? '/doctor/appointments' : '/dashboard')}
              className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline underline-offset-4"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelemedicineRoom;