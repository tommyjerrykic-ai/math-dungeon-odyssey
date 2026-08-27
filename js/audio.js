/* ═══════════════ 《數境迷航》 音頻：Web Audio 程序生成 ═══════════════
   BGM：方波主旋律＋三角波 bass＋噪聲鼓，lookahead 序列器循環。
   音效：即時合成。首次用戶手勢後 unlock（iPad Safari 限制）。 */
(function () {
  var AU = GAME.Audio = {};

  var ctx = null, master = null, bgmGain = null, sfxGain = null;
  var volume = 0.7, bgmOn = false, sfxOn = true;
  var noiseBuf = null;

  AU.unlock = function () {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = volume; master.connect(ctx.destination);
    bgmGain = ctx.createGain(); bgmGain.gain.value = bgmOn ? 0.5 : 0; bgmGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = sfxOn ? 1 : 0; sfxGain.connect(master);
    /* 預生成噪聲 buffer（鼓/音效用） */
    var len = ctx.sampleRate * 0.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (pendingSong) { var s = pendingSong; pendingSong = null; AU.playMusic(s); }
  };

  AU.setVolume = function (v) { volume = v; if (master) master.gain.value = v; };
  AU.toggleBgm = function (btn) {
    bgmOn = !bgmOn;
    if (bgmGain) bgmGain.gain.value = bgmOn ? 0.5 : 0;
    if (btn) { btn.textContent = bgmOn ? "開" : "關"; btn.classList.toggle("off", !bgmOn); }
  };
  AU.toggleSfx = function (btn) {
    sfxOn = !sfxOn;
    if (sfxGain) sfxGain.gain.value = sfxOn ? 1 : 0;
    if (btn) { btn.textContent = sfxOn ? "開" : "關"; btn.classList.toggle("off", !sfxOn); }
  };

  function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* ── 音符播放 ── */
  function note(f, t, dur, type, gainNode, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(gainNode);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(t, dur, filterF, vol) {
    var src = ctx.createBufferSource(); src.buffer = noiseBuf;
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filterF;
    var g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t); src.stop(t + dur + 0.02);
  }

  /* ═══════════ 音效 ═══════════ */
  var SFX = {
    click:   function (t) { note(660, t, 0.07, "square", sfxGain, 0.25); },
    confirm: function (t) { note(523, t, 0.09, "square", sfxGain, 0.3); note(784, t + 0.08, 0.14, "square", sfxGain, 0.3); },
    step:    function (t) { noise(t, 0.06, 900, 0.12); },
    hit:     function (t) { note(200, t, 0.12, "square", sfxGain, 0.4); note(80, t + 0.02, 0.15, "square", sfxGain, 0.35); },
    good:    function (t) { note(523, t, 0.1, "square", sfxGain, 0.3); note(659, t + 0.09, 0.1, "square", sfxGain, 0.3); note(784, t + 0.18, 0.2, "square", sfxGain, 0.32); },
    bad:     function (t) { note(196, t, 0.2, "sawtooth", sfxGain, 0.3); note(147, t + 0.15, 0.3, "sawtooth", sfxGain, 0.28); },
    hurt:    function (t) { note(140, t, 0.18, "sawtooth", sfxGain, 0.4); noise(t, 0.1, 600, 0.2); },
    coin:    function (t) { note(988, t, 0.07, "square", sfxGain, 0.28); note(1319, t + 0.07, 0.16, "square", sfxGain, 0.28); },
    levelup: function (t) { var seq = [523, 659, 784, 1047]; for (var i = 0; i < 4; i++) note(seq[i], t + i * 0.1, 0.16, "square", sfxGain, 0.3); },
    fire:    function (t) { noise(t, 0.25, 2400, 0.3); note(880, t, 0.2, "sawtooth", sfxGain, 0.2); },
    heal:    function (t) { note(660, t, 0.15, "triangle", sfxGain, 0.35); note(880, t + 0.12, 0.25, "triangle", sfxGain, 0.35); },
    miss:    function (t) { noise(t, 0.15, 1400, 0.18); },
    chest:   function (t) { note(392, t, 0.1, "square", sfxGain, 0.3); note(523, t + 0.09, 0.1, "square", sfxGain, 0.3); note(659, t + 0.18, 0.22, "square", sfxGain, 0.3); },
    boss:    function (t) { note(98, t, 0.5, "sawtooth", sfxGain, 0.4); note(104, t + 0.4, 0.6, "sawtooth", sfxGain, 0.4); }
  };
  AU.sfx = function (name) {
    if (!ctx || !sfxOn) return;
    var fn = SFX[name];
    if (fn) fn(ctx.currentTime + 0.01);
  };

  /* ═══════════ BGM 曲譜（32步＝4小節，每步8分音符，0=休止） ═══════════ */
  var SONGS = {
    menu: {
      bpm: 96, drums: false,
      lead: [60, 0, 64, 0, 67, 0, 72, 0, 71, 0, 67, 0, 64, 0, 67, 0, 69, 0, 72, 0, 76, 0, 81, 0, 79, 0, 76, 0, 72, 0, 76, 0],
      bass: [48, 0, 43, 0, 48, 0, 43, 0, 45, 0, 41, 0, 45, 0, 41, 0, 48, 0, 43, 0, 48, 0, 43, 0, 45, 0, 43, 0, 48, 0, 43, 0]
    },
    explore: {
      bpm: 120, drums: false,
      lead: [67, 0, 69, 0, 71, 0, 74, 0, 76, 0, 74, 0, 71, 0, 67, 0, 69, 0, 71, 0, 72, 0, 69, 0, 67, 0, 0, 0, 67, 0, 0, 0],
      bass: [43, 0, 50, 0, 43, 0, 50, 0, 40, 0, 47, 0, 40, 0, 47, 0, 41, 0, 48, 0, 41, 0, 48, 0, 43, 0, 50, 0, 43, 0, 50, 0]
    },
    battle: {
      bpm: 138, drums: true,
      lead: [69, 0, 72, 0, 76, 0, 81, 0, 79, 0, 76, 0, 72, 0, 76, 0, 77, 0, 76, 0, 74, 0, 72, 0, 71, 0, 69, 0, 68, 0, 69, 0],
      bass: [45, 0, 45, 0, 52, 0, 45, 0, 41, 0, 41, 0, 48, 0, 41, 0, 43, 0, 43, 0, 50, 0, 43, 0, 45, 0, 45, 0, 40, 0, 45, 0]
    },
    boss: {
      bpm: 152, drums: true,
      lead: [74, 0, 77, 0, 81, 0, 86, 0, 84, 0, 81, 0, 77, 0, 81, 0, 82, 0, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 73, 0, 74, 0],
      bass: [38, 0, 38, 0, 45, 0, 38, 0, 36, 0, 36, 0, 43, 0, 36, 0, 37, 0, 37, 0, 44, 0, 37, 0, 38, 0, 38, 0, 33, 0, 38, 0]
    }
  };

  var seq = { song: null, step: 0, nextT: 0, timer: null };
  var pendingSong = null;

  AU.playMusic = function (name) {
    if (!ctx) { pendingSong = name; return; }
    if (seq.song === name) return;
    AU.stopMusic();
    var song = SONGS[name];
    if (!song) return;
    seq.song = name;
    seq.step = 0;
    seq.nextT = ctx.currentTime + 0.06;
    seq.timer = setInterval(schedule, 40);
  };
  AU.stopMusic = function () {
    if (seq.timer) clearInterval(seq.timer);
    seq.timer = null; seq.song = null;
  };

  function schedule() {
    var song = SONGS[seq.song];
    if (!song) return;
    var stepDur = 30 / song.bpm;               // 8分音符
    while (seq.nextT < ctx.currentTime + 0.15) {
      var s = seq.step % 32, t = seq.nextT;
      var L = song.lead[s], B = song.bass[s];
      if (L) note(midi(L), t, stepDur * 1.8, "square", bgmGain, 0.16);
      if (B) note(midi(B), t, stepDur * 1.9, "triangle", bgmGain, 0.3);
      if (song.drums) {
        if (s % 4 === 0) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14); o.connect(g); g.connect(bgmGain); o.start(t); o.stop(t + 0.15); }
        if (s % 2 === 0) { var src = ctx.createBufferSource(); src.buffer = noiseBuf; var f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 6000; var g2 = ctx.createGain(); g2.gain.setValueAtTime(0.12, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.04); src.connect(f); f.connect(g2); g2.connect(bgmGain); src.start(t); src.stop(t + 0.05); }
      }
      seq.nextT += stepDur;
      seq.step++;
    }
  }
  AU.currentSong = function () { return seq.song; };
})();
