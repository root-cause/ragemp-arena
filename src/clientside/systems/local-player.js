import { isBitSet } from "../../shared/bit-util";
import { POWERUP_JUMP } from "../../shared/PowerUpType";

const DEATH_EFFECT_TIME = 2000;

const STATS_TO_MAX = [
    mp.game.joaat("SP0_STAMINA"), mp.game.joaat("SP0_STRENGTH"), mp.game.joaat("SP0_LUNG_CAPACITY"), mp.game.joaat("SP0_WHEELIE_ABILITY"),
    mp.game.joaat("SP0_FLYING_ABILITY"), mp.game.joaat("SP0_SHOOTING_ABILITY"), mp.game.joaat("SP0_STEALTH_ABILITY")
];

let staticSoundId = -1;

function disableStaticSound() {
    if (staticSoundId === -1) {
        return;
    }

    mp.game.audio.stopSound(staticSoundId);
    mp.game.audio.releaseSoundId(staticSoundId);
    staticSoundId = -1;
}

// sets the UI and map arrow color for the local player
function setLocalPlayerColors() {
    const playerColor = mp.players.local.getVariable("iColor");
    mp.game.hud.setScriptVariableColour((playerColor >> 16) & 255, (playerColor >> 8) & 255, playerColor & 255, 255);
    mp.game.hud.replaceColour(135, 128); // replacing HUD_COLOUR_SOCIAL_CLUB as well for the scoreboard
    mp.game.invoke(0x2ACCB195F3CCD9DEn, 128); // HUD::SET_CUSTOM_MP_HUD_COLOR

    const blipColor = (playerColor << 8) | 255;
    mp.game.hud.setBlipColour(mp.game.hud.getMainPlayerBlipId(), blipColor);
    mp.game.hud.setMainPlayerBlipColour(blipColor);
}

// maxes out player stats and sets the screen to not fade out after death
function handleLocalPlayerSpawn() {
    mp.game.misc.setFadeOutAfterDeath(false);
    STATS_TO_MAX.forEach(statHash => mp.game.stats.statSetInt(statHash, 100, false));

    // a nice outfit even though it won't be seen
    mp.players.local.setDefaultComponentVariation();
    mp.players.local.setComponentVariation(3, 4, 0, 2);
    mp.players.local.setComponentVariation(4, 111, 0, 2);
    mp.players.local.setComponentVariation(6, 89, 0, 2);
    mp.players.local.setComponentVariation(8, 143, 0, 2);
    mp.players.local.setComponentVariation(10, 61, 0, 2);
    mp.players.local.setComponentVariation(11, 284, 0, 2);
}

// applies the static effect some time after death
function handleLocalPlayerDeath() {
    setTimeout(() => {
        mp.game.graphics.animpostfxPlay("RemixDrone", 10000, false);
        mp.game.ui.displayRadar(false);

        if (staticSoundId === -1) {
            staticSoundId = mp.game.audio.getSoundId();
            mp.game.audio.playSoundFrontend(staticSoundId, "HUD_Static_Loop", "DLC_Arena_Drone_Sounds", true);
        }
    }, DEATH_EFFECT_TIME);
}

// puts the local player in their vehicle
function handleLocalPlayerVehicleStreamIn(entity) {
    if (entity.typeInt === 1 /* vehicle */ && entity.remoteId === mp.players.local.getVariable("iVehicle")) {
        mp.players.local.setIntoVehicle(entity.handle, -1);
        mp.game.invoke(0xD565F438137F0E10n, entity.handle, true); // VEHICLE::SET_VEHICLE_EXPLODES_ON_EXPLOSION_DAMAGE_AT_ZERO_BODY_HEALTH
        entity.setVehicleRadioEnabled(false);

        // reset cam
        mp.game.cam.setGameplayCamRelativeHeading(0.0);
        mp.game.cam.setGameplayCamRelativePitch(0.0, 1.0);

        // disable death effect
        mp.game.graphics.animpostfxStopAll();
        mp.game.ui.displayRadar(true);

        // disable static sound
        disableStaticSound();
    }
}

// disables certain controls for gameplay
function handleControls() {
    mp.game.pad.disableControlAction(0, 75, true); // INPUT_VEH_EXIT
    mp.game.pad.disableControlAction(0, 99, true); // INPUT_VEH_SELECT_NEXT_WEAPON
    mp.game.pad.disableControlAction(0, 100, true); // INPUT_VEH_SELECT_PREV_WEAPON

    // jump control is disabled only if the jump powerup isn't active
    const vehicle = mp.players.local.vehicle;
    if (vehicle && !isBitSet(vehicle.getVariable("iPowerUps"), POWERUP_JUMP)) {
        mp.game.pad.disableControlAction(0, 350, true); // INPUT_VEH_CAR_JUMP
    }
}

// frees the resources
function cleanUp(player) {
    if (player !== mp.players.local) {
        return;
    }

    disableStaticSound();
}

// register event handlers
mp.events.add({
    "playerReady": setLocalPlayerColors,
    "playerSpawn": handleLocalPlayerSpawn,
    "playerDeath": handleLocalPlayerDeath,
    "entityStreamIn": handleLocalPlayerVehicleStreamIn,
    "render": handleControls,
    "playerQuit": cleanUp
});
