import {
  currentBattleBgmSrc,
  activeBgmKey,
  stopBgm,
  syncBgm,
  applyMusicVolume,
  applySfxVolume,
  playSound as playSoundFromMap,
  breakSoundKey,
} from "../systems/audio.module.mjs";
import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

export function installAudioGlobals(target = globalThis) {
  const currentBattleBgm = () => {
    const src = currentBattleBgmSrc(target.currentRoomMapDefinition?.() || {});
    return target.bgmBySrc?.(src) || target.defaultBattleBgm;
  };
  const activeBgm = () => {
    const key = activeBgmKey({
      stateLike: resolveRuntimeState(target),
      mapDefinition: target.currentRoomMapDefinition?.() || {},
    });
    if (!key) return null;
    return key === "room" ? target.roomBgm : currentBattleBgm();
  };
  const syncBgmRuntime = () => syncBgm({
    active: activeBgm(),
    roomBgm: target.roomBgm,
    battleBgmsBySrc: target.battleBgmsBySrc,
  });
  const startBgm = () => {
    syncBgmRuntime();
    const bgm = activeBgm();
    if (!bgm || !bgm.paused) return;
    bgm.play().catch(() => {
      target.setMessage?.("請先點一下遊戲畫面以啟動背景音樂。");
    });
  };
  const applyVolumeControls = () => {
    if (typeof target.musicVolumeInput !== "undefined" && target.musicVolumeInput) {
      applyMusicVolume({
        roomBgm: target.roomBgm,
        battleBgmsBySrc: target.battleBgmsBySrc,
        value: target.musicVolumeInput.value,
      });
    }
    if (typeof target.sfxVolumeInput !== "undefined" && target.sfxVolumeInput) {
      applySfxVolume({ sounds: target.sounds, value: target.sfxVolumeInput.value });
    }
  };
  const playSound = (key) => playSoundFromMap(target.sounds, key);
  const playBreakSound = (object) => playSound(breakSoundKey(object));

  Object.assign(target, {
    currentBattleBgm,
    activeBgm,
    stopBgm,
    syncBgm: syncBgmRuntime,
    startBgm,
    applyVolumeControls,
    playSound,
    playBreakSound,
  });

  target.NindouAudio = {
    currentBattleBgm,
    activeBgm,
    stopBgm,
    syncBgm: syncBgmRuntime,
    startBgm,
    applyVolumeControls,
    playSound,
    playBreakSound,
    runAudioHelperProbe() {
      const mapDefinition = { battleBgmSrc: "assets/sounds/bgm/忍2鬼島戰鬥.mp3" };
      const makeAudio = (paused = false) => ({
        paused,
        currentTime: 10,
        volume: 0.2,
        pauseCalled: false,
        pause() { this.pauseCalled = true; this.paused = true; },
        cloneNode() { return { volume: 0, played: false, play() { this.played = true; return Promise.resolve(); } }; },
        play() { this.played = true; return Promise.resolve(); },
      });
      const roomBgm = makeAudio(false);
      const battleA = makeAudio(false);
      const battleB = makeAudio(true);
      const sounds = { breakVase: makeAudio(true), missingVolume: makeAudio(true) };
      const played = playSoundFromMap(sounds, "breakVase");
      return {
        roomActive: activeBgmKey({ stateLike: { inRoom: true }, mapDefinition }),
        battleActive: activeBgmKey({ stateLike: { inRoom: false }, mapDefinition }),
        resultActive: activeBgmKey({ stateLike: { result: { winner: "blue" } }, mapDefinition }),
        stopped: syncBgm({ active: battleB, roomBgm, battleBgmsBySrc: { battleA, battleB } }),
        roomPaused: roomBgm.paused,
        battleAPaused: battleA.paused,
        musicVolume: applyMusicVolume({ roomBgm, battleBgmsBySrc: { battleA, battleB }, value: 35 }),
        sfxVolume: applySfxVolume({ sounds, value: 40 }),
        playedVolume: played?.volume,
        missingSound: playSoundFromMap(sounds, "missing") === null,
        vaseSound: breakSoundKey({ type: "vase" }),
        chestSound: breakSoundKey({ type: "chest" }),
        defaultSound: breakSoundKey({ type: "tree" }),
      };
    },
  };
}
