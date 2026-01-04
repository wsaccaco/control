import React, { createContext, useContext, useEffect, useState } from 'react';

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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY_SETTINGS = 'lan_center_settings';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pcCount, setPcCountState] = useState<number>(10);
    const [priceRules, setPriceRulesState] = useState<PriceRule[]>([
        { minutes: 15, price: 0.50 },
        { minutes: 30, price: 1.00 },
        { minutes: 60, price: 1.50 },
    ]);
    const [currencySymbol] = useState('S/');
    const [viewMode, setViewMode] = useState<'remaining' | 'elapsed'>('remaining');

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.pcCount) setPcCountState(parsed.pcCount);
                if (parsed.priceRules) setPriceRulesState(parsed.priceRules);
                if (parsed.viewMode) setViewMode(parsed.viewMode);
            } catch (e) {
                console.error("Failed to load settings", e);
            }
        }
    }, []);

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

    return (
        <SettingsContext.Provider value={{ pcCount, setPcCount, priceRules, setPriceRules, currencySymbol, viewMode, toggleViewMode }}>
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
