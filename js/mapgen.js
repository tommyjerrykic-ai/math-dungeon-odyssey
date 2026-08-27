/* ═══════════════ 《數境迷航》 地圖生成 ═══════════════
   1) 殺戮尖塔式節點圖：層層推進、2~3 岔、保證全連通到 Boss
   2) 走廊網格生成：主路 → 岔口小廳（掛遭遇圖標）→ 分支 → 事件格
   3) 小地圖繪製（DOM 彈窗 canvas） */
(function () {
  var MG = GAME.MapGen = {};

  function rnd(n) { return (Math.random() * n) | 0; }
  function pick(arr) { return arr[rnd(arr.length)]; }

  /* ═══════════ 1. 節點圖 ═══════════ */
  MG.buildNodeMap = function (region) {
    var L = region.layers;
    var layers = [], i, j;
    for (i = 0; i < L; i++) {
      var n = (i === 0 || i === L - 1) ? 1 : (2 + (Math.random() < 0.5 ? 1 : 0));
      layers.push([]);
      for (j = 0; j < n; j++) {
        layers[i].push({ id: i + "-" + j, layer: i, col: j, type: null, next: [] });
      }
    }
    layers[0][0].type = "start";
    layers[L - 1][0].type = "boss";

    /* 連邊：每節點向下一層相鄰列連 1~2 條 */
    for (i = 0; i < L - 1; i++) {
      for (j = 0; j < layers[i].length; j++) {
        var node = layers[i][j];
        var nextLayer = layers[i + 1];
        var cand = [];
        for (var c = 0; c < nextLayer.length; c++) {
          if (Math.abs(c - j) <= 1) cand.push(nextLayer[c]);
        }
        if (!cand.length) cand = [nextLayer[Math.min(j, nextLayer.length - 1)]];
        var edges = 1 + (Math.random() < 0.4 && cand.length > 1 ? 1 : 0);
        cand = cand.slice();
        while (node.next.length < edges && cand.length) {
          var k = rnd(cand.length);
          node.next.push(cand.splice(k, 1)[0]);
        }
      }
    }
    /* 保證每個非 start 節點有入邊 */
    for (i = 1; i < L; i++) {
      for (j = 0; j < layers[i].length; j++) {
        var nd = layers[i][j];
        var hasIn = false;
        for (var p = 0; p < layers[i - 1].length; p++) {
          if (layers[i - 1][p].next.indexOf(nd) >= 0) { hasIn = true; break; }
        }
        if (!hasIn) {
          var prevLayer = layers[i - 1];
          var best = prevLayer[0], bestD = 99;
          for (var q = 0; q < prevLayer.length; q++) {
            var d = Math.abs(prevLayer[q].col - nd.col);
            if (d < bestD) { bestD = d; best = prevLayer[q]; }
          }
          best.next.push(nd);
        }
      }
    }

    /* 類型分配 */
    var W = GAME.CONFIG.nodeWeights;
    var types = [];
    for (var t in W) types.push([t, W[t]]);
    function rollType() {
      var total = 0, k2;
      for (k2 = 0; k2 < types.length; k2++) total += types[k2][1];
      var r = Math.random() * total;
      for (k2 = 0; k2 < types.length; k2++) { r -= types[k2][1]; if (r <= 0) return types[k2][0]; }
      return "monster";
    }
    for (i = 1; i < L - 1; i++) {
      var layerHasFire = false;
      var prevFire = layers[i - 1].some(function (n) { return n.type === "campfire"; });
      for (j = 0; j < layers[i].length; j++) {
        var nd2 = layers[i][j];
        if (i === 1) nd2.type = "monster";                       /* 第 2 層必普通怪 */
        else if (i === L - 2) nd2.type = "campfire";             /* Boss 前一層必營火 */
        else {
          var tp = rollType();
          if (tp === "campfire") {
            if (layerHasFire || prevFire) tp = "monster";        /* 同層最多一個、不與上層相鄰 */
            else layerHasFire = true;
          }
          nd2.type = tp;
        }
      }
    }
    return { layers: layers, start: layers[0][0], boss: layers[L - 1][0], regionId: region.id };
  };

  /* ═══════════ 2. 走廊生成 ═══════════ */
  /* 方向（玩家永遠朝東出發）：fwd=東 left=北 right=南 */
  var BR_VEC = { fwd: { dx: 1, dy: 0, dir: 0 }, left: { dx: 0, dy: -1, dir: 3 }, right: { dx: 0, dy: 1, dir: 1 } };

  MG.buildCorridor = function (nodeMap, fromNode, region) {
    var W = 16, H = 16, x, y;
    var grid = new Uint8Array(W * H);
    for (x = 0; x < W * H; x++) grid[x] = 1;
    function dig(x2, y2) { if (x2 > 0 && y2 > 0 && x2 < W - 1 && y2 < H - 1) grid[y2 * W + x2] = 0; }
    function wallTex() { return Math.random() < 0.5 ? 1 : 2; }   /* 兩種地區牆混雜 */

    var jx = 7 + rnd(2);              /* 岔口廳中心 x */
    var outs = fromNode.next;

    /* 主路（向東直挖，偶爾南北折一道彎） */
    var mainY = 8;
    var bendAt = outs.length > 1 && Math.random() < 0.4 ? 3 + rnd(2) : -1;
    var bendOff = bendAt > 0 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    for (x = 1; x <= jx; x++) {
      if (bendAt > 0 && x >= bendAt && x < bendAt + 2) dig(x, mainY + bendOff);
      else dig(x, (bendAt > 0 && x >= bendAt + 2) ? mainY : mainY);
      if (bendAt > 0 && x === bendAt) { dig(x, mainY); dig(x, mainY + bendOff); }
      if (bendAt > 0 && x === bendAt + 1) { dig(x, mainY); dig(x, mainY + bendOff); }
    }

    var corridor = {
      grid: grid, w: W, h: H,
      startX: 1.5, startY: 8.5, startDir: 0,
      junction: null, events: [], sprites: [], texMap: {}
    };

    if (outs.length <= 1) {
      /* 單路：主路再挖 3 格到事件廳（觸發格在廳前 2 格，遠遠看見遭遇） */
      for (x = jx + 1; x <= jx + 3; x++) dig(x, 8);
      for (x = jx + 3; x <= jx + 4; x++) for (y = 7; y <= 9; y++) dig(x, y);
      var ev0 = { x: jx + 2, y: 8, node: outs[0], vec: { dx: 1, dy: 0 } };
      var placed0 = placeEventSprite(corridor, jx + 4.5, 8.5, outs[0], region);
      ev0.monsterId = placed0.key;
      ev0.sprite = placed0.sprite;
      corridor.events.push(ev0);
    } else {
      /* 岔口小廳 3×3 */
      for (x = jx - 1; x <= jx + 1; x++) for (y = 7; y <= 9; y++) dig(x, y);

      var dirSets = outs.length === 3 ? [["left", "fwd", "right"]] :
        [["left", "right"], ["left", "fwd"], ["fwd", "right"]];
      var dirs = pick(dirSets);
      /* 打乱分支與節點的對應，增加隨機性 */
      var shuffled = outs.slice().sort(function () { return Math.random() - 0.5; });

      corridor.junction = { x: jx, y: 8, branches: [] };
      for (var b = 0; b < dirs.length; b++) {
        var bd = dirs[b], vec = BR_VEC[bd], node = shuffled[b];
        var ex = jx + vec.dx, ey = 8 + vec.dy;
        /* 分支走 3 格 */
        var bx = ex, by = ey;
        for (var s = 0; s < 3; s++) { dig(bx, by); bx += vec.dx; by += vec.dy; }
        /* 事件廳 3×3（中心在第 3 格） */
        var hallX = bx - vec.dx, hallY = by - vec.dy;
        for (var ox = -1; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) dig(hallX + ox, hallY + oy);
        /* 觸發格 = 分支入口（玩家剛拐入就看見廳裡的遭遇），sprite 在廳中心 */
        var trgX = bx - 3 * vec.dx, trgY = by - 3 * vec.dy;
        var evB = { x: trgX, y: trgY, node: node, vec: vec };
        var placedB = placeEventSprite(corridor, hallX + 0.5, hallY + 0.5, node, region);
        evB.monsterId = placedB.key;
        evB.sprite = placedB.sprite;
        corridor.events.push(evB);
        /* 入口圖標（浮在分支口） */
        corridor.junction.branches.push({ dir: bd, vec: vec, node: node });
      }
    }

    /* Boss 門紋理：觸發格前方 3 格的牆（玩家遠遠可見金門） */
    corridor.events.forEach(function (ev) {
      if (ev.node.type === "boss") {
        var v = ev.vec;
        var mx = ev.x + 3 * v.dx, my = ev.y + 3 * v.dy;
        var px = -v.dy, py = v.dx;
        corridor.texMap[my * W + mx] = 3;
        corridor.texMap[(my + py) * W + (mx + px)] = 3;
        corridor.texMap[(my - py) * W + (mx - px)] = 3;
      }
    });
    return corridor;
  };

  /* 擺放事件 sprite，回傳素材 key 與精靈物件，供戰鬥精準鎖定。 */
  function placeEventSprite(corridor, sx, sy, node, region) {
    var key = null, h = 0.62;
    if (node.type === "monster") key = pick(region.monsters);
    else if (node.type === "elite") key = pick(region.elite);
    else if (node.type === "shop") key = "shopkeeper";
    else if (node.type === "campfire") key = "campfire";
    else if (node.type === "chest") { key = "chestClosed"; h = 0.5; }
    else if (node.type === "boss") { key = GAME.CONFIG.bosses[region.boss].sprite; h = 0.95; }
    var sprite = null;
    if (key) {
      /* 所有事件都貼地；只有敵人與 Boss 才需要待機動作。 */
      var isLivingEnemy = node.type === "monster" || node.type === "elite" || node.type === "boss";
      sprite = { x: sx, y: sy, spr: GAME.ASSETS.sprites[key] || GAME.ASSETS.sprites.slime, spriteKey: key, height: h, eventSprite: true, idleMotion: isLivingEnemy };
      corridor.sprites.push(sprite);
    }
    return { key: key, sprite: sprite };
  }

  /* ═══════════ 3. 小地圖繪製 ═══════════ */
  var TYPE_STYLE = {
    start:    { c: "#8b9bb4", e: "🚩" },
    monster:  { c: "#d74848", e: "⚔" },
    elite:    { c: "#b03060", e: "💀" },
    shop:     { c: "#f4b41b", e: "💰" },
    campfire: { c: "#e07a3f", e: "🔥" },
    chest:    { c: "#38b764", e: "🎁" },
    boss:     { c: "#9a6ae0", e: "👑" }
  };

  MG.drawNodeMap = function (canvas) {
    var run = GAME.run;
    if (!run || !run.nodeMap) return;
    var nm = run.nodeMap;
    var ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#14172b";
    ctx.fillRect(0, 0, W, H);

    var L = nm.layers.length;
    var y0 = 34, y1 = H - 34;
    function nodePos(node) {
      var n = nm.layers[node.layer].length;
      var x = W / 2 + (node.col - (n - 1) / 2) * 86;
      // 探索由下往上推進：起點在底部，Boss／終點在頂部。
      var y = y1 - (y1 - y0) * (node.layer / (L - 1));
      return [x, y];
    }

    /* 連線 */
    ctx.lineWidth = 3;
    for (var i = 0; i < L - 1; i++) {
      nm.layers[i].forEach(function (node) {
        var a = nodePos(node);
        node.next.forEach(function (nx) {
          var b = nodePos(nx);
          var walked = run.pathNodes && run.pathNodes.indexOf(node) >= 0 && run.pathNodes.indexOf(nx) >= 0;
          ctx.strokeStyle = walked ? "#f4b41b" : "#3a4066";
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        });
      });
    }
    /* 節點 */
    nm.layers.forEach(function (layer) {
      layer.forEach(function (node) {
        var p = nodePos(node);
        var st = TYPE_STYLE[node.type] || TYPE_STYLE.monster;
        var isCur = run.currentNode === node;
        var walked = run.pathNodes && run.pathNodes.indexOf(node) >= 0;
        ctx.beginPath();
        ctx.arc(p[0], p[1], 20, 0, Math.PI * 2);
        ctx.fillStyle = walked ? st.c : "#232741";
        ctx.fill();
        ctx.lineWidth = isCur ? 4 : 2;
        ctx.strokeStyle = isCur ? "#ffffff" : st.c;
        ctx.stroke();
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(st.e, p[0], p[1] + 1);
        if (isCur) {
          ctx.font = "bold 13px sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.fillText("你在此", p[0], p[1] + 34);
        }
      });
    });

    /* 在岔路時直接把左／前／右標記到地圖上的對應節點，免得只看方向按鈕會迷路。 */
    var corridor = GAME.world && GAME.world.corridor;
    if (GAME.state === "JUNCTION" && corridor && corridor.junction && run.currentNode) {
      var from = nodePos(run.currentNode);
      var labels = { left: "← 左", fwd: "↑ 前", right: "右 →" };
      corridor.junction.branches.forEach(function (branch) {
        var to = nodePos(branch.node);
        ctx.strokeStyle = "#ffe28a";
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(from[0], from[1]); ctx.lineTo(to[0], to[1]); ctx.stroke();
        ctx.font = "bold 15px sans-serif";
        ctx.fillStyle = "#fff5b8";
        ctx.fillText(labels[branch.dir], to[0], to[1] - 34);
      });
    }
  };
})();
