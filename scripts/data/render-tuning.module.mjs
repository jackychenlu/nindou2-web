export const eyeOffsets = {
  down: { x: -14, y: 25, w: 30, h: 13 },
  up: null,
  right: { x: 3, y: 26, w: 20, h: 15 },
  left: { x: -19, y: 26, w: 20, h: 15 },
};

export const moneyDartEyeOffsets = {
  down: { x: -13, y: 24, w: 30, h: 13 },
  up: null,
  right: { x: 2, y: 23, w: 20, h: 15 },
  left: { x: -18, y: 23, w: 20, h: 15 },
};

export const moneyDartReadyOffsets = {
  right: { dx: 3, dy: 5 },
  left: { dx: 1, dy: 5 },
  up: { dx: 3, dy: 3 },
  down: { dx: 4, dy: 4 },
};

export const moneyDartShootYCorrection = [1, 2, 3, 3, 4, 4, 5];

export const moneyDartShootFrameHeads = {
  right: { w: 20, h: 15, frames: [
    { x: 42, y: 26 },
    { x: 41, y: 26 },
    { x: 40, y: 26 },
    { x: 40, y: 26 },
    { x: 40, y: 23 },
    { x: 41, y: 23 },
    { x: 42, y: 23 },
  ] },
  left: { w: 20, h: 15, frames: [
    { x: 146, y: 26 },
    { x: 147, y: 26 },
    { x: 148, y: 26 },
    { x: 148, y: 26 },
    { x: 148, y: 23 },
    { x: 147, y: 23 },
    { x: 146, y: 23 },
  ] },
  up: { w: 30, h: 13, frames: [
    { x: 15, y: 18 },
    { x: 15, y: 16 },
    { x: 15, y: 14 },
    { x: 15, y: 17 },
    { x: 15, y: 18 },
    { x: 15, y: 18 },
    { x: 15, y: 18 },
  ] },
  down: { w: 30, h: 13, frames: [
    { x: 26, y: 27 },
    { x: 26, y: 27 },
    { x: 26, y: 28 },
    { x: 26, y: 28 },
    { x: 26, y: 28 },
    { x: 26, y: 27 },
    { x: 26, y: 27 },
  ] },
};

export const useNinjuSpriteOffset = { x: 3.1, y: -1.03 };

export const moveEffectOffsets = {
  prearrive: {
    right: { x: 0, y: 200 },
    left: { x: 0, y: 0 },
    up: { x: 0, y: 0 },
    down: { x: 0, y: 0 },
  },
  arrive: {
    right: { x: -50, y: 15 },
    left: { x: 50, y: 15 },
    up: { x: 0, y: -45 },
    down: { x: 0, y: 50 },
  },
};

export function arriveFrameOffset(dir, destX, destY, frameW, frameH) {
  switch (dir) {
    case "right": return { x: destX - frameW + 31, y: destY - 42 };
    case "left": return { x: destX - 31, y: destY - 42 };
    case "up": return { x: destX - frameW / 2, y: destY - 47 };
    case "down": return { x: destX - frameW / 2, y: destY + 15 - frameH };
    default: return { x: destX - frameW / 2, y: destY - frameH / 2 };
  }
}

export const moneyDartVisualOffsets = {
  hold: {
    handDistance: { x: 18, y: 12 },
    center: { x: 0, y: 18 },
    fallbackHalfSize: 18,
    frameScale: 1.15,
  },
  invincibleRing: {
    center: { x: 0, y: 18 },
    radius: 32,
  },
  shoot: {
    scale: 1.05,
    right: { x: -34, y: 57 },
    left: { x: 34, y: 57 },
    up: { x: 0, y: -18 },
    down: { x: 0, y: 50 },
  },
};
