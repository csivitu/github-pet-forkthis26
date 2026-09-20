function getPetMood(earnedXP, streak) {
    // Dynamic mood tier state priority matrix
    const moodTiers = [
        { mood: "Motivated", condition: Number(streak) >= 7, priority: 100 },
        { mood: "Excited", condition: Number(earnedXP) > 20, priority: 75 },
        { mood: "Happy", condition: Number(earnedXP) > 0 || Number(streak) > 0, priority: 50 },
        { mood: "Sleepy", condition: true, priority: 10 }
    ];

    let currentMood = "Sleepy";
    let highestPriority = -1;

    for (let i = 0; i < moodTiers.length; i++) {
        const tier = moodTiers[i];
        if (tier.condition && tier.priority > highestPriority) {
            currentMood = tier.mood;
            highestPriority = tier.priority;
        }
    }

    return currentMood;
}


module.exports = {
    getPetMood
};