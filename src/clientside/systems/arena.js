import { DUMMY_TYPE_ARENA } from "../../shared/DummyType";
import { waitFor } from "../util";
import { getEntitySetForVariation, getEntitySetForLighting, getTimecycleModifierForLighting } from "../../shared/arena-util";

const ARENA_INTERIOR_HASH = mp.game.joaat("xs_x18_int_01");
const ARENA_ROOM_HASH = mp.game.joaat("Arena_Room");

const ALL_ENTITY_SETS = [
    "set_centreline_dystopian_05", "set_centreline_scifi_05", "set_centreline_wasteland_05",
    "set_crowd_a", "set_crowd_b", "set_crowd_c", "set_crowd_d",
    "set_dystopian_01", "set_dystopian_02", "set_dystopian_03", "set_dystopian_04", "set_dystopian_05",
    "set_dystopian_06", "set_dystopian_07", "set_dystopian_08", "set_dystopian_09", "set_dystopian_10",
    "set_dystopian_11", "set_dystopian_12", "set_dystopian_13", "set_dystopian_14", "set_dystopian_15",
    "set_dystopian_16", "set_dystopian_17",
    "set_lights_atlantis", "set_lights_evening", "set_lights_hell", "set_lights_midday",
    "set_lights_morning", "set_lights_night", "set_lights_saccharine", "set_lights_sandstorm",
    "set_lights_sfnight", "set_lights_storm", "set_lights_toxic",
    "set_pit_fence_closed", "set_pit_fence_demolition", "set_pit_fence_oval", "set_pit_fence_ovala",
    "set_pit_fence_ovalb", "set_pit_fence_wall", "set_wall_no_pit",
    "set_scifi_01", "set_scifi_02", "set_scifi_03", "set_scifi_04", "set_scifi_05",
    "set_scifi_06", "set_scifi_07", "set_scifi_08", "set_scifi_09", "set_scifi_10",
    "set_team_band_a", "set_team_band_b", "set_team_band_c", "set_team_band_d",
    "set_wasteland_01", "set_wasteland_02", "set_wasteland_03", "set_wasteland_04", "set_wasteland_05",
    "set_wasteland_06", "set_wasteland_07", "set_wasteland_08", "set_wasteland_09", "set_wasteland_10",
    "set_dystopian_scene", "set_scifi_scene", "set_wasteland_scene",
    "set_turrets", "set_turrets_scifi", "set_turrets_wasteland",
];

const REQUIRED_ENTITY_SETS = [
    "set_crowd_a", "set_crowd_b", "set_crowd_c", "set_crowd_d",
    "set_pit_fence_demolition"
];

function getArenaInteriorId() {
    return mp.game.interior.getAtCoordsWithTypehash(2800.0, -3800.0, 100.0, ARENA_INTERIOR_HASH);
}

function keepEntityInArena(entityHandle, interiorId) {
    mp.game.interior.forceRoomForEntity(entityHandle, interiorId, ARENA_ROOM_HASH);
    mp.game.interior.unk._0x82EBB79E258FA2B7(entityHandle, interiorId); // INTERIOR::RETAIN_ENTITY_IN_INTERIOR
}

function changeArenaStyle(variationIndex, lightingIndex, oldVariationIndex, oldLightingIndex) {
    const interiorId = getArenaInteriorId();

    // main entityset
    if (oldVariationIndex > -1) {
        mp.game.interior.deactivateEntitySet(interiorId, getEntitySetForVariation(oldVariationIndex));
    }

    mp.game.interior.activateEntitySet(interiorId, getEntitySetForVariation(variationIndex));

    // lighting entityset & timecycle modifier
    if (oldLightingIndex > -1) {
        const wasFutureShock = oldVariationIndex >= 21 && oldVariationIndex <= 30;
        mp.game.interior.deactivateEntitySet(interiorId, getEntitySetForLighting(oldLightingIndex, wasFutureShock));
    }

    const isFutureShock = variationIndex >= 21 && variationIndex <= 30;
    mp.game.interior.activateEntitySet(interiorId, getEntitySetForLighting(lightingIndex, isFutureShock));
    mp.game.graphics.setTimecycleModifier(getTimecycleModifierForLighting(lightingIndex, isFutureShock));
    mp.game.graphics.setTimecycleModifierStrength(1.0);

    // apply radar variation
    radarVariation = variationIndex;

    // apply the changes and place entities back inside
    mp.game.interior.refresh(interiorId);
    mp.players.streamed.forEach(player => keepEntityInArena(player.handle, interiorId));
    mp.vehicles.streamed.forEach(vehicle => keepEntityInArena(vehicle.handle, interiorId));
    mp.objects.streamed.forEach(object => keepEntityInArena(object.handle, interiorId));
}

