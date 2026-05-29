import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function canvasContext(target) {
  const canvas = target.document?.querySelector?.("#game");
  return {
    canvas,
    ctx: canvas?.getContext?.("2d"),
  };
}

function now(target) {
  return target.performance?.now?.() ?? performance.now();
}

export function installEffectsRendererGlobals(target = globalThis) {
  const consumableEffectFrames = (type) => {
    if (type === "regen_sp") return target.consumableRegenSpFrames;
    if (type === "magic_water") return target.consumableMagicWaterFrames;
    return [];
  };

  const consumableEffectFrameGroups = (type) => {
    const frames = consumableEffectFrames(type);
    if (type === "magic_water") return [frames, target.consumableMagicWaterEffectFrames || []];
    return [frames];
  };

  const ninjuCastFrames = (type, unit = null) => {
    if (type === "clone") {
      if (unit?.controlMode === "ai_red" || unit?.appearanceKey === "red") return target.cloneRedNinjuFrames;
      if (unit?.appearanceKey === "zhaohuo") return target.cloneZhaohuoNinjuFrames;
      if (unit?.appearanceKey === "xiahoulan") return target.cloneZhaohuoNinjuFrames;
      if (unit?.team === "grey") return target.cloneGreyNinjuFrames;
      return target.cloneNinjuFrames;
    }
    if (target.attackNinjuConfigs[type]) return target.attackNinjuConfigs[type].summonFrames;
    if (target.specialNinjuConfigs[type]) return target.specialNinjuConfigs[type].summonFrames;
    if (type === "hotBlood") return target.atkUpFrames;
    if (type === "genki") return target.regenHpSmallFrames;
    if (type === "kakki" || type === "shinki") return target.regenHpLargeFrames;
    return target.defUpFrames;
  };

  const ninjuDamageFrames = (type) => {
    if (target.attackNinjuConfigs[type]) return target.attackNinjuConfigs[type].hitFrames;
    if (target.specialNinjuConfigs[type]) return target.specialNinjuConfigs[type].hitFrames;
    if (type === "genki") return target.regenHpSmallFrames;
    if (type === "kakki" || type === "shinki") return target.regenHpLargeFrames;
    if (type === "freezeBreak") return target.smallIceBreakFrames;
    if (type === "flashMiss") return target.damageFailFrames;
    if (type === "flashHit") return target.faintedFrames;
    if (type === "flashHitHead") return target.damageSuccessSmallFrames;
    if (type === "wildfireMiddleHitHead") return target.damageSuccessMiddleFrames;
    if (type === "deathMiddleHitHead") return target.damageSuccessMiddleFrames;
    if (type === "deathBigHitHead") return target.damageSuccessBigFrames;
    if (type === "deathNinjuSuccess") return target.damageSuccessNinjuSuccessFrames;
    return [];
  };

  function ninjuDamageEffectPlacement(type) {
    if (type === "flashMiss") return { x: 0, y: 50, w: 60, h: 60 };
    if (type === "flash") return { x: 0, y: 25, w: 100, h: 100 };
    if (type === "wildfire") return { x: 0, y: 20, w: 120, h: 108 };
    if (type === "freeze") return { x: 0, y: 15, w: 125, h: 125 };
    if (type === "deathMiddleHitHead" || type === "deathBigHitHead" || type === "deathNinjuSuccess") return { x: 0, y: 50, w: 50, h: 50 };
    if (type === "flashHit") return { x: 0, y: 40, w: 55, h: 32 };
    if (type === "flashHitHead") return { x: 0, y: 50, w: 50, h: 50 };
    if (type === "wildfireMiddleHitHead") return { x: 0, y: 50, w: 50, h: 50 };
    if (type === "death") return { x: 0, y: 60, w: 110, h: 190 };
    return { x: 0, y: 22, w: 138, h: 138 };
  }

  const drawConsumableEffects = (currentNow) => {
    const state = resolveRuntimeState(target);
    const { ctx } = canvasContext(target);
    if (!state?.consumableEffects || !ctx) return;
    for (let i = state.consumableEffects.length - 1; i >= 0; i--) {
      const effect = state.consumableEffects[i];
      const elapsed = currentNow - effect.startedAt;
      const frameGroups = consumableEffectFrameGroups(effect.type);
      const frames = frameGroups.find((group) => group.length > 0) || [];
      if (elapsed >= effect.duration || frames.length === 0) {
        state.consumableEffects.splice(i, 1);
        continue;
      }
      const unit = state.units.find((candidate) => candidate.id === effect.unitId);
      if (!unit || !unit.alive) {
        state.consumableEffects.splice(i, 1);
        continue;
      }
      const frameIndex = effect.frameDurationMs
        ? Math.floor(elapsed / effect.frameDurationMs)
        : Math.floor(Math.min(0.999, elapsed / effect.duration) * frames.length);
      const p = target.unitPosition(unit);
      ctx.save();
      ctx.globalAlpha = 0.9;
      for (const group of frameGroups) {
        const frame = group[frameIndex];
        if (frame) ctx.drawImage(frame, p.x - 46, p.y - 68, 92, 92);
      }
      ctx.restore();
    }
  };

  function drawNinjuDamageEffects(currentNow) {
    const state = resolveRuntimeState(target);
    const { ctx } = canvasContext(target);
    if (!state?.ninjuDamageEffects || !ctx) return;
    for (let i = state.ninjuDamageEffects.length - 1; i >= 0; i--) {
      const effect = state.ninjuDamageEffects[i];
      
      // 1. 如果設定的時間還沒到（例如還沒到 1.5 秒），就先跳過不處理
      if (currentNow < effect.startedAt) continue;

      // 🎯 2. 核心加入點：時間到了，動畫正要顯示在螢幕上的那一刻，播放對應音效！
      if (!effect.soundPlayed) {
        if (effect.type === "flashMiss") {
          target.playSound?.("fail");      // 替換成你揮空/Miss的音效名稱
        } 
        else if (effect.type === "flashHit") {
          target.playSound?.("abc");   // 替換成你命中身體的音效名稱
        } 
        else if (effect.type === "flashHitHead") {
          target.playSound?.("dizzy");   // 替換成你命中頭部的音效名稱
        } 
  		else if (effect.type === "wildfireMiddleHitHead") {
  		  target.playSound?.("dizzy");   // 替換成你命中頭部的音效名稱
  	  } 
  		else if (effect.type === "deathBigHitHead") {
  		  target.playSound?.("dizzy");   // 替換成你命中頭部的音效名稱
  	  } 
  		else if (effect.type === "deathNinjuSuccess") {
  		  target.playSound?.("success");   // 替換成你命中頭部的音效名稱
        }
        
        // 標記為已播放，防止下一幀 (FPS) 重複觸發播放
        effect.soundPlayed = true; 
      }

      const frames = ninjuDamageFrames(effect.type);
      const elapsed = currentNow - effect.startedAt;
      if (elapsed >= effect.duration || frames.length === 0) {
        state.ninjuDamageEffects.splice(i, 1);
        continue;
      }
      const frameDuration = effect.frameDuration || effect.duration;
      const progress = Math.min(0.999, elapsed / frameDuration);
      const frame = frames[Math.floor(progress * frames.length)];
      if (!frame) continue;
      const effectTarget = state.units.find((unit) => unit.id === effect.targetId);
      const p = effectTarget && (effectTarget.alive || effectTarget.respawning)
        ? target.unitPosition(effectTarget)
        : effect.at;
      const placement = ninjuDamageEffectPlacement(effect.type);
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(frame, p.x + placement.x - placement.w / 2, p.y - placement.y - placement.h / 2, placement.w, placement.h);
      ctx.restore();
    }
  }

  // ===== Rendering: Ninjutsu Effects =====
  function drawNinjuEffects(currentNow) {
    const state = resolveRuntimeState(target);
    const { ctx } = canvasContext(target);
    if (!state?.units || !ctx) return;
    for (const unit of state.units) {
      if (!unit.alive) continue;
      const p = target.unitPosition(unit);
      if (target.isUnitCastingNinju?.(unit)) {
        const progress = Math.min(0.999, (currentNow - unit.ninju.startedAt) / unit.ninju.duration);
        const frames = ninjuCastFrames(unit.ninju.type, unit);
        const frame = frames[Math.floor(progress * frames.length)];
        if (frame) {
          ctx.save();
          ctx.globalAlpha = 0.85;
          
          // 1. 取得該忍術的完整設定檔 (可能有攻擊類或特殊類)
          const config = target.attackNinjuConfigs[unit.ninju.type] || target.specialNinjuConfigs[unit.ninju.type];
          const size = config?.castSize || 92;

          // 2. 判斷有沒有自訂的 castBox
          if (config && config.castBox) {
            // 如果有自訂 castBox，就根據角色的 p.x 和 p.y 加上你的位移與大小
            // 畫在：X + x偏移, Y + y偏移, 寬 w, 高 h
            ctx.drawImage(
              frame, 
              p.x + config.castBox.x, 
              p.y + config.castBox.y, 
              config.castBox.w, 
              config.castBox.h
            );
          } else {
            // 如果沒有自訂，就走原本預設的置中與往上偏移 22 的公式
            ctx.drawImage(frame, p.x - size / 2, p.y - 22 - size / 2, size, size);
          }

          ctx.restore();
        }
      }
    }
    drawConsumableEffects(currentNow);
    drawNinjuDamageEffects(currentNow);
  }


  const addNinjuDamageEffect = (type, effectTarget, currentNow = now(target), duration = 0, options = {}) => {
    const state = resolveRuntimeState(target);
    if (!state || !effectTarget) return;
    if (!state.ninjuDamageEffects) state.ninjuDamageEffects = [];
    const frames = ninjuDamageFrames(type);
    state.ninjuDamageEffects.push({
      type,
      targetId: effectTarget.id,
      at: target.unitPosition(effectTarget),
      startedAt: currentNow,
      duration: duration || Math.max(300, frames.length * 40),
      frameDuration: options.frameDuration || 0,
    });
  };

  Object.assign(target, {
    drawNinjuEffects,
    drawConsumableEffects,
    consumableEffectFrames,
    consumableEffectFrameGroups,
    ninjuCastFrames,
    drawNinjuDamageEffects,
    ninjuDamageFrames,
    ninjuDamageEffectPlacement,
    addNinjuDamageEffect,
  });

  target.NindouEffectsRenderer = {
    drawNinjuEffects,
    drawConsumableEffects,
    consumableEffectFrames,
    consumableEffectFrameGroups,
    ninjuCastFrames,
    drawNinjuDamageEffects,
    ninjuDamageFrames,
    ninjuDamageEffectPlacement,
    addNinjuDamageEffect,
  };
}
