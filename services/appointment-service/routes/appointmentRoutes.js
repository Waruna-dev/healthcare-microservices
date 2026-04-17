const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
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
    checkAndCancelExpiredAppointments,
    getCompletionStatus,
    getAllAppointments,
    getReportUrl
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join(__dirname, '../temp');
        if (!require('fs').existsSync(tempDir)) {
            require('fs').mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPEG, PNG are allowed.'));
        }
    }
});

router.get('/check-slot', checkSlotAvailability);

// DEBUG ROUTE - Place this FIRST to ensure it works
router.get('/debug/doctor/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
        console.log('🔍 DEBUG - Fetching for doctorId:', doctorId);
      
        const appointments = await Appointment.find({ 
            doctorId: doctorId.toString() 
        });
        
        const allAppointments = await Appointment.find({}, { doctorId: 1, patientName: 1, status: 1 });
        
        res.json({
            success: true,
            message: 'Debug endpoint',
            requestedDoctorId: doctorId,
            appointmentsFound: appointments.length,
            appointments: appointments,
            allDoctorIdsInDB: allAppointments.map(a => ({ 
                doctorId: a.doctorId, 
                type: typeof a.doctorId,
                patientName: a.patientName,
                status: a.status
            }))
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});


router.get('/doctor/public/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
        console.log('🔍 PUBLIC endpoint - Fetching for doctorId:', doctorId);
        
        const Appointment = require('../models/Appointment');
        let appointments = await Appointment.find({ 
            doctorId: doctorId.toString() 
        }).sort({ date: -1, createdAt: -1 });
        
        appointments = await checkAndCancelExpiredAppointments(appointments);
        
        console.log(`📊 Found ${appointments.length} appointments`);
        
        res.json({
            success: true,
            count: appointments.length,
            appointments: appointments
        });
    } catch (error) {
        console.error('Public doctor appointments error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.post('/', protect, upload.array('reports', 5), createAppointment);

// Patient appointments
router.get('/patient/:patientId', protect, getPatientAppointments);
router.get('/patient/:patientId/upcoming', protect, getUpcomingAppointment);
router.get('/admin/all', protect, getAllAppointments);
router.get('/:id/completion-status', protect, getCompletionStatus);

// Doctor appointments (protected)
router.get('/doctor/:doctorId', protect, getDoctorAppointments);

// Single appointment
router.get('/:id', protect, getAppointmentById);
router.get('/:id/report/:reportId', protect, getReportUrl);

// Update status
router.put('/:id/status', protect, updateAppointmentStatus);

// Payment
router.post('/:id/payment', protect, processPayment);
router.post('/webhook/payment-success', webhookPaymentSuccess);

// Telemedicine
router.get('/:id/telemedicine', protect, getTelemedicineInfo);

// Complete appointment
router.post('/:id/complete', protect, completeAppointment);

// Update appointment (symptoms, history, reports)
router.put('/:id/update', protect, upload.array('reports', 5), updateAppointment);

// Cancel appointment
router.put('/:id/cancel', protect, cancelAppointment);

router.put('/accept/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔓 Public Accept - Appointment ID:', id);
        
        const Appointment = require('../models/Appointment');
        const appointment = await Appointment.findById(id);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.status = 'accepted';
        appointment.updatedAt = new Date();
        await appointment.save();
        
        console.log('✅ Appointment accepted:', appointment._id);
        
        res.json({
            success: true,
            message: 'Appointment accepted successfully',
            appointment: appointment
        });
    } catch (error) {
        console.error('Error accepting appointment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Public Reject endpoint
router.put('/reject/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        
        console.log('🔓 Public Reject - Appointment ID:', id);
        console.log('Reason:', rejectionReason);
        
        const Appointment = require('../models/Appointment');
        const appointment = await Appointment.findById(id);
        
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.status = 'rejected';
        appointment.rejectionReason = rejectionReason || 'No reason provided';
        appointment.updatedAt = new Date();
        await appointment.save();
        
        console.log('✅ Appointment rejected:', appointment._id);
        
        res.json({
            success: true,
            message: 'Appointment rejected',
            appointment: appointment
        });
    } catch (error) {
        console.error('Error rejecting appointment:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
module.exports = router;