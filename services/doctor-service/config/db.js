const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
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
    } catch (error) {
        console.error(`❌ MongoDB Connection Failed: ${error.message}`);
        console.log(`⚠️ Please check your MongoDB connection string and network access`);
        process.exit(1);
    }
};

module.exports = connectDB;