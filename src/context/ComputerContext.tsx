import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Computer } from '../types';
// import { useAuth } from './AuthContext';

import { useSettings } from './SettingsContext';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

interface ComputerContextType {
    computers: Computer[];
    startSession: (id: string, durationMinutes: number, customerName?: string, price?: number, startTime?: number) => void;
    startOpenSession: (id: string, customerName?: string, startTime?: number) => void;
    updateSession: (id: string, newMode: 'fixed' | 'open', durationMinutes?: number, price?: number) => void;
    updateCustomerName: (id: string, name: string) => void;
    stopSession: (id: string) => void;
    addTime: (id: string, minutes: number, price?: number) => void;
    toggleMaintenance: (id: string) => void;
    moveSession: (fromId: string, toId: string) => void;
    addExtra: (id: string, name: string, price: number) => void;
    togglePaid: (id: string) => void;
}

const ComputerContext = createContext<ComputerContextType | undefined>(undefined);

export const ComputerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { pcCount } = useSettings();
    // const { token } = useAuth(); // Deprecated
    const [computers, setComputers] = useState<Computer[]>([]);

    useEffect(() => {
        // Connect to socket
        connectSocket();

        const onConnect = () => {
            console.log('Socket Connected!', socket.id);
            if (pcCount > 0) {
                socket.emit('initialize-computers', pcCount);
            }
        };

        const onConnectError = (err: Error) => {
            console.error('Socket Connection Error:', err.message);
        };

        const onUpdate = (data: Computer[]) => {
            console.log('Received computers update:', data.length);
            setComputers(data);
        };

        socket.on('connect', onConnect);
        socket.on('connect_error', onConnectError);
        socket.on('computers-update', onUpdate);

        // If already connected (e.g. re-render), request data immediately
        if (socket.connected) {
            onConnect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('connect_error', onConnectError);
            socket.off('computers-update', onUpdate);
            disconnectSocket();
        };
    }, [pcCount]); // Removed token dependency

    const startSession = (id: string, durationMinutes: number, customerName?: string, price?: number, startTime?: number) => {
        socket.emit('start-session', { id, durationMinutes, customerName, price, startTime });
    };

    const startOpenSession = (id: string, customerName?: string, startTime?: number) => {
        socket.emit('start-open-session', { id, customerName, startTime });
    };

    const updateSession = (id: string, newMode: 'fixed' | 'open', durationMinutes?: number, price?: number) => {
        socket.emit('update-session', { id, newMode, durationMinutes, price });
    };

    const updateCustomerName = (id: string, name: string) => {
        socket.emit('update-customer-name', { id, name });
    };

    const stopSession = (id: string) => {
        socket.emit('stop-session', { id });
    };

    const addTime = (id: string, minutes: number, price?: number) => {
        socket.emit('add-time', { id, minutes, price });
    };

    const addExtra = (id: string, name: string, price: number) => {
        socket.emit('add-extra', { id, name, price });
    };

    const togglePaid = (id: string) => {
        socket.emit('toggle-paid', { id });
    };

    const toggleMaintenance = (id: string) => {
        socket.emit('toggle-maintenance', { id });
    };

    const moveSession = (fromId: string, toId: string) => {
        socket.emit('move-session', { fromId, toId });
    };

    return (
        <ComputerContext.Provider value={{ computers, startSession, startOpenSession, stopSession, addTime, toggleMaintenance, moveSession, addExtra, togglePaid, updateSession, updateCustomerName }}>
            {children}
        </ComputerContext.Provider>
    );
};

export const useComputers = () => {
    const context = useContext(ComputerContext);
    if (!context) {
        throw new Error('useComputers must be used within a ComputerProvider');
    }
    return context;
};
