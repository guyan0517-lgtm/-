// ===================================================================
// 骰子指令引擎与天气池模块 (COC 7th Edition Dice Engine & Weather Pool)
// ===================================================================

const DEFAULT_DICE_TEMPLATES = {
  roll: "{角色名} 骰出了: {表达式}={结果}",
  check: "{角色名} 进行 {技能} 检定：D100={结果}/{技能数值} [{成功等级}]",
  st: "{角色名} 修改属性成功：{变更列表}",
  sc: "{角色名} 的理智检定：D100={结果}/{SAN} [{成功等级}] 理智变化: {旧SAN}→{新SAN}",
  growth: "{角色名} 进行 {技能} 成长检定：D100={结果}/{技能数值} [{成功等级}]",
  ti: "{角色名} 突发临时疯狂症状：{疯狂症状}",
  secret: "这是暗骰，结果仅 KP 可见",
  hp: "{角色名} 的 HP 变化: {旧HP}→{新HP}",
  coc: "{角色名} 生成了一组 COC7 属性",
  coc5: "{角色名} 生成了 5 组 COC7 属性"
};

// COC 七版规则书完整条文
const COC7_RULEBOOK_COMMAND_DOCS = [
  {
    key: "roll",
    name: "普通掷骰",
    syntax: ".r 或 .r xdy 或 .r xdy±n",
    vars: "{角色名}、{表达式}、{结果}",
    desc: `投掷与掷骰规则（Rolling the Dice）：
在克苏鲁的呼唤第七版规则中，投掷骰子用于决定行动结果以及不可预测的事件。
骰子的表示方式为标准多面骰记法：XdY。其中X代表投掷骰子的枚数，Y代表骰子的面数。例如1D100代表一枚百面骰（结果为1至100），2D6代表两枚六面骰之和（结果为2至12），1D3代表一枚三面骰（取六面骰结果除以二并向上取整）。
当投掷带有修正值时，记为XdY+n或XdY-n，修正值直接累加或扣减于总点数之上。
当玩家未指定具体面数直接输入.r时，系统默认执行标准百面骰投掷（1D100）。`
  },
  {
    key: "check",
    name: "技能检定",
    syntax: ".ra 技能名 或 .ra 技能名 b 或 .ra 技能名 p",
    vars: "{角色名}、{技能}、{结果}、{技能数值}、{成功等级}",
    desc: `技能与属性检定（Skill and Characteristic Rolls）：
进行检定时，调查员投掷1D100并将结果与该技能或属性的当前数值进行比对，以确定行动是否成功以及成功的等级：
【大成功（Critical Success）】：掷出01点。无论难度如何，必然成功，且往往带来额外的绝佳收益；
【极难成功（Extreme Success）】：掷出的点数小于或等于目标技能数值的五分之一（技能值/5向下取整）。达成超乎寻常的卓越成果；
【困难成功（Hard Success）】：掷出的点数小于或等于目标技能数值的二分之一（技能值/2向下取整）。在更严苛的挑战中依然达成目标；
【常规成功（Regular Success）】：掷出的点数小于或等于目标技能数值（但大于二分之一值）。完成预期行动；
【失败（Failure）】：掷出的点数大于目标技能数值（且未达到大失败范围）。行动未达预期；
【大失败（Fumble）】：当技能数值低于50时，掷出96至100点均为大失败；当技能数值达到或超过50时，仅掷出100点为大失败。必然失败并可能招致灾难性的副作用。
奖励骰与惩罚骰（Bonus and Penalty Dice）：
当情况对调查员极为有利或极其不利时使用。除常规掷出个位骰与十位骰外，额外投掷一个或多个十位数骰子。奖励骰在所有十位骰中选取最小值与个位结合；惩罚骰在所有十位骰中选取最大值与个位结合。`
  },
  {
    key: "st",
    name: "属性修改",
    syntax: ".st 属性/技能 数值 或 .st hp/mp/san±n",
    vars: "{角色名}、{变更列表}",
    desc: `属性与技能录入修改指令（Set Characteristic & Skill Values）：
允许玩家快速录入或修改角色面板中的属性、生命（HP）、理智（SAN）、魔法（MP）以及各项技能数值。
支持批量录入（如 .st 力量60敏捷70）、运算调整（如 .st hp+5 或 .st san-3），操作完成后自动同步回写至角色数据面板。`
  },
  {
    key: "sc",
    name: "理智检定",
    syntax: ".sc 成功损失/失败损失（如 .sc 0/1d6 或 .sc 1/1d10）",
    vars: "{角色名}、{结果}、{SAN}、{成功等级}、{旧SAN}、{新SAN}",
    desc: `理智检定规则（Sanity Rolls & Sanity Losses）：
当调查员遭遇怪诞、惊悚、超越人类常理的恐怖生物或残酷情景时，守秘人将要求进行理智检定（Sanity Check，简称SC）。
调查员掷1D100，将其与当前理智值（Sanity Point，简称SAN）对比：
- 掷骰结果小于或等于当前理智值：检定成功。调查员保持心理镇定，仅扣除斜杠前方的成功损失数值（通常为0或较少数值）；
- 掷骰结果大于当前理智值：检定失败。调查员受到精神创伤，扣除斜杠后方的失败损失数值（例如1D6、1D10等骰子点数）；
- 掷出01为大成功，承受该情景所允许的最低损失；掷出100（或96-100）为大失败，直接承受最大可能损失；
- 数据回写：理智损失立即从人物卡理智值中扣除，并实时保存至角色面板。若单次理智损失达到5点或以上，可能立即诱发短期临时疯狂。`
  },
  {
    key: "coc",
    name: "属性生成",
    syntax: ".coc",
    vars: "{角色名}",
    desc: `调查员属性决定（Determining Characteristics）：
第七版《克苏鲁的呼唤》调查员属性由标准投掷公式计算：
力量（STR）：3D6×5，代表身体纯粹肌肉力量与物理破坏潜能；
敏捷（DEX）：3D6×5，代表身体反应速度、敏捷度与手眼协调能力；
体质（CON）：3D6×5，代表健康状况、抗病耐受力与生命力韧性；
意志（POW）：3D6×5，代表精神力量、意志坚定程度与魔法潜能；
体型（SIZ）：(2D6+6)×5，代表身高、体重与体格骨架大小；
教育（EDU）：(2D6+6)×5，代表受正规教育年限与所掌握的常识渊博度；
外貌（APP）：3D6×5，代表相貌面容、身体吸引力与个人魅力气场；
智力（INT）：(2D6+6)×5，代表分析推理能力、直觉洞察与灵感敏锐度；
幸运（LUK）：3D6×5，代表命运的青睐程度。
属性总和计算：前八项主要属性之和为核心点数，含幸运为全属性总点数。生成后气泡内附带选择并导入按钮，可一键写回当前玩家的人物卡并重算衍生数值。`
  },
  {
    key: "coc5",
    name: "多组生成",
    syntax: ".coc5",
    vars: "{角色名}",
    desc: `多方案属性生成（Alternative Method - Creating Multiple Sets）：
为给予玩家多样的角色构思空间，允许一次性生成五组符合七版标准公式的完整属性方案。
每组方案均独立结算力量、敏捷、体质、意志、体型、教育、外貌、智力、幸运及合计点数。
玩家可审视五组方案的特点与偏向，在聊天窗口中点击任意方案对应的选择按钮，即可精确导入该方案数值并实时刷新人物面板。`
  },
  {
    key: "growth",
    name: "成长检定",
    syntax: ".en 技能名",
    vars: "{角色名}、{技能}、{结果}、{技能数值}、{成功等级}",
    desc: `技能成长与发展（Skill Improvement / Development Phase）：
在模组或章节结案阶段，调查员对其在调查期间成功使用并获得标记的技能进行成长检定。
调查员针对该技能投掷1D100：
- 掷出点数大于该技能当前值（或掷出96-100点）：检定成功。表明调查员在实践中总结并获得了新领悟，立即掷1D10，并将所得点数（1至10点）增加至该技能当前值上；
- 掷出点数小于或等于该技能当前值：检定失败。调查员未能从过去的经验中获得显著提升，技能值保持不变；
- 技能成长后立即写回人物面板并持久化保存。`
  },
  {
    key: "ti",
    name: "疯狂发作",
    syntax: ".ti",
    vars: "{角色名}、{疯狂症状}",
    desc: `临时性疯狂与症状表（Temporary Insanity Summary）：
调查员在一轮时间内损失达到或超过5点理智值，且理智检定失败时陷入临时疯狂。
发作状态分为两阶段：第一阶段为即时发作（Bout of Madness，持续1D10轮），调查员失去自主行动控制权；随后进入潜在疯狂期。
即时发作由系统或KP投掷1D10在短期临时疯狂症状表中随机决定症状（包括：1.失忆、2.假性残疾、3.暴力倾向、4.偏执妄想、5.人格分裂、6.恐惧症、7.躁狂症、8.昏厥、9.歇斯底里、10.惊恐发作）。`
  },
  {
    key: "secret",
    name: "暗骰投掷",
    syntax: ".rh 技能名 或 .rh 表达式",
    vars: "{角色名}",
    desc: `暗骰与盲掷（Hidden Rolls & Secret Rolls）：
当守秘人（KP）需要判定某些调查员无法确切知晓成败与否的情报获取（例如暗中聆听、侦查潜行敌人、心理学解读动机或潜意识感知）时进行暗骰。
暗掷结果不向调查员公开具体投掷点数与技能数值，防止产生场外元游戏决策，保持剧情的未知与悬疑氛围。`
  },
  {
    key: "hp",
    name: "生命调整",
    syntax: ".hp ±点数（如 .hp -3 或 .hp +2）",
    vars: "{角色名}、{旧HP}、{新HP}",
    desc: `生命值与伤害规则（Hit Points and Damage）：
调查员的生命值上限（Maximum HP）等于（体质CON+体型SIZ）除以10，向下取整。
当遭受武器攻击、跌落、火焰、毒素或重击时，扣除相应生命值；接受急救（First Aid）或医学（Medicine）成功治疗时恢复生命值。
生命值下限为0点，上限不可超过最大生命值。指令直接调整调查员人物面板的当前生命值并自动回写持久化。`
  }
];

const CANYUNWOSHI_RULEBOOK_COMMAND_DOCS = JSON.parse(JSON.stringify(COC7_RULEBOOK_COMMAND_DOCS));

window.RULEBOOK_DOCS_MAP = {
  coc7: COC7_RULEBOOK_COMMAND_DOCS,
  canyunwoshi: CANYUNWOSHI_RULEBOOK_COMMAND_DOCS
};

const DEFAULT_RULE_SYSTEM_PRESETS = [
  {
    id: "coc7",
    name: "COC7",
    modules: [
      { id: "mod_coc_combat", name: "战斗规则", prompt: "" },
      { id: "mod_coc_career", name: "职业规则", prompt: "" },
      { id: "mod_coc_check", name: "属性检定", prompt: "" },
      { id: "mod_coc_sanity", name: "理智规则", prompt: "" },
      { id: "mod_coc_chase", name: "追逐规则", prompt: "" },
      { id: "mod_coc_magic", name: "魔法规则", prompt: "" }
    ]
  },
  {
    id: "canyunwoshi",
    name: "餐云卧石",
    modules: [
      { id: "mod_cy_combat", name: "战斗规则", prompt: "" },
      { id: "mod_cy_cultivation", name: "心法规则", prompt: "" },
      { id: "mod_cy_root", name: "灵根属性", prompt: "" },
      { id: "mod_cy_realm", name: "境界突破", prompt: "" },
      { id: "mod_cy_sect", name: "宗门职事", prompt: "" }
    ]
  }
];

window.getStoredRuleSystemPresets = function() {
  try {
    const raw = localStorage.getItem("coc_rulebook_system_presets");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(p => {
          if (p.id === "yunwoshi" || p.id === "canyunwoshi" || p.name.includes("云卧石") || p.name.includes("餐饮") || p.name.includes("参云")) {
            p.id = "canyunwoshi";
            p.name = "餐云卧石";
          }
          if (!Array.isArray(p.modules)) {
            p.modules = [];
          }
        });
        return parsed;
      }
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_RULE_SYSTEM_PRESETS));
};

window.saveStoredRuleSystemPresets = function(presets) {
  try {
    localStorage.setItem("coc_rulebook_system_presets", JSON.stringify(presets));
  } catch (e) {}
};

window.getActiveRulePresetId = function() {
  const presets = window.getStoredRuleSystemPresets();
  const saved = localStorage.getItem("coc_active_rulebook_preset_id");
  if (saved && presets.some(p => p.id === saved)) {
    return saved;
  }
  return presets[0] ? presets[0].id : "coc7";
};

window.setActiveRulePresetId = function(id) {
  try {
    localStorage.setItem("coc_active_rulebook_preset_id", id);
  } catch (e) {}
};

window.getStoredRulebooksList = function() {
  const presets = window.getStoredRuleSystemPresets();
  return presets.map(p => ({ id: p.id, name: p.name }));
};

window.getActiveRulebookId = function() {
  return window.getActiveRulePresetId();
};

