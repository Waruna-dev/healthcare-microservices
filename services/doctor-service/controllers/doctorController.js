// @desc    Get my own availability (Doctor)
// @route   GET /api/doctors/availability/my
const getMyAvailability = async (req, res) => {
    try {
        // TEMPORARILY USE A FIXED DOCTOR ID FOR TESTING
        // const doctorId = req.user.id;
        const doctorId = "65f8a1b2c3d4e5f6a7b8c9d0"; // ← Use a valid doctor ID from your DB
        
        const availability = await Availability.find({ doctorId }).sort({ dayOfWeek: 1, startTime: 1 });

        res.json({
            success: true,
            count: availability.length,
            availability
        });
    } catch (error) {
        console.error('Get my availability error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};