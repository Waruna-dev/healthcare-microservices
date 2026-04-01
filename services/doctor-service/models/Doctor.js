const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Doctor name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        default: ''  // Make password optional
    },
    specialty: {
        type: String,
        required: [true, 'Specialty is required'],
        trim: true,
        enum: {
            values: [
                'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics',
                'Dermatology', 'Psychiatry', 'Radiology', 'Surgery',
                'Oncology', 'Gynecology', 'Urology', 'Ophthalmology',
                'Emergency Medicine', 'Family Medicine', 'Internal Medicine'
            ],
            message: '{VALUE} is not a valid specialty'
        }
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number']
    },
    licenseNumber: {
        type: String,
        required: [true, 'Medical license number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    experience: {
        type: Number,
        default: 0,
        min: [0, 'Experience cannot be negative'],
        max: [60, 'Experience cannot exceed 60 years']
    },
    consultationFee: {
        type: Number,
        default: 0,
        min: [0, 'Consultation fee cannot be negative']
    },
    address: {
        type: String,
        default: '',
        trim: true,
        maxlength: [500, 'Address cannot exceed 500 characters']
    },
    bio: {
        type: String,
        default: '',
        trim: true,
        maxlength: [1000, 'Bio cannot exceed 1000 characters']
    },
    gender: {
        type: String,
        default: '',
        enum: {
            values: ['', 'male', 'female', 'other'],
            message: '{VALUE} is not a valid gender'
        }
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    profilePicture: {
        type: String,
        default: ''
    },
    qualifications: [{
        degree: String,
        institution: String,
        year: Number
    }],
    workingHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '17:00' }
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create index for better search performance
doctorSchema.index({ name: 'text', specialty: 'text', email: 'text' });

// Method to hide password when sending JSON
doctorSchema.methods.toJSON = function() {
    const doctor = this.toObject();
    delete doctor.password;
    return doctor;
};

// Static method to find doctors by specialty
doctorSchema.statics.findBySpecialty = function(specialty) {
    return this.find({ specialty: specialty, isAvailable: true });
};

// Method to update availability
doctorSchema.methods.toggleAvailability = function() {
    this.isAvailable = !this.isAvailable;
    this.updatedAt = Date.now();
    return this.save();
};

module.exports = mongoose.model('Doctor', doctorSchema);