const Appointment = require('../models/Appointment');
const axios = require('axios');

// Generate telemedicine link with Jitsi
const generateTelemedicineLink = (appointmentId) => {
  const roomName = `healthcare_${appointmentId}_${Date.now()}`;
  return `https://meet.jit.si/${roomName}`;
};

// @desc    Get available slots from doctor service
// @route   GET /api/appointments/available-slots
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.query;
    
    let url = `${process.env.DOCTOR_SERVICE_URL}/api/doctors/availability/doctor/${doctorId}`;
    
    const response = await axios.get(url);
    let availability = response.data.availability || [];
    
    // Filter only active availability
    availability = availability.filter(slot => slot.isActive === true);
    
    res.json({
      success: true,
      count: availability.length,
      availability
    });
    
  } catch (error) {
    console.error('Error fetching slots:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching available slots' 
    });
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @desc    Create new appointment
// @route   POST /api/appointments
// @desc    Create new appointment
// @route   POST /api/appointments
const createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      doctorName,
      doctorSpecialty,
      consultationFee,
      availabilityId,
      patientId,
      patientName,
      patientEmail,
      patientContact,
      date,
      timeSlot,
      reason,
      additionalNotes,
      symptoms,
      status,
      paymentStatus
    } = req.body;
    
    console.log('Received appointment data:', req.body);
    
    // Create appointment
    const appointment = await Appointment.create({
      patientId: patientId,
      patientName: patientName || 'Patient',
      patientEmail: patientEmail || 'patient@example.com',
      patientContact: patientContact,
      doctorId: doctorId,
      doctorName: doctorName,
      doctorSpecialty: doctorSpecialty,
      consultationFee: consultationFee || 1500,
      availabilityId: availabilityId,
      date: new Date(date),
      timeSlot: {
        start: timeSlot.start,
        end: timeSlot.end
      },
      reason: reason,
      additionalNotes: additionalNotes || '',
      symptoms: symptoms || '',
      status: status || 'pending',
      paymentStatus: paymentStatus || 'pending'
    });
    
    res.status(201).json({
      success: true,
      appointment,
      message: 'Appointment created successfully'
    });
    
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get all appointments
// @route   GET /api/appointments
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient appointments
// @route   GET /api/appointments/patient/:patientId
const getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const appointments = await Appointment.find({ patientId }).sort({ createdAt: -1 });
    res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor appointments
// @route   GET /api/appointments/doctor/:doctorId
const getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const appointments = await Appointment.find({ doctorId }).sort({ createdAt: -1 });
    res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status (accept/reject)
// @route   PUT /api/appointments/:id/status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    appointment.status = status;
    if (notes) appointment.consultationNotes = notes;
    appointment.updatedAt = Date.now();
    
    if (status === 'accepted') {
      const telemedicineLink = generateTelemedicineLink(appointment._id);
      appointment.telemedicineLink = telemedicineLink;
    }
    
    await appointment.save();
    
    res.json({ success: true, appointment, message: `Appointment ${status} successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process payment
// @route   POST /api/appointments/:id/payment
const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (appointment.status !== 'accepted') {
      return res.status(400).json({ message: 'Appointment must be accepted before payment' });
    }
    
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment already processed' });
    }
    
    // Mock payment processing
    appointment.paymentStatus = 'paid';
    appointment.paymentId = `PAY_${Date.now()}`;
    appointment.paymentDate = new Date();
    await appointment.save();
    
    res.json({
      success: true,
      appointment,
      telemedicineLink: appointment.telemedicineLink,
      message: 'Payment processed successfully'
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAvailableSlots,
  createAppointment,
  getAllAppointments,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  processPayment,
  cancelAppointment
};