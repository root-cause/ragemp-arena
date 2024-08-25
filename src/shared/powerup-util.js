import * as PowerUpType from "../shared/PowerUpType";

export function getModelForPowerUp(type) {
    switch (type) {
        case PowerUpType.POWERUP_ARMOR:
            return "prop_ic_arm_wh";

        case PowerUpType.POWERUP_GHOST:
            return "prop_ic_ghost_wh";

        case PowerUpType.POWERUP_JUMP:
            return "prop_ic_jump_wh";

        case PowerUpType.POWERUP_REPAIR:
            return "prop_ic_repair_wh";

        default:
            return "prop_ex_random_wh";
    }
}

export function getBlipSpriteForPowerUp(type) {
    switch (type) {
        case PowerUpType.POWERUP_ARMOR:
            return 487;

        case PowerUpType.POWERUP_GHOST:
            return 484;

        case PowerUpType.POWERUP_JUMP:
            return 515;

        case PowerUpType.POWERUP_REPAIR:
            return 544;

        default:
            return 0;
    }
}
