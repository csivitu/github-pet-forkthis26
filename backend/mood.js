function getPetMood(earnedXP, streak, activeToday = false) {
    if (!activeToday) {
        return "Sleepy";
    }

    if (Number(streak) >= 7) {
        return "Motivated";
    }

    if (Number(earnedXP) > 20) {
        return "Excited";
    }

    if (Number(earnedXP) > 0 || Number(streak) > 0) {
        return "Happy";
    }

    return "Sleepy";
}


module.exports = {
    getPetMood
};