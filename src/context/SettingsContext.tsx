import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../services/socket';

export interface PriceRule {
    minutes: number;
    price: number;
}

interface SettingsContextType {
    pcCount: number;
    setPcCount: (count: number) => void;
    priceRules: PriceRule[];
    setPriceRules: (rules: PriceRule[]) => void;
    currencySymbol: string;
    viewMode: 'remaining' | 'elapsed';
    toggleViewMode: () => void;
    generalSettings: { lan_center_name?: string, currency_symbol?: string };
    updateGeneralSettings: (settings: { lan_center_name: string, currency_symbol: string }) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY_SETTINGS = 'lan_center_settings';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load initial settings from localStorage if available
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
    const [priceRules, setPriceRulesState] = useState<PriceRule[]>(initialSettings.priceRules || [
        { minutes: 15, price: 0.50 },
        { minutes: 30, price: 1.00 },
        { minutes: 60, price: 1.50 },
    ]);

    const [viewMode, setViewMode] = useState<'remaining' | 'elapsed'>(initialSettings.viewMode || 'remaining');
    const [generalSettings, setGeneralSettings] = useState<any>({});

    // Import socket only if not imported at top, or assume it's available via global or import
    // Ideally we should import it at the top. 
    // For now, I will add the effect logic assuming socket is imported or available.

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ pcCount, priceRules, viewMode }));
    }, [pcCount, priceRules, viewMode]);

    const setPcCount = (count: number) => {
        setPcCountState(count);
    };

    const setPriceRules = (rules: PriceRule[]) => {
        setPriceRulesState(rules);
    };

    const toggleViewMode = () => {
        setViewMode(prev => prev === 'remaining' ? 'elapsed' : 'remaining');
    };

    useEffect(() => {
        // Load initial settings
        socket.emit('get-settings', (settings: any) => {
            if (settings) setGeneralSettings(settings);
        });
        socket.on('settings-update', (settings: any) => {
            setGeneralSettings(settings);
        });

        return () => {
            socket.off('settings-update');
        };
    }, []);

    const updateGeneralSettings = (settings: { lan_center_name: string, currency_symbol: string }) => {
        socket.emit('update-settings', settings);
        // Optimistically update local state if needed, but socket listener handles it
    };

    return (
        <SettingsContext.Provider value={{
            pcCount,
            setPcCount,
            priceRules,
            setPriceRules,
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
