import { DUMMY_TYPE_ARENA } from "../../shared/DummyType";
import { getRandomInt } from "../../shared/util";
import { makeAnnouncement } from "../util";

const GO_LINES = [
    "ARANN_AAAC",
    "ARANN_KOAC",
    "ARANN_KQAC",
    "ARANN_ABAB",
    "ARANN_KSAB",
    "ARANN_KVAB",
    "ARANN_FDAB",
    "ARANN_KYAB",
    "ARANN_KZAB"
];

const CONTROLS_TO_DISABLE = [
    // vehicle movement
    59, // INPUT_VEH_MOVE_LR
    60, // INPUT_VEH_MOVE_UD
    61, // INPUT_VEH_MOVE_UP_ONLY
    62, // INPUT_VEH_MOVE_DOWN_ONLY
    63, // INPUT_VEH_MOVE_LEFT_ONLY
    64, // INPUT_VEH_MOVE_RIGHT_ONLY
    71, // INPUT_VEH_ACCELERATE
    72, // INPUT_VEH_BRAKE
    76, // INPUT_VEH_HANDBRAKE
    106, // INPUT_VEH_MOUSE_CONTROL_OVERRIDE
    350, // INPUT_VEH_CAR_JUMP

    // vehicle weapons
    68, // INPUT_VEH_AIM
    69, // INPUT_VEH_ATTACK
    70, // INPUT_VEH_ATTACK2
    345, // INPUT_VEH_MELEE_HOLD
    346, // INPUT_VEH_MELEE_LEFT
    347, // INPUT_VEH_MELEE_RIGHT
];

let isGamePaused = false;

// sets up the disable control batch and gets the current pause status
function init() {
    mp.game.pad.setDisableControlActionBatch(true, CONTROLS_TO_DISABLE);

    // get current pause status from the arena dummy (there should be only one dummy with DUMMY_TYPE_ARENA)
    mp.dummies.forEachByType(DUMMY_TYPE_ARENA, (dummy) => {
        isGamePaused = dummy.getVariable("bGamePause");
    });
}

// applies the disable control batch to "pause" gameplay
function handleControls() {
    if (!isGamePaused) {
        return;
    }

    mp.game.pad.applyDisableControlActionBatch();
}

// handles game pause changes
function handleGamePauseChange(entity, newPause) {
    if (entity.typeInt !== 9 /* dummy */ || entity.dummyType !== DUMMY_TYPE_ARENA) {
        return;
    }

    isGamePaused = newPause;

    // play a sound
    if (isGamePaused) {
        mp.game.audio.playSoundFrontend(-1, "Finish_Default", "DLC_AW_Frontend_Sounds", true);
    } else {
        makeAnnouncement(GO_LINES[getRandomInt(0, GO_LINES.length)]);
        mp.game.audio.playSoundFrontend(-1, "Start", "DLC_AW_Frontend_Sounds", true);
    }
}

// register event handlers
mp.events.add({
    "playerReady": init,
    "render": handleControls
});

// register data change handlers
mp.events.addDataHandler("bGamePause", handleGamePauseChange);