// 现实气候天数换算的默认天气池
const DEFAULT_WEATHER_POOLS = [
  {
    id: "weather_temperate",
    name: "温带气候",
    seasons: {
      "春季": [
        { name: "晴天", rate: 35, note: "春光明媚，微风和煦，万物复苏" },
        { name: "多云", rate: 25, note: "春云淡淡，微风习习，舒适宜人" },
        { name: "小雨", rate: 20, note: "细雨绵绵，滋润大地，空气湿润" },
        { name: "微风", rate: 15, note: "杨柳轻拂，暖意融融" },
        { name: "雷阵雨", rate: 5, note: "春雷乍响，短时阵雨" }
      ],
      "夏季": [
        { name: "晴朗酷热", rate: 40, note: "烈日高照，骄阳似火，气温炎热" },
        { name: "雷阵雨", rate: 25, note: "午后骤起暴雨，电闪雷鸣，阵风强劲" },
        { name: "多云闷热", rate: 20, note: "云层厚重，气压较低，体感闷热" },
        { name: "大雨", rate: 15, note: "大雨滂沱，水汽漫漫，道路积水" }
      ],
      "秋季": [
        { name: "秋高气爽", rate: 40, note: "天高云淡，凉风送爽，体感极佳" },
        { name: "阴天", rate: 25, note: "天色阴沉，落叶缤纷，凉意渐浓" },
        { name: "小雨", rate: 20, note: "秋雨连绵，夜凉如水，泥土湿润" },
        { name: "大风", rate: 15, note: "秋风瑟瑟，树影摇曳，气温明显走低" }
      ],
      "冬季": [
        { name: "晴冷", rate: 35, note: "天空湛蓝，寒风刺骨，阳光清冷" },
        { name: "小雪", rate: 25, note: "雪花飘洒，轻盈落地，草木覆霜" },
        { name: "阴沉大风", rate: 20, note: "天寒地冻，冷风呼啸，极度阴凉" },
        { name: "大雪", rate: 15, note: "漫天飞雪，银装素裹，积雪深厚" },
        { name: "冻雨", rate: 5, note: "冰冷雨丝落地成冰，地面极滑" }
      ]
    },
    items: [
      { name: "晴天", rate: 36, note: "温和宜人，阳光明媚，视野开阔" },
      { name: "多云", rate: 25, note: "云层较厚，微风习习，体感舒适" },
      { name: "小雨", rate: 15, note: "细雨绵绵，空气湿润，地面潮湿" },
      { name: "阴天", rate: 11, note: "天色阴沉，光线灰暗，压抑沉闷" },
      { name: "雷阵雨", rate: 8, note: "雷声阵阵，阵雨滂沱，伴有短时大风" },
      { name: "大风", rate: 5, note: "狂风呼啸，树枝摇晃，气温骤降" }
    ]
  },
  {
    id: "weather_tropical",
    name: "热带气候",
    seasons: {
      "春季": [
        { name: "晴朗温暖", rate: 45, note: "日光明媚，海风轻拂，温暖明朗" },
        { name: "阵雨", rate: 30, note: "短时热带阵雨，很快雨过天晴" },
        { name: "多云", rate: 25, note: "云絮散落，气候温润" }
      ],
      "夏季": [
        { name: "艳阳高照", rate: 40, note: "烈日炎炎，气温极高，闷热难耐" },
        { name: "热带暴雨", rate: 30, note: "午后骤起倾盆大雨，雨势凶猛，水汽弥漫" },
        { name: "湿热多云", rate: 20, note: "云层厚重，空气湿度极高，体感黏热" },
        { name: "台风大风", rate: 10, note: "强风肆虐，暴雨交加，海浪汹涌" }
      ],
      "秋季": [
        { name: "晴朗微热", rate: 45, note: "阳光充沛，体感微热，微风送爽" },
        { name: "骤雨", rate: 35, note: "午后局部降雨，稍带凉意" },
        { name: "多云", rate: 20, note: "云霞绚丽，海风和煦" }
      ],
      "冬季": [
        { name: "和煦晴天", rate: 55, note: "阳光柔和，微风不燥，温度最为舒适" },
        { name: "多云凉爽", rate: 30, note: "云层适中，清晨微凉，舒适惬意" },
        { name: "小雨", rate: 15, note: "细雨飘过，空气清新怡人" }
      ]
    },
    items: [
      { name: "艳阳高照", rate: 41, note: "烈日炎炎，气温极高，闷热难耐" },
      { name: "热带暴雨", rate: 30, note: "午后骤起倾盆大雨，雨势凶猛，水汽弥漫" },
      { name: "湿热多云", rate: 19, note: "云层厚重，空气湿度极高，体感黏热" },
      { name: "台风大风", rate: 10, note: "强风肆虐，暴雨交加，海浪汹涌" }
    ]
  },
  {
    id: "weather_frigid",
    name: "寒带气候",
    seasons: {
      "春季": [
        { name: "初融晴冷", rate: 40, note: "积雪初融，阳光清冽但寒气逼人" },
        { name: "小雪", rate: 30, note: "春雪纷飞，料峭微寒" },
        { name: "阴冷大风", rate: 30, note: "寒风呼啸，气温仍然在冰点以下" }
      ],
      "夏季": [
        { name: "极昼凉晴", rate: 45, note: "极地阳光普照，微风清爽，短暂宜人" },
        { name: "多云阴凉", rate: 35, note: "薄雾笼罩，体感微冷" },
        { name: "冷雨", rate: 20, note: "冰冷细雨，带着刺骨寒意" }
      ],
      "秋季": [
        { name: "早雪", rate: 40, note: "初冬早雪降临，大地转白" },
        { name: "晴冷大风", rate: 35, note: "狂风卷着寒流，冰冷刺骨" },
        { name: "阴沉结冰", rate: 25, note: "地面结冰，冷气凝结" }
      ],
      "冬季": [
        { name: "暴风雪", rate: 35, note: "大雪纷飞，狂风卷雪，能见度极低，极度严寒" },
        { name: "极夜晴冷", rate: 25, note: "天色幽暗，极地严寒，滴水成冰" },
        { name: "小雪", rate: 20, note: "轻雪飘落，寒风料峭，积雪皑皑" },
        { name: "阴沉大风", rate: 15, note: "极地寒风呼啸，体感极冷" },
        { name: "冻雨", rate: 5, note: "冰冷雨丝接触地面即凝结成冰，道路极滑" }
      ]
    },
    items: [
      { name: "暴风雪", rate: 30, note: "大雪纷飞，狂风卷雪，能见度极低，极度严寒" },
      { name: "小雪", rate: 25, note: "轻雪飘落，寒风料峭，积雪皑皑" },
      { name: "晴冷", rate: 21, note: "天空湛蓝但寒风刺骨，气温极低，滴水成冰" },
      { name: "阴沉大风", rate: 15, note: "天色昏暗，极地寒风呼啸，体感极冷" },
      { name: "冻雨", rate: 9, note: "冰冷雨丝接触地面即凝结成冰，道路极滑" }
    ]
  }
];

// 短期临时疯狂症状表
const COC_SHORT_TERM_INSANITY = [
  "失忆：调查员发现自己记忆出现断层，不记得自己是谁或身在何处，持续1D10轮。",
  "假性残疾：调查员身体机能突发心因性丧失，例如暂时失明、失聪或肢体瘫痪，持续1D10轮。",
  "暴力倾向：调查员被愤怒支配，爆发无法遏制的暴力行为，向周围最近的目标发动无差别的物理攻击，持续1D10轮。",
  "偏执妄想：调查员陷入极端的多疑与被害妄想，认为同伴在谋害自己，拒绝一切帮助，持续1D10轮。",
  "人格分裂：调查员潜意识分裂出另一重人格，通常与原性格截然相反，持续1D10轮。",
  "恐惧症：调查员突发严重的特定恐惧症，如幽闭恐惧、黑暗恐惧或怪物恐惧，本能地尖叫逃离恐惧源，持续1D10轮。",
  "躁狂症：调查员陷入无法自控的情绪亢奋或狂躁，可能狂笑、手舞足蹈或进行无意义的重复举动，持续1D10轮。",
  "昏厥：调查员受惊过度直接瘫倒休克，昏迷不醒，持续1D10轮后苏醒。",
  "歇斯底里：调查员情绪彻底崩溃，嚎啕大哭、大喊大叫、身体剧烈颤抖，无法进行连贯行动，持续1D10轮。",
  "惊恐发作：调查员陷入濒死般的强烈恐惧，呼吸急促心悸，只能本能地抱头逃窜或蜷缩在角落，持续1D10轮。"
];

// 获取已存储的指令预设
function getStoredDicePresets() {
  try {
    const raw = localStorage.getItem("coc_dice_presets");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("读取骰子预设失败:", e);
  }
  return [
    {
      id: "preset_default",
      name: "标准规则播报",
      templates: { ...DEFAULT_DICE_TEMPLATES }
    }
  ];
}

function saveStoredDicePresets(presets) {
  try {
    localStorage.setItem("coc_dice_presets", JSON.stringify(presets));
  } catch (e) {
    console.error("保存骰子预设失败:", e);
  }
}

function getActiveDicePreset() {
  const presets = getStoredDicePresets();
  const activeId = localStorage.getItem("coc_active_dice_preset_id");
  const found = presets.find(p => p.id === activeId);
  return found || presets[0] || { id: "preset_default", name: "标准规则播报", templates: { ...DEFAULT_DICE_TEMPLATES } };
}

// 季节识别辅助
function getSeasonNameByMonth(month) {
  const m = parseInt(month, 10) || 1;
  if (m >= 3 && m <= 5) return "春季";
  if (m >= 6 && m <= 8) return "夏季";
  if (m >= 9 && m <= 11) return "秋季";
  return "冬季";
}
window.getSeasonNameByMonth = getSeasonNameByMonth;

// 标准化天气池数据结构，确保四季完整存在
function normalizeWeatherPool(pool) {
  if (!pool) return pool;
  if (!pool.seasons || typeof pool.seasons !== "object") {
    const defaultList = Array.isArray(pool.items) && pool.items.length > 0 ? pool.items : [
      { name: "晴天", rate: 50, note: "温和宜人" },
      { name: "多云", rate: 30, note: "云层微厚" },
      { name: "小雨", rate: 20, note: "细雨绵绵" }
    ];
    pool.seasons = {
      "春季": JSON.parse(JSON.stringify(defaultList)),
      "夏季": JSON.parse(JSON.stringify(defaultList)),
      "秋季": JSON.parse(JSON.stringify(defaultList)),
      "冬季": JSON.parse(JSON.stringify(defaultList))
    };
  } else {
    ["春季", "夏季", "秋季", "冬季"].forEach(s => {
      if (!Array.isArray(pool.seasons[s]) || pool.seasons[s].length === 0) {
        pool.seasons[s] = Array.isArray(pool.items) && pool.items.length > 0
          ? JSON.parse(JSON.stringify(pool.items))
          : [{ name: "晴天", rate: 50, note: "温和宜人" }];
      }
    });
  }
  if (!Array.isArray(pool.items) || pool.items.length === 0) {
    pool.items = pool.seasons["春季"] || [];
  }
  return pool;
}

// 获取天气池预设
function getStoredWeatherPools() {
  try {
    const raw = localStorage.getItem("coc_weather_pools");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeWeatherPool);
      }
    }
  } catch (e) {
    console.error("读取天气池预设失败:", e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_WEATHER_POOLS)).map(normalizeWeatherPool);
}
window.getStoredWeatherPools = getStoredWeatherPools;

function saveStoredWeatherPools(pools) {
  try {
    localStorage.setItem("coc_weather_pools", JSON.stringify(pools));
  } catch (e) {
    console.error("保存天气池预设失败:", e);
  }
}

function getActiveWeatherPool() {
  const pools = getStoredWeatherPools();
  const activeId = localStorage.getItem("coc_active_weather_pool_id");
  const found = pools.find(p => p.id === activeId);
  return found || pools[0];
}

// 抽取天气池中的天气（支持季节/月份传入与指定气候池名称或ID）
window.drawWeatherFromCurrentPool = function(seasonOrMonth, poolNameOrId) {
  let pool = null;
  const pools = getStoredWeatherPools();
  if (poolNameOrId) {
    pool = pools.find(p => p.id === poolNameOrId || p.name === poolNameOrId);
  }
  if (!pool) {
    pool = getActiveWeatherPool();
  }
  if (!pool) return { name: "晴天", rate: 100, note: "温和宜人", season: "春季" };

  let seasonName = "春季";
  if (typeof seasonOrMonth === "number" || (!isNaN(parseInt(seasonOrMonth)) && !String(seasonOrMonth).includes("季"))) {
    seasonName = getSeasonNameByMonth(seasonOrMonth);
  } else if (typeof seasonOrMonth === "string" && ["春季", "夏季", "秋季", "冬季"].includes(seasonOrMonth)) {
    seasonName = seasonOrMonth;
  } else {
    seasonName = getSeasonNameByMonth(new Date().getMonth() + 1);
  }

  const items = (pool.seasons && Array.isArray(pool.seasons[seasonName]) && pool.seasons[seasonName].length > 0)
    ? pool.seasons[seasonName]
    : (Array.isArray(pool.items) && pool.items.length > 0 ? pool.items : [{ name: "晴天", rate: 100, note: "温和宜人" }]);

  const totalRate = items.reduce((sum, item) => sum + (parseFloat(item.rate) || 0), 0);
  if (totalRate <= 0) return { ...items[0], season: seasonName, poolName: pool.name };

  let rand = Math.random() * totalRate;
  for (const item of items) {
    const r = parseFloat(item.rate) || 0;
    if (rand < r) {
      return { ...item, season: seasonName, poolName: pool.name };
    }
    rand -= r;
  }
  return { ...items[items.length - 1], season: seasonName, poolName: pool.name };
};

// 掷多面骰辅助函数
function rollDiceExpression(expr) {
  let clean = expr.toLowerCase().replace(/\s+/g, "");
  if (!clean || clean === "1d100" || clean === "d100" || clean === "100") {
    const val = Math.floor(Math.random() * 100) + 1;
    return { total: val, detail: `D100=${val}` };
  }

  const match = clean.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (match) {
    const count = parseInt(match[1], 10) || 1;
    const sides = parseInt(match[2], 10);
    const mod = match[3] ? parseInt(match[3], 10) : 0;

    let rolls = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * sides) + 1;
      rolls.push(r);
      sum += r;
    }
    const finalVal = sum + mod;
    let detail = "";
    if (count > 1 || mod !== 0) {
      detail = `${rolls.join("+")}${mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : ""}=${finalVal}`;
    } else {
      detail = `${finalVal}`;
    }
    return { total: finalVal, detail: detail };
  }

  const num = parseInt(clean, 10);
  if (!isNaN(num)) {
    return { total: num, detail: `${num}` };
  }

  const def = Math.floor(Math.random() * 100) + 1;
  return { total: def, detail: `D100=${def}` };
}

