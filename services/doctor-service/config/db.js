const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-service';
        
        await mongoose.connect(mongoURI, {
            // Connection pooling
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            
            // Additional performance options
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log(`✅ MongoDB Connected Successfully`);

        // Legacy index { doctorId: 1, date: 1 } without partial rules breaks bulk weekly inserts
        // (multiple docs with date null). Drop if present; model syncIndexes adds correct partial indexes.
        try {
            const col = mongoose.connection.collection('availabilities');
            const idx = await col.indexes();
            const bad = idx.find((i) => i.name === 'doctorId_1_date_1');
            if (bad) {
                await col.dropIndex('doctorId_1_date_1');
                console.log('🗑️ Dropped legacy index doctorId_1_date_1 on availabilities');
            }
        } catch (e) {
            if (!String(e.message).includes('index not found')) {
                console.warn('Index cleanup (availabilities):', e.message);
            }
        }

        const Availability = require('../models/Availability');
        try {
            await Availability.syncIndexes();
        } catch (e) {
            console.warn('Availability.syncIndexes:', e.message);
        }

        // Monitor connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

    } catch (error) {
        console.error(`\u274c MongoDB Connection Failed: ${error.message}`);
        console.log(`\u26a0\ufe0f Please check your MongoDB connection string and network access`);
        
        // Don't exit in containerized environments - allow service to run without DB
        if (process.env.NODE_ENV !== 'production') {
            console.log('Continuing without database connection for development...');
            return;
        }
        
        // In production, you might want to exit or implement retry logic
        console.log('Service will continue running but database operations will fail');
    }
};

module.exports = connectDB;