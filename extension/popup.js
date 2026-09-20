function updatePetImage(level, mood) {

    const petImage =
        document.getElementById("pet-image");

    if (level === "Egg") {

        petImage.src = "images/egg.svg";

    }

    else if (level === "Hatchling") {

        if (
            mood === "Happy" ||
            mood === "Excited" ||
            mood === "Motivated"
        ) {

            petImage.src =
                "images/hatchling-happy.svg";

        }

        else if (mood === "Sleepy") {

            petImage.src =
                "images/hatchling-sad.svg";

        }

        else {

            petImage.src =
                "images/hatchling.svg";

        }

    }

    else if (level === "Grown") {

        if (
            mood === "Happy" ||
            mood === "Excited" ||
            mood === "Motivated"
        ) {

            petImage.src =
                "images/grown-happy.svg";

        }

        else {

            petImage.src =
                "images/grown.svg";

        }

    }

}


async function getStorage(key) {
    try {
        if (typeof chrome !== "undefined" && chrome?.storage?.local) {
            return new Promise((resolve) => {
                chrome.storage.local.get(key, (items) => {
                    resolve(items || {});
                });
            });
        }
    } catch (e) {
        console.warn("Storage get fallback:", e);
    }
    try {
        const val = localStorage.getItem(key);
        return { [key]: val };
    } catch {
        return {};
    }
}

async function setStorage(items) {
    try {
        if (typeof chrome !== "undefined" && chrome?.storage?.local) {
            return new Promise((resolve) => {
                chrome.storage.local.set(items, () => {
                    resolve();
                });
            });
        }
    } catch (e) {
        console.warn("Storage set fallback:", e);
    }
    try {
        for (const [k, v] of Object.entries(items)) {
            localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
        }
    } catch {
        // ignore localStorage errors in strict sandboxes
    }
}

async function removeStorage(key) {
    try {
        if (typeof chrome !== "undefined" && chrome?.storage?.local) {
            return new Promise((resolve) => {
                chrome.storage.local.remove(key, () => {
                    resolve();
                });
            });
        }
    } catch (e) {
        console.warn("Storage remove fallback:", e);
    }
    try {
        localStorage.removeItem(key);
    } catch {
        // ignore
    }
}

function openTab(url) {
    try {
        if (typeof chrome !== "undefined" && chrome?.tabs?.create) {
            chrome.tabs.create({ url });
            return;
        }
    } catch (e) {
        console.warn("openTab fallback:", e);
    }
    window.open(url, "_blank");
}

function setConnectedUI(username) {
    const connectButton = document.getElementById("connect-button");
    const connectedActions = document.getElementById("connected-actions");
    const status = document.getElementById("connection-status");

    if (username) {
        if (connectButton) connectButton.classList.add("hidden");
        if (connectedActions) connectedActions.classList.remove("hidden");
        if (status) {
            status.textContent = `● @${username}`;
            status.className = "status-badge connected";
            status.title = `Connected as ${username}`;
        }
    } else {
        if (connectButton) connectButton.classList.remove("hidden");
        if (connectedActions) connectedActions.classList.add("hidden");
        if (status) {
            status.textContent = "Not connected";
            status.className = "status-badge";
            status.title = "GitHub not connected";
        }
    }
}

