import { DUMMY_TYPE_ARENA } from "../../shared/DummyType";
import { getUnixTimestamp } from "../../shared/util";
import { isBitSet } from "../../shared/bit-util";
import { callScaleformMethod, waitFor } from "../util";
import * as PowerUpType from "../../shared/PowerUpType";

const HUD_INDEX_HEALTH = 0;
const HUD_INDEX_ARMOR = 1;
const HUD_INDEX_GHOST = 2;
const HUD_INDEX_JUMP = 3;
const HUD_INDEX_TIMER = 4;

let scaleformHandle = 0;
let gameStartedAt = 0;
let gameEndingAt = 0;
let lastVehicleHealth = 1000.0;
let lastRemainingTime = 0;

function getHudIndexForPowerUp(powerUp) {
    switch (powerUp) {
        case PowerUpType.POWERUP_ARMOR:
            return HUD_INDEX_ARMOR;

        case PowerUpType.POWERUP_GHOST:
            return HUD_INDEX_GHOST;

        case PowerUpType.POWERUP_JUMP:
            return HUD_INDEX_JUMP;

        default:
            return -1;
    }
}

// loads and sets up the hud scaleform
async function init() {
    scaleformHandle = mp.game.graphics.requestScaleformMovie("power_play_generic");
    await waitFor(() => mp.game.graphics.hasScaleformMovieLoaded(scaleformHandle));

    // add local player's color
    callScaleformMethod(scaleformHandle, "ADD_TEAM", 128);

    // add icons
    callScaleformMethod(scaleformHandle, "ADD_ICON", 18); // HUD_INDEX_HEALTH
    callScaleformMethod(scaleformHandle, "ADD_ICON", 2); // HUD_INDEX_ARMOR
    callScaleformMethod(scaleformHandle, "ADD_ICON", 10); // HUD_INDEX_GHOST
    callScaleformMethod(scaleformHandle, "ADD_ICON", 12); // HUD_INDEX_JUMP
    callScaleformMethod(scaleformHandle, "ADD_ICON", 22); // HUD_INDEX_TIMER

    // fill health and timer displays
    callScaleformMethod(scaleformHandle, "SET_ICON_METER", HUD_INDEX_HEALTH, 1.0);
    callScaleformMethod(scaleformHandle, "SET_ICON_TIMER", HUD_INDEX_TIMER, 1.0);

    // get current timestamps from the arena dummy (there should be only one dummy with DUMMY_TYPE_ARENA)
    mp.dummies.forEachByType(DUMMY_TYPE_ARENA, (dummy) => {
        gameStartedAt = dummy.getVariable("iGameStart");
        gameEndingAt = dummy.getVariable("iGameEnd");
    });
}

// draws the hud
function renderHud() {
    // not drawing if the local player isn't in a vehicle or is dead
    const vehicle = mp.players.local.vehicle;
    if (scaleformHandle === 0 || vehicle == null || mp.game.graphics.animpostfxIsRunning("RemixDrone")) {
        return;
    }

    // update health hud if the local player's vehicle had a health change
    const currentHealth = vehicle.getHealth();
    if (Math.abs(lastVehicleHealth - currentHealth) >= 1.0) {
        lastVehicleHealth = currentHealth;
        callScaleformMethod(scaleformHandle, "SET_ICON_METER", HUD_INDEX_HEALTH, currentHealth / 1000.0);
        callScaleformMethod(scaleformHandle, "PULSE_ICON", HUD_INDEX_HEALTH);
    }

    // update game timer hud
    const remainingTime = gameEndingAt - getUnixTimestamp();
    if (lastRemainingTime !== remainingTime) {
        lastRemainingTime = remainingTime;
        callScaleformMethod(scaleformHandle, "SET_ICON_TIMER", HUD_INDEX_TIMER, remainingTime / (gameEndingAt - gameStartedAt));
    }

    mp.game.graphics.drawScaleformMovieFullscreen(scaleformHandle, 255, 255, 255, 255, 0);
}

// applies powerup changes to the hud
function handlePowerUpChanges(entity, newPowerUpBits, oldPowerUpBits) {
    if (entity.typeInt !== 1 /* vehicle */ || entity.remoteId !== mp.players.local.getVariable("iVehicle")) {
        return;
    }

    // deactivate all icons if powerups are reset
    if (newPowerUpBits === 0) {
        callScaleformMethod(scaleformHandle, "DEACTIVATE_ALL_ICONS");
        callScaleformMethod(scaleformHandle, "ACTIVATE_ICON", HUD_INDEX_HEALTH);
        return;
    }

    // handle individual icons
    for (let i = 0; i < PowerUpType.NUM_POWERUPS; i++) {
        const hudIndex = getHudIndexForPowerUp(i);
        if (hudIndex === -1) {
            continue;
        }

        const isEnabled = isBitSet(newPowerUpBits, i);
        const wasEnabled = isBitSet(oldPowerUpBits, i);
        if (isEnabled && !wasEnabled) {
            callScaleformMethod(scaleformHandle, "PULSE_ICON", hudIndex);
        } else if (!isEnabled && wasEnabled) {
            callScaleformMethod(scaleformHandle, "DEACTIVATE_ICON", hudIndex);
        }
    }
}

// applies the game time changes
function handleGameStartChange(entity, newGameStart) {
    if (entity.typeInt !== 9 /* dummy */ || entity.dummyType !== DUMMY_TYPE_ARENA) {
        return;
    }

    gameStartedAt = newGameStart;
}

// applies the game time changes
function handleGameEndChange(entity, newGameEnd) {
    if (entity.typeInt !== 9 /* dummy */ || entity.dummyType !== DUMMY_TYPE_ARENA) {
        return;
    }

    gameEndingAt = newGameEnd;
}

// pulses the timer icon
function handleGamePauseChange(entity) {
    if (entity.typeInt !== 9 /* dummy */ || entity.dummyType !== DUMMY_TYPE_ARENA) {
        return;
    }

    callScaleformMethod(scaleformHandle, "PULSE_ICON", HUD_INDEX_TIMER);
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
    "render": renderHud,
    "playerQuit": cleanUp
});

// register data change handlers
mp.events.addDataHandler("iPowerUps", handlePowerUpChanges);
mp.events.addDataHandler("iGameStart", handleGameStartChange);
mp.events.addDataHandler("iGameEnd", handleGameEndChange);
mp.events.addDataHandler("bGamePause", handleGamePauseChange);
