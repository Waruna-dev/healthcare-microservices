const Prescription = require('../models/prescriptionmodels');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create a new prescription
// @route   POST /api/prescriptions/create
// @access   Private (Doctor)
const createPrescription = asyncHandler(async (req, res) => {
    const {
        appointmentId,
        patientName,
        patientEmail,
        doctorId,
        doctorName,
        diagnosis,
        symptoms,
        medicines,
        tests,
        lifestyle,
        followUpDate,
        followUpNotes,
        notes,
        attachments
    } = req.body;

    // Validation
    if (!appointmentId || !patientName || !patientEmail || !doctorId || !doctorName || !diagnosis) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields'
        });
    }

    if (!medicines || medicines.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'At least one medicine is required'
        });
    }

    // Validate each medicine
    for (const medicine of medicines) {
        if (!medicine.name || !medicine.dosage || !medicine.frequency || !medicine.duration) {
            return res.status(400).json({
                success: false,
                message: 'All medicines must have name, dosage, frequency, and duration'
            });
        }
    }

    // Check if prescription already exists for this appointment
    const existingPrescription = await Prescription.findOne({ appointmentId });
    if (existingPrescription) {
        return res.status(400).json({
            success: false,
            message: 'A prescription already exists for this appointment'
        });
    }

    // Create prescription
    const prescription = await Prescription.create({
        appointmentId,
        patientName,
        patientEmail,
        doctorId,
        doctorName,
        diagnosis,
        symptoms: symptoms || '',
        medicines,
        tests: tests || [],
        lifestyle: lifestyle || { diet: '', exercise: '', restrictions: [] },
        followUpDate: followUpDate || null,
        followUpNotes: followUpNotes || '',
        notes: notes || '',
        attachments: attachments || []
    });

    res.status(201).json({
        success: true,
        message: 'Prescription created successfully',
        prescription
    });
});

// @desc    Get all prescriptions for a doctor
// @route   GET /api/prescriptions/doctor/:doctorId
// @access   Private (Doctor)
const getDoctorPrescriptions = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { status, page = 1, limit = 10, dateFrom, dateTo } = req.query;

    const options = {
        status,
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        dateFrom,
        dateTo
    };

    const prescriptions = await Prescription.findByDoctor(doctorId, options);
    
    const total = await Prescription.countDocuments({
        doctorId,
        isArchived: false,
        ...(status && { status })
    });

    res.status(200).json({
        success: true,
        count: prescriptions.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        prescriptions
    });
});

// @desc    Get prescription by appointment ID
// @route   GET /api/prescriptions/appointment/:appointmentId
// @access   Private (Doctor/Patient)
const getPrescriptionByAppointment = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;

    const prescription = await Prescription.findOne({ 
        appointmentId,
        isArchived: false 
    }).populate('doctorId', 'name email specialty');

    if (!prescription) {
        return res.status(404).json({
            success: false,
            message: 'Prescription not found'
        });
    }

    res.status(200).json({
        success: true,
        prescription
    });
});

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access   Private (Doctor/Patient)
const getPrescriptionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const prescription = await Prescription.findById(id)
        .populate('doctorId', 'name email specialty phone')
        .populate('appointmentId', 'date startTime endTime');

    if (!prescription) {
        return res.status(404).json({
            success: false,
            message: 'Prescription not found'
        });
    }

    res.status(200).json({
        success: true,
        prescription
    });
});

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access   Private (Doctor)
const updatePrescription = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const prescription = await Prescription.findById(id);

    if (!prescription) {
        return res.status(404).json({
            success: false,
            message: 'Prescription not found'
        });
    }

    // Check if prescription is editable (within 24 hours and active)
    if (!prescription.isEditable()) {
        return res.status(400).json({
            success: false,
            message: 'Prescription cannot be edited after 24 hours or if not active'
        });
    }

    // Validate medicines if provided
    if (updates.medicines && updates.medicines.length > 0) {
        for (const medicine of updates.medicines) {
            if (!medicine.name || !medicine.dosage || !medicine.frequency || !medicine.duration) {
                return res.status(400).json({
                    success: false,
                    message: 'All medicines must have name, dosage, frequency, and duration'
                });
            }
        }
    }

    // Update prescription
    const updatedPrescription = await Prescription.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
    ).populate('doctorId', 'name email specialty');

    res.status(200).json({
        success: true,
        message: 'Prescription updated successfully',
        prescription: updatedPrescription
    });
});