async function loadPet() {
    try {
        const response = await fetch("http://localhost:3000/pet");

        if (!response.ok) {
            throw new Error("Failed to load pet");
        }

        const pet = await response.json();

        updatePetImage(pet.level, pet.mood);

        // Level & Icon
        const levelEl = document.getElementById("level");
        if (levelEl) {
            const icon = pet.level === "Egg" ? "🌱 " : (pet.level === "Hatchling" ? "🐣 " : "👑 ");
            levelEl.textContent = icon + pet.level;
        }

        // XP Text
        const xpEl = document.getElementById("xp");
        if (xpEl) {
            xpEl.textContent = `XP: ${pet.xp}`;
        }

        // Calculate XP Progress bar & Next Milestone
        let pct = 0;
        let nextInfo = "";
        if (pet.xp < 100) {
            pct = Math.min(100, Math.round((pet.xp / 100) * 100));
            nextInfo = `${100 - pet.xp} XP to hatch 🌱`;
        } else if (pet.xp < 300) {
            pct = Math.min(100, Math.round(((pet.xp - 100) / 200) * 100));
            nextInfo = `${300 - pet.xp} XP to grow 👑`;
        } else {
            pct = 100;
            nextInfo = "MAX LEVEL ⭐";
        }

        const fillEl = document.getElementById("xp-bar-fill");
        if (fillEl) {
            fillEl.style.width = pct + "%";
        }

        const nextInfoEl = document.getElementById("xp-next-info");
        if (nextInfoEl) {
            nextInfoEl.textContent = nextInfo;
        }

        // Streak Card
        const streakEl = document.getElementById("streak");
        if (streakEl) {
            streakEl.textContent = `${pet.streak} ${pet.streak === 1 ? "day" : "days"}`;
        }

        // Mood Card
        const moodEl = document.getElementById("mood");
        if (moodEl) {
            moodEl.textContent = pet.mood;
        }

        // Sync connection UI with backend state
        if (pet.connected && pet.githubUsername) {
            setConnectedUI(pet.githubUsername);
            await setStorage({ githubUsername: pet.githubUsername });
        } else {
            const stored = await getStorage("githubUsername");
            if (stored && stored.githubUsername) {
                setConnectedUI(stored.githubUsername);
            } else {
                setConnectedUI(null);
            }
        }

        const messageEl = document.getElementById("message");
        if (messageEl) {
            if (pet.mood === "Sleepy") {
                messageEl.textContent = "💤 Your pet is waiting for GitHub activity!";
            } else if (pet.mood === "Happy") {
                messageEl.textContent = "✨ Nice work! Your pet is super happy!";
            } else if (pet.mood === "Excited") {
                messageEl.textContent = "🎉 Amazing! Your pet is thrilled with your code!";
            } else if (pet.mood === "Motivated") {
                messageEl.textContent = "🔥 Incredible! You're on a legendary streak!";
            } else {
                messageEl.textContent = pet.connected ? "Keep coding! 🚀" : "Connect GitHub to hatch your pet! 🌱";
            }
        }

    } catch (error) {
        console.error("Error loading pet:", error);
        const status = document.getElementById("connection-status");
        if (status) {
            status.textContent = "Offline (port 3000)";
            status.className = "status-badge error";
        }
        const messageEl = document.getElementById("message");
        if (messageEl) {
            messageEl.textContent = "Start the backend: npm start in backend/";
        }
    }
}

async function connectGitHub() {
    const status = document.getElementById("connection-status");
    status.textContent = "Connecting to GitHub...";
    status.className = "";

    try {
        let response;
        try {
            response = await fetch("http://localhost:3000/auth/start");
        } catch (netErr) {
            throw new Error("Backend server not running on http://localhost:3000");
        }

        if (!response.ok) {
            throw new Error("Could not start GitHub login (HTTP " + response.status + ")");
        }

        const data = await response.json();

        if (!data.authUrl || !data.state) {
            throw new Error("Invalid response from server");
        }

        await setStorage({
            oauthState: data.state
        });

        openTab(data.authUrl);

        status.textContent = "Authorize GitHub in the opened tab...";

        checkConnection();

    } catch (error) {
        console.error("GitHub connection error:", error);
        status.textContent = error.message.includes("Backend server")
            ? "Backend not running (port 3000)"
            : "Could not connect GitHub.";
        status.className = "error";
    }
}

let checkTimeout = null;

