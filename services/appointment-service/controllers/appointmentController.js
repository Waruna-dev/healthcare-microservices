const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Helper to auto-cancel pending appointments that have passed their start time
const checkAndCancelExpiredAppointments = async (appointments) => {
    const now = new Date();
    let updatedAppointments = [];

    for (let appt of appointments) {
        if (appt.status === 'pending') {
            const apptDate = new Date(appt.date);
            if (appt.startTime) {
                const [hours, minutes] = appt.startTime.split(':').map(Number);
                apptDate.setHours(hours, minutes, 0, 0);
                
                if (now > apptDate) {
                    appt.status = 'cancelled';
                    appt.rejectionReason = 'Auto-cancelled: Appointment time passed without doctor acceptance.';
                    await appt.save();
                }
            }
        }
        updatedAppointments.push(appt);
    }
    return updatedAppointments;
};
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/appointments');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function to call payment service
const processPaymentRequest = async (appointmentId, amount, patientId, paymentMethod = 'card') => {
    try {
        const response = await fetch(`${process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004'}/api/payments/create`, {
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

// Helper function to call telemedicine service
const createTelemedicineSession = async (appointmentId, doctorName, patientName, scheduledDate, scheduledTime, roomName, meetingLink) => {
    try {
        const response = await fetch(`${process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:5018'}/api/telemedicine/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appointmentId,
                doctorName,
                patientName,
                scheduledDate,
                scheduledTime,
                roomName,
                meetingLink
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating telemedicine session:', error);
        return { success: false, error: error.message };
    }
};

// Generate Jitsi meeting link (fallback)
const generateTelemedicineLink = (appointmentId) => {
    // Make roomName completely deterministic based on appointment ID!
    // This prevents race-conditions where simultaneous API calls generate two different timestamps.
    const roomName = `CareSync_Consultation_${appointmentId}`;
    const domain = 'meet.jit.si';
    const jitsiLink = `https://${domain}/${roomName}`;

    return {
        telemedicineLink: jitsiLink,
        telemedicineRoomId: roomName,
        roomName: roomName
    };
};

// @desc    Create a new appointment
// @desc    Create a new appointment
const createAppointment = async (req, res) => {
    try {
        console.log('=== CREATE APPOINTMENT DEBUG ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

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

        if (!patientId) {
            return res.status(401).json({
                success: false,
                message: 'Patient not authenticated'
            });
        }

        // ==============================================
        // 🔴 ADD THIS SLOT AVAILABILITY CHECK HERE 🔴
        // ==============================================
        // Check for conflicting appointments (pending or accepted)
        const existingAppointment = await Appointment.findOne({
            doctorId: doctorId,
            date: new Date(date),
            startTime: startTime,
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingAppointment) {
            console.log('❌ Slot already booked:', {
                doctorId,
                date,
                startTime,
                existingStatus: existingAppointment.status
            });
            return res.status(400).json({
                success: false,
                message: 'This time slot is already booked. Please select another time.'
            });
        }
        // ==============================================

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

        const appointment = new Appointment(appointmentData);
        await appointment.save();

        console.log('✅ Appointment created successfully:', appointment._id);

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            appointment: appointment
        });

    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// @desc    Get appointments for a patient
const getPatientAppointments = async (req, res) => {
    try {
        const { patientId } = req.params;

        console.log('🔍 Fetching appointments for patient:', patientId);

        let appointments = await Appointment.find({
            patientId: patientId
        }).sort({ date: -1, createdAt: -1 });
        
        appointments = await checkAndCancelExpiredAppointments(appointments);

        console.log(`📊 Found ${appointments.length} appointments for patient ${patientId}`);
        console.log('📋 Appointments:', JSON.stringify(appointments, null, 2));

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
const getDoctorAppointments = async (req, res) => {
    try {
        const { doctorId } = req.params;

        let appointments = await Appointment.find({
            doctorId: doctorId
        }).sort({ date: -1, createdAt: -1 });
        
        appointments = await checkAndCancelExpiredAppointments(appointments);

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

        // Check if payment is within 48 hours
        const acceptedDate = new Date(appointment.updatedAt);
        const now = new Date();
        const hoursSinceAcceptance = (now - acceptedDate) / (1000 * 60 * 60);

        if (hoursSinceAcceptance > 48) {
            appointment.status = 'cancelled';
            appointment.rejectionReason = 'Payment not completed within 48 hours';
            await appointment.save();
            return res.status(400).json({
                success: false,
                message: 'Payment window expired (48 hours). Appointment cancelled.'
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

        // Create local link data
        const telemedicineData = generateTelemedicineLink(
            id,
            appointment.doctorName,
            appointment.patientName
        );
        appointment.telemedicineLink = telemedicineData.telemedicineLink;
        appointment.telemedicineRoomId = telemedicineData.telemedicineRoomId;

        // Sync with telemedicine service
        await createTelemedicineSession(
            id,
            appointment.doctorName,
            appointment.patientName,
            appointment.date,
            appointment.startTime,
            telemedicineData.telemedicineRoomId,
            telemedicineData.telemedicineLink
        );

        await appointment.save();

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
// @desc    Get telemedicine session info - UPDATED VERSION
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

        // ALWAYS generate telemedicine link if missing
        if (!appointment.telemedicineLink || !appointment.telemedicineRoomId) {
            console.log("Generating telemedicine link for appointment:", id);
            const telemedicineData = generateTelemedicineLink(
                id,
                appointment.doctorName,
                appointment.patientName
            );
            appointment.telemedicineLink = telemedicineData.telemedicineLink;
            appointment.telemedicineRoomId = telemedicineData.telemedicineRoomId;
            await appointment.save();
        }

        // Check if current time is within appointment time (allow 20 minutes before)
        const now = new Date();
        const appointmentDate = new Date(appointment.date);
        const [startHour, startMinute] = appointment.startTime.split(':');
        appointmentDate.setHours(parseInt(startHour), parseInt(startMinute), 0);

        const appointmentEnd = new Date(appointmentDate);
        const [endHour, endMinute] = appointment.endTime.split(':');
        appointmentEnd.setHours(parseInt(endHour), parseInt(endMinute), 0);

        // Allow joining 20 minutes before
        const canJoinTime = new Date(appointmentDate);
        canJoinTime.setMinutes(canJoinTime.getMinutes() - 20);

        const canJoin = now >= canJoinTime && now <= appointmentEnd;
        const isEarly = now < canJoinTime;
        const isLate = now > appointmentEnd;

        // Calculate minutes until join window
        let minutesUntilJoin = null;
        if (isEarly) {
            minutesUntilJoin = Math.ceil((canJoinTime - now) / (1000 * 60));
        }

        console.log('Session status:', { canJoin, isEarly, isLate, minutesUntilJoin });

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
                minutesUntilJoin,
                canJoinTime: canJoinTime,
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
const completeAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { consultationNotes, prescription, status } = req.body;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.status = status || 'completed';
        appointment.consultationNotes = consultationNotes || appointment.consultationNotes;
        appointment.prescription = prescription || null;
        appointment.updatedAt = new Date();

        await appointment.save();

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

// @desc    Get upcoming appointment for patient (latest pending/accepted)
const getUpcomingAppointment = async (req, res) => {
    try {
        const { patientId } = req.params;

        console.log('🔍 Fetching upcoming appointment for patient:', patientId);

        const appointment = await Appointment.findOne({
            patientId: patientId,
            status: { $in: ['pending', 'accepted'] },
            paymentStatus: { $ne: 'failed' }
        }).sort({ createdAt: -1 });

        console.log('📊 Upcoming appointment found:', appointment ? appointment._id : 'None');

        res.json({
            success: true,
            appointment
        });
    } catch (error) {
        console.error('Get upcoming appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// @desc    Check if slot is available
// @desc    Check if slot is available (for pending appointments too)
const checkSlotAvailability = async (req, res) => {
    try {
        const { doctorId, date, startTime } = req.query;

        // Check for any appointment at this slot that took place or is confirmed
        const existingAppointment = await Appointment.findOne({
            doctorId: doctorId,
            date: new Date(date),
            startTime,
            status: { $in: ['pending', 'accepted', 'completed', 'no_show', 'doctor_no_show'] }
        });

        res.json({
            success: true,
            isAvailable: !existingAppointment,
            message: existingAppointment ? 'This time slot is already booked' : 'Slot available'
        });
    } catch (error) {
        console.error('Check slot availability error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// @desc    Update appointment status from Payment Webhook
const webhookPaymentSuccess = async (req, res) => {
    try {
        const { appointmentId, paymentId, paymentDetails } = req.body;

        console.log('🔗 Webhook Payment Success Hit:', { appointmentId, paymentId });

        if (!appointmentId) {
            return res.status(400).json({ success: false, message: 'appointmentId is required' });
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Only process if it is not already completed
        if (appointment.paymentStatus === 'completed') {
            return res.json({ success: true, message: 'Payment already completed', appointment });
        }

        appointment.paymentStatus = 'completed';
        appointment.paymentId = paymentId || '';
        if (paymentDetails) {
            appointment.paymentDetails = paymentDetails;
        }

        // Create local link data safely
        const telemedicineData = generateTelemedicineLink(
            appointmentId,
            appointment.doctorName,
            appointment.patientName
        );

        appointment.telemedicineLink = telemedicineData.telemedicineLink;
        appointment.telemedicineRoomId = telemedicineData.telemedicineRoomId;

        // Sync with telemedicine service
        await createTelemedicineSession(
            appointmentId,
            appointment.doctorName,
            appointment.patientName,
            appointment.date,
            appointment.startTime,
            telemedicineData.telemedicineRoomId,
            telemedicineData.telemedicineLink
        );

        await appointment.save();

        res.json({
            success: true,
            message: 'Payment status updated to completed via webhook',
            appointment
        });
    } catch (error) {
        console.error('Webhook payment success error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update appointment by patient (symptoms, medical history, reports)
// @route   PUT /api/appointments/:id/update
const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { symptoms, medicalHistory } = req.body;

        console.log('📝 Updating appointment:', id);
        console.log('   Symptoms:', symptoms);
        console.log('   Medical History:', medicalHistory);
        console.log('   Files:', req.files?.length || 0);

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check if user is the patient who owns this appointment
        const patientId = req.patient?._id || req.body.patientId;
        if (appointment.patientId.toString() !== patientId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this appointment'
            });
        }

        // Only allow updates for pending appointments
        if (appointment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Can only update pending appointments. Current status: ' + appointment.status
            });
        }

        // Check if appointment date is in the future
        const appointmentDate = new Date(appointment.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (appointmentDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update past appointments'
            });
        }

        // Update fields
        if (symptoms && symptoms.trim()) {
            appointment.symptoms = symptoms.trim();
        }
        if (medicalHistory !== undefined) {
            appointment.medicalHistory = medicalHistory.trim() || '';
        }

        // Handle new file uploads
        if (req.files && req.files.length > 0) {
            const newReports = req.files.map(file => ({
                fileName: file.originalname,
                filePath: file.path,
                uploadDate: new Date()
            }));
            appointment.uploadedReports.push(...newReports);
            console.log(`📎 Added ${newReports.length} new reports`);
        }

        appointment.updatedAt = new Date();
        await appointment.save();

        console.log('✅ Appointment updated successfully:', appointment._id);

        res.json({
            success: true,
            message: 'Appointment updated successfully',
            appointment
        });
    } catch (error) {
        console.error('Update appointment error:', error);
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
    cancelAppointment,
    getUpcomingAppointment,
    checkSlotAvailability,
    webhookPaymentSuccess,
    updateAppointment,
    checkAndCancelExpiredAppointments
};