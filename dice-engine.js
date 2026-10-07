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
  mp: "{角色名} 的 MP 变化: {旧MP}→{新MP}",
  san: "{角色名} 的 SAN 变化: {旧SAN}→{新SAN}",
  coc: "{角色名} 生成了一组 COC7 属性",
  coc5: "{角色名} 生成了 5 组 COC7 属性",
  jrrp: "{角色名} 的今日人品值是: {人品值} [{运势评语}]",
  dnd: "{角色名} 生成了一组 DND 5E 属性：{属性列表} [总计:{总计}]",
  weather: "【天气播报】当前{季节}气候：{天气名称} [{天气描述}]",
  tarot: "{角色名} 抽取了塔罗牌：【{卡牌}】 [{正逆位}]",
  rules: "【COC7 规则速查】\n{规则内容}",
  help: "【骰娘指令帮助】\n{帮助内容}"
};

// COC 七版规则书与扩展指令完整条文
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
  },
  {
    key: "mp",
    name: "魔法调整",
    syntax: ".mp ±点数（如 .mp -2 或 .mp +3）",
    vars: "{角色名}、{旧MP}、{新MP}",
    desc: `魔法值与法术消耗规则（Magic Points & Costs）：
调查员的魔法值上限（Maximum MP）通常等于意志（POW）除以5。
当释放法术、激活特殊招式或触发法术仪式时扣除MP。
指令直接调整调查员人物面板的当前魔法值并自动回写持久化。`
  },
  {
    key: "san",
    name: "理智调整",
    syntax: ".san ±点数（如 .san -5 或 .san +2）",
    vars: "{角色名}、{旧SAN}、{新SAN}",
    desc: `理智值直接调整规则（Direct Sanity Point Adjustment）：
当需要直接增减角色的理智值（如心理治疗恢复或直接剧情精神伤害）时使用。
指令直接调整调查员人物面板的当前理智值并自动回写持久化。`
  },
  {
    key: "jrrp",
    name: "今日人品",
    syntax: ".jrrp",
    vars: "{角色名}、{人品值}、{运势评语}",
    desc: `今日运势与人品占卜（Daily Luck Check）：
掷出1至100的人品点数，并根据分值区间给出大吉、吉、中平、凶、大凶等运势评语。`
  },
  {
    key: "dnd",
    name: "DND属性",
    syntax: ".dnd 或 .dnd5",
    vars: "{角色名}、{属性列表}、{总计}",
    desc: `D&D 5E 六大核心属性生成（4d6k3 Method）：
使用标准 4D6 丢弃最低值公式，一次性生成力量、敏捷、体质、智力、感知与魅力的属性点数与总和。`
  },
  {
    key: "weather",
    name: "天气抽取",
    syntax: ".w 或 .weather [季节/月份]",
    vars: "{季节}、{天气名称}、{天气描述}",
    desc: `气候与环境抽取（Weather Pool Drawer）：
从当前激活的气候池中，根据指定月份或当前真实季节按概率抽取环境天气。`
  },
  {
    key: "tarot",
    name: "塔罗抽取",
    syntax: ".tarot 或 .draw",
    vars: "{角色名}、{卡牌}、{正逆位}",
    desc: `大阿卡那塔罗牌抽取（Tarot Card Draw）：
从22张大阿卡纳塔罗牌中随机抽取一张，并判定正位或逆位。`
  },
  {
    key: "rules",
    name: "规则速查",
    syntax: ".rules 或 .rule [条目名]",
    vars: "{规则内容}",
    desc: `跑团规则速查表（Rulebook Quick Reference）：
提供常用跑团指令指引与规则条文速查。`
  },
  {
    key: "help",
    name: "帮助指南",
    syntax: ".help 或 .bot",
    vars: "{帮助内容}",
    desc: `骰娘指令帮助菜单（Help & Bot Menu）：
展示所有可用的跑团指令一览及使用示例。`
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

// 掷多面骰辅助函数（全面支持 TRPG 多面骰、四则运算与复合掷骰，如 1d6, 2d6, d6, 1d100, 2d6+5, 3d6*5, 1d10+1d4, 3#1d6, 4d6k3, 2d20kh1, 4df 等）
function rollDiceExpression(expr) {
  let raw = (expr || "").trim();
  if (!raw || raw === "1d100" || raw === "d100" || raw === "100" || raw === "d%" || raw === "1d%") {
    const val = Math.floor(Math.random() * 100) + 1;
    return { total: val, detail: `D100=${val}` };
  }

  // 支持 N#XdY 多次投掷（如 3#1d6）
  const multiMatch = raw.match(/^(\d+)\s*#\s*(.+)$/);
  if (multiMatch) {
    const times = Math.min(20, Math.max(1, parseInt(multiMatch[1], 10)));
    const subExpr = multiMatch[2].trim();
    let subTotals = [];
    for (let i = 0; i < times; i++) {
      const subRes = rollDiceExpression(subExpr);
      subTotals.push(subRes.total);
    }
    const sum = subTotals.reduce((a, b) => a + b, 0);
    return { total: sum, detail: `[${subTotals.join(", ")}] = ${sum}` };
  }

  let detailLog = [];

  // 1. 处理 Fudge / Fate 骰（如 4df）
  let evaluatedExpr = raw.replace(/(\d*)[dD][fF]/g, (match, countStr) => {
    const count = Math.min(100, Math.max(1, parseInt(countStr, 10) || 1));
    let rolls = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      rolls.push(r === 1 ? "+" : (r === -1 ? "-" : "0"));
      sum += r;
    }
    detailLog.push(`${count}DF(${rolls.join(",")})`);
    return sum;
  });

  // 2. 处理标准多面骰及优势/劣势/保留弃用规则（如 4d6k3, 4d6kh3, 2d20kl1, 4d6d1, 3d6*5 等）
  evaluatedExpr = evaluatedExpr.replace(/(\d*)[dD](\d+|%)(?:(k|kh|kl|d|dh|dl)(\d+))?/gi, (match, countStr, sidesStr, kdType, kdCountStr) => {
    const count = Math.min(100, Math.max(1, parseInt(countStr, 10) || 1));
    const sides = (sidesStr === "%" || sidesStr.toLowerCase() === "100") ? 100 : Math.min(10000, Math.max(1, parseInt(sidesStr, 10) || 100));
    let rolls = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    let keptRolls = [...rolls];
    let sum = 0;

    if (kdType && kdCountStr) {
      const kdN = Math.min(count, Math.max(0, parseInt(kdCountStr, 10) || 1));
      const sorted = [...rolls].sort((a, b) => a - b);
      const lowType = kdType.toLowerCase();
      if (lowType === "k" || lowType === "kh") {
        // 保留最高 kdN 个
        const kept = sorted.slice(count - kdN);
        sum = kept.reduce((a, b) => a + b, 0);
        detailLog.push(`${count}D${sides}k${kdN}(${rolls.join("+")})`);
      } else if (lowType === "kl") {
        // 保留最低 kdN 个
        const kept = sorted.slice(0, kdN);
        sum = kept.reduce((a, b) => a + b, 0);
        detailLog.push(`${count}D${sides}kl${kdN}(${rolls.join("+")})`);
      } else if (lowType === "d" || lowType === "dl") {
        // 丢弃最低 kdN 个
        const kept = sorted.slice(kdN);
        sum = kept.reduce((a, b) => a + b, 0);
        detailLog.push(`${count}D${sides}d${kdN}(${rolls.join("+")})`);
      } else if (lowType === "dh") {
        // 丢弃最高 kdN 个
        const kept = sorted.slice(0, count - kdN);
        sum = kept.reduce((a, b) => a + b, 0);
        detailLog.push(`${count}D${sides}dh${kdN}(${rolls.join("+")})`);
      } else {
        sum = rolls.reduce((a, b) => a + b, 0);
        detailLog.push(`${count}D${sides}(${rolls.join("+")})`);
      }
    } else {
      sum = rolls.reduce((a, b) => a + b, 0);
      if (count > 1) {
        detailLog.push(`${count}D${sides}(${rolls.join("+")})`);
      } else {
        detailLog.push(`D${sides}(${sum})`);
      }
    }

    return sum;
  });

  try {
    const sanitized = evaluatedExpr.replace(/[^0-9+\-*/().\s]/g, "");
    if (sanitized) {
      const result = Math.floor(new Function(`return (${sanitized});`)());
      const total = isNaN(result) ? 0 : result;
      let detail = detailLog.length > 0 ? `${detailLog.join(" + ")} = ${total}` : `${total}`;
      return { total, detail };
    }
  } catch (e) {
    // 忽略异常，降级解析
  }

  const num = parseInt(raw, 10);
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
  "siz": "siz", "体型": "siz", "体格": "siz",
  "edu": "edu", "教育": "edu",
  "app": "app", "外貌": "app",
  "int": "int", "智力": "int", "灵感": "int",
  "luk": "luk", "幸运": "luk", "运气": "luk", "运势": "luk",
  "hp": "hp", "生命": "hp", "生命值": "hp", "血量": "hp", "体力": "hp",
  "mp": "mp", "魔法": "mp", "魔法值": "mp", "魔力": "mp",
  "san": "san", "理智": "san", "心智": "san", "san值": "san", "精神": "san",
  "armor": "armor", "护甲": "armor", "护盾": "armor", "防具": "armor", "盾": "armor"
};

const COC_SKILL_ALIASES = {
  "手枪": ["射击", "手枪", "手枪射击", "射击(手枪)", "射击（手枪）", "射击:手枪", "射击：手枪"],
  "射击": ["射击", "手枪", "手枪射击", "射击(手枪)", "射击（手枪）", "射击:手枪", "射击：手枪"],
  "步枪": ["步枪", "霰弹枪", "步枪/霰弹枪", "步枪霰弹枪", "射击(步枪/霰弹枪)", "射击（步枪/霰弹枪）", "射击:步枪", "射击"],
  "霰弹枪": ["步枪", "霰弹枪", "步枪/霰弹枪", "射击(步枪/霰弹枪)", "射击（步枪/霰弹枪）", "射击:霰弹枪", "射击"],
  "冲锋枪": ["冲锋枪", "微冲", "射击(冲锋枪)", "射击（冲锋枪）", "射击"],
  "弓箭": ["弓", "弓箭", "射击(弓)", "射击（弓）", "射击"],
  "重武器": ["重武器", "机枪", "射击(重武器)", "射击（重武器）", "射击"],
  "斗殴": ["斗殴", "格斗", "近战(斗殴)", "近战（斗殴）", "格斗(斗殴)", "格斗（斗殴）", "肉搏", "拳击", "拳", "脚踢"],
  "格斗": ["格斗", "斗殴", "近战(斗殴)", "近战（斗殴）", "格斗(斗殴)", "格斗（斗殴）", "肉搏", "拳击", "拳", "脚踢"],
  "刀剑": ["刀剑", "剑术", "刀", "剑", "格斗(刀剑)", "格斗（刀剑）", "格斗"],
  "斧头": ["斧头", "斧", "格斗(斧)", "格斗（斧）", "格斗"],
  "闪避": ["闪避", "躲避", "回避"],
  "侦查": ["侦查", "侦察", "观察", "寻找"],
  "聆听": ["聆听", "听力", "倾听", "听"],
  "潜行": ["潜行", "潜伏", "隐秘", "匿踪"],
  "急救": ["急救", "包扎", "止血"],
  "医学": ["医学", "医疗", "医术", "医生"],
  "心理学": ["心理学", "心理", "洞悉", "察言观色"],
  "精神分析": ["精神分析", "心理分析", "安抚", "心疗"],
  "说服": ["说服", "劝说", "谈判"],
  "话术": ["话术", "快速交谈", "忽悠", "欺骗", "巧言"],
  "恐吓": ["恐吓", "威吓", "威胁", "逼迫"],
  "魅惑": ["魅惑", "取悦", "诱惑", "美人计"],
  "信用评级": ["信用评级", "信誉", "信用", "身家"],
  "神秘学": ["神秘学", "秘教", "玄学"],
  "克苏鲁神话": ["克苏鲁神话", "克苏鲁", "cm", "CM"],
  "图书馆使用": ["图书馆使用", "图书馆", "查阅", "搜集资料"],
  "撬锁": ["撬锁", "开锁"],
  "妙手": ["妙手", "扒窃", "偷窃", "顺手牵羊"],
  "伪装": ["伪装", "乔装", "易容"],
  "汽车驾驶": ["汽车驾驶", "驾驶", "开汽车", "开车"],
  "骑术": ["骑术", "骑马"],
  "机械维修": ["机械维修", "机修", "修车"],
  "电气维修": ["电气维修", "电修", "修电器"],
  "计算机使用": ["计算机使用", "计算机", "电脑", "黑客"],
  "母语": ["母语", "语言(母语)", "语言（母语）", "本国语"],
  "外语": ["外语", "语言(外语)", "语言（外语）", "英语", "日语"]
};

// 解析角色面板中指定技能或属性的当前数值（全面支持别名、父子技能继承、自定义技能与规则书基础值）
function resolveCocSkillOrStat(userCoc, skillName) {
  if (!userCoc) userCoc = {};
  const stats = userCoc.stats || {};
  const calc = userCoc.calculated || {};
  const skills = userCoc.skills || {};
  const customSkills = userCoc.customSkills || [];

  const rawKey = (skillName || "").trim();
  if (!rawKey || rawKey === "检定") return 50;

  const lowerKey = rawKey.toLowerCase();
  const mappedKey = COC_KEY_MAP[lowerKey] || COC_KEY_MAP[rawKey];

  // 1. 核心属性与衍生数值（力量, 敏捷, 体质, 意志, 智力, 灵感, 体型, 外貌, 教育, 幸运, hp, mp, san, armor）
  if (mappedKey) {
    if (["hp", "mp", "san", "armor"].includes(mappedKey)) {
      if (typeof calc[mappedKey] !== "undefined") return parseInt(calc[mappedKey], 10) || 0;
      if (mappedKey === "san" && typeof stats.pow !== "undefined") return parseInt(stats.pow, 10) || 50;
      return 10;
    }
    if (typeof stats[mappedKey] !== "undefined") return parseInt(stats[mappedKey], 10) || 50;
  }

  // 2. 检查 skills 字典直接命中
  if (typeof skills[rawKey] !== "undefined") {
    return parseInt(skills[rawKey], 10);
  }
  const foundK = Object.keys(skills).find(k => k.trim().toLowerCase() === lowerKey);
  if (foundK && typeof skills[foundK] !== "undefined") {
    return parseInt(skills[foundK], 10);
  }

  // 3. 别名与子技能候选键联动（如查“手枪”，若 skills 表有“射击”或“手枪”或“射击(手枪)”，优先获取最高/有效值）
  const candidateKeys = [rawKey];
  for (const [canon, aliases] of Object.entries(COC_SKILL_ALIASES)) {
    if (aliases.some(a => a.toLowerCase() === lowerKey || rawKey.includes(a) || a.includes(rawKey))) {
      aliases.forEach(a => { if (!candidateKeys.includes(a)) candidateKeys.push(a); });
      if (!candidateKeys.includes(canon)) candidateKeys.push(canon);
    }
  }

  let highestCandidateVal = null;
  for (const ck of candidateKeys) {
    if (typeof skills[ck] !== "undefined") {
      const v = parseInt(skills[ck], 10);
      if (!isNaN(v)) {
        if (highestCandidateVal === null || v > highestCandidateVal) highestCandidateVal = v;
      }
    }
    const fk = Object.keys(skills).find(k => k.trim().toLowerCase() === ck.toLowerCase());
    if (fk && typeof skills[fk] !== "undefined") {
      const v = parseInt(skills[fk], 10);
      if (!isNaN(v)) {
        if (highestCandidateVal === null || v > highestCandidateVal) highestCandidateVal = v;
      }
    }
  }
  if (highestCandidateVal !== null) return highestCandidateVal;

  // 4. 自定义技能表
  if (Array.isArray(customSkills)) {
    for (const cs of customSkills) {
      const csName = typeof cs === "string" ? cs : cs?.name;
      const csVal = typeof cs === "object" ? (cs.val ?? cs.value) : undefined;
      if (csName && candidateKeys.some(ck => ck.toLowerCase() === csName.trim().toLowerCase())) {
        if (csVal !== undefined && !isNaN(parseInt(csVal, 10))) return parseInt(csVal, 10);
        if (typeof skills[csName] !== "undefined") return parseInt(skills[csName], 10);
      }
    }
  }

  // 5. 检查 stats 字典中是否有同名字段
  if (typeof stats[rawKey] !== "undefined") return parseInt(stats[rawKey], 10);
  const foundSK = Object.keys(stats).find(k => k.trim().toLowerCase() === lowerKey);
  if (foundSK && typeof stats[foundSK] !== "undefined") return parseInt(stats[foundSK], 10);

  // 6. 规则书默认基础值保底
  if (typeof getSkillBaseValue === "function") {
    return getSkillBaseValue(rawKey, stats);
  }

  return 20;
}

// 提取消息气泡中的所有跑团指令（支持单条、多条、嵌入自然文本中的指令，支持点号与指令间的空格）
function extractDiceCommands(rawText) {
  if (!rawText || typeof rawText !== "string") return [];
  const commands = [];
  const lines = rawText.split(/\r?\n/);

  const cmdPrefixPattern = /^[.。]\s*(?:r[ahd]?|rc|check|st|sc|hp|mp|san|en|ti|li|coc(?:[567])?|dnd(?:5)?|jrrp|rules?|help|bot|weather|tarot|draw|w\b|nn|sn|ob|set)/i;
  const embeddedPattern = /[.。]\s*(?:r[ahd]?|rc|check|st|sc|hp|mp|san|en|ti|li|coc(?:[567])?|dnd(?:5)?|jrrp|rules?|help|bot|weather|tarot|draw|w\b|nn|sn|ob|set)(?:[^\r\n;；.。]+|$)/gi;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 检查整行是否直接是指令
    if (cmdPrefixPattern.test(trimmed)) {
      const subParts = trimmed.split(/[;；]/).map(s => s.trim()).filter(Boolean);
      for (const sp of subParts) {
        if (cmdPrefixPattern.test(sp)) {
          commands.push(sp.replace(/^[.。]\s*/, "").trim());
        }
      }
    } else {
      // 文本中内嵌指令提取
      let match;
      while ((match = embeddedPattern.exec(trimmed)) !== null) {
        const cmdStr = match[0].replace(/^[.。]\s*/, "").trim();
        if (cmdStr) {
          commands.push(cmdStr);
        }
      }
    }
  }

  if (commands.length === 0 && /^[.。]\s*/i.test(rawText.trim())) {
    commands.push(rawText.trim().replace(/^[.。]\s*/, "").trim());
  }

  return commands;
}

