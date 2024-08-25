export function setBit(num, position) {
    return num | (1 << position);
}

export function clearBit(num, position) {
    return num & ~(1 << position);
}

export function isBitSet(num, position) {
    return (num & (1 << position)) !== 0;
}
