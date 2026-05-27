import { defaultBattleBgmSrc } from "../data/assets.module.mjs";

export function currentBattleBgmSrc(mapDefinition = {}) {
  return mapDefinition?.battleBgmSrc || defaultBattleBgmSrc;
}

export function activeBgmKey({ stateLike = {}, mapDefinition = {} } = {}) {
  if (stateLike.result) return null;
  return stateLike.inRoom ? "room" : currentBattleBgmSrc(mapDefinition);
}

export function stopBgm(audio) {
  audio.pause();
  audio.currentTime = 0;
}

export function syncBgm({ active, roomBgm, battleBgmsBySrc = {} } = {}) {
  const stopped = [];
  if (active !== roomBgm && roomBgm && !roomBgm.paused) {
    stopBgm(roomBgm);
    stopped.push("room");
  }
  Object.entries(battleBgmsBySrc).forEach(([key, audio]) => {
    if (audio !== active && !audio.paused) {
      stopBgm(audio);
      stopped.push(key);
    }
  });
  return stopped;
}

export function applyMusicVolume({ roomBgm, battleBgmsBySrc = {}, value } = {}) {
  const volume = Number(value) / 100;
  if (roomBgm) roomBgm.volume = volume;
  Object.values(battleBgmsBySrc).forEach((audio) => {
    audio.volume = volume;
  });
  return volume;
}

export function applySfxVolume({ sounds = {}, value } = {}) {
  const volume = Number(value) / 100;
  Object.values(sounds).forEach((sound) => {
    sound.volume = volume;
  });
  return volume;
}

export function playSound(sounds = {}, key) {
  const sound = sounds[key];
  if (!sound) return null;
  const instance = sound.cloneNode();
  instance.volume = sound.volume;
  instance.play().catch(() => {});
  return instance;
}

export function breakSoundKey(object = {}) {
  if (object.type === "vase") return "breakVase";
  if (object.type === "chest") return "breakChest";
  return "breakDefault";
}

function makeAudio(paused = false) {
  return {
    paused,
    currentTime: 10,
    volume: 0.2,
    pauseCalled: false,
    pause() {
      this.pauseCalled = true;
      this.paused = true;
    },
    cloneNode() {
      return {
        volume: 0,
        played: false,
        play() {
          this.played = true;
          return Promise.resolve();
        },
      };
    },
    play() {
      this.played = true;
      return Promise.resolve();
    },
  };
}

function stable(value) {
  return JSON.stringify(value);
}

export function summarizeAudioHelpers(legacy = {}) {
  const mapDefinition = { battleBgmSrc: "assets/sounds/bgm/忍2鬼島戰鬥.mp3" };
  const roomBgm = makeAudio(false);
  const battleA = makeAudio(false);
  const battleB = makeAudio(true);
  const sounds = { breakVase: makeAudio(true), missingVolume: makeAudio(true) };
  const modulePlayed = playSound(sounds, "breakVase");
  const moduleResult = {
    roomActive: activeBgmKey({ stateLike: { inRoom: true }, mapDefinition }),
    battleActive: activeBgmKey({ stateLike: { inRoom: false }, mapDefinition }),
    resultActive: activeBgmKey({ stateLike: { result: { winner: "blue" } }, mapDefinition }),
    stopped: syncBgm({ active: battleB, roomBgm, battleBgmsBySrc: { battleA, battleB } }),
    roomPaused: roomBgm.paused,
    battleAPaused: battleA.paused,
    musicVolume: applyMusicVolume({ roomBgm, battleBgmsBySrc: { battleA, battleB }, value: 35 }),
    sfxVolume: applySfxVolume({ sounds, value: 40 }),
    playedVolume: modulePlayed?.volume,
    missingSound: playSound(sounds, "missing") === null,
    vaseSound: breakSoundKey({ type: "vase" }),
    chestSound: breakSoundKey({ type: "chest" }),
    defaultSound: breakSoundKey({ type: "tree" }),
  };
  const legacyResult = legacy.runAudioHelperProbe?.();
  return {
    moduleResult,
    legacyResult,
    isSynced: stable(moduleResult) === stable(legacyResult),
  };
}
