const TelemedicineSession = require('../models/TelemedicineSession');
const Prescription = require('../models/Prescription');
const axios = require('axios');

// Generate Jitsi meeting link
const generateMeetingLink = (appointmentId) => {
  const roomName = `healthcare_${appointmentId}_${Date.now()}`;
  return {
    roomName,
    url: `https://meet.jit.si/${roomName}`,
    config: {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      prejoinPageEnabled: true
    }
  };
};

// @desc    Get or create telemedicine session
// @route   GET /api/telemedicine/:appointmentId
const getOrCreateSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;
    
    // Check if session exists
    let session = await TelemedicineSession.findOne({ appointmentId });
    
    if (!session) {
      // Get appointment details from appointment service
      let appointment;
      try {
        const appointmentRes = await axios.get(`${process.env.APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`);
        appointment = appointmentRes.data.appointment;
      } catch (error) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Check authorization
      if (userRole === 'patient' && appointment.patientId.toString() !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      if (userRole === 'doctor' && appointment.doctorId.toString() !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // Check payment status
      if (appointment.paymentStatus !== 'paid') {
        return res.status(400).json({ message: 'Payment required to access telemedicine' });
      }
      
      // Generate meeting link
      const meeting = generateMeetingLink(appointmentId);
      
      // Create session
      session = await TelemedicineSession.create({
        appointmentId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        meetingLink: meeting.url,
        roomName: meeting.roomName,
        status: 'scheduled'
      });
    }
    
    // Check if it's time for consultation
    let appointment;
    try {
      const appointmentRes = await axios.get(`${process.env.APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}`);
      appointment = appointmentRes.data.appointment;
    } catch (error) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = appointment.timeSlot.start.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const joinTime = new Date(appointmentDate.getTime() - 15 * 60000);
    const endTime = new Date(appointmentDate.getTime() + 60 * 60000);
    
    if (now < joinTime) {
      return res.json({
        success: true,
        canJoin: false,
        message: `You can join 15 minutes before appointment`,
        scheduledTime: appointment.timeSlot.start,
        meetingLink: session.meetingLink
      });
    }
    
    res.json({
      success: true,
      canJoin: true,
      session: {
        meetingLink: session.meetingLink,
        roomName: session.roomName,
        status: session.status
      },
      appointment: {
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        doctor: appointment.doctorName,
        patient: appointment.patientName
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start telemedicine session
// @route   POST /api/telemedicine/:appointmentId/start
const startSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;
    
    let session = await TelemedicineSession.findOne({ appointmentId });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Check authorization
    if (userRole === 'patient' && session.patientId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'doctor' && session.doctorId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Update participant status
    if (userRole === 'patient') {
      session.participants.patientJoined = true;
      session.participants.patientJoinTime = new Date();
    } else if (userRole === 'doctor') {
      session.participants.doctorJoined = true;
      session.participants.doctorJoinTime = new Date();
    }
    
    // Start session if first participant joins
    if (session.status === 'scheduled' && (session.participants.patientJoined || session.participants.doctorJoined)) {
      session.status = 'active';
      session.startTime = new Date();
    }
    
    await session.save();
    
    res.json({
      success: true,
      session: {
        meetingLink: session.meetingLink,
        status: session.status
      },
      message: `${userRole} has joined the session`
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    End session and add prescription
// @route   POST /api/telemedicine/:appointmentId/end
const endSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { consultationNotes, prescription } = req.body;
    const userId = req.userId;
    
    const session = await TelemedicineSession.findOne({ appointmentId });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Only doctor can end session
    if (session.doctorId.toString() !== userId) {
      return res.status(403).json({ message: 'Only doctor can end the consultation' });
    }
    
    // End session
    await session.endSession(consultationNotes, prescription);
    
    // Save prescription if provided
    let savedPrescription = null;
    if (prescription) {
      savedPrescription = await Prescription.create({
        appointmentId,
        patientId: session.patientId,
        doctorId: session.doctorId,
        ...prescription
      });
    }
    
    // Update appointment in appointment service
    try {
      await axios.put(`${process.env.APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}/status`, {
        status: 'completed',
        consultationNotes,
        prescription: savedPrescription
      });
    } catch (error) {
      console.log('Error updating appointment:', error.message);
    }
    
    // Send notification to patient
    try {
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
        userId: session.patientId,
        userType: 'patient',
        type: 'consultation_completed',
        title: 'Consultation Completed',
        message: 'Your consultation has been completed. Please check your prescriptions.',
        appointmentId
      });
    } catch (error) {
      console.log('Notification error:', error.message);
    }
    
    res.json({
      success: true,
      message: 'Consultation ended successfully',
      session: {
        duration: session.duration,
        endTime: session.endTime
      },
      prescription: savedPrescription
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get prescription
// @route   GET /api/telemedicine/:appointmentId/prescription
const getPrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;
    
    const prescription = await Prescription.findOne({ appointmentId });
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Check authorization
    if (userRole === 'patient' && prescription.patientId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (userRole === 'doctor' && prescription.doctorId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json({
      success: true,
      prescription
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrCreateSession,
  startSession,
  endSession,
  getPrescription
};