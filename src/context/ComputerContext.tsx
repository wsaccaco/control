import React, { createContext, useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { Computer } from '../types';
import { useSettings } from './SettingsContext';

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

const STORAGE_KEY = 'lan_center_computers';

export const ComputerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { pcCount } = useSettings();
    const [computers, setComputers] = useState<Computer[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        // Initialize empty, we act on pcCount effect
        return saved ? JSON.parse(saved) : [];
    });

    // Sync computers with pcCount
    useEffect(() => {
        setComputers(prev => {
            if (prev.length === pcCount) return prev;

            const newComputers = [...prev];
            if (pcCount > prev.length) {
                // Add new PCs
                for (let i = prev.length; i < pcCount; i++) {
                    newComputers.push({
                        id: String(i + 1),
                        name: `PC-${String(i + 1).padStart(2, '0')}`,
                        status: 'available',
                    });
                }
            } else {
                // Remove PCs (only if available? for now just slice)
                // Ideally warn if removing active PCs, but strictly resizing for now.
                return newComputers.slice(0, pcCount);
            }
            return newComputers;
        });
    }, [pcCount]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(computers));
    }, [computers]);

    // Periodic check for expired sessions could be added here, 
    // but usually it's better to check on render or via a hook in components.
    // However, auto-updating status to 'available' when time runs out might be desired.
    // For now, we'll keep it simple: the time runs out, but status stays 'occupied' 
    // until operator manually stops it, OR clear visual indication of 00:00.
    // Let's implement visual indicators instead of auto-status change to avoid accidental data loss.

    const startSession = (id: string, durationMinutes: number, customerName?: string, price?: number) => {
        setComputers(prev => prev.map(pc => {
            if (pc.id !== id) return pc;
            const now = dayjs();
            return {
                ...pc,
                status: 'occupied',
                mode: 'fixed',
                startTime: now.valueOf(),
                endTime: now.add(durationMinutes, 'minute').valueOf(),
                customerName: customerName || 'Cliente',
                extras: [],
                isPaid: false, // Default to not paid
                history: [{
                    type: 'start',
                    minutes: durationMinutes,
                    price: price || 0,
                    time: now.valueOf(),
                    description: `Inicio (${durationMinutes} min)`
                }]
            };
        }));
    };

    const startOpenSession = (id: string, customerName?: string) => {
        setComputers(prev => prev.map(pc => {
            if (pc.id !== id) return pc;
            const now = dayjs();
            return {
                ...pc,
                status: 'occupied',
                mode: 'open',
                startTime: now.valueOf(),
                endTime: undefined, // No end time
                customerName: customerName || 'Cliente',
                extras: [],
                isPaid: false,
                history: [{
                    type: 'open',
                    time: now.valueOf(),
                    description: 'Inicio Libre',
                    price: 0
                }]
            };
        }));
    };
    const stopSession = (id: string) => {
        setComputers(prev => prev.map(pc => {
            if (pc.id !== id) return pc;
            return {
                ...pc,
                status: 'available',
                startTime: undefined,
                endTime: undefined,
                mode: undefined,
            };
        }));
    };

    const addTime = (id: string, minutes: number, price?: number) => {
        setComputers(prev => prev.map(pc => {
            if (pc.id !== id) return pc;
            if (!pc.endTime) return pc; // Cannot add time to non-running session

            const now = dayjs();
            return {
                ...pc,
                endTime: dayjs(pc.endTime).add(minutes, 'minute').valueOf(),
                history: [...(pc.history || []), {
                    type: 'add',
                    minutes: minutes,
                    price: price || 0,
                    time: now.valueOf(),
                    description: `Aumentó ${minutes} min`
                }]
            };
        }));
    };

    const addExtra = (id: string, name: string, price: number) => {
        setComputers(prev => prev.map(pc => {
            if (pc.id !== id) return pc;

            const newExtra = {
                id: Math.random().toString(36).substr(2, 9),
                name,
                price,
                time: dayjs().valueOf()
            };

            return {
                ...pc,
                extras: [...(pc.extras || []), newExtra],
                history: [...(pc.history || []), {
                    type: 'extra',
                    price: price,
                    time: dayjs().valueOf(),
                    description: `Extra: ${name}`
                }]
            };
        }));
    };

    const togglePaid = (id: string) => {
        setComputers(prev => prev.map(pc => {
            if (pc.id !== id) return pc;
            return { ...pc, isPaid: !pc.isPaid };
        }));
    };

    const toggleMaintenance = (id: string) => {
        setComputers(prev => prev.map(pc => {
            if (pc.id !== id) return pc;
            return {
                ...pc,
                status: pc.status === 'maintenance' ? 'available' : 'maintenance',
                // Clear times if entering maintenance
                startTime: pc.status === 'maintenance' ? undefined : undefined,
                endTime: pc.status === 'maintenance' ? undefined : undefined,
                mode: pc.status === 'maintenance' ? undefined : undefined,
            };
        }));
    };

    const moveSession = (fromId: string, toId: string) => {
        setComputers(prev => {
            const fromPc = prev.find(p => p.id === fromId);
            const toPc = prev.find(p => p.id === toId);

            if (!fromPc || !toPc) return prev;
            // Explicitly allow move only if target is available
            if (toPc.status !== 'available') {
                return prev;
            }

            return prev.map(pc => {
                if (pc.id === fromId) {
                    // Reset source
                    return {
                        ...pc,
                        status: 'available',
                        startTime: undefined,
                        endTime: undefined,
                        mode: undefined,
                    };
                }
                if (pc.id === toId) {
                    // Transfer to target
                    return {
                        ...pc,
                        status: fromPc.status,
                        mode: fromPc.mode,
                        startTime: fromPc.startTime,
                        endTime: fromPc.endTime,
                    };
                }
                return pc;
            });
        });
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
