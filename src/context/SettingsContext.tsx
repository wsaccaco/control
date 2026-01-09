import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../services/socket';

export interface PriceRule {
    minutes: number;
    price: number;
}

export interface Zone {
    id: string;
    name: string;
    tolerance: number; // in minutes
    rules: PriceRule[];
    isDefault?: boolean;
}

interface SettingsContextType {
    pcCount: number;
    setPcCount: (count: number) => void;

    // New Structure
    zones: Zone[];
    setZones: (zones: Zone[]) => void;
    getZoneById: (zoneId?: string) => Zone;

    // Legacy support (optional, or we refactor consumers)
    // priceRules: PriceRule[]; -> We will remove this to force refactor

    currencySymbol: string;
    viewMode: 'remaining' | 'elapsed';
    toggleViewMode: () => void;
    generalSettings: { lan_center_name?: string, currency_symbol?: string, pricing_strategy?: 'cumulative' | 'recalculate' };
    updateGeneralSettings: (settings: { lan_center_name: string, currency_symbol: string, zones?: Zone[], pricing_strategy?: 'cumulative' | 'recalculate' }) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY_SETTINGS = 'lan_center_settings';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load initial settings
    const getInitialSettings = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        }
        return {};
    };

    const initialSettings = getInitialSettings();

    const [pcCount, setPcCountState] = useState<number>(initialSettings.pcCount || 0);

    // Initial Zones
    const defaultZone: Zone = {
        id: 'default',
        name: 'General',
        tolerance: 5,
        rules: initialSettings.priceRules || [
            { minutes: 15, price: 0.50 },
            { minutes: 30, price: 1.00 },
            { minutes: 60, price: 1.50 },
        ],
        isDefault: true
    };

    const [zones, setZones] = useState<Zone[]>(initialSettings.zones || [defaultZone]);

    const [viewMode, setViewMode] = useState<'remaining' | 'elapsed'>(initialSettings.viewMode || 'remaining');
    const [generalSettings, setGeneralSettings] = useState<any>({});

    // Import socket only if not imported at top, or assume it's available via global or import
    // Ideally we should import it at the top. 
    // For now, I will add the effect logic assuming socket is imported or available.

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ pcCount, zones, viewMode }));
    }, [pcCount, zones, viewMode]);

    const setPcCount = (count: number) => {
        setPcCountState(count);
    };

    const toggleViewMode = () => {
        setViewMode(prev => prev === 'remaining' ? 'elapsed' : 'remaining');
    };

    useEffect(() => {
        // Load initial settings
        socket.emit('get-settings', (settings: any) => {
            if (settings) {
                setGeneralSettings(settings);
                // Also load persisted zones if available in server settings
                if (settings.zones) {
                    try {
                        setZones(JSON.parse(settings.zones));
                    } catch (e) { console.error("Error parsing zones from server", e); }
                }
                if (settings.pcCount) setPcCountState(Number(settings.pcCount));
            }
        });
        socket.on('settings-update', (settings: any) => {
            setGeneralSettings(settings);
            if (settings.zones) {
                try {
                    setZones(JSON.parse(settings.zones));
                } catch (e) { console.error("Error parsing zones from server", e); }
            }
            if (settings.pcCount) setPcCountState(Number(settings.pcCount));
        });

        return () => {
            socket.off('settings-update');
        };
    }, []);

    const updateGeneralSettings = (settings: { lan_center_name: string, currency_symbol: string, zones?: Zone[], pricing_strategy?: 'cumulative' | 'recalculate' }) => {
        socket.emit('update-settings', {
            ...settings,
            zones: JSON.stringify(settings.zones || zones), // Use passed zones or current state
            pcCount: pcCount
        });
    };

    // Keep zones synced when calling update (this is a bit circular, ideally we use explicit save)
    // For now, let's assume SettingsPage calls updateGeneralSettings to save everything.

    const getZoneById = (zoneId?: string) => {
        if (!zoneId) return zones.find(z => z.isDefault) || zones[0];
        return zones.find(z => z.id === zoneId) || zones.find(z => z.isDefault) || zones[0];
    };

    return (
        <SettingsContext.Provider value={{
            pcCount,
            setPcCount,
            zones,
            setZones,
            getZoneById,
            currencySymbol: generalSettings.currency_symbol || 'S/',
            viewMode,
            toggleViewMode,
            generalSettings,
            updateGeneralSettings
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