// 格式化占位符替换
function formatDiceTemplate(template, vars) {
  let str = template;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  }
  return str;
}

// 生成一组 COC7 属性
function generateCoc7Attributes() {
  const roll3d6 = () => (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1);
  const roll2d6p6 = () => (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) + 6;

  const str = roll3d6() * 5;
  const con = roll3d6() * 5;
  const siz = roll2d6p6() * 5;
  const dex = roll3d6() * 5;
  const app = roll3d6() * 5;
  const int = roll2d6p6() * 5;
  const pow = roll3d6() * 5;
  const edu = roll2d6p6() * 5;
  const luk = roll3d6() * 5;

  const total = str + con + siz + dex + app + int + pow + edu;
  const totalWithLuk = total + luk;

  return { str, con, siz, dex, app, int, pow, edu, luk, total, totalWithLuk };
}

const COC_KEY_MAP = {
  "str": "str", "力量": "str",
  "dex": "dex", "敏捷": "dex",
  "con": "con", "体质": "con",
  "pow": "pow", "意志": "pow",
  "siz": "siz", "体型": "siz",
  "edu": "edu", "教育": "edu",
  "app": "app", "外貌": "app",
  "int": "int", "智力": "int", "灵感": "int",
  "hp": "hp", "生命": "hp",
  "mp": "mp", "魔法": "mp",
  "san": "san", "理智": "san", "心智": "san",
  "armor": "armor", "护甲": "armor", "甲": "armor", "护盾": "armor", "盾": "armor"
};

