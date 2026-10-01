/* ══════════════════════════════════════════════════════════════
   《數境迷航》 題庫 — 郭sir 加題指南
   ══════════════════════════════════════════════════════════════
   每條題目是一個 JS 對象，加到 QUESTION_BANK 陣列即可，存檔即用。

   【三種題型 type】
   - "fill"     填充題：玩家用數字鍵盤輸入，可多空
   - "mcq"      純文字選擇題：A/B/C/D
   - "img_mcq"  附圖選擇題：右上方顯示圖 + A/B/C/D

   【通用欄位】
   id          唯一編號（字串，如 "geo0031"）
   type        見上
   difficulty  難度 1（淺）/ 2（中）/ 3（深）。森林出 1，沙漠出 2，洞窟出 2~3
   tags        知識點標籤（陣列，方便日後篩題，可留空 []）
   regions     限定出題地區（陣列，如 ["forest"]；留空 [] = 全部地區通用）
   question    題目文字。填充題用 ___（三個底線）表示空位
   explanation 答錯時顯示的解析（建議填，1~2 行）
   數學式      寫 √2 或 √(12+4) 會顯示帶橫線的根號；寫 1/3 會顯示上下分數

   【填充題專用】
   blanks      陣列，每個空一項：{ answer:"40", accept:["40°","40度"] }
               answer = 標準答案；accept = 其他也算對的寫法（可省略）
               判定會自動忽略空格、「°」「度」與全半形差異

   【選擇題專用】
   options     四個選項文字（陣列，剛好 4 項）
   answer      正確選項：0=A, 1=B, 2=C, 3=D

   【附圖題專用 image】（二選一）
   (A) 程序畫圖（推薦）：image: { fig:true, w:300, h:220, items:[ ... ] }
       items 元素（座標以左上角為原點，x 向右、y 向下）：
       { t:"seg",   p:[[x1,y1],[x2,y2]] }   線段
       { t:"dash",  p:[[x1,y1],[x2,y2]] }   虛線
       { t:"label", p:[x,y], s:"A" }        文字（置中於該點）
       { t:"arc",   p:[x,y], r:20, a0:30, a1:90 }  角弧（數學角：逆時針為正）
       { t:"arcLabel", p:[x,y], s:"50°" }   角弧旁的度數文字
   (B) 現成圖片：image: "data:image/png;base64,...."（貼上 base64）
   ══════════════════════════════════════════════════════════════ */

