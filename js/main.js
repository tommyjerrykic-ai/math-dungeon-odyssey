/* ═══════════════ 《數境迷航》 主程式：狀態機＋迴圈＋適配 ═══════════════ */
(function () {
  var S = GAME.state = "BOOT";      // MENU / EXPLORE / JUNCTION / BATTLE / SHOP / CAMPFIRE / CHEST / DEATH / VICTORY
  GAME.player = null;
  GAME.sceneBackdropFor = function (region) {
    return "assets/runtime/scenes/explore-" + region.id + ".png";
  };
  GAME.world = null;                // 當前走廊 {grid,w,h,x,y,dir,path}

  var el = {};
  function $(id) { return document.getElementById(id); }

  /* ── 初始化 ── */
  window.addEventListener("load", init);

  function init() {
    ["scale-root", "menu-screen", "help-screen", "settings-screen", "game-screen",
     "rotate-icon", "view3d", "junction-ui", "junc-left", "junc-fwd", "junc-right",
     "location-banner", "battle-log", "enemy-plate", "big-banner", "explore-tip",
     "question-panel", "answer-panel", "question-text", "question-image-wrap", "question-image",
     "numpad", "choices", "skill-bar", "side-map-panel", "side-map-canvas", "side-map-hint"
    ].forEach(function (id) { el[id] = $(id); });

    GAME.UI.init(el);
    GAME.Raycaster.init(el["view3d"]);
    GAME.Quiz.init();
    GAME.ASSETS.drawRotateIcon(el["rotate-icon"]);

    bindMenu();
    bindJunction();
    bindModals();
    fitScale();
    window.addEventListener("resize", fitScale);
    window.addEventListener("orientationchange", function () { setTimeout(fitScale, 120); });

    /* 首次觸控解鎖音頻（iPad Safari 要求） */
    document.body.addEventListener("touchend", function unlock() {
      GAME.Audio.unlock();
      document.body.removeEventListener("touchend", unlock);
    }, { once: false });
    document.body.addEventListener("click", function unlock2() {
      GAME.Audio.unlock();
      document.body.removeEventListener("click", unlock2);
    }, { once: true });

    showScreen("menu-screen");
    S = GAME.state = "MENU";
    GAME.Audio.playMusic("menu");

    /* 主迴圈 */
    var last = performance.now();
    function loop(t) {
      var dt = Math.min(80, t - last);
      last = t;
      GAME.Raycaster.update(dt);
      GAME.Raycaster.render();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ── 縮放適配＋橫豎屏 ── */
  function fitScale() {
    var w = window.innerWidth, h = window.innerHeight;
    var s = Math.min(w / 1280, h / 720);
    el["scale-root"].style.transform = "translate(-50%,-50%) scale(" + s + ")";
    document.body.classList.toggle("portrait", h > w);
    document.documentElement.style.setProperty("--vh", (h * 0.01) + "px");
  }

  /* ── 菜單 ── */
  function bindMenu() {
    renderMapSelect();
    $("btn-start").addEventListener("click", function () { GAME.Audio.sfx("confirm"); startRun(0); });
    $("btn-map-select").addEventListener("click", function () { GAME.Audio.sfx("click"); showScreen("map-select-screen"); });
    $("btn-map-select-back").addEventListener("click", function () { GAME.Audio.sfx("click"); showScreen("menu-screen"); });
    $("btn-help").addEventListener("click", function () { GAME.Audio.sfx("click"); showScreen("help-screen"); });
    $("btn-settings").addEventListener("click", function () { GAME.Audio.sfx("click"); showScreen("settings-screen"); });
    $("btn-help-back").addEventListener("click", function () { GAME.Audio.sfx("click"); showScreen("menu-screen"); });
    $("btn-settings-back").addEventListener("click", function () { GAME.Audio.sfx("click"); showScreen("menu-screen"); });
    $("toggle-bgm").addEventListener("click", function () { GAME.Audio.toggleBgm(this); });
    $("toggle-sfx").addEventListener("click", function () { GAME.Audio.toggleSfx(this); });
    $("volume-slider").addEventListener("input", function () { GAME.Audio.setVolume(this.value / 100); });
    $("btn-end-menu").addEventListener("click", function () {
      $("modal-end").classList.add("hidden");
      showScreen("menu-screen");
      S = GAME.state = "MENU";
    });
  }

  function showScreen(id) {
    ["menu-screen", "help-screen", "settings-screen", "map-select-screen", "game-screen"].forEach(function (s) {
      $(s).classList.toggle("hidden", s !== id);
    });
  }
  GAME.showScreen = showScreen;

  function bindModals() {
    var closes = document.querySelectorAll(".modal-close");
    for (var i = 0; i < closes.length; i++) {
      closes[i].addEventListener("click", function () {
        $(this.getAttribute("data-close")).classList.add("hidden");
      });
    }
    $("btn-items").addEventListener("click", function () { GAME.UI.openItems(); });
    $("btn-skills").addEventListener("click", function () { GAME.UI.openSkills(); });
    $("btn-stats").addEventListener("click", function () { GAME.UI.openStats(); });
  }

  /* ═══════════ 開新局 ═══════════ */
  function startRun(regionIdx) {
    var chosenRegion = (typeof regionIdx === "number") ? regionIdx : 0;
    /* 正式素材在背景載入；玩家可立即用內建像素素材開始冒險。 */
    var cfg = GAME.CONFIG;
    GAME.player = JSON.parse(JSON.stringify(cfg.player));
    GAME.player.items = JSON.parse(JSON.stringify(cfg.startItems));
    GAME.player.spells = [cfg.spells[0]];               // 初始只會火球
    GAME.player.equips = { weapon: null, armor: null };
    GAME.player.buffs = {};
    GAME.run = { regionIdx: chosenRegion, nodeMap: null, currentNode: null, pathNodes: [], kills: 0, questions: 0, correct: 0 };

    showScreen("game-screen");
    GAME.UI.updateHud();
    GAME.UI.showExploreMode();
    startRegion(chosenRegion);
    /* 首個場景已建立後才逐張載入高解析素材，確保按鈕即時回應。 */
    setTimeout(function () { GAME.ASSETS.ensureAIAssets(); }, 300);
  }
  GAME.startRun = startRun;

  function renderMapSelect() {
    var list = $("map-select-list");
    if (!list) return;
    var flavor = {
      forest: { icon: "🌲", sub: "翠綠森林", desc: "藤蔓與苔蘚交織的起始迷宮" },
      desert: { icon: "🏜", sub: "黃沙沙漠", desc: "流沙與古老遺跡的灼熱試煉" },
      cave: { icon: "❄", sub: "冰晶洞窟", desc: "藍冰深處潛伏著結晶魔物" }
    };
    list.innerHTML = "";
    GAME.CONFIG.regions.forEach(function (region, idx) {
      var info = flavor[region.id] || { icon: "✦", sub: region.name, desc: "未知的地城區域" };
      var btn = document.createElement("button");
      btn.className = "pix-btn map-region-card " + region.id;
      btn.innerHTML = "<span class='map-region-icon'>" + info.icon + "</span>" +
        "<span class='map-region-name'>" + region.name + "</span>" +
        "<span class='map-region-desc'>" + info.desc + "</span>" +
        "<span class='map-region-enter'>從此地開始 →</span>";
      btn.addEventListener("click", function () { GAME.Audio.sfx("confirm"); startRun(idx); });
      list.appendChild(btn);
    });
  }

  /* ═══════════ 地區推進 ═══════════ */
  function startRegion(idx) {
    var run = GAME.run;
    run.regionIdx = idx;
    var region = GAME.CONFIG.regions[idx];
    run.nodeMap = GAME.MapGen.buildNodeMap(region);
    run.currentNode = run.nodeMap.start;
    run.pathNodes = [run.nodeMap.start];
    GAME.UI.bigBanner(region.name);
    GAME.Audio.playMusic("explore");
    enterCorridor(GAME.MapGen.buildCorridor(run.nodeMap, run.nodeMap.start, region));
    updateBanner();
  }

  function nextRegion() {
    var idx = GAME.run.regionIdx + 1;
    if (idx >= GAME.CONFIG.regions.length) {
      victory();
      return;
    }
    setTimeout(function () { startRegion(idx); }, 1600);
  }

  function updateBanner() {
    var run = GAME.run;
    var region = GAME.CONFIG.regions[run.regionIdx];
    el["location-banner"].textContent = region.name + " · 第 " + (run.currentNode.layer + 1) + " 層";
  }

  /* ═══════════ 進入走廊 ═══════════ */
  function enterCorridor(corridor) {
    var region = GAME.CONFIG.regions[GAME.run.regionIdx];
    var R = GAME.Raycaster;
    /* 應用 Boss 門紋理 */
    for (var key in corridor.texMap) {
      corridor.grid[key] = corridor.texMap[key];
    }
    GAME.world = { grid: corridor.grid, w: corridor.w, h: corridor.h, x: corridor.startX | 0, y: corridor.startY | 0, dir: corridor.startDir, corridor: corridor };
    R.setMap(corridor.grid, corridor.w, corridor.h);
    R.setTextures([
      GAME.ASSETS.textures[region.walls[0]],
      GAME.ASSETS.textures[region.walls[1]],
      GAME.ASSETS.textures.bossDoor
    ]);
    R.setSkyFloor(R.hexRGB(region.skyTop), R.hexRGB(region.skyBottom), R.hexRGB(region.floorNear), R.hexRGB(region.floorFar));
    R.setFloorTexture(region.floorTexture);
    R.setBackdrop(GAME.sceneBackdropFor(region));
    R.setSceneMood(region.id);
    R.setPos(corridor.startX, corridor.startY, [0, Math.PI / 2, Math.PI, -Math.PI / 2][corridor.startDir]);
    R.sprites = corridor.sprites;

    GAME.UI.hideLog();
    GAME.UI.hideBigBanner();
    GAME.state = "EXPLORE";
    GAME.UI.showExploreMode();
    setTimeout(autoStep, 500);
  }

  /* ═══════════ 自動行走 ═══════════ */
  var DIRS = [ {dx:1,dy:0}, {dx:0,dy:1}, {dx:-1,dy:0}, {dx:0,dy:-1} ];   // 東南西北

  function cellAt(x, y) {
    var wd = GAME.world;
    if (x < 0 || y < 0 || x >= wd.w || y >= wd.h) return 1;
    return wd.grid[y * wd.w + x];
  }

  function autoStep() {
    if (GAME.state !== "EXPLORE") return;
    var wd = GAME.world, R = GAME.Raycaster;
    var d = DIRS[wd.dir];
    var nx = wd.x + d.dx, ny = wd.y + d.dy;

    if (cellAt(nx, ny) === 0) {
      R.moveTo(nx + 0.5, ny + 0.5, 280, function () {
        wd.x = nx; wd.y = ny;
        GAME.Audio.sfx("step");
        onArriveCell();
      });
    } else {
      onArriveCell();
    }
  }

  function onArriveCell() {
    if (GAME.state !== "EXPLORE") return;
    var wd = GAME.world, c = wd.corridor;

    /* 1. 事件格？ */
    for (var i = 0; i < c.events.length; i++) {
      if (c.events[i].x === wd.x && c.events[i].y === wd.y) {
        wd.currentEvent = c.events[i];
        triggerEvent(c.events[i].node);
        return;
      }
    }
    /* 2. 岔口廳？ */
    if (c.junction && c.junction.x === wd.x && c.junction.y === wd.y) {
      enterJunction(c.junction);
      return;
    }
    checkAhead();
  }

  function checkAhead() {
    var wd = GAME.world;
    var d = DIRS[wd.dir];
    var fwdOpen = cellAt(wd.x + d.dx, wd.y + d.dy) === 0;
    var left = (wd.dir + 3) % 4, right = (wd.dir + 1) % 4;
    var leftOpen = cellAt(wd.x + DIRS[left].dx, wd.y + DIRS[left].dy) === 0;
    var rightOpen = cellAt(wd.x + DIRS[right].dx, wd.y + DIRS[right].dy) === 0;

    if (!fwdOpen && (leftOpen || rightOpen)) {
      /* 走廊彎道：自動轉向（不打擾玩家） */
      turnAndGo(leftOpen ? left : right);
      return;
    }
    if (!fwdOpen && !leftOpen && !rightOpen) {
      /* 死路（不應發生）：迴轉 */
      turnAndGo((wd.dir + 2) % 4);
      return;
    }
    setTimeout(autoStep, 60);
  }

  function turnAndGo(newDir, after) {
    var wd = GAME.world;
    var angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    GAME.Raycaster.turnTo(angles[newDir], 240, function () {
      wd.dir = newDir;
      if (after) after(); else setTimeout(autoStep, 60);
    });
  }

  /* ═══════════ 岔口 ═══════════ */
  function enterJunction(junction) {
    GAME.state = "JUNCTION";
    GAME.UI.showJunction(junction.branches);
  }

  function bindJunction() {
    el["junc-left"].addEventListener("click", function () { chooseJunction("left"); });
    el["junc-fwd"].addEventListener("click", function () { chooseJunction("fwd"); });
    el["junc-right"].addEventListener("click", function () { chooseJunction("right"); });
  }

  function chooseJunction(which) {
    if (GAME.state !== "JUNCTION") return;
    var wd = GAME.world, c = wd.corridor;
    var branch = null;
    for (var i = 0; i < c.junction.branches.length; i++) {
      if (c.junction.branches[i].dir === which) branch = c.junction.branches[i];
    }
    if (!branch) return;
    GAME.Audio.sfx("confirm");
    GAME.UI.hideJunction();
    GAME.state = "EXPLORE";
    turnAndGo(branch.vec.dir);
  }
  GAME.chooseJunction = chooseJunction;

  /* ═══════════ 事件觸發 ═══════════ */
  function triggerEvent(node) {
    GAME.state = "EVENT";
    var names = GAME.CONFIG.nodeNames;
    GAME.Audio.sfx(node.type === "boss" ? "boss" : "confirm");

    var intro = eventIntroFor(node);
    GAME.UI.eventIntro(intro.mark, intro.title, intro.copy);
    GAME.Raycaster.spawnEffect("reveal", { x: .5, y: .50, duration: 560 });

    if (node.type === "monster" || node.type === "elite") {
      setTimeout(function () { GAME.Battle.start(node, completeNode); }, 520);
    } else if (node.type === "boss") {
      GAME.UI.bigBanner("👑 " + names.boss + "！");
      setTimeout(function () { GAME.Battle.start(node, completeNode); }, 820);
    } else if (node.type === "shop") {
      focusEventSprite(node, function () { GAME.openShop(node); });
    } else if (node.type === "campfire") {
      focusEventSprite(node, function () { GAME.openCampfire(node); });
    } else if (node.type === "chest") {
      focusEventSprite(node, function () { GAME.openChest(node); });
    }
  }

  function eventIntroFor(node) {
    var ev = GAME.world && GAME.world.currentEvent;
    var monster = ev && ev.monsterId && GAME.CONFIG.monsters[ev.monsterId];
    if (node.type === "monster") return { mark: "⚔", title: "遭遇 · " + (monster ? monster.name : "怪物"), copy: "牠擋住了前往下一層的道路" };
    if (node.type === "elite") return { mark: "☠", title: "精英警戒 · " + (monster ? monster.name : "強敵"), copy: "空氣凝結，這是一場硬仗" };
    if (node.type === "boss") return { mark: "👑", title: "王座震動", copy: "地區之王已經現身" };
    if (node.type === "shop") return { mark: "✦", title: "旅行商人", copy: "燈火與鈴鐺聲從前方傳來" };
    if (node.type === "campfire") return { mark: "🔥", title: "溫暖營火", copy: "短暫歇息，重整下一段旅途" };
    if (node.type === "chest") return { mark: "🎁", title: "遺跡寶箱", copy: "鎖扣裡透出微微金光" };
    return { mark: "✦", title: GAME.CONFIG.nodeNames[node.type] || "新的遭遇", copy: "" };
  }

  /* 非戰鬥事件也會走近玩家：物件落在前景地板，並放大成可互動的主體。 */
  function focusEventSprite(node, done) {
    var ev = GAME.world && GAME.world.currentEvent;
    var spr = ev && ev.sprite;
    if (!spr) { done(); return; }
    var R = GAME.Raycaster;
    var startX = spr.x, startY = spr.y, startH = spr.height;
    var dx = startX - R.x, dy = startY - R.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var targetDist = 1.18;
    var targetH = node.type === "shop" ? 0.80 : (node.type === "campfire" ? 0.72 : 0.70);
    var targetX = R.x + dx / dist * targetDist;
    var targetY = R.y + dy / dist * targetDist;
    var steps = 12, step = 0;
    var timer = setInterval(function () {
      step++;
      var t = step / steps;
      spr.x = startX + (targetX - startX) * t;
      spr.y = startY + (targetY - startY) * t;
      spr.height = startH + (targetH - startH) * t;
      if (step >= steps) {
        clearInterval(timer);
        done();
      }
    }, 28);
  }

  function completeNode(node) {
    var run = GAME.run;
    run.currentNode = node;
    run.pathNodes.push(node);
    if (node.type === "boss") {
      GAME.UI.bigBanner("地區通關！");
      setTimeout(nextRegion, 1400);
      return;
    }
    var region = GAME.CONFIG.regions[run.regionIdx];
    enterCorridor(GAME.MapGen.buildCorridor(run.nodeMap, node, region));
    updateBanner();
  }

  /* ═══════════ 勝利 / 死亡 ═══════════ */
  function closeAllModals() {
    var ms = document.querySelectorAll(".modal");
    for (var i = 0; i < ms.length; i++) ms[i].classList.add("hidden");
  }

  function victory() {
    GAME.state = "VICTORY";
    GAME.Audio.playMusic("menu");
    closeAllModals();
    var run = GAME.run;
    $("end-title").textContent = "🎉 全部通關！";
    $("end-body").innerHTML = "<p>你打敗了三地區的王，數境恢復了和平！</p>" +
      "<p>最終等級：Lv." + GAME.player.lv + "　答對題目：" + run.correct + " / " + run.questions + "　擊敗怪物：" + run.kills + "</p>";
    $("modal-end").classList.remove("hidden");
  }
  GAME.victory = victory;

  function gameOver() {
    GAME.state = "DEATH";
    GAME.Audio.playMusic("menu");
    closeAllModals();
    var run = GAME.run;
    $("end-title").textContent = "💀 勇者倒下了……";
    $("end-body").innerHTML = "<p>冒險足跡：" + GAME.CONFIG.regions[run.regionIdx].name + " 第 " + (run.currentNode.layer + 1) + " 層</p>" +
      "<p>答對題目：" + run.correct + " / " + run.questions + "　擊敗怪物：" + run.kills + "</p>";
    $("modal-end").classList.remove("hidden");
  }
  GAME.gameOver = gameOver;

  /* ═══════════ 物品使用（地圖/戰鬥中皆可用，不耗回合） ═══════════ */
  GAME.useItem = function (id) {
    var p = GAME.player, def = GAME.CONFIG.items[id];
    if (!p || !p.items[id] || p.items[id] <= 0) return;
    if (def.battleBuff) {
      if (GAME.state !== "BATTLE") {
        GAME.UI.feedback("現在不能使用", "「" + def.name + "」只能在戰鬥中飲用", false, 1600);
        return;
      }
      p.buffs = p.buffs || {};
      if (p.buffs[def.battleBuff]) {
        GAME.UI.feedback("效果仍在持續", "同類藥水在本場戰鬥無法重複使用", false, 1600);
        return;
      }
      p.items[id]--;
      p.buffs[def.battleBuff] = { amount: def.amount || 0, hits: def.hits || 0, rate: def.rate || 0 };
      GAME.Audio.sfx("heal");
      GAME.Raycaster.spawnEffect(def.battleBuff === "lifesteal" ? "heal" : "spell", {
        x: .5, y: .70, duration: 520,
        color: def.battleBuff === "attack" ? [255, 173, 90] : [106, 200, 255]
      });
      var buffText = def.battleBuff === "lifesteal" ? "接下來3次命中會吸取生命" :
        (def.battleBuff === "attack" ? "本場攻擊力＋" + def.amount : "本場防禦力＋" + def.amount);
      GAME.UI.feedback("喝下「" + def.name + "」", buffText, true, 1600);
      GAME.UI.updateHud();
      GAME.UI.openItems();
      return;
    }
    if (def.heal && p.hp >= p.maxHp) { GAME.UI.feedback("血量已滿", "現在不需要喝藥水", true, 1400); return; }
    if (def.mp && p.mp >= p.maxMp) { GAME.UI.feedback("法力已滿", "現在不需要喝藥水", true, 1400); return; }
    p.items[id]--;
    if (def.heal) p.hp = Math.min(p.maxHp, p.hp + def.heal);
    if (def.mp) p.mp = Math.min(p.maxMp, p.mp + def.mp);
    GAME.Audio.sfx("heal");
    GAME.UI.updateHud();
    GAME.UI.openItems();   /* 刷新列表 */
  };

  /* ═══════════ 營火 ═══════════ */
  GAME.openCampfire = function (node) {
    var p = GAME.player;
    p.hp = p.maxHp; p.mp = p.maxMp;
    GAME.Audio.sfx("heal");
    GAME.UI.updateHud();
    GAME.UI.bigBanner("🔥 營火休息：血法全滿");
    setTimeout(function () { completeNode(node); }, 1500);
  };

  /* ═══════════ 商店（M5） ═══════════ */
  GAME.openShop = function (node) {
    GAME.state = "SHOP";
    var p = GAME.player;
    var cfg = GAME.CONFIG;
    var tier = GAME.run.regionIdx;   /* 0森林 1沙漠 2洞窟 */

    /* 組裝商品 */
    var goods = [];
    for (var id in cfg.items) goods.push({ kind: "item", id: id, def: cfg.items[id], price: cfg.items[id].price });
    /* 裝備：本地區檔次的武器+防具（已擁有同件則略過） */
    var eqPool = cfg.equips.filter(function (e) { return cfg.equips.indexOf(e) % 3 === tier; });
    eqPool.forEach(function (e) {
      var owned = p.equips[e.slot] && p.equips[e.slot].id === e.id;
      if (!owned) goods.push({ kind: "equip", id: e.id, def: e, price: e.price });
    });
    /* 法術：未學的，35% 機率上架一本 */
    var unlearned = cfg.spells.filter(function (s) {
      return !p.spells.some(function (ps) { return ps.id === s.id; });
    });
    if (unlearned.length && Math.random() < 0.35) {
      var sp = unlearned[(Math.random() * unlearned.length) | 0];
      goods.push({ kind: "spell", id: sp.id, def: sp, price: cfg.spellPrices[sp.id] || 80 });
    }

    renderShopHub(goods, node);
    $("modal-shop").classList.remove("hidden");
  };

  function shopLeave(node) {
    $("modal-shop").classList.add("hidden");
    GAME.Audio.sfx("click");
    completeNode(node);
  }

  function setShopActions(actions) {
    var box = $("shop-actions");
    box.innerHTML = "";
    actions.forEach(function (action) {
      var btn = document.createElement("button");
      btn.className = "pix-btn shop-action " + (action.cls || "");
      btn.textContent = action.label;
      btn.addEventListener("click", action.onClick);
      box.appendChild(btn);
    });
  }

  function renderShopHub(goods, node) {
    $("shop-title").textContent = "旅行商人";
    $("shop-list").innerHTML = "<div class='shop-dialogue'>🧳 <b>旅行商人</b><br>「遠道而來的旅人，想聊聊近況，還是看看我的貨品？」</div>";
    setShopActions([
      { label: "💬 閒聊", cls: "chat", onClick: function () { renderShopChat(goods, node); } },
      { label: "🛒 買東西", cls: "buy", onClick: function () { renderShop(goods, node); } },
      { label: "離開", cls: "leave", onClick: function () { shopLeave(node); } }
    ]);
  }

  function renderShopChat(goods, node) {
    var talks = [
      "「今天的風很適合趕路，記得也讓靴子休息一下。」",
      "「我曾在洞窟裡迷路三天，後來發現自己一直繞著同一根冰柱。」",
      "「別小看史萊姆，它們有時比人更懂得享受午後陽光。」",
      "「沙漠的星星很亮，但帳篷裡的一杯熱茶更值得惦記。」",
      "「冒險不必急著抵達終點，沿途的營火也會記得你的故事。」"
    ];
    var line = talks[(Math.random() * talks.length) | 0];
    $("shop-title").textContent = "旅行商人・閒聊";
    $("shop-list").innerHTML = "<div class='shop-dialogue'>💬 <b>旅行商人：</b><br>" + line + "</div>";
    setShopActions([
      { label: "再聊一句", cls: "chat", onClick: function () { renderShopChat(goods, node); } },
      { label: "🛒 買東西", cls: "buy", onClick: function () { renderShop(goods, node); } },
      { label: "離開", cls: "leave", onClick: function () { shopLeave(node); } }
    ]);
  }

  function renderShop(goods, node) {
    var p = GAME.player;
    var list = $("shop-list");
    $("shop-title").textContent = "旅行商店";
    list.innerHTML = "<p style='color:#ffd93b;margin-bottom:10px'>💰 你的金幣：<b id='shop-gold'>" + p.gold + " G</b></p>";
    goods.forEach(function (g) {
      var row = document.createElement("div");
      row.className = "list-item";
      var name = g.kind === "spell" ? g.def.icon + " " + g.def.name + "（法術）" : g.def.name;
      var desc = g.kind === "equip"
        ? (g.def.slot === "weapon" ? "攻擊 +" + g.def.atk : "防禦 +" + g.def.def) + "（直接裝備）"
        : g.def.desc;
      row.innerHTML = "<div><span class='item-name'>" + name + "</span><span class='item-desc'>" + desc + "</span></div>";
      var btn = document.createElement("button");
      btn.className = "pix-btn";
      btn.textContent = g.price + " G";
      btn.addEventListener("click", function () {
        if (p.gold < g.price) { GAME.UI.feedback("金幣不足", "去打怪物賺錢吧！", false, 1600); return; }
        p.gold -= g.price;
        GAME.Audio.sfx("coin");
        if (g.kind === "item") p.items[g.id] = (p.items[g.id] || 0) + 1;
        else if (g.kind === "equip") p.equips[g.def.slot] = g.def;
        else if (g.kind === "spell") p.spells.push(g.def);
        GAME.UI.updateHud();
        row.style.opacity = 0.35;
        btn.disabled = true;
        btn.textContent = "已購";
        var goldEl = document.getElementById("shop-gold");
        if (goldEl) goldEl.textContent = p.gold + " G";
      });
      row.appendChild(btn);
      list.appendChild(row);
    });
    setShopActions([
      { label: "← 返回", onClick: function () { renderShopHub(goods, node); } },
      { label: "離開", cls: "leave", onClick: function () { shopLeave(node); } }
    ]);
  }

  GAME.openChest = function (node) {
    var p = GAME.player;
    var cfg = GAME.CONFIG;
    /* 5% 寶箱陷阱：陷阱內依指定權重再判定結果。 */
    if (Math.random() < 0.05) {
      var trapRoll = Math.random(), trapText;
      GAME.Audio.sfx("bad");
      if (trapRoll < 0.30) {
        trapText = "⚠ 寶箱陷阱！幸好沒有受到傷害。";
      } else if (trapRoll < 0.50) {
        var lostGold = Math.floor(p.gold * 0.5);
        p.gold = Math.max(0, p.gold - lostGold);
        trapText = "⚠ 寶箱陷阱！遺失了 " + lostGold + " 金幣！";
      } else if (trapRoll < 0.80) {
        var lostHp = Math.max(1, Math.ceil(p.maxHp * 0.20));
        p.hp = Math.max(1, p.hp - lostHp);
        trapText = "⚠ 寶箱陷阱！失去了 " + lostHp + " 點血量！";
      } else {
        var lostMp = Math.ceil(p.mp * 0.5);
        p.mp = Math.max(0, p.mp - lostMp);
        trapText = "⚠ 寶箱陷阱！失去了 " + lostMp + " 點法力！";
      }
      GAME.UI.updateHud();
      GAME.UI.bigBanner(trapText);
      setTimeout(function () { completeNode(node); }, 1600);
      return;
    }
    var roll = Math.random();
    if (roll < 0.6) {
      var gold = 15 + ((Math.random() * 25) | 0);
      p.gold += gold;
      GAME.Audio.sfx("chest");
      GAME.UI.bigBanner("🎁 寶箱：獲得 " + gold + " 金幣！");
    } else if (roll < 0.85) {
      p.items.potion_s = (p.items.potion_s || 0) + 1;
      p.items.ether = (p.items.ether || 0) + 1;
      GAME.Audio.sfx("chest");
      GAME.UI.bigBanner("🎁 寶箱：小紅藥水＋藍藥水！");
    } else if (roll < 0.95) {
      var boosters = ["lifedrain", "atk_tonic", "def_tonic"];
      var boosterId = boosters[(Math.random() * boosters.length) | 0];
      p.items[boosterId] = (p.items[boosterId] || 0) + 1;
      GAME.Audio.sfx("chest");
      GAME.UI.bigBanner("🎁 寶箱：獲得「" + cfg.items[boosterId].name + "」！");
    } else {
      var unlearned = cfg.spells.filter(function (s) {
        return !p.spells.some(function (ps) { return ps.id === s.id; });
      });
      if (unlearned.length) {
        var sp = unlearned[(Math.random() * unlearned.length) | 0];
        p.spells.push(sp);
        GAME.Audio.sfx("levelup");
        GAME.UI.bigBanner("🎁 學會法術：" + sp.icon + " " + sp.name + "！");
      } else {
        var gold2 = 40;
        p.gold += gold2;
        GAME.Audio.sfx("chest");
        GAME.UI.bigBanner("🎁 寶箱：獲得 " + gold2 + " 金幣！");
      }
    }
    GAME.UI.updateHud();
    setTimeout(function () { completeNode(node); }, 1600);
  };
})();