// 核心指令解析函数：支持代骰、角色名绑定、守密人保护、气泡内嵌指令触发
window.executeDiceCommand = function(rawContent, chat, diceInfo, senderInfo) {
  if (!rawContent || typeof rawContent !== "string") return null;

  const activePreset = getActiveDicePreset();
  const templates = { ...DEFAULT_DICE_TEMPLATES, ...(activePreset.templates || {}) };

  // 1. 查找群聊或单聊中的目标角色（支持代骰）
  const defaultSenderName = (senderInfo && senderInfo.name) ? senderInfo.name : (chat.settings?.myNickname || chat.settings?.myName || "我");
  const defaultSenderId = (senderInfo && senderInfo.id) ? senderInfo.id : "user";

  // 检查发送者是否为群聊中被选为守密人 (KP) 的角色
  const keeperTargetId = chat.settings?.keeperTargetId;
  const isKeeperRole = Boolean(
    chat.isGroup &&
    keeperTargetId &&
    keeperTargetId !== "none" &&
    (defaultSenderId === keeperTargetId || (senderInfo && senderInfo.name === chat.settings?.keeperName) || (senderInfo && senderInfo.id === keeperTargetId))
  );

  // 解析目标角色函数
  const resolveTarget = (explicitTargetName) => {
    if (explicitTargetName && explicitTargetName.trim()) {
      const q = explicitTargetName.trim().toLowerCase();

      // 1. 优先在当前战斗参战列表中匹配（支持完整角色名与模糊匹配）
      const combatState = (typeof window.getCombatState === "function") ? window.getCombatState(chat) : (chat.combatState || null);
      if (combatState && Array.isArray(combatState.combatants) && combatState.combatants.length > 0) {
        let foundCombatant = combatState.combatants.find(c => {
          const cn = (c.name || "").toLowerCase().trim();
          return cn === q || c.id === q;
        });
        if (!foundCombatant) {
          foundCombatant = combatState.combatants.find(c => {
            const cn = (c.name || "").toLowerCase().trim();
            return cn.includes(q) || q.includes(cn);
          });
        }
        if (foundCombatant) {
          return {
            id: foundCombatant.id,
            name: foundCombatant.name,
            isUser: Boolean(foundCombatant.isUser),
            isProxy: true,
            isCombatant: true,
            combatant: foundCombatant,
            cocPanel: foundCombatant.cocPanel || {
              stats: {
                dex: foundCombatant.dex || 50,
                str: foundCombatant.str || 50,
                con: foundCombatant.con || 50,
                pow: foundCombatant.pow || 50,
                siz: foundCombatant.siz || 50,
                edu: foundCombatant.edu || 50,
                app: foundCombatant.app || 50,
                int: foundCombatant.int || 50,
                luk: foundCombatant.luk || 50
              },
              skills: foundCombatant.skills || {},
              calculated: {
                hp: (foundCombatant.hp !== undefined) ? foundCombatant.hp : 10,
                maxHp: (foundCombatant.maxHp !== undefined) ? foundCombatant.maxHp : 10,
                mp: (foundCombatant.mp !== undefined) ? foundCombatant.mp : 10,
                maxMp: (foundCombatant.maxMp !== undefined) ? foundCombatant.maxMp : 10,
                san: (foundCombatant.san !== undefined) ? foundCombatant.san : 50,
                maxSan: (foundCombatant.maxSan !== undefined) ? foundCombatant.maxSan : 50,
                armor: (foundCombatant.armor !== undefined) ? foundCombatant.armor : 0
              }
            },
            onSave: (newCoc) => {
              if (newCoc.calculated) {
                if (newCoc.calculated.hp !== undefined) foundCombatant.hp = newCoc.calculated.hp;
                if (newCoc.calculated.maxHp !== undefined) foundCombatant.maxHp = newCoc.calculated.maxHp;
                if (newCoc.calculated.mp !== undefined) foundCombatant.mp = newCoc.calculated.mp;
                if (newCoc.calculated.maxMp !== undefined) foundCombatant.maxMp = newCoc.calculated.maxMp;
                if (newCoc.calculated.san !== undefined) foundCombatant.san = newCoc.calculated.san;
                if (newCoc.calculated.maxSan !== undefined) foundCombatant.maxSan = newCoc.calculated.maxSan;
                if (newCoc.calculated.armor !== undefined) foundCombatant.armor = newCoc.calculated.armor;
              }
              if (newCoc.stats) {
                if (newCoc.stats.dex !== undefined) foundCombatant.dex = newCoc.stats.dex;
                if (newCoc.stats.str !== undefined) foundCombatant.str = newCoc.stats.str;
                if (newCoc.stats.con !== undefined) foundCombatant.con = newCoc.stats.con;
                if (newCoc.stats.pow !== undefined) foundCombatant.pow = newCoc.stats.pow;
                if (newCoc.stats.siz !== undefined) foundCombatant.siz = newCoc.stats.siz;
                if (newCoc.stats.int !== undefined) foundCombatant.int = newCoc.stats.int;
                if (newCoc.stats.app !== undefined) foundCombatant.app = newCoc.stats.app;
                if (newCoc.stats.edu !== undefined) foundCombatant.edu = newCoc.stats.edu;
                if (newCoc.stats.luk !== undefined) foundCombatant.luk = newCoc.stats.luk;
              }
              foundCombatant.cocPanel = newCoc;
              if (typeof window.syncCombatantToRealCard === "function") {
                window.syncCombatantToRealCard(chat, foundCombatant);
              }
              const dbInstance = typeof global.db !== "undefined" ? global.db : global.database;
              if (dbInstance && chat.id) {
                dbInstance.chats.put(chat);
              }
              if (typeof window.renderCombatCharacterBar === "function") {
                window.renderCombatCharacterBar(chat.id);
              }
            }
          };
        }
      }

      // 在群聊成员中精确/模糊匹配
      if (chat.isGroup && Array.isArray(chat.members)) {
        const found = chat.members.find(m => {
          const gn = (m.groupNickname || "").toLowerCase();
          const on = (m.originalName || "").toLowerCase();
          const id = (m.id || "").toLowerCase();
          return gn === q || on === q || id === q || gn.includes(q) || on.includes(q);
        });
        if (found) {
          return {
            id: found.id,
            name: found.groupNickname || found.originalName,
            isUser: false,
            isProxy: true,
            cocPanel: found.cocPanel || (typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} }),
            onSave: (newCoc) => {
              found.cocPanel = newCoc;
              if (state.chats && state.chats[found.id]) {
                if (!state.chats[found.id].settings) state.chats[found.id].settings = {};
                state.chats[found.id].settings.aiCocPanel = newCoc;
              }
            }
          };
        }
      }

      // 检查是否为我/用户
      const myNick = (chat.settings?.myNickname || "").toLowerCase();
      const myName = (chat.settings?.myName || "").toLowerCase();
      if (q === "我" || (myNick && (myNick === q || myNick.includes(q))) || (myName && (myName === q || myName.includes(q)))) {
        return {
          id: "user",
          name: chat.settings?.myNickname || chat.settings?.myName || "我",
          isUser: true,
          isProxy: true,
          cocPanel: chat.settings?.myCocPanel || (typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} }),
          onSave: (newCoc) => {
            if (!chat.settings) chat.settings = {};
            chat.settings.myCocPanel = newCoc;
            if (window.myCocPanel) window.myCocPanel.setData(newCoc);
          }
        };
      }

      // 检查单聊中的AI
      if (!chat.isGroup) {
        const aiName = (chat.name || "").toLowerCase();
        const aiRemark = (chat.settings?.remarkName || "").toLowerCase();
        if (aiName === q || aiRemark === q || aiName.includes(q) || aiRemark.includes(q)) {
          return {
            id: chat.id,
            name: chat.settings?.remarkName || chat.name,
            isUser: false,
            isProxy: true,
            cocPanel: chat.settings?.aiCocPanel || (typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} }),
            onSave: (newCoc) => {
              if (!chat.settings) chat.settings = {};
              chat.settings.aiCocPanel = newCoc;
              if (window.aiCocPanel) window.aiCocPanel.setData(newCoc);
            }
          };
        }
      }

      // 检查全局联系人
      if (state.chats) {
        const globalChar = Object.values(state.chats).find(c => {
          if (c.isGroup) return false;
          const cn = (c.name || "").toLowerCase();
          const cr = (c.settings?.remarkName || "").toLowerCase();
          return cn === q || cr === q || cn.includes(q) || cr.includes(q);
        });
        if (globalChar) {
          return {
            id: globalChar.id,
            name: globalChar.settings?.remarkName || globalChar.name,
            isUser: false,
            isProxy: true,
            cocPanel: globalChar.settings?.aiCocPanel || (typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} }),
            onSave: (newCoc) => {
              if (!globalChar.settings) globalChar.settings = {};
              globalChar.settings.aiCocPanel = newCoc;
              if (chat.isGroup && Array.isArray(chat.members)) {
                const m = chat.members.find(mb => mb.id === globalChar.id);
                if (m) m.cocPanel = newCoc;
              }
            }
          };
        }
      }
    }

    // 未指定代骰角色，则默认针对指令发送者本人
    let userCoc = (senderInfo && senderInfo.cocPanel) ? senderInfo.cocPanel : null;
    let onSave = null;

    if (senderInfo && typeof senderInfo.onSaveCoc === "function") {
      onSave = senderInfo.onSaveCoc;
    } else if (chat.isGroup && Array.isArray(chat.members) && defaultSenderId !== "user") {
      const mem = chat.members.find(m => m.id === defaultSenderId || m.groupNickname === defaultSenderName || m.originalName === defaultSenderName);
      if (mem) {
        userCoc = mem.cocPanel;
        onSave = (newCoc) => {
          mem.cocPanel = newCoc;
          if (state.chats && state.chats[mem.id]) {
            if (!state.chats[mem.id].settings) state.chats[mem.id].settings = {};
            state.chats[mem.id].settings.aiCocPanel = newCoc;
          }
        };
      }
    }

    if (!userCoc) {
      if (defaultSenderId === "user" || defaultSenderName === (chat.settings?.myNickname || chat.settings?.myName || "我")) {
        userCoc = chat.settings?.myCocPanel || (typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} });
        onSave = (newCoc) => {
          if (!chat.settings) chat.settings = {};
          chat.settings.myCocPanel = newCoc;
          if (window.myCocPanel) window.myCocPanel.setData(newCoc);
        };
      } else {
        userCoc = chat.settings?.aiCocPanel || (typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} });
        onSave = (newCoc) => {
          if (!chat.settings) chat.settings = {};
          chat.settings.aiCocPanel = newCoc;
          if (window.aiCocPanel) window.aiCocPanel.setData(newCoc);
        };
      }
    }

    return {
      id: defaultSenderId,
      name: defaultSenderName,
      isUser: defaultSenderId === "user",
      isProxy: false,
      cocPanel: userCoc,
      onSave: onSave
    };
  };

  // 1. 普通投掷 .r 或 .r 角色名 xdy 或 .r角色名 xdy
  const rMatch = cmdLine.match(/^r(?:([^\s\d\+\-\*\/]+))?(?:\s+(.+))?$/i);
  if (rMatch) {
    let rawArg1 = rMatch[1] ? rMatch[1].trim() : "";
    let rawArg2 = rMatch[2] ? rMatch[2].trim() : "";
    let target = resolveTarget(null);
    let expr = "1d100";

    if (rawArg1) {
      target = resolveTarget(rawArg1);
      expr = rawArg2 || "1d100";
    } else if (rawArg2) {
      const parts = rawArg2.split(/\s+/);
      if (parts.length > 1 && !/^(\d+d\d+|\d+)/i.test(parts[0])) {
        target = resolveTarget(parts[0]);
        expr = parts.slice(1).join(" ") || "1d100";
      } else {
        expr = rawArg2;
      }
    }

    const res = rollDiceExpression(expr);
    const text = formatDiceTemplate(templates.roll || DEFAULT_DICE_TEMPLATES.roll, {
      角色名: target.name,
      表达式: expr,
      结果: res.total
    });
    return { handled: true, text };
  }

  // 2. 暗骰 .rh [角色名] [xdy]
  const rhMatch = cmdLine.match(/^rh(?:([^\s\d\+\-\*\/]+))?(?:\s+(.+))?$/i);
  if (rhMatch) {
    const subExpr = (rhMatch[2] || rhMatch[1] || "1d100").trim();
    const res = rollDiceExpression(subExpr);
    const text = `${templates.secret || DEFAULT_DICE_TEMPLATES.secret} 点数已密掷`;
    return { handled: true, text };
  }

  // 3. 技能/属性检定 .ra [角色名] 技能名 [b/p] 或 .ra角色名 技能名
  const raMatch = cmdLine.match(/^ra(?:([^\s]+))?(?:\s+(.+))?$/i);
  if (raMatch) {
    let attachedTarget = raMatch[1] ? raMatch[1].trim() : "";
    let restParams = raMatch[2] ? raMatch[2].trim() : "";
    let targetName = null;
    let skillName = "";
    let bpMod = "";

    if (attachedTarget && !restParams) {
      // .ra侦查 -> attachedTarget is 侦查
      skillName = attachedTarget;
    } else if (attachedTarget && restParams) {
      // .ra张三 侦查
      targetName = attachedTarget;
      const parts = restParams.split(/\s+/);
      skillName = parts[0];
      bpMod = parts[1] || "";
    } else if (!attachedTarget && restParams) {
      // .ra 张三 侦查 或 .ra 侦查
      const parts = restParams.split(/\s+/);
      if (parts.length >= 2 && !/^(b\d*|p\d*)$/i.test(parts[1])) {
        targetName = parts[0];
        skillName = parts[1];
        bpMod = parts[2] || "";
      } else {
        skillName = parts[0];
        bpMod = parts[1] || "";
      }
    }

    if (skillName) {
      const target = resolveTarget(targetName);
      const userCoc = target.cocPanel || { stats: {}, skills: {}, calculated: {} };

      const lowerKey = skillName.toLowerCase();
      const mappedKey = COC_KEY_MAP[lowerKey] || COC_KEY_MAP[skillName];

      let skillVal = 50;
      if (mappedKey) {
        if (["hp", "mp", "san"].includes(mappedKey)) {
          if (userCoc.calculated && typeof userCoc.calculated[mappedKey] !== "undefined") {
            skillVal = parseInt(userCoc.calculated[mappedKey], 10) || 0;
          }
        } else if (userCoc.stats && typeof userCoc.stats[mappedKey] !== "undefined") {
          skillVal = parseInt(userCoc.stats[mappedKey], 10) || 0;
        }
      } else if (userCoc.skills && typeof userCoc.skills[skillName] !== "undefined") {
        skillVal = parseInt(userCoc.skills[skillName], 10) || 0;
      } else if (userCoc.stats && typeof userCoc.stats[skillName] !== "undefined") {
        skillVal = parseInt(userCoc.stats[skillName], 10) || 0;
      } else if (typeof getSkillBaseValue === "function") {
        skillVal = getSkillBaseValue(skillName, userCoc.stats);
      }

      let finalRoll = Math.floor(Math.random() * 100) + 1;
      let rollDetail = `${finalRoll}`;

      const lowBp = bpMod.toLowerCase();
      if (lowBp.startsWith("b")) {
        const bonusCount = parseInt(lowBp.slice(1), 10) || 1;
        const units = finalRoll % 10;
        let tens = [Math.floor(finalRoll / 10)];
        for (let i = 0; i < bonusCount; i++) {
          tens.push(Math.floor(Math.random() * 10));
        }
        const minTen = Math.min(...tens);
        finalRoll = (minTen === 0 && units === 0) ? 100 : (minTen * 10 + units);
        rollDetail = `${finalRoll}`;
      } else if (lowBp.startsWith("p")) {
        const penaltyCount = parseInt(lowBp.slice(1), 10) || 1;
        const units = finalRoll % 10;
        let tens = [Math.floor(finalRoll / 10)];
        for (let i = 0; i < penaltyCount; i++) {
          tens.push(Math.floor(Math.random() * 10));
        }
        const maxTen = Math.max(...tens);
        finalRoll = (maxTen === 0 && units === 0) ? 100 : (maxTen * 10 + units);
        rollDetail = `${finalRoll}`;
      }

      let level = "失败";
      if (finalRoll === 1) {
        level = "大成功";
      } else if (finalRoll === 100 || (skillVal >= 50 && finalRoll >= 96)) {
        level = "大失败";
      } else if (finalRoll <= Math.floor(skillVal / 5)) {
        level = "极难成功";
      } else if (finalRoll <= Math.floor(skillVal / 2)) {
        level = "困难成功";
      } else if (finalRoll <= skillVal) {
        level = "常规成功";
      }

      const text = formatDiceTemplate(templates.check || DEFAULT_DICE_TEMPLATES.check, {
        角色名: target.name,
        技能: skillName,
        结果: rollDetail,
        技能数值: skillVal,
        成功等级: level
      });
      return { handled: true, text };
    }
  }

  // 3.5 属性/技能录入与修改 .st [角色名] 力量60 / .st角色名 hp-5 / .st 角色名 掷骰 50 / .st 角色名 hp -5 / .st hp-5 / .st 邪教徒甲 hp-5 mp-2 san-1
  const stMatch = cmdLine.match(/^st(?:([^\s\d\+\-\=:]+))?(?:\s+([\s\S]+))?$/i);
  if (stMatch) {
    let attachedTarget = stMatch[1] ? stMatch[1].trim() : "";
    let restContent = stMatch[2] ? stMatch[2].trim() : "";
    let targetName = null;
    let stBody = "";

    if (attachedTarget && restContent) {
      targetName = attachedTarget;
      stBody = restContent;
    } else if (!attachedTarget && restContent) {
      const parts = restContent.split(/\s+/);
      const possibleName = parts[0];
      const remainder = parts.slice(1).join(" ");
      const combatState = (typeof window.getCombatState === "function") ? window.getCombatState(chat) : (chat.combatState || null);
      const isCombatTarget = combatState && Array.isArray(combatState.combatants) && combatState.combatants.some(c => (c.name || "").toLowerCase() === possibleName.toLowerCase() || (c.name || "").toLowerCase().includes(possibleName.toLowerCase()));
      const isKnownTarget = isCombatTarget || (chat.isGroup && Array.isArray(chat.members) && chat.members.some(m => (m.groupNickname === possibleName || m.originalName === possibleName)))
        || (state.chats && Object.values(state.chats).some(c => c.name === possibleName || c.settings?.remarkName === possibleName));

      if (isKnownTarget && remainder) {
        targetName = possibleName;
        stBody = remainder;
      } else if (parts.length > 1 && !/^[a-zA-Z\u4e00-\u9fa5]+[\+\-\=:]?\d+/.test(possibleName) && !COC_KEY_MAP[possibleName.toLowerCase()]) {
        targetName = possibleName;
        stBody = remainder;
      } else {
        stBody = restContent;
      }
    } else if (attachedTarget && !restContent) {
      stBody = attachedTarget;
    }

    if (stBody) {
      const target = resolveTarget(targetName);
      const userCoc = target.cocPanel || { stats: {}, skills: {}, calculated: {} };

      // 正则匹配所有属性名与运算符数值（支持多个项目连续匹配）
      const regex = /([a-zA-Z\u4e00-\u9fa5]+)\s*([\+\-\=:])?\s*(\d+)/g;
      let match;
      const changes = [];

      if (!userCoc.stats) userCoc.stats = {};
      if (!userCoc.calculated) userCoc.calculated = {};
      if (!userCoc.skills) userCoc.skills = {};

      let statsChanged = false;

      while ((match = regex.exec(stBody)) !== null) {
        const key = match[1].trim();
        const op = match[2] || "=";
        const val = parseInt(match[3], 10) || 0;

        const lowerKey = key.toLowerCase();
        const mappedKey = COC_KEY_MAP[lowerKey] || COC_KEY_MAP[key];

        if (mappedKey) {
          if (["hp", "mp", "san", "armor"].includes(mappedKey)) {
            const cur = (userCoc.calculated && typeof userCoc.calculated[mappedKey] !== "undefined")
              ? parseInt(userCoc.calculated[mappedKey], 10)
              : (mappedKey === "san" ? (userCoc.stats.pow || 50) : (mappedKey === "armor" ? 0 : 10));
            let newVal = cur;
            if (op === "+") newVal = cur + val;
            else if (op === "-") newVal = cur - val;
            else newVal = val;
            userCoc.calculated[mappedKey] = Math.max(0, newVal);
            const label = mappedKey === "armor" ? "护甲" : key.toUpperCase();
            changes.push(`${label}: ${userCoc.calculated[mappedKey]}`);
          } else {
            const cur = parseInt(userCoc.stats[mappedKey], 10) || 50;
            let newVal = cur;
            if (op === "+") newVal = cur + val;
            else if (op === "-") newVal = cur - val;
            else newVal = val;
            userCoc.stats[mappedKey] = Math.max(0, newVal);
            statsChanged = true;
            changes.push(`${key}: ${userCoc.stats[mappedKey]}`);
          }
        } else {
          const cur = parseInt(userCoc.skills[key], 10) || (typeof getSkillBaseValue === "function" ? getSkillBaseValue(key, userCoc.stats) : 0);
          let newVal = cur;
          if (op === "+") newVal = cur + val;
          else if (op === "-") newVal = cur - val;
          else newVal = val;
          userCoc.skills[key] = Math.max(0, newVal);
          changes.push(`${key}: ${userCoc.skills[key]}`);
        }
      }

      if (statsChanged && typeof calculateCocStats === "function") {
        userCoc.calculated = calculateCocStats(userCoc.stats, userCoc.calculated);
      }

      if (changes.length > 0) {
        if (!(isKeeperRole && !target.isProxy)) {
          if (typeof target.onSave === "function") {
            target.onSave(userCoc);
          }
        }
        if (typeof window.syncCombatantStatsFromCoc === "function") {
          window.syncCombatantStatsFromCoc(chat, target.id, target.name, userCoc);
        }
        const text = `${target.name} 修改属性成功：${changes.join(" | ")}`;
        return { handled: true, text, persistChat: true };
      }
    }
  }

  // 4. 理智检定 .sc [角色名] 成功/失败 或 .sc角色名 成功/失败
  const scMatch = cmdLine.match(/^sc(?:([^\s\d\/]+))?(?:\s+(.+))?$/i);
  if (scMatch) {
    let attachedTarget = scMatch[1] ? scMatch[1].trim() : "";
    let restSc = scMatch[2] ? scMatch[2].trim() : "";
    let targetName = null;
    let scExpr = "";

    if (attachedTarget && restSc) {
      targetName = attachedTarget;
      scExpr = restSc;
    } else if (!attachedTarget && restSc) {
      const parts = restSc.split(/\s+/);
      if (parts.length >= 2 && parts[1].includes("/")) {
        targetName = parts[0];
        scExpr = parts[1];
      } else {
        scExpr = restSc;
      }
    } else if (attachedTarget && !restSc) {
      scExpr = attachedTarget;
    }

    const slashMatch = scExpr.match(/^([^\/]+)\/([^\s]+)/);
    if (slashMatch) {
      const target = resolveTarget(targetName);
      const userCoc = target.cocPanel || { stats: {}, skills: {}, calculated: {} };

      const succExpr = slashMatch[1].trim();
      const failExpr = slashMatch[2].trim();

      const currentSan = (userCoc.calculated && typeof userCoc.calculated.san === "number")
        ? userCoc.calculated.san
        : (userCoc.stats?.pow || 50);

      const rollVal = Math.floor(Math.random() * 100) + 1;
      let isSuccess = rollVal <= currentSan;
      let level = isSuccess ? (rollVal <= Math.floor(currentSan / 5) ? "极难成功" : (rollVal <= Math.floor(currentSan / 2) ? "困难成功" : "常规成功")) : "失败";
      if (rollVal === 1) level = "大成功";
      if (rollVal === 100 || (currentSan >= 50 && rollVal >= 96)) level = "大失败";

      const lossExpr = isSuccess ? succExpr : failExpr;
      const lossResult = rollDiceExpression(lossExpr);
      const lossNum = Math.max(0, lossResult.total);

      const newSan = Math.max(0, currentSan - lossNum);

      if (!userCoc.calculated) userCoc.calculated = {};
      userCoc.calculated.san = newSan;

      if (!(isKeeperRole && !target.isProxy)) {
        if (typeof target.onSave === "function") {
          target.onSave(userCoc);
        }
      }

      const text = formatDiceTemplate(templates.sc || DEFAULT_DICE_TEMPLATES.sc, {
        角色名: target.name,
        结果: rollVal,
        SAN: currentSan,
        成功等级: level,
        旧SAN: currentSan,
        新SAN: newSan
      });

      return { handled: true, text, persistChat: true };
    }
  }

  // 5. HP 调整指令 .hp [角色名] -3 或 .hp角色名 -3
  const hpMatch = cmdLine.match(/^hp(?:([^\s\d\+\-]+))?(?:\s+([^\s]+))?$/i);
  if (hpMatch) {
    let attachedTarget = hpMatch[1] ? hpMatch[1].trim() : "";
    let restHp = hpMatch[2] ? hpMatch[2].trim() : "";
    let targetName = null;
    let deltaStr = "";

    if (attachedTarget && restHp) {
      targetName = attachedTarget;
      deltaStr = restHp;
    } else if (!attachedTarget && restHp) {
      const parts = restHp.split(/\s+/);
      if (parts.length >= 2 && /^[+-]\d+/.test(parts[1])) {
        targetName = parts[0];
        deltaStr = parts[1];
      } else {
        deltaStr = restHp;
      }
    } else if (attachedTarget && !restHp) {
      deltaStr = attachedTarget;
    }

    const numMatch = deltaStr.match(/^([+-]\d+)/);
    if (numMatch) {
      const target = resolveTarget(targetName);
      const userCoc = target.cocPanel || { stats: {}, skills: {}, calculated: {} };

      const delta = parseInt(numMatch[1], 10);
      const currentHp = (userCoc.calculated && typeof userCoc.calculated.hp === "number") ? userCoc.calculated.hp : 10;
      const maxHp = (userCoc.calculated && typeof userCoc.calculated.maxHp === "number") ? userCoc.calculated.maxHp : 10;
      const newHp = Math.max(0, Math.min(maxHp, currentHp + delta));

      if (!userCoc.calculated) userCoc.calculated = {};
      userCoc.calculated.hp = newHp;

      if (!(isKeeperRole && !target.isProxy)) {
        if (typeof target.onSave === "function") {
          target.onSave(userCoc);
        }
      }
      if (typeof window.syncCombatantStatsFromCoc === "function") {
        window.syncCombatantStatsFromCoc(chat, target.id, target.name, userCoc);
      }

      const text = formatDiceTemplate(templates.hp || DEFAULT_DICE_TEMPLATES.hp, {
        角色名: target.name,
        旧HP: currentHp,
        新HP: newHp
      });
      return { handled: true, text, persistChat: true };
    }
  }

  // 6. 成长检定 .en [角色名] 技能名 或 .en角色名 技能名
  const enMatch = cmdLine.match(/^en(?:([^\s]+))?(?:\s+(.+))?$/i);
  if (enMatch) {
    let attachedTarget = enMatch[1] ? enMatch[1].trim() : "";
    let restSkill = enMatch[2] ? enMatch[2].trim() : "";
    let targetName = null;
    let skillName = "";

    if (attachedTarget && restSkill) {
      targetName = attachedTarget;
      skillName = restSkill;
    } else if (!attachedTarget && restSkill) {
      const parts = restSkill.split(/\s+/);
      if (parts.length >= 2) {
        targetName = parts[0];
        skillName = parts[1];
      } else {
        skillName = restSkill;
      }
    } else if (attachedTarget && !restSkill) {
      skillName = attachedTarget;
    }

    if (skillName) {
      const target = resolveTarget(targetName);
      const userCoc = target.cocPanel || { stats: {}, skills: {}, calculated: {} };

      let currentVal = (userCoc.skills && typeof userCoc.skills[skillName] !== "undefined")
        ? parseInt(userCoc.skills[skillName], 10)
        : (typeof getSkillBaseValue === "function" ? getSkillBaseValue(skillName, userCoc.stats) : 50);

      const rollVal = Math.floor(Math.random() * 100) + 1;
      let growthNum = 0;
      if (rollVal > currentVal || rollVal > 95) {
        growthNum = Math.floor(Math.random() * 10) + 1;
        const newVal = currentVal + growthNum;
        if (!userCoc.skills) userCoc.skills = {};
        userCoc.skills[skillName] = newVal;

        if (!(isKeeperRole && !target.isProxy)) {
          if (typeof target.onSave === "function") {
            target.onSave(userCoc);
          }
        }

        const text = `${target.name} 进行 ${skillName} 成长检定：D100=${rollVal}/${currentVal} 成功 技能增加 ${growthNum} 点 当前为 ${newVal}`;
        return { handled: true, text, persistChat: true };
      } else {
        const text = `${target.name} 进行 ${skillName} 成长检定：D100=${rollVal}/${currentVal} 失败 未能成长`;
        return { handled: true, text };
      }
    }
  }

  // 7. 短期疯狂发作 .ti [角色名] 或 .ti角色名
  const tiMatch = cmdLine.match(/^ti(?:([^\s]+))?(?:\s+(.+))?$/i);
  if (tiMatch) {
    const rawT = tiMatch[1] || tiMatch[2] || null;
    const target = resolveTarget(rawT);
    const randIdx = Math.floor(Math.random() * COC_SHORT_TERM_INSANITY.length);
    const symptom = COC_SHORT_TERM_INSANITY[randIdx];
    const text = formatDiceTemplate(templates.ti || DEFAULT_DICE_TEMPLATES.ti, {
      角色名: target.name,
      疯狂症状: symptom
    });
    return { handled: true, text };
  }

  // 8. 属性生成 .coc 与 .coc5 (支持指定登记目标)
  const cocMatch = cmdLine.match(/^coc(5)?(?:([^\s\d]+))?(?:\s+(.+))?$/i);
  if (cocMatch) {
    const isFive = cocMatch[1] === "5";
    const explicitTarget = cocMatch[2] || cocMatch[3] || null;
    const target = resolveTarget(explicitTarget);

    const getCalcSummary = (str, con, pow, siz) => {
      const hp = Math.floor((con + siz) / 10);
      const sum = str + siz;
      let db = "0";
      if (sum < 65) db = "-2";
      else if (sum <= 84) db = "-1";
      else if (sum <= 124) db = "0";
      else if (sum <= 164) db = "+1D4";
      else if (sum <= 204) db = "+1D6";
      else if (sum <= 284) db = "+2D6";
      else if (sum <= 364) db = "+3D6";
      else db = "+4D6";
      return { hp, db };
    };

    const renderAttrItem = (lbl, val) => `
      <div style="display: flex; align-items: center; white-space: nowrap; font-size: 11px; gap: 1px;">
        <span style="font-weight: 600; color: var(--text-secondary); display: inline-block;">${lbl}</span>
        <span style="color: var(--text-secondary);">:</span>
        <span style="color: var(--text-secondary); opacity: 0.85; font-weight: 600; font-size: 11px; display: inline-block; padding-left: 1px;">${val}</span>
      </div>
    `;

    if (!isFive) {
      const attrs = generateCoc7Attributes();
      const calc = getCalcSummary(attrs.str, attrs.con, attrs.pow, attrs.siz);
      const dataStr = encodeURIComponent(JSON.stringify(attrs));

      const cardHtml = `
        <div class="coc-gen-result-card" style="font-size: 11px; line-height: 1.5; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; margin-top: 4px; overflow: hidden;">
          <div class="coc-card-header" style="padding: 6px 10px; font-weight: 600; color: var(--text-primary); font-size: 12px; background: var(--secondary-bg); border-bottom: 1px solid var(--border-color);">COC7 七版人物属性 (${target.name})</div>
          <div style="padding: 8px 10px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px 8px; font-size: 11px; color: var(--text-secondary);">
              ${renderAttrItem("力量", attrs.str)}
              ${renderAttrItem("敏捷", attrs.dex)}
              ${renderAttrItem("体质", attrs.con)}
              ${renderAttrItem("意志", attrs.pow)}
              ${renderAttrItem("体型", attrs.siz)}
              ${renderAttrItem("教育", attrs.edu)}
              ${renderAttrItem("外貌", attrs.app)}
              ${renderAttrItem("智力", attrs.int)}
              ${renderAttrItem("幸运", attrs.luk)}
            </div>
            <div style="display: flex; align-items: center; gap: 14px; font-size: 11px; margin-top: 6px; color: var(--text-secondary);">
              <div style="display: flex; align-items: center; white-space: nowrap; gap: 1px;">
                <span style="font-weight: 600; color: var(--text-secondary);">HP</span>
                <span style="color: var(--text-secondary);">:</span>
                <span style="color: var(--text-secondary); opacity: 0.85; font-weight: 600; font-size: 11px; padding-left: 1px;">${calc.hp}</span>
              </div>
              <div style="display: flex; align-items: center; white-space: nowrap; gap: 1px;">
                <span style="font-weight: 600; color: var(--text-secondary);">DB</span>
                <span style="color: var(--text-secondary);">:</span>
                <span style="color: var(--text-secondary); opacity: 0.85; font-weight: 600; font-size: 11px; padding-left: 1px;">${calc.db}</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px;">
              <div style="font-size: 10px; color: var(--text-secondary);">合计:${attrs.total} 含幸运:${attrs.totalWithLuk}</div>
              <button type="button" class="moe-btn-compact coc-apply-attrs-btn" data-target-id="${target.id || ''}" data-target-name="${target.name || ''}" data-attrs="${dataStr}" style="padding: 2px 10px; font-size: 10px; border-radius: 10px; background: var(--secondary-bg); border: 1px solid var(--border-color); cursor: pointer; color: var(--accent-color); font-weight: 600;">选择</button>
            </div>
          </div>
        </div>
      `;
      const text = `${target.name} 生成了一组 COC7 属性`;
      return { handled: true, text, html: cardHtml };
    } else {
      let listHtml = "";

      for (let i = 1; i <= 5; i++) {
        const a = generateCoc7Attributes();
        const calc = getCalcSummary(a.str, a.con, a.pow, a.siz);
        const dataStr = encodeURIComponent(JSON.stringify(a));
        listHtml += `
          <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 6px; overflow: hidden;">
            <div class="coc-card-header" style="padding: 4px 8px; font-size: 11px; font-weight: 600; color: var(--text-primary); background: var(--secondary-bg); border-bottom: 1px solid var(--border-color);">方案 ${i}</div>
            <div style="padding: 6px 8px;">
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 6px; font-size: 11px; color: var(--text-secondary);">
                ${renderAttrItem("力量", a.str)}
                ${renderAttrItem("敏捷", a.dex)}
                ${renderAttrItem("体质", a.con)}
                ${renderAttrItem("意志", a.pow)}
                ${renderAttrItem("体型", a.siz)}
                ${renderAttrItem("教育", a.edu)}
                ${renderAttrItem("外貌", a.app)}
                ${renderAttrItem("智力", a.int)}
                ${renderAttrItem("幸运", a.luk)}
              </div>
              <div style="display: flex; align-items: center; gap: 10px; font-size: 10px; margin-top: 4px; color: var(--text-secondary);">
                <div style="display: flex; align-items: center; white-space: nowrap; gap: 1px;">
                  <span style="font-weight: 600; color: var(--text-secondary);">HP</span>
                  <span style="color: var(--text-secondary);">:</span>
                  <span style="color: var(--text-secondary); opacity: 0.85; font-weight: 600; font-size: 11px; padding-left: 1px;">${calc.hp}</span>
                </div>
                <div style="display: flex; align-items: center; white-space: nowrap; gap: 1px;">
                  <span style="font-weight: 600; color: var(--text-secondary);">DB</span>
                  <span style="color: var(--text-secondary);">:</span>
                  <span style="color: var(--text-secondary); opacity: 0.85; font-weight: 600; font-size: 11px; padding-left: 1px;">${calc.db}</span>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4px;">
                <div style="font-size: 10px; color: var(--text-secondary);">合计:${a.total} 含运:${a.totalWithLuk}</div>
                <button type="button" class="moe-btn-compact coc-apply-attrs-btn" data-target-id="${target.id || ''}" data-target-name="${target.name || ''}" data-attrs="${dataStr}" style="padding: 1px 10px; font-size: 10px; border-radius: 10px; background: var(--secondary-bg); border: 1px solid var(--border-color); cursor: pointer; color: var(--accent-color); font-weight: 600;">选择</button>
              </div>
            </div>
          </div>
        `;
      }

      const fullHtml = `
        <div class="coc-gen-multi-card" style="font-size: 11px; line-height: 1.5; padding: 8px 10px; background: var(--secondary-bg); border: 1px solid var(--border-color); border-radius: 8px; margin-top: 4px;">
          <div class="coc-card-header" style="font-weight: 600; margin-bottom: 6px; color: var(--text-primary); font-size: 12px;">COC7 七版人物属性生成 5组 (${target.name})</div>
          ${listHtml}
        </div>
      `;
      const text = `${target.name} 生成了 5 组 COC7 属性`;
      return { handled: true, text, html: fullHtml };
    }
  }

  return null;
};