// @desc    Add medicine to prescription
// @route   POST /api/prescriptions/:id/medicines
// @access   Private (Doctor)
const addMedicine = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, type, dosage, frequency, duration, instructions } = req.body;

    if (!name || !dosage || !frequency || !duration) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required medicine fields'
        });
    }

    const prescription = await Prescription.findById(id);

    if (!prescription) {
        return res.status(404).json({
            success: false,
            message: 'Prescription not found'
        });
    }

    if (!prescription.isEditable()) {
        return res.status(400).json({
            success: false,
            message: 'Prescription cannot be edited after 24 hours or if not active'
        });
    }

    await prescription.addMedicine({
        name,
        type: type || 'tablet',
        dosage,
        frequency,
        duration,
        instructions: instructions || ''
    });

    res.status(200).json({
        success: true,
        message: 'Medicine added successfully',
        prescription
    });
});

// @desc    Remove medicine from prescription
// @route   DELETE /api/prescriptions/:id/medicines/:medicineIndex
// @access   Private (Doctor)
const removeMedicine = asyncHandler(async (req, res) => {
    const { id, medicineIndex } = req.params;

    const prescription = await Prescription.findById(id);

    if (!prescription) {
        return res.status(404).json({
            success: false,
            message: 'Prescription not found'
        });
    }

    if (!prescription.isEditable()) {
        return res.status(400).json({
            success: false,
            message: 'Prescription cannot be edited after 24 hours or if not active'
        });
    }

    if (prescription.medicines.length <= 1) {
        return res.status(400).json({
            success: false,
            message: 'Prescription must have at least one medicine'
        });
    }

    await prescription.removeMedicine(parseInt(medicineIndex));

    res.status(200).json({
        success: true,
        message: 'Medicine removed successfully',
        prescription
    });
});

// @desc    Add test to prescription
// @route   POST /api/prescriptions/:id/tests
// @access   Private (Doctor)
const addTest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { test } = req.body;

    if (!test || test.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Test name is required'
        });
    }

    const prescription = await Prescription.findById(id);

    if (!prescription) {
        return res.status(404).json({
            success: false,
            message: 'Prescription not found'
        });
    }

    if (!prescription.isEditable()) {
        return res.status(400).json({
            success: false,
            message: 'Prescription cannot be edited after 24 hours or if not active'
        });
    }

    await prescription.addTest(test.trim());

    res.status(200).json({
        success: true,
        message: 'Test added successfully',
        prescription
    });
});

// @desc    Remove test from prescription
// @route   DELETE /api/prescriptions/:id/tests/:test
// @access   Private (Doctor)
const removeTest = asyncHandler(async (req, res) => {
    const { id, test } = req.params;

    const prescription = await Prescription.findById(id);

    if (!prescription) {
        return res.status(404).json({
            success: false,
            message: 'Prescription not found'
        });
    }

    if (!prescription.isEditable()) {
        return res.status(400).json({
            success: false,
            message: 'Prescription cannot be edited after 24 hours or if not active'
        });
    }

    await prescription.removeTest(test);

    res.status(200).json({
        success: true,
        message: 'Test removed successfully',
        prescription
    });
});

// @desc    Update prescription status
// @route   PATCH /api/prescriptions/:id/status
// @access   Private (Doctor)
const updatePrescriptionStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status'
        });
    }

    const prescription = await Prescription.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    ).populate('doctorId', 'name email specialty');

    if (!prescription) {
        return res.status(404).json({
            success: false,
            message: 'Prescription not found'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Prescription status updated successfully',
        prescription
    });
});

