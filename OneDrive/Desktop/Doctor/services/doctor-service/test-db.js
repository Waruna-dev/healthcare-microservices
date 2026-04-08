const mongoose = require('mongoose');

async function testConnection() {
    try {
        console.log('Testing MongoDB connection...');
        await mongoose.connect('mongodb://localhost:27017/test', {
            serverSelectionTimeoutMS: 3000,
        });
        console.log('✅ MongoDB connection successful!');
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('\n💡 Solutions:');
        console.log('1. Make sure MongoDB is installed and running');
        console.log('2. Check if MongoDB service is started');
        console.log('3. Verify MongoDB is listening on localhost:27017');
        console.log('4. Try running: mongod --dbpath /path/to/your/db');
    }
}

testConnection();
