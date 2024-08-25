export async function waitFor(checkFn, waitMs = 100, maxTries = 50) {
    for (let i = 0; !checkFn() && i < maxTries; i++) {
        await mp.game.waitAsync(waitMs);
    }
}

export function callScaleformMethod(scaleformHandle, methodName, ...args) {
    if (mp.game.graphics.beginScaleformMovieMethod(scaleformHandle, methodName)) {
        for (const arg of args) {
            switch (typeof arg) {
                case "boolean":
                    mp.game.graphics.scaleformMovieMethodAddParamBool(arg);
                    break;

                case "string":
                    mp.game.graphics.scaleformMovieMethodAddParamPlayerNameString(arg);
                    break;

                case "number":
                    if (Number.isInteger(arg)) {
                        mp.game.graphics.scaleformMovieMethodAddParamInt(arg);
                    } else {
                        mp.game.graphics.scaleformMovieMethodAddParamFloat(arg);
                    }

                    break;

                default:
                    throw new TypeError(`Unsupported argument type for ${methodName} - ${typeof arg}`);
            }
        }

        mp.game.graphics.endScaleformMovieMethod();
    }
}

export function makeAnnouncement(speechName, voiceName = "ARENA_ANNOUNCE1") {
    mp.game.audio.playAmbientSpeechFromPositionNative(speechName, voiceName, 2800.0, -3800.2, 179.5, "SPEECH_PARAMS_FORCE_FRONTEND");
}