// @desc    Archive prescription
// @route   PATCH /api/prescriptions/:id/archive
// @access   Private (Doctor)
const archivePrescription = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const prescription = await Prescription.findByIdAndUpdate(
        id,
        { isArchived: true },
        { new: true }
    );

    if (!prescription) {
        return res.status(404).json({
            success: false,
            message: 'Prescription not found'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Prescription archived successfully',
        prescription
    });
});

// @desc    Get prescription statistics for a doctor
// @route   GET /api/prescriptions/doctor/:doctorId/stats
// @access   Private (Doctor)
const getPrescriptionStats = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;

    const stats = await Prescription.getStats(doctorId);

    res.status(200).json({
        success: true,
        stats: stats[0] || {
            totalPrescriptions: 0,
            activePrescriptions: 0,
            completedPrescriptions: 0,
            cancelledPrescriptions: 0,
            totalMedicines: 0,
            totalTests: 0,
            avgMedicinesPerPrescription: 0
        }
    });
});

// @desc    Search prescriptions
// @route   GET /api/prescriptions/search
// @access   Private (Doctor)
const searchPrescriptions = asyncHandler(async (req, res) => {
    const { 
        doctorId, 
        patientEmail, 
        query, 
        status, 
        page = 1, 
        limit = 10,
        dateFrom,
        dateTo 
    } = req.query;

    // Build search criteria
    const searchCriteria = {
        isArchived: false
    };

    if (doctorId) searchCriteria.doctorId = doctorId;
    if (patientEmail) searchCriteria.patientEmail = patientEmail;
    if (status) searchCriteria.status = status;

    // Date range filter
    if (dateFrom || dateTo) {
        searchCriteria.prescriptionDate = {};
        if (dateFrom) searchCriteria.prescriptionDate.$gte = new Date(dateFrom);
        if (dateTo) searchCriteria.prescriptionDate.$lte = new Date(dateTo);
    }

    // Text search
    let prescriptions;
    if (query) {
        prescriptions = await Prescription.find({
            $and: [
                searchCriteria,
                {
                    $text: {
                        $search: query
                    }
                }
            ]
        })
        .populate('doctorId', 'name email specialty')
        .sort({ score: { $meta: 'textScore' } })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
    } else {
        prescriptions = await Prescription.find(searchCriteria)
        .populate('doctorId', 'name email specialty')
        .sort({ prescriptionDate: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
    }

    const total = await Prescription.countDocuments(searchCriteria);

    res.status(200).json({
        success: true,
        count: prescriptions.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        prescriptions
    });
});

// @desc    Get patient prescription history
// @route   GET /api/prescriptions/patient/:patientEmail
// @access   Private (Doctor/Patient)
const getPatientPrescriptionHistory = asyncHandler(async (req, res) => {
    const { patientEmail } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const options = {
        status,
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
    };

    const prescriptions = await Prescription.findByPatient(patientEmail, options);

    const total = await Prescription.countDocuments({
        patientEmail,
        isArchived: false,
        ...(status && { status })
    });

    res.status(200).json({
        success: true,
        count: prescriptions.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        prescriptions
    });
});

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access   Private (Doctor)
const deletePrescription = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const prescription = await Prescription.findById(id);

    if (!prescription) {
        return res.status(404).json({
            success: false,
            message: 'Prescription not found'
        });
    }

    // Only allow deletion if prescription is editable
    if (!prescription.isEditable()) {
        return res.status(400).json({
            success: false,
            message: 'Prescription cannot be deleted after 24 hours or if not active'
        });
    }

    await Prescription.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: 'Prescription deleted successfully'
    });
});

module.exports = {
    createPrescription,
    getDoctorPrescriptions,
    getPrescriptionByAppointment,
    getPrescriptionById,
    updatePrescription,
    addMedicine,
    removeMedicine,
    addTest,
    removeTest,
    updatePrescriptionStatus,
    archivePrescription,
    getPrescriptionStats,
    searchPrescriptions,
    getPatientPrescriptionHistory,
    deletePrescription
};