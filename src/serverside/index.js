import { DUMMY_TYPE_ARENA, DUMMY_TYPE_POWERUP } from "../shared/DummyType";
import { getUnixTimestamp, getRandomInt } from "../shared/util";
import { getHourForLighting, getWeatherForLighting } from "../shared/arena-util";
import { setBit, isBitSet } from "../shared/bit-util";
import * as PowerUpType from "../shared/PowerUpType";

// constants
const MAX_VARIATION = 30;
const MAX_LIGHTING_VARIATION = 10;
const MAX_SCREEN_VARIATION = 30;

const SPAWN_COORDS = [
    { position: new mp.Vector3(2845.0, -3910.5, 140.0), heading: 0.0 },
    { position: new mp.Vector3(2835.0, -3910.5, 140.0), heading: 0.0 },
    { position: new mp.Vector3(2825.0, -3910.5, 140.0), heading: 0.0 },
    { position: new mp.Vector3(2815.0, -3910.5, 140.0), heading: 0.0 },
    { position: new mp.Vector3(2805.0, -3910.5, 140.0), heading: 0.0 },
    { position: new mp.Vector3(2795.0, -3910.5, 140.0), heading: 0.0 },
    { position: new mp.Vector3(2785.0, -3910.5, 140.0), heading: 0.0 },
    { position: new mp.Vector3(2775.0, -3910.5, 140.0), heading: 0.0 },
    { position: new mp.Vector3(2765.0, -3910.5, 140.0), heading: 0.0 },
    { position: new mp.Vector3(2755.0, -3910.5, 140.0), heading: 0.0 },
    { position: new mp.Vector3(2845.0, -3689.5, 140.0), heading: 180.0 },
    { position: new mp.Vector3(2835.0, -3689.5, 140.0), heading: 180.0 },
    { position: new mp.Vector3(2825.0, -3689.5, 140.0), heading: 180.0 },
    { position: new mp.Vector3(2815.0, -3689.5, 140.0), heading: 180.0 },
    { position: new mp.Vector3(2805.0, -3689.5, 140.0), heading: 180.0 },
    { position: new mp.Vector3(2795.0, -3689.5, 140.0), heading: 180.0 },
    { position: new mp.Vector3(2785.0, -3689.5, 140.0), heading: 180.0 },
    { position: new mp.Vector3(2775.0, -3689.5, 140.0), heading: 180.0 },
    { position: new mp.Vector3(2765.0, -3689.5, 140.0), heading: 180.0 },
    { position: new mp.Vector3(2755.0, -3689.5, 140.0), heading: 180.0 }
];

const PLAYER_SPAWN_OFFSET = new mp.Vector3(0.0, 0.0, 5.0);
const POWERUP_SPAWN_OFFSET = new mp.Vector3(0.0, 0.0, 0.66);

// config
const ROUND_SECONDS = mp.config["arena.round_seconds"] || 600; // default: 600 seconds (10 minutes)
const ROUND_WAIT_SECONDS = mp.config["arena.round_wait_seconds"] || 10; // default: 10 seconds
const RESPAWN_SECONDS = mp.config["arena.respawn_seconds"] || 4; // default: 4 seconds
const POWERUP_CHANCE = mp.config["arena.powerup_chance"] || 0.33; // default: 33%
const POWERUP_SECONDS = mp.config["arena.powerup_seconds"] || 60; // default: 60 seconds

function startNewRound() {
    // destroy powerups
    const allDummies = mp.dummies.toArray();
    for (const dummy of allDummies) {
        if (dummy.dummyType === DUMMY_TYPE_POWERUP) {
            dummy.destroy();
        }
    }

    // reset player stats and respawn
    mp.players.forEach((player) => {
        player.setVariables({
            "iKills": 0,
            "iDeaths": 0
        });

        spawnPlayerInArena(player);
    });

    // generate new arena style
    const newVariation = getRandomInt(1, MAX_VARIATION);
    const newLighting = getRandomInt(0, MAX_LIGHTING_VARIATION);
    const newScreenVariation = getRandomInt(1, MAX_SCREEN_VARIATION);
    const now = getUnixTimestamp();

    // apply arena changes
    g_arena.setVariables({
        "iStyle": (newVariation << 8) | newLighting,
        "iScreen": newScreenVariation,
        "iGameStart": now,
        "iGameEnd": now + ROUND_SECONDS,
        "bGamePause": false
    });

    // apply world changes
    mp.world.weather = getWeatherForLighting(newLighting);
    mp.world.time.set(getHourForLighting(newLighting), 0, 0);

    // end the round when the time comes
    setTimeout(endRound, ROUND_SECONDS * 1000);
}

function endRound() {
    mp.players.broadcast(`The round is over! A new round will begin in ${ROUND_WAIT_SECONDS} seconds...`);
    g_arena.setVariable("bGamePause", true);

    setTimeout(startNewRound, ROUND_WAIT_SECONDS * 1000);
}

function spawnPlayerInArena(player) {
    if (!mp.players.exists(player)) {
        return;
    }

    const vehicle = mp.vehicles.at(player.getOwnVariable("iVehicle"));
    if (vehicle == null) {
        return;
    }

    const randomSpawn = SPAWN_COORDS[getRandomInt(0, SPAWN_COORDS.length)];
    player.spawn(randomSpawn.position.add(PLAYER_SPAWN_OFFSET), randomSpawn.heading);

    vehicle.setMod(16, -1);
    vehicle.setVariable("iPowerUps", 0);
    vehicle.spawn(randomSpawn.position, randomSpawn.heading);
}

