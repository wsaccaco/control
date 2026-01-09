require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Auth Configuration
const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-change-this';

app.use(cors());
app.use(express.json());

// Initialize DB
db.init();

// --- Auth Endpoints ---

app.post('/api/register', (req, res) => {
    const { email, password, tenantName } = req.body;
    if (!email || !password || !tenantName) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const user = db.createUser(require('crypto').randomUUID(), email, password, tenantName);
    if (user) {
        res.json({ success: true, message: 'User registered' });
    } else {
        res.status(500).json({ success: false, message: 'Error creating user' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Check against DB
    const user = db.getUserByEmail(email);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check License Status
    if (user.valid_until && Date.now() > user.valid_until && user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Suscripción expirada. Contacte soporte.' });
    }
    if (user.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Cuenta suspendida.' });
    }

    // Issue token valid for 24 hours
    const token = jwt.sign(
        { id: user.id, email: user.email, tenantName: user.tenant_name, role: user.role || 'user' },
        SECRET_KEY,
        { expiresIn: '24h' }
    );
    res.json({
        success: true,
        token,
        user: {
            email: user.email,
            tenantName: user.tenant_name,
            role: user.role,
            status: user.status,
            validUntil: user.valid_until
        }
    });
});

// --- Admin Endpoints ---

const isAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        if (user.role !== 'admin') return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/api/admin/users', isAdmin, (req, res) => {
    const users = db.getAllUsers();
    res.json(users);
});

app.post('/api/admin/activate', isAdmin, (req, res) => {
    const { userId, months } = req.body;
    // Calculate new expiration
    // If user already active/valid, add to existing time? Or from now?
    // Let's simpy add from NOW for simplicity, or if future, add to it.

    // Using DB read to check current validity would be better but for MVP set from Now.
    // actually let's fetch user inside update manually or just pass timestamp.

    const validUntil = Date.now() + (months * 30 * 24 * 60 * 60 * 1000);
    db.updateUserStatus(userId, 'active', validUntil);
    res.json({ success: true, validUntil });
});

app.get('/', (req, res) => {
    res.send('LAN Center Cloud API is running ☁️ 🚀');
});

// --- Socket.io (Real-time features) ---

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Strict Authentication Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return next(new Error("Authentication error: Invalid token"));
        }

        // Verify user exists in DB (handling deleted DB scenario)
        const user = db.getUserById(decoded.id);
        if (!user) {
            return next(new Error("Authentication error: User not found"));
        }

        socket.decoded = decoded; // Contains { id, email, tenantName }
        next();
    });
});

io.on('connection', (socket) => {
    const userId = socket.decoded.id;
    console.log(`User connected: ${socket.decoded.email} (${userId})`);

    // Helper to broadcast only to this user's devices (simulated room)
    // For now, we just emit back to the socket, but in real multi-device, we'd join a room.
    socket.join(userId);
    const emitUpdate = () => {
        io.to(userId).emit('computers-update', db.getComputers(userId));
    };

    // Send initial state
    emitUpdate();

    // -- Event Handlers (Scoped by userId) --

    socket.on('initialize-computers', (count) => {
        db.ensureComputersExist(userId, count);
        emitUpdate();
    });

    socket.on('start-session', ({ id, durationMinutes, customerName, price, startTime }) => {
        db.startSession(userId, id, durationMinutes, customerName, price, startTime);
        emitUpdate();
    });

    socket.on('start-open-session', ({ id, customerName, startTime }) => {
        db.startOpenSession(userId, id, customerName, startTime);
        emitUpdate();
    });

    socket.on('stop-session', ({ id, price }) => {
        db.stopSession(userId, id, price);
        emitUpdate();
    });

    socket.on('add-time', ({ id, minutes, price }) => {
        db.addTime(userId, id, minutes, price);
        emitUpdate();
    });

    socket.on('add-extra', ({ id, name, price }) => {
        db.addExtra(userId, id, name, price);
        emitUpdate();
    });

    socket.on('toggle-paid', ({ id }) => {
        db.togglePaid(userId, id);
        emitUpdate();
    });

    socket.on('toggle-maintenance', ({ id }) => {
        db.toggleMaintenance(userId, id);
        emitUpdate();
    });

    socket.on('move-session', ({ fromId, toId }) => {
        db.moveSession(userId, fromId, toId);
        emitUpdate();
    });

    socket.on('update-session', ({ id, newMode, durationMinutes, price }) => {
        db.updateSession(userId, id, newMode, durationMinutes, price);
        emitUpdate();
    });

    socket.on('update-customer-name', ({ id, name }) => {
        db.updateCustomerName(userId, id, name);
        emitUpdate();
    });

    socket.on('update-computer-zone', ({ id, zoneId }) => {
        db.updateComputerZone(userId, id, zoneId);
        emitUpdate();
    });

    // Settings Handlers
    socket.on('get-settings', (callback) => {
        if (callback) callback(db.getSettings(userId));
    });

    socket.on('update-settings', (newSettings) => {
        db.updateSettings(userId, newSettings);
        io.to(userId).emit('settings-update', db.getSettings(userId));
    });

    socket.on('get-daily-revenue', (callback) => {
        if (callback) callback(db.getDailyRevenue(userId));
    });

    socket.on('get-computer-history', ({ computerId }, callback) => {
        if (callback) callback(db.getComputerHistory(userId, computerId));
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.decoded.email}`);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Cloud Server listening on *:${PORT}`);
});