let radarVariation = 0;

// loads the arena and applies the active arena style
async function init() {
    mp.game.zone.setEnabled(mp.game.zone.getFromNameId("PrLog"), false);

    // load the arena IPL
    if (!mp.game.streaming.isIplActive("xs_arena_interior")) {
        mp.game.streaming.requestIpl("xs_arena_interior");
        await waitFor(() => mp.game.streaming.isIplActive("xs_arena_interior"));
    }

    // load the interior
    const interiorId = getArenaInteriorId();
    if (!mp.game.interior.isReady(interiorId)) {
        mp.game.interior.pinInMemory(interiorId);

        await waitFor(() => mp.game.interior.isReady(interiorId));

        mp.game.interior.disable(interiorId, false);
        mp.game.interior.cap(interiorId, false);
    }

    // clean up the interior
    ALL_ENTITY_SETS.forEach(entitySet => mp.game.interior.deactivateEntitySet(interiorId, entitySet));
    REQUIRED_ENTITY_SETS.forEach(entitySet => mp.game.interior.activateEntitySet(interiorId, entitySet));

    // get current style data from the arena dummy (there should be only one dummy with DUMMY_TYPE_ARENA)
    mp.dummies.forEachByType(DUMMY_TYPE_ARENA, (dummy) => {
        const styleBits = dummy.getVariable("iStyle");
        changeArenaStyle((styleBits >> 8) & 255, styleBits & 255, -1, -1);
    });

    // weapon damages
    mp.game.weapon.setDamageModifierThisFrame(mp.game.joaat("VEHICLE_WEAPON_RCTANK_ROCKET"), 20.0);

    // arena misc.
    mp.game.audio.setStaticEmitterEnabled("SE_DLC_AW_Arena_Crowd_Background_Main", true);
    mp.game.invoke(0xAA6A6098851C396Fn, true); // PHYSICS::SET_IN_ARENA_MODE

    // let the server know the local player is ready
    mp.events.callRemote("arena::mom_i_wanna_play");
}

// draws the radar for the current arena
function renderArenaRadar() {
    mp.game.interior.unk._0x7ECDF98587E92DEC(1); // INTERIOR::ENABLE_STADIUM_PROBES_THIS_FRAME
    mp.game.hud.setRadarAsInteriorThisFrame(ARENA_INTERIOR_HASH, 2800.0, -3800.0, 0.0, radarVariation);
    mp.game.hud.hideMinimapExteriorMapThisFrame();
}

// applies the new arena style
function handleArenaStyleChange(entity, newStyleBits, oldStyleBits) {
    if (entity.typeInt !== 9 /* dummy */ || entity.dummyType !== DUMMY_TYPE_ARENA) {
        return;
    }

    changeArenaStyle((newStyleBits >> 8) & 255, newStyleBits & 255, (oldStyleBits >> 8) & 255, oldStyleBits & 255);
}

// register event handlers
mp.events.add({
    "playerReady": init,
    "playerSpawn": () => keepEntityInArena(mp.players.local.handle, getArenaInteriorId()),
    "entityStreamIn": (entity) => keepEntityInArena(entity.handle, getArenaInteriorId()),
    "render": renderArenaRadar
});

// register data change handlers
mp.events.addDataHandler("iStyle", handleArenaStyleChange);
