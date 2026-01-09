
const rules = [
    { minutes: 15, price: 0.50 },
    { minutes: 30, price: 1.00 },
    { minutes: 60, price: 1.50 }, // Standard hour
    { minutes: 180, price: 3.00 }, // 3h Promo (Normal)
    { minutes: 240, price: 4.00 }, // 4h Promo (Normal)
];

const tolerance = 5;

function calculatePrice(rawMinutes, rules) {
    if (rawMinutes <= 0) return 0;
    const effectiveMinutes = Math.max(0, rawMinutes - tolerance);

    // 1. Sort rules descending for greedy decomposition
    const sortedRules = [...rules].sort((a, b) => b.minutes - a.minutes);
    const smallestRule = sortedRules[sortedRules.length - 1];

    // Greedy Calculation: Decompose minutes into Sum of Rules
    function getGreedyPrice(mins) {
        let remaining = mins;
        let price = 0;
        for (const rule of sortedRules) {
            if (remaining >= rule.minutes) {
                const count = Math.floor(remaining / rule.minutes);
                price += count * rule.price;
                remaining %= rule.minutes;
            }
        }
        if (remaining > 0) {
            price += smallestRule.price; // Charge smallest unit for remainder
        }
        return price;
    }

    const greedyPrice = getGreedyPrice(effectiveMinutes);

    // 2. Optimization: Check if any "Larger Rule" is cheaper than Gradient
    let bestPrice = greedyPrice;

    // Look at all rules strictly larger than effectiveMinutes
    // Logic: If I pay for 4 hours, I get 4 hours. 3h45 is covered by 4h.
    for (const rule of rules) {
        if (rule.minutes >= effectiveMinutes) {
            if (rule.price < bestPrice) {
                console.log(`Optimization Found! Paying for ${rule.minutes}m (${rule.price}) is cheaper than ${effectiveMinutes}m (${bestPrice})`);
                bestPrice = rule.price;
            }
        }
    }

    // 3. Recursive Lookahead? (Advanced)
    // What if the optimal price is not a single rule, but a combination larger than current?
    // e.g. 5h is not defined as a rule. But 4h+1h = 5.00. 
    // And Greedy(4h45) = 4h(4.00) + 45m(1.50) = 5.50.
    // 5h cost = 5.00.
    // Our simple "Check larger rule" only checks SINGLE rules.
    // We might need to check "GreedyPrice(NextStandardBoundary)"?
    // How to define "NextStandardBoundary"? It's usually the next multiple of the hour or next rule.
    // Let's just standard check: GreedyPrice(effectiveMinutes rounded up to next 30/60m)?
    // User requirement: "evaluar con el siguiente nivel de precio".

    // Let's check Greedy of next logical milestones defined by rules?
    // Iterate all rules. ceil(effective / rule.min) * rule.price? No.

    return bestPrice;
}

// Test Cases
console.log("--- Test Case 1: 3h 45m (225m) ---");
// Expectation: 4h is 4.00.
// Greedy (3h + 30m + 15m) = 3.00 + 1.00 + 0.50 = 4.50.
// Should return 4.00.
console.log("Result:", calculatePrice(225, rules));

console.log("\n--- Test Case 2: 3h 02m (182m) with Tolerance 5m ---");
// Expectation: 180m valid due to tolerance. Price 3.00.
console.log("Result:", calculatePrice(182, rules));

console.log("\n--- Test Case 3: 55m ---");
// Rules: 60m=1.50. 30m=1.00, 15m=0.50.
// Greedy: 30+15+15 (remainder -> 15) = 2.00.
// 60m Rule = 1.50.
// Result should be 1.50.
console.log("Result:", calculatePrice(55, rules));
