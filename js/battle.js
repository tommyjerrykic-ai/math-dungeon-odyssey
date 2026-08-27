/* ═══════════════ 《數境迷航》 回合制戰鬥 ═══════════════
   - 速度決定先後手；玩家選「普通攻擊」或「法術」（耗 MP）
   - 攻擊類出手 → 出題 → 答對才命中，答錯 Miss
   - 治癒術直接回血不答題；連擊術連答 2 題各計傷害
   - Boss：多階段（血量過線攻擊力提升）＋大招（每 3 回合，連答 2 題閃避/減傷） */
(function () {
  var B = GAME.Battle = {};
  var st = null;
  function $(id) { return document.getElementById(id); }

  /* 戰鬥內計時器統一管理（cleanup 時全部清除，防止幽靈回調） */
  function later(fn, ms) {
    if (!st) return 0;
    var t = setTimeout(function () {
      st.timers = st.timers.filter(function (x) { return x !== t; });
      fn();
    }, ms);
    st.timers.push(t);
    return t;
  }

  /* ── 開戰 ── */
  B.start = function (node, onComplete) {
    var region = GAME.CONFIG.regions[GAME.run.regionIdx];
    var ev = GAME.world.currentEvent || {};
    var enemy;
    if (node.type === "boss") {
      enemy = JSON.parse(JSON.stringify(GAME.CONFIG.bosses[region.boss]));
      enemy.isBoss = true;
      enemy.turnCount = 0;
    } else {
      var id = ev.monsterId || region.monsters[0];
      enemy = JSON.parse(JSON.stringify(GAME.CONFIG.monsters[id]));
    }
    enemy.maxHp = enemy.hp;

    st = {
      node: node, onComplete: onComplete, enemy: enemy, region: region,
      playerFirst: GAME.player.spd >= enemy.spd,
      weaken: 0, spr: null, timers: [], inputLock: false
    };

    GAME.state = "BATTLE";
    GAME.Raycaster.setFloorTexture(region.floorTexture);
    /* 一般戰鬥沿用目前地區的景色；只有 Boss 使用專用競技場。 */
    GAME.Raycaster.setBackdrop(enemy.isBoss ? "assets/runtime/scenes/boss-arena.png" : GAME.sceneBackdropFor(region));
    GAME.Raycaster.setWallsVisible(!enemy.isBoss);
    var viewPanel = $("view-panel");
    if (viewPanel) viewPanel.classList.add("battle-mode");
    GAME.Audio.playMusic(enemy.isBoss ? "boss" : "battle");
    GAME.Audio.sfx(enemy.isBoss ? "boss" : "confirm");
    GAME.UI.setEnemyBar(enemy.name, enemy.hp, enemy.maxHp);
    GAME.UI.showExploreMode("");
    GAME.UI.log((enemy.isBoss ? "👑 " : "") + enemy.name + " 出現了！");

    approachEnemy(function () {
      if (!st.playerFirst) {
        GAME.UI.log(enemy.name + " 速度更快，先發制人！");
        later(enemyAttack, 1100);
      } else {
        playerPrompt();
      }
    });
  };

  /* 怪物走近動畫 */
  function approachEnemy(cb) {
    var R = GAME.Raycaster, ev = GAME.world.currentEvent || {}, spr = ev.sprite || null, i;
    /* 相容舊地圖：找相同素材的最近事件精靈；新地圖會直接用 ev.sprite。 */
    if (!spr) {
      for (i = 0; i < R.sprites.length; i++) {
        if (R.sprites[i].eventSprite && R.sprites[i].spriteKey === st.enemy.sprite) { spr = R.sprites[i]; break; }
      }
    }
    if (!spr) { cb(); return; }
    st.spr = spr;
    var dx = spr.x - R.x, dy = spr.y - R.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var target = 1.25, steps = 12, k = 0;
    var sx = spr.x, sy = spr.y;
    var tx = R.x + dx / dist * target, ty = R.y + dy / dist * target;
    var timer = setInterval(function () {
      k++;
      spr.x = sx + (tx - sx) * k / steps;
      spr.y = sy + (ty - sy) * k / steps;
      if (k >= steps) { clearInterval(timer); cb(); }
    }, 40);
  }

  /* ── 玩家回合 ── */
  function playerPrompt() {
    if (!st) return;
    st.inputLock = false;
    renderSkillBar();
    GAME.UI.showSkillBar();
    GAME.UI.log("你的回合：選擇攻擊或法術");
  }

  function renderSkillBar() {
    var bar = $("skill-bar");
    bar.innerHTML = "";
    var p = GAME.player;
    addSkillBtn(bar, "⚔ 普通攻擊", "不耗 MP", "attack", false, function () { playerAction(null); });
    p.spells.forEach(function (s) {
      var btn = addSkillBtn(bar, s.icon + " " + s.name, "MP " + s.mp, "", p.mp < s.mp, function () { playerAction(s); });
      return btn;
    });
    addSkillBtn(bar, "☠ 測試秒殺", "立即結束本場", "test-kill", false, testKill);
  }
  function addSkillBtn(bar, label, sub, cls, disabled, fn) {
    var btn = document.createElement("button");
    btn.className = "pix-btn skill-btn " + cls;
    btn.innerHTML = label + (sub ? "<span class='mp-cost'>" + sub + "</span>" : "");
    btn.disabled = !!disabled;
    btn.addEventListener("click", fn);
    bar.appendChild(btn);
    return btn;
  }

  function playerAction(spell) {
    if (!st || st.inputLock) return;
    st.inputLock = true;
    var p = GAME.player;
    GAME.Audio.sfx("click");

    /* 治癒術：直接回血不答題 */
    if (spell && spell.heal) {
      p.mp -= spell.mp;
      var amt = Math.round(p.maxHp * spell.heal);
      p.hp = Math.min(p.maxHp, p.hp + amt);
      GAME.Audio.sfx("heal");
      GAME.Raycaster.spawnEffect("heal", { x: .5, y: .72, duration: 560 });
      GAME.UI.updateHud();
      GAME.UI.log("💚 回復了 " + amt + " 點血量！");
      renderSkillBar();
      later(enemyAttack, 1100);
      return;
    }

    if (spell) { p.mp -= spell.mp; GAME.UI.updateHud(); renderSkillBar(); }
    GAME.UI.log(spell ? spell.icon + " " + spell.name + "！" : "普通攻擊！");

    if (spell && spell.hits === 2) {
      /* 連擊術：連答 2 題，每對一題打一下 */
      var oks = [];
      askOnce(function (ok1) {
        oks.push(ok1);
        askOnce(function (ok2) {
          oks.push(ok2);
          var n = oks.filter(Boolean).length;
          applyPlayerHit(n > 0, spell, n);
        });
      });
      return;
    }
    askOnce(function (ok) {
      applyPlayerHit(ok, spell, ok ? 1 : 0);
    });
  }

  function askOnce(cb) {
    var q = GAME.Quiz.draw(st.region.id, GAME.run.regionIdx + 1);
    GAME.Quiz.ask(q, cb);
  }

  /* ── 傷害計算 ── */
  function calcDamage(atk, def, mult) {
    var raw = atk * mult * (0.85 + Math.random() * 0.3);
    return Math.max(1, Math.round(raw) - def);
  }
  function playerAtk() {
    var p = GAME.player;
    var boost = p.buffs && p.buffs.attack ? p.buffs.attack.amount : 0;
    return p.atk + (p.equips.weapon ? p.equips.weapon.atk : 0) + boost;
  }
  function playerDef() {
    var p = GAME.player;
    var boost = p.buffs && p.buffs.defense ? p.buffs.defense.amount : 0;
    return p.def + (p.equips.armor ? p.equips.armor.def : 0) + boost;
  }
  function gearColor(gear, fallback) {
    if (!gear) return fallback;
    if (gear.id === "sword1" || gear.id === "shield1") return [239, 159, 77];
    if (gear.id === "sword2" || gear.id === "shield2") return [227, 236, 249];
    return [105, 237, 244];
  }
  function bossPhase(e) {
    var r = e.hp / e.maxHp;
    for (var i = 0; i < e.phases.length; i++) if (r > e.phases[i].hpAbove) return e.phases[i];
    return e.phases[e.phases.length - 1];
  }
  function enemyAtk() {
    var e = st.enemy;
    return e.isBoss ? bossPhase(e).atk : e.atk;
  }

  /* ── 玩家攻擊結算 ── */
  function applyPlayerHit(ok, spell, hitTimes) {
    if (!st) return;
    var e = st.enemy, p = GAME.player;
    var phaseBefore = e.isBoss ? e.phases.indexOf(bossPhase(e)) : 0;

    if (ok && hitTimes > 0) {
      var mult = spell ? spell.mult : 1;
      var total = 0;
      for (var i = 0; i < hitTimes; i++) total += calcDamage(playerAtk(), e.def, mult);
      e.hp -= total;
      var lifeSteal = p.buffs && p.buffs.lifesteal;
      var drainText = "";
      if (lifeSteal) {
        var healed = Math.max(1, Math.round(total * lifeSteal.rate));
        p.hp = Math.min(p.maxHp, p.hp + healed);
        lifeSteal.hits--;
        if (lifeSteal.hits <= 0) delete p.buffs.lifesteal;
        GAME.Raycaster.spawnEffect("heal", { x: .5, y: .68, duration: 440 });
        GAME.UI.updateHud();
        drainText = " 吸取 " + healed + " 血量" + (lifeSteal.hits > 0 ? "（剩" + lifeSteal.hits + "次）" : "（效果結束）");
      }
      if (spell && spell.shock) st.weaken = 1;          /* 雷擊：敵下擊虛弱 */
      GAME.Audio.sfx(spell ? "fire" : "hit");
      GAME.Raycaster.spawnEffect(spell ? "spell" : "hit", {
        x: .5, y: .54, duration: spell ? 560 : 390,
        color: spell && spell.id === "bolt" ? [126, 211, 255] : (spell ? null : gearColor(GAME.player.equips.weapon, [255, 231, 146]))
      });
      punchAnim();
      GAME.UI.setEnemyBar(e.name, Math.max(0, e.hp), e.maxHp);
      GAME.UI.log("命中！造成 " + total + " 傷害！" + drainText + (spell && spell.shock ? "（敵人麻痺虛弱）" : ""));
    } else {
      GAME.Audio.sfx("miss");
      GAME.UI.log("答錯了，攻擊落空……");
    }

    if (e.hp <= 0) { e.hp = 0; later(win, 1100); return; }

    if (e.isBoss) {
      var phaseAfter = e.phases.indexOf(bossPhase(e));
      if (phaseAfter > phaseBefore) {
        GAME.UI.log("💢 " + e.name + " 暴怒了！攻擊力提升！");
        GAME.Audio.sfx("boss");
        later(enemyAttack, 1600);
        return;
      }
    }
    later(enemyAttack, 1300);
  }

  /* ── 敵人回合 ── */
  function enemyAttack() {
    if (!st) return;
    var e = st.enemy;

    /* Boss 大招：大招階段每 3 回合一次 */
    if (e.isBoss) {
      var ph = bossPhase(e);
      if (ph.ultimate) {
        e.turnCount++;
        if (e.turnCount % 3 === 0) { enemyAttackMotion(bossUltimate); return; }
      }
    }

    enemyAttackMotion(resolveEnemyAttack);
  }

  /* 測試捷徑：仍走正常 win 流程，因此獎勵、升級與關卡推進都會保留。 */
  function testKill() {
    if (!st || st.inputLock) return;
    st.inputLock = true;
    var e = st.enemy;
    e.hp = 0;
    GAME.Audio.sfx("hit");
    GAME.Raycaster.spawnEffect("hit", { x: .5, y: .54, duration: 430 });
    punchAnim();
    GAME.UI.setEnemyBar(e.name, 0, e.maxHp);
    GAME.UI.log("☠ 測試秒殺：" + e.name + " 已被立即擊敗。");
    later(win, 420);
  }

  /* 切到專用攻擊精靈圖並短暫前撲；缺少攻擊幀時仍有前撲動作。 */
  function enemyAttackMotion(done) {
    if (!st || !st.spr) { done(); return; }
    var spr = st.spr, R = GAME.Raycaster;
    var baseX = spr.x, baseY = spr.y, idle = spr.spr;
    var attack = GAME.ASSETS.sprites[(spr.spriteKey || "") + "_attack"] || idle;
    var dx = R.x - baseX, dy = R.y - baseY;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    spr.isAttacking = true;
    spr.spr = attack;
    spr.x = baseX + dx / dist * 0.20;
    spr.y = baseY + dy / dist * 0.20;
    GAME.Raycaster.spawnEffect("enemy", { x: .5, y: .63, duration: 360 });
    later(function () {
      if (!st || st.spr !== spr) return;
      spr.x = baseX;
      spr.y = baseY;
      spr.spr = idle;
      spr.isAttacking = false;
      done();
    }, 330);
  }

  function resolveEnemyAttack() {
    if (!st) return;
    var e = st.enemy, p = GAME.player;

    var dmg = calcDamage(enemyAtk(), playerDef(), 1);
    if (st.weaken > 0) { dmg = Math.max(1, Math.round(dmg * 0.7)); st.weaken--; }
    p.hp -= dmg;
    if (p.equips && p.equips.armor) {
      GAME.Raycaster.spawnEffect("spell", { x: .5, y: .70, duration: 280, color: gearColor(p.equips.armor, [126, 211, 255]) });
    }
    GAME.Audio.sfx("hurt");
    shakeScreen();
    GAME.UI.updateHud();
    GAME.UI.log(e.name + " 攻擊！你受到 " + dmg + " 傷害");

    if (p.hp <= 0) { p.hp = 0; later(lose, 1300); return; }
    later(playerPrompt, 1300);
  }

  /* Boss 大招：連答 2 題 */
  function bossUltimate() {
    var e = st.enemy;
    GAME.UI.log("⚠ " + e.name + " 蓄力放大招！連答 2 題閃避！");
    GAME.Audio.sfx("boss");
    var oks = [];
    askOnce(function (ok1) {
      oks.push(ok1);
      askOnce(function (ok2) {
        oks.push(ok2);
        var n = oks.filter(Boolean).length;
        var p = GAME.player;
        var base = Math.round(enemyAtk() * 2 * (0.9 + Math.random() * 0.2));
        var dmg = n === 2 ? 0 : (n === 1 ? Math.round(base / 2) : base);
        if (dmg === 0) {
          GAME.Audio.sfx("good");
          GAME.UI.log("✨ 完美閃避！毫髮無傷！");
        } else {
          p.hp -= dmg;
          GAME.Audio.sfx("hurt");
          shakeScreen();
          GAME.UI.updateHud();
          GAME.UI.log("大招轟炸！你受到 " + dmg + " 傷害");
        }
        if (p.hp <= 0) { p.hp = 0; later(lose, 1300); return; }
        later(playerPrompt, 1400);
      });
    });
  }

  /* ── 勝敗 ── */
  function win() {
    if (!st) return;
    var e = st.enemy, p = GAME.player, run = GAME.run;
    run.kills++;
    p.gold += e.gold;
    p.xp += e.xp;
    GAME.Audio.sfx("coin");

    var ups = 0;
    while (p.xp >= GAME.CONFIG.xpNeed(p.lv)) {
      p.xp -= GAME.CONFIG.xpNeed(p.lv);
      p.lv++;
      var g = GAME.CONFIG.levelUp;
      p.maxHp += g.hp; p.maxMp += g.mp; p.atk += g.atk; p.def += g.def; p.spd += g.spd;
      p.hp = p.maxHp; p.mp = p.maxMp;
      ups++;
    }
    GAME.UI.updateHud();
    GAME.UI.hideEnemyBar();
    GAME.UI.log("🎉 擊敗了 " + e.name + "！獲得 " + e.xp + " 經驗、" + e.gold + " 金幣");
    GAME.UI.showExploreMode("勝利！");
    if (ups) {
      GAME.Audio.sfx("levelup");
      GAME.UI.bigBanner("升級！Lv." + p.lv);
    }
    later(function () {
      if (!st) return;
      var cb = st.onComplete, node = st.node;
      cleanup();
      cb(node);
    }, ups ? 2300 : 1500);
  }

  function lose() {
    GAME.UI.hideEnemyBar();
    cleanup();
    GAME.gameOver();
  }

  function cleanup() {
    if (st && st.timers) st.timers.forEach(function (t) { clearTimeout(t); });
    if (st && st.spr) {
      var R = GAME.Raycaster;
      var i = R.sprites.indexOf(st.spr);
      if (i >= 0) R.sprites.splice(i, 1);
    }
    var viewPanel = $("view-panel");
    if (viewPanel) viewPanel.classList.remove("battle-mode");
    if (GAME.run && GAME.CONFIG && GAME.sceneBackdropFor) {
      var region = GAME.CONFIG.regions[GAME.run.regionIdx];
      GAME.Raycaster.setFloorTexture(region.floorTexture);
      GAME.Raycaster.setBackdrop(GAME.sceneBackdropFor(region));
      GAME.Raycaster.setWallsVisible(true);
    }
    if (GAME.state !== "DEATH") GAME.Audio.playMusic("explore");
    if (GAME.player) GAME.player.buffs = {};
    st = null;
  }

  /* ── 動畫 ── */
  function punchAnim() {
    if (!st || !st.spr) return;
    var spr = st.spr, base = spr.height, k = 0;
    var seq = [0.8, 0.75, 0.85, 1.0];
    var timer = setInterval(function () {
      if (k >= seq.length || !st) { clearInterval(timer); if (spr) spr.height = base; return; }
      spr.height = base * seq[k];
      k++;
    }, 70);
  }
  function shakeScreen() {
    var vp = $("view-panel");
    vp.classList.remove("shake");
    void vp.offsetWidth;
    vp.classList.add("shake");
  }
  B.isActive = function () { return !!st; };
})();