// 监听气泡中选择并导入属性卡按钮（精确写回目标角色面板）
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".coc-apply-attrs-btn");
  if (!btn) return;
  const rawStr = btn.dataset.attrs;
  if (!rawStr) return;

  const targetId = btn.dataset.targetId;
  const targetName = btn.dataset.targetName;

  try {
    const a = JSON.parse(decodeURIComponent(rawStr));
    if (!state.activeChatId) return;
    const chat = state.chats[state.activeChatId];
    if (!chat) return;

    let appliedTargetName = "我";

    if (chat.isGroup && Array.isArray(chat.members) && targetId && targetId !== "user") {
      const member = chat.members.find(m => m.id === targetId || m.groupNickname === targetName || m.originalName === targetName);
      if (member) {
        if (!member.cocPanel) member.cocPanel = (typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} });
        member.cocPanel.stats = {
          str: a.str, dex: a.dex, con: a.con, pow: a.pow, siz: a.siz, edu: a.edu, app: a.app, int: a.int, luk: a.luk
        };
        if (typeof calculateCocStats === "function") {
          member.cocPanel.calculated = calculateCocStats(member.cocPanel.stats, member.cocPanel.calculated);
        }
        if (!member.cocPanel.skills) member.cocPanel.skills = {};
        member.cocPanel.skills["闪避"] = Math.floor(a.dex / 2);

        if (state.chats && state.chats[member.id]) {
          if (!state.chats[member.id].settings) state.chats[member.id].settings = {};
          state.chats[member.id].settings.aiCocPanel = member.cocPanel;
          await db.chats.put(state.chats[member.id]);
        }
        appliedTargetName = member.groupNickname || member.originalName;
      }
    } else if (!chat.isGroup && targetId && targetId !== "user" && targetId === chat.id) {
      if (!chat.settings) chat.settings = {};
      if (!chat.settings.aiCocPanel) chat.settings.aiCocPanel = (typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} });
      chat.settings.aiCocPanel.stats = {
        str: a.str, dex: a.dex, con: a.con, pow: a.pow, siz: a.siz, edu: a.edu, app: a.app, int: a.int, luk: a.luk
      };
      if (typeof calculateCocStats === "function") {
        chat.settings.aiCocPanel.calculated = calculateCocStats(chat.settings.aiCocPanel.stats, chat.settings.aiCocPanel.calculated);
      }
      if (!chat.settings.aiCocPanel.skills) chat.settings.aiCocPanel.skills = {};
      chat.settings.aiCocPanel.skills["闪避"] = Math.floor(a.dex / 2);
      if (window.aiCocPanel) window.aiCocPanel.setData(chat.settings.aiCocPanel);
      appliedTargetName = chat.settings?.remarkName || chat.name;
    } else {
      if (!chat.settings) chat.settings = {};
      if (!chat.settings.myCocPanel) {
        chat.settings.myCocPanel = (typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} });
      }

      chat.settings.myCocPanel.stats = {
        str: a.str, dex: a.dex, con: a.con, pow: a.pow, siz: a.siz, edu: a.edu, app: a.app, int: a.int, luk: a.luk
      };

      if (typeof calculateCocStats === "function") {
        chat.settings.myCocPanel.calculated = calculateCocStats(chat.settings.myCocPanel.stats, chat.settings.myCocPanel.calculated);
      }

      if (!chat.settings.myCocPanel.skills) chat.settings.myCocPanel.skills = {};
      chat.settings.myCocPanel.skills["闪避"] = Math.floor(a.dex / 2);

      if (window.myCocPanel) {
        window.myCocPanel.setData(chat.settings.myCocPanel);
      }
      appliedTargetName = chat.settings?.myName || chat.settings?.myNickname || "我";
    }

    state.chats[state.activeChatId] = chat;
    await db.chats.put(chat);
    const msg = `已导入 ${appliedTargetName} 的面板`;
    if (typeof window.showCustomAlert === "function") {
      await window.showCustomAlert("提示", msg);
    } else {
      alert(msg);
    }
  } catch (err) {
    console.error("导入COC属性失败:", err);
  }
});

