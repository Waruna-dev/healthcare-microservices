require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5018;
const domain = process.env.JITSI_DOMAIN || 'meet.jit.si';
const roomPrefix = process.env.JITSI_ROOM_PREFIX || 'CareSync';

app.use(cors());
app.use(express.json());

const sessions = new Map();

app.post('/api/telemedicine/create', (req, res) => {
    try {
        const { appointmentId, doctorName, patientName, scheduledTime } = req.body;
        const roomId = uuidv4();
        const roomName = `${roomPrefix}_${appointmentId}_${Date.now()}`;
        const jitsiLink = `https://${domain}/${roomName}`;

        sessions.set(appointmentId, {
            roomId,
            roomName,
            jitsiLink,
            doctorName,
            patientName,
            scheduledTime,
            createdAt: new Date(),
            isActive: true
        });

        res.json({ success: true, telemedicineLink: jitsiLink, roomId, roomName });
    } catch (error) {
        console.error('Error creating telemedicine session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/telemedicine/session/:appointmentId', (req, res) => {
    const session = sessions.get(req.params.appointmentId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, session });
});

app.post('/api/telemedicine/end/:appointmentId', (req, res) => {
    const session = sessions.get(req.params.appointmentId);
    if (session) {
        session.isActive = false;
        session.endedAt = new Date();
        sessions.set(req.params.appointmentId, session);
    }
    res.json({ success: true, message: 'Session ended' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'telemedicine-service', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Telemedicine Service running on port ${PORT}`);
    console.log(`📍 Jitsi Meet integration ready at ${domain}`);
});