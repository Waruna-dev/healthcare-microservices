const Appointment = require('../models/Appointment');

// @desc    Start telemedicine session
// @route   POST /api/telemedicine/:appointmentId/start
const startSession = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        const appointment = await Appointment.findById(appointmentId)
            .populate('doctorId', 'name email')
            .populate('patientId', 'name email');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        if (appointment.paymentStatus !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Payment required to start telemedicine session'
            });
        }

        if (!appointment.telemedicineLink) {
            return res.status(400).json({
                success: false,
                message: 'Telemedicine link not generated'
            });
        }

        // Check if session time is valid
        const now = new Date();
        const appointmentDate = new Date(appointment.date);
        const [startHour, startMinute] = appointment.startTime.split(':');
        appointmentDate.setHours(parseInt(startHour), parseInt(startMinute), 0);
        
        const appointmentEnd = new Date(appointmentDate);
        const [endHour, endMinute] = appointment.endTime.split(':');
        appointmentEnd.setHours(parseInt(endHour), parseInt(endMinute), 0);
        
        if (now < appointmentDate) {
            return res.status(400).json({
                success: false,
                message: `Session starts at ${appointment.startTime}. Please join at the scheduled time.`
            });
        }
        
        if (now > appointmentEnd) {
            return res.status(400).json({
                success: false,
                message: 'This session has ended'
            });
        }

        res.json({
            success: true,
            message: 'Session ready to start',
            telemedicineLink: appointment.telemedicineLink,
            telemedicineRoomId: appointment.telemedicineRoomId,
            appointment: {
                id: appointment._id,
                doctor: appointment.doctorId,
                patient: appointment.patientId,
                startTime: appointment.startTime,
                endTime: appointment.endTime
            }
        });
    } catch (error) {
        console.error('Start session error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    End telemedicine session
// @route   POST /api/telemedicine/:appointmentId/end
const endSession = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { consultationNotes, prescription } = req.body;
        
        const appointment = await Appointment.findById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.status = 'completed';
        appointment.consultationNotes = consultationNotes || appointment.consultationNotes;
        appointment.prescription = prescription || null;
        appointment.updatedAt = new Date();
        
        await appointment.save();

        res.json({
            success: true,
            message: 'Session ended successfully',
            appointment
        });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get session info
// @route   GET /api/telemedicine/:appointmentId
const getSession = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        const appointment = await Appointment.findById(appointmentId)
            .populate('doctorId', 'name email specialty profilePicture')
            .populate('patientId', 'name email contactNumber');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        if (appointment.paymentStatus !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Payment required to access telemedicine session'
            });
        }

        res.json({
            success: true,
            telemedicineLink: appointment.telemedicineLink,
            telemedicineRoomId: appointment.telemedicineRoomId,
            appointment: {
                id: appointment._id,
                date: appointment.date,
                startTime: appointment.startTime,
                endTime: appointment.endTime,
                doctor: appointment.doctorId,
                patient: appointment.patientId,
                status: appointment.status
            }
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get prescription
// @route   GET /api/telemedicine/:appointmentId/prescription
const getPrescription = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        const appointment = await Appointment.findById(appointmentId);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            prescription: appointment.prescription,
            consultationNotes: appointment.consultationNotes,
            appointmentId: appointment._id
        });
    } catch (error) {
        console.error('Get prescription error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    startSession,
    endSession,
    getSession,
    getPrescription
};