const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors');
const db = require('./db');

const jwt = require('jsonwebtoken');

// Auth Configuration
const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-change-this';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(cors());
app.use(express.json()); // Enable JSON body parsing for login

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        // Issue token valid for 24 hours
        const token = jwt.sign({ role: 'admin' }, SECRET_KEY, { expiresIn: '24h' });
        return res.json({ success: true, token });
    }
    return res.status(401).json({ success: false, message: 'Invalid password' });
});

app.get('/', (req, res) => {
    res.send('LAN Center API is running correctly 🚀');
});

// Initialize DB
db.init();

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Socket Authentication Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return next(new Error("Authentication error: Invalid token"));
        }
        socket.decoded = decoded;
        next();
    });
});

io.on('connection', (socket) => {
    console.log('a user connected');

    // Send current state from DB
    socket.emit('computers-update', db.getComputers());

    socket.on('initialize-computers', (count) => {
        db.ensureComputersExist(count);
        io.emit('computers-update', db.getComputers());
    });

    socket.on('start-session', ({ id, durationMinutes, customerName, price }) => {
        db.startSession(id, durationMinutes, customerName, price);
        io.emit('computers-update', db.getComputers());
    });

    socket.on('start-open-session', ({ id, customerName }) => {
        db.startOpenSession(id, customerName);
        io.emit('computers-update', db.getComputers());
    });

    socket.on('stop-session', ({ id }) => {
        db.stopSession(id);
        io.emit('computers-update', db.getComputers());
    });

    socket.on('add-time', ({ id, minutes, price }) => {
        db.addTime(id, minutes, price);
        io.emit('computers-update', db.getComputers());
    });

    socket.on('add-extra', ({ id, name, price }) => {
        db.addExtra(id, name, price);
        io.emit('computers-update', db.getComputers());
    });

    socket.on('toggle-paid', ({ id }) => {
        db.togglePaid(id);
        io.emit('computers-update', db.getComputers());
    });

    socket.on('toggle-maintenance', ({ id }) => {
        db.toggleMaintenance(id);
        io.emit('computers-update', db.getComputers());
    });

    socket.on('move-session', ({ fromId, toId }) => {
        db.moveSession(fromId, toId);
        io.emit('computers-update', db.getComputers());
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server listening on *:${PORT}`);
});
