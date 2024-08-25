import { waitFor, callScaleformMethod } from "../util";

const NUM_SCOREBOARD_PLAYERS = 10;

let scaleformHandle = 0;
let isScoreboardOn = false;

// loads and sets up the scoreboard scaleform
async function init() {
    scaleformHandle = mp.game.graphics.requestScaleformMovie("sc_leaderboard");
    await waitFor(() => mp.game.graphics.hasScaleformMovieLoaded(scaleformHandle));

    // apply default scoreboard setup
    callScaleformMethod(scaleformHandle, "SET_DISPLAY_TYPE", 1);
    callScaleformMethod(scaleformHandle, "SET_TITLE", "PLAYER", "KILLS", "DEATHS");
}

// draws the scoreboard
function renderScoreboard() {
    if (scaleformHandle === 0) {
        return;
    }

    const isOnNow = mp.game.pad.isControlPressed(2, 211);
    if (isScoreboardOn !== isOnNow) {
        isScoreboardOn = isOnNow;

        // play a little sound effect
        mp.game.audio.playSoundFrontend(-1, isOnNow ? "LEADER_BOARD" : "BACK", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);

        // update values if the scoreboard became visible
        if (isOnNow) {
            let slotIndex = 0;
            callScaleformMethod(scaleformHandle, "CLEAR_ALL_SLOTS");

            // header for local player
            callScaleformMethod(scaleformHandle, "SET_SLOT", slotIndex++, 16, "YOUR STATS");

            // stats of local player
            callScaleformMethod(scaleformHandle, "SET_SLOT", slotIndex++, 1, "", mp.players.local.name, "", mp.players.local.getVariable("iKills"), mp.players.local.getVariable("iDeaths"));

            // header for top players
            callScaleformMethod(scaleformHandle, "SET_SLOT", slotIndex++, 32, "TOP PLAYERS");

            // stats of top players
            const topPlayers = mp.players.toArray().sort((a, b) => b.getVariable("iKills") - a.getVariable("iKills")).slice(0, NUM_SCOREBOARD_PLAYERS);
            topPlayers.forEach((player, place) => callScaleformMethod(scaleformHandle, "SET_SLOT", slotIndex++, 1, place + 1, player.name, "", player.getVariable("iKills"), player.getVariable("iDeaths")));
        }
    }

    if (isScoreboardOn) {
        mp.game.graphics.drawScaleformMovieFullscreen(scaleformHandle, 255, 255, 255, 255, 0);
    }
}

// frees the resources
function cleanUp(player) {
    if (player !== mp.players.local || scaleformHandle === 0) {
        return;
    }

    mp.game.graphics.setScaleformMovieAsNoLongerNeeded(scaleformHandle);
    scaleformHandle = 0;
}

// register event handlers
mp.events.add({
    "playerReady": init,
    "render": renderScoreboard,
    "playerQuit": cleanUp
});
