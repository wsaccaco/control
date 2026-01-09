export type ComputerStatus = 'available' | 'occupied' | 'maintenance';

export interface Computer {
    id: string;
    name: string;
    status: ComputerStatus;
    mode?: 'fixed' | 'open';
    startTime?: number; // timestamp in ms
    endTime?: number;   // timestamp in ms
    notes?: string;
    customerName?: string;
    price?: number;
    extras?: {
        id: string;
        name: string;
        price: number;
        time: number;
    }[];
    history?: {
        type: 'start' | 'add' | 'open' | 'extra';
        minutes?: number; // duration if applicable
        price?: number;
        time: number; // timestamp of action
        description?: string; // e.g., "Soda", "Start 1h"
    }[];
    isPaid?: boolean;
    zoneId?: string;
}

export interface Promotion {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
}
