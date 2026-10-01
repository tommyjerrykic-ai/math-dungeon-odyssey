/* ═══════════════ 《數境迷航》 答題系統 ═══════════════
   - draw()：按地區+難度抽題（局內不放回）
   - ask()：顯示題目 → 收集作答（數字鍵盤/ABCD）→ 判定 → 回饋 → 回調
   - drawFigure()：程序畫幾何圖（附圖題） */
(function () {
  var Q = GAME.Quiz = {};

  var cur = null;            // 當前題目
  var onDone = null;         // 回調(isCorrect)
  var blankIdx = 0;          // 當前填第幾空
  var entries = [];          // 各空已輸入內容
  var entry = "";            // 當前輸入
  var busy = false;          // 回饋展示中，鎖輸入
  var seq = 0;               // 出題序號（每次 ask 遞增，區分同 id 的題）

  function $(id) { return document.getElementById(id); }

  /* ── 初始化：綁定按鈕（main init 調用） ── */
  Q.init = function () {
    var nums = document.querySelectorAll("#numpad .num-btn");
    for (var i = 0; i < nums.length; i++) {
      nums[i].addEventListener("click", function () { onKey(this.getAttribute("data-k")); });
    }
    var chs = document.querySelectorAll("#choices .choice-btn");
    for (var j = 0; j < chs.length; j++) {
      chs[j].addEventListener("click", function () { onChoice(parseInt(this.getAttribute("data-i"), 10), this); });
    }
  };

  /* ═══════════ 抽題（不放回） ═══════════ */
  Q.draw = function (regionId, difficulty) {
    var run = GAME.run;
    if (!run.usedQ) run.usedQ = {};
    var pool = QUESTION_BANK.filter(function (q) {
      if (q.regions && q.regions.length && q.regions.indexOf(regionId) < 0) return false;
      if (Math.abs(q.difficulty - difficulty) > 1) return false;   // 允許 ±1
      return !run.usedQ[q.id];
    });
    if (!pool.length) {                          /* 題池見底：重置 */
      run.usedQ = {};
      pool = QUESTION_BANK.filter(function (q) {
        if (q.regions && q.regions.length && q.regions.indexOf(regionId) < 0) return false;
        return Math.abs(q.difficulty - difficulty) <= 1;
      });
    }
    if (!pool.length) pool = QUESTION_BANK.slice();   /* 極端保底 */
    var q = pool[(Math.random() * pool.length) | 0];
    run.usedQ[q.id] = true;
    return q;
  };

  /* ═══════════ 答題主流程 ═══════════ */
  /* ask(q, callback)：callback(isCorrect) */
  Q.ask = function (q, callback) {
    cur = q;
    cur._seq = ++seq;
    onDone = callback;
    blankIdx = 0;
    entries = [];
    entry = "";
    busy = false;
    if (GAME.run) GAME.run.questions++;

    /* 題目文字與圖 */
    var imgUrl = null;
    if (q.type === "img_mcq" && q.image) {
      imgUrl = (typeof q.image === "string") ? q.image : figureToDataUrl(q.image);
    }
    GAME.UI.setQuestion(q.question, imgUrl);

    if (q.type === "fill") {
      GAME.UI.showNumpad();
      updateNumpadDisplay();
    } else {
      /* 填入選項文字 */
      var labels = ["A", "B", "C", "D"];
      var chs = document.querySelectorAll("#choices .choice-btn");
      for (var i = 0; i < chs.length; i++) {
        chs[i].innerHTML = GAME.MathText.toHTML(labels[i] + ". " + (q.options[i] || ""));
        chs[i].classList.remove("correct", "wrong");
        chs[i].disabled = false;
      }
      GAME.UI.showChoices();
    }
  };

  /* ═══════════ 數字鍵盤 ═══════════ */
  function onKey(k) {
    if (busy || !cur || cur.type !== "fill") return;
    if (k === "back") { entry = entry.slice(0, -1); }
    else if (k === "-") { entry = (entry[0] === "-") ? entry.slice(1) : "-" + entry; }
    else if (k === ".") { if (entry.indexOf(".") < 0 && entry.length && entry !== "-") entry += "."; }
    else if (k === "ok") { submitBlank(); return; }
    else if (entry.replace("-", "").length < 7) { entry += k; }
    GAME.Audio.sfx("click");
    updateNumpadDisplay();
  }

  function updateNumpadDisplay() {
    var d = $("numpad-entry");
    if (!cur || cur.type !== "fill") { d.textContent = ""; return; }
    var parts = [];
    for (var i = 0; i < cur.blanks.length; i++) {
      if (i < blankIdx) parts.push(entries[i]);
      else if (i === blankIdx) parts.push(entry);
    }
    var prefix = cur.blanks.length > 1 ? "第" + (blankIdx + 1) + "/" + cur.blanks.length + "空　" : "";
    d.textContent = prefix + (parts.join("，") || "");
  }

  function submitBlank() {
    if (entry === "" || entry === "-") return;                 /* 空答案不收 */
    entries[blankIdx] = entry;
    if (blankIdx + 1 < cur.blanks.length) {
      blankIdx++;
      entry = "";
      updateNumpadDisplay();
      return;
    }
    /* 全部填完：判定 */
    var ok = true;
    for (var i = 0; i < cur.blanks.length; i++) {
      if (!matchAnswer(entries[i], cur.blanks[i])) { ok = false; break; }
    }
    finish(ok);
  }

  /* 正規化比對：忽略空格、°、度、全半形、結尾多餘 .0 */
  function norm(s) {
    s = String(s).replace(/\s+/g, "").replace(/[°度]/g, "");
    s = s.replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
    s = s.replace(/．/g, ".").replace(/−/g, "-");
    if (/^-?\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, "");
    return s;
  }
  function matchAnswer(input, blank) {
    var n = norm(input);
    if (n === norm(blank.answer)) return true;
    if (blank.accept) {
      for (var i = 0; i < blank.accept.length; i++) {
        if (n === norm(blank.accept[i])) return true;
      }
    }
    /* 數值容差（防 40.0 vs 40 之類） */
    var a = parseFloat(n), b = parseFloat(norm(blank.answer));
    if (!isNaN(a) && !isNaN(b) && Math.abs(a - b) < 1e-9) return true;
    return false;
  }

  /* ═══════════ 選擇題 ═══════════ */
  function onChoice(i, btn) {
    if (busy || !cur || cur.type === "fill") return;
    busy = true;
    var ok = (i === cur.answer);
    var chs = document.querySelectorAll("#choices .choice-btn");
    for (var j = 0; j < chs.length; j++) {
      chs[j].disabled = true;
      if (j === cur.answer) chs[j].classList.add("correct");
    }
    if (!ok) btn.classList.add("wrong");
    setTimeout(function () { finish(ok); }, 220);
  }

  /* ═══════════ 結算回饋 ═══════════ */
  function finish(ok) {
    busy = true;
    var q = cur;
    if (GAME.run && ok) GAME.run.correct++;
    if (GAME.run && !ok) (GAME.run.wrongQ = GAME.run.wrongQ || []).push(q.id);
    if (ok) {
      GAME.Audio.sfx("good");
      GAME.UI.feedback("✔ 答對了！", "", true, 550);
      setTimeout(done, 650);
    } else {
      GAME.Audio.sfx("bad");
      var ansText = "";
      if (q.type === "fill") {
        ansText = q.blanks.map(function (b) { return b.answer; }).join("，");
      } else {
        ansText = "ABCD"[q.answer] + ". " + q.options[q.answer];
      }
      var body = "正確答案：<b>" + GAME.MathText.toHTML(ansText) + "</b>";
      if (q.explanation) body += "<br>💡 " + GAME.MathText.toHTML(q.explanation);
      GAME.UI.feedbackConfirm("✘ 答錯了", body, false, "確認後繼續", done);
    }
    function done() {
      busy = false;
      var cb = onDone;
      onDone = null; cur = null;
      GAME.UI.hideFeedback();
      if (cb) cb(ok);
    }
  }

  /* ═══════════ 程序畫幾何圖 ═══════════ */
  function figureToDataUrl(fig) {
    var cv = document.createElement("canvas");
    cv.width = fig.w || 300; cv.height = fig.h || 220;
    var ctx = cv.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "#1a1c2c";
    ctx.fillStyle = "#1a1c2c";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.font = "italic bold 20px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    fig.items.forEach(function (it) {
      if (it.t === "seg" || it.t === "dash") {
        ctx.save();
        if (it.t === "dash") ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(it.p[0][0], it.p[0][1]);
        ctx.lineTo(it.p[1][0], it.p[1][1]);
        ctx.stroke();
        ctx.restore();
      } else if (it.t === "label") {
        ctx.fillText(it.s, it.p[0], it.p[1]);
      } else if (it.t === "arc") {
        var a0 = it.a0, a1 = it.a1;
        if (a1 <= a0) a1 += 360;
        ctx.beginPath();
        /* 數學角(逆時針為正) → canvas 角(順時針為正，y 向下)：取負 */
        ctx.arc(it.p[0], it.p[1], it.r || 20, -a1 * Math.PI / 180, -a0 * Math.PI / 180);
        ctx.stroke();
      } else if (it.t === "arcLabel") {
        ctx.font = "bold 17px Georgia, serif";
        ctx.fillText(it.s, it.p[0], it.p[1]);
        ctx.font = "italic bold 20px Georgia, serif";
      }
    });
    return cv.toDataURL("image/png");
  }
  Q.figureToDataUrl = figureToDataUrl;   /* 測試/除錯用 */
  Q.current = function () { return cur; };  /* 自動測試用 */
})();
