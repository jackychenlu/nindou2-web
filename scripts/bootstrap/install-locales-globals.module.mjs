import {
  roomControlModeLabels,
  roomRuleModeLabels,
  roomDeathModeLabels,
  roomLocaleText,
  roomLocale,
  localizedWeaponLabel,
  localizedControlModeLabel,
  localizedNinjuLabel,
  localizedNinjuTypeLabel,
  roomTeamLabel,
  localizedCountdownText,
  localizedRuleModeLabel,
  localizedDeathModeLabel,
  localizedNinjuFontSize,
} from "../data/locales.module.mjs";

export function installLocaleGlobals(target = globalThis) {
  target.roomControlModeLabels = roomControlModeLabels;
  target.roomRuleModeLabels = roomRuleModeLabels;
  target.roomDeathModeLabels = roomDeathModeLabels;
  target.roomLocaleText = roomLocaleText;
  target.roomLocale = roomLocale;
  target.localizedWeaponLabel = localizedWeaponLabel;
  target.localizedControlModeLabel = localizedControlModeLabel;
  target.localizedNinjuLabel = localizedNinjuLabel;
  target.localizedNinjuTypeLabel = localizedNinjuTypeLabel;
  target.roomTeamLabel = roomTeamLabel;
  target.localizedCountdownText = localizedCountdownText;
  target.localizedRuleModeLabel = localizedRuleModeLabel;
  target.localizedDeathModeLabel = localizedDeathModeLabel;
  target.localizedNinjuFontSize = localizedNinjuFontSize;
  target.NindouLocales = {
    controlModeLabels: roomControlModeLabels,
    ruleModeLabels: roomRuleModeLabels,
    deathModeLabels: roomDeathModeLabels,
    localeText: roomLocaleText,
    roomLocale,
    localizedWeaponLabel,
    localizedControlModeLabel,
    localizedNinjuLabel,
    localizedNinjuTypeLabel,
    roomTeamLabel,
    localizedCountdownText,
    localizedRuleModeLabel,
    localizedDeathModeLabel,
    localizedNinjuFontSize,
  };
}
