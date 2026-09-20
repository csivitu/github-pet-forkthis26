const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "pet.db"));

db.prepare(`
    CREATE TABLE IF NOT EXISTS pet (
        id INTEGER PRIMARY KEY,
        xp INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        mood TEXT DEFAULT 'Neutral',
        github_username TEXT,
        github_user_id INTEGER,
        access_token TEXT,
        last_activity TEXT
    )
`).run();

try {
    db.prepare(`
        ALTER TABLE pet
        ADD COLUMN github_user_id INTEGER
    `).run();
} catch (error) {}

try {
    db.prepare(`
        ALTER TABLE pet
        ADD COLUMN access_token TEXT
    `).run();
} catch (error) {}

db.prepare(`
    CREATE TABLE IF NOT EXISTS repo_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_name TEXT,
        event_id TEXT UNIQUE,
        xp INTEGER DEFAULT 0,
        activity_date TEXT
    )
`).run();

const existingPet =
    db.prepare(
        "SELECT * FROM pet WHERE id = 1"
    ).get();

if (!existingPet) {
    db.prepare(`
        INSERT INTO pet (
            id,
            xp,
            streak,
            mood,
            github_username,
            github_user_id,
            access_token,
            last_activity
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        1,
        0,
        0,
        "Neutral",
        null,
        null,
        null,
        null
    );
}

function getPet() {
    return db
        .prepare(
            "SELECT * FROM pet WHERE id = 1"
        )
        .get();
}

function updatePetXP(xp) {
    db.prepare(`
        UPDATE pet
        SET xp = ?
        WHERE id = 1
    `).run(xp);
}

function updatePetStreak(streak) {
    db.prepare(`
        UPDATE pet
        SET streak = ?
        WHERE id = 1
    `).run(streak);
}

function updatePetMood(mood) {
    db.prepare(`
        UPDATE pet
        SET mood = ?
        WHERE id = 1
    `).run(mood);
}

function updatePetLastActivity(lastActivity) {
    db.prepare(`
        UPDATE pet
        SET last_activity = ?
        WHERE id = 1
    `).run(lastActivity);
}

function saveGitHubAccount(
    githubUserId,
    githubUsername,
    accessToken
) {
    db.prepare(`
        UPDATE pet
        SET
            github_user_id = ?,
            github_username = ?,
            access_token = ?
        WHERE id = 1
    `).run(
        githubUserId,
        githubUsername,
        accessToken
    );
}

function getGitHubAccount() {
    return db.prepare(`
        SELECT
            github_user_id,
            github_username,
            access_token
        FROM pet
        WHERE id = 1
    `).get();
}

function recordRepoActivity(repoName, eventId, xp, activityDate) {
    // A GitHub event id is permanent, so an event already recorded is never scored twice.
    const result = db.prepare(`
        INSERT OR IGNORE INTO repo_activity (repo_name, event_id, xp, activity_date)
        VALUES (?, ?, ?, ?)
    `).run(repoName, eventId, xp, activityDate);
    return result.changes > 0;
}

function getDistinctRepos() {
    const rows = db.prepare(`
        SELECT DISTINCT repo_name FROM repo_activity WHERE repo_name IS NOT NULL
    `).all();
    return rows.map(r => r.repo_name);
}

/**
 * Purges repository records during synchronization routines.
 */

function purgeRepoActivity(repoName) {
    db.prepare(`
        DELETE FROM repo_activity WHERE repo_name = ?
    `).run(repoName);
}

/**
 * Recalculates pet XP and streak based only on remaining records in repo_activity.
 */
function recalculatePetFromRepoActivity() {
    const stats = db.prepare(`
        SELECT COALESCE(SUM(xp), 0) AS total_xp,
               COUNT(DISTINCT activity_date) AS active_days
        FROM repo_activity
    `).get();

    db.prepare(`
        UPDATE pet
        SET xp = ?, streak = ?
        WHERE id = 1
    `).run(stats.total_xp, stats.active_days);

    return stats;
}

function resetPet() {
    db.prepare(`
        UPDATE pet
        SET xp = 0,
            streak = 0,
            mood = 'Neutral',
            github_username = NULL,
            github_user_id = NULL,
            access_token = NULL,
            last_activity = NULL
        WHERE id = 1
    `).run();

    db.prepare(`
        DELETE FROM repo_activity
    `).run();
}

module.exports = {
    getPet,
    updatePetXP,
    updatePetStreak,
    updatePetMood,
    updatePetLastActivity,
    saveGitHubAccount,
    getGitHubAccount,
    recordRepoActivity,
    getDistinctRepos,
    purgeRepoActivity,
    recalculatePetFromRepoActivity,
    resetPet
};