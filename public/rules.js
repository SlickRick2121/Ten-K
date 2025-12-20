export const SCORING_RULES = {
    TRIPLE_1: 1000,
    TRIPLE_2: 200,
    TRIPLE_3: 300,
    TRIPLE_4: 400,
    TRIPLE_5: 500,
    TRIPLE_6: 600,
    SINGLE_1: 100,
    SINGLE_5: 50,
    STRAIGHT: 1500 // 1-2-3-4-5-6
};

export function calculateScore(dice) {
    if (!dice || dice.length === 0) return 0;

    const counts = {};
    for (const die of dice) {
        counts[die] = (counts[die] || 0) + 1;
    }

    // Check for Straight (Must be exactly 6 dice, 1 of each)
    if (dice.length === 6) {
        let isStraight = true;
        for (let i = 1; i <= 6; i++) {
            if (counts[i] !== 1) {
                isStraight = false;
                break;
            }
        }
        if (isStraight) return SCORING_RULES.STRAIGHT;
    }

    let score = 0;

    for (let face = 1; face <= 6; face++) {
        const count = counts[face] || 0;

        let tripleValue = 0;
        if (face === 1) tripleValue = SCORING_RULES.TRIPLE_1;
        else if (face === 2) tripleValue = SCORING_RULES.TRIPLE_2;
        else if (face === 3) tripleValue = SCORING_RULES.TRIPLE_3;
        else if (face === 4) tripleValue = SCORING_RULES.TRIPLE_4;
        else if (face === 5) tripleValue = SCORING_RULES.TRIPLE_5;
        else if (face === 6) tripleValue = SCORING_RULES.TRIPLE_6;

        if (count >= 3) {
            let multiplier = 0;
            if (count === 3) multiplier = 1;
            else if (count === 4) multiplier = 2;
            else if (count === 5) multiplier = 3;
            else if (count === 6) multiplier = 4;

            score += tripleValue * multiplier;
        } else {
            // Count leftovers only if they are 1 or 5
            if (face === 1) score += count * SCORING_RULES.SINGLE_1;
            if (face === 5) score += count * SCORING_RULES.SINGLE_5;
        }
    }

    return score;
}

export function isScoringSelection(dice) {
    // A selection is valid if EVERY die in it contributes to the score.
    // This prevents holding non-scoring junk dice.
    // How to check?
    // Calculate total score of set.
    // Remove one die. Calculate score.
    // If score dropped, that die was contributing.
    // Do this for all? Efficient enough for 6 dice.

    // Actually simpler:
    // If a face has count < 3 and is not 1 or 5, it's non-scoring.
    // EXCEPTION: A proper implementations might allow 4,4,4,4 where removing one 4 changes it from 4x to 3x (score changes).
    // But removing a 2 from 2,2,2 (200) -> 2,2 (0) also changes score.
    // So non-scoring dice are faces like 2,3,4,6 appearing < 3 times.

    const counts = {};
    for (const die of dice) {
        counts[die] = (counts[die] || 0) + 1;
    }

    for (let face = 1; face <= 6; face++) {
        const count = counts[face] || 0;
        if (count > 0) {
            if (count < 3 && face !== 1 && face !== 5) {
                // If this is a straight, it's valid.
                // A straight must include all 1-6.
                // If we found a "naked" non-1/5, it's typically invalid UNLESS it's part of a straight.
                // But if it IS part of a straight, then we basically have 1 of each.
                // If dice.length == 6 and we have 1 of each, we return true early?

                // Let's check straight condition first for the whole set.
                if (dice.length === 6) {
                    const isStraight = (counts[1] === 1 && counts[2] === 1 && counts[3] === 1 && counts[4] === 1 && counts[5] === 1 && counts[6] === 1);
                    if (isStraight) return true;
                }

                return false; // Found a naked 2, 3, 4, or 6 and it's not a straight
            }
        }
    }
    return true;
}

export function hasPossibleMoves(dice) {
    // Used to check for Farkle on a roll
    // If the roll contains ANY subset that scores, it's not a Farkle.
    // Just need to check if there are any 1s, 5s, or any triples.

    const counts = {};
    for (const die of dice) {
        counts[die] = (counts[die] || 0) + 1;
    }

    if (counts[1] > 0 || counts[5] > 0) return true;
    for (let face = 2; face <= 6; face++) {
        if ((counts[face] || 0) >= 3) return true;
    }

    // Check Straight
    if (counts[1] === 1 && counts[2] === 1 && counts[3] === 1 && counts[4] === 1 && counts[5] === 1 && counts[6] === 1) return true;

    return false;
}