// ===================================================================
// UI 渲染：法则界面（规则、指令、天气池）
// ===================================================================

let currentCmdTab = "rules"; // "rules", "commands" 或 "weather"
let currentEditingRuleModuleId = null;

window.renderDiceCommandCenter = function() {
  const container = document.getElementById("studio-content-area");
  if (!container) return;

  const titleEl = document.getElementById("studio-main-title");
  if (titleEl) titleEl.textContent = "法则";

  const tabRulesBtn = document.getElementById("cmd-tab-rules");
  const tabCmdBtn = document.getElementById("cmd-tab-commands");
  const tabWeatherBtn = document.getElementById("cmd-tab-weather");

  [tabRulesBtn, tabCmdBtn, tabWeatherBtn].forEach(btn => {
    if (btn) {
      btn.style.fontWeight = "normal";
      btn.style.color = "var(--text-secondary)";
    }
  });

  if (currentCmdTab === "rules" && tabRulesBtn) {
    tabRulesBtn.style.fontWeight = "bold";
    tabRulesBtn.style.color = "var(--accent-color)";
  } else if (currentCmdTab === "commands" && tabCmdBtn) {
    tabCmdBtn.style.fontWeight = "bold";
    tabCmdBtn.style.color = "var(--accent-color)";
  } else if (currentCmdTab === "weather" && tabWeatherBtn) {
    tabWeatherBtn.style.fontWeight = "bold";
    tabWeatherBtn.style.color = "var(--accent-color)";
  }

  if (currentCmdTab === "rules") {
    renderRulesTab(container);
  } else if (currentCmdTab === "commands") {
    renderCommandsTab(container);
  } else {
    renderWeatherTab(container);
  }
};

function renderRulesTab(container) {
  const presets = window.getStoredRuleSystemPresets();
  const activePresetId = window.getActiveRulePresetId();
  let currentPreset = presets.find(p => p.id === activePresetId) || presets[0];

  if (!currentPreset) {
    currentPreset = DEFAULT_RULE_SYSTEM_PRESETS[0];
    presets.push(currentPreset);
    window.saveStoredRuleSystemPresets(presets);
  }

  if (currentEditingRuleModuleId) {
    renderRuleModuleEditor(container, currentPreset, presets);
    return;
  }

  let presetOptionsHtml = presets.map(p => `<option value="${p.id}" ${p.id === currentPreset.id ? "selected" : ""}>${p.name}</option>`).join("");

  let modulesHtml = "";
  if (currentPreset.modules && currentPreset.modules.length > 0) {
    modulesHtml = currentPreset.modules.map(mod => {
      const previewText = mod.prompt ? mod.prompt.replace(/</g, "&lt;") : "暂无提示词，点击编辑";
      return `
        <div class="list-item rule-module-item" data-module-id="${mod.id}" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; margin-bottom: 8px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; box-sizing: border-box;">
          <div style="flex: 1; min-width: 0; padding-right: 8px;">
            <div style="font-weight: 600; font-size: 13px; color: var(--text-primary); margin-bottom: 4px;">${mod.name}</div>
            <div style="font-size: 11px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${previewText}</div>
          </div>
          <span style="color: var(--text-secondary); font-size: 14px; flex-shrink: 0;">›</span>
        </div>
      `;
    }).join("");
  } else {
    modulesHtml = `
      <div style="text-align: center; padding: 30px 10px; color: var(--text-secondary); font-size: 12px;">
        暂无条例，点击下方新增
      </div>
    `;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; width: 100%; box-sizing: border-box;">
      <select id="rule-preset-select" class="moe-input" style="width: 100%; box-sizing: border-box; height: 32px; font-size: 12px; padding: 4px 8px; border-radius: 8px; background: var(--card-bg); color: var(--text-primary); border: 1px solid var(--border-color); display: block;">
        ${presetOptionsHtml}
      </select>
      <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
        <button type="button" id="rule-new-preset-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 10px; font-size: 11px;">新增</button>
        <button type="button" id="rule-rename-preset-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 10px; font-size: 11px;">改名</button>
        <button type="button" id="rule-del-preset-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 10px; font-size: 11px; color: var(--tukey-accent-red, #ff4d4f);">删除</button>
      </div>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 0 2px;">
      <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">条例</span>
      <button type="button" id="rule-add-module-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 10px; font-size: 11px;">+ 新增</button>
    </div>
    <div id="rule-modules-list-container">
      ${modulesHtml}
    </div>
  `;

  // 绑定预设切换
  const rulePresetSelect = document.getElementById("rule-preset-select");
  if (rulePresetSelect) {
    rulePresetSelect.onchange = (e) => {
      window.setActiveRulePresetId(e.target.value);
      renderRulesTab(container);
    };
  }

  // 新增预设
  const newPresetBtn = document.getElementById("rule-new-preset-btn");
  if (newPresetBtn) {
    newPresetBtn.onclick = async () => {
      let name = null;
      if (typeof window.showCustomPrompt === "function") {
        name = await window.showCustomPrompt("新增预设", "请输入规则名称", "新规则");
      } else {
        name = prompt("请输入规则名称:");
      }
      if (!name || !name.trim()) return;
      const newId = "rule_" + Date.now();
      const newPreset = {
        id: newId,
        name: name.trim(),
        modules: []
      };
      presets.push(newPreset);
      window.saveStoredRuleSystemPresets(presets);
      window.setActiveRulePresetId(newId);
      renderRulesTab(container);
    };
  }

  // 重命名预设
  const renamePresetBtn = document.getElementById("rule-rename-preset-btn");
  if (renamePresetBtn) {
    renamePresetBtn.onclick = async () => {
      let newName = null;
      if (typeof window.showCustomPrompt === "function") {
        newName = await window.showCustomPrompt("改名", "请输入规则新名称", currentPreset.name);
      } else {
        newName = prompt("请输入规则新名称:", currentPreset.name);
      }
      if (!newName || !newName.trim()) return;
      currentPreset.name = newName.trim();
      window.saveStoredRuleSystemPresets(presets);
      renderRulesTab(container);
    };
  }

  // 删除预设
  const delPresetBtn = document.getElementById("rule-del-preset-btn");
  if (delPresetBtn) {
    delPresetBtn.onclick = async () => {
      if (presets.length <= 1) {
        if (typeof window.showCustomAlert === "function") {
          await window.showCustomAlert("提示", "至少保留一个规则预设");
        } else {
          alert("至少保留一个规则预设");
        }
        return;
      }
      let confirmed = false;
      if (typeof window.showCustomConfirm === "function") {
        confirmed = await window.showCustomConfirm("删除预设", `确定要删除规则预设《${currentPreset.name}》吗？`, { confirmButtonClass: "btn-danger" });
      } else {
        confirmed = confirm(`确定要删除规则预设《${currentPreset.name}》吗？`);
      }
      if (!confirmed) return;
      const idx = presets.findIndex(p => p.id === currentPreset.id);
      if (idx !== -1) {
        presets.splice(idx, 1);
        window.saveStoredRuleSystemPresets(presets);
        window.setActiveRulePresetId(presets[0].id);
        renderRulesTab(container);
      }
    };
  }

  // 新增条例
  const addModBtn = document.getElementById("rule-add-module-btn");
  if (addModBtn) {
    addModBtn.onclick = async () => {
      let name = null;
      if (typeof window.showCustomPrompt === "function") {
        name = await window.showCustomPrompt("新增条例", "请输入条例名称", "新条例");
      } else {
        name = prompt("请输入条例名称:");
      }
      if (!name || !name.trim()) return;
      const newModule = {
        id: "mod_" + Date.now(),
        name: name.trim(),
        prompt: ""
      };
      if (!currentPreset.modules) currentPreset.modules = [];
      currentPreset.modules.push(newModule);
      window.saveStoredRuleSystemPresets(presets);
      currentEditingRuleModuleId = newModule.id;
      renderRulesTab(container);
    };
  }

  // 点击条例项进入详情编辑
  container.querySelectorAll(".rule-module-item").forEach(item => {
    item.onclick = () => {
      currentEditingRuleModuleId = item.dataset.moduleId;
      renderRulesTab(container);
    };
  });
}

function renderRuleModuleEditor(container, currentPreset, presets) {
  const mod = currentPreset.modules.find(m => m.id === currentEditingRuleModuleId);
  if (!mod) {
    currentEditingRuleModuleId = null;
    renderRulesTab(container);
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
        <button type="button" id="rule-module-back-btn" class="moe-btn-mini" style="height: 28px; padding: 2px 10px; font-size: 12px; display: inline-flex; align-items: center;">‹ 返回</button>
        <span style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${mod.name}</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button type="button" id="rule-module-del-btn" class="moe-btn-mini" style="height: 28px; padding: 2px 8px; font-size: 11px; color: var(--tukey-accent-red, #ff4d4f);">删除</button>
          <button type="button" id="rule-module-save-btn" class="moe-btn-mini" style="height: 28px; padding: 2px 10px; font-size: 11px; background: var(--accent-color); color: #fff;">保存</button>
        </div>
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label style="font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; display: block;">条例名称</label>
        <input type="text" id="rule-module-name-input" class="moe-input" value="${mod.name.replace(/"/g, "&quot;")}" style="width: 100%; height: 32px; box-sizing: border-box; font-size: 12px; border-radius: 8px;">
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label style="font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; display: block;">提示词</label>
        <textarea id="rule-module-prompt-input" class="moe-input" placeholder="在此处填写提示词..." style="width: 100%; height: 280px; box-sizing: border-box; font-size: 12px; line-height: 1.6; border-radius: 8px; resize: vertical;">${mod.prompt || ""}</textarea>
      </div>
    </div>
  `;

  // 返回按钮
  document.getElementById("rule-module-back-btn").onclick = () => {
    currentEditingRuleModuleId = null;
    renderRulesTab(container);
  };

  // 删除按钮
  document.getElementById("rule-module-del-btn").onclick = async () => {
    let confirmed = false;
    if (typeof window.showCustomConfirm === "function") {
      confirmed = await window.showCustomConfirm("删除条例", `确定要删除条例《${mod.name}》吗？`, { confirmButtonClass: "btn-danger" });
    } else {
      confirmed = confirm(`确定要删除条例《${mod.name}》吗？`);
    }
    if (!confirmed) return;
    currentPreset.modules = currentPreset.modules.filter(m => m.id !== mod.id);
    window.saveStoredRuleSystemPresets(presets);
    currentEditingRuleModuleId = null;
    renderRulesTab(container);
  };

  // 保存按钮
  document.getElementById("rule-module-save-btn").onclick = async () => {
    const nameInput = document.getElementById("rule-module-name-input");
    const promptInput = document.getElementById("rule-module-prompt-input");
    const newName = nameInput ? nameInput.value.trim() : "";
    if (newName) mod.name = newName;
    mod.prompt = promptInput ? promptInput.value : "";
    window.saveStoredRuleSystemPresets(presets);
    currentEditingRuleModuleId = null;
    renderRulesTab(container);
  };
}

function renderCommandsTab(container) {
  const presets = getStoredDicePresets();
  const activePreset = getActiveDicePreset();
  const currentTemplates = { ...DEFAULT_DICE_TEMPLATES, ...(activePreset.templates || {}) };

  let presetOptionsHtml = presets.map(p => `<option value="${p.id}" ${p.id === activePreset.id ? "selected" : ""}>${p.name}</option>`).join("");

  let cardsHtml = COC7_RULEBOOK_COMMAND_DOCS.map(doc => {
    const val = currentTemplates[doc.key] || DEFAULT_DICE_TEMPLATES[doc.key] || "";
    return `
      <div class="moe-card" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px; margin-bottom: 12px; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${doc.name}</span>
          <span style="font-size: 11px; background: var(--secondary-bg); color: var(--accent-color); padding: 2px 6px; border-radius: 4px; font-weight: 600;">${doc.syntax}</span>
        </div>
        <div style="font-size: 11px; line-height: 1.5; color: var(--text-secondary); background: var(--secondary-bg); border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; white-space: pre-wrap;">${doc.desc}</div>
        <div class="form-group" style="margin-bottom: 0;">
          <label style="font-size: 11px; color: var(--text-primary); font-weight: 600; margin-bottom: 3px; display: block;">播报文本</label>
          <input type="text" class="moe-input cmd-template-input" data-key="${doc.key}" value="${val.replace(/"/g, "&quot;")}" style="width: 100%; box-sizing: border-box; font-size: 12px; padding: 4px 6px;">
          <div style="font-size: 10px; color: var(--text-secondary); margin-top: 3px;">支持占位符: ${doc.vars}</div>
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; width: 100%; box-sizing: border-box;">
      <select id="cmd-preset-select" class="moe-input" style="width: 100%; box-sizing: border-box; height: 32px; font-size: 12px; padding: 4px 8px; border-radius: 8px; background: var(--card-bg); color: var(--text-primary); border: 1px solid var(--border-color); display: block;">
        ${presetOptionsHtml}
      </select>
      <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
        <button type="button" id="cmd-new-preset-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 10px; font-size: 11px;">新建</button>
        <button type="button" id="cmd-saveas-preset-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 10px; font-size: 11px;">另存</button>
        <button type="button" id="cmd-save-preset-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 10px; font-size: 11px;">保存</button>
        <button type="button" id="cmd-del-preset-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 10px; font-size: 11px; color: var(--tukey-accent-red, #ff4d4f);">删除</button>
      </div>
    </div>
    <div id="cmd-cards-container">
      ${cardsHtml}
    </div>
  `;

  document.getElementById("cmd-preset-select").onchange = (e) => {
    localStorage.setItem("coc_active_dice_preset_id", e.target.value);
    renderCommandsTab(container);
  };

  document.getElementById("cmd-save-preset-btn").onclick = async () => {
    const inputs = container.querySelectorAll(".cmd-template-input");
    inputs.forEach(input => {
      const k = input.dataset.key;
      activePreset.templates[k] = input.value.trim();
    });
    saveStoredDicePresets(presets);
    const saveBtn = document.getElementById("cmd-save-preset-btn");
    saveBtn.textContent = "已保存";
    setTimeout(() => { saveBtn.textContent = "保存"; }, 1000);
  };

  document.getElementById("cmd-new-preset-btn").onclick = async () => {
    let name = null;
    if (typeof window.showCustomPrompt === "function") {
      name = await window.showCustomPrompt("新建预设", "请输入预设方案名称", "新播报方案");
    } else {
      name = prompt("请输入预设方案名称:");
    }
    if (!name || !name.trim()) return;
    const newId = "preset_" + Date.now();
    const newPreset = {
      id: newId,
      name: name.trim(),
      templates: { ...DEFAULT_DICE_TEMPLATES }
    };
    presets.push(newPreset);
    saveStoredDicePresets(presets);
    localStorage.setItem("coc_active_dice_preset_id", newId);
    renderCommandsTab(container);
  };

  document.getElementById("cmd-saveas-preset-btn").onclick = async () => {
    let name = null;
    if (typeof window.showCustomPrompt === "function") {
      name = await window.showCustomPrompt("另存为预设", "请输入新方案名称", activePreset.name + " 副本");
    } else {
      name = prompt("请输入新方案名称:");
    }
    if (!name || !name.trim()) return;
    const newId = "preset_" + Date.now();
    const curTemplates = {};
    container.querySelectorAll(".cmd-template-input").forEach(inp => {
      curTemplates[inp.dataset.key] = inp.value.trim();
    });
    const newPreset = {
      id: newId,
      name: name.trim(),
      templates: curTemplates
    };
    presets.push(newPreset);
    saveStoredDicePresets(presets);
    localStorage.setItem("coc_active_dice_preset_id", newId);
    renderCommandsTab(container);
  };

  document.getElementById("cmd-del-preset-btn").onclick = async () => {
    if (presets.length <= 1) {
      if (typeof window.showCustomAlert === "function") {
        await window.showCustomAlert("提示", "必须保留至少一个预设方案");
      } else {
        alert("必须保留至少一个预设方案");
      }
      return;
    }
    let confirmed = false;
    if (typeof window.showCustomConfirm === "function") {
      confirmed = await window.showCustomConfirm("确认删除", `确定要删除预设【${activePreset.name}】吗？`);
    } else {
      confirmed = confirm(`确定要删除预设【${activePreset.name}】吗？`);
    }
    if (!confirmed) return;

    const idx = presets.findIndex(p => p.id === activePreset.id);
    if (idx !== -1) {
      presets.splice(idx, 1);
      saveStoredDicePresets(presets);
      localStorage.setItem("coc_active_dice_preset_id", presets[0].id);
      renderCommandsTab(container);
    }
  };
}

let activeWeatherSeason = "春季";

function renderWeatherTab(container) {
  const pools = getStoredWeatherPools();
  const activePool = getActiveWeatherPool();
  normalizeWeatherPool(activePool);

  const seasonsList = ["春季", "夏季", "秋季", "冬季"];
  if (!seasonsList.includes(activeWeatherSeason)) {
    activeWeatherSeason = "春季";
  }

  const currentSeasonItems = activePool.seasons[activeWeatherSeason] || [];

  let poolOptionsHtml = pools.map(p => `<option value="${p.id}" ${p.id === activePool.id ? "selected" : ""}>${p.name}</option>`).join("");

  let seasonTabsHtml = seasonsList.map(s => {
    const isAct = (s === activeWeatherSeason);
    return `<button type="button" class="weather-season-tab-btn" data-season="${s}" style="flex: 1; height: 28px; font-size: 12px; border-radius: 8px; border: 1px solid ${isAct ? 'var(--accent-color)' : 'var(--border-color)'}; background: ${isAct ? 'var(--accent-color)' : 'var(--secondary-bg)'}; color: ${isAct ? '#ffffff' : 'var(--text-primary)'}; font-weight: ${isAct ? '600' : 'normal'}; cursor: pointer; transition: all 0.2s;">${s}</button>`;
  }).join("");

  let itemsHtml = currentSeasonItems.map((item, index) => {
    return `
      <div style="display: flex; gap: 4px; align-items: center; margin-bottom: 6px; background: var(--secondary-bg); padding: 4px 6px; border-radius: 8px; border: 1px solid var(--border-color);">
        <input type="text" class="moe-input weather-name-input" data-index="${index}" value="${item.name || ''}" placeholder="天气名称" style="width: 72px; flex-shrink: 0; font-size: 11px; padding: 2px 4px; border-radius: 6px;">
        <div style="display: flex; align-items: center; gap: 2px; width: 56px; flex-shrink: 0;">
          <input type="number" class="moe-input weather-rate-input" data-index="${index}" value="${item.rate}" placeholder="概率" style="width: 40px; font-size: 11px; padding: 2px 4px; text-align: right; border-radius: 6px;">
          <span style="font-size: 11px; color: var(--text-secondary);">%</span>
        </div>
        <textarea class="moe-input weather-note-input" data-index="${index}" placeholder="备注" rows="1" style="flex: 1 1 auto; font-size: 11px; padding: 4px 6px; min-height: 26px; height: 26px; border-radius: 6px; resize: vertical; box-sizing: border-box;">${item.note || ''}</textarea>
        <button type="button" class="moe-btn-mini weather-del-item-btn" data-index="${index}" style="flex: 0 0 auto !important; width: 22px !important; height: 22px !important; min-width: 22px !important; padding: 0 !important; line-height: 20px !important; text-align: center; color: var(--tukey-accent-red, #ff4d4f);">&times;</button>
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <div style="display: flex; gap: 4px; align-items: center; margin-bottom: 8px; width: 100%; box-sizing: border-box; flex-wrap: wrap;">
      <select id="weather-pool-select" class="moe-input" style="flex: 1 1 110px; height: 28px; min-height: 28px; font-size: 11px; padding: 2px 8px; min-width: 90px; color: var(--text-primary); background-color: var(--card-bg, #ffffff); border-radius: 14px;">
        ${poolOptionsHtml}
      </select>
      <button type="button" id="weather-new-pool-btn" class="moe-btn-mini" style="flex: 0 0 auto !important; width: auto !important; padding: 2px 6px !important; font-size: 11px !important; height: 26px !important;">新建</button>
      <button type="button" id="weather-save-pool-btn" class="moe-btn-mini" style="flex: 0 0 auto !important; width: auto !important; padding: 2px 6px !important; font-size: 11px !important; height: 26px !important;">保存</button>
      <button type="button" id="weather-copy-season-btn" class="moe-btn-mini" style="flex: 0 0 auto !important; width: auto !important; padding: 2px 6px !important; font-size: 11px !important; height: 26px !important;">复制</button>
      <button type="button" id="weather-import-file-btn" class="moe-btn-mini" style="flex: 0 0 auto !important; width: auto !important; padding: 2px 6px !important; font-size: 11px !important; height: 26px !important;">导入</button>
      <button type="button" id="weather-prompt-guide-btn" class="moe-btn-mini" style="flex: 0 0 auto !important; width: auto !important; padding: 2px 6px !important; font-size: 11px !important; height: 26px !important;">提示</button>
      <button type="button" id="weather-del-pool-btn" class="moe-btn-mini" style="flex: 0 0 auto !important; width: auto !important; padding: 2px 6px !important; font-size: 11px !important; height: 26px !important; color: var(--tukey-accent-red, #ff4d4f);">删除</button>
    </div>

    <input type="file" id="weather-import-hidden-input" accept=".txt,.doc,.docx,.json" style="display: none;">

    <div style="display: flex; gap: 4px; margin-bottom: 8px; width: 100%;">
      ${seasonTabsHtml}
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-weight: 700; font-size: 12px; color: var(--text-primary);">${activeWeatherSeason}天气</span>
      <div style="display: flex; gap: 6px;">
        <button type="button" id="weather-test-draw-btn" class="moe-btn-mini" style="width: auto !important; padding: 2px 8px !important; font-size: 10px !important; color: var(--accent-color);">测试抽取</button>
        <button type="button" id="weather-add-item-btn" class="moe-btn-mini" style="width: auto !important; padding: 2px 8px !important; font-size: 10px !important;">+ 添加</button>
      </div>
    </div>

    <div id="weather-items-list" style="margin-bottom: 12px;">
      ${itemsHtml}
    </div>

    <!-- 复制季节模态弹窗 -->
    <div id="weather-copy-season-modal" class="modal">
      <div class="modal-content" style="max-width: 280px; padding: 14px; border-radius: 16px;">
        <div class="modal-header" style="font-size: 13px; font-weight: 600; text-align: center; margin-bottom: 8px;">
          <span>复制</span>
        </div>
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 8px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; color: var(--text-secondary); margin-bottom: 3px; display: block;">来源预设</label>
            <select id="weather-copy-src-pool" class="moe-input" style="width: 100%; height: 30px; font-size: 12px; border-radius: 8px;">
              ${pools.map(p => `<option value="${p.id}">${p.name}</option>`).join("")}
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 11px; color: var(--text-secondary); margin-bottom: 3px; display: block;">来源季节</label>
            <select id="weather-copy-src-season" class="moe-input" style="width: 100%; height: 30px; font-size: 12px; border-radius: 8px;">
              <option value="春季">春季</option>
              <option value="夏季">夏季</option>
              <option value="秋季">秋季</option>
              <option value="冬季">冬季</option>
            </select>
          </div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
            目标季节：${activeWeatherSeason}
          </div>
        </div>
        <div class="modal-footer" style="display: flex; gap: 8px; margin-top: 10px;">
          <button type="button" id="weather-copy-confirm-btn" class="moe-btn" style="flex: 1; height: 30px; font-size: 12px; border-radius: 8px;">复制</button>
          <button type="button" id="weather-copy-cancel-btn" class="cancel" style="flex: 1; height: 30px; font-size: 12px; border-radius: 8px;">取消</button>
        </div>
      </div>
    </div>

    <!-- 提示词指导模态弹窗 -->
    <div id="weather-prompt-modal" class="modal">
      <div class="modal-content" style="max-width: 320px; padding: 14px; border-radius: 16px;">
        <div class="modal-header" style="font-size: 13px; font-weight: 600; text-align: center; margin-bottom: 6px;">
          <span>提示</span>
        </div>
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 6px;">
          <textarea id="weather-ai-prompt-content" readonly class="moe-input" style="width: 100%; height: 210px; font-size: 11px; border-radius: 8px; resize: none; line-height: 1.5; padding: 6px; box-sizing: border-box; background: var(--secondary-bg); color: var(--text-primary);"></textarea>
        </div>
        <div class="modal-footer" style="display: flex; gap: 8px; margin-top: 10px;">
          <button type="button" id="weather-copy-prompt-btn" class="moe-btn" style="flex: 1; height: 30px; font-size: 12px; border-radius: 8px;">复制</button>
          <button type="button" id="weather-close-prompt-btn" class="cancel" style="flex: 1; height: 30px; font-size: 12px; border-radius: 8px;">关闭</button>
        </div>
      </div>
    </div>
  `;

  // 绑定事件：切换天气池
  document.getElementById("weather-pool-select").onchange = (e) => {
    localStorage.setItem("coc_active_weather_pool_id", e.target.value);
    renderWeatherTab(container);
  };

  // 绑定事件：切换季节标签
  container.querySelectorAll(".weather-season-tab-btn").forEach(btn => {
    btn.onclick = () => {
      activeWeatherSeason = btn.dataset.season;
      renderWeatherTab(container);
    };
  });

  // 绑定事件：保存当前天气池
  document.getElementById("weather-save-pool-btn").onclick = async () => {
    const names = container.querySelectorAll(".weather-name-input");
    const rates = container.querySelectorAll(".weather-rate-input");
    const notes = container.querySelectorAll(".weather-note-input");

    activePool.seasons[activeWeatherSeason] = [];
    for (let i = 0; i < names.length; i++) {
      activePool.seasons[activeWeatherSeason].push({
        name: names[i].value.trim(),
        rate: parseFloat(rates[i].value) || 0,
        note: notes[i].value.trim()
      });
    }
    activePool.items = activePool.seasons[activeWeatherSeason];

    saveStoredWeatherPools(pools);
    const saveBtn = document.getElementById("weather-save-pool-btn");
    saveBtn.textContent = "已保存";
    setTimeout(() => { saveBtn.textContent = "保存"; }, 1000);
  };

  // 绑定事件：新建天气池
  document.getElementById("weather-new-pool-btn").onclick = async () => {
    let name = null;
    if (typeof window.showCustomPrompt === "function") {
      name = await window.showCustomPrompt("新建天气池", "请输入气候名称", "新气候");
    } else {
      name = prompt("请输入气候名称:");
    }
    if (!name || !name.trim()) return;
    const newId = "weather_" + Date.now();
    const defaultList = [
      { name: "晴天", rate: 50, note: "温和宜人" },
      { name: "多云", rate: 30, note: "云层微厚" },
      { name: "小雨", rate: 20, note: "细雨绵绵" }
    ];
    const newPool = normalizeWeatherPool({
      id: newId,
      name: name.trim(),
      seasons: {
        "春季": JSON.parse(JSON.stringify(defaultList)),
        "夏季": JSON.parse(JSON.stringify(defaultList)),
        "秋季": JSON.parse(JSON.stringify(defaultList)),
        "冬季": JSON.parse(JSON.stringify(defaultList))
      },
      items: defaultList
    });
    pools.push(newPool);
    saveStoredWeatherPools(pools);
    localStorage.setItem("coc_active_weather_pool_id", newId);
    renderWeatherTab(container);
  };

  // 绑定事件：删除天气池
  document.getElementById("weather-del-pool-btn").onclick = async () => {
    if (pools.length <= 1) {
      if (typeof window.showCustomAlert === "function") {
        await window.showCustomAlert("提示", "必须保留至少一个天气池");
      } else {
        alert("必须保留至少一个天气池");
      }
      return;
    }
    let confirmed = false;
    if (typeof window.showCustomConfirm === "function") {
      confirmed = await window.showCustomConfirm("确认删除", `确定要删除天气池【${activePool.name}】吗？`);
    } else {
      confirmed = confirm(`确定要删除天气池【${activePool.name}】吗？`);
    }
    if (!confirmed) return;

    const idx = pools.findIndex(p => p.id === activePool.id);
    if (idx !== -1) {
      pools.splice(idx, 1);
      saveStoredWeatherPools(pools);
      localStorage.setItem("coc_active_weather_pool_id", pools[0].id);
      renderWeatherTab(container);
    }
  };

  // 绑定事件：添加天气项
  document.getElementById("weather-add-item-btn").onclick = () => {
    if (!activePool.seasons[activeWeatherSeason]) activePool.seasons[activeWeatherSeason] = [];
    activePool.seasons[activeWeatherSeason].push({
      name: "新天气",
      rate: 10,
      note: ""
    });
    renderWeatherTab(container);
  };

  // 绑定事件：删除天气项
  container.querySelectorAll(".weather-del-item-btn").forEach(btn => {
    btn.onclick = async () => {
      const idx = parseInt(btn.dataset.index, 10);
      const item = activePool.seasons[activeWeatherSeason]?.[idx];
      const itemName = item?.name || "此天气项";
      let confirmed = false;
      if (typeof window.showCustomConfirm === "function") {
        confirmed = await window.showCustomConfirm("确认删除", `确定要删除【${itemName}】吗？`);
      } else {
        confirmed = confirm(`确定要删除【${itemName}】吗？`);
      }
      if (!confirmed) return;

      if (activePool.seasons[activeWeatherSeason]) {
        activePool.seasons[activeWeatherSeason].splice(idx, 1);
        renderWeatherTab(container);
      }
    };
  });

  // 绑定事件：测试抽取
  document.getElementById("weather-test-draw-btn").onclick = async () => {
    const drawn = window.drawWeatherFromCurrentPool(activeWeatherSeason);
    const alertMsg = `${drawn.season}抽中：${drawn.name}，概率${drawn.rate}%，备注${drawn.note || "无"}`;
    if (typeof window.showCustomAlert === "function") {
      await window.showCustomAlert("抽取结果", alertMsg);
    } else {
      alert(alertMsg);
    }
  };

  // 绑定事件：复制季节
  const copyModal = document.getElementById("weather-copy-season-modal");
  document.getElementById("weather-copy-season-btn").onclick = () => {
    if (copyModal) copyModal.classList.add("visible");
  };
  document.getElementById("weather-copy-cancel-btn").onclick = () => {
    if (copyModal) copyModal.classList.remove("visible");
  };
  document.getElementById("weather-copy-confirm-btn").onclick = () => {
    const srcPoolId = document.getElementById("weather-copy-src-pool").value;
    const srcSeason = document.getElementById("weather-copy-src-season").value;
    const srcPool = pools.find(p => p.id === srcPoolId);
    if (srcPool && srcPool.seasons && srcPool.seasons[srcSeason]) {
      activePool.seasons[activeWeatherSeason] = JSON.parse(JSON.stringify(srcPool.seasons[srcSeason]));
      saveStoredWeatherPools(pools);
      if (copyModal) copyModal.classList.remove("visible");
      renderWeatherTab(container);
    }
  };

  // 绑定事件：导入文件
  const hiddenFileInput = document.getElementById("weather-import-hidden-input");
  document.getElementById("weather-import-file-btn").onclick = () => {
    if (hiddenFileInput) hiddenFileInput.click();
  };

  hiddenFileInput.onchange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      let rawText = "";
      if (file.name.endsWith(".json")) {
        rawText = await file.text();
      } else if (file.name.endsWith(".docx")) {
        // 解析 Word docx 文档中的 XML 文本
        const arrayBuf = await file.arrayBuffer();
        try {
          // docx 是 PK zip 格式，尝试通过字符串搜索或解压读取
          const bytes = new Uint8Array(arrayBuf);
          let binaryStr = "";
          for (let i = 0; i < bytes.length; i++) binaryStr += String.fromCharCode(bytes[i]);
          const docXmlIndex = binaryStr.indexOf("word/document.xml");
          if (docXmlIndex !== -1) {
            // 提取 XML 中的纯文本标签 <w:t>
            const extracted = binaryStr.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
            if (extracted && extracted.length > 0) {
              rawText = extracted.map(tag => tag.replace(/<[^>]+>/g, "")).join("\n");
            }
          }
        } catch (ex) {
          console.warn("docx 二进制提取降级:", ex);
        }
        if (!rawText) {
          rawText = await file.text();
        }
      } else {
        rawText = await file.text();
      }

      if (!rawText || !rawText.trim()) {
        alert("导入文本内容为空");
        return;
      }

      // 解析文本
      const importedPool = parseWeatherImportText(rawText, file.name.replace(/\.[^.]+$/, ""));
      if (importedPool) {
        pools.push(importedPool);
        saveStoredWeatherPools(pools);
        localStorage.setItem("coc_active_weather_pool_id", importedPool.id);
        renderWeatherTab(container);
        if (typeof window.showCustomAlert === "function") {
          await window.showCustomAlert("导入成功", `成功导入气候：${importedPool.name}`);
        } else {
          alert(`成功导入气候：${importedPool.name}`);
        }
      } else {
        alert("导入失败，文本格式不符合要求");
      }
    } catch (err) {
      console.error("导入异常:", err);
      alert("导入失败");
    } finally {
      hiddenFileInput.value = "";
    }
  };

  // 绑定事件：提示词指导弹窗
  const promptModal = document.getElementById("weather-prompt-modal");
  const promptTextarea = document.getElementById("weather-ai-prompt-content");
  const aiPromptGuideText = `你是一个气候天气预设生成助手。请按照以下兼容格式编写天气预设文本，支持直接保存为 TXT 格式导入：

气候名称：这里填写气候名称

春季：
晴天 | 35% | 春光明媚微风和煦
多云 | 25% | 春云淡淡舒适怡人
小雨 | 20% | 细雨绵绵润物无声
微风 | 15% | 清风拂面
雷阵雨 | 5% | 阵雨初歇

夏季：
晴朗酷热 | 40% | 骄阳似火
雷阵雨 | 25% | 电闪雷鸣
多云闷热 | 20% | 空气潮湿
大雨 | 15% | 大雨倾盆

秋季：
秋高气爽 | 40% | 凉爽舒适
阴天 | 25% | 天色阴凉
小雨 | 20% | 秋雨连绵
大风 | 15% | 秋风瑟瑟

冬季：
晴冷 | 35% | 寒风凛冽阳光清冷
小雪 | 25% | 轻盈落地
阴沉大风 | 20% | 冷风呼啸
大雪 | 15% | 漫天飞雪
冻雨 | 5% | 道路湿滑

规则要点：
1. 每一季列出天气名称、概率百分比和备注，用竖线分割或空格分割。
2. 每一季的所有天气概率总和尽量等于 100%。
3. 可以包含四季，也可以只写单季。`;

  document.getElementById("weather-prompt-guide-btn").onclick = () => {
    if (promptTextarea) promptTextarea.value = aiPromptGuideText;
    if (promptModal) promptModal.classList.add("visible");
  };

  document.getElementById("weather-close-prompt-btn").onclick = () => {
    if (promptModal) promptModal.classList.remove("visible");
  };

  document.getElementById("weather-copy-prompt-btn").onclick = async () => {
    try {
      await navigator.clipboard.writeText(aiPromptGuideText);
      const copyBtn = document.getElementById("weather-copy-prompt-btn");
      copyBtn.textContent = "已复制";
      setTimeout(() => { copyBtn.textContent = "复制"; }, 1000);
    } catch (e) {
      alert("复制失败");
    }
  };
}

// 天气导入文本解析器
function parseWeatherImportText(rawText, fallbackName) {
  try {
    // 尝试 JSON 解析
    if (rawText.trim().startsWith("{")) {
      const parsed = JSON.parse(rawText);
      if (parsed.name) {
        return normalizeWeatherPool({
          id: "weather_" + Date.now(),
          name: parsed.name,
          seasons: parsed.seasons,
          items: parsed.items
        });
      }
    }
  } catch (e) {}

  // 纯文本按行解析
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let poolName = fallbackName || "导入气候";
  let seasonsData = {
    "春季": [],
    "夏季": [],
    "秋季": [],
    "冬季": []
  };
  let currentParseSeason = "春季";
  let hasSeasonHeader = false;

  for (const line of lines) {
    // 匹配气候名称
    const nameMatch = line.match(/^(?:气候名称|名称|气候|预设名称)[:：\s]+(.+)$/);
    if (nameMatch) {
      poolName = nameMatch[1].trim();
      continue;
    }

    // 匹配季节分段
    if (/^(?:\[?春季?\]?|春)[:：\s]*$/i.test(line)) {
      currentParseSeason = "春季";
      hasSeasonHeader = true;
      continue;
    }
    if (/^(?:\[?夏季?\]?|夏)[:：\s]*$/i.test(line)) {
      currentParseSeason = "夏季";
      hasSeasonHeader = true;
      continue;
    }
    if (/^(?:\[?秋季?\]?|秋)[:：\s]*$/i.test(line)) {
      currentParseSeason = "秋季";
      hasSeasonHeader = true;
      continue;
    }
    if (/^(?:\[?冬季?\]?|冬)[:：\s]*$/i.test(line)) {
      currentParseSeason = "冬季";
      hasSeasonHeader = true;
      continue;
    }

    // 匹配单行天气数据
    // 格式支持：晴天 | 35% | 阳光明媚 或 晴天 35% 阳光明媚 或 晴天,35%,阳光明媚
    const cleanLine = line.replace(/^[-\*•\d\.]+\s*/, ""); // 去除开头的列表符号
    let parts = cleanLine.split(/[|｜,，]/).map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) {
      parts = cleanLine.split(/\s+/).map(s => s.trim()).filter(Boolean);
    }

    if (parts.length >= 2) {
      const name = parts[0];
      const rateNum = parseFloat(parts[1].replace(/[^\d\.]/g, "")) || 10;
      const note = parts.slice(2).join(" ");
      seasonsData[currentParseSeason].push({
        name: name,
        rate: rateNum,
        note: note
      });
    }
  }

  // 如果没有分季节，将解析出的所有项目复制到四季
  if (!hasSeasonHeader && seasonsData["春季"].length > 0) {
    const list = seasonsData["春季"];
    seasonsData["夏季"] = JSON.parse(JSON.stringify(list));
    seasonsData["秋季"] = JSON.parse(JSON.stringify(list));
    seasonsData["冬季"] = JSON.parse(JSON.stringify(list));
  }

  // 兜底补全
  ["春季", "夏季", "秋季", "冬季"].forEach(s => {
    if (!seasonsData[s] || seasonsData[s].length === 0) {
      seasonsData[s] = [
        { name: "晴天", rate: 50, note: "温和宜人" },
        { name: "多云", rate: 30, note: "云层微厚" },
        { name: "小雨", rate: 20, note: "细雨绵绵" }
      ];
    }
  });

  return {
    id: "weather_" + Date.now(),
    name: poolName,
    seasons: seasonsData,
    items: seasonsData["春季"]
  };
}

// 绑定导航栏标签切换事件
document.addEventListener("DOMContentLoaded", () => {
  const tabRules = document.getElementById("cmd-tab-rules");
  const tabCmd = document.getElementById("cmd-tab-commands");
  const tabWeather = document.getElementById("cmd-tab-weather");
  if (tabRules) {
    tabRules.addEventListener("click", () => {
      currentCmdTab = "rules";
      currentEditingRuleModuleId = null;
      window.renderDiceCommandCenter();
    });
  }
  if (tabCmd) {
    tabCmd.addEventListener("click", () => {
      currentCmdTab = "commands";
      window.renderDiceCommandCenter();
    });
  }
  if (tabWeather) {
    tabWeather.addEventListener("click", () => {
      currentCmdTab = "weather";
      window.renderDiceCommandCenter();
    });
  }
});
