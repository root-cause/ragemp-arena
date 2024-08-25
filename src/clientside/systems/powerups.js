import { DUMMY_TYPE_POWERUP } from "../../shared/DummyType";
import { getModelForPowerUp, getBlipSpriteForPowerUp } from "../../shared/powerup-util";

const POWERUP_ROTATION_SPEED = 90.0;
const POWERUP_LIGHT_RED = 93;
const POWERUP_LIGHT_GREEN = 182;
const POWERUP_LIGHT_BLUE = 229;
const POWERUP_LIGHT_RANGE = 3.0;
const POWERUP_LIGHT_INTENSITY = 2.0;
const POWERUP_COLLECTION_RANGE = 2.0;

function createEntitiesForPowerUpDummy(dummy) {
    const type = dummy.getVariable("iType");
    const position = dummy.getVariable("vPosition");
    dummy._collision = mp.colshapes.newSphere(position.x, position.y, position.z, POWERUP_COLLECTION_RANGE, 0);
    dummy._collision._dummyId = dummy.remoteId;

    dummy._prop = mp.objects.new(getModelForPowerUp(type), position);
    dummy._prop._isRotating = true;
    dummy._prop.notifyStreaming = true;

    dummy._blip = mp.blips.new(getBlipSpriteForPowerUp(type), position, {
        shortRange: true
    });
}

// creates entities (colshape, object and blip) for existing powerups
function init() {
    mp.dummies.forEachByType(DUMMY_TYPE_POWERUP, createEntitiesForPowerUpDummy);
}

// rotates powerup objects and draws a light at their location for visibility
function rotatePowerUps() {
    mp.objects.streamed.forEach((obj) => {
        if (!obj._isRotating) {
            return;
        }

        const heading = obj.getHeading();
        obj.setHeading(heading + (POWERUP_ROTATION_SPEED * mp.game.system.timestep()));

        const position = obj.position;
        mp.game.graphics.drawLightWithRange(position.x, position.y, position.z, POWERUP_LIGHT_RED, POWERUP_LIGHT_BLUE, POWERUP_LIGHT_GREEN, POWERUP_LIGHT_RANGE, POWERUP_LIGHT_INTENSITY);
    });
}

// creates entities for new powerups
function handlePowerUpCreation(dummyType, dummy) {
    if (dummyType !== DUMMY_TYPE_POWERUP) {
        return;
    }

    createEntitiesForPowerUpDummy(dummy);
}

// reports powerup collections to the server
function handlePowerUpCollection(colshape) {
    const dummy = mp.dummies.atRemoteId(colshape._dummyId);
    if (dummy == null || dummy.dummyType !== DUMMY_TYPE_POWERUP || mp.players.local.isDead()) {
        return;
    }

    mp.events.callRemote("arena::collect_powerup", dummy.remoteId);
}

// plays a sound and screen effect upon collecting a powerup
function handlePowerUpFlash() {
    mp.game.audio.playSoundFrontend(-1, "PICK_UP", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    mp.game.graphics.animpostfxPlay("MP_SmugglerCheckpoint", 0, false);
}

// removes entities of removed powerups
function handlePowerUpRemoval(dummyType, dummy) {
    if (dummyType !== DUMMY_TYPE_POWERUP) {
        return;
    }

    if (dummy._collision) {
        dummy._collision.destroy();
        dummy._collision = null;
    }

    if (dummy._prop) {
        dummy._prop.destroy();
        dummy._prop = null;
    }

    if (dummy._blip) {
        dummy._blip.destroy();
        dummy._blip = null;
    }
}

// register event handlers
mp.events.add({
    "playerReady": init,
    "render": rotatePowerUps,
    "playerEnterColshape": handlePowerUpCollection,
    "dummyEntityCreated": handlePowerUpCreation,
    "dummyEntityDestroyed": handlePowerUpRemoval,
    "arena::powerup_flash": handlePowerUpFlash
});
