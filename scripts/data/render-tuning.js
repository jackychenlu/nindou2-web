// 眼睛貼圖位置（相對角色中心）。X 正值往右，Y 正值往上。
// 你可以直接調這裡微調外觀。
const eyeOffsets = {
  down: { x: -14, y: 25, w: 30, h: 13 },  // 下：雙眼；x/y 是 offset，w/h 是眼睛大小。
  up: null,                                  // 上：不顯示眼睛；要顯示時改成 {x,y,w,h}。
  right: { x: 3, y: 26, w: 20, h: 15 },   // 右：單眼；x 加大往右、y 加大往上。
  left: { x: -19, y: 26, w: 20, h: 15 },  // 左：單眼；通常和 right 用不同 x 來貼頭型。
};

// 拿標備彈狀態的眼睛 offset（b_dart sprite 頭部位置與 idle 不同，可獨立調整）。
const moneyDartEyeOffsets = {
  down:  { x: -13, y: 24, w: 30, h: 13 },
  up:    null,
  right: { x: 2,   y: 23, w: 20, h: 15 },
  left:  { x: -18, y: 23, w: 20, h: 15 },
};

// b_dart sprite 與 idle sprite 的內容起始點差異補正（單位：canvas px）
// 讓備彈角色視覺位置完全對齊 idle，消除偏移。
const moneyDartReadyOffsets = {
  right: { dx: 3, dy: 5 },
  left:  { dx: 1, dy: 5 },
  up:    { dx: 3, dy: 3 },
  down:  { dx: 4, dy: 4 },
};

// 左右方向丟出動畫的逐幀 Y 軸補正（sprite 像素，負值=往上移）。
// 以頭部 topY 為錨點：補正各幀 sprite 內角色頭頂位置差異，減少視覺上下晃動。
const moneyDartShootYCorrection = [1, 2, 3, 3, 4, 4, 5]; // 7 frames，0-indexed

// 射出動畫逐幀眼睛位置：每個值是頭部中心相對 sprite 左上角的像素座標（未縮放）。
// sprite 尺寸：right/left=188x48, up=60x132, down=52x184。w/h 是眼睛大小。
const moneyDartShootFrameHeads = {
  right: { w: 20, h: 15, frames: [
    { x: 42, y: 26 }, // frame 1
    { x: 41, y: 26 }, // frame 2
    { x: 40, y: 26 }, // frame 3
    { x: 40, y: 26 }, // frame 4
    { x: 40, y: 23 }, // frame 5
    { x: 41, y: 23 }, // frame 6
    { x: 42, y: 23 }, // frame 7
  ]},
  left: { w: 20, h: 15, frames: [
    // 鏡像：x = 188 - right_x，y 相同
    { x: 146, y: 26 }, // frame 1
    { x: 147, y: 26 }, // frame 2
    { x: 148, y: 26 }, // frame 3
    { x: 148, y: 26 }, // frame 4
    { x: 148, y: 23 }, // frame 5
    { x: 147, y: 23 }, // frame 6
    { x: 146, y: 23 }, // frame 7
  ]},
  up: { w: 30, h: 13, frames: [
    { x: 15, y: 18 }, // frame 1
    { x: 15, y: 16 }, // frame 2
    { x: 15, y: 14 }, // frame 3
    { x: 15, y: 17 }, // frame 4
    { x: 15, y: 18 }, // frame 5
    { x: 15, y: 18 }, // frame 6
    { x: 15, y: 18 }, // frame 7
  ]},
  down: { w: 30, h: 13, frames: [
    // sprite 52x184，頭部在頂端；甩出時往下移，弧線對應 right 的 y 變化
    { x: 26, y: 27 }, // frame 1
    { x: 26, y: 27 }, // frame 2
    { x: 26, y: 28 }, // frame 3
    { x: 26, y: 28 }, // frame 4
    { x: 26, y: 28 }, // frame 5
    { x: 26, y: 27 }, // frame 6
    { x: 26, y: 27 }, // frame 7
  ]},
};

const useNinjuSpriteOffset = { x: 3.1, y: -1.03 }; // use-ninju sprite compensation: x positive moves right, y positive moves down.

// 拖曳後移動殘影 offset。X 正值往右，Y 正值往上。
// prearrive 是移動前段的速度線，arrive 是後段的角色殘影合成圖。
const moveEffectOffsets = {
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

// 依方向計算 arrive 影格繪製起點，使角色身體對齊目標格中心。
// 影格尺寸：水平方向 148x52，垂直方向 48x152 或 48x142。
function arriveFrameOffset(dir, destX, destY, frameW, frameH) {
  switch (dir) {
    case "right": return { x: destX - frameW + 31, y: destY - 42 };
    case "left":  return { x: destX - 31,          y: destY - 42 };
    case "up":    return { x: destX - frameW / 2,  y: destY - 47 };
    case "down":  return { x: destX - frameW / 2,  y: destY + 15 - frameH };
    default:      return { x: destX - frameW / 2,  y: destY - frameH / 2 };
  }
}

// 錢鏢視覺 offset。x 正值往右、y 正值往上。
// 這裡統一控制：手上準備位置、無敵黃圈、出手動畫位置。
const moneyDartVisualOffsets = {
  hold: {
    // 基準點從角色中心出發，再依面向推到手邊。
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
