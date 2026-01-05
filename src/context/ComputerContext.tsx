import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Computer } from '../types';
import { useSettings } from './SettingsContext';
import { socket } from '../services/socket';

interface ComputerContextType {
    computers: Computer[];
    startSession: (id: string, durationMinutes: number, customerName?: string, price?: number) => void;
    startOpenSession: (id: string, customerName?: string) => void;
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
    const [computers, setComputers] = useState<Computer[]>([]);

    useEffect(() => {
        // Initialize/Sync with server
        // We send the expected count, server handles whether to expand or not
        socket.emit('initialize-computers', pcCount);

        const onUpdate = (data: Computer[]) => {
            setComputers(data);
        };

        socket.on('computers-update', onUpdate);

        return () => {
            socket.off('computers-update', onUpdate);
        };
    }, [pcCount]);

    const startSession = (id: string, durationMinutes: number, customerName?: string, price?: number) => {
        socket.emit('start-session', { id, durationMinutes, customerName, price });
    };

    const startOpenSession = (id: string, customerName?: string) => {
        socket.emit('start-open-session', { id, customerName });
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
        <ComputerContext.Provider value={{ computers, startSession, startOpenSession, stopSession, addTime, toggleMaintenance, moveSession, addExtra, togglePaid }}>
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
