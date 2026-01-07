export const DEFAULT_RULES = {
    // Scoring Values
    single1: 100,
    single5: 50,
    triple1: 1000,
    triple2: 200,
    triple3: 300,
    triple4: 400,
    triple5: 500,
    triple6: 600,
    straight: 1500,
    threePairs: 1500,
    fourOfAKind: 1000,
    fiveOfAKind: 2000,
    sixOfAKind: 3000,
    sixOnes: 5000, // 1-1-1-1-1-1
    twoTriplets: 2500,
    fullHouseBonus: 250, // 3-of-kind + pair
    fourStraight: 500, // Custom
    fiveStraight: 1200, // Custom

    // Feature Toggles (Game Modes/Variants can override these)
    enableThreePairs: true,
    enableTwoTriplets: true,
    enableFullHouse: false, // Not standard-standard, but requested. User said '3-of-a-kind + pair 3-of-a-kind value + 250'
    enableSixOnesInstantWin: false, // User mentioned 'Instant win' as option
    enable4Straight: false,
    enable5Straight: false,

    // Logic Variants
    openingScore: 0, // Minimum to get on board
    winScore: 10000,
    threeFarklesPenalty: 1000,
    toxicTwos: false, // 4+ twos = 0 score for turn
    welfareMode: false, // 10k exact, overflow goes to low score
    highStakes: false, // Can roll previous player's dice
    noFarkleFirstRoll: true // House rule
};

export function calculateScore(dice, rules = DEFAULT_RULES) {
    if (!dice || dice.length === 0) return 0;

    const counts = {};
    for (const die of dice) {
        counts[die] = (counts[die] || 0) + 1;
    }
    const distinct = Object.keys(counts).length;
    const totalDice = dice.length;

    // --- Special Combinations (Check these first if dice.length matches) ---

    // 1. Straight (1-6)
    if (totalDice === 6 && distinct === 6) return rules.straight;

    // 2. Six Ones
    if (counts[1] === 6) return rules.sixOnes;

    // 3. Six of a Kind
    for (let i = 2; i <= 6; i++) {
        if (counts[i] === 6) return rules.sixOfAKind;
    }

    // 4. 5-Straight (12345 or 23456)
    if (rules.enable5Straight && totalDice === 5 && distinct === 5) {
        if ((counts[1] && counts[2] && counts[3] && counts[4] && counts[5]) ||
            (counts[2] && counts[3] && counts[4] && counts[5] && counts[6])) {
            return rules.fiveStraight;
        }
    }

    // 5. 4-Straight (1234, 2345, 3456)
    if (rules.enable4Straight && totalDice === 4 && distinct === 4) {
        const has1234 = (counts[1] && counts[2] && counts[3] && counts[4]);
        const has2345 = (counts[2] && counts[3] && counts[4] && counts[5]);
        const has3456 = (counts[3] && counts[4] && counts[5] && counts[6]);
        if (has1234 || has2345 || has3456) return rules.fourStraight;
    }

    // 6. Three Pairs
    if (rules.enableThreePairs && totalDice === 6 && distinct === 3) {
        if (Object.values(counts).every(c => c === 2)) return rules.threePairs;
    }

    // 7. Two Triplets
    if (rules.enableTwoTriplets && totalDice === 6 && distinct === 2) {
        const vals = Object.values(counts);
        if (vals[0] === 3 && vals[1] === 3) return rules.twoTriplets;
    }

    // --- Standard Counting Score ---
    // If no special 6-dice combo, we sum up individual sets.
    // Note: This logic assumes the user selected a valid set. 
    // It does NOT auto-partition. It scores the 'dice' array passed in.
    // If user sends [1, 1, 1, 5], we score 1050.

    let score = 0;

    for (let face = 1; face <= 6; face++) {
        const count = counts[face] || 0;
        if (count === 0) continue;

        let tripleValue = 0;
        switch (face) {
            case 1: tripleValue = rules.triple1; break;
            case 2: tripleValue = rules.triple2; break;
            case 3: tripleValue = rules.triple3; break;
            case 4: tripleValue = rules.triple4; break;
            case 5: tripleValue = rules.triple5; break;
            case 6: tripleValue = rules.triple6; break;
        }

        if (count >= 3) {
            let nKindScore = 0;
            if (count === 3) nKindScore = tripleValue;
            else if (count === 4) nKindScore = rules.fourOfAKind || (tripleValue * 2);
            else if (count === 5) nKindScore = rules.fiveOfAKind || (tripleValue * 4);
            else if (count === 6) nKindScore = rules.sixOfAKind || (tripleValue * 8);

            // For 1s and 5s, check if (Triple + Individuals) is better than N-of-a-Kind
            // e.g. 4 ones = 111 (1000) + 1 (100) = 1100. If 4-kind = 1000, 1100 is better.
            if (face === 1 || face === 5) {
                const singleVal = (face === 1 ? rules.single1 : rules.single5);
                const combinedScore = tripleValue + (count - 3) * singleVal;
                score += Math.max(nKindScore, combinedScore);
            } else {
                score += nKindScore;
            }
        } else {
            // Count < 3
            if (face === 1) score += count * rules.single1;
            else if (face === 5) score += count * rules.single5;
        }
    }

    // Toxic Twos Check (If this function is just calculating score, maybe return 0? 
    // But Toxic Twos usually wipes the whole TURN, not just the roll.
    // That needs to be handled in game logic, not just score calc.
    // However, if the roll HAS Toxic Twos, this roll score is 0 and it triggers a wipe.
    // I need to signal that. Maybe return -1? 
    // Or let the game logic check the dice for Toxic Twos condition separate from score.)

    return score;

}

