import { getRandomInt } from "../../shared/util";
import { makeAnnouncement } from "../util";

const DEATH_REACTION_COOLDOWN = 3000;

const HUD_COLOUR_PLACEHOLDER_01 = 224;
const HUD_COLOUR_PLACEHOLDER_02 = 225;
const HUD_COLOUR_PLACEHOLDER_03 = 226;
const HUD_COLOUR_PLACEHOLDER_04 = 227;

let lastReactionAt = 0;

// posts the "<player> joined" message
// the player is received from the server as iColor isn't available yet in the clientside playerJoin event
function handlePlayerJoinTicker(player) {
    const playerColor = player.getVariable("iColor");
    mp.game.hud.replaceColourWithRgba(HUD_COLOUR_PLACEHOLDER_01, (playerColor >> 16) & 255, (playerColor >> 8) & 255, playerColor & 255, 255);

    mp.game.hud.beginTextCommandThefeedPost("TICK_JOIN");
    mp.game.hud.setColourOfNextTextComponent(HUD_COLOUR_PLACEHOLDER_01);
    mp.game.hud.addTextComponentSubstringPlayerName(`<C>${player.name}</C>`);
    mp.game.hud.endTextCommandThefeedPostTicker(false, false);
}

// posts a death message (and makes mr. announcer talk)
function handlePlayerDeathTicker(victim, killer) {
    const victimColor = victim.getVariable("iColor");
    mp.game.hud.replaceColourWithRgba(HUD_COLOUR_PLACEHOLDER_03, (victimColor >> 16) & 255, (victimColor >> 8) & 255, victimColor & 255, 255);

    if (killer == null || victim === killer) {
        // just "<victim> died"
        mp.game.hud.beginTextCommandThefeedPost("TICK_DIED");
        mp.game.hud.setColourOfNextTextComponent(HUD_COLOUR_PLACEHOLDER_03);
        mp.game.hud.addTextComponentSubstringPlayerName(`<C>${victim.name}</C>`);
        mp.game.hud.endTextCommandThefeedPostTicker(false, false);
    } else {
        // announcer reaction
        const now = Date.now();
        if (now - lastReactionAt >= DEATH_REACTION_COOLDOWN) {
            makeAnnouncement("ARANN_LPAA");
            lastReactionAt = now;
        }

        const tickerVariation = getRandomInt(0, 3);
        const killerColor = killer.getVariable("iColor");
        mp.game.hud.replaceColourWithRgba(HUD_COLOUR_PLACEHOLDER_04, (killerColor >> 16) & 255, (killerColor >> 8) & 255, killerColor & 255, 255);

        if (killer === mp.players.local) {
            // killer sees "you destroyed <victim>"
            mp.game.hud.beginTextCommandThefeedPost(`DM_TK_HEAVY0${tickerVariation}`);
            mp.game.hud.setColourOfNextTextComponent(HUD_COLOUR_PLACEHOLDER_03);
            mp.game.hud.addTextComponentSubstringPlayerName(`<C>${victim.name}</C>`);
            mp.game.hud.endTextCommandThefeedPostTicker(false, false);
        } else if (victim === mp.players.local) {
            // victim sees "<killer> destroyed you"
            mp.game.hud.beginTextCommandThefeedPost(`DM_TK_HEAVY1${tickerVariation}`);
            mp.game.hud.setColourOfNextTextComponent(HUD_COLOUR_PLACEHOLDER_04);
            mp.game.hud.addTextComponentSubstringPlayerName(`<C>${killer.name}</C>`);
            mp.game.hud.endTextCommandThefeedPostTicker(false, false);
        } else {
            // third party sees "<killer> destroyed <victim>"
            mp.game.hud.beginTextCommandThefeedPost(`DM_TK_HEAVY2${tickerVariation}`);
            mp.game.hud.setColourOfNextTextComponent(HUD_COLOUR_PLACEHOLDER_04);
            mp.game.hud.addTextComponentSubstringPlayerName(`<C>${killer.name}</C>`);
            mp.game.hud.setColourOfNextTextComponent(HUD_COLOUR_PLACEHOLDER_03);
            mp.game.hud.addTextComponentSubstringPlayerName(`<C>${victim.name}</C>`);
            mp.game.hud.endTextCommandThefeedPostTicker(false, false);
        }
    }
}

// posts the "<player> quit" message
function handlePlayerQuitTicker(player) {
    const playerColor = player.getVariable("iColor");
    mp.game.hud.replaceColourWithRgba(HUD_COLOUR_PLACEHOLDER_02, (playerColor >> 16) & 255, (playerColor >> 8) & 255, playerColor & 255, 255);

    mp.game.hud.beginTextCommandThefeedPost("TICK_LEFT");
    mp.game.hud.setColourOfNextTextComponent(HUD_COLOUR_PLACEHOLDER_02);
    mp.game.hud.addTextComponentSubstringPlayerName(`<C>${player.name}</C>`);
    mp.game.hud.endTextCommandThefeedPostTicker(false, false);
}

// register event handlers
mp.events.add({
    "arena::join_ticker": handlePlayerJoinTicker,
    "arena::death_ticker": handlePlayerDeathTicker,
    "playerQuit": handlePlayerQuitTicker
});