// event handlers
function onPlayerJoin(player) {
    player.setVariables({
        "iColor": Math.floor(Math.random() * 0xFFFFFF),
        "iKills": 0,
        "iDeaths": 0
    });
}

function onPlayerChat(player, message) {
    const playerColor = player.getVariable("iColor").toString(16).padStart(6, '0');
    mp.players.broadcast(`!{#${playerColor}}${player.name}: !{#FFFFFF}${message}`);
}

function onPlayerDeath(player, reason, killer) {
    // broadcast death
    mp.players.call("arena::death_ticker", [player, killer]);

    // update kills/deaths
    const wasKilled = killer && player !== killer;
    if (wasKilled) {
        killer.setVariable("iKills", killer.getVariable("iKills") + 1);
    }

    player.setVariable("iDeaths", player.getVariable("iDeaths") + 1);

    // if killed by someone, drop a random powerup
    if (wasKilled && Math.random() < POWERUP_CHANCE) {
        const powerUpDummy = mp.dummies.new(DUMMY_TYPE_POWERUP, 0, {
            "iType": getRandomInt(0, PowerUpType.NUM_POWERUPS),
            "vPosition": player.position.add(POWERUP_SPAWN_OFFSET)
        });

        setTimeout(() => {
            if (mp.dummies.exists(powerUpDummy)) {
                powerUpDummy.destroy();
            }
        }, POWERUP_SECONDS * 1000);
    }

    // respawn player
    setTimeout(() => spawnPlayerInArena(player), RESPAWN_SECONDS * 1000);
}

function onPlayerQuit(player) {
    const vehicle = mp.vehicles.at(player.getOwnVariable("iVehicle"));
    if (vehicle) {
        vehicle.destroy();
    }
}

function onPlayerPlayRequest(player) {
    // ignore as the player already has a minitank
    if (player.getOwnVariable("iVehicle") !== null) {
        return;
    }

    mp.players.call("arena::join_ticker", [player]);

    // spawn the player and their minitank
    const randomSpawn = SPAWN_COORDS[getRandomInt(0, SPAWN_COORDS.length)];
    player.spawn(randomSpawn.position.add(PLAYER_SPAWN_OFFSET), randomSpawn.heading);

    const vehicle = mp.vehicles.new("minitank", randomSpawn.position, {
        engine: true,
        heading: randomSpawn.heading
    });

    vehicle.setMod(10, 1);
    vehicle.setMod(16, -1);
    vehicle.setVariable("iPowerUps", 0);

    // TODO: use mp.vehicles.new's color property once the rgb bug is fixed
    const playerColor = player.getVariable("iColor");
    vehicle.setColorRGB(
        (playerColor >> 16) & 255, (playerColor >> 8) & 255, playerColor & 255,
        (playerColor >> 16) & 255, (playerColor >> 8) & 255, playerColor & 255
    );

    player.setOwnVariable("iVehicle", vehicle.id);
}

function onPlayerCollectPowerUp(player, dummyId) {
    // players without a vehicle or dead vehicle cannot collect powerups
    const vehicle = mp.vehicles.at(player.getOwnVariable("iVehicle"));
    if (vehicle == null || vehicle.dead) {
        return;
    }

    // validate the powerup existing
    const dummy = mp.dummies.at(dummyId);
    if (dummy == null || dummy.dummyType !== DUMMY_TYPE_POWERUP) {
        return;
    }

    const type = dummy.getVariable("iType");
    let collected = false;

    switch (type) {
        case PowerUpType.POWERUP_ARMOR:
        case PowerUpType.POWERUP_GHOST:
        case PowerUpType.POWERUP_JUMP:
            const powerUpBits = vehicle.getVariable("iPowerUps");
            if (!isBitSet(powerUpBits, type)) {
                vehicle.setVariable("iPowerUps", setBit(powerUpBits, type));
                collected = true;

                if (type === PowerUpType.POWERUP_ARMOR) {
                    vehicle.setMod(16, 4);
                }
            }

            break;

        case PowerUpType.POWERUP_REPAIR:
            vehicle.repair();
            collected = true;
            break;

        default:
            console.log(`[!] Unknown powerup (type: ${type}) was collected by ${player.name} (${player.id})!`);
            break;
    }

    if (collected) {
        player.callUnreliable("arena::powerup_flash");
        dummy.destroy();
    }
}

// print config
console.log("[ARENA] Round time:", ROUND_SECONDS, "seconds");
console.log("[ARENA] Round wait time:", ROUND_WAIT_SECONDS, "seconds");
console.log("[ARENA] Respawn time:", RESPAWN_SECONDS, "seconds");
console.log("[ARENA] Powerup drop chance:", POWERUP_CHANCE * 100.0, "percent");
console.log("[ARENA] Powerup life time:", POWERUP_SECONDS, "seconds");

// initialize arena
const g_arena = mp.dummies.new(DUMMY_TYPE_ARENA, 0);
startNewRound();

// register event handlers
mp.events.add({
    "playerJoin": onPlayerJoin,
    "playerChat": onPlayerChat,
    "playerDeath": onPlayerDeath,
    "playerQuit": onPlayerQuit,
    "arena::mom_i_wanna_play": onPlayerPlayRequest,
    "arena::collect_powerup": onPlayerCollectPowerUp
});

// register commands
mp.events.addCommand("giveup", (player) => {
    if (g_arena.getVariable("bGamePause")) {
        player.outputChatBox("Cannot use this command between rounds.");
        return;
    }

    player.health = 0;
});