export function hasPossibleMoves(dice, rules = DEFAULT_RULES) {
    if (!dice || dice.length === 0) return false;

    // Check simple scorers
    const counts = {};
    for (const d of dice) counts[d] = (counts[d] || 0) + 1;

    if (counts[1] > 0 || counts[5] > 0) return true;

    // Triples
    for (let i = 1; i <= 6; i++) {
        if (counts[i] >= 3) return true;
    }

    // Straight?
    if (Object.keys(counts).length === 6) return true; // 1-2-3-4-5-6

    // 3 Pairs?
    if (rules.enableThreePairs && dice.length === 6) {
        if (Object.values(counts).every(c => c === 2)) return true;
    }

    // 5 Straight check (if we have 5 dice)
    if (rules.enable5Straight && dice.length >= 5) {
        const has12345 = (counts[1] && counts[2] && counts[3] && counts[4] && counts[5]);
        const has23456 = (counts[2] && counts[3] && counts[4] && counts[5] && counts[6]);
        if (has12345 || has23456) return true;
    }

    // 4 Straight check (if we have 4 dice)
    if (rules.enable4Straight && dice.length >= 4) {
        const has1234 = (counts[1] && counts[2] && counts[3] && counts[4]);
        const has2345 = (counts[2] && counts[3] && counts[4] && counts[5]);
        const has3456 = (counts[3] && counts[4] && counts[5] && counts[6]);
        if (has1234 || has2345 || has3456) return true;
    }

    return false;
}

export function isScoringSelection(dice, rules = DEFAULT_RULES) {
    const score = calculateScore(dice, rules);
    if (score === 0) return false;

    const counts = {};
    for (const d of dice) counts[d] = (counts[d] || 0) + 1;
    const distinct = Object.keys(counts).length;
    const totalDice = dice.length;

    // Special combos that span all selected dice
    if (totalDice === 6 && distinct === 6) return true; // Straight
    if (rules.enableThreePairs && totalDice === 6 && Object.values(counts).every(c => c === 2)) return true;

    if (rules.enable5Straight && totalDice === 5 && distinct === 5) {
        if ((counts[1] && counts[2] && counts[3] && counts[4] && counts[5]) || (counts[2] && counts[3] && counts[4] && counts[5] && counts[6])) return true;
    }

    if (rules.enable4Straight && totalDice === 4 && distinct === 4) {
        const has1234 = (counts[1] && counts[2] && counts[3] && counts[4]);
        const has2345 = (counts[2] && counts[3] && counts[4] && counts[5]);
        const has3456 = (counts[3] && counts[4] && counts[5] && counts[6]);
        if (has1234 || has2345 || has3456) return true;
    }

    // Standard scoring: Every face must be either 1, 5, or have a count >= 3
    for (let face = 1; face <= 6; face++) {
        const c = counts[face] || 0;
        if (c > 0) {
            if (face === 1 || face === 5) continue;
            if (c < 3) return false;
        }
    }

    return true;
}

