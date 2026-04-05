// controllers/telemedicineController.js
const TelemedicineSession = require('../models/TelemedicineSession');

// Create telemedicine session
const createSession = async (req, res) => {
    try {
        const {
            appointmentId,
            doctorName,
            patientName,
            scheduledDate,
            scheduledTime,
            roomName,
            meetingLink
        } = req.body;

        const existingSession = await TelemedicineSession.findOne({ appointmentId });
        if (existingSession) {
            return res.json({
                success: true,
                session: existingSession
            });
        }

        const session = new TelemedicineSession({
            appointmentId,
            patientId: req.body.patientId,
            doctorId: req.body.doctorId,
            meetingLink,
            roomName,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            status: 'scheduled'
        });

        await session.save();

        res.status(201).json({
            success: true,
            session
        });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get session by appointment ID
const getSessionByAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        const session = await TelemedicineSession.findOne({ appointmentId });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Telemedicine session not found'
            });
        }

        // Calculate if session is active
        const now = new Date();
        const sessionDate = new Date(session.scheduledDate);
        const [hour, minute] = session.scheduledTime.split(':');
        sessionDate.setHours(parseInt(hour), parseInt(minute), 0);
        
        const sessionEnd = new Date(sessionDate);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + 30); // Assume 30 min duration
        
        const canJoin = now >= sessionDate && now <= sessionEnd;
        const minutesUntilStart = sessionDate > now ? Math.ceil((sessionDate - now) / 60000) : 0;

        res.json({
            success: true,
            session: {
                ...session.toObject(),
                canJoin,
                minutesUntilStart,
                sessionStartTime: sessionDate,
                sessionEndTime: sessionEnd
            }
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark session as active (when someone joins)
const markSessionActive = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { userType } = req.body;
        
        const session = await TelemedicineSession.findOne({ appointmentId });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Telemedicine session not found'
            });
        }

        session.status = 'active';
        session.startTime = new Date();
        
        if (userType === 'patient') {
            session.participants.patientJoined = true;
            session.participants.patientJoinTime = new Date();
        } else if (userType === 'doctor') {
            session.participants.doctorJoined = true;
            session.participants.doctorJoinTime = new Date();
        }
        
        await session.save();

        res.json({
            success: true,
            session
        });
    } catch (error) {
        console.error('Mark session active error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// End session
const endSession = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { consultationNotes, prescription } = req.body;
        
        const session = await TelemedicineSession.findOne({ appointmentId });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Telemedicine session not found'
            });
        }

        await session.endSession(consultationNotes, prescription);

        res.json({
            success: true,
            message: 'Session ended successfully',
            session
        });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createSession,
    getSessionByAppointment,
    markSessionActive,
    endSession
};