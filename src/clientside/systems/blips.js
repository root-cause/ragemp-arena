import { isBitSet } from "../../shared/bit-util";
import { POWERUP_GHOST } from "../../shared/PowerUpType";

// creates a blip for a streamed in vehicle (that doesn't belong to the local player)
function handleVehicleBlipCreation(entity) {
    if (entity.typeInt !== 1 /* vehicle */ || entity.remoteId === mp.players.local.getVariable("iVehicle")) {
        return;
    }

    const blip = mp.game.hud.addBlipForEntity(entity.handle);
    mp.game.hud.setBlipSprite(blip, 742);
    mp.game.hud.setBlipAlpha(blip, 0);
    mp.game.hud.setBlipHiddenOnLegend(blip, true);

    // set blip color with a small delay so the custom primary color is available
    setTimeout(() => {
        if (!mp.vehicles.exists(entity)) {
            return;
        }

        const vehicleColor = entity.getCustomPrimaryColour();
        mp.game.hud.setBlipColour(blip, (vehicleColor.r << 24) | (vehicleColor.g << 16) | (vehicleColor.b << 8) | 255);
        mp.game.hud.setBlipAlpha(blip, isBitSet(entity.getVariable("iPowerUps"), POWERUP_GHOST) ? 0 : 255);
    }, 300);
}

// rotates streamed vehicle blips to match vehicle heading
function rotateVehicleBlips() {
    mp.vehicles.streamed.forEach((vehicle) => {
        const blip = mp.game.hud.getBlipFromEntity(vehicle.handle);
        if (blip === 0) {
            return;
        }

        mp.game.hud.setBlipSquaredRotation(blip, vehicle.getHeading());
    });
}

// hides/shows the vehicle blip based on ghost powerup state
function handleGhostPowerUp(entity, powerUpBits) {
    if (entity.handle === 0) {
        return;
    }

    const blip = mp.game.hud.getBlipFromEntity(entity.handle);
    mp.game.hud.setBlipAlpha(blip, isBitSet(powerUpBits, POWERUP_GHOST) ? 0 : 255);
}

// register event handlers
mp.events.add({
    "entityStreamIn": handleVehicleBlipCreation,
    "render": rotateVehicleBlips
});

// register data change handlers
mp.events.addDataHandler("iPowerUps", handleGhostPowerUp);
