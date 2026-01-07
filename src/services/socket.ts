import { io, Socket } from 'socket.io-client';

// Use environment variable for API URL in production, fallback to dev logic
const URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

export const socket: Socket = io(URL, {
    autoConnect: true
});
