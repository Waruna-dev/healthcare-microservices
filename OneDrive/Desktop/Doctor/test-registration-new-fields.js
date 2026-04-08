const fetch = require('node-fetch');

// Test data with new fields
const testData = new FormData();
testData.append('name', 'Dr. Test Doctor');
testData.append('email', 'testdoctor@example.com');
testData.append('password', 'test123!@#');
testData.append('specialty', 'Gynecology');
testData.append('phone', '0912345678');
testData.append('licenseNumber', 'TEST123');
testData.append('experience', '5');
testData.append('consultationFee', '2000');
testData.append('address', 'Test Hospital, Colombo');
testData.append('about', 'Test about section - This is a detailed description about the doctor approach to patient care and medical expertise.');
testData.append('gender', 'male');
testData.append('qualifications', JSON.stringify(['MBBS', 'MS Gyno', 'Fellowship in Reproductive Medicine']));
testData.append('specializations', JSON.stringify(['Maternal Health', 'High-Risk Pregnancy', 'Laparoscopic Surgery']));

console.log('Testing doctor registration with new fields...');

fetch('http://localhost:5025/api/doctors/register', {
    method: 'POST',
    body: testData
})
.then(response => response.json())
.then(data => {
    console.log('Response:', data);
    
    if (data.success) {
        console.log('✅ Registration successful!');
        console.log('Doctor ID:', data.doctor._id);
        console.log('About field:', data.doctor.about);
        console.log('Qualifications:', data.doctor.qualifications);
        console.log('Specializations:', data.doctor.specializations);
    } else {
        console.log('❌ Registration failed:', data.message);
    }
})
.catch(error => {
    console.error('Error:', error);
});
