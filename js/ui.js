/* ═══════════════ 《數境迷航》 UI 層（DOM 面板/HUD/彈窗） ═══════════════ */
(function () {
  var UI = GAME.UI = {};
  var el = {};
  function $(id) { return document.getElementById(id); }

  UI.init = function (elMap) { el = elMap; };

  /* ── HUD 數值 ── */
  UI.updateHud = function () {
    var p = GAME.player;
    if (!p) return;
    var need = GAME.CONFIG.xpNeed(p.lv);
    setBar("bar-hp", "num-hp", p.hp, p.maxHp);
    setBar("bar-mp", "num-mp", p.mp, p.maxMp);
    setBar("bar-xp", "num-xp", p.xp, need, "Lv." + p.lv);
    $("num-gold").textContent = p.gold + " G";
    updateHeroIdentity(p);
  };
  function updateHeroIdentity(p) {
    var title = $("hero-title"), role = $("hero-class"), equip = $("hero-equip");
    if (!title || !role) return;
    title.textContent = "Lv." + p.lv + " 見習探險者";
    role.textContent = p.spells && p.spells.length > 1 ? "符文解題師" : "數境旅人";
    var parts = [];
    if (p.equips && p.equips.weapon) parts.push("⚔ " + p.equips.weapon.name);
    if (p.equips && p.equips.armor) parts.push("◈ " + p.equips.armor.name);
    if (equip) equip.textContent = parts.length ? parts.join(" · ") : "✧ 初心者裝束";
  }
  function setBar(barId, numId, v, max, label) {
    var pct = Math.max(0, Math.min(100, (v / max) * 100));
    $(barId).style.width = pct + "%";
    $(numId).textContent = label || (Math.ceil(v) + "/" + max);
  }
  UI.setEnemyBar = function (name, hp, maxHp) {
    $("enemy-plate").classList.remove("hidden");
    $("enemy-name").textContent = name;
    var pct = Math.max(0, (hp / maxHp) * 100);
    $("bar-enemy").style.width = pct + "%";
    $("num-enemy").textContent = Math.ceil(hp) + "/" + maxHp;
  };
  UI.hideEnemyBar = function () { $("enemy-plate").classList.add("hidden"); };

  UI.setBanner = function (text) { el["location-banner"].textContent = text; };
  UI.bigBanner = function (text) {
    var b = $("big-banner");
    b.textContent = text;
    b.classList.remove("hidden");
    b.style.animation = "none";
    void b.offsetWidth;
    b.style.animation = "";
    setTimeout(function () { b.classList.add("hidden"); }, 2200);
  };
  UI.hideBigBanner = function () { $("big-banner").classList.add("hidden"); };

  UI.log = function (text) {
    var l = el["battle-log"];
    l.textContent = text;
    l.classList.remove("hidden");
  };
  UI.hideLog = function () { el["battle-log"].classList.add("hidden"); };

  var introTimer = null;
  UI.eventIntro = function (mark, title, copy) {
    var box = $("event-intro");
    if (!box) return;
    $("event-intro-mark").textContent = mark || "✦";
    $("event-intro-title").textContent = title || "新的遭遇";
    $("event-intro-copy").textContent = copy || "";
    box.classList.remove("hidden");
    box.classList.remove("event-intro-pop");
    void box.offsetWidth;
    box.classList.add("event-intro-pop");
    if (introTimer) clearTimeout(introTimer);
    introTimer = setTimeout(function () { box.classList.add("hidden"); }, 1050);
  };

  /* ── 右側面板模式 ── */
  function hideAllAnswer() {
    el["numpad"].classList.add("hidden");
    el["choices"].classList.add("hidden");
    el["skill-bar"].classList.add("hidden");
    el["explore-tip"].classList.add("hidden");
  }
  function clearQuestion() {
    el["question-text"].textContent = "";
    el["question-image-wrap"].classList.add("hidden");
  }
  function showBattlePanels() {
    el["side-map-panel"].classList.add("hidden");
    el["question-panel"].classList.remove("hidden");
    el["answer-panel"].classList.remove("hidden");
  }
  UI.showExploreMode = function (tip) {
    hideAllAnswer();
    UI.hideFeedback();
    clearQuestion();
    el["question-panel"].classList.add("hidden");
    el["answer-panel"].classList.add("hidden");
    el["side-map-panel"].classList.remove("hidden");
    $("side-map-story").classList.remove("hidden");
    el["side-map-hint"].textContent = tip || "向前走著……";
    if (GAME.MapGen && GAME.MapGen.drawNodeMap) GAME.MapGen.drawNodeMap(el["side-map-canvas"]);
    el["question-text"].textContent = "";
    el["question-image-wrap"].classList.add("hidden");
    el["explore-tip"].textContent = tip || "向前走著……";
    el["explore-tip"].classList.remove("hidden");
    UI.updateMapStory();
  };
  UI.showNumpad = function () { showBattlePanels(); hideAllAnswer(); el["numpad"].classList.remove("hidden"); };
  UI.showChoices = function () { showBattlePanels(); hideAllAnswer(); el["choices"].classList.remove("hidden"); };
  UI.showSkillBar = function () { showBattlePanels(); hideAllAnswer(); clearQuestion(); el["skill-bar"].classList.remove("hidden"); };

  UI.setQuestion = function (text, imageDataUrl) {
    el["question-text"].innerHTML = GAME.MathText.toHTML(text);
    if (imageDataUrl) {
      el["question-image"].src = imageDataUrl;
      el["question-image-wrap"].classList.remove("hidden");
      el["question-text"].style.flex = "0 0 auto";
    } else {
      el["question-image-wrap"].classList.add("hidden");
      el["question-text"].style.flex = "1";
    }
  };

  /* ── 岔路按鈕（branches: [{dir:'left'|'fwd'|'right', node}]） ── */
  UI.showJunction = function (branches) {
    el["junction-ui"].classList.remove("hidden");
    var map = {};
    branches.forEach(function (b) { map[b.dir] = b; });
    [["junc-left", "left", "← 左 "], ["junc-fwd", "fwd", "↑ 前 "], ["junc-right", "right", "右 → "]].forEach(function (cfg) {
      var btn = el[cfg[0]];
      var b = map[cfg[1]];
      btn.disabled = !b;
      if (b) {
        btn.innerHTML = "";
        var span = document.createElement("span");
        span.textContent = GAME.CONFIG.nodeNames[b.node.type];
        span.style.verticalAlign = "middle";
        btn.appendChild(span);
        var dirSpan = document.createElement("div");
        dirSpan.textContent = cfg[2];
        dirSpan.style.cssText = "font-size:14px;color:#e8ffe8;opacity:.85;";
        btn.appendChild(dirSpan);
      }
    });
    var directionText = { left: "← 左", fwd: "↑ 前", right: "右 →" };
    var routeText = branches.map(function (b) {
      return directionText[b.dir] + "：" + GAME.CONFIG.nodeNames[b.node.type];
    }).join("　");
    el["side-map-hint"].textContent = "路線指引：" + routeText;
    if (GAME.MapGen && GAME.MapGen.drawNodeMap) GAME.MapGen.drawNodeMap(el["side-map-canvas"]);
    /* 岔路的方向資訊已在「路線指引」完整呈現，避免再重複一遍。 */
    $("side-map-story").classList.add("hidden");
  };
  UI.hideJunction = function () { el["junction-ui"].classList.add("hidden"); };

  /* 小地圖不只顯示路線，也說明玩家正在穿越的地區。 */
  UI.updateMapStory = function (override) {
    var box = $("side-map-story"), run = GAME.run;
    if (!box || !run || !GAME.CONFIG || !GAME.CONFIG.regions[run.regionIdx]) return;
    if (override) { box.textContent = override; return; }
    var region = GAME.CONFIG.regions[run.regionIdx];
    var layer = run.currentNode ? run.currentNode.layer + 1 : 1;
    var scenes = {
      forest: ["月光穿過藤蔓，葉影在石路上搖曳。", "苔蘚間傳來細小的呢喃聲。", "森林深處的古樹正注視著你。"],
      desert: ["風砂抹去舊足跡，只留下遠方的遺跡。", "熱浪在石牆間起伏，金色符文若隱若現。", "沙丘後傳來低沉的震動。"],
      cave: ["冰晶折射著幽藍微光，腳步聲格外清晰。", "冷霧沿著石縫流動，洞窟仍在延伸。", "深處的冰層傳來細微裂響。"]
    };
    var lines = scenes[region.id] || ["未知的地城正等待探索。"];
    var next = run.currentNode && run.currentNode.next && run.currentNode.next.length;
    box.textContent = "第 " + layer + " 層 · " + lines[Math.min(lines.length - 1, (layer - 1) / 3 | 0)] + (next ? " 前方仍有分岔。" : " 終點近在眼前。 ");
  };

  /* ── 答題回饋 toast ── */
  var toastTimer = null;
  UI.feedback = function (title, body, good, ms) {
    var t = $("feedback-toast");
    $("feedback-title").textContent = title;
    $("feedback-title").className = good ? "good" : "bad";
    $("feedback-body").innerHTML = body;
    t.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add("hidden"); }, ms || 3000);
  };
  UI.hideFeedback = function () {
    if (toastTimer) clearTimeout(toastTimer);
    $("feedback-toast").classList.add("hidden");
  };
  /* 答錯解析需要玩家讀完後親自確認，不能被計時器自動略過。 */
  UI.feedbackConfirm = function (title, body, good, label, onConfirm) {
    var t = $("feedback-toast");
    if (toastTimer) clearTimeout(toastTimer);
    $("feedback-title").textContent = title;
    $("feedback-title").className = good ? "good" : "bad";
    $("feedback-body").innerHTML = body;
    var btn = document.createElement("button");
    btn.className = "pix-btn feedback-confirm";
    btn.textContent = label || "我知道了，繼續";
    btn.addEventListener("click", function () {
      t.classList.add("hidden");
      if (onConfirm) onConfirm();
    }, { once: true });
    $("feedback-body").appendChild(btn);
    t.classList.remove("hidden");
  };

  /* ── 彈窗：RPG 格子物品欄 ── */
  var selectedItemId = null;
  UI.openItems = function () {
    var p = GAME.player, items = GAME.CONFIG.items;
    if (!p) return;
    if (!selectedItemId || !p.items[selectedItemId]) {
      selectedItemId = null;
      for (var firstId in items) {
        if (p.items[firstId] > 0) { selectedItemId = firstId; break; }
      }
    }
    renderInventoryGrid(items, p);
    renderInventoryDetail(items, p);
    renderInventoryEquipment(p);
    $("modal-items").classList.remove("hidden");
  };

  function equipmentShowcase(eq) {
    var weaponTier = eq.weapon ? eq.weapon.id.slice(-1) : "0";
    var armorTier = eq.armor ? eq.armor.id.slice(-1) : "0";
    return "<div class='equipment-showcase weapon-tier-" + weaponTier + " armor-tier-" + armorTier + "'>" +
      "<div class='paperdoll'><img class='doll-hero' src='assets/generated/hero-adventurer.png' alt='勇者外觀'><span class='doll-sword'>⚔</span><span class='doll-shield'>⬟</span></div>" +
      "<div class='gear-slots'>" +
        "<div class='gear-card weapon'><span class='gear-glyph'>⚔</span><div><small>武器外觀</small><b>" + (eq.weapon ? eq.weapon.name : "未裝備") + "</b></div></div>" +
        "<div class='gear-card armor'><span class='gear-glyph'>⬟</span><div><small>防具外觀</small><b>" + (eq.armor ? eq.armor.name : "未裝備") + "</b></div></div>" +
      "</div></div>";
  }

  function renderInventoryEquipment(p) {
    $("inventory-gear").innerHTML = equipmentShowcase(p.equips || {});
  }

  function renderInventoryGrid(items, p) {
    var grid = $("items-list");
    grid.innerHTML = "";
    for (var id in items) {
      var def = items[id], count = p.items[id] || 0;
      if (!count) continue;
      var slot = document.createElement("button");
      slot.className = "item-slot" + (id === selectedItemId ? " selected" : "");
      slot.title = def.name;
      slot.innerHTML = "<img src='" + def.icon + "' alt='" + def.name + "'><span class='item-count'>" + count + "</span>";
      (function (itemId) {
        slot.addEventListener("click", function () {
          selectedItemId = itemId;
          renderInventoryGrid(items, GAME.player);
          renderInventoryDetail(items, GAME.player);
        });
      })(id);
      grid.appendChild(slot);
    }
  }

  function renderInventoryDetail(items, p) {
    var box = $("item-detail"), def = selectedItemId && items[selectedItemId];
    if (!def || !(p.items[selectedItemId] > 0)) {
      box.innerHTML = "<div class='inventory-empty'>點選物品查看說明</div>";
      return;
    }
    box.innerHTML = "<img class='detail-icon' src='" + def.icon + "' alt=''>" +
      "<div class='detail-copy'><b>" + def.name + "</b><span>持有 ×" + p.items[selectedItemId] + "</span><p>" + def.desc + "</p></div>";
    var use = document.createElement("button");
    use.className = "pix-btn inventory-use";
    use.textContent = "使用這個物品";
    use.addEventListener("click", function () { GAME.useItem(selectedItemId); });
    box.appendChild(use);
  }

  /* ── 彈窗：技能欄 ── */
  UI.openSkills = function () {
    var p = GAME.player, list = $("skills-list");
    list.innerHTML = "";
    var atk = document.createElement("div");
    atk.className = "list-item";
    atk.innerHTML = "<div><span class='item-name'>普通攻擊</span><span class='item-desc'>不耗法力，答對題目即命中</span></div>";
    list.appendChild(atk);
    p.spells.forEach(function (s) {
      var row = document.createElement("div");
      row.className = "list-item";
      row.innerHTML = "<div><span class='item-name'>" + s.icon + " " + s.name + "（MP " + s.mp + "）</span>" +
        "<span class='item-desc'>" + s.desc + "</span></div>";
      list.appendChild(row);
    });
    $("modal-skills").classList.remove("hidden");
  };

  /* ── 彈窗：能力欄 ── */
  UI.openStats = function () {
    var p = GAME.player, list = $("stats-list");
    var eq = p.equips || {};
    var rows = [
      ["等級", "Lv." + p.lv],
      ["血量", Math.ceil(p.hp) + " / " + p.maxHp],
      ["法力", Math.ceil(p.mp) + " / " + p.maxMp],
      ["攻擊力", p.atk + (eq.weapon ? "（+" + eq.weapon.atk + " " + eq.weapon.name + "）" : "")],
      ["防禦力", p.def + (eq.armor ? "（+" + eq.armor.def + " " + eq.armor.name + "）" : "")],
      ["速度", p.spd]
    ];
    var buffs = p.buffs || {}, active = [];
    if (buffs.lifesteal) active.push("吸血（" + buffs.lifesteal.hits + "次）");
    if (buffs.attack) active.push("攻＋" + buffs.attack.amount);
    if (buffs.defense) active.push("防＋" + buffs.defense.amount);
    if (active.length) rows.splice(7, 0, ["戰鬥強化", active.join("　")]);
    list.innerHTML = rows.map(function (r) {
      return "<div class='stat-line'><span>" + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");
    $("modal-stats").classList.remove("hidden");
  };

})();
