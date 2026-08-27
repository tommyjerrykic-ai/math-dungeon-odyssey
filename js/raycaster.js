/* ═══════════════ 《數境迷航》 偽3D Raycasting 渲染器 ═══════════════
   經典 DDA 逐列投射（參考 lodev 算法），Uint32 直寫 ImageData。
   格狀地圖：0=空地；>=1 = 牆（textures[grid-1]）。玩家永遠面向四正方向。 */
(function () {
  var RC = GAME.Raycaster = {};

  var W = 400, H = 312;   /* CSS 800×624，2x 整數縮放 */
  var FOV = 66 * Math.PI / 180;
  var PLANE = Math.tan(FOV / 2);

  var canvas, ctx, frame, buf32;          // 渲染目標
  var grid = null, mapW = 0, mapH = 0;    // 地圖
  var textures = [];                      // 紋理陣列
  var zbuffer = new Float32Array(W);      // 每列牆距
  var backdropSrc = "", backdropData = null;
  var floorTextureSrc = "", floorTextureData = null, floorTextureW = 0, floorTextureH = 0;
  var wallsVisible = true;
  var sceneMood = "forest";
  var effects = [];

  /* 相機狀態 */
  RC.x = 1.5; RC.y = 1.5;                 // 位置（格心）
  RC.angle = 0;                           // 朝向（弧度，僅 0/90/180/270 的插值）
  RC.bobPhase = 0; RC.bobAmp = 0;         // 走路晃動

  /* 天空地板色（按地區設定） */
  var skyTop = [126, 200, 244], skyBot = [216, 240, 255];
  var floorNear = [63, 122, 52], floorFar = [126, 200, 80];

  /* billboard sprites：{x,y,spr,height(格),bob(浮動)} */
  RC.sprites = [];

  /* 動畫狀態 */
  var anim = null;   // {type:'move'|'turn', fx,fy, tx,ty / fa,ta, t, dur, cb}

  RC.init = function (cv) {
    canvas = cv;
    canvas.width = W; canvas.height = H;
    ctx = canvas.getContext("2d");
    frame = ctx.createImageData(W, H);
    buf32 = new Uint32Array(frame.data.buffer);
  };

  RC.setMap = function (g, w, h) { grid = g; mapW = w; mapH = h; };
  RC.setTextures = function (arr) { textures = arr; };
  RC.setWallsVisible = function (visible) { wallsVisible = visible !== false; };
  RC.setSceneMood = function (mood) { sceneMood = mood || "forest"; };
  RC.spawnEffect = function (kind, opts) {
    opts = opts || {};
    effects.push({ kind: kind || "hit", age: 0, dur: opts.duration || 420, color: opts.color || null,
      x: typeof opts.x === "number" ? opts.x : .5, y: typeof opts.y === "number" ? opts.y : .56,
      seed: (Date.now() + effects.length * 977) % 100000 });
    if (effects.length > 10) effects.shift();
  };
  RC.clearEffects = function () { effects = []; };
  RC.setSkyFloor = function (st, sb, fn, ff) { skyTop = st; skyBot = sb; floorNear = fn; floorFar = ff; };
  RC.setFloorTexture = function (src) {
    if (!src) { floorTextureSrc = ""; floorTextureData = null; return; }
    if (src === floorTextureSrc && floorTextureData) return;
    floorTextureSrc = src;
    floorTextureData = null;
    var im = new Image();
    im.onload = function () {
      if (src !== floorTextureSrc) return;
      var cv = document.createElement("canvas");
      cv.width = 128; cv.height = 128;
      var bctx = cv.getContext("2d");
      bctx.imageSmoothingEnabled = true;
      bctx.drawImage(im, 0, 0, cv.width, cv.height);
      floorTextureW = cv.width;
      floorTextureH = cv.height;
      floorTextureData = new Uint32Array(bctx.getImageData(0, 0, cv.width, cv.height).data.buffer.slice(0));
    };
    im.onerror = function () { if (src === floorTextureSrc) floorTextureData = null; };
    im.src = src;
  };
  RC.setBackdrop = function (src) {
    if (!src) { backdropSrc = ""; backdropData = null; return; }
    if (src === backdropSrc && backdropData) return;
    backdropSrc = src;
    backdropData = null;
    var im = new Image();
    im.onload = function () {
      if (src !== backdropSrc) return;
      var cv = document.createElement("canvas");
      cv.width = W; cv.height = H;
      var bctx = cv.getContext("2d");
      bctx.imageSmoothingEnabled = true;
      bctx.drawImage(im, 0, 0, W, H);
      backdropData = new Uint32Array(bctx.getImageData(0, 0, W, H).data.buffer.slice(0));
    };
    im.onerror = function () { if (src === backdropSrc) backdropData = null; };
    im.src = src;
  };
  RC.setPos = function (x, y, angle) { RC.x = x; RC.y = y; RC.angle = angle; anim = null; };

  /* ── 動畫 API ── */
  RC.isAnimating = function () { return !!anim; };
  RC.moveTo = function (nx, ny, dur, cb) {
    anim = { type: "move", fx: RC.x, fy: RC.y, tx: nx, ty: ny, t: 0, dur: dur || 260, cb: cb };
    RC.bobAmp = 1;
  };
  RC.turnTo = function (targetAngle, dur, cb) {
    /* 選最短路徑 */
    var a = RC.angle, b = targetAngle;
    var d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    anim = { type: "turn", fa: a, ta: a + d, t: 0, dur: dur || 200, cb: cb };
  };

  RC.update = function (dt) {
    for (var ei = effects.length - 1; ei >= 0; ei--) {
      effects[ei].age += dt;
      if (effects[ei].age >= effects[ei].dur) effects.splice(ei, 1);
    }
    if (!anim) { RC.bobAmp *= 0.9; return; }
    anim.t += dt;
    var k = Math.min(1, anim.t / anim.dur);
    var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;   // easeInOutQuad
    if (anim.type === "move") {
      RC.x = anim.fx + (anim.tx - anim.fx) * e;
      RC.y = anim.fy + (anim.ty - anim.fy) * e;
      RC.bobPhase += dt * 0.02;
    } else {
      RC.angle = anim.fa + (anim.ta - anim.fa) * e;
    }
    if (k >= 1) {
      var cb = anim.cb;
      if (anim.type === "turn") RC.angle = anim.ta;
      anim = null;
      RC.bobAmp = 0;
      if (cb) cb();
    }
  };

  /* ── 顏色工具 ── */
  function shade(c, s) {
    var r = ((c & 255) * s) | 0, g = (((c >> 8) & 255) * s) | 0, b = (((c >> 16) & 255) * s) | 0;
    return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
  }

  function blend(c, r, g, b, a) {
    var br = c & 255, bg = (c >> 8) & 255, bb = (c >> 16) & 255;
    br = (br + (r - br) * a) | 0;
    bg = (bg + (g - bg) * a) | 0;
    bb = (bb + (b - bb) * a) | 0;
    return (0xff000000 | (bb << 16) | (bg << 8) | br) >>> 0;
  }

  function drawExplorationFloor(horizon, dirX, dirY, planeX, planeY) {
    var start = Math.max(0, Math.min(H - 1, horizon | 0));
    var depth = Math.max(1, H - start);
    var y, x, i, row, lineX, alpha, p;

    if (floorTextureData) {
      var rayDirX0 = dirX - planeX, rayDirY0 = dirY - planeY;
      var rayDirX1 = dirX + planeX, rayDirY1 = dirY + planeY;
      for (y = start; y < H; y++) {
        var rowDistance = (H * 0.52) / Math.max(1, y - start + 1);
        var floorStepX = rowDistance * (rayDirX1 - rayDirX0) / W;
        var floorStepY = rowDistance * (rayDirY1 - rayDirY0) / W;
        var floorX = RC.x + rowDistance * rayDirX0;
        var floorY = RC.y + rowDistance * rayDirY0;
        for (x = 0; x < W; x++) {
          var tx = Math.floor(floorX * 0.28 * floorTextureW) % floorTextureW;
          var ty = Math.floor(floorY * 0.28 * floorTextureH) % floorTextureH;
          if (tx < 0) tx += floorTextureW;
          if (ty < 0) ty += floorTextureH;
          var tile = floorTextureData[ty * floorTextureW + tx];
          var tileShade = 0.58 + ((y - start) / depth) * 0.34;
          buf32[y * W + x] = shade(tile, tileShade);
          floorX += floorStepX;
          floorY += floorStepY;
        }
      }
      return;
    }

    /* Darken the lower plane so the player feels grounded. */
    for (y = start; y < H; y++) {
      p = (y - start) / depth;
      alpha = 0.06 + p * 0.09;
      for (x = 0; x < W; x++) {
        buf32[y * W + x] = blend(buf32[y * W + x], 8, 14, 30, alpha);
      }
    }

    /* Receding tile seams: sparse near the horizon, wider toward the player. */
    for (i = 1; i <= 9; i++) {
      p = Math.pow(i / 9, 1.8);
      row = (start + p * depth) | 0;
      if (row < 0 || row >= H) continue;
      alpha = 0.09 + p * 0.10;
      for (x = 0; x < W; x++) {
        buf32[row * W + x] = blend(buf32[row * W + x], 104, 180, 151, alpha);
      }
    }

    /* Long seams converge at the vanishing point. */
    for (i = -6; i <= 6; i++) {
      for (y = start; y < H; y++) {
        p = (y - start) / depth;
        lineX = W / 2 + i * (5 + p * 35);
        x = lineX | 0;
        if (x >= 0 && x < W) {
          buf32[y * W + x] = blend(buf32[y * W + x], 92, 171, 145, 0.10 + p * 0.12);
        }
      }
    }
  }

  function putGlow(x, y, r, g, b, a, size) {
    var px, py, sx = size || 1;
    for (py = -sx; py <= sx; py++) for (px = -sx; px <= sx; px++) {
      var tx = (x + px) | 0, ty = (y + py) | 0;
      if (tx >= 0 && tx < W && ty >= 0 && ty < H) {
        var falloff = 1 - (Math.abs(px) + Math.abs(py)) / (sx * 2 + 1);
        buf32[ty * W + tx] = blend(buf32[ty * W + tx], r, g, b, a * falloff);
      }
    }
  }

  /* 地區氣氛：森林飄葉、沙漠揚沙、洞窟冰晶。保持稀疏，避免蓋住怪物與 UI。 */
  function drawAtmosphere(horizon) {
    if (GAME.state !== "EXPLORE" && GAME.state !== "JUNCTION" && GAME.state !== "EVENT") return;
    var now = Date.now() * 0.001, i, seed, x, y, c;
    var count = sceneMood === "cave" ? 22 : 16;
    for (i = 0; i < count; i++) {
      seed = i * 37.17;
      x = ((seed * 53 + now * (sceneMood === "desert" ? 19 : 10)) % (W + 30)) - 15;
      y = horizon - 16 + ((seed * 29 + now * (sceneMood === "forest" ? 13 : 7)) % (H - horizon + 24));
      if (sceneMood === "forest") {
        x += Math.sin(now * 1.7 + seed) * 10;
        c = i % 3 ? [126, 205, 93] : [241, 204, 97];
        putGlow(x, y, c[0], c[1], c[2], .18, i % 4 === 0 ? 2 : 1);
      } else if (sceneMood === "desert") {
        y = horizon + 10 + ((seed * 41 + now * 10) % (H - horizon - 8));
        c = i % 2 ? [242, 193, 106] : [205, 139, 68];
        putGlow(x, y, c[0], c[1], c[2], .13, i % 5 === 0 ? 2 : 1);
      } else {
        x += Math.sin(now + seed) * 5;
        c = i % 3 ? [114, 219, 248] : [221, 247, 255];
        putGlow(x, y, c[0], c[1], c[2], .20, i % 4 === 0 ? 2 : 1);
      }
    }
  }

  /* 命中、法術、敵襲與事件揭示共用的像素特效。 */
  function drawEffects() {
    var i, j, fx, p, cx, cy, ang, rad, col, count;
    for (i = 0; i < effects.length; i++) {
      fx = effects[i]; p = fx.age / fx.dur;
      cx = W * fx.x; cy = H * fx.y;
      if (fx.kind === "reveal") {
        for (j = 0; j < 18; j++) {
          ang = j * 0.349 + p * 2.8;
          rad = 12 + p * 62 + (j % 3) * 3;
          putGlow(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * .42, 255, 220, 105, (1 - p) * .55, 1);
        }
        continue;
      }
      if (fx.kind === "heal") col = [90, 238, 157];
      else if (fx.kind === "spell") col = fx.color || [255, 142, 72];
      else if (fx.kind === "enemy") col = [255, 89, 111];
      else col = fx.color || [255, 231, 146];
      count = fx.kind === "enemy" ? 14 : 20;
      for (j = 0; j < count; j++) {
        ang = j * 2.399 + fx.seed * .0001;
        rad = 6 + p * (fx.kind === "enemy" ? 52 : 42) + (j % 4) * 2;
        putGlow(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * .60 - p * 9,
          col[0], col[1], col[2], (1 - p) * .78, j % 5 === 0 ? 2 : 1);
      }
    }
  }

  function hexRGB(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  RC.hexRGB = hexRGB;

  /* ── 主渲染 ── */
  RC.render = function () {
    if (!grid) return;
    var dirX = Math.cos(RC.angle), dirY = Math.sin(RC.angle);
    var planeX = -dirY * PLANE, planeY = dirX * PLANE;
    var horizon = (H / 2) + Math.sin(RC.bobPhase) * 3 * RC.bobAmp;

    var x, y;
    if (backdropData) buf32.set(backdropData);
    if (!backdropData) {

    /* 天空（上半漸層） */
    for (y = 0; y < H / 2; y++) {
      var t = y / (H / 2);
      var r = (skyTop[0] + (skyBot[0] - skyTop[0]) * t) | 0;
      var g = (skyTop[1] + (skyBot[1] - skyTop[1]) * t) | 0;
      var b = (skyTop[2] + (skyBot[2] - skyTop[2]) * t) | 0;
      var c = (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
      for (x = 0; x < W; x++) buf32[y * W + x] = c;
    }
    /* 地板（下半漸層：遠亮近暗） */
    for (y = H / 2; y < H; y++) {
      var t2 = (y - H / 2) / (H / 2);
      var r2 = (floorFar[0] + (floorNear[0] - floorFar[0]) * t2) | 0;
      var g2 = (floorFar[1] + (floorNear[1] - floorFar[1]) * t2) | 0;
      var b2 = (floorFar[2] + (floorNear[2] - floorFar[2]) * t2) | 0;
      var c2 = (0xff000000 | (b2 << 16) | (g2 << 8) | r2) >>> 0;
      for (x = 0; x < W; x++) buf32[y * W + x] = c2;
    }
    }

    /* ── 牆：DDA 逐列 ── */
    if (backdropData && floorTextureData) {
      drawExplorationFloor(horizon, dirX, dirY, planeX, planeY);
    }

    for (x = 0; x < W; x++) {
      var camX = 2 * x / W - 1;
      var rdx = dirX + planeX * camX, rdy = dirY + planeY * camX;
      var mx = RC.x | 0, my = RC.y | 0;
      var ddx = (rdx === 0) ? 1e30 : Math.abs(1 / rdx);
      var ddy = (rdy === 0) ? 1e30 : Math.abs(1 / rdy);
      var stepX, stepY, sideX, sideY;
      if (rdx < 0) { stepX = -1; sideX = (RC.x - mx) * ddx; } else { stepX = 1; sideX = (mx + 1 - RC.x) * ddx; }
      if (rdy < 0) { stepY = -1; sideY = (RC.y - my) * ddy; } else { stepY = 1; sideY = (my + 1 - RC.y) * ddy; }

      var hit = 0, side = 0, cell = 0, guard = 0;
      while (hit === 0 && guard++ < 64) {
        if (sideX < sideY) { sideX += ddx; mx += stepX; side = 0; }
        else { sideY += ddy; my += stepY; side = 1; }
        if (mx < 0 || my < 0 || mx >= mapW || my >= mapH) { hit = 1; cell = 1; break; }
        cell = grid[my * mapW + mx];
        if (cell > 0) hit = 1;
      }
      var perp = (side === 0) ? (sideX - ddx) : (sideY - ddy);
      if (perp < 0.02) perp = 0.02;
      zbuffer[x] = perp;

      // Boss arena uses the complete backdrop and floor, without corridor walls.
      if (!wallsVisible) continue;

      var lineH = H / perp;
      var drawStart = horizon - lineH / 2;
      var drawEnd = horizon + lineH / 2;

      /* 紋理 x */
      var wallX = (side === 0) ? RC.y + perp * rdy : RC.x + perp * rdx;
      wallX -= Math.floor(wallX);
      var tex = textures[Math.max(0, cell - 1)];
      if (!tex) continue;
      var tx = (wallX * tex.w) | 0;
      if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) tx = tex.w - tx - 1;

      /* 距離暗化 + 側面暗化 */
      var s = 1 / (1 + perp * perp * 0.06);
      if (side === 1) s *= 0.72;

      var yStart = Math.max(0, drawStart | 0), yEnd = Math.min(H - 1, drawEnd | 0);
      for (y = yStart; y <= yEnd; y++) {
        var ty = (((y - drawStart) / lineH) * tex.h) | 0;
        if (ty < 0) ty = 0; else if (ty >= tex.h) ty = tex.h - 1;
        buf32[y * W + x] = shade(tex.data[ty * tex.w + tx], s);
      }
    }

    /* ── billboard sprites（遠→近排序） ── */
    var sp = RC.sprites;
    var i, order = [];
    for (i = 0; i < sp.length; i++) {
      var dx0 = sp[i].x - RC.x, dy0 = sp[i].y - RC.y;
      order.push({ i: i, d: dx0 * dx0 + dy0 * dy0 });
    }
    order.sort(function (a, b) { return b.d - a.d; });

    var invDet = 1 / (planeX * dirY - dirX * planeY);
    for (var o = 0; o < order.length; o++) {
      var s2 = sp[order[o].i];
      var relX = s2.x - RC.x, relY = s2.y - RC.y;
      var trX = invDet * (dirY * relX - dirX * relY);
      var trY = invDet * (-planeY * relX + planeX * relY);   // 深度
      if (trY <= 0.15) continue;
      var spr = s2.spr;
      var scaleH = (s2.height || 0.7);
      /* 站姿只做極小的左右重心移動，絕不改變高度，腳會穩穩貼在地面。 */
      var idleNudge = (s2.idleMotion && !s2.isAttacking) ? Math.sin(Date.now() * 0.005 + s2.x * 5 + s2.y * 3) * 0.9 : 0;
      var screenX = (((W / 2) * (1 + trX / trY)) + idleNudge) | 0;
      var vMove = (s2.vMove || 0) / trY;
      var hPix = Math.abs(H / trY) * scaleH;
      var bobY = s2.bob ? Math.sin(Date.now() * 0.004 + s2.x * 7) * 4 : 0;
      /* 所有可互動物件的腳底落在更靠近玩家的地面，避免漂在畫面正中央。 */
      var groundY = s2.eventSprite ? horizon + (H * 0.42 / trY) : horizon;
      var yTop = groundY - hPix * (s2.anchorTop ? 0.5 : 1) - vMove + bobY;
      var wPix = hPix * (spr.w / spr.h);
      var x0 = Math.max(0, (screenX - wPix / 2) | 0);
      var x1 = Math.min(W - 1, (screenX + wPix / 2) | 0);
      for (x = x0; x <= x1; x++) {
        if (trY >= zbuffer[x]) continue;                      // 被牆擋住
        var txx = (((x - (screenX - wPix / 2)) / wPix) * spr.w) | 0;
        if (txx < 0 || txx >= spr.w) continue;
        var yy0 = Math.max(0, yTop | 0), yy1 = Math.min(H - 1, (yTop + hPix) | 0);
        var sh2 = 1 / (1 + trY * trY * 0.05);
        for (y = yy0; y <= yy1; y++) {
          var tyy = (((y - yTop) / hPix) * spr.h) | 0;
          if (tyy < 0 || tyy >= spr.h) continue;
          var pix = spr.data[tyy * spr.w + txx];
          if ((pix >>> 24) < 128) continue;                    // 透明跳過
          buf32[y * W + x] = shade(pix, sh2);
        }
      }
    }

    drawAtmosphere(horizon);
    drawEffects();
    ctx.putImageData(frame, 0, 0);
  };
})();
