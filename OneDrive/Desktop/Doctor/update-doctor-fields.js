const mongoose = require('mongoose');
const Doctor = require('./services/doctor-service/models/Doctor');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/doctor-service', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    
    // Update the existing doctor with new fields
    Doctor.findByIdAndUpdate(
        '69cde9e48bbe20330fb73cf9', // The doctor ID from your data
        {
            about: 'Experienced Gynecologist specializing in maternal health and high-risk pregnancies. Committed to providing compassionate care using evidence-based practices and modern medical technology.',
            qualifications: ['MBBS', 'MS Gyno', 'Fellowship in Reproductive Medicine'],
            specializations: ['Maternal Health', 'High-Risk Pregnancy', 'Laparoscopic Surgery'],
            updatedAt: new Date()
        },
        { new: true, runValidators: true }
    ).then(doctor => {
        if (doctor) {
            console.log('✅ Doctor updated successfully!');
            console.log('About:', doctor.about);
            console.log('Qualifications:', doctor.qualifications);
            console.log('Specializations:', doctor.specializations);
        } else {
            console.log('❌ Doctor not found');
        }
    }).catch(error => {
        console.error('Update error:', error);
    }).finally(() => {
        mongoose.connection.close();
    });
}).catch(error => {
    console.error('Database connection error:', error);
});
