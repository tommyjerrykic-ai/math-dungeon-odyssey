/* ═══════════════ 《數境迷航》 素材庫 ═══════════════
   第一版：程序化生成像素素材（牆壁紋理、圖標、怪物佔位造型）
   M7 會以 AI 生成素材經後處理替換（見 tools/ 腳本），接口保持不變：
   - ASSETS.textures[name] = { w, h, data:Uint32Array }   牆壁紋理
   - ASSETS.sprites[name]  = { w, h, data:Uint32Array }   透明底 sprite（怪物/圖標）
   - ASSETS.icons[name]    = canvas                        UI 圖標
   顏色以 Uint32 儲存（little-endian：ABGR） */
(function () {
  var A = GAME.ASSETS = { textures: {}, sprites: {}, icons: {}, palette: {} };

  function rgba(r, g, b, a) {
    a = (a === undefined) ? 255 : a;
    return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }
  function hex(h, a) {
    var n = parseInt(h.slice(1), 16);
    return rgba((n >> 16) & 255, (n >> 8) & 255, n & 255, a);
  }
  A.rgba = rgba; A.hex = hex;

  /* 確定性偽隨機（素材可重現） */
  function makeRand(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* ── 建立空白圖 ── */
  function blank(w, h) {
    return { w: w, h: h, data: new Uint32Array(w * h) };
  }
  function setPx(img, x, y, c) {
    if (x >= 0 && y >= 0 && x < img.w && y < img.h) img.data[y * img.w + x] = c;
  }
  function fillRect(img, x, y, w, h, c) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) setPx(img, x + i, y + j, c);
  }

  /* ═══════════ 牆壁紋理（64×64） ═══════════ */
  var T = 64;

  /* 通用磚牆：bw×bh 磚塊 + 磚縫色 + 噪點 */
  function brickWall(seed, base, dark, light, mortar, bw, bh) {
    var img = blank(T, T), rnd = makeRand(seed);
    for (var y = 0; y < T; y++) {
      for (var x = 0; x < T; x++) {
        var row = Math.floor(y / bh);
        var off = (row % 2) * (bw / 2);
        var bx = (x + off) % bw, by = y % bh;
        var c;
        if (by === 0 || bx === 0) c = mortar;                    // 磚縫
        else {
          var n = rnd();
          c = n < 0.12 ? light : (n < 0.3 ? dark : base);        // 磚面噪點
        }
        img.data[y * T + x] = c;
      }
    }
    return img;
  }

  /* 垂直條紋牆（樹皮/石柱） */
  function stripeWall(seed, base, dark, light, stripeW) {
    var img = blank(T, T), rnd = makeRand(seed);
    var colC = [];
    for (var x = 0; x < T; x++) {
      var ph = Math.floor(x / stripeW) % 2;
      var n = rnd();
      colC[x] = ph === 0 ? (n < 0.25 ? dark : base) : (n < 0.3 ? light : base);
    }
    for (var y2 = 0; y2 < T; y2++) {
      for (var x2 = 0; x2 < T; x2++) {
        var cc = colC[x2];
        if (rnd() < 0.06) cc = dark;
        img.data[y2 * T + x2] = cc;
      }
    }
    return img;
  }

  /* 石牆＋藤蔓點綴（森林） */
  function vineWall(seed) {
    var img = brickWall(seed, hex("#6a8f5f"), hex("#577a4e"), hex("#7fa36f"), hex("#3d5a38"), 16, 16);
    var rnd = makeRand(seed + 7);
    for (var i = 0; i < 90; i++) {
      var x = (rnd() * T) | 0, y = (rnd() * T) | 0;
      setPx(img, x, y, hex("#2f7a2c"));
      if (rnd() < 0.5) setPx(img, x + 1, y, hex("#38a032"));
      if (rnd() < 0.3) setPx(img, x, y + 1, hex("#2f7a2c"));
    }
    return img;
  }

  /* 水晶牆（洞窟） */
  function crystalWall(seed) {
    var img = brickWall(seed, hex("#3a4666"), hex("#2e3a55"), hex("#4a5878"), hex("#232c44"), 16, 16);
    var rnd = makeRand(seed + 13);
    for (var c = 0; c < 7; c++) {
      var cx = 4 + (rnd() * (T - 12)) | 0, cy = 4 + (rnd() * (T - 12)) | 0;
      var s = 2 + (rnd() * 4) | 0;
      var col = rnd() < 0.5 ? hex("#9a6ae0") : hex("#6ac0e0");
      for (var j = -s; j <= s; j++) {
        var w = s - Math.abs(j);
        for (var i = -w; i <= w; i++) setPx(img, cx + i, cy + j, col);
      }
      setPx(img, cx, cy - s - 1, hex("#e8f4ff"));
    }
    return img;
  }

  /* Boss 門（金色雕花門） */
  function bossDoor(seed) {
    var img = blank(T, T);
    fillRect(img, 0, 0, T, T, hex("#5a3a1a"));
    var rnd = makeRand(seed);
    for (var y = 4; y < T - 4; y++)
      for (var x = 4; x < T - 4; x++)
        img.data[y * T + x] = rnd() < 0.15 ? hex("#7a4f24") : hex("#8a5f2e");
    for (var b = 0; b < T; b++) {           // 金框
      for (var k = 0; k < 4; k++) {
        setPx(img, b, k, hex("#f4b41b")); setPx(img, b, T - 1 - k, hex("#f4b41b"));
        setPx(img, k, b, hex("#f4b41b")); setPx(img, T - 1 - k, b, hex("#f4b41b"));
      }
    }
    for (var r = 0; r < 8; r++) {           // 中央菱紋
      for (var q = -r; q <= r; q++) {
        setPx(img, 32 + q, 32 - (8 - r) + 4, hex("#ffd93b"));
        setPx(img, 32 + q, 32 + (8 - r) - 4, hex("#ffd93b"));
      }
    }
    return img;
  }

  A.textures.forestA = stripeWall(11, hex("#7a5230"), hex("#5f3f22"), hex("#8f6540"), 8);
  A.textures.forestB = vineWall(21);
  A.textures.desertA = brickWall(31, hex("#d8a860"), hex("#c1914c"), hex("#e8c078"), hex("#a87a3e"), 16, 12);
  A.textures.desertB = stripeWall(41, hex("#caa050"), hex("#b08838"), hex("#e0b868"), 12);
  A.textures.caveA   = brickWall(51, hex("#5a6a8a"), hex("#4a5876"), hex("#6c7c9c"), hex("#38445e"), 16, 16);
  A.textures.caveB   = crystalWall(61);
  A.textures.bossDoor = bossDoor(71);

  /* ═══════════ 字符畫 sprite 工具 ═══════════ */
  function spriteFromRows(rows, palette) {
    var h = rows.length, w = rows[0].length;
    var img = blank(w, h);
    for (var y = 0; y < h; y++)
      for (var x = 0; x < w; x++) {
        var ch = rows[y][x];
        if (ch !== "." && palette[ch]) img.data[y * w + x] = palette[ch];
      }
    return img;
  }
  A.spriteFromRows = spriteFromRows;

  /* ═══════════ 遭遇圖標（16×16） ═══════════ */
  A.sprites.icon_sword = spriteFromRows([
    ".......ww.......",
    "......www.......",
    "......www.......",
    ".....www........",
    ".....www........",
    "....www.........",
    "....www.........",
    "...www..........",
    "...www..........",
    "..www...........",
    ".bbwbb..........",
    "..bbb...........",
    ".bbbbb..........",
    "bb.bbb..........",
    "....bb..........",
    "................"
  ], { w: hex("#e8eef4"), b: hex("#8a5f2e") });

  A.sprites.icon_skull = spriteFromRows([
    "................",
    "....wwwwww......",
    "...wwwwwwww.....",
    "..wwwwwwwwww....",
    "..wbwwwwbwww....",
    "..wbwwwwbwww....",
    "..wwwwwwwwww....",
    "...wwwbbwww.....",
    "....wwwwww......",
    "....w.ww.w......",
    "....wwwwww......",
    "................",
    "................",
    "................",
    "................",
    "................"
  ], { w: hex("#e8eef4"), b: hex("#1a1c2c") });

  A.sprites.icon_coin = spriteFromRows([
    "................",
    "................",
    ".....yyyyyy.....",
    "....yyyyyyyy....",
    "...yywwwwwwyy...",
    "...ywwwwwwwwwy..",
    "...ywwwbbwwwwy..",
    "...ywwbbbbbwwy..",
    "...ywwwbbwwwwy..",
    "...ywwwwwwwwwy..",
    "...yywwwwwwyy...",
    "....yyyyyyyy....",
    ".....yyyyyy.....",
    "................",
    "................",
    "................"
  ], { y: hex("#f4b41b"), w: hex("#ffd93b"), b: hex("#b8771a") });

  A.sprites.icon_fire = spriteFromRows([
    "................",
    "......r.........",
    "......rr........",
    ".....rrr........",
    ".....ryrr.......",
    "....ryyyr.......",
    "....ryyyrr......",
    "...ryyyyyr......",
    "...ryywwyyr.....",
    "..rrywwwwyrr....",
    "..rywwwwwwyr....",
    "..rrrwwwwrrr....",
    "..bbbbbbbbbb....",
    ".bbbbbbbbbbbb...",
    "................",
    "................"
  ], { r: hex("#e07a3f"), y: hex("#f4b41b"), w: hex("#ffd93b"), b: hex("#6a4526") });

  A.sprites.icon_chest = spriteFromRows([
    "................",
    "................",
    "..bbbbbbbbbb....",
    ".bwwwwwwwwwwb...",
    ".byyyyyyyyyyb...",
    ".bbbbbbbbbbbb...",
    ".byyyyyyyyyyb...",
    ".byyyylllyyyb...",
    ".byyyylllyyyb...",
    ".byyyyyyyyyyb...",
    ".bbbbbbbbbbbb...",
    "................",
    "................",
    "................",
    "................",
    "................"
  ], { b: hex("#6a4526"), y: hex("#8a5f2e"), w: hex("#f4b41b"), l: hex("#ffd93b") });

  A.sprites.icon_crown = spriteFromRows([
    "................",
    ".y...y...y......",
    ".yy.yyy.yy......",
    ".yyyyyyyyy......",
    ".yyyyyyyyy......",
    ".yyyyyyyyy......",
    ".yyyyyyyyy......",
    ".yyyyyyyyy......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................"
  ], { y: hex("#ffd93b") });

  /* ═══════════ 怪物佔位 sprite（48×48 可愛風） ═══════════ */
  /* 通用身體：橢圓 + 大眼 + 肚皮，extra(img) 畫特徵 */
  function makeMonster(opt) {
    var W = 48, H = 48, img = blank(W, H);
    var cx = 24, cy = 28, rx = opt.rx || 16, ry = opt.ry || 14;
    for (var y = 0; y < H; y++)
      for (var x = 0; x < W; x++) {
        var dx = (x - cx) / rx, dy = (y - cy) / ry;
        var d = dx * dx + dy * dy;
        if (d <= 1) {
          img.data[y * W + x] = (dy > 0.25) ? opt.belly : opt.body;
        }
      }
    if (opt.shapeFn) opt.shapeFn(img, setPx, fillRect);
    /* 眼睛 */
    var eyeY = cy - ry * 0.35, eyeDX = rx * 0.42;
    for (var e = -1; e <= 1; e += 2) {
      var ex = cx + e * eyeDX;
      fillRect(img, ex - 3, eyeY - 3, 6, 6, hex("#ffffff"));
      fillRect(img, ex - 1, eyeY - 1, 3, 3, hex("#1a1c2c"));
      setPx(img, ex - 1, eyeY - 2, hex("#ffffff"));
    }
    if (opt.extra) opt.extra(img, setPx, fillRect, hex);
    return img;
  }

  function horn(img, setPx, fillRect, hex, x, y, c) {
    for (var i = 0; i < 6; i++) { setPx(img, x, y - i, c); setPx(img, x + 1, y - i, c); }
  }

  A.sprites.slime = makeMonster({ body: hex("#4fc94f"), belly: hex("#8fe68f"), rx: 17, ry: 13 });
  A.sprites.mushroom = makeMonster({
    body: hex("#f4e9d4"), belly: hex("#fff8e8"), rx: 12, ry: 12,
    extra: function (img, setPx, fillRect, hex) {
      for (var y = 2; y < 20; y++) for (var x = 8; x < 40; x++) {
        var dx = (x - 24) / 16, dy = (y - 20) / 14;
        if (dx * dx + dy * dy <= 1 && y < 20) img.data[y * 48 + x] = hex("#d74848");
      }
      fillRect(img, 14, 8, 4, 4, hex("#fff")); fillRect(img, 28, 6, 5, 5, hex("#fff")); fillRect(img, 33, 13, 3, 3, hex("#fff"));
    }
  });
  A.sprites.sprite = makeMonster({
    body: hex("#ffd93b"), belly: hex("#fff0a8"), rx: 12, ry: 12,
    extra: function (img, setPx, fillRect, hex) {
      fillRect(img, 4, 16, 8, 4, hex("#cfe8ff")); fillRect(img, 36, 16, 8, 4, hex("#cfe8ff"));
      fillRect(img, 6, 12, 6, 4, hex("#e8f4ff")); fillRect(img, 36, 12, 6, 4, hex("#e8f4ff"));
    }
  });
  A.sprites.mossraccoon = makeMonster({
    body: hex("#78604b"), belly: hex("#e8d2ad"), rx: 16, ry: 13,
    extra: function (img, setPx, fillRect, hex) {
      fillRect(img, 9, 7, 7, 8, hex("#8c6a3f")); fillRect(img, 32, 7, 7, 8, hex("#8c6a3f"));
      fillRect(img, 3, 29, 9, 7, hex("#567a36")); fillRect(img, 6, 26, 7, 4, hex("#8daa48"));
    }
  });
  A.sprites.wolf = makeMonster({
    body: hex("#8a8f9a"), belly: hex("#c7ccd6"), rx: 17, ry: 13,
    extra: function (img, setPx, fillRect, hex) {
      fillRect(img, 9, 8, 6, 8, hex("#8a8f9a")); fillRect(img, 33, 8, 6, 8, hex("#8a8f9a"));
      fillRect(img, 10, 9, 3, 4, hex("#5a5f6a")); fillRect(img, 35, 9, 3, 4, hex("#5a5f6a"));
    }
  });
  A.sprites.scorpion = makeMonster({
    body: hex("#c98d45"), belly: hex("#ecc277"), rx: 16, ry: 11,
    extra: function (img, setPx, fillRect, hex) {
      for (var i = 0; i < 8; i++) { setPx(img, 40 + (i > 3 ? 1 : 0), 30 - i, hex("#a8702e")); }
      setPx(img, 41, 21, hex("#d74848")); setPx(img, 40, 20, hex("#d74848"));
      fillRect(img, 4, 30, 5, 3, hex("#a8702e")); fillRect(img, 39, 34, 5, 3, hex("#a8702e"));
    }
  });
  A.sprites.cactus = makeMonster({
    body: hex("#3f9a4f"), belly: hex("#62c06f"), rx: 12, ry: 16,
    extra: function (img, setPx, fillRect, hex) {
      fillRect(img, 4, 18, 6, 4, hex("#3f9a4f")); fillRect(img, 4, 14, 3, 8, hex("#3f9a4f"));
      fillRect(img, 38, 22, 6, 4, hex("#3f9a4f")); fillRect(img, 41, 18, 3, 8, hex("#3f9a4f"));
      setPx(img, 22, 6, hex("#ffd93b")); setPx(img, 25, 5, hex("#ffd93b"));
    }
  });
  A.sprites.golem = makeMonster({
    body: hex("#b0906a"), belly: hex("#d0b08a"), rx: 18, ry: 14,
    extra: function (img, setPx, fillRect, hex) {
      fillRect(img, 8, 8, 8, 6, hex("#b0906a")); fillRect(img, 32, 8, 8, 6, hex("#b0906a"));
      setPx(img, 18, 32, hex("#8a6a4a")); setPx(img, 28, 36, hex("#8a6a4a")); setPx(img, 23, 40, hex("#8a6a4a"));
    }
  });
  A.sprites.sunscarab = makeMonster({
    body: hex("#d79b28"), belly: hex("#ffd86a"), rx: 18, ry: 12,
    extra: function (img, setPx, fillRect, hex) {
      fillRect(img, 13, 9, 22, 4, hex("#34b9ad"));
      fillRect(img, 7, 32, 6, 4, hex("#9b6423")); fillRect(img, 35, 32, 6, 4, hex("#9b6423"));
    }
  });
  A.sprites.bandit = makeMonster({
    body: hex("#7a5a9a"), belly: hex("#9a7aba"), rx: 14, ry: 13,
    extra: function (img, setPx, fillRect, hex) {
      fillRect(img, 10, 12, 28, 8, hex("#3a2a4a"));
      fillRect(img, 12, 44, 24, 4, hex("#f4b41b"));
    }
  });
  A.sprites.bat = makeMonster({
    body: hex("#6a7ade"), belly: hex("#8a9ae8"), rx: 11, ry: 10,
    extra: function (img, setPx, fillRect, hex) {
      for (var i = 0; i < 10; i++) {
        setPx(img, 12 - i, 22 - (i % 3), hex("#6a7ade")); setPx(img, 12 - i, 23 - (i % 3), hex("#6a7ade"));
        setPx(img, 36 + i, 22 - (i % 3), hex("#6a7ade")); setPx(img, 36 + i, 23 - (i % 3), hex("#6a7ade"));
      }
      setPx(img, 20, 34, hex("#fff")); setPx(img, 27, 34, hex("#fff"));
    }
  });
  A.sprites.crystalcrab = makeMonster({
    body: hex("#7ac0e0"), belly: hex("#a8e0f4"), rx: 16, ry: 11,
    extra: function (img, setPx, fillRect, hex) {
      fillRect(img, 18, 6, 4, 8, hex("#9a6ae0")); fillRect(img, 24, 4, 4, 10, hex("#9a6ae0")); fillRect(img, 30, 7, 3, 7, hex("#9a6ae0"));
      fillRect(img, 4, 28, 6, 4, hex("#7ac0e0")); fillRect(img, 38, 28, 6, 4, hex("#7ac0e0"));
    }
  });
  A.sprites.iceimp = makeMonster({
    body: hex("#a8d8f4"), belly: hex("#d8f0ff"), rx: 12, ry: 12,
    extra: function (img, setPx, fillRect, hex) {
      horn(img, setPx, fillRect, hex, 14, 12, hex("#e8f4ff")); horn(img, setPx, fillRect, hex, 32, 12, hex("#e8f4ff"));
    }
  });
  A.sprites.frostwisp = makeMonster({
    body: hex("#e8f4ff"), belly: hex("#c8e8ff"), rx: 16, ry: 14,
    extra: function (img, setPx, fillRect, hex) {
      horn(img, setPx, fillRect, hex, 13, 13, hex("#68c8f0")); horn(img, setPx, fillRect, hex, 33, 13, hex("#68c8f0"));
      fillRect(img, 21, 31, 6, 7, hex("#65d9e8"));
    }
  });
  A.sprites.knight = makeMonster({
    body: hex("#5a6a8a"), belly: hex("#7a8aaa"), rx: 15, ry: 14,
    extra: function (img, setPx, fillRect, hex) {
      fillRect(img, 10, 10, 28, 10, hex("#4a5876"));
      fillRect(img, 20, 4, 8, 8, hex("#9ad0ff"));
      fillRect(img, 38, 24, 6, 14, hex("#9ad0ff"));
    }
  });

  /* Boss 佔位（64×64，放大版＋王冠/特徵） */
  function bigBoss(base, scaleUp, extra) {
    var img = base;
    var W = 64, H = 64, out = blank(W, H);
    for (var y = 0; y < H; y++)
      for (var x = 0; x < W; x++) {
        var sx = (x * img.w / W) | 0, sy = (y * img.h / H) | 0;
        out.data[y * W + x] = img.data[sy * img.w + sx];
      }
    if (extra) extra(out, setPx, fillRect, hex);
    return out;
  }
  A.sprites.treant = bigBoss(makeMonster({
    body: hex("#7a5230"), belly: hex("#9a7040"), rx: 17, ry: 15,
    extra: function (img, setPx, fillRect, hex) {
      fillRect(img, 8, 2, 8, 8, hex("#3f9a4f")); fillRect(img, 20, 0, 8, 8, hex("#3f9a4f")); fillRect(img, 32, 2, 8, 8, hex("#3f9a4f"));
    }
  }), true);
  A.sprites.sandworm = bigBoss(makeMonster({
    body: hex("#c98d45"), belly: hex("#ecc277"), rx: 18, ry: 12,
    extra: function (img, setPx, fillRect, hex) {
      for (var s = 0; s < 6; s++) fillRect(img, 10 + s * 5, 14, 2, 4, hex("#a8702e"));
      fillRect(img, 18, 30, 12, 8, hex("#8a4a2a"));
    }
  }), true);
  A.sprites.demonlord = bigBoss(makeMonster({
    body: hex("#4a3a6a"), belly: hex("#6a5a8a"), rx: 16, ry: 14,
    extra: function (img, setPx, fillRect, hex) {
      horn(img, setPx, fillRect, hex, 12, 10, hex("#9ad0ff")); horn(img, setPx, fillRect, hex, 34, 10, hex("#9ad0ff"));
      fillRect(img, 20, 2, 8, 6, hex("#9a6ae0"));
    }
  }), true, function (img, setPx, fillRect, hex) {
    fillRect(img, 24, 0, 16, 6, hex("#ffd93b"));
  });

  /* 商店老闆 / 營火 / 寶箱（事件 sprite） */
  A.sprites.shopkeeper = makeMonster({
    body: hex("#e07a3f"), belly: hex("#f4b41b"), rx: 14, ry: 13,
    extra: function (img, setPx, fillRect, hex) {
      fillRect(img, 10, 6, 28, 8, hex("#8a4a2a"));
      fillRect(img, 12, 2, 24, 5, hex("#8a4a2a"));
    }
  });
  A.sprites.campfire = (function () {
    var img = blank(48, 48);
    fillRect(img, 10, 38, 28, 6, hex("#6a4526"));
    fillRect(img, 14, 34, 20, 4, hex("#7a5230"));
    for (var y = 8; y < 36; y++) for (var x = 12; x < 36; x++) {
      var dx = (x - 24) / 11, dy = (y - 34) / 26;
      if (dx * dx + dy * dy <= 1 && y < 36) {
        img.data[y * 48 + x] = y > 24 ? hex("#e07a3f") : (y > 16 ? hex("#f4b41b") : hex("#ffd93b"));
      }
    }
    return img;
  })();
  A.sprites.chestClosed = (function () {
    var img = blank(48, 48);
    fillRect(img, 8, 14, 32, 12, hex("#8a5f2e"));
    fillRect(img, 8, 26, 32, 16, hex("#6a4526"));
    fillRect(img, 8, 14, 32, 3, hex("#f4b41b"));
    fillRect(img, 21, 24, 6, 8, hex("#ffd93b"));
    return img;
  })();

  /* ═══════════ UI canvas 圖標 ═══════════ */
  /* 將 sprite 放大畫到小 canvas（給 DOM 用） */
  A.spriteToCanvas = function (spr, scale) {
    scale = scale || 4;
    var cv = document.createElement("canvas");
    cv.width = spr.w * scale; cv.height = spr.h * scale;
    var ctx = cv.getContext("2d");
    var id = ctx.createImageData(spr.w, spr.h);
    var u8 = new Uint8ClampedArray(spr.data.buffer);
    id.data.set(u8);
    var tmp = document.createElement("canvas");
    tmp.width = spr.w; tmp.height = spr.h;
    tmp.getContext("2d").putImageData(id, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, cv.width, cv.height);
    return cv;
  };

  /* base64 圖片轉 sprite（M7 AI 素材用） */
  A.registerImage = function (name, dataUrl, w, h, cb, preserveAspect) {
    return new Promise(function (resolve, reject) {
      var im = new Image();
      im.onload = function () {
        try {
        var cv = document.createElement("canvas");
        var drawW = w, drawH = h;
        /* 怪物素材可為寬體或高體；保留比例，避免冰蝠的翼展被壓扁。 */
        if (preserveAspect) {
          var ratio = Math.min(w / im.width, h / im.height);
          drawW = Math.max(1, Math.round(im.width * ratio));
          drawH = Math.max(1, Math.round(im.height * ratio));
        }
        cv.width = drawW; cv.height = drawH;
        var ctx = cv.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(im, 0, 0, drawW, drawH);
        var id = ctx.getImageData(0, 0, drawW, drawH);
        var spr = { w: drawW, h: drawH, data: new Uint32Array(id.data.buffer.slice(0)) };
        A.sprites[name] = spr;
        /* 遊戲已開始時，正式素材完成後立即替換場上的同名備用圖。 */
        if (GAME.Raycaster && GAME.Raycaster.sprites) {
          GAME.Raycaster.sprites.forEach(function (live) {
            if (live.spriteKey === name && !live.isAttacking) live.spr = spr;
          });
        }
        if (cb) cb(spr);
        resolve(spr);
        } catch (err) {
          reject(err);
        }
      };
      im.onerror = function () { reject(new Error("素材載入失敗：" + dataUrl)); };
      im.src = dataUrl;
    });
  };

  /* 載入瀏覽器最佳化後的正式美術素材。 */
  A.loadAIAssets = function (onProgress) {
    var base = "assets/runtime/textures/";
    var spriteBase = "assets/runtime/idle/";
    var spriteVersion = "?v=20260827-loader1";
    var textureFiles = {
      forestA: "forest_a.png", forestB: "forest_b.png",
      desertA: "desert_a.png", desertB: "desert_b.png",
      caveA: "cave_a.png", caveB: "cave_b.png"
    };
    var spriteFiles = {
      slime: "slime.png", mushroom: "mushroom.png", sprite: "sprite.png", mossraccoon: "mossraccoon.png",
      wolf: "wolf.png", scorpion: "scorpion.png", cactus: "cactus.png",
      golem: "golem.png", sunscarab: "sunscarab.png", bandit: "bandit.png", bat: "bat.png",
      crystalcrab: "crystalcrab.png", iceimp: "iceimp.png", frostwisp: "frostwisp.png", knight: "knight.png",
      treant: "treant.png", sandworm: "sandworm.png", demonlord: "demonlord.png",
      shopkeeper: "shopkeeper.png", campfire: "campfire.png", chestClosed: "chestClosed.png"
    };
    /* 怪物攻擊幀：待機立繪仍使用上方素材，戰鬥出手時才切換。 */
    var attackSpriteFiles = {
      slime: "slime-attack.png", mushroom: "mushroom-attack.png", sprite: "sprite-attack.png", mossraccoon: "mossraccoon-attack.png",
      wolf: "wolf-attack.png", scorpion: "scorpion-attack.png", cactus: "cactus-attack.png",
      golem: "golem-attack.png", sunscarab: "sunscarab-attack.png", bandit: "bandit-attack.png", bat: "bat-attack.png",
      crystalcrab: "crystalcrab-attack.png", iceimp: "iceimp-attack.png", frostwisp: "frostwisp-attack.png", knight: "knight-attack.png",
      treant: "treant-attack.png", sandworm: "sandworm-attack.png", demonlord: "demonlord-attack.png"
    };
    var tasks = [], failed = false;
    function addTask(label, factory) { tasks.push({ label: label, run: factory }); }
    function preloadImage(src) {
      return new Promise(function (resolve, reject) {
        var im = new Image(), timer = setTimeout(function () { reject(new Error("素材載入逾時：" + src)); }, 12000);
        im.onload = function () { clearTimeout(timer); resolve(im); };
        im.onerror = function () { clearTimeout(timer); reject(new Error("素材載入失敗：" + src)); };
        im.src = src;
      });
    }
    Object.keys(textureFiles).forEach(function (name) {
      addTask("雕刻地城牆面⋯", function () { return A.registerImage(name, base + textureFiles[name] + spriteVersion, 64, 64).then(function (img) {
        A.textures[name] = img;
      }); });
    });
    Object.keys(spriteFiles).forEach(function (name) {
      addTask("召喚怪物與旅人⋯", function () { return A.registerImage(name, spriteBase + spriteFiles[name] + spriteVersion, 192, 192, null, true); });
    });
    Object.keys(attackSpriteFiles).forEach(function (name) {
      addTask("準備怪物戰鬥動作⋯", function () { return A.registerImage(name + "_attack", "assets/runtime/attack/" + attackSpriteFiles[name] + spriteVersion, 192, 192, null, true); });
    });
    [
      "assets/runtime/menu-bg.png", "assets/runtime/scenes/explore-forest.png", "assets/runtime/scenes/explore-desert.png",
      "assets/runtime/scenes/explore-cave.png", "assets/runtime/scenes/battle-arena.png", "assets/runtime/scenes/boss-arena.png",
      "assets/runtime/floors/floor-forest.png", "assets/runtime/floors/floor-desert.png", "assets/runtime/floors/floor-cave.png",
      "assets/runtime/floors/floor-stone.png", "assets/generated/hero-adventurer.png", "assets/generated/ui-rune-divider.png",
      "assets/generated/items/potion-s.png", "assets/generated/items/potion-l.png", "assets/generated/items/lifedrain.png",
      "assets/generated/items/ether.png", "assets/generated/items/def-tonic.png", "assets/generated/items/atk-tonic.png"
    ].forEach(function (src) {
      addTask("鋪設場景與冒險道具⋯", function () { return preloadImage(src + spriteVersion); });
    });
    var next = 0, done = 0;
    function worker() {
      if (next >= tasks.length) return Promise.resolve();
      var task = tasks[next++];
      return task.run().catch(function (err) {
        failed = true;
        console.warn(err.message);
      }).then(function () {
        done++;
        if (onProgress) onProgress({ done: done, total: tasks.length, percent: Math.round(done * 100 / tasks.length), label: task.label, failed: failed });
      }).then(worker);
    }
    if (onProgress) onProgress({ done: 0, total: tasks.length, percent: 0, label: "整理冒險行囊⋯", failed: false });
    var workers = [];
    for (var wi = 0; wi < Math.min(4, tasks.length); wi++) workers.push(worker());
    return Promise.all(workers).then(function () {
      A.aiLoaded = !failed;
      A.aiReadyDone = true;
      return A;
    });
  };
  A.aiReady = null;
  A.aiReadyDone = false;
  A.ensureAIAssets = function (onProgress) {
    if (!A.aiReady) A.aiReady = A.loadAIAssets(onProgress);
    else if (A.aiReadyDone && onProgress) onProgress({ done: 1, total: 1, percent: 100, label: "秘境之門已開啟！", failed: !A.aiLoaded });
    return A.aiReady;
  };

  /* 旋轉手機圖標（畫到 #rotate-icon） */
  A.drawRotateIcon = function (canvas) {
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 96, 96);
    ctx.fillStyle = "#f4b41b";
    ctx.fillRect(28, 12, 40, 72);          // 手機身
    ctx.fillStyle = "#1a1c2c";
    ctx.fillRect(33, 20, 30, 48);          // 屏幕
    ctx.fillStyle = "#38b764";
    ctx.fillRect(38, 26, 20, 20);          // 屏幕內容
    ctx.fillStyle = "#f4b41b";
    ctx.fillRect(42, 74, 12, 6);           // home 鍵
  };
})();
