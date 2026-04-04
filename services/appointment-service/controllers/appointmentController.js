const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/appointments');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function to call notification service
const sendNotification = async (userId, userType, title, message, data = {}) => {
    try {
        const response = await fetch(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                userType,
                title,
                message,
                data
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Error sending notification:', error);
        return null;
    }
};

// Helper function to call payment service
const processPaymentRequest = async (appointmentId, amount, patientId, paymentMethod = 'card') => {
    try {
        const response = await fetch(`${process.env.PAYMENT_SERVICE_URL}/api/payments/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appointmentId,
                amount,
                patientId,
                paymentMethod,
                currency: 'LKR'
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Error processing payment:', error);
        return { success: false, error: error.message };
    }
};

// Generate Jitsi meeting link
const generateTelemedicineLink = (appointmentId, doctorName, patientName) => {
    const roomId = `caresync_${appointmentId}_${Date.now()}`;
    const domain = 'meet.jit.si';
    const roomName = `CareSync_${appointmentId}`;
    const jitsiLink = `https://${domain}/${roomName}`;
    
    return {
        telemedicineLink: jitsiLink,
        telemedicineRoomId: roomId,
        roomName: roomName
    };
};

// Add this at the top of createAppointment function for debugging
const createAppointment = async (req, res) => {
    try {
        console.log('=== CREATE APPOINTMENT DEBUG ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        console.log('Request patient:', req.patient);
        
        const {
            doctorId,
            doctorName,
            doctorSpecialty,
            patientName,
            patientEmail,
            slotId,
            date,
            startTime,
            endTime,
            consultationFee,
            symptoms,
            medicalHistory
        } = req.body;

        const patientId = req.patient?._id || req.body.patientId;
        
        console.log('Extracted values:', {
            doctorId,
            patientId,
            slotId,
            date,
            startTime,
            endTime,
            consultationFee
        });
        
        if (!patientId) {
            console.log('ERROR: No patient ID found');
            return res.status(401).json({
                success: false,
                message: 'Patient not authenticated'
            });
        }

        // Check for conflicting appointments
        const existingAppointment = await Appointment.findOne({
            doctorId: doctorId,
            date: new Date(date),
            startTime,
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingAppointment) {
            console.log('ERROR: Slot already booked');
            return res.status(400).json({
                success: false,
                message: 'This time slot is already booked'
            });
        }

        // Handle file uploads
        const uploadedReports = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                uploadedReports.push({
                    fileName: file.originalname,
                    filePath: file.path,
                    uploadDate: new Date()
                });
            }
        }

        const appointmentData = {
            patientId: patientId,
            patientName: patientName || '',
            patientEmail: patientEmail || '',
            doctorId: doctorId,
            doctorName: doctorName || '',
            doctorSpecialty: doctorSpecialty || '',
            slotId: slotId,
            date: new Date(date),
            startTime: startTime,
            endTime: endTime,
            consultationFee: Number(consultationFee) || 0,
            symptoms: symptoms,
            medicalHistory: medicalHistory || '',
            uploadedReports: uploadedReports,
            status: 'pending',
            paymentStatus: 'pending'
        };
        
        console.log('Creating appointment with data:', appointmentData);

        const appointment = new Appointment(appointmentData);
        await appointment.save();
        
        console.log('Appointment created successfully:', appointment._id);

        // Send notification to doctor (don't fail if notification fails)
        try {
            await sendNotification(
                doctorId,
                'doctor',
                'New Appointment Request',
                `A new appointment has been requested for ${new Date(date).toLocaleDateString()} at ${startTime}`,
                { appointmentId: appointment._id, type: 'new_appointment' }
            );
        } catch (notifError) {
            console.error('Notification error (non-critical):', notifError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            appointment: appointment
        });

    } catch (error) {
        console.error('Create appointment error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// @desc    Get appointments for a patient
// @route   GET /api/appointments/patient/:patientId
const getPatientAppointments = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const appointments = await Appointment.find({ 
            patientId: patientId 
        }).sort({ date: -1, createdAt: -1 });

        res.json({
            success: true,
            count: appointments.length,
            appointments
        });
    } catch (error) {
        console.error('Get patient appointments error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get appointments for a doctor
// @route   GET /api/appointments/doctor/:doctorId
const getDoctorAppointments = async (req, res) => {
    try {
        const { doctorId } = req.params;
        
        const appointments = await Appointment.find({ 
            doctorId: doctorId 
        }).sort({ date: -1, createdAt: -1 });

        res.json({
            success: true,
            count: appointments.length,
            appointments
        });
    } catch (error) {
        console.error('Get doctor appointments error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            appointment
        });
    } catch (error) {
        console.error('Get appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update appointment status (Accept/Reject)
// @route   PUT /api/appointments/:id/status
const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason, consultationNotes } = req.body;
        
        const appointment = await Appointment.findById(id);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.status = status;
        appointment.updatedAt = new Date();
        
        if (status === 'rejected' && rejectionReason) {
            appointment.rejectionReason = rejectionReason;
        }
        
        if (consultationNotes) {
            appointment.consultationNotes = consultationNotes;
        }

        await appointment.save();

        // Send notification to patient
        const statusMessage = status === 'accepted' 
            ? 'Your appointment has been accepted! Please complete the payment to join the telemedicine session.'
            : `Your appointment has been rejected. Reason: ${rejectionReason || 'No reason provided'}`;
        
        await sendNotification(
            appointment.patientId,
            'patient',
            `Appointment ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
            statusMessage,
            { appointmentId: appointment._id, status }
        );

        res.json({
            success: true,
            message: `Appointment ${status}`,
            appointment
        });
    } catch (error) {
        console.error('Update appointment status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Process payment for appointment
// @route   POST /api/appointments/:id/payment
const processPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod, cardDetails } = req.body;
        
        const appointment = await Appointment.findById(id);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        if (appointment.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Appointment must be accepted before payment'
            });
        }

        if (appointment.paymentStatus === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Payment already completed'
            });
        }

        // Process payment with payment service
        const paymentResult = await processPaymentRequest(
            id,
            appointment.consultationFee,
            appointment.patientId,
            paymentMethod
        );

        if (!paymentResult.success) {
            appointment.paymentStatus = 'failed';
            await appointment.save();
            
            return res.status(400).json({
                success: false,
                message: paymentResult.error || 'Payment processing failed'
            });
        }

        // Update appointment with payment info
        appointment.paymentStatus = 'completed';
        appointment.paymentId = paymentResult.paymentId;
        appointment.paymentDetails = paymentResult.details || {};
        
        // Generate telemedicine link after successful payment
        const telemedicineData = generateTelemedicineLink(
            id,
            appointment.doctorName || 'Doctor',
            appointment.patientName || 'Patient'
        );
        
        appointment.telemedicineLink = telemedicineData.telemedicineLink;
        appointment.telemedicineRoomId = telemedicineData.telemedicineRoomId;
        
        await appointment.save();

        // Send notifications to both parties
        await sendNotification(
            appointment.patientId,
            'patient',
            'Payment Successful',
            `Your payment of LKR ${appointment.consultationFee} has been processed. Click the link to join your telemedicine session at the scheduled time.`,
            { 
                appointmentId: appointment._id, 
                telemedicineLink: appointment.telemedicineLink,
                scheduledTime: appointment.startTime,
                scheduledDate: appointment.date
            }
        );

        await sendNotification(
            appointment.doctorId,
            'doctor',
            'Payment Completed',
            `Patient has completed the payment of LKR ${appointment.consultationFee} for appointment on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.startTime}.`,
            { 
                appointmentId: appointment._id,
                telemedicineLink: appointment.telemedicineLink
            }
        );

        res.json({
            success: true,
            message: 'Payment processed successfully',
            appointment,
            telemedicineLink: appointment.telemedicineLink
        });
    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get telemedicine session info
// @route   GET /api/appointments/:id/telemedicine
const getTelemedicineInfo = async (req, res) => {
    try {
        const { id } = req.params;
        
        const appointment = await Appointment.findById(id);

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

        // Check if current time is within appointment time
        const now = new Date();
        const appointmentDate = new Date(appointment.date);
        const [startHour, startMinute] = appointment.startTime.split(':');
        appointmentDate.setHours(parseInt(startHour), parseInt(startMinute), 0);
        
        const appointmentEnd = new Date(appointmentDate);
        const [endHour, endMinute] = appointment.endTime.split(':');
        appointmentEnd.setHours(parseInt(endHour), parseInt(endMinute), 0);
        
        const canJoin = now >= appointmentDate && now <= appointmentEnd;
        const isEarly = now < appointmentDate;
        const isLate = now > appointmentEnd;

        res.json({
            success: true,
            telemedicineLink: appointment.telemedicineLink,
            telemedicineRoomId: appointment.telemedicineRoomId,
            appointment: {
                id: appointment._id,
                date: appointment.date,
                startTime: appointment.startTime,
                endTime: appointment.endTime,
                doctorName: appointment.doctorName,
                patientName: appointment.patientName
            },
            sessionStatus: {
                canJoin,
                isEarly,
                isLate,
                currentTime: now,
                sessionStartTime: appointmentDate,
                sessionEndTime: appointmentEnd
            }
        });
    } catch (error) {
        console.error('Get telemedicine info error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Complete appointment and add prescription
// @route   POST /api/appointments/:id/complete
const completeAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { consultationNotes, prescription } = req.body;
        
        const appointment = await Appointment.findById(id);
        
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

        // Send notification to patient
        await sendNotification(
            appointment.patientId,
            'patient',
            'Appointment Completed',
            'Your telemedicine session has been completed. The prescription has been shared with you.',
            { appointmentId: appointment._id, prescription }
        );

        res.json({
            success: true,
            message: 'Appointment completed successfully',
            appointment
        });
    } catch (error) {
        console.error('Complete appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        const appointment = await Appointment.findById(id);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        if (appointment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel completed appointment'
            });
        }

        appointment.status = 'cancelled';
        appointment.rejectionReason = reason || 'Cancelled by user';
        appointment.updatedAt = new Date();
        
        await appointment.save();

        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            appointment
        });
    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    processPayment,
    getTelemedicineInfo,
    completeAppointment,
    cancelAppointment
};