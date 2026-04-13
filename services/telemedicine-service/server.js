require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5018;
const domain = process.env.JITSI_DOMAIN || 'meet.jit.si';
const roomPrefix = process.env.JITSI_ROOM_PREFIX || 'CareSync';

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000', 'http://localhost:5175'],
    credentials: true
}));
app.use(express.json());

const sessions = new Map();

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'telemedicine-service', 
        timestamp: new Date().toISOString(),
        activeSessions: sessions.size
    });
});

// Create telemedicine session
app.post('/api/telemedicine/create', (req, res) => {
    try {
        const { appointmentId, doctorName, patientName, scheduledDate, scheduledTime } = req.body;
        const roomId = uuidv4();
        const roomName = `${roomPrefix}_${appointmentId}`;
        const jitsiLink = `https://${domain}/${roomName}`;

        sessions.set(appointmentId, {
            roomId,
            roomName,
            jitsiLink,
            doctorName,
            patientName,
            scheduledDate,
            scheduledTime,
            createdAt: new Date(),
            isActive: true,
            status: 'scheduled',
            participants: {
                doctor: false,
                patient: false
            }
        });

        console.log(`✅ Created telemedicine session for appointment: ${appointmentId}`);
        console.log(`🔗 Meeting link: ${jitsiLink}`);

        res.json({ success: true, telemedicineLink: jitsiLink, roomId, roomName });
    } catch (error) {
        console.error('Error creating telemedicine session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get session info (with participants)
app.get('/api/telemedicine/session/:appointmentId', (req, res) => {
    const session = sessions.get(req.params.appointmentId);
    if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.json({ success: true, session });
});

// Mark participant as joined (called by frontend when user joins Jitsi)
app.post('/api/telemedicine/join/:appointmentId', (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { userType, userName } = req.body;
        
        let session = sessions.get(appointmentId);
        if (!session) {
            // Create session if it doesn't exist
            session = {
                appointmentId,
                participants: { doctor: false, patient: false },
                createdAt: new Date(),
                status: 'scheduled'
            };
            sessions.set(appointmentId, session);
        }
        
        if (userType === 'doctor') {
            session.participants.doctor = true;
            session.doctorName = userName;
            console.log(`🩺 Doctor joined session for appointment ${appointmentId}`);
        } else if (userType === 'patient') {
            session.participants.patient = true;
            session.patientName = userName;
            console.log(`👤 Patient joined session for appointment ${appointmentId}`);
        }
        
        if (session.status === 'scheduled' && (session.participants.doctor || session.participants.patient)) {
            session.status = 'active';
        }
        
        sessions.set(appointmentId, session);
        
        console.log(`📊 Participants: Doctor=${session.participants.doctor}, Patient=${session.participants.patient}`);
        
        res.json({ 
            success: true, 
            message: `${userType} joined successfully`,
            participants: session.participants 
        });
    } catch (error) {
        console.error('Error marking join:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


app.get('/api/telemedicine/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'telemedicine-service',
        timestamp: new Date().toISOString(),
        activeSessions: sessions.size
    });
});

// End session
app.post('/api/telemedicine/end/:appointmentId', (req, res) => {
    const session = sessions.get(req.params.appointmentId);
    if (session) {
        session.isActive = false;
        session.status = 'ended';
        session.endedAt = new Date();
        sessions.set(req.params.appointmentId, session);
        console.log(`🔚 Session ended for appointment: ${req.params.appointmentId}`);
    }
    res.json({ success: true, message: 'Session ended' });
});

// Clean up old sessions (every hour)
setInterval(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [key, session] of sessions.entries()) {
        if (session.createdAt && session.createdAt.getTime() < oneHourAgo) {
            sessions.delete(key);
            console.log(`🧹 Cleaned up old session: ${key}`);
        }
    }
}, 60 * 60 * 1000);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'CareSync Telemedicine Service',
        status: 'running',
        activeSessions: sessions.size,
        endpoints: {
            create: 'POST /api/telemedicine/create',
            session: 'GET /api/telemedicine/session/:appointmentId',
            join: 'POST /api/telemedicine/join/:appointmentId',
            end: 'POST /api/telemedicine/end/:appointmentId'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Telemedicine Service running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 Jitsi Meet integration ready at ${domain}`);
});