async function checkConnection() {
    try {
        const result = await getStorage("oauthState");

        if (!result || !result.oauthState) {
            return;
        }

        const response = await fetch(
            `http://localhost:3000/auth/status?state=${encodeURIComponent(result.oauthState)}`
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        if (data.status === "success") {
            await setStorage({
                githubUsername: data.username,
                githubUserId: data.userId
            });

            await removeStorage("oauthState");

            setConnectedUI(data.username);

            document.getElementById("message").textContent =
                "GitHub connected! Start coding! 🚀";

            await syncGitHub();
            return;
        }

        if (data.status === "error") {
            await removeStorage("oauthState");
            const status = document.getElementById("connection-status");
            if (status) {
                status.textContent = "GitHub authorization failed.";
                status.className = "error";
            }
            return;
        }

        // If still pending or processing, check again
        if (data.status === "pending" || data.status === "processing") {
            if (checkTimeout) clearTimeout(checkTimeout);
            checkTimeout = setTimeout(checkConnection, 1200);
        }

    } catch (error) {
        console.error("Connection check error:", error);
    }
}

async function syncGitHub() {
    const earnedXpEl = document.getElementById("earned-xp");
    const activityEl = document.getElementById("activity");
    const syncButton = document.getElementById("sync-button");

    if (syncButton) {
        syncButton.disabled = true;
        syncButton.textContent = "Syncing...";
    }

    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const response = await fetch(
            `http://localhost:3000/sync-github?timezone=${encodeURIComponent(timezone)}`
        );
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || "Sync failed");
        }

        const data = await response.json();

        if (earnedXpEl) earnedXpEl.textContent = `+${data.earned_xp} XP this sync`;
        if (activityEl) activityEl.textContent = `${data.events_found} events`;

        await loadPet();

    } catch (err) {
        console.error("Sync error:", err);
    } finally {
        if (syncButton) {
            syncButton.disabled = false;
            syncButton.textContent = "🔄 Sync Activity";
        }
    }
}

async function disconnectGitHub() {
    try {
        await fetch("http://localhost:3000/auth/disconnect");
    } catch (err) {
        console.error("Disconnect error:", err);
    }

    await removeStorage("githubUsername");
    await removeStorage("githubUserId");
    await removeStorage("oauthState");

    setConnectedUI(null);
    document.getElementById("earned-xp").textContent = "+0 XP this sync";
    document.getElementById("activity").textContent = "0 events";
    document.getElementById("message").textContent = "Connect GitHub to begin!";

    await loadPet();
}

document.addEventListener("DOMContentLoaded", async () => {
    const connectButton = document.getElementById("connect-button");
    const disconnectButton = document.getElementById("disconnect-button");
    const syncButton = document.getElementById("sync-button");
    const petStage = document.getElementById("pet-stage");

    if (connectButton) {
        connectButton.addEventListener("click", connectGitHub);
    }

    if (disconnectButton) {
        disconnectButton.addEventListener("click", disconnectGitHub);
    }

    if (syncButton) {
        syncButton.addEventListener("click", syncGitHub);
    }

    // Interactive Petting!
    if (petStage) {
        petStage.addEventListener("click", () => {
            const petAvatar = document.getElementById("pet-image");
            if (petAvatar) {
                petAvatar.classList.remove("pet-bounce");
                void petAvatar.offsetWidth; // Trigger reflow for animation restart
                petAvatar.classList.add("pet-bounce");
            }

            const messageEl = document.getElementById("message");
            const phrases = [
                "Petted! 🥰",
                "Purrrr... 💕",
                "You're awesome! ✨",
                "Let's write some code! 🚀",
                "I love pair programming with you! 💖",
                "Keep building cool things! 🌟"
            ];
            const chosen = phrases[Math.floor(Math.random() * phrases.length)];

            if (messageEl) {
                const prev = messageEl.textContent;
                messageEl.textContent = chosen;
                setTimeout(() => {
                    if (messageEl.textContent === chosen) {
                        messageEl.textContent = prev;
                    }
                }, 2000);
            }
        });
    }

    await loadPet();

    // Check if user was in the middle of OAuth when popup closed
    const storage = await getStorage("oauthState");
    if (storage && storage.oauthState) {
        checkConnection();
    }
});