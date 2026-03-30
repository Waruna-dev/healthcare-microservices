const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected Successfully`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Failed: ${error.message}`);
        console.log(`⚠️ Please check your MongoDB connection string and network access`);
        process.exit(1);
    }
};

module.exports = connectDB;