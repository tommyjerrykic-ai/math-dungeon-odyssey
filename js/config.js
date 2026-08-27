/* ═══════════════ 《數境迷航》 全域設定與數值表 ═══════════════ */
/* 郭sir調平衡就改這裡 */

var GAME = window.GAME || {};

GAME.CONFIG = {

  /* 玩家初始數值 */
  player: {
    hp: 36, maxHp: 36,
    mp: 10, maxMp: 10,
    atk: 8, def: 2, spd: 5,
    lv: 1, xp: 0, gold: 0
  },

  /* 升級成長（每級增加） */
  levelUp: { hp: 7, mp: 3, atk: 2, def: 1, spd: 0.5 },
  xpNeed: function (lv) { return Math.round(15 * Math.pow(lv, 1.35)); },

  /* 三個地區 */
  regions: [
    {
      id: "forest", name: "翠綠森林", layers: 9,
      skyTop: "#7ec8f4", skyBottom: "#d8f0ff", floorNear: "#3f7a34", floorFar: "#7ec850",
      walls: ["forestA", "forestB"], floorTexture: "assets/runtime/floors/floor-forest.png",
      monsters: ["slime", "mushroom", "sprite", "mossraccoon"], elite: ["wolf"],
      boss: "treant",
      lvRange: [1, 3]
    },
    {
      id: "desert", name: "黃沙沙漠", layers: 10,
      skyTop: "#f4a259", skyBottom: "#ffe8b8", floorNear: "#c98d45", floorFar: "#ecc277",
      walls: ["desertA", "desertB"], floorTexture: "assets/runtime/floors/floor-desert.png",
      monsters: ["scorpion", "cactus", "golem", "sunscarab"], elite: ["bandit"],
      boss: "sandworm",
      lvRange: [3, 6]
    },
    {
      id: "cave", name: "冰晶洞窟", layers: 11,
      skyTop: "#1c2b4a", skyBottom: "#4a6a9a", floorNear: "#2e3d5c", floorFar: "#5c7aa8",
      walls: ["caveA", "caveB"], floorTexture: "assets/runtime/floors/floor-cave.png",
      monsters: ["bat", "crystalcrab", "iceimp", "frostwisp"], elite: ["knight"],
      boss: "demonlord",
      lvRange: [6, 9]
    }
  ],

  /* 怪物數值（普通怪） */
  monsters: {
    slime:       { name: "史萊姆",   hp: 14, atk: 4,  def: 0, spd: 2, xp: 8,  gold: 6,  sprite: "slime" },
    mushroom:    { name: "蘑菇怪",   hp: 16, atk: 5,  def: 1, spd: 3, xp: 10, gold: 7,  sprite: "mushroom" },
    sprite:      { name: "小妖精",   hp: 12, atk: 5,  def: 0, spd: 7, xp: 12, gold: 8,  sprite: "sprite" },
    mossraccoon: { name: "苔果浣熊", hp: 20, atk: 6,  def: 1, spd: 5, xp: 14, gold: 9,  sprite: "mossraccoon" },
    wolf:        { name: "森狼",     hp: 26, atk: 8,  def: 2, spd: 8, xp: 26, gold: 15, sprite: "wolf", elite: true },
    scorpion:    { name: "沙蠍",     hp: 26, atk: 11, def: 3, spd: 5, xp: 18, gold: 11, sprite: "scorpion" },
    cactus:      { name: "仙人掌怪", hp: 30, atk: 10, def: 4, spd: 2, xp: 20, gold: 12, sprite: "cactus" },
    golem:       { name: "沙石巨人", hp: 40, atk: 13, def: 5, spd: 1, xp: 26, gold: 14, sprite: "golem" },
    sunscarab:   { name: "日殼甲蟲", hp: 34, atk: 12, def: 5, spd: 4, xp: 25, gold: 15, sprite: "sunscarab" },
    bandit:      { name: "沙盜",     hp: 44, atk: 15, def: 3, spd: 9, xp: 38, gold: 26, sprite: "bandit", elite: true },
    bat:         { name: "冰蝠",     hp: 38, atk: 15, def: 4, spd: 12, xp: 30, gold: 18, sprite: "bat" },
    crystalcrab: { name: "晶蟹",     hp: 48, atk: 16, def: 8, spd: 4, xp: 36, gold: 20, sprite: "crystalcrab" },
    iceimp:      { name: "冰小鬼",   hp: 42, atk: 18, def: 5, spd: 10, xp: 40, gold: 22, sprite: "iceimp" },
    frostwisp:   { name: "雪晶靈",   hp: 44, atk: 17, def: 6, spd: 8, xp: 42, gold: 25, sprite: "frostwisp" },
    knight:      { name: "冰晶騎士", hp: 66, atk: 21, def: 8, spd: 9, xp: 60, gold: 40, sprite: "knight", elite: true }
  },

  /* Boss（phases：各階段血量比例門檻與攻擊力） */
  bosses: {
    treant:    { name: "千年樹王", hp: 62,  atk: 9,  def: 3, spd: 4,  xp: 60,  gold: 60,  sprite: "treant",
                 phases: [ { hpAbove: 0.5, atk: 9 }, { hpAbove: 0, atk: 11, ultimate: true } ] },
    sandworm:  { name: "黃沙巨蟲", hp: 120, atk: 12, def: 5, spd: 6,  xp: 120, gold: 120, sprite: "sandworm",
                 phases: [ { hpAbove: 0.5, atk: 12 }, { hpAbove: 0, atk: 15, ultimate: true } ] },
    demonlord: { name: "冰晶魔王", hp: 190, atk: 15, def: 7, spd: 10, xp: 250, gold: 300, sprite: "demonlord",
                 phases: [ { hpAbove: 0.66, atk: 15 }, { hpAbove: 0.33, atk: 18, ultimate: true }, { hpAbove: 0, atk: 21, ultimate: true } ] }
  },

  /* 法術（mult = 攻擊倍率；答對才命中） */
  spells: [
    { id: "fireball", name: "火球術", mp: 4, mult: 1.8, desc: "燃燒的火球，1.8倍傷害", icon: "🔥" },
    { id: "bolt",     name: "雷擊術", mp: 7, mult: 2.5, shock: true, desc: "2.5倍傷害，命中後敵人下一擊虛弱", icon: "⚡" },
    { id: "heal",     name: "治癒術", mp: 5, heal: 0.4, desc: "回復40%血量，無需答題", icon: "💚" },
    { id: "double",   name: "連擊術", mp: 9, mult: 1.2, hits: 2, rare: true, desc: "連答2題，每對一題打1.2倍傷害（稀有）", icon: "🌟" }
  ],

  /* 法術售價（商店） */
  spellPrices: { bolt: 80, heal: 70, double: 150 },

  /* 物品（藥水） */
  items: {
    potion_s: { name: "小紅藥水", desc: "回復15點血量", price: 15, heal: 15, icon: "assets/generated/items/potion-s.png" },
    potion_l: { name: "大紅藥水", desc: "回復40點血量", price: 35, heal: 40, icon: "assets/generated/items/potion-l.png" },
    ether:    { name: "藍藥水",   desc: "回復10點法力", price: 25, mp: 10, icon: "assets/generated/items/ether.png" },
    lifedrain:{ name: "吸血藥水", desc: "戰鬥限定：接下來3次命中，吸取25%傷害回復血量", price: 55, battleBuff: "lifesteal", hits: 3, rate: 0.25, icon: "assets/generated/items/lifedrain.png" },
    atk_tonic:{ name: "攻擊藥水", desc: "戰鬥限定：本場攻擊力＋6", price: 45, battleBuff: "attack", amount: 6, icon: "assets/generated/items/atk-tonic.png" },
    def_tonic:{ name: "防禦藥水", desc: "戰鬥限定：本場防禦力＋5", price: 40, battleBuff: "defense", amount: 5, icon: "assets/generated/items/def-tonic.png" }
  },
  startItems: { potion_s: 2, ether: 1 },

  /* 裝備（商店購買，直接加屬性） */
  equips: [
    { id: "sword1",  name: "銅劍",     slot: "weapon", atk: 2, price: 30 },
    { id: "sword2",  name: "銀劍",     slot: "weapon", atk: 4, price: 70 },
    { id: "sword3",  name: "秘銀劍",   slot: "weapon", atk: 6, price: 120 },
    { id: "shield1", name: "皮盾",     slot: "armor",  def: 1, price: 25 },
    { id: "shield2", name: "鐵盾",     slot: "armor",  def: 2, price: 60 },
    { id: "shield3", name: "水晶盾",   slot: "armor",  def: 4, price: 110 }
  ],

  /* 節點類型權重（地圖生成用） */
  nodeWeights: { monster: 45, elite: 12, shop: 12, campfire: 13, chest: 18 },

  /* 遭遇圖標對應 */
  nodeIcons: { monster: "icon_sword", elite: "icon_skull", shop: "icon_coin", campfire: "icon_fire", chest: "icon_chest", boss: "icon_crown" },
  nodeNames: { monster: "怪物", elite: "精英怪", shop: "商店", campfire: "營火", chest: "寶箱", boss: "地區之王" }
};
