const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors');
const db = require('./db');

app.use(cors());

// Initialize DB
db.init();

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
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
