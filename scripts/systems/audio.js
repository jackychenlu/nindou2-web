// ===== Audio =====
function currentBattleBgm() {
  const mapDefinition = currentRoomMapDefinition();
  return bgmBySrc(mapDefinition?.battleBgmSrc || defaultBattleBgmSrc) || defaultBattleBgm;
}

function activeBgm() {
  if (state.result) return null;
  return state.inRoom ? roomBgm : currentBattleBgm();
}

function stopBgm(audio) {
  audio.pause();
  audio.currentTime = 0;
}

function syncBgm() {
  const active = activeBgm();
  if (active !== roomBgm && !roomBgm.paused) stopBgm(roomBgm);
  Object.values(battleBgmsBySrc).forEach((audio) => {
    if (audio !== active && !audio.paused) stopBgm(audio);
  });
}

function startBgm() {
  syncBgm();
  const bgm = activeBgm();
  if (!bgm || !bgm.paused) return;
  bgm.play().catch(() => {
    setMessage("請先點一下遊戲畫面以啟動背景音樂。");
  });
}

function applyVolumeControls() {
  if (typeof musicVolumeInput !== "undefined" && musicVolumeInput) {
    const volume = Number(musicVolumeInput.value) / 100;
    roomBgm.volume = volume;
    Object.values(battleBgmsBySrc).forEach((audio) => {
      audio.volume = volume;
    });
  }
  if (typeof sfxVolumeInput !== "undefined" && sfxVolumeInput) {
    const volume = Number(sfxVolumeInput.value) / 100;
    Object.values(sounds).forEach((sound) => {
      sound.volume = volume;
    });
  }
}

function playSound(key) {
  const sound = sounds[key];
  if (!sound) return null;
  const instance = sound.cloneNode();
  instance.volume = sound.volume;
  instance.play().catch(() => {});
  return instance;
}

function playBreakSound(object) {
  if (object.type === "vase") {
    playSound("breakVase");
  } else if (object.type === "chest") {
    playSound("breakChest");
  } else {
    playSound("breakDefault");
  }
}

globalThis.NindouAudio = {
  currentBattleBgm,
  activeBgm,
  stopBgm,
  syncBgm,
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
    });
    const localCurrentBattleBgmSrc = (definition) => definition?.battleBgmSrc || defaultBattleBgmSrc;
    const localActiveBgmKey = ({ stateLike = {}, mapDefinition: definition = {} } = {}) => {
      if (stateLike.result) return null;
      return stateLike.inRoom ? "room" : localCurrentBattleBgmSrc(definition);
    };
    const localStopBgm = (audio) => {
      audio.pause();
      audio.currentTime = 0;
    };
    const localSyncBgm = ({ active, roomBgm: localRoomBgm, battleBgmsBySrc: localBattleBgmsBySrc = {} }) => {
      const stopped = [];
      if (active !== localRoomBgm && localRoomBgm && !localRoomBgm.paused) {
        localStopBgm(localRoomBgm);
        stopped.push("room");
      }
      Object.entries(localBattleBgmsBySrc).forEach(([key, audio]) => {
        if (audio !== active && !audio.paused) {
          localStopBgm(audio);
          stopped.push(key);
        }
      });
      return stopped;
    };
    const localApplyMusicVolume = ({ roomBgm: localRoomBgm, battleBgmsBySrc: localBattleBgmsBySrc = {}, value }) => {
      const volume = Number(value) / 100;
      if (localRoomBgm) localRoomBgm.volume = volume;
      Object.values(localBattleBgmsBySrc).forEach((audio) => {
        audio.volume = volume;
      });
      return volume;
    };
    const localApplySfxVolume = ({ sounds: localSounds = {}, value }) => {
      const volume = Number(value) / 100;
      Object.values(localSounds).forEach((sound) => {
        sound.volume = volume;
      });
      return volume;
    };
    const localPlaySound = (localSounds, key) => {
      const sound = localSounds[key];
      if (!sound) return null;
      const instance = sound.cloneNode();
      instance.volume = sound.volume;
      instance.play().catch(() => {});
      return instance;
    };
    const localBreakSoundKey = (object) => {
      if (object.type === "vase") return "breakVase";
      if (object.type === "chest") return "breakChest";
      return "breakDefault";
    };
    const localRoomBgm = makeAudio(false);
    const battleA = makeAudio(false);
    const battleB = makeAudio(true);
    const localSounds = { breakVase: makeAudio(true), missingVolume: makeAudio(true) };
    const played = localPlaySound(localSounds, "breakVase");
    return {
      roomActive: localActiveBgmKey({ stateLike: { inRoom: true }, mapDefinition }),
      battleActive: localActiveBgmKey({ stateLike: { inRoom: false }, mapDefinition }),
      resultActive: localActiveBgmKey({ stateLike: { result: { winner: "blue" } }, mapDefinition }),
      stopped: localSyncBgm({ active: battleB, roomBgm: localRoomBgm, battleBgmsBySrc: { battleA, battleB } }),
      roomPaused: localRoomBgm.paused,
      battleAPaused: battleA.paused,
      musicVolume: localApplyMusicVolume({ roomBgm: localRoomBgm, battleBgmsBySrc: { battleA, battleB }, value: 35 }),
      sfxVolume: localApplySfxVolume({ sounds: localSounds, value: 40 }),
      playedVolume: played?.volume,
      missingSound: localPlaySound(localSounds, "missing") === null,
      vaseSound: localBreakSoundKey({ type: "vase" }),
      chestSound: localBreakSoundKey({ type: "chest" }),
      defaultSound: localBreakSoundKey({ type: "tree" }),
    };
  },
};
