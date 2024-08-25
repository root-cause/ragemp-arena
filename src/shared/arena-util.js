import * as ArenaLighting from "./ArenaLighting";

export function getWeatherForLighting(lighting) {
    switch (lighting) {
        case ArenaLighting.LIGHTING_ATLANTIS:
        case ArenaLighting.LIGHTING_MORNING:
        case ArenaLighting.LIGHTING_SACCHARINE:
            return "CLOUDS";

        case ArenaLighting.LIGHTING_EVENING:
        case ArenaLighting.LIGHTING_NIGHT:
            return "SMOG";

        case ArenaLighting.LIGHTING_HELL:
            return "HALLOWEEN";

        case ArenaLighting.LIGHTING_MIDDAY:
            return "EXTRASUNNY";

        case ArenaLighting.LIGHTING_SANDSTORM:
        case ArenaLighting.LIGHTING_TOXIC:
            return "OVERCAST";

        case ArenaLighting.LIGHTING_STORM:
            return "CLEAR";

        default:
            return "CLOUDS";
    }
}

export function getHourForLighting(lighting) {
    switch (lighting) {
        case ArenaLighting.LIGHTING_ATLANTIS:
            return 23;

        case ArenaLighting.LIGHTING_EVENING:
        case ArenaLighting.LIGHTING_SACCHARINE:
            return 18;

        case ArenaLighting.LIGHTING_HELL:
            return 7;

        case ArenaLighting.LIGHTING_MIDDAY:
            return 15;

        case ArenaLighting.LIGHTING_MORNING:
        case ArenaLighting.LIGHTING_SANDSTORM:
            return 10;

        case ArenaLighting.LIGHTING_NIGHT:
        case ArenaLighting.LIGHTING_STORM:
            return 0;

        case ArenaLighting.LIGHTING_TOXIC:
            return 12;

        default:
            return 10;
    }
}

export function getEntitySetForVariation(variation) {
    if (variation >= 1 && variation <= 10) {
        // apocalypse theme
        return variation < 10 ? `set_dystopian_0${variation}` : `set_dystopian_${variation}`;
    } else if (variation >= 11 && variation <= 20) {
        // nightmare theme
        variation -= 10;
        return variation < 10 ? `set_wasteland_0${variation}` : `set_wasteland_${variation}`;
    } else if (variation >= 21 && variation <= 30) {
        // future shock theme
        variation -= 20;
        return variation < 10 ? `set_scifi_0${variation}` : `set_scifi_${variation}`;
    } else {
        // invalid variation
        return "set_dystopian_01";
    }
}

export function getEntitySetForLighting(lighting, isFutureShock) {
    switch (lighting) {
        case ArenaLighting.LIGHTING_ATLANTIS:
            return "set_lights_atlantis";

        case ArenaLighting.LIGHTING_EVENING:
            return "set_lights_evening";

        case ArenaLighting.LIGHTING_HELL:
            return "set_lights_hell";

        case ArenaLighting.LIGHTING_MIDDAY:
            return "set_lights_midday";

        case ArenaLighting.LIGHTING_MORNING:
            return "set_lights_morning";

        case ArenaLighting.LIGHTING_NIGHT:
            return isFutureShock ? "set_lights_sfnight" : "set_lights_night";

        case ArenaLighting.LIGHTING_SACCHARINE:
            return "set_lights_saccharine";

        case ArenaLighting.LIGHTING_SANDSTORM:
            return "set_lights_sandstorm";

        case ArenaLighting.LIGHTING_STORM:
            return "set_lights_storm";

        case ArenaLighting.LIGHTING_TOXIC:
            return "set_lights_toxic";

        default:
            return "set_lights_morning";
    }
}

export function getTimecycleModifierForLighting(lighting, isFutureShock) {
    switch (lighting) {
        case ArenaLighting.LIGHTING_ATLANTIS:
            return "MP_Arena_theme_atlantis";

        case ArenaLighting.LIGHTING_EVENING:
            return "MP_Arena_theme_evening";

        case ArenaLighting.LIGHTING_HELL:
            return "MP_Arena_theme_hell";

        case ArenaLighting.LIGHTING_MIDDAY:
            return "MP_Arena_theme_midday";

        case ArenaLighting.LIGHTING_MORNING:
            return "MP_Arena_theme_morning";

        case ArenaLighting.LIGHTING_NIGHT:
            return isFutureShock ? "MP_Arena_theme_scifi_night" : "MP_Arena_theme_night";

        case ArenaLighting.LIGHTING_SACCHARINE:
            return "MP_Arena_theme_saccharine";

        case ArenaLighting.LIGHTING_SANDSTORM:
            return "MP_Arena_theme_sandstorm";

        case ArenaLighting.LIGHTING_STORM:
            return "MP_Arena_theme_storm";

        case ArenaLighting.LIGHTING_TOXIC:
            return "MP_Arena_theme_toxic";

        default:
            return "MP_Arena_theme_morning";
    }
}