// 核心指令解析函数：支持多指令批量执行、代骰、角色名精准与模糊绑定、KP守密人安全保护、气泡内嵌指令触发
window.executeDiceCommand = function(rawContent, chat, diceInfo, senderInfo) {
  if (!rawContent || typeof rawContent !== "string") return null;

  const rawCmds = extractDiceCommands(rawContent);
  if (!rawCmds || rawCmds.length === 0) return null;

  const activePreset = getActiveDicePreset();
  const templates = { ...DEFAULT_DICE_TEMPLATES, ...(activePreset.templates || {}) };

  const defaultSenderName = (senderInfo && senderInfo.name) ? senderInfo.name : (chat.settings?.myNickname || chat.settings?.myName || "我");
  const defaultSenderId = (senderInfo && senderInfo.id) ? senderInfo.id : "user";

  const keeperTargetId = chat.settings?.keeperTargetId;
  const isKeeperRole = Boolean(
    chat.isGroup &&
    keeperTargetId &&
    keeperTargetId !== "none" &&
    (defaultSenderId === keeperTargetId || (senderInfo && senderInfo.name === chat.settings?.keeperName) || (senderInfo && senderInfo.id === keeperTargetId))
  );

  // 辅助函数：构建参战者目标包装器
  const createCombatantWrapper = (c) => {
    let realCoc = null;
    if (c.isUser || c.id === "user") {
      realCoc = (senderInfo && senderInfo.cocPanel) || chat.settings?.myCocPanel || (window.myCocPanel && typeof window.myCocPanel.getData === "function" ? window.myCocPanel.getData() : null);
    } else if (chat.isGroup && Array.isArray(chat.members)) {
      const mem = chat.members.find(m => m.id === c.id || m.groupNickname === c.name || m.originalName === c.name);
      if (mem && mem.cocPanel) realCoc = mem.cocPanel;
    }
    if (!realCoc) {
      if (chat.settings?.aiCocPanel) realCoc = chat.settings.aiCocPanel;
    }

    const mergedCoc = {
      stats: {
        dex: c.dex || realCoc?.stats?.dex || 50,
        str: c.str || realCoc?.stats?.str || 50,
        con: c.con || realCoc?.stats?.con || 50,
        pow: c.pow || realCoc?.stats?.pow || 50,
        siz: c.siz || realCoc?.stats?.siz || 50,
        edu: c.edu || realCoc?.stats?.edu || 50,
        app: c.app || realCoc?.stats?.app || 50,
        int: c.int || realCoc?.stats?.int || 50,
        luk: c.luk || realCoc?.stats?.luk || 50,
      },
      skills: { ...(realCoc?.skills || {}), ...(c.skills || {}), ...(c.cocPanel?.skills || {}) },
      customSkills: c.customSkills || realCoc?.customSkills || [],
      calculated: {
        hp: (c.hp !== undefined) ? c.hp : (realCoc?.calculated?.hp || 10),
        maxHp: (c.maxHp !== undefined) ? c.maxHp : (realCoc?.calculated?.maxHp || 10),
        mp: (c.mp !== undefined) ? c.mp : (realCoc?.calculated?.mp || 10),
        maxMp: (c.maxMp !== undefined) ? c.maxMp : (realCoc?.calculated?.maxMp || 10),
        san: (c.san !== undefined) ? c.san : (realCoc?.calculated?.san || 50),
        maxSan: (c.maxSan !== undefined) ? c.maxSan : (realCoc?.calculated?.maxSan || 50),
        armor: (c.armor !== undefined) ? c.armor : (realCoc?.calculated?.armor || 0),
        db: c.db || realCoc?.calculated?.db || "0"
      }
    };

    return {
      id: c.id,
      name: c.name,
      isUser: Boolean(c.isUser),
      isProxy: true,
      isCombatant: true,
      combatant: c,
      cocPanel: mergedCoc,
      onSave: (newCoc) => {
        if (newCoc.calculated) {
          if (newCoc.calculated.hp !== undefined) c.hp = newCoc.calculated.hp;
          if (newCoc.calculated.maxHp !== undefined) c.maxHp = newCoc.calculated.maxHp;
          if (newCoc.calculated.mp !== undefined) c.mp = newCoc.calculated.mp;
          if (newCoc.calculated.maxMp !== undefined) c.maxMp = newCoc.calculated.maxMp;
          if (newCoc.calculated.san !== undefined) c.san = newCoc.calculated.san;
          if (newCoc.calculated.maxSan !== undefined) c.maxSan = newCoc.calculated.maxSan;
          if (newCoc.calculated.armor !== undefined) c.armor = newCoc.calculated.armor;
        }
        if (newCoc.stats) {
          if (newCoc.stats.dex !== undefined) c.dex = newCoc.stats.dex;
          if (newCoc.stats.str !== undefined) c.str = newCoc.stats.str;
          if (newCoc.stats.con !== undefined) c.con = newCoc.stats.con;
          if (newCoc.stats.pow !== undefined) c.pow = newCoc.stats.pow;
          if (newCoc.stats.siz !== undefined) c.siz = newCoc.stats.siz;
          if (newCoc.stats.int !== undefined) c.int = newCoc.stats.int;
          if (newCoc.stats.app !== undefined) c.app = newCoc.stats.app;
          if (newCoc.stats.edu !== undefined) c.edu = newCoc.stats.edu;
          if (newCoc.stats.luk !== undefined) c.luk = newCoc.stats.luk;
        }
        if (newCoc.skills) {
          c.skills = { ...(c.skills || {}), ...newCoc.skills };
        }
        c.cocPanel = newCoc;
        if (typeof window.syncCombatantToRealCard === "function") {
          window.syncCombatantToRealCard(chat, c);
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
  };

  // 辅助函数：严格匹配指定角色
  const findTargetCharacter = (explicitTargetName) => {
    let q = "";
    if (explicitTargetName && typeof explicitTargetName === "string" && explicitTargetName.trim()) {
      q = explicitTargetName.trim().replace(/^[&@]|^(?:角色[:：])|^(?:目标[:：])/, "").trim().toLowerCase();
    }
    if (!q) return null;

    // 1. 优先在当前战斗参战列表中完全匹配
    const combatState = (typeof window.getCombatState === "function") ? window.getCombatState(chat) : (chat.combatState || null);
    if (combatState && Array.isArray(combatState.combatants) && combatState.combatants.length > 0) {
      const foundCombatant = combatState.combatants.find(c => {
        const cn = (c.name || "").toLowerCase().trim();
        const cid = (c.id || "").toLowerCase().trim();
        return cn === q || cid === q;
      });
      if (foundCombatant) {
        return createCombatantWrapper(foundCombatant);
      }
    }

    // 2. 在群聊成员中完全匹配
    if (chat.isGroup && Array.isArray(chat.members)) {
      const found = chat.members.find(m => {
        const gn = (m.groupNickname || "").toLowerCase().trim();
        const on = (m.originalName || "").toLowerCase().trim();
        const id = (m.id || "").toLowerCase().trim();
        return gn === q || on === q || id === q;
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
            if (window.state?.chats && window.state.chats[found.id]) {
              if (!window.state.chats[found.id].settings) window.state.chats[found.id].settings = {};
              window.state.chats[found.id].settings.aiCocPanel = newCoc;
            }
          }
        };
      }
    }

    // 3. 检查是否为我/用户（完全匹配）
    const myNick = (chat.settings?.myNickname || "").toLowerCase().trim();
    const myName = (chat.settings?.myName || "").toLowerCase().trim();
    if (q === "我" || q === "自己" || q === "玩家" || q === "user" || q === "me" || (myNick && myNick === q) || (myName && myName === q)) {
      const userPanelData = chat.settings?.myCocPanel || (window.myCocPanel && typeof window.myCocPanel.getData === "function" ? window.myCocPanel.getData() : null) || (window.state?.chats && Object.values(window.state.chats).find(c => c.settings?.myCocPanel)?.settings?.myCocPanel) || (typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} });
      return {
        id: "user",
        name: chat.settings?.myNickname || chat.settings?.myName || "我",
        isUser: true,
        isProxy: true,
        cocPanel: userPanelData,
        onSave: (newCoc) => {
          if (!chat.settings) chat.settings = {};
          chat.settings.myCocPanel = newCoc;
          if (window.myCocPanel) window.myCocPanel.setData(newCoc);
        }
      };
    }

    // 4. 检查单聊中的AI（完全匹配）
    if (!chat.isGroup) {
      const aiName = (chat.name || "").toLowerCase().trim();
      const aiRemark = (chat.settings?.remarkName || "").toLowerCase().trim();
      if (aiName === q || aiRemark === q) {
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

    // 5. 检查全局联系人（完全匹配）
    if (window.state && window.state.chats) {
      const globalChar = Object.values(window.state.chats).find(c => {
        if (c.isGroup) return false;
        const cn = (c.name || "").toLowerCase().trim();
        const cr = (c.settings?.remarkName || "").toLowerCase().trim();
        return cn === q || cr === q;
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

    return null;
  };

  // 目标解析函数：未显式指定角色名或未匹配到外部角色时，默认针对指令发送者本人
  const resolveTarget = (explicitTargetName) => {
    if (explicitTargetName) {
      const found = findTargetCharacter(explicitTargetName);
      if (found) return found;
    }

    // 检查发送者是否在战斗参战者中
    const combatState = (typeof window.getCombatState === "function") ? window.getCombatState(chat) : (chat.combatState || null);
    if (combatState && Array.isArray(combatState.combatants) && combatState.combatants.length > 0) {
      const foundSenderCombatant = combatState.combatants.find(c => {
        const cn = (c.name || "").toLowerCase().trim();
        const cid = (c.id || "").toLowerCase().trim();
        const sid = (defaultSenderId || "").toLowerCase().trim();
        const sn = (defaultSenderName || "").toLowerCase().trim();
        return (c.isUser && defaultSenderId === "user") || (cid && cid === sid) || (cn && cn === sn);
      });
      if (foundSenderCombatant) {
        return createCombatantWrapper(foundSenderCombatant);
      }
    }

    // 默认针对指令发送者本人
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
          if (window.state?.chats && window.state.chats[mem.id]) {
            if (!window.state.chats[mem.id].settings) window.state.chats[mem.id].settings = {};
            window.state.chats[mem.id].settings.aiCocPanel = newCoc;
          }
        };
      }
    }

    if (!userCoc) {
      if (defaultSenderId === "user" || defaultSenderName === (chat.settings?.myNickname || chat.settings?.myName || "我")) {
        userCoc = chat.settings?.myCocPanel || (window.myCocPanel && typeof window.myCocPanel.getData === "function" ? window.myCocPanel.getData() : null) || (window.state?.chats && Object.values(window.state.chats).find(c => c.settings?.myCocPanel)?.settings?.myCocPanel) || (typeof getDefaultCocData === "function" ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} });
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

  // 单条指令执行器
  const executeSingleCmd = (cmdLine) => {
    if (!cmdLine || typeof cmdLine !== "string") return null;
    const cleanCmd = cmdLine.trim();

    // 1. 技能/属性检定 .ra [角色名] 技能名 [临时数值] [b/p] 或 .ra 技能名 或 .ra 属性 临时数值 或 .ra 临时数值 或 .rc
    const raMatch = cleanCmd.match(/^(?:ra|rc|check)(?:([^\s\d\+\-\*\/][^\s]*))?(?:\s+(.+))?$/i);
    if (raMatch) {
      let attached = raMatch[1] ? raMatch[1].trim() : "";
      let restParams = raMatch[2] ? raMatch[2].trim() : "";
      let target = null;
      let skillName = "";
      let targetValOverride = null;
      let bpMod = "";

      if (attached) {
        const charFound = findTargetCharacter(attached);
        if (charFound) {
          target = charFound;
          if (restParams) {
            const parts = restParams.split(/\s+/).filter(Boolean);
            skillName = parts[0] || "检定";
            for (const p of parts.slice(1)) {
              if (/^[+-]?\d+$/.test(p)) targetValOverride = parseInt(p, 10);
              else if (/^[bp]\d*$/i.test(p)) bpMod = p;
            }
          } else {
            skillName = "检定";
          }
        } else {
          target = resolveTarget(null); // 不带人名，默认发送者
          skillName = attached;
          if (restParams) {
            const parts = restParams.split(/\s+/).filter(Boolean);
            for (const p of parts) {
              if (/^[+-]?\d+$/.test(p)) targetValOverride = parseInt(p, 10);
              else if (/^[bp]\d*$/i.test(p)) bpMod = p;
            }
          }
        }
      } else if (restParams) {
        const parts = restParams.split(/\s+/).filter(Boolean);
        if (parts.length > 0) {
          // 显式前缀如 @张三、角色:张三
          if (/^[&@]|^(?:角色[:：])|^(?:目标[:：])/.test(parts[0])) {
            const charFound = findTargetCharacter(parts[0]);
            target = charFound || resolveTarget(null);
            const remaining = parts.slice(1);
            skillName = remaining[0] || "检定";
            for (const p of remaining.slice(1)) {
              if (/^[+-]?\d+$/.test(p)) targetValOverride = parseInt(p, 10);
              else if (/^[bp]\d*$/i.test(p)) bpMod = p;
            }
          } else if (parts.length >= 2 && findTargetCharacter(parts[0])) {
            // 第一个参数是已存在的角色名
            target = findTargetCharacter(parts[0]);
            skillName = parts[1];
            for (const p of parts.slice(2)) {
              if (/^[+-]?\d+$/.test(p)) targetValOverride = parseInt(p, 10);
              else if (/^[bp]\d*$/i.test(p)) bpMod = p;
            }
          } else {
            // 第一个参数不是角色名（如 .ra 力量、.ra 力量 60、.ra 侦查 b1、.ra 60）
            target = resolveTarget(null); // 默认发送者本人
            if (/^\d+$/.test(parts[0])) {
              skillName = "检定";
              targetValOverride = parseInt(parts[0], 10);
              if (parts[1] && /^[bp]\d*$/i.test(parts[1])) bpMod = parts[1];
            } else {
              skillName = parts[0];
              for (const p of parts.slice(1)) {
                if (/^[+-]?\d+$/.test(p)) targetValOverride = parseInt(p, 10);
                else if (/^[bp]\d*$/i.test(p)) bpMod = p;
              }
            }
          }
        }
      } else {
        target = resolveTarget(null);
        skillName = "检定";
      }

      if (!target) target = resolveTarget(null);

      if (target) {
        let userCoc = target.cocPanel;
        if (!userCoc || !userCoc.skills || Object.keys(userCoc.skills).length === 0) {
          if (target.isUser || target.id === "user") {
            userCoc = (senderInfo && senderInfo.cocPanel) || chat.settings?.myCocPanel || (window.myCocPanel && typeof window.myCocPanel.getData === "function" ? window.myCocPanel.getData() : null) || (window.state?.chats && Object.values(window.state.chats).find(c => c.settings?.myCocPanel)?.settings?.myCocPanel);
          } else if (chat.isGroup && Array.isArray(chat.members)) {
            const mem = chat.members.find(m => m.id === target.id || m.groupNickname === target.name || m.originalName === target.name);
            if (mem && mem.cocPanel) userCoc = mem.cocPanel;
          }
          if (!userCoc && chat.settings?.aiCocPanel) {
            userCoc = chat.settings.aiCocPanel;
          }
        }
        if (!userCoc) userCoc = (typeof getDefaultCocData === "function") ? getDefaultCocData() : { stats: {}, skills: {}, calculated: {} };
        if (!userCoc.stats) userCoc.stats = {};
        if (!userCoc.skills || Object.keys(userCoc.skills).length === 0) {
          const defData = (typeof getDefaultCocData === "function") ? getDefaultCocData() : { skills: {} };
          userCoc.skills = { ...(defData.skills || {}), ...(userCoc.skills || {}) };
        }

        let skillVal = null;
        if (targetValOverride !== null && !isNaN(targetValOverride)) {
          skillVal = targetValOverride;
        } else {
          skillVal = resolveCocSkillOrStat(userCoc, skillName);
        }

        if (isNaN(skillVal) || skillVal === null) skillVal = 50;

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

    // 3.5 属性/技能录入与修改 .st [角色名] 属性1 50 属性2 60 ... / .st 甲 hp 13 敏捷 50 / .st 角色名 hp-5 / .st 力量60敏捷70
    const stMatch = cleanCmd.match(/^st(?:\s+([\s\S]+)|([^\s\d\+\-\=:]+[\s\S]*)|$)/i);
    if (stMatch) {
      const fullStContent = (stMatch[1] || stMatch[2] || "").trim();
      if (fullStContent) {
        let target = null;
        let attrBody = fullStContent;

        const tokens = fullStContent.split(/\s+/).filter(Boolean);
        if (tokens.length > 0) {
          const firstToken = tokens[0];
          // 显式符号如 &甲、@甲、角色:甲
          if (/^[&@]|^(?:角色[:：])|^(?:目标[:：])/.test(firstToken)) {
            const charFound = findTargetCharacter(firstToken);
            target = charFound || resolveTarget(null);
            attrBody = tokens.slice(1).join(" ");
          } else if (tokens.length > 1 && findTargetCharacter(firstToken)) {
            target = findTargetCharacter(firstToken);
            attrBody = tokens.slice(1).join(" ");
          } else {
            target = resolveTarget(null); // 不带角色名时默认谁发的谁录入修改
            attrBody = fullStContent;
          }
        } else {
          target = resolveTarget(null);
        }

        if (!target) target = resolveTarget(null);
        const userCoc = target.cocPanel || { stats: {}, skills: {}, calculated: {} };

        if (!userCoc.stats) userCoc.stats = {};
        if (!userCoc.calculated) userCoc.calculated = {};
        if (!userCoc.skills) userCoc.skills = {};

        // 正则匹配任意数量的属性项：支持 hp 13、力量 60、hp=13、hp-5、+hp 5、力量60敏捷70
        const regex = /(?:([\+\-])\s*([a-zA-Z\u4e00-\u9fa5]+)\s*(\d+))|([a-zA-Z\u4e00-\u9fa5]+)\s*([\+\-\=:])?\s*(\d+)/g;
        let match;
        const changes = [];
        let statsChanged = false;

        while ((match = regex.exec(attrBody)) !== null) {
          let key, op, val;
          if (match[1]) {
            op = match[1];
            key = match[2].trim();
            val = parseInt(match[3], 10) || 0;
          } else {
            key = match[4].trim();
            op = match[5] || "=";
            val = parseInt(match[6], 10) || 0;
          }

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
              if (mappedKey === "hp") {
                const maxHp = (userCoc.calculated && typeof userCoc.calculated.maxHp === "number")
                  ? userCoc.calculated.maxHp
                  : Math.max(1, Math.floor(((userCoc.stats.con || 50) + (userCoc.stats.siz || 50)) / 10));
                userCoc.calculated.hp = Math.min(maxHp, Math.max(0, newVal));
              } else if (mappedKey === "mp") {
                const maxMp = (userCoc.calculated && typeof userCoc.calculated.maxMp === "number")
                  ? userCoc.calculated.maxMp
                  : Math.max(0, Math.floor((userCoc.stats.pow || 50) / 5));
                userCoc.calculated.mp = Math.min(maxMp, Math.max(0, newVal));
              } else if (mappedKey === "san") {
                userCoc.calculated.san = Math.min(99, Math.max(0, newVal));
              } else {
                userCoc.calculated[mappedKey] = Math.max(0, newVal);
              }
              const label = mappedKey === "armor" ? "护甲" : mappedKey.toUpperCase();
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
          const text = formatDiceTemplate(templates.st || DEFAULT_DICE_TEMPLATES.st, {
            角色名: target.name,
            变更列表: changes.join(" | ")
          });
          return { handled: true, text, persistChat: true };
        }
      }
    }

    // 4. 理智检定 .sc [角色名] 成功/失败 或 .sc 成功/失败
    const scMatch = cleanCmd.match(/^sc(?:\s+([\s\S]+)|([^\s\d\/]+[\s\S]*)|$)/i);
    if (scMatch) {
      const fullSc = (scMatch[1] || scMatch[2] || "").trim();
      let target = null;
      let scExpr = fullSc;

      const tokens = fullSc.split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        if (/^[&@]|^(?:角色[:：])|^(?:目标[:：])/.test(tokens[0])) {
          target = findTargetCharacter(tokens[0]) || resolveTarget(null);
          scExpr = tokens.slice(1).join(" ");
        } else if (tokens.length > 1 && findTargetCharacter(tokens[0])) {
          target = findTargetCharacter(tokens[0]);
          scExpr = tokens.slice(1).join(" ");
        } else {
          target = resolveTarget(null);
          scExpr = fullSc;
        }
      } else {
        target = resolveTarget(null);
      }

      const slashMatch = scExpr.match(/^([^\/]+)\/([^\s]+)/);
      if (slashMatch) {
        if (!target) target = resolveTarget(null);
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
        if (typeof window.syncCombatantStatsFromCoc === "function") {
          window.syncCombatantStatsFromCoc(chat, target.id, target.name, userCoc);
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

    // 5. HP 调整指令 .hp [角色名] -3 或 .hp -3
    const hpMatch = cleanCmd.match(/^hp(?:\s+([\s\S]+)|([^\s\d\+\-]+[\s\S]*)|$)/i);
    if (hpMatch) {
      const fullHp = (hpMatch[1] || hpMatch[2] || "").trim();
      let target = null;
      let deltaStr = fullHp;

      const tokens = fullHp.split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        if (/^[&@]|^(?:角色[:：])|^(?:目标[:：])/.test(tokens[0])) {
          target = findTargetCharacter(tokens[0]) || resolveTarget(null);
          deltaStr = tokens.slice(1).join(" ");
        } else if (tokens.length > 1 && findTargetCharacter(tokens[0])) {
          target = findTargetCharacter(tokens[0]);
          deltaStr = tokens.slice(1).join(" ");
        } else {
          target = resolveTarget(null);
          deltaStr = fullHp;
        }
      } else {
        target = resolveTarget(null);
      }

      const numMatch = deltaStr.match(/^([+-]?\d+)/);
      if (numMatch) {
        if (!target) target = resolveTarget(null);
        const userCoc = target.cocPanel || { stats: {}, skills: {}, calculated: {} };

        const delta = parseInt(numMatch[1], 10);
        const currentHp = (userCoc.calculated && typeof userCoc.calculated.hp === "number") ? userCoc.calculated.hp : 10;
        const maxHp = (userCoc.calculated && typeof userCoc.calculated.maxHp === "number") ? userCoc.calculated.maxHp : 10;
        let newHp = currentHp;
        if (deltaStr.startsWith("+") || deltaStr.startsWith("-")) {
          newHp = Math.max(0, Math.min(maxHp, currentHp + delta));
        } else {
          newHp = Math.max(0, Math.min(maxHp, delta));
        }

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

    // 5.5 MP 调整指令 .mp [角色名] -2 或 .mp -2
    const mpMatch = cleanCmd.match(/^mp(?:\s+([\s\S]+)|([^\s\d\+\-]+[\s\S]*)|$)/i);
    if (mpMatch) {
      const fullMp = (mpMatch[1] || mpMatch[2] || "").trim();
      let target = null;
      let deltaStr = fullMp;

      const tokens = fullMp.split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        if (/^[&@]|^(?:角色[:：])|^(?:目标[:：])/.test(tokens[0])) {
          target = findTargetCharacter(tokens[0]) || resolveTarget(null);
          deltaStr = tokens.slice(1).join(" ");
        } else if (tokens.length > 1 && findTargetCharacter(tokens[0])) {
          target = findTargetCharacter(tokens[0]);
          deltaStr = tokens.slice(1).join(" ");
        } else {
          target = resolveTarget(null);
          deltaStr = fullMp;
        }
      } else {
        target = resolveTarget(null);
      }

      const numMatch = deltaStr.match(/^([+-]?\d+)/);
      if (numMatch) {
        if (!target) target = resolveTarget(null);
        const userCoc = target.cocPanel || { stats: {}, skills: {}, calculated: {} };

        const delta = parseInt(numMatch[1], 10);
        const currentMp = (userCoc.calculated && typeof userCoc.calculated.mp === "number") ? userCoc.calculated.mp : 10;
        const maxMp = (userCoc.calculated && typeof userCoc.calculated.maxMp === "number") ? userCoc.calculated.maxMp : 10;
        let newMp = currentMp;
        if (deltaStr.startsWith("+") || deltaStr.startsWith("-")) {
          newMp = Math.max(0, Math.min(maxMp, currentMp + delta));
        } else {
          newMp = Math.max(0, Math.min(maxMp, delta));
        }

        if (!userCoc.calculated) userCoc.calculated = {};
        userCoc.calculated.mp = newMp;

        if (!(isKeeperRole && !target.isProxy)) {
          if (typeof target.onSave === "function") {
            target.onSave(userCoc);
          }
        }
        if (typeof window.syncCombatantStatsFromCoc === "function") {
          window.syncCombatantStatsFromCoc(chat, target.id, target.name, userCoc);
        }

        const text = formatDiceTemplate(templates.mp || DEFAULT_DICE_TEMPLATES.mp, {
          角色名: target.name,
          旧MP: currentMp,
          新MP: newMp
        });
        return { handled: true, text, persistChat: true };
      }
    }

    // 5.6 SAN 调整指令 .san [角色名] -5 或 .san -5
    const sanMatch = cleanCmd.match(/^san(?:\s+([\s\S]+)|([^\s\d\+\-]+[\s\S]*)|$)/i);
    if (sanMatch) {
      const fullSan = (sanMatch[1] || sanMatch[2] || "").trim();
      let target = null;
      let deltaStr = fullSan;

      const tokens = fullSan.split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        if (/^[&@]|^(?:角色[:：])|^(?:目标[:：])/.test(tokens[0])) {
          target = findTargetCharacter(tokens[0]) || resolveTarget(null);
          deltaStr = tokens.slice(1).join(" ");
        } else if (tokens.length > 1 && findTargetCharacter(tokens[0])) {
          target = findTargetCharacter(tokens[0]);
          deltaStr = tokens.slice(1).join(" ");
        } else {
          target = resolveTarget(null);
          deltaStr = fullSan;
        }
      } else {
        target = resolveTarget(null);
      }

      const numMatch = deltaStr.match(/^([+-]?\d+)/);
      if (numMatch) {
        if (!target) target = resolveTarget(null);
        const userCoc = target.cocPanel || { stats: {}, skills: {}, calculated: {} };

        const delta = parseInt(numMatch[1], 10);
        const currentSan = (userCoc.calculated && typeof userCoc.calculated.san === "number") ? userCoc.calculated.san : 50;
        const maxSan = (userCoc.calculated && typeof userCoc.calculated.maxSan === "number") ? userCoc.calculated.maxSan : 99;
        let newSan = currentSan;
        if (deltaStr.startsWith("+") || deltaStr.startsWith("-")) {
          newSan = Math.max(0, Math.min(maxSan, currentSan + delta));
        } else {
          newSan = Math.max(0, Math.min(maxSan, delta));
        }

        if (!userCoc.calculated) userCoc.calculated = {};
        userCoc.calculated.san = newSan;

        if (!(isKeeperRole && !target.isProxy)) {
          if (typeof target.onSave === "function") {
            target.onSave(userCoc);
          }
        }
        if (typeof window.syncCombatantStatsFromCoc === "function") {
          window.syncCombatantStatsFromCoc(chat, target.id, target.name, userCoc);
        }

        const text = formatDiceTemplate(templates.san || DEFAULT_DICE_TEMPLATES.san, {
          角色名: target.name,
          旧SAN: currentSan,
          新SAN: newSan
        });
        return { handled: true, text, persistChat: true };
      }
    }

    // 6. 成长检定 .en [角色名] 技能名 或 .en 技能名
    const enMatch = cleanCmd.match(/^en(?:\s+([\s\S]+)|([^\s\d\+\-]+[\s\S]*)|$)/i);
    if (enMatch) {
      const fullEn = (enMatch[1] || enMatch[2] || "").trim();
      let target = null;
      let skillName = fullEn;

      const tokens = fullEn.split(/\s+/).filter(Boolean);
      if (tokens.length > 0) {
        if (/^[&@]|^(?:角色[:：])|^(?:目标[:：])/.test(tokens[0])) {
          target = findTargetCharacter(tokens[0]) || resolveTarget(null);
          skillName = tokens.slice(1).join(" ");
        } else if (tokens.length > 1 && findTargetCharacter(tokens[0])) {
          target = findTargetCharacter(tokens[0]);
          skillName = tokens.slice(1).join(" ");
        } else {
          target = resolveTarget(null);
          skillName = fullEn;
        }
      } else {
        target = resolveTarget(null);
      }

      if (skillName) {
        if (!target) target = resolveTarget(null);
        const userCoc = target.cocPanel || { stats: {}, skills: {}, calculated: {} };

        let currentVal = (userCoc.skills && typeof userCoc.skills[skillName] !== "undefined")
          ? parseInt(userCoc.skills[skillName], 10)
          : (typeof getSkillBaseValue === "function" ? getSkillBaseValue(skillName, userCoc.stats) : 50);

        const rollVal = Math.floor(Math.random() * 100) + 1;
        let growthNum = 0;
        const isSuccess = rollVal > currentVal || rollVal > 95;
        if (isSuccess) {
          growthNum = Math.floor(Math.random() * 10) + 1;
          const newVal = currentVal + growthNum;
          if (!userCoc.skills) userCoc.skills = {};
          userCoc.skills[skillName] = newVal;

          if (!(isKeeperRole && !target.isProxy)) {
            if (typeof target.onSave === "function") {
              target.onSave(userCoc);
            }
          }

          const text = formatDiceTemplate(templates.growth || DEFAULT_DICE_TEMPLATES.growth, {
            角色名: target.name,
            技能: skillName,
            结果: rollVal,
            技能数值: currentVal,
            成功等级: "成功"
          });
          return { handled: true, text, persistChat: true };
        } else {
          const text = formatDiceTemplate(templates.growth || DEFAULT_DICE_TEMPLATES.growth, {
            角色名: target.name,
            技能: skillName,
            结果: rollVal,
            技能数值: currentVal,
            成功等级: "失败"
          });
          return { handled: true, text };
        }
      }
    }

    // 7. 短期疯狂发作 .ti [角色名] 或 .ti / .li
    const tiMatch = cleanCmd.match(/^(?:ti|li)(?:\s+([\s\S]+)|([^\s\d\+\-]+[\s\S]*)|$)/i);
    if (tiMatch) {
      const rawT = (tiMatch[1] || tiMatch[2] || "").trim();
      const target = (rawT && findTargetCharacter(rawT)) ? findTargetCharacter(rawT) : resolveTarget(null);
      const randIdx = Math.floor(Math.random() * COC_SHORT_TERM_INSANITY.length);
      const symptom = COC_SHORT_TERM_INSANITY[randIdx];
      const text = formatDiceTemplate(templates.ti || DEFAULT_DICE_TEMPLATES.ti, {
        角色名: target.name,
        疯狂症状: symptom
      });
      return { handled: true, text };
    }

    // 8. 属性生成 .coc 与 .coc5 (支持指定登记目标)
    const cocMatch = cleanCmd.match(/^coc(5)?(?:\s+([\s\S]+)|([^\s\d\+\-]+[\s\S]*)|$)/i);
    if (cocMatch) {
      const isFive = cocMatch[1] === "5";
      const rawTarget = (cocMatch[2] || cocMatch[3] || "").trim();
      const target = (rawTarget && findTargetCharacter(rawTarget)) ? findTargetCharacter(rawTarget) : resolveTarget(null);

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

    // 9. 暗骰 .rh [角色名] [xdy] 或 .rh xdy 或 .rh
    const rhMatch = cleanCmd.match(/^rh(?:\s+([\s\S]+)|$)/i);
    if (rhMatch) {
      let rawRest = (rhMatch[1] || "").trim();
      let target = null;
      let subExpr = "1d100";

      if (rawRest) {
        const parts = rawRest.split(/\s+/).filter(Boolean);
        if (parts.length > 1 && findTargetCharacter(parts[0])) {
          target = findTargetCharacter(parts[0]);
          subExpr = parts.slice(1).join(" ") || "1d100";
        } else if (parts.length === 1 && findTargetCharacter(parts[0]) && !/^\d*d\d+/i.test(parts[0]) && !/^\d+$/.test(parts[0])) {
          target = findTargetCharacter(parts[0]);
          subExpr = "1d100";
        } else {
          target = resolveTarget(null);
          subExpr = rawRest;
        }
      } else {
        target = resolveTarget(null);
      }

      if (!target) target = resolveTarget(null);
      const res = rollDiceExpression(subExpr);
      const text = `${formatDiceTemplate(templates.secret || DEFAULT_DICE_TEMPLATES.secret, { 角色名: target.name })} 点数已密掷`;
      return { handled: true, text };
    }

    // 10. 普通掷骰 .r / .rd 或 .r xdy 或 .rd6 或 .r1d6 或 .r2d6 或 .r 2d6+5 或 .r 角色名 xdy
    const rMatch = cleanCmd.match(/^(?:r|rd)(?:\s*([\s\S]*))$/i);
    if (rMatch) {
      let rawRest = (rMatch[1] || "").trim();
      let target = null;
      let expr = "1d100";

      if (!rawRest) {
        target = resolveTarget(null);
        expr = "1d100";
      } else {
        const parts = rawRest.split(/\s+/).filter(Boolean);
        if (parts.length >= 2 && findTargetCharacter(parts[0])) {
          target = findTargetCharacter(parts[0]);
          expr = parts.slice(1).join(" ") || "1d100";
        } else if (parts.length === 1 && findTargetCharacter(parts[0]) && !/^\d*d\d+/i.test(parts[0]) && !/^\d+$/.test(parts[0])) {
          target = findTargetCharacter(parts[0]);
          expr = "1d100";
        } else {
          target = resolveTarget(null);
          expr = rawRest;
        }
      }

      if (!target) target = resolveTarget(null);

      const res = rollDiceExpression(expr);
      const text = formatDiceTemplate(templates.roll || DEFAULT_DICE_TEMPLATES.roll, {
        角色名: target.name,
        表达式: expr,
        结果: res.total
      });
      return { handled: true, text };
    }

    // 11. 今日人品 .jrrp [角色名]
    const jrrpMatch = cleanCmd.match(/^jrrp(?:\s+([\s\S]+)|$)/i);
    if (jrrpMatch) {
      const rawTarget = (jrrpMatch[1] || "").trim();
      const target = (rawTarget && findTargetCharacter(rawTarget)) ? findTargetCharacter(rawTarget) : resolveTarget(null);
      const luckVal = Math.floor(Math.random() * 100) + 1;
      let comment = "今天也是充满希望的一天！";
      if (luckVal >= 90) comment = "大吉！运势爆棚，诸事顺遂！";
      else if (luckVal >= 70) comment = "吉！今天运气相当不错！";
      else if (luckVal >= 50) comment = "中平，保持平常心即可。";
      else if (luckVal >= 30) comment = "凶，行事需多加小心。";
      else comment = "大凶！今日不宜剧烈行动，万事求稳！";
      const text = formatDiceTemplate(templates.jrrp || DEFAULT_DICE_TEMPLATES.jrrp, {
        角色名: target.name,
        人品值: luckVal,
        运势评语: comment
      });
      return { handled: true, text };
    }

    // 12. DND5E 属性生成 .dnd / .dnd5 [角色名]
    const dndMatch = cleanCmd.match(/^dnd(?:5)?(?:\s+([\s\S]+)|$)/i);
    if (dndMatch) {
      const rawTarget = (dndMatch[1] || "").trim();
      const target = (rawTarget && findTargetCharacter(rawTarget)) ? findTargetCharacter(rawTarget) : resolveTarget(null);
      const roll4d6k3 = () => {
        const rolls = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        rolls.sort((a, b) => a - b);
        return rolls[1] + rolls[2] + rolls[3];
      };
      const stats = {
        力量: roll4d6k3(),
        敏捷: roll4d6k3(),
        体质: roll4d6k3(),
        智力: roll4d6k3(),
        感知: roll4d6k3(),
        魅力: roll4d6k3()
      };
      const total = Object.values(stats).reduce((a, b) => a + b, 0);
      const statLines = Object.entries(stats).map(([k, v]) => `${k}:${v}`).join(" | ");
      const text = formatDiceTemplate(templates.dnd || DEFAULT_DICE_TEMPLATES.dnd, {
        角色名: target.name,
        属性列表: statLines,
        总计: total
      });
      return { handled: true, text };
    }

    // 13. 规则速查 .rules / .rule [条目名]
    const rulesMatch = cleanCmd.match(/^rules?(?:\s+([\s\S]+)|$)/i);
    if (rulesMatch) {
      const q = (rulesMatch[1] || "").trim();
      let ruleContent = "";
      if (q) {
        const doc = COC7_RULEBOOK_COMMAND_DOCS.find(d => d.key.toLowerCase() === q.toLowerCase() || d.name.includes(q));
        if (doc) {
          ruleContent = `【${doc.name}】格式：${doc.syntax}\n${doc.desc}`;
        }
      }
      if (!ruleContent) {
        const summary = COC7_RULEBOOK_COMMAND_DOCS.map(d => `· ${d.name} (${d.syntax})`).join("\n");
        ruleContent = `${summary}\n输入 .rule 指令名 可查看详细规则。`;
      }
      const text = formatDiceTemplate(templates.rules || DEFAULT_DICE_TEMPLATES.rules, {
        规则内容: ruleContent
      });
      return { handled: true, text };
    }

    // 14. 帮助指南 .help / .bot
    const helpMatch = cleanCmd.match(/^(?:help|bot)(?:\s+([\s\S]+)|$)/i);
    if (helpMatch) {
      const helpContent = `· 掷骰：.r 1d100 / .r 2d6+5 / .r 3d6*5\n· 检定：.ra 技能名 / .ra 角色名 技能名 / .ra 技能名 b1\n· 属性：.st 力量60敏捷70 / .st hp-3\n· 理智：.sc 1/1d6 / .sc 0/1d4\n· 属性生成：.coc / .coc 5\n· 状态：.hp -3 / .mp -2 / .san -5\n· 成长：.en 侦查\n· 疯狂：.ti / .li\n· 运势：.jrrp\n· 规则：.rules\n· 天气：.w\n· 塔罗：.tarot`;
      const text = formatDiceTemplate(templates.help || DEFAULT_DICE_TEMPLATES.help, {
        帮助内容: helpContent
      });
      return { handled: true, text };
    }

    // 15. 天气抽取 .w / .weather [季节/月份]
    const weatherMatch = cleanCmd.match(/^(?:weather|w\b)(?:\s+([\s\S]+)|$)/i);
    if (weatherMatch) {
      const arg = (weatherMatch[1] || "").trim();
      const wRes = (typeof window.drawWeatherFromCurrentPool === "function") ? window.drawWeatherFromCurrentPool(arg) : { name: "晴天", note: "温和宜人", season: "春季" };
      const text = formatDiceTemplate(templates.weather || DEFAULT_DICE_TEMPLATES.weather, {
        季节: wRes.season,
        天气名称: wRes.name,
        天气描述: wRes.note || "适宜行动"
      });
      return { handled: true, text };
    }

    // 16. 塔罗抽取 .tarot / .draw
    const tarotMatch = cleanCmd.match(/^(?:tarot|draw)(?:\s+([\s\S]+)|$)/i);
    if (tarotMatch) {
      const target = resolveTarget(null);
      const TAROT_CARDS = ["愚者(0)", "魔术师(I)", "女祭司(II)", "女皇(III)", "皇帝(IV)", "教皇(V)", "恋人(VI)", "战车(VII)", "力量(VIII)", "隐士(IX)", "命运之轮(X)", "正义(XI)", "倒吊人(XII)", "死神(XIII)", "节制(XIV)", "恶魔(XV)", "塔(XVI)", "星星(XVII)", "月亮(XVIII)", "太阳(XIX)", "审判(XX)", "世界(XXI)"];
      const card = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
      const orientation = Math.random() > 0.5 ? "正位" : "逆位";
      const text = formatDiceTemplate(templates.tarot || DEFAULT_DICE_TEMPLATES.tarot, {
        角色名: target.name,
        卡牌: card,
        正逆位: orientation
      });
      return { handled: true, text };
    }

    return null;
  };

  // 批量遍历执行提取到的所有指令
  const results = [];
  let combinedHtml = "";
  let anyPersist = false;

  for (const cmd of rawCmds) {
    const res = executeSingleCmd(cmd);
    if (res && res.handled) {
      results.push(res.text);
      if (res.html) combinedHtml += res.html;
      if (res.persistChat) anyPersist = true;
    }
  }

  if (results.length > 0) {
    return {
      handled: true,
      text: results.join("\n"),
      html: combinedHtml || null,
      persistChat: anyPersist
    };
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

function parseImportedDiceTemplates(text) {
  if (!text || typeof text !== "string") return {};
  const trimmed = text.trim();
  const result = {};

  // 1. 尝试直接作为 JSON 解析
  try {
    const jsonParsed = JSON.parse(trimmed);
    if (jsonParsed && typeof jsonParsed === "object") {
      const src = jsonParsed.templates || jsonParsed;
      for (const [k, v] of Object.entries(src)) {
        if (typeof v === "string") {
          result[k] = v;
        }
      }
      if (Object.keys(result).length > 0) return result;
    }
  } catch (e) {}

  // 2. 按行文本与 Markdown 解析
  const KEY_NAME_MAP = {
    "普通掷骰": "roll", "掷骰": "roll", "roll": "roll", "r": "roll",
    "技能检定": "check", "检定": "check", "check": "check", "ra": "check", "rc": "check",
    "属性修改": "st", "属性录入": "st", "st": "st",
    "理智检定": "sc", "理智": "sc", "sc": "sc",
    "成长检定": "growth", "成长": "growth", "growth": "growth", "en": "growth",
    "疯狂发作": "ti", "临时疯狂": "ti", "疯狂": "ti", "ti": "ti", "li": "ti",
    "暗骰投掷": "secret", "暗骰": "secret", "secret": "secret", "rh": "secret",
    "生命调整": "hp", "生命": "hp", "hp": "hp",
    "魔法调整": "mp", "魔法": "mp", "mp": "mp",
    "理智调整": "san", "san值": "san", "san": "san",
    "属性生成": "coc", "人物生成": "coc", "coc": "coc", "coc7": "coc",
    "多组生成": "coc5", "五组生成": "coc5", "coc5": "coc5",
    "今日人品": "jrrp", "人品": "jrrp", "运势": "jrrp", "jrrp": "jrrp",
    "dnd属性": "dnd", "dnd": "dnd", "dnd5": "dnd",
    "天气抽取": "weather", "天气": "weather", "weather": "weather", "w": "weather",
    "塔罗抽取": "tarot", "塔罗": "tarot", "tarot": "tarot", "draw": "tarot",
    "规则速查": "rules", "规则": "rules", "rules": "rules", "rule": "rules",
    "帮助指南": "help", "帮助": "help", "help": "help", "bot": "help"
  };

  const lines = trimmed.split(/\r?\n/);
  for (const line of lines) {
    const l = line.trim().replace(/^[-*•\d.]+\s*/, "");
    if (!l) continue;
    const match = l.match(/^["']?([^:：=]+?)["']?\s*[:：=]\s*["']?([\s\S]+?)["']?$/);
    if (match) {
      const rawK = match[1].trim().toLowerCase();
      const rawV = match[2].trim();
      const targetK = KEY_NAME_MAP[rawK] || KEY_NAME_MAP[match[1].trim()];
      if (targetK && rawV) {
        result[targetK] = rawV;
      }
    }
  }

  return result;
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
      <div style="display: flex; gap: 4px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
        <button type="button" id="cmd-new-preset-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 8px; font-size: 11px;">新建</button>
        <button type="button" id="cmd-saveas-preset-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 8px; font-size: 11px;">另存</button>
        <button type="button" id="cmd-save-preset-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 8px; font-size: 11px;">保存</button>
        <button type="button" id="cmd-export-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 8px; font-size: 11px;">导出</button>
        <button type="button" id="cmd-import-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 8px; font-size: 11px;">导入</button>
        <button type="button" id="cmd-ai-prompt-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 8px; font-size: 11px; color: var(--accent-color); font-weight: 600;">提示</button>
        <button type="button" id="cmd-del-preset-btn" class="moe-btn-mini" style="height: 26px; padding: 2px 8px; font-size: 11px; color: var(--tukey-accent-red, #ff4d4f);">删除</button>
      </div>
      <input type="file" id="cmd-file-import-input" accept=".json,.txt,.docx" style="display: none;">
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
    if (!activePreset.templates) activePreset.templates = {};
    const inputs = container.querySelectorAll(".cmd-template-input");
    inputs.forEach(input => {
      const k = input.dataset.key;
      activePreset.templates[k] = input.value.trim();
    });
    const pIdx = presets.findIndex(p => p.id === activePreset.id);
    if (pIdx !== -1) {
      presets[pIdx] = activePreset;
    } else {
      presets.push(activePreset);
    }
    saveStoredDicePresets(presets);
    localStorage.setItem("coc_active_dice_preset_id", activePreset.id);
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

  // 导出预设
  document.getElementById("cmd-export-btn").onclick = () => {
    const curTemplates = {};
    container.querySelectorAll(".cmd-template-input").forEach(inp => {
      curTemplates[inp.dataset.key] = inp.value.trim();
    });
    const exportData = {
      name: activePreset.name,
      templates: curTemplates,
      exportTime: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activePreset.name}_播报预设.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导入预设
  const fileInput = document.getElementById("cmd-file-import-input");
  document.getElementById("cmd-import-btn").onclick = () => {
    if (fileInput) fileInput.click();
  };

  fileInput.onchange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    let textContent = "";
    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        if (window.mammoth && typeof window.mammoth.extractRawText === "function") {
          const mRes = await window.mammoth.extractRawText({ arrayBuffer });
          textContent = mRes.value || "";
        } else if (window.JSZip) {
          const zip = await window.JSZip.loadAsync(arrayBuffer);
          const docXml = zip.file("word/document.xml");
          if (docXml) {
            const xmlText = await docXml.async("text");
            textContent = xmlText.replace(/<[^>]+>/g, "\n");
          }
        }
      } else {
        textContent = await file.text();
      }

      const importedTemplates = parseImportedDiceTemplates(textContent);
      const keysCount = Object.keys(importedTemplates).length;
      if (keysCount === 0) {
        if (typeof window.showCustomAlert === "function") {
          await window.showCustomAlert("导入提示", "未能在文件中解析到有效的指令播报式子，请检查文件格式。");
        } else {
          alert("未能在文件中解析到有效的指令播报式子，请检查文件格式。");
        }
        return;
      }

      if (!activePreset.templates) activePreset.templates = {};
      Object.assign(activePreset.templates, importedTemplates);

      const pIdx = presets.findIndex(p => p.id === activePreset.id);
      if (pIdx !== -1) presets[pIdx] = activePreset;
      saveStoredDicePresets(presets);

      if (typeof window.showCustomAlert === "function") {
        await window.showCustomAlert("导入成功", `已成功导入并更新了 ${keysCount} 项播报式子！`);
      } else {
        alert(`已成功导入并更新了 ${keysCount} 项播报式子！`);
      }
      renderCommandsTab(container);
    } catch (err) {
      console.error("导入文件失败:", err);
      if (typeof window.showCustomAlert === "function") {
        await window.showCustomAlert("导入失败", "解析文件出错: " + err.message);
      } else {
        alert("解析文件出错: " + err.message);
      }
    } finally {
      fileInput.value = "";
    }
  };

  // 提示功能：生成发送给AI的定制提示词，支持一键复制与快速导入
  document.getElementById("cmd-ai-prompt-btn").onclick = async () => {
    const aiPromptTemplate = `你是一个专业的 TRPG 跑团骰娘文案设计师。请为【请在此填写你的角色设定/性格风格，例如：傲娇女仆、病娇克系少女、冷酷KP、古风仙侠骰娘】设计一套专属的角色扮演播报式子。

请严格保留并使用以下每一项对应的占位符，按照 key: 播报文本 的格式输出：

1. 普通掷骰: {角色名} 骰出了: {表达式}={结果}
2. 技能检定: {角色名} 进行 {技能} 检定：D100={结果}/{技能数值} [{成功等级}]
3. 属性修改: {角色名} 修改属性成功：{变更列表}
4. 理智检定: {角色名} 的理智检定：D100={结果}/{SAN} [{成功等级}] 理智变化: {旧SAN}→{新SAN}
5. 生命调整: {角色名} 的 HP 变化: {旧HP}→{新HP}
6. 魔法调整: {角色名} 的 MP 变化: {旧MP}→{新MP}
7. 理智调整: {角色名} 的 SAN 变化: {旧SAN}→{新SAN}
8. 成长检定: {角色名} 进行 {技能} 成长检定：D100={结果}/{技能数值} [{成功等级}]
9. 疯狂发作: {角色名} 突发临时疯狂症状：{疯狂症状}
10. 暗骰投掷: 这是暗骰，结果仅 KP 可见
11. 今日人品: {角色名} 的今日人品值是: {人品值} [{运势评语}]
12. DND属性: {角色名} 生成了一组 DND 5E 属性：{属性列表} [总计:{总计}]
13. 天气抽取: 【天气播报】当前{季节}气候：{天气名称} [{天气描述}]
14. 塔罗抽取: {角色名} 抽取了塔罗牌：【{卡牌}】 [{正逆位}]
15. 规则速查: 【COC7 规则速查】\n{规则内容}
16. 帮助指南: 【骰娘指令帮助】\n{帮助内容}

你可以为每条播报添加符合角色口吻的语气词、颜文字或台词，但必须保留花括号内的所有占位符。`;

    const existingModal = document.getElementById("cmd-ai-prompt-modal");
    if (existingModal) existingModal.remove();

    const modalHtml = `
      <div id="cmd-ai-prompt-modal" class="modal visible" style="display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10000; padding: 14px;">
        <div class="modal-content" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; width: 100%; max-width: 480px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <div class="modal-header" style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; font-size: 14px; color: var(--text-primary);">AI 角色骰生成提示词</span>
            <button type="button" id="close-ai-prompt-modal-btn" style="background: none; border: none; font-size: 18px; color: var(--text-secondary); cursor: pointer;">✕</button>
          </div>
          <div class="modal-body" style="padding: 14px; overflow-y: auto; flex: 1; font-size: 12px; line-height: 1.5; color: var(--text-secondary);">
            <div style="margin-bottom: 8px; color: var(--text-primary); font-weight: 600;">步骤一：复制下方提示词发给 AI 生成播报词</div>
            <div style="position: relative; margin-bottom: 12px;">
              <textarea id="ai-prompt-copy-text" class="moe-input" rows="8" readonly style="width: 100%; box-sizing: border-box; font-size: 11px; font-family: monospace; padding: 8px; background: var(--secondary-bg); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; resize: vertical;">${aiPromptTemplate}</textarea>
              <button type="button" id="copy-ai-prompt-btn" class="moe-btn-mini" style="position: absolute; top: 8px; right: 8px; height: 24px; padding: 2px 8px; font-size: 11px; background: var(--accent-color); color: #ffffff; border: none;">复制提示词</button>
            </div>
            <div style="margin-bottom: 6px; color: var(--text-primary); font-weight: 600;">步骤二：将 AI 返回的内容粘贴在下方导入</div>
            <textarea id="ai-output-paste-text" class="moe-input" rows="5" placeholder="将 AI 生成的内容粘贴到这里，点击导入..." style="width: 100%; box-sizing: border-box; font-size: 11px; font-family: monospace; padding: 8px; background: var(--secondary-bg); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; resize: vertical;"></textarea>
          </div>
          <div class="modal-footer" style="padding: 10px 14px; border-top: 1px solid var(--border-color); display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" id="apply-ai-output-btn" class="module-btn-primary" style="height: 32px; padding: 0 16px; font-size: 12px; border-radius: 8px;">导入并应用</button>
            <button type="button" id="cancel-ai-prompt-modal-btn" class="module-btn-secondary" style="height: 32px; padding: 0 16px; font-size: 12px; border-radius: 8px;">关闭</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modalEl = document.getElementById("cmd-ai-prompt-modal");

    const closeModal = () => { if (modalEl) modalEl.remove(); };
    document.getElementById("close-ai-prompt-modal-btn").onclick = closeModal;
    document.getElementById("cancel-ai-prompt-modal-btn").onclick = closeModal;

    document.getElementById("copy-ai-prompt-btn").onclick = async () => {
      const copyBtn = document.getElementById("copy-ai-prompt-btn");
      try {
        await navigator.clipboard.writeText(aiPromptTemplate);
        copyBtn.textContent = "已复制";
        setTimeout(() => { copyBtn.textContent = "复制提示词"; }, 1500);
      } catch (err) {
        const ta = document.getElementById("ai-prompt-copy-text");
        ta.select();
        document.execCommand("copy");
        copyBtn.textContent = "已复制";
        setTimeout(() => { copyBtn.textContent = "复制提示词"; }, 1500);
      }
    };

    document.getElementById("apply-ai-output-btn").onclick = async () => {
      const pasteText = document.getElementById("ai-output-paste-text")?.value || "";
      if (!pasteText.trim()) {
        if (typeof window.showCustomAlert === "function") {
          await window.showCustomAlert("提示", "请先粘贴 AI 生成的内容");
        } else {
          alert("请先粘贴 AI 生成的内容");
        }
        return;
      }
      const importedTemplates = parseImportedDiceTemplates(pasteText);
      const keysCount = Object.keys(importedTemplates).length;
      if (keysCount === 0) {
        if (typeof window.showCustomAlert === "function") {
          await window.showCustomAlert("导入提示", "未能在粘贴的文本中识别到有效的式子，请确保包含 技能检定: ... 等内容。");
        } else {
          alert("未能在粘贴的文本中识别到有效的式子，请确保包含 技能检定: ... 等内容。");
        }
        return;
      }

      if (!activePreset.templates) activePreset.templates = {};
      Object.assign(activePreset.templates, importedTemplates);

      const pIdx = presets.findIndex(p => p.id === activePreset.id);
      if (pIdx !== -1) presets[pIdx] = activePreset;
      saveStoredDicePresets(presets);

      closeModal();
      if (typeof window.showCustomAlert === "function") {
        await window.showCustomAlert("导入成功", `已成功导入并更新了 ${keysCount} 项播报式子！`);
      } else {
        alert(`已成功导入并更新了 ${keysCount} 项播报式子！`);
      }
      renderCommandsTab(container);
    };
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
