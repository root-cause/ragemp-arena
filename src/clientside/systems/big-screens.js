import { DUMMY_TYPE_ARENA } from "../../shared/DummyType";

let screenRtId = 0;
let screenTexture = "message_01";

// loads the screen content and registers the rendertarget
function init() {
    mp.game.graphics.requestStreamedTextureDict("prop_screen_arena_giant", false);

    if (!mp.game.hud.isNamedRendertargetRegistered("bigscreen_01")) {
        mp.game.hud.registerNamedRendertarget("bigscreen_01", false);
    }

    const renderTargetModel = mp.game.joaat("xs_prop_arena_bigscreen_01");
    if (!mp.game.hud.isNamedRendertargetLinked(renderTargetModel)) {
        mp.game.hud.linkNamedRendertarget(renderTargetModel);
    }

    screenRtId = mp.game.hud.getNamedRendertargetRenderId("bigscreen_01");

    // get current screen data from the arena dummy (there should be only one dummy with DUMMY_TYPE_ARENA)
    mp.dummies.forEachByType(DUMMY_TYPE_ARENA, (dummy) => {
        const value = dummy.getVariable("iScreen");
        screenTexture = `message_${value < 10 ? `0${value}` : value}`;
    });
}

// draws the screen content
function renderBigScreens() {
    if (screenRtId === 0) {
        return;
    }

    mp.game.hud.setTextRenderId(screenRtId);
    mp.game.graphics.setScriptGfxDrawOrder(4);
    mp.game.graphics.setScriptGfxDrawBehindPausemenu(true);
    mp.game.graphics.drawInteractiveSprite("prop_screen_arena_giant", screenTexture, 0.5, 0.5, 1.0, 1.0, 0.0, 255, 255, 255, 255);
    mp.game.graphics.setScriptGfxDrawBehindPausemenu(false);
    mp.game.hud.setTextRenderId(mp.game.hud.getDefaultScriptRendertargetRenderId());
}

// changes the screen texture name
function handleScreenVariationChange(entity, newValue) {
    if (entity.typeInt !== 9 /* dummy */ || entity.dummyType !== DUMMY_TYPE_ARENA) {
        return;
    }

    screenTexture = `message_${newValue < 10 ? `0${newValue}` : newValue}`;
}

// frees the resources
function cleanUp(player) {
    if (player !== mp.players.local) {
        return;
    }

    mp.game.hud.releaseNamedRendertarget("bigscreen_01");
    mp.game.graphics.setStreamedTextureDictAsNoLongerNeeded("prop_screen_arena_giant");
}

// register event handlers
mp.events.add({
    "playerReady": init,
    "render": renderBigScreens,
    "playerQuit": cleanUp
});

// register data change handlers
mp.events.addDataHandler("iScreen", handleScreenVariationChange);
