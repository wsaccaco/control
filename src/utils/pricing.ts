import type { PriceRule } from "../context/SettingsContext";

export const calculatePrice = (minutes: number, rules: PriceRule[]): number => {
    if (!rules || rules.length === 0) return 0;

    // Sort rules by minutes descending to find the largest fitting chunk first?
    // User requested: "if 15 in 15 it should sum 0.5 + 0.5"
    // Requirement implies we should fit chunks. 
    // Usually, the best match for exact time is preferred, else linear extrapolation or chunking.

    // Simple approach v1: Find exact match. If not, fallback to per-minute rate based on 15min lowest rule?
    // Let's implement a "Best Fit" sum.
    // e.g. 45 min. Rules: 15->0.5, 30->1.0. 
    // Could be 30+15 = 1.5.

    // For "Open Mode", we recalculate every minute.

    // Let's optimize for: Explicit rules first.
    const exactMatch = rules.find(r => r.minutes === minutes);
    if (exactMatch) return exactMatch.price;

    // If no exact match (e.g. 7 minutes, or 45 minutes if 45 rule doesn't exist).
    // User said: "15min is 0.50... But if adds 15 in 15 it should sum 0.5 + 0.5"
    // This implies linear pricing based on the smallest unit usually.

    // Sort rules by duration ascending
    const sortedRules = [...rules].sort((a, b) => a.minutes - b.minutes);
    const baseRule = sortedRules[0]; // e.g., 15 min for 0.50

    if (!baseRule) return 0;

    // Calculate how many base units fit approx
    // e.g. 20 mins. Base 15min. 
    // Is 20 min = 15min + 5min? 
    // Standard cyber cafe logic: Charge next block immediately. 
    // 1-15 min = 0.50. 16-30 min = 1.00.

    // Let's assume block billing.
    const blocks = Math.ceil(minutes / baseRule.minutes);
    return blocks * baseRule.price;
};

export const formatCurrency = (amount: number, symbol: string = 'S/') => {
    return `${symbol} ${amount.toFixed(2)}`;
};