var QUESTION_BANK = [

  /* ─────── 填充題（數字鍵盤） ─────── */
  { id: "fill001", type: "fill", difficulty: 1, tags: ["三角形", "等腰"], regions: [],
    question: "若等腰三角形的一個角為100°，則另外兩個角的度數分別為___°和___°",
    blanks: [ { answer: "40" }, { answer: "40" } ],
    explanation: "100°必為頂角（底角不能是鈍角），(180−100)÷2＝40°" },

  { id: "fill002", type: "fill", difficulty: 1, tags: ["三角形", "內角和"], regions: [],
    question: "三角形的內角和為___°",
    blanks: [ { answer: "180" } ],
    explanation: "任意三角形內角和都是 180°" },

  { id: "fill003", type: "fill", difficulty: 1, tags: ["等邊三角形"], regions: [],
    question: "等邊三角形的每個內角為___°",
    blanks: [ { answer: "60" } ],
    explanation: "180÷3＝60°" },

  { id: "fill004", type: "fill", difficulty: 1, tags: ["直角三角形"], regions: [],
    question: "直角三角形的一個銳角為35°，另一個銳角為___°",
    blanks: [ { answer: "55" } ],
    explanation: "兩銳角互餘：90−35＝55°" },

  { id: "fill005", type: "fill", difficulty: 1, tags: ["三角形", "內角和"], regions: [],
    question: "在△ABC中，∠A＝50°，∠B＝60°，則∠C＝___°",
    blanks: [ { answer: "70" } ],
    explanation: "180−50−60＝70°" },

  { id: "fill006", type: "fill", difficulty: 1, tags: ["對頂角"], regions: [],
    question: "兩直線相交，其中一個角為65°，則它的對頂角為___°",
    blanks: [ { answer: "65" } ],
    explanation: "對頂角相等" },

  { id: "fill007", type: "fill", difficulty: 1, tags: ["等腰直角"], regions: [],
    question: "等腰直角三角形的一個銳角為___°",
    blanks: [ { answer: "45" } ],
    explanation: "(180−90)÷2＝45°" },

  { id: "fill008", type: "fill", difficulty: 2, tags: ["等腰三角形"], regions: [],
    question: "等腰三角形的頂角為70°，則一個底角為___°",
    blanks: [ { answer: "55" } ],
    explanation: "(180−70)÷2＝55°" },

  { id: "fill009", type: "fill", difficulty: 2, tags: ["外角"], regions: [],
    question: "三角形的一個外角為120°，與它相鄰的內角為___°",
    blanks: [ { answer: "60" } ],
    explanation: "內角與外角互補：180−120＝60°" },

  { id: "fill010", type: "fill", difficulty: 2, tags: ["多邊形", "內角和"], regions: [],
    question: "六邊形的內角和為___°",
    blanks: [ { answer: "720" } ],
    explanation: "(6−2)×180＝720°" },

  { id: "fill011", type: "fill", difficulty: 2, tags: ["正多邊形"], regions: [],
    question: "正五邊形的每個內角為___°",
    blanks: [ { answer: "108" } ],
    explanation: "(5−2)×180÷5＝108°" },

  { id: "fill012", type: "fill", difficulty: 2, tags: ["勾股定理"], regions: [],
    question: "直角三角形的兩條直角邊分別為3和4，斜邊長為___",
    blanks: [ { answer: "5" } ],
    explanation: "3²＋4²＝9＋16＝25＝5²" },

  { id: "fill013", type: "fill", difficulty: 3, tags: ["三角形三邊關係"], regions: [],
    question: "三角形兩邊長分別為3和5，若第三邊長為整數，則第三邊最大為___",
    blanks: [ { answer: "7" } ],
    explanation: "第三邊 < 3＋5＝8，最大整數為 7" },

  { id: "fill014", type: "fill", difficulty: 3, tags: ["圓周角"], regions: [],
    question: "同弧所對的圓心角為80°，則該弧所對的圓周角為___°",
    blanks: [ { answer: "40" } ],
    explanation: "圓周角＝圓心角÷2" },

  { id: "fill015", type: "fill", difficulty: 3, tags: ["外角"], regions: [],
    question: "△ABC中，∠A＝45°，∠B＝70°，則∠C的外角為___°",
    blanks: [ { answer: "115" } ],
    explanation: "外角＝不相鄰兩內角之和：45＋70＝115°" },

  /* ─────── 純文字選擇題 ─────── */
  { id: "mcq001", type: "mcq", difficulty: 1, tags: ["三角形分類"], regions: [],
    question: "已知∠A＝37°，∠B＝53°，則△ABC為（　　）",
    options: ["銳角三角形", "鈍角三角形", "直角三角形", "以上都有可能"],
    answer: 2,
    explanation: "∠C＝180−37−53＝90°，所以是直角三角形" },

  { id: "mcq002", type: "mcq", difficulty: 1, tags: ["平行線"], regions: [],
    question: "兩直線平行，同位角（　　）",
    options: ["互補", "相等", "互餘", "是對頂角"],
    answer: 1,
    explanation: "平行線的同位角相等" },

  { id: "mcq003", type: "mcq", difficulty: 1, tags: ["平行線"], regions: [],
    question: "兩直線平行，同旁內角（　　）",
    options: ["相等", "互餘", "互補", "以上皆非"],
    answer: 2,
    explanation: "平行線的同旁內角互補（和為180°）" },

  { id: "mcq004", type: "mcq", difficulty: 1, tags: ["三角形分類"], regions: [],
    question: "一個三角形最多有幾個直角？（　　）",
    options: ["0個", "1個", "2個", "3個"],
    answer: 1,
    explanation: "兩個直角就已經超過180°，所以最多1個" },

  { id: "mcq005", type: "mcq", difficulty: 1, tags: ["互餘"], regions: [],
    question: "若∠A與∠B互餘，∠A＝40°，則∠B＝（　　）",
    options: ["40°", "50°", "60°", "140°"],
    answer: 1,
    explanation: "互餘即和為90°：90−40＝50°" },

  { id: "mcq006", type: "mcq", difficulty: 1, tags: ["四邊形"], regions: [],
    question: "四邊形的內角和為（　　）",
    options: ["180°", "270°", "360°", "540°"],
    answer: 2,
    explanation: "(4−2)×180＝360°" },

  { id: "mcq007", type: "mcq", difficulty: 2, tags: ["三角形分類"], regions: [],
    question: "三角形的三個內角之比為1:2:3，這個三角形是（　　）",
    options: ["銳角三角形", "直角三角形", "鈍角三角形", "等腰三角形"],
    answer: 1,
    explanation: "180°分成6份：30°、60°、90°，所以是直角三角形" },

  { id: "mcq008", type: "mcq", difficulty: 2, tags: ["三邊關係"], regions: [],
    question: "下列哪組長度能組成三角形？（　　）",
    options: ["2, 3, 6", "3, 4, 5", "1, 2, 3", "5, 5, 11"],
    answer: 1,
    explanation: "兩邊之和大於第三邊：只有 3＋4＞5 成立" },

  { id: "mcq009", type: "mcq", difficulty: 2, tags: ["等腰三角形"], regions: [],
    question: "等腰三角形一定是（　　）",
    options: ["銳角三角形", "直角三角形", "鈍角三角形", "以上都有可能"],
    answer: 3,
    explanation: "頂角可銳可直可鈍，例如 100°、90°、80° 的頂角都存在" },

  { id: "mcq010", type: "mcq", difficulty: 3, tags: ["全等三角形"], regions: [],
    question: "下列何者不是全等三角形的判定條件？（　　）",
    options: ["SSS", "SAS", "ASA", "AAA"],
    answer: 3,
    explanation: "AAA 只能保證形狀相同（相似），不能保證大小相同" },

  /* ─────── 附圖選擇題（程序畫圖） ─────── */
  { id: "img001", type: "img_mcq", difficulty: 2, tags: ["數三角形"], regions: [],
    question: "如圖，以AC為邊的三角形有（　　）",
    image: { fig: true, w: 300, h: 220, items: [
      { t: "seg", p: [[60, 180], [130, 40]] },
      { t: "seg", p: [[130, 40], [240, 180]] },
      { t: "seg", p: [[60, 180], [240, 180]] },
      { t: "seg", p: [[130, 40], [180, 180]] },
      { t: "label", p: [130, 26], s: "A" },
      { t: "label", p: [48, 196], s: "B" },
      { t: "label", p: [252, 196], s: "C" },
      { t: "label", p: [180, 200], s: "D" }
    ] },
    options: ["0個", "1個", "2個", "3個"],
    answer: 2,
    explanation: "以AC為邊的三角形：△ADC 和 △ABC，共2個" },

  { id: "img002", type: "img_mcq", difficulty: 1, tags: ["對頂角"], regions: [],
    question: "如圖，直線AB與CD相交於點O，∠AOC＝50°，則∠BOD＝（　　）",
    image: { fig: true, w: 300, h: 220, items: [
      { t: "seg", p: [[50, 50], [250, 170]] },
      { t: "seg", p: [[50, 170], [250, 50]] },
      { t: "label", p: [38, 42], s: "A" },
      { t: "label", p: [264, 180], s: "B" },
      { t: "label", p: [264, 42], s: "C" },
      { t: "label", p: [38, 180], s: "D" },
      { t: "label", p: [164, 118], s: "O" },
      { t: "arc", p: [150, 110], r: 26, a0: 31, a1: 149 },
      { t: "arcLabel", p: [150, 74], s: "50°" }
    ] },
    options: ["40°", "50°", "130°", "無法確定"],
    answer: 1,
    explanation: "∠BOD 與 ∠AOC 是對頂角，對頂角相等" },

  { id: "img003", type: "img_mcq", difficulty: 2, tags: ["平行線", "同位角"], regions: [],
    question: "如圖，直線 a∥b，∠1＝70°，則∠2＝（　　）",
    image: { fig: true, w: 300, h: 230, items: [
      { t: "seg", p: [[30, 70], [270, 70]] },
      { t: "seg", p: [[30, 170], [270, 170]] },
      { t: "seg", p: [[130, 20], [170, 210]] },
      { t: "label", p: [284, 76], s: "a" },
      { t: "label", p: [284, 176], s: "b" },
      { t: "arc", p: [141, 70], r: 20, a0: 282, a1: 360 },
      { t: "arcLabel", p: [172, 94], s: "∠1=70°" },
      { t: "arc", p: [163, 170], r: 20, a0: 282, a1: 360 },
      { t: "arcLabel", p: [196, 194], s: "∠2=?" }
    ] },
    options: ["70°", "110°", "90°", "無法確定"],
    answer: 0,
    explanation: "∠1 與 ∠2 是同位角，平行線的同位角相等" },

  { id: "img004", type: "img_mcq", difficulty: 3, tags: ["外角"], regions: [],
    question: "如圖，∠A＝45°，∠B＝70°，則外角∠BCD＝（　　）",
    image: { fig: true, w: 300, h: 220, items: [
      { t: "seg", p: [[70, 180], [210, 180]] },
      { t: "seg", p: [[210, 180], [130, 60]] },
      { t: "seg", p: [[70, 180], [130, 60]] },
      { t: "seg", p: [[130, 60], [154, 12]] },
      { t: "label", p: [56, 196], s: "A" },
      { t: "label", p: [224, 196], s: "B" },
      { t: "label", p: [116, 52], s: "C" },
      { t: "label", p: [170, 8], s: "D" },
      { t: "arc", p: [70, 180], r: 20, a0: 0, a1: 63 },
      { t: "arcLabel", p: [104, 166], s: "45°" },
      { t: "arc", p: [210, 180], r: 20, a0: 124, a1: 180 },
      { t: "arcLabel", p: [178, 164], s: "70°" },
      { t: "arc", p: [130, 60], r: 22, a0: 304, a1: 423 },
      { t: "arcLabel", p: [164, 44], s: "?" }
    ] },
    options: ["110°", "115°", "125°", "105°"],
    answer: 1,
    explanation: "外角＝不相鄰兩內角之和：45°＋70°＝115°" },

  { id: "img005", type: "img_mcq", difficulty: 2, tags: ["數三角形"], regions: [],
    question: "如圖，圖中共有多少個三角形？（　　）",
    image: { fig: true, w: 300, h: 220, items: [
      { t: "seg", p: [[40, 180], [150, 40]] },
      { t: "seg", p: [[150, 40], [260, 180]] },
      { t: "seg", p: [[40, 180], [260, 180]] },
      { t: "seg", p: [[150, 40], [150, 180]] },
      { t: "label", p: [150, 26], s: "A" },
      { t: "label", p: [28, 196], s: "B" },
      { t: "label", p: [272, 196], s: "C" },
      { t: "label", p: [150, 200], s: "D" }
    ] },
    options: ["2個", "3個", "4個", "5個"],
    answer: 1,
    explanation: "△ABD、△ADC、△ABC，共3個" },

  /* ─────── 七年級上下冊：基礎複習 ─────── */
  { id: "fill016", type: "fill", difficulty: 1, tags: ["七年級", "有理數"], regions: [],
    question: "計算：−7＋12＝___",
    blanks: [{ answer: "5" }], explanation: "異號兩數相加，用較大的絕對值減較小的絕對值：12−7＝5。" },
  { id: "fill017", type: "fill", difficulty: 1, tags: ["七年級", "整式的加減"], regions: [],
    question: "合併同類項：3x＋2x＝___x",
    blanks: [{ answer: "5" }], explanation: "係數相加，字母部分不變：3x＋2x＝5x。" },
  { id: "fill018", type: "fill", difficulty: 1, tags: ["七年級", "一元一次方程"], regions: [],
    question: "解方程：3x＋4＝19，則 x＝___",
    blanks: [{ answer: "5" }], explanation: "移項得 3x＝15，所以 x＝5。" },
  { id: "fill019", type: "fill", difficulty: 1, tags: ["七年級", "線段"], regions: [],
    question: "線段 AB 長 14，M 是 AB 的中點，則 AM＝___",
    blanks: [{ answer: "7" }], explanation: "中點把線段分成相等兩段，14÷2＝7。" },
  { id: "fill020", type: "fill", difficulty: 1, tags: ["七年級", "平行線"], regions: [],
    question: "兩直線平行，一對內錯角中的一個是 68°，另一個是___°",
    blanks: [{ answer: "68" }], explanation: "兩直線平行時，內錯角相等。" },
  { id: "fill021", type: "fill", difficulty: 1, tags: ["七年級", "平方根"], regions: [],
    question: "81 的算術平方根是___",
    blanks: [{ answer: "9" }], explanation: "9²＝81，算術平方根取非負值。" },
  { id: "fill022", type: "fill", difficulty: 2, tags: ["七年級", "平面直角坐標系"], regions: [],
    question: "點 P(−3，4) 到 y 軸的距離是___",
    blanks: [{ answer: "3" }], explanation: "點到 y 軸的距離等於橫坐標的絕對值：|−3|＝3。" },
  { id: "fill023", type: "fill", difficulty: 2, tags: ["七年級", "二元一次方程組"], regions: [],
    question: "若 x＋y＝11，x−y＝3，則 x＝___",
    blanks: [{ answer: "7" }], explanation: "兩式相加得 2x＝14，所以 x＝7。" },
  { id: "fill024", type: "fill", difficulty: 2, tags: ["七年級", "一元一次不等式"], regions: [],
    question: "若 x＋4＞9，則符合條件的最小整數 x 是___",
    blanks: [{ answer: "6" }], explanation: "x＞5，所以最小整數解是 6。" },
  { id: "fill025", type: "fill", difficulty: 1, tags: ["七年級", "數據統計"], regions: [],
    question: "某班三組人數分別為 8、12、10 人，全班共有___人",
    blanks: [{ answer: "30" }], explanation: "總人數＝8＋12＋10＝30。" },

  { id: "mcq011", type: "mcq", difficulty: 1, tags: ["七年級", "有理數"], regions: [],
    question: "−6 的絕對值是（　　）", options: ["−6", "0", "6", "12"], answer: 2,
    explanation: "絕對值表示到原點的距離，|−6|＝6。" },
  { id: "mcq012", type: "mcq", difficulty: 1, tags: ["七年級", "整式的加減"], regions: [],
    question: "4a−2a＋3 化簡後是（　　）", options: ["2a＋3", "2a", "6a＋3", "2a−3"], answer: 0,
    explanation: "4a−2a＝2a，常數 3 保留。" },
  { id: "mcq013", type: "mcq", difficulty: 1, tags: ["七年級", "一元一次方程"], regions: [],
    question: "方程 2(x＋3)＝14 的解是（　　）", options: ["x＝2", "x＝4", "x＝7", "x＝11"], answer: 1,
    explanation: "兩邊除以 2 得 x＋3＝7，所以 x＝4。" },
  { id: "mcq014", type: "mcq", difficulty: 1, tags: ["七年級", "角"], regions: [],
    question: "一個直角的度數是（　　）", options: ["45°", "90°", "120°", "180°"], answer: 1,
    explanation: "直角等於 90°。" },
  { id: "mcq015", type: "mcq", difficulty: 1, tags: ["七年級", "相交線"], regions: [],
    question: "兩條直線互相垂直時，所成的角是（　　）", options: ["30°", "45°", "90°", "180°"], answer: 2,
    explanation: "互相垂直的兩條直線所成的角都是直角。" },
  { id: "mcq016", type: "mcq", difficulty: 2, tags: ["七年級", "立方根"], regions: [],
    question: "−27 的立方根是（　　）", options: ["−9", "−3", "3", "9"], answer: 1,
    explanation: "(−3)³＝−27，所以立方根是 −3。" },
  { id: "mcq017", type: "mcq", difficulty: 2, tags: ["七年級", "平面直角坐標系"], regions: [],
    question: "點 (2，−3) 位於哪個象限？（　　）", options: ["第一象限", "第二象限", "第三象限", "第四象限"], answer: 3,
    explanation: "橫坐標為正、縱坐標為負，在第四象限。" },
  { id: "mcq018", type: "mcq", difficulty: 2, tags: ["七年級", "二元一次方程組"], regions: [],
    question: "若 x＋y＝8，x＝3，則 y＝（　　）", options: ["3", "4", "5", "8"], answer: 2,
    explanation: "把 x＝3 代入，得 3＋y＝8，所以 y＝5。" },
  { id: "mcq019", type: "mcq", difficulty: 2, tags: ["七年級", "一元一次不等式"], regions: [],
    question: "不等式 x＜4 的最大整數解是（　　）", options: ["2", "3", "4", "5"], answer: 1,
    explanation: "x 必須小於 4，最接近 4 的整數是 3。" },
  { id: "mcq020", type: "mcq", difficulty: 1, tags: ["七年級", "數據統計"], regions: [],
    question: "調查 40 人，其中 10 人選擇步行；步行人數佔總人數的（　　）", options: ["10%", "20%", "25%", "40%"], answer: 2,
    explanation: "10÷40＝0.25＝25%。" },
  { id: "mcq021", type: "mcq", difficulty: 2, tags: ["八年級第十一章", "三角形三邊關係"], regions: [],
    question: "下列哪組長度可以組成三角形？（　　）", options: ["2、3、6", "4、5、8", "1、2、3", "3、3、7"], answer: 1,
    explanation: "只有 4＋5＞8，且其餘兩邊之和也大於第三邊。" },
  { id: "mcq022", type: "mcq", difficulty: 2, tags: ["八年級第十二章", "全等三角形"], regions: [],
    question: "若 △ABC≌△DEF，則與 ∠C 對應的角是（　　）", options: ["∠D", "∠E", "∠F", "無法確定"], answer: 2,
    explanation: "全等式中頂點順序一一對應：A↔D、B↔E、C↔F。" },
  { id: "mcq023", type: "mcq", difficulty: 2, tags: ["七年級", "有理數的乘方"], regions: [],
    question: "(−2)³ 的結果是（　　）", options: ["−8", "−6", "6", "8"], answer: 0,
    explanation: "(−2)×(−2)×(−2)＝−8。" },
  { id: "mcq024", type: "mcq", difficulty: 1, tags: ["七年級", "一元一次方程"], regions: [],
    question: "兩件相同文具共 12 元，每件多少元？（　　）", options: ["4 元", "5 元", "6 元", "12 元"], answer: 2,
    explanation: "設每件 x 元，2x＝12，x＝6。" },
  { id: "mcq025", type: "mcq", difficulty: 2, tags: ["七年級", "平移"], regions: [],
    question: "把圖形平移後，下列哪一項不變？（　　）", options: ["位置", "對應線段的長度", "與原點的距離", "每個點的坐標"], answer: 1,
    explanation: "平移只改變位置，不改變形狀與大小。" },
  { id: "mcq026", type: "mcq", difficulty: 2, tags: ["七年級", "實數"], regions: [],
    question: "下列哪個數是無理數？（　　）", options: ["0.25", "1/3", "√4", "√2"], answer: 3,
    explanation: "√2 不能寫成兩個整數之比；其餘三項都是有理數。" },
  { id: "mcq027", type: "mcq", difficulty: 2, tags: ["七年級", "一元一次不等式"], regions: [],
    question: "下列哪個數滿足 x≥−2？（　　）", options: ["−4", "−3", "−2", "−5"], answer: 2,
    explanation: "≥ 包含等號，因此 −2 是解。" },
  { id: "mcq028", type: "mcq", difficulty: 2, tags: ["八年級第十一章", "多邊形內角和"], regions: [],
    question: "五邊形的內角和是（　　）", options: ["360°", "450°", "540°", "720°"], answer: 2,
    explanation: "(5−2)×180°＝540°。" },

  /* ─────── 八年級第十一、十二章：看圖辨認 ─────── */
  { id: "img006", type: "img_mcq", difficulty: 2, tags: ["八年級第十一章", "三角形內角和"], regions: [],
    question: "如圖，△ABC 中 ∠A＝50°、∠B＝60°，∠C 是多少度？（　　）",
    image: { fig: true, w: 300, h: 220, items: [
      { t: "seg", p: [[70, 180], [230, 180]] },
      { t: "seg", p: [[70, 180], [165, 67]] },
      { t: "seg", p: [[165, 67], [230, 180]] },
      { t: "label", p: [55, 193], s: "A" },
      { t: "label", p: [245, 193], s: "B" },
      { t: "label", p: [165, 51], s: "C" },
      { t: "arcLabel", p: [97, 159], s: "50°" },
      { t: "arcLabel", p: [209, 157], s: "60°" },
      { t: "arcLabel", p: [165, 98], s: "?" }
    ] },
    options: ["60°", "70°", "80°", "110°"], answer: 1,
    explanation: "三角形內角和為 180°，∠C＝180°−50°−60°＝70°。" },
  { id: "img007", type: "img_mcq", difficulty: 2, tags: ["八年級第十二章", "三角形全等的判定"], regions: [],
    question: "如圖，已知 AB＝DE、AC＝DF、∠A＝∠D，應用哪個條件判定 △ABC≌△DEF？（　　）",
    image: { fig: true, w: 320, h: 220, items: [
      { t: "seg", p: [[25, 180], [125, 180]] },
      { t: "seg", p: [[25, 180], [75, 65]] },
      { t: "seg", p: [[75, 65], [125, 180]] },
      { t: "seg", p: [[195, 180], [295, 180]] },
      { t: "seg", p: [[195, 180], [245, 65]] },
      { t: "seg", p: [[245, 65], [295, 180]] },
      { t: "label", p: [15, 195], s: "A" },
      { t: "label", p: [138, 195], s: "B" },
      { t: "label", p: [75, 48], s: "C" },
      { t: "label", p: [183, 195], s: "D" },
      { t: "label", p: [306, 195], s: "E" },
      { t: "label", p: [245, 48], s: "F" }
    ] },
    options: ["SSS", "SAS", "ASA", "AAA"], answer: 1,
    explanation: "兩邊及其夾角分別相等，可用 SAS 判定全等。" },
  { id: "fill026", type: "fill", difficulty: 2, tags: ["八年級第十二章", "角平分線的性質"], regions: [],
    question: "點 P 在一個角的平分線上，P 到一邊的距離為 5，則 P 到另一邊的距離為___",
    blanks: [{ answer: "5" }], explanation: "角平分線上的點到角的兩邊的距離相等。" },
  { id: "mcq029", type: "mcq", difficulty: 2, tags: ["八年級第十一章", "三角形中線"], regions: [],
    question: "三角形的一條中線連接一個頂點與對邊的（　　）",
    options: ["中點", "任意一點", "延長線上的點", "另一個頂點"], answer: 0,
    explanation: "中線是連接三角形頂點與其對邊中點的線段。" },
  { id: "mcq030", type: "mcq", difficulty: 2, tags: ["八年級第十二章", "直角三角形全等"], regions: [],
    question: "兩個直角三角形的斜邊及一條直角邊分別相等，可用哪個條件判定全等？（　　）",
    options: ["AAA", "HL", "只有斜邊相等", "無法判定"], answer: 1,
    explanation: "直角三角形的斜邊和一條直角邊對應相等，可用 HL 判定全等。" }
];
