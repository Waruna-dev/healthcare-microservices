const http = require('http');

const data = JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
    password: "test123",
    specialty: "Cardiology",
    phone: "1234567890",
    licenseNumber: "LIC123",
    experience: 5,
    consultationFee: 150,
    address: "123 Hospital St",
    bio: "Test doctor"
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/doctors/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', body);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
