import type { PriceRule } from "../context/SettingsContext";

export const calculatePrice = (minutes: number, rules: PriceRule[], tolerance: number = 0): number => {
    if (!rules || rules.length === 0) return 0;

    // 0. Apply Tolerance
    const effectiveMinutes = Math.max(0, minutes - tolerance);
    if (effectiveMinutes === 0) return 0;

    // 1. Sort rules descending for greedy approach
    const sortedRulesDesc = [...rules].sort((a, b) => b.minutes - a.minutes);
    const smallestRule = sortedRulesDesc[sortedRulesDesc.length - 1];

    // Helper: Calculate price using Greedy Descent (Sum of Parts)
    const calculateGreedy = (mins: number): number => {
        if (mins <= 0) return 0;

        let remaining = mins;
        let cost = 0;

        for (const rule of sortedRulesDesc) {
            if (remaining >= rule.minutes) {
                const count = Math.floor(remaining / rule.minutes);
                cost += count * rule.price;
                remaining %= rule.minutes;
            }
        }

        // If there's still remainder, charge the smallest unit
        if (remaining > 0) {
            cost += smallestRule.price;
        }

        return cost;
    };

    // 2. Initial calculation
    let finalPrice = calculateGreedy(effectiveMinutes);

    // 3. Optimization: Check "Next Tier"
    // Does a larger rule cost LESS than the greedy calculation of smaller parts?
    for (const rule of sortedRulesDesc) {
        if (rule.minutes >= effectiveMinutes) {
            if (rule.price < finalPrice) {
                finalPrice = rule.price;
            }
        }
    }

    return finalPrice;
};

export const formatCurrency = (amount: number, symbol: string = 'S/') => {
    return `${symbol} ${amount.toFixed(2)}`;
};
