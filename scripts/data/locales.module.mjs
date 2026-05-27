import { ninjuByType } from "./ninjutsu-definitions.module.mjs";

export const roomControlModeLabels = {
  player: "玩家",
  ai_beginner: "初心者",
  ai_red: "赤組",
  ai_tachi_master: "太刀達人",
  ai_money_dart_master: "錢鏢神人",
  ai_dart_only_master: "尬鏢神人",
  ai_god: "神人",
};

export function roomLocale() {
  return roomLocaleText;
}

export function localizedWeaponLabel(weapon) {
  return weapon.label;
}

export function localizedControlModeLabel(mode) {
  return roomControlModeLabels[mode] || mode;
}

export function localizedNinjuLabel(ninju) {
  return ninju.label;
}

export function localizedNinjuTypeLabel(type) {
  const ninju = ninjuByType[type];
  if (!ninju) return type;
  return localizedNinjuLabel(ninju);
}

export function roomTeamLabel(team) {
  if (team === "blue") return "青組";
  if (team === "grey") return "灰組";
  return team;
}

export function localizedCountdownText(step) {
  const text = roomLocale();
  if (step === 3) return text.countdown3;
  if (step === 2) return text.countdown2;
  if (step === 1) return text.countdown1;
  return text.countdownStart;
}

export function localizedRuleModeLabel(modeKey) {
  return roomRuleModeLabels[modeKey] || roomRuleModeLabels.original;
}

export function localizedDeathModeLabel(modeKey) {
  return roomDeathModeLabels[modeKey] || roomDeathModeLabels.death_command;
}

export function localizedNinjuFontSize(size) {
  return size;
}

export const roomRuleModeLabels = {
  original: "忍2原版",
  modified: "忍2修改",
};

export const roomDeathModeLabels = {
  death_command: "絕命指令",
  death_heal: "絕命回血",
};

export const roomLocaleText = {
  htmlLang: "zh-Hant",
  roomScreen: "房間畫面",
  ruleMode: "忍2原版",
  modeLabel: "模式",
  modeValue: "絕命指令",
  leave: "離開",
  teams: "隊伍",
  edit: "編輯",
  editNinjutsu: "編輯",
  shop: "商店",
  shopAria: "商店",
  shopTitle: "商品一覽",
  shopTotal: "總金額:",
  blueTeam: "青組",
  greyTeam: "灰組",
  playerCards: "玩家卡片",
  remove: "刪除",
  add: "新增",
  hp: "血量",
  control: "控制",
  weapon: "武器",
  startBattle: "戰鬥開始",
  mapSelect: "地圖",
  chat: "聊天",
  general: "一般",
  send: "送",
  modePanel: "模式",
  randomMode: "隨機忍二系列",
  editSettings: "編輯設定",
  gameSettings: "遊戲設定",
  volume: "音量",
  music: "音樂",
  sfx: "音效",
  ninjuEditor: "忍術編輯",
  emptySlot: "空",
  nickname: "暱稱",
  change: "更改",
  level: "段數",
  role: "職業",
  guild: "所屬公會",
  guildName: "管理團隊",
  roleName: "夜遊神",
  wins: "勝績",
  losses: "敗績",
  gold: "金",
  rep: "德",
  editCategories: "編輯分類",
  ninjuTab: "忍術",
  weaponTab: "武器",
  eyesTab: "眼睛",
  itemsTab: "道具",
  lookTab: "外觀",
  defaultLookOption: "預設外觀",
  redLookOption: "赤組",
  zhaohuoLookOption: "趙活",
  ninjuSeries: "忍術系別",
  healSeries: "回復系",
  supportSeries: "輔助系",
  attackSeries: "攻擊系",
  specialSeries: "特殊系",
  transformSeries: "變身系",
  chooseNinju: "請從已習得的忍術中挑選六個以便在戰鬥中使用",
  ninjuInfo: "忍術介紹",
  selectedNinju: "已選忍術",
  availableNinju: "可選忍術",
  reset: "重來",
  cancel: "取消",
  save: "儲存",
  topHudName: "玩家",
  topHudLevel: "99段",
  topHudRole: "夜遊神",
  cellLabel: "座標",
  hpBadge: "体",
  skillBadge: "技",
  weaponBadge: "武",
  repBadge: "德",
  goldBadge: "金",
  itemBadge: "道",
  ninjuBadge: "術",
  countdown3: "三",
  countdown2: "二",
  countdown1: "一",
  countdownStart: "開始！",
  victory: "勝利",
  defeat: "敗北",
  gameTime: "遊戲時間",
  resultHeaders: ["角色", "隊伍", "殺敵", "造成傷害", "承受傷害"],
  panelSkill: "技能",
  panelCell: "座標",
  ninjuCasting: "施放中",
  ninjuMovable: "可移動",
  ninjuSkillCostPrefix: "技",
  secondsSuffix: "秒",
};

export function summarizeLocaleCatalog(legacyLocale = {}) {
  const valueKindsByKey = (locale) => Object.fromEntries(
    Object.entries(locale || {}).map(([key, value]) => {
      if (Array.isArray(value)) return [key, "array"];
      return [key, typeof value];
    }),
  );
  const moduleKeys = Object.keys(roomLocaleText);
  const legacyKeys = Object.keys(legacyLocale);
  const moduleValueKinds = valueKindsByKey(roomLocaleText);
  const legacyValueKinds = valueKindsByKey(legacyLocale);
  return {
    moduleKeys,
    legacyKeys,
    moduleValueKinds,
    legacyValueKinds,
    isSynced: moduleKeys.length === legacyKeys.length
      && moduleKeys.every((key, index) => key === legacyKeys[index])
      && JSON.stringify(moduleValueKinds) === JSON.stringify(legacyValueKinds),
  };
}
