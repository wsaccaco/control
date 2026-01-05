import { io, Socket } from 'socket.io-client';

// Automatically connect to the same IP as the frontend, but port 3000
const URL = `http://${window.location.hostname}:3000`;

export const socket: Socket = io(URL, {
    autoConnect: true
});
