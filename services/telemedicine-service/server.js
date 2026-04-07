const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5018;

app.use(cors());
app.use(express.json());

// Store active telemedicine sessions
const sessions = new Map();

// Create telemedicine session
app.post('/api/telemedicine/create', (req, res) => {
    try {
        const { appointmentId, doctorName, patientName, scheduledTime } = req.body;
        
        // Generate unique room ID
        const roomId = `caresync_${appointmentId}_${Date.now()}`;
        const roomName = `CareSync_${appointmentId}`;
        
        // Jitsi Meet configuration
        const domain = 'meet.jit.si';
        const jitsiLink = `https://${domain}/${roomName}`;
        
        // Store session
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
        
        res.json({
            success: true,
            telemedicineLink: jitsiLink,
            roomId: roomId,
            roomName: roomName
        });
    } catch (error) {
        console.error('Error creating telemedicine session:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get session info
app.get('/api/telemedicine/session/:appointmentId', (req, res) => {
    const { appointmentId } = req.params;
    const session = sessions.get(appointmentId);
    
    if (!session) {
        return res.status(404).json({
            success: false,
            message: 'Session not found'
        });
    }
    
    res.json({
        success: true,
        session
    });
});

// End session
app.post('/api/telemedicine/end/:appointmentId', (req, res) => {
    const { appointmentId } = req.params;
    const session = sessions.get(appointmentId);
    
    if (session) {
        session.isActive = false;
        session.endedAt = new Date();
        sessions.set(appointmentId, session);
    }
    
    res.json({
        success: true,
        message: 'Session ended'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'telemedicine-service',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Telemedicine Service running on port ${PORT}`);
    console.log(`📍 Jitsi Meet integration ready`);
});