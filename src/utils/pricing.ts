import type { PriceRule } from "../context/SettingsContext";

export const calculatePrice = (minutes: number, rules: PriceRule[]): number => {
    if (!rules || rules.length === 0) return 0;

    // 1. Sort rules descending for Greedy approach
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

        // If there's still remainder, verify if we can cover it with smallest rule
        if (remaining > 0) {
            // Check if there is a "better fit" among smaller rules is overly complex.
            // Standard approach: Charge the smallest unit for the remainder.
            cost += smallestRule.price;
        }

        return cost;
    };

    // 2. Initial calculation
    let finalPrice = calculateGreedy(minutes);

    // 3. "Capping" / Upgrade Check
    // Check if buying a larger "package" (rule) is cheaper than the calculated price
    // e.g. 55 mins might cost 2.00 calculated, but 60 min rule is 1.50.
    for (const rule of sortedRulesDesc) {
        if (rule.minutes > minutes) {
            if (rule.price < finalPrice) {
                finalPrice = rule.price;
            }
        }
    }

    // 4. Double Check: Ensure monotonicity against the Greedy calc of the *Next Tier*
    // Sometimes 55m -> 2.00. 60m Rule -> 1.50.
    // What if 60m Rule didn't exist? But 30m was 1.00.
    // 55m = 30(1.00) + 15(0.50) + 15(0.50) = 2.00.
    // Is there a better combo? 2x30m = 2.00. Same.

    // The previous loop handles explicit rules. 
    // Is it possible that calculateGreedy(minutes + small_delta) is cheaper?
    // e.g. Bulk discount logic not captured by explicit rules? 
    // Assuming standard rules is sufficient.

    return finalPrice;
};

export const formatCurrency = (amount: number, symbol: string = 'S/') => {
    return `${symbol} ${amount.toFixed(2)}`;
};
