const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const fs = require("fs");

const ID_DEF_RE = /^\s*id\s*=\s*(\d+)\b/i;
const FLAG_SET_RE =
  /\b(?:setflag|clrflag)\b[^\n\r}]*\bwhich\s*=\s*([A-Za-z0-9_]+)\b/i;
const FLAG_CHECK_RE = /\bflag\s*=\s*([A-Za-z0-9_]+)\b/i;
const FLAG_BRACKET_RE = /\[([A-Za-z0-9_]+)\]/;
const PROVINCE_ASSIGN_RE = /\bprovince\s*=\s*(\d+)\b/gi;
const EVENT_ASSIGN_RE = /\bevent\s*=\s*(\d+)\b/gi;
const MONARCH_ASSIGN_RE = /\bmonarch\s*=\s*(\d+)\b/gi;
const COMMAND_TYPE_WHICH_RE =
  /\btype\s*=\s*([A-Za-z_]+)\b[^\n\r}]*\bwhich\s*=\s*(-?\d+)\b/gi;
const COMMAND_TYPE_VALUE_RE =
  /\btype\s*=\s*([A-Za-z_]+)\b[^\n\r}]*\bvalue\s*=\s*(-?\d+)\b/gi;
const COMMAND_TYPE_WHICH_TAG_RE =
  /\btype\s*=\s*([A-Za-z_]+)\b[^\n\r}]*\bwhich\s*=\s*([A-Z][A-Z0-9]{2})\b/gi;
const COUNTRY_FIELD_ASSIGN_RE = /\bcountry\s*=\s*([A-Z][A-Z0-9]{2})\b/gi;
const COUNTRY_TRIGGER_TAG_RE =
  /\b(?:exists|tag|neighbour|overlord)\s*=\s*([A-Z][A-Z0-9]{2})\b/gi;
const PROVINCE_TRIGGER_DATA_TAG_RE =
  /\b(?:core_national|core_claim|core_casusbelli|owned|control)\s*=\s*\{[^\n\r}]*\bdata\s*=\s*([A-Z][A-Z0-9]{2})\b/gi;

// commands where 'value = N' is a province ID
const PROVINCE_VALUE_TYPES = new Set([
  "secedeprovince",
  "cedeprovince",
  "giveaccess",
  "cancelaccess",
  "revokeaccess",
  "givetrade",
  "revoketrade",
]);

const PROVINCE_WHICH_TYPES = new Set([
  "capital",
  "addcore",
  "addcore_national",
  "addcore_claim",
  "addcore_casusbelli",
  "removecore_national",
  "removecore_claim",
  "removecore_casusbelli",
  "provincetax",
  "provincemanpower",
  "provinceculture",
  "provincereligion",
  "province_revoltrisk",
  "revolt",
  "population",
  "populationpercent",
  "fortress",
  "fortresslevel",
  "manufactory",
  "gainbuilding",
  "losebuilding",
  "gainmanufactory",
  "losemanufactory",
  "goods",
  "cot",
  "removecot",
  "cityculture",
  "alt_provincereligion",
  "conversion",
  "control",
  "natives",
  "nativeattack",
  "mine",
  "terrain",
  "heretic",
  "discovered",
  "tradingpost",
  "vp",
  "inf",
  "cav",
  "art",
]);

const EVENT_WHICH_TYPES = new Set(["trigger", "sleepevent"]);
const MONARCH_WHICH_TYPES = new Set(["sleepmonarch", "wakemonarch"]);
const LEADER_WHICH_TYPES = new Set(["sleepleader", "wakeleader"]);
const FTG_COMMAND_TYPE_SUGGESTIONS = [
  "alliance",
  "dynastic",
  "vassal",
  "breakvassal",
  "breakoverlord",
  "inherit",
  "annex",
  "independence",
  "relation",
  "casusbelli",
  "war",
  "cedeprovince",
  "control",
  "giveaccess",
  "cancelaccess",
  "revokeaccess",
  "givetrade",
  "revoketrade",
  "elector",
  "flagname",
  "countryname",
  "wakemonarch",
  "sleepmonarch",
  "wakeleader",
  "sleepleader",
  "conquistador",
  "explorer",
  "ADM",
  "MIL",
  "DIP",
  "country",
  "religion",
  "technology",
  "add_countryculture",
  "remove_countryculture",
  "manpower",
  "badboy",
  "capital",
  "addcore_national",
  "addcore_claim",
  "addcore_casusbelli",
  "addcore",
  "removecore_national",
  "removecore_claim",
  "removecore_casusbelli",
  "domestic",
  "land",
  "naval",
  "treasury",
  "stability",
  "trade",
  "infra",
  "inflation",
  "loansize",
  "population",
  "populationpercent",
  "provincetax",
  "provincemanpower",
  "cityname",
  "provinceculture",
  "provincereligion",
  "alt_provincereligion",
  "goods",
  "terrain",
  "conversion",
  "heretic",
  "hre",
  "cot",
  "removecot",
  "mine",
  "natives",
  "nativeattack",
  "revolt",
  "colonialrevolt",
  "religiousrevolt",
  "province_revoltrisk",
  "revoltrisk",
  "gainbuilding",
  "losebuilding",
  "gainmanufactory",
  "losemanufactory",
  "fortress",
  "fortresslevel",
  "INF",
  "CAV",
  "ART",
  "desertion",
  "diplomats",
  "merchants",
  "colonists",
  "missionaries",
  "setflag",
  "clrflag",
  "flag",
  "trigger",
  "sleepevent",
  "ai",
  "vp",
];
const FTG_DOMESTIC_SLIDERS = [
  "aristocracy",
  "centralization",
  "innovative",
  "mercantilism",
  "land",
  "offensive",
  "quality",
  "serfdom",
];
const FTG_BOOLEAN_VALUES = ["yes", "no"];
const FTG_BUILDING_VALUES = [
  "shipyard",
  "barrack",
  "bailiff",
  "courthouse",
  "cityrights",
];
const FTG_LOSE_BUILDING_VALUES = [
  "shipyard",
  "barrack",
  "bailiff",
  "courthouse",
];
const FTG_MANUFACTORY_VALUES = [
  "navalequipment",
  "luxury",
  "goods",
  "refinery",
  "weapons",
];
const FTG_GAME_FLAG_VALUES = ["0", "1", "2", "3", "4", "5", "6"];
const FTG_PROVINCE_SPECIAL_VALUES = [
  "random",
  "capital",
  "last_random",
  "random_distinct",
  "random_not_capital",
  "-1",
  "-2",
  "-3",
  "-4",
  "-5",
];
const FTG_COUNTRY_SPECIAL_VALUES = [
  "random",
  "last_random",
  "random_distinct",
  "emperor",
  "random_elector",
  "random_distinct_elector",
  "-1",
  "-3",
  "-4",
  "-6",
  "-7",
  "-9",
];
const FTG_PROVINCE_TARGET_TYPES = new Set([
  "capital",
  "addcore",
  "addcore_national",
  "addcore_claim",
  "addcore_casusbelli",
  "removecore_national",
  "removecore_claim",
  "removecore_casusbelli",
  "population",
  "populationpercent",
  "provincetax",
  "provincemanpower",
  "cityname",
  "provincereligion",
  "provinceculture",
  "cityculture",
  "alt_provincereligion",
  "goods",
  "terrain",
  "conversion",
  "heretic",
  "hre",
  "cot",
  "removecot",
  "mine",
  "natives",
  "nativeattack",
  "revolt",
  "colonialrevolt",
  "religiousrevolt",
  "province_revoltrisk",
  "gainbuilding",
  "losebuilding",
  "gainmanufactory",
  "losemanufactory",
  "fortress",
  "fortresslevel",
  "inf",
  "cav",
  "art",
  "desertion",
  "conquistador",
  "explorer",
]);
const FTG_COUNTRY_TARGET_TYPES = new Set([
  "alliance",
  "dynastic",
  "vassal",
  "breakvassal",
  "breakoverlord",
  "inherit",
  "annex",
  "independence",
  "relation",
  "casusbelli",
  "war",
  "cedeprovince",
  "secedeprovince",
  "giveaccess",
  "cancelaccess",
  "revokeaccess",
  "givetrade",
  "revoketrade",
  "elector",
  "country",
]);
const FTG_VALIDATION_SELECTOR = ["Db/", "AI/", "Scenarios/", "Localisation/"];
const FTG_SPECIAL_VALUE_HOVER = {
  "-1": {
    province: "random province id",
    country: "random country tag",
    event_country:
      "country receiving the event (for trigger blocks like core_* / owned / control with data = -1)",
    generic: "random target chosen by the engine",
  },
  "-2": {
    province: "capital province id",
    generic: "capital province id",
  },
  "-3": {
    province: "last random province id used by engine",
    country: "last random country tag used by engine",
    generic: "last random target used by engine",
  },
  "-4": {
    province: "random distinct province id",
    country: "random distinct country tag",
    generic: "random distinct target",
  },
  "-5": {
    province: "random province id excluding capital",
    generic: "random province excluding capital",
  },
  "-6": {
    country: "Holy Roman Emperor country tag",
    generic: "Holy Roman Emperor country tag",
  },
  "-7": {
    country: "random elector country tag",
    generic: "random elector country tag",
  },
  "-9": {
    country: "random distinct elector country tag",
    generic: "random distinct elector country tag",
  },
  random: {
    province: "random province id",
    country: "random country tag",
    generic: "random target chosen by the engine",
  },
  capital: {
    province: "capital province id",
    generic: "capital province id",
  },
  last_random: {
    province: "last random province id used by engine",
    country: "last random country tag used by engine",
    generic: "last random target used by engine",
  },
  random_distinct: {
    province: "random distinct province id",
    country: "random distinct country tag",
    generic: "random distinct target",
  },
  random_not_capital: {
    province: "random province id excluding capital",
    generic: "random province excluding capital",
  },
  emperor: {
    country: "Holy Roman Emperor country tag",
    generic: "Holy Roman Emperor country tag",
  },
  random_elector: {
    country: "random elector country tag",
    generic: "random elector country tag",
  },
  random_distinct_elector: {
    country: "random distinct elector country tag",
    generic: "random distinct elector country tag",
  },
  this: {
    country: "current country tag (this country)",
    generic: "current scope object",
  },
  overlord: {
    country: "overlord country tag",
    generic: "overlord in current scope",
  },
};
const FTG_SPECIAL_VALUE_TOKENS = new Set([
  ...FTG_PROVINCE_SPECIAL_VALUES,
  ...FTG_COUNTRY_SPECIAL_VALUES,
  "this",
  "overlord",
]);
const FTG_EVENT_FIELDS = [
  "id",
  "random",
  "persistent",
  "country",
  "name",
  "desc",
  "style",
  "picture",
  "trigger",
  "date",
  "offset",
  "deathdate",
  "action_a",
  "action_b",
  "action_c",
  "action_d",
  "action_e",
  "action_f",
];
const FTG_DECISION_FIELDS = [
  "id",
  "major",
  "persistent",
  "unique",
  "name",
  "desc",
  "potential",
  "trigger",
  "ai_trigger",
  "action",
];
const FTG_ACTION_FIELDS = ["name", "trigger", "ai_chance", "command"];
const FTG_COMMAND_FIELDS = ["trigger", "type", "which", "value"];
const FTG_MONARCH_BLOCK_FIELDS = [
  "id",
  "name",
  "startdate",
  "enddate",
  "ADM",
  "DIP",
  "MIL",
  "dormant",
];
const FTG_LEADER_BLOCK_FIELDS = [
  "id",
  "name",
  "category",
  "startdate",
  "deathdate",
  "rank",
  "fire",
  "shock",
  "siege",
  "movement",
  "location",
  "remark",
  "special",
];
const FTG_TRIGGER_KEYS = [
  "AND",
  "OR",
  "NOT",
  "someof",
  "random",
  "alliance",
  "dynastic",
  "vassal",
  "union",
  "war",
  "truce",
  "atwar",
  "isvassal",
  "relation",
  "exists",
  "event",
  "flag",
  "year",
  "ai",
  "badboy",
  "inflation",
  "treasury",
  "diplomats",
  "merchants",
  "colonists",
  "missionaries",
  "elector",
  "emperor",
  "hre",
  "neighbour",
  "tag",
  "domestic",
  "land",
  "naval",
  "stability",
  "trade",
  "infra",
  "capital",
  "core_national",
  "core_claim",
  "core_casusbelli",
  "provinceculture",
  "cityculture",
  "provincereligion",
  "owned",
  "control",
  "ownerchange",
  "controlchange",
  "discovered",
  "cot",
  "fortresslevel",
  "provincepopulation",
  "tradingpost",
  "colony",
  "colonialcity",
  "city",
  "bankrupt",
  "revolt",
  "occupied",
  "manpower",
  "countrysize",
  "decision",
];
const FTG_TRIGGER_CONTEXT_BLOCKS = new Set([
  "trigger",
  "potential",
  "ai_trigger",
  "and",
  "or",
  "not",
  "someof",
]);
// trigger sub-blocks that take { country = TAG }
const FTG_COUNTRY_SUB_BLOCKS = new Set([
  "alliance",
  "vassal",
  "war",
  "dynastic",
  "truce",
  "union",
]);
// fields per trigger sub-block type
const FTG_COUNTRY_SUB_BLOCK_FIELDS = ["country"];
const FTG_RELATION_SUB_BLOCK_FIELDS = ["country", "value"];
const FTG_PROV_RELIGION_SUB_BLOCK_FIELDS = ["data", "province"];
const FTG_PROV_CULTURE_SUB_BLOCK_FIELDS = ["data", "province"];
const FTG_TRIGGER_SUB_BLOCK_ALLOWED_FIELDS = new Map([
  ["relation", new Set(["country", "value"])],
  ["alliance", new Set(["country"])],
  ["vassal", new Set(["country"])],
  ["war", new Set(["country"])],
  ["dynastic", new Set(["country"])],
  ["truce", new Set(["country"])],
  ["union", new Set(["country"])],
  ["provincereligion", new Set(["province", "data"])],
  ["provinceculture", new Set(["province", "data"])],
  ["cityculture", new Set(["province", "data"])],
  ["core_national", new Set(["province", "data"])],
  ["core_claim", new Set(["province", "data"])],
  ["core_casusbelli", new Set(["province", "data"])],
  ["owned", new Set(["province", "data"])],
  ["control", new Set(["province", "data"])],
  ["ownerchange", new Set(["province", "years", "months", "days"])],
  ["controlchange", new Set(["province", "years", "months", "days"])],
  ["fortresslevel", new Set(["province", "data"])],
  ["provincepopulation", new Set(["province", "data"])],
]);
const FTG_TOP_LEVEL_BLOCK_KEYS = new Set([
  "event",
  "decision",
  "historicalmonarch",
  "monarch",
  "historicalleader",
  "leader",
]);
// religion definition block list fields (contain religion name tokens, not key=value)
const FTG_RELIGION_LIST_BLOCKS = new Set([
  "heretic",
  "allowed_conversion",
  "income_bonus",
  "war",
  "aggressiveness",
  "conflict",
]);
// field keywords inside a religion definition block
const FTG_RELIGION_BLOCK_FIELDS = [
  "group",
  "subgroup",
  "color",
  "allowed_conversion",
  "income_bonus",
  "heretic",
  "war",
  "aggressiveness",
  "conflict",
  "papacy",
  "predominance",
  "force_conversion",
  "defender",
  "annexable",
  "annex_same_penalty",
  "annex_other_penalty",
  "tech_speed",
  "stability_bonus",
  "stability_cost",
  "colonists",
  "diplomats",
  "missionaries",
  "missionary_placement_chance",
  "missionary_placement_penalty",
  "missionary_sprite",
  "land_morale",
  "naval_morale",
  "trade_efficiency",
  "production_efficiency",
  "global_tax_modifier",
  "slaves_effect",
  "reveal_map",
  "whiteman",
  "defectprovinceto_penalty",
  "province_nationalism",
  "province_religion",
  "coastalprovince_bonus",
];

// ── Hover documentation ──────────────────────────────────────────────────────
const FTG_HOVER_DOCS = {
  // Commands
  stability:
    "**command** `stability` — Changes country stability. `value` = amount (positive or negative).",
  treasury:
    "**command** `treasury` — Changes country treasury (ducats). `value` = amount.",
  inflation: "**command** `inflation` — Changes inflation. `value` = amount.",
  manpower: "**command** `manpower` — Changes manpower pool. `value` = amount.",
  badboy:
    "**command/trigger** `badboy` — Changes infamy (as command: `value` = amount). As trigger: checks if infamy >= `value`.",
  domestic:
    "**command** `domestic` — Changes a domestic slider. `which` = slider name, `value` = amount.",
  relation:
    "**command/trigger** `relation` — Changes relation with another country (command: `which` = TAG, `value` = amount) or checks relation level in trigger block.",
  casusbelli:
    "**command** `casusbelli` — Gives a casus belli against `which` = TAG. `value` = casus belli type.",
  war: "**command/trigger** `war` — Declares war on `which` = TAG (command), or checks if at war with country: block `{ country = TAG }` (trigger).",
  alliance:
    "**command/trigger** `alliance` — Creates alliance with `which` = TAG (command), or checks alliance with country: block `{ country = TAG }` (trigger).",
  vassal:
    "**command/trigger** `vassal` — Makes `which` = TAG a vassal (command), or checks vassal status: block `{ country = TAG }` (trigger).",
  breakvassal:
    "**command** `breakvassal` — Breaks vassalage with `which` = TAG.",
  inherit: "**command** `inherit` — Inherits `which` = TAG.",
  annex: "**command** `annex` — Annexes `which` = TAG.",
  independence:
    "**command** `independence` — Grants independence to `which` = TAG.",
  religion:
    "**command** `religion` — Changes country religion. `value` = religion name.",
  setflag: "**command** `setflag` — Sets a global flag. `which` = flag name.",
  clrflag: "**command** `clrflag` — Clears a global flag. `which` = flag name.",
  trigger: "**command** `trigger` — Fires another event. `which` = event id.",
  sleepevent:
    "**command** `sleepevent` — Suspends an event. `which` = event id.",
  INF: "**command** `INF` — Adds infantry units. `which` = province id, `value` = count.",
  CAV: "**command** `CAV` — Adds cavalry units. `which` = province id, `value` = count.",
  ART: "**command** `ART` — Adds artillery units. `which` = province id, `value` = count.",
  diplomats:
    "**command** `diplomats` — Changes diplomat count. `value` = amount.",
  merchants:
    "**command** `merchants` — Changes merchant count. `value` = amount.",
  colonists:
    "**command** `colonists` — Changes colonist count. `value` = amount.",
  missionaries:
    "**command** `missionaries` — Changes missionary count. `value` = amount.",
  capital: "**command** `capital` — Moves capital to `which` = province id.",
  addcore_national:
    "**command** `addcore_national` — Adds national core to `which` = province id.",
  addcore_claim:
    "**command** `addcore_claim` — Adds claim core to `which` = province id.",
  addcore_casusbelli:
    "**command** `addcore_casusbelli` — Adds casus belli core to `which` = province id.",
  addcore: "**command** `addcore` — Adds core to `which` = province id.",
  removecore_national:
    "**command** `removecore_national` — Removes national core from `which` = province id.",
  removecore_claim:
    "**command** `removecore_claim` — Removes claim core from `which` = province id.",
  removecore_casusbelli:
    "**command** `removecore_casusbelli` — Removes casus belli core from `which` = province id.",
  population:
    "**command** `population` — Changes province population. `which` = province id, `value` = amount.",
  populationpercent:
    "**command** `populationpercent` — Changes province population by percentage. `which` = province id, `value` = percent.",
  provincetax:
    "**command** `provincetax` — Changes province tax income. `which` = province id, `value` = amount.",
  provincemanpower:
    "**command** `provincemanpower` — Changes province manpower. `which` = province id, `value` = amount.",
  provincereligion:
    "**command/trigger** `provincereligion` — Sets or checks province religion. `which` = province id (command) or block `{ data = religion }` (trigger).",
  provinceculture:
    "**command/trigger** `provinceculture` — Sets or checks province culture. Block: `{ data = culture province = id }`.",
  cityculture:
    "**trigger** `cityculture` — Checks city culture. Block: `{ data = culture province = id }`.",
  manufactory:
    "**command** `manufactory` — Adds/removes manufactory. `which` = province id, `value` = type.",
  fortress:
    "**command** `fortress` — Adds/removes fortress. `which` = province id, `value` = level.",
  cot: "**command/trigger** `cot` — Adds/checks CoT. `which` = province id.",
  goods:
    "**command** `goods` — Changes province trade goods. `which` = province id, `value` = goods type.",
  sleepmonarch:
    "**command** `sleepmonarch` — Puts monarch to sleep (dormant). `which` = monarch id.",
  wakemonarch:
    "**command** `wakemonarch` — Activates a dormant monarch. `which` = monarch id.",
  sleepleader:
    "**command** `sleepleader` — Puts leader to sleep. `which` = leader id.",
  wakeleader:
    "**command** `wakeleader` — Activates a sleeping leader. `which` = leader id.",
  ai: "**command/trigger** `ai` — Enables/disables AI for country (command `value = yes/no`), or checks if country is AI-controlled (trigger `ai = yes/no`).",

  // Triggers (only those not already defined above)
  AND: "**trigger** `AND` — All conditions inside must be true.",
  OR: "**trigger** `OR` — At least one condition inside must be true.",
  NOT: "**trigger** `NOT` — The condition inside must be false.",
  someof:
    "**trigger** `someof` — A specified number of conditions must be true. Requires `number = N`.",
  random: "**trigger** `random` — Random percentage chance (0–100).",
  exists: "**trigger** `exists` — Checks if a country exists. `exists = TAG`.",
  tag: "**trigger** `tag` — Checks the country's tag. `tag = TAG`.",
  neighbour:
    "**trigger** `neighbour` — Checks if country is a neighbour. `neighbour = TAG`.",
  overlord: "**trigger** `overlord` — Checks the overlord. `overlord = TAG`.",
  atwar: "**trigger** `atwar` — Is the country at war? `atwar = yes/no`.",
  isvassal:
    "**trigger** `isvassal` — Is the country a vassal? `isvassal = yes/no`.",
  elector:
    "**trigger** `elector` — Is the country an HRE elector? `elector = yes/no`.",
  emperor:
    "**trigger** `emperor` — Is the country the HRE emperor? `emperor = yes/no`.",
  hre: "**trigger** `hre` — Is the province in the HRE? `hre = yes/no`.",
  flag: "**trigger** `flag` — Checks if a flag is set. `flag = flagname`.",
  event:
    "**trigger** `event` — Checks if an event has been triggered. `event = id`.",
  year: "**trigger** `year` — Current game year is >= value. `year = YYYY`.",
  owned:
    "**trigger** `owned` — Checks if a province is owned by the country. `owned = province_id`.",
  control:
    "**trigger** `control` — Checks if a province is controlled by the country. `control = province_id`.",
  ownerchange: "**trigger** `ownerchange` — Checks province ownership change.",
  controlchange:
    "**trigger** `controlchange` — Checks province control change.",
  discovered:
    "**trigger** `discovered` — Checks if a province has been discovered. `discovered = province_id`.",
  fortresslevel:
    "**trigger** `fortresslevel` — Checks fortress level of a province.",
  provincepopulation:
    "**trigger** `provincepopulation` — Checks province population.",
  tradingpost:
    "**trigger** `tradingpost` — Checks if a trading post exists in a province.",
  colony: "**trigger** `colony` — Checks if a province is a colony.",
  colonialcity:
    "**trigger** `colonialcity` — Checks if a province is a colonial city.",
  city: "**trigger** `city` — Checks if a province is a city. `city = yes/no`.",
  core_national:
    "**trigger** `core_national` — Checks if province is a national core. `core_national = province_id`.",
  core_claim: "**trigger** `core_claim` — Checks if province is a claim core.",
  core_casusbelli:
    "**trigger** `core_casusbelli` — Checks if province is a casus belli core.",
  truce:
    "**trigger** `truce` — Checks truce with a country. Block: `{ country = TAG }`.",
  dynastic:
    "**trigger** `dynastic` — Checks dynastic link with a country. Block: `{ country = TAG }`.",
  union:
    "**trigger** `union` — Checks union with a country. Block: `{ country = TAG }`.",
  land: "**trigger** `land` — Checks land technology level.",
  naval: "**trigger** `naval` — Checks naval technology level.",
  trade: "**trigger** `trade` — Checks trade technology level.",
  infra: "**trigger** `infra` — Checks infrastructure technology level.",

  // Structural
  action_a: "**action** `action_a` — First player choice in an event.",
  action_b: "**action** `action_b` — Second player choice in an event.",
  action_c: "**action** `action_c` — Third player choice in an event.",
  action_d: "**action** `action_d` — Fourth player choice in an event.",
  action_e: "**action** `action_e` — Fifth player choice in an event.",
  offset:
    "**field** `offset` — Days after `date` before the event is first checked (positive integer).",
  deathdate:
    "**field** `deathdate` — Last date the event can fire. Format: `{ day = D month = M year = Y }`.",
  persistent:
    "**field** `persistent` — If `yes`, event can fire multiple times until `deathdate`.",
  country:
    "**field** `country` — Country tag the event targets, or `country = TAG` in a trigger sub-block.",

  // Monarch / leader file fields
  historicalmonarch:
    "**block** `historicalmonarch` — Defines a historical monarch entry.",
  historicalleader:
    "**block** `historicalleader` — Defines a historical leader entry.",
  dormant:
    "**field** `dormant` — Whether the monarch starts dormant. `dormant = yes/no`.",
  category:
    "**field** `category` — Leader category. Values: `monarch`, `general`, `admiral`, `explorer`, `conquistador`.",
  rank: "**field** `rank` — Leader rank (0–3).",
  fire: "**field** `fire` — Leader fire skill (0–9).",
  shock: "**field** `shock` — Leader shock skill (0–9).",
  siege: "**field** `siege` — Leader siege skill (0–9).",
  movement: "**field** `movement` — Leader movement skill (0–9).",
  location: "**field** `location` — Starting province for leader.",
  remark:
    "**field** `remark` — Historical note/comment for monarch or leader (string).",
  special: "**field** `special` — Special flag for monarch/leader.",
  techgroup:
    "**field** `techgroup` — Technology group for the country. Values: `latin`, `orthodox`, `muslim`, `china`, `exotic`.",

  // Religion definition fields (religions.txt)
  group:
    "**religion field** `group` — Religion group name (e.g. `christian`, `muslim`, `eastern`, `pagan`).",
  subgroup: "**religion field** `subgroup` — Religion subgroup name.",
  color: "**religion field** `color` — Map display color for the religion.",
  allowed_conversion:
    "**religion field** `allowed_conversion` — List of religions this one can convert to.",
  income_bonus:
    "**religion field** `income_bonus` — Religions that give an income bonus for first conversion.",
  aggressiveness:
    "**religion field** `aggressiveness` — Religions the AI will try to attack for colonization purposes.",
  conflict:
    "**religion field** `conflict` — Religions considered potential enemies.",
  papacy: "**religion field** `papacy` — If `yes`, Papal mechanics apply.",
  predominance:
    "**religion field** `predominance` — If `yes`, better chance for CoT apparition and AI-specific behaviour.",
  force_conversion:
    "**religion field** `force_conversion` — If `no`, country cannot convert or be converted by force within the group.",
  defender:
    "**religion field** `defender` — If `no`, religion cannot have a Defender of the Faith.",
  annexable:
    "**religion field** `annexable` — If `yes`, country can always be annexed or converted by force.",
  annex_same_penalty:
    "**religion field** `annex_same_penalty` — Badboy penalty for annexing same-group countries.",
  annex_other_penalty:
    "**religion field** `annex_other_penalty` — Badboy penalty for annexing other-group countries.",
  tech_speed:
    "**religion field** `tech_speed` — Global modifier for tech research speed (+/-).",
  stability_bonus:
    "**religion field** `stability_bonus` — Subtracted from each province's stability cost for state religion.",
  stability_cost:
    "**religion field** `stability_cost` — Stability cost per non-state-religion province of this religion.",
  missionary_placement_chance:
    "**religion field** `missionary_placement_chance` — Base conversion chance for missionaries.",
  missionary_placement_penalty:
    "**religion field** `missionary_placement_penalty` — If `yes`, provinces penalize missionary placement.",
  missionary_sprite:
    "**religion field** `missionary_sprite` — Missionary sprite level (1–4).",
  land_morale: "**religion field** `land_morale` — Land morale bonus.",
  naval_morale: "**religion field** `naval_morale` — Naval morale bonus.",
  trade_efficiency:
    "**religion field** `trade_efficiency` — Trade efficiency modifier.",
  production_efficiency:
    "**religion field** `production_efficiency` — Production efficiency modifier.",
  global_tax_modifier:
    "**religion field** `global_tax_modifier` — Country tax modifier.",
  slaves_effect:
    "**religion field** `slaves_effect` — Influence on slave demand (default 0.10).",
  reveal_map:
    "**religion field** `reveal_map` — If `yes`, occupying capital reveals entire map.",
  whiteman:
    "**religion field** `whiteman` — If `yes`, whiteman colonization rules apply.",
  defectprovinceto_penalty:
    "**religion field** `defectprovinceto_penalty` — If `yes`, different-religion provinces penalize defection.",
  province_nationalism:
    "**religion field** `province_nationalism` — If `no`, provinces of this religion have no nationalism.",
  province_religion:
    "**religion field** `province_religion` — Province religion corresponding to this state religion.",
  coastalprovince_bonus:
    "**religion field** `coastalprovince_bonus` — If `yes`, coastal provinces give colonist bonus.",

  // Additional triggers
  bankrupt:
    "**trigger** `bankrupt` — Is the country bankrupt? `bankrupt = yes/no`.",
  revolt:
    "**trigger** `revolt` — Is there a revolt in the province? `revolt = yes/no`.",
  occupied:
    "**trigger** `occupied` — Is the province occupied? `occupied = yes/no`.",
  manpower: "**trigger** `manpower` — Checks country manpower. `manpower = N`.",
};

const FTG_DATE_FIELDS = ["day", "month", "year"];
const FTG_MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const FTG_AI_CHANCE_VALUES = [
  "0",
  "5",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
  "60",
  "65",
  "70",
  "75",
  "80",
  "85",
  "90",
  "95",
  "100",
];
const SKIP_DIRS = new Set([
  ".git",
  ".vscode",
  "node_modules",
  "Screenshots",
  "Logs",
  "Music",
]);

const provinceCache = new Map();
const dbLookupCache = new Map();
const sourceDiscoveryCache = new Map();
const completionDataCache = new Map();
const crossFileIdIndexCache = new Map();

function normalizeDbName(name) {
  if (!name) {
    return name;
  }

  if (name.startsWith("PROV_") || name.startsWith("CITY_")) {
    return name.replace(/^(PROV_|CITY_)/, "").replace(/_/g, " ");
  }

  return name;
}

function countChar(str, char) {
  let count = 0;
  for (let i = 0; i < str.length; i += 1) {
    if (str[i] === char) {
      count += 1;
    }
  }
  return count;
}

function collectTextFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) {
    return files;
  }

  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) {
          continue;
        }
        stack.push(fullPath);
      } else if (entry.isFile() && fullPath.toLowerCase().endsWith(".txt")) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function parseBlockKeys(content, keyRegex) {
  const values = new Set();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const clean = line.split("#")[0];
    const match = clean.match(keyRegex);
    if (match) {
      values.add(match[1]);
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

function listAiFiles(root) {
  const aiDir = path.join(root, "AI");
  if (!fs.existsSync(aiDir)) {
    return [];
  }

  const entries = fs.readdirSync(aiDir, { withFileTypes: true });
  return entries
    .filter(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".txt"),
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function buildCompletionData(root) {
  const culturesFile = path.join(root, "Db", "cultures.txt");
  const religionsFile = path.join(root, "Db", "Religions", "religions.txt");
  const techgroupsFile = path.join(
    root,
    "Db",
    "Technologies",
    "techgroups.txt",
  );
  const countriesFile = path.join(root, "Db", "countries.txt");

  const result = {
    cultures: [],
    religions: [],
    techgroups: [],
    countries: [],
    aiFiles: [],
  };

  try {
    if (fs.existsSync(culturesFile)) {
      result.cultures = parseBlockKeys(
        fs.readFileSync(culturesFile, "utf8"),
        /^\s*([a-z0-9_]+)\s*=\s*\{/i,
      );
    }
  } catch {}

  try {
    if (fs.existsSync(religionsFile)) {
      result.religions = parseBlockKeys(
        fs.readFileSync(religionsFile, "utf8"),
        /^\s*([a-z0-9_]+)\s*=\s*\{/i,
      );
    }
  } catch {}

  try {
    if (fs.existsSync(techgroupsFile)) {
      result.techgroups = parseBlockKeys(
        fs.readFileSync(techgroupsFile, "utf8"),
        /^\s*([a-z0-9_]+)\s*=\s*\{/i,
      );
    }
  } catch {}

  try {
    if (fs.existsSync(countriesFile)) {
      result.countries = parseBlockKeys(
        fs.readFileSync(countriesFile, "utf8"),
        /^\s*([A-Z0-9]{3})\s*=\s*\{/,
      );
    }
  } catch {}

  result.aiFiles = listAiFiles(root);

  return result;
}

function getCompletionData(root) {
  const cached = completionDataCache.get(root);
  if (cached) {
    return cached;
  }

  const built = buildCompletionData(root);
  completionDataCache.set(root, built);
  return built;
}

function readTextHead(filePath, size = 16384) {
  const handle = fs.openSync(filePath, "r");
  try {
    const buffer = Buffer.alloc(size);
    const bytesRead = fs.readSync(handle, buffer, 0, size, 0);
    return buffer.toString("utf8", 0, bytesRead);
  } finally {
    fs.closeSync(handle);
  }
}

function discoverDataSources(root) {
  const cfg = vscode.workspace.getConfiguration("ftgRefs");
  const autoDetect = cfg.get("autoDetectDataFiles", true);
  const configuredProvinceRel = (cfg.get("provincesPath", "") || "").trim();

  const result = {
    provinceFile: undefined,
    eventFiles: [],
    monarchFiles: [],
    leaderFiles: [],
  };

  if (configuredProvinceRel) {
    const configuredAbs = path.join(root, configuredProvinceRel);
    if (fs.existsSync(configuredAbs)) {
      result.provinceFile = configuredAbs;
    }
  }

  if (!autoDetect) {
    return result;
  }

  const allTxt = collectTextFiles(root);
  for (const filePath of allTxt) {
    let head;
    try {
      head = readTextHead(filePath);
    } catch {
      continue;
    }

    const fileName = path.basename(filePath).toLowerCase();

    const hasEventBlock = /\bevent\s*=\s*\{/i.test(head);
    const hasMonarchBlock = /\b(?:historical)?monarch\s*=\s*\{/i.test(head);
    const hasLeaderBlock = /\b(?:historical)?leader\s*=\s*\{/i.test(head);
    const hasProvinceLike =
      /\bprovince\s*=\s*\{/i.test(head) && /\bid\s*=\s*\d+/i.test(head);

    if (hasEventBlock) {
      result.eventFiles.push(filePath);
    }

    if (hasMonarchBlock) {
      result.monarchFiles.push(filePath);
    }

    if (hasLeaderBlock) {
      result.leaderFiles.push(filePath);
    }

    if (!result.provinceFile) {
      if (fileName === "provinces.txt" && hasProvinceLike) {
        result.provinceFile = filePath;
      } else if (hasProvinceLike && /\bname\s*=\s*"PROV_/i.test(head)) {
        result.provinceFile = filePath;
      }
    }
  }

  return result;
}

function getDataSources(root) {
  const cached = sourceDiscoveryCache.get(root);
  if (cached) {
    return cached;
  }

  const discovered = discoverDataSources(root);
  sourceDiscoveryCache.set(root, discovered);
  return discovered;
}

function collectLocalizationEnglishFiles(root) {
  const englishDir = path.join(root, "Localisation", "English");
  const files = [];
  if (!fs.existsSync(englishDir)) {
    return files;
  }

  const stack = [englishDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const lower = entry.name.toLowerCase();
      if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function parseLocalizationFile(content, targetMap) {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const parts = line.split(";");
    if (parts.length < 2) {
      continue;
    }

    const key = (parts[0] || "").trim();
    const value = (parts[1] || "").trim();
    if (!key || !value) {
      continue;
    }

    if (!targetMap.has(key)) {
      targetMap.set(key, value);
    }
  }
}

function buildEnglishLocalizationMap(root) {
  const map = new Map();
  const files = collectLocalizationEnglishFiles(root);

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    parseLocalizationFile(content, map);
  }

  return map;
}

function resolveLocalizedName(rawName, localizationMap) {
  if (!rawName) {
    return rawName;
  }

  const key = rawName.trim();
  if (!key) {
    return rawName;
  }

  return localizationMap?.get(key) || rawName;
}

function parseEventNamesFromFile(content, targetMap, localizationMap) {
  const lines = content.split(/\r?\n/);
  let inBlock = false;
  let depth = 0;
  let eventId;
  let eventName;

  for (const line of lines) {
    const clean = line.split("#")[0];

    if (!inBlock) {
      if (/^\s*event\s*=\s*\{/i.test(clean)) {
        inBlock = true;
        depth = countChar(clean, "{") - countChar(clean, "}");
        eventId = undefined;
        eventName = undefined;
      }
      continue;
    }

    if (!eventId) {
      const idMatch = clean.match(/\bid\s*=\s*(\d+)\b/i);
      if (idMatch) {
        eventId = idMatch[1];
      }
    }

    if (!eventName) {
      const nameMatch = clean.match(/\bname\s*=\s*"([^"]+)"/i);
      if (nameMatch) {
        eventName = resolveLocalizedName(nameMatch[1], localizationMap);
      }
    }

    depth += countChar(clean, "{") - countChar(clean, "}");
    if (depth <= 0) {
      if (eventId && eventName && !targetMap.has(eventId)) {
        targetMap.set(eventId, eventName);
      }
      inBlock = false;
      depth = 0;
      eventId = undefined;
      eventName = undefined;
    }
  }
}

function parseNamedBlocksFromFile(
  content,
  startRegex,
  targetMap,
  localizationMap,
) {
  const lines = content.split(/\r?\n/);
  let inBlock = false;
  let depth = 0;
  let itemId;
  let itemName;

  for (const line of lines) {
    const clean = line.split("#")[0];

    if (!inBlock) {
      if (startRegex.test(clean)) {
        inBlock = true;
        depth = countChar(clean, "{") - countChar(clean, "}");
        itemId = undefined;
        itemName = undefined;
      }
      continue;
    }

    if (!itemId) {
      const idMatch = clean.match(/\bid\s*=\s*(\d+)\b/i);
      if (idMatch) {
        itemId = idMatch[1];
      }
    }

    if (!itemName) {
      const nameMatch = clean.match(/\bname\s*=\s*"([^"]+)"/i);
      if (nameMatch) {
        itemName = resolveLocalizedName(nameMatch[1], localizationMap);
      }
    }

    depth += countChar(clean, "{") - countChar(clean, "}");
    if (depth <= 0) {
      if (itemId && itemName && !targetMap.has(itemId)) {
        targetMap.set(itemId, itemName);
      }
      inBlock = false;
      depth = 0;
      itemId = undefined;
      itemName = undefined;
    }
  }
}

function buildDbLookups(root) {
  const lookups = {
    events: new Map(),
    monarchs: new Map(),
    leaders: new Map(),
    countries: new Map(),
  };

  const localizationMap = buildEnglishLocalizationMap(root);
  const completionData = getCompletionData(root);

  for (const tagRaw of completionData.countries || []) {
    const tag = (tagRaw || "").toUpperCase();
    if (!/^[A-Z][A-Z0-9]{2}$/.test(tag)) {
      continue;
    }

    const localized =
      localizationMap.get(tag) ||
      localizationMap.get(`COUNTRY_${tag}`) ||
      localizationMap.get(`TAG_${tag}`) ||
      tag;

    if (!lookups.countries.has(tag)) {
      lookups.countries.set(tag, localized);
    }
  }

  const sources = getDataSources(root);

  for (const file of sources.eventFiles) {
    const content = fs.readFileSync(file, "utf8");
    parseEventNamesFromFile(content, lookups.events, localizationMap);
  }

  for (const file of sources.monarchFiles) {
    const content = fs.readFileSync(file, "utf8");
    parseNamedBlocksFromFile(
      content,
      /^\s*(?:historical)?monarch\s*=\s*\{/i,
      lookups.monarchs,
      localizationMap,
    );
  }

  for (const file of sources.leaderFiles) {
    const content = fs.readFileSync(file, "utf8");
    parseNamedBlocksFromFile(
      content,
      /^\s*(?:historical)?leader\s*=\s*\{/i,
      lookups.leaders,
      localizationMap,
    );
  }

  return lookups;
}

function getDbLookups(root) {
  const cached = dbLookupCache.get(root);
  if (cached) {
    return cached;
  }

  const built = buildDbLookups(root);
  dbLookupCache.set(root, built);
  return built;
}

function collectStructuredFtgFilesForIdIndex(root) {
  const files = [];
  const roots = [
    path.join(root, "Db", "Events"),
    path.join(root, "Db", "Decisions"),
  ];

  for (const baseDir of roots) {
    if (!fs.existsSync(baseDir)) {
      continue;
    }

    const stack = [baseDir];
    while (stack.length) {
      const current = stack.pop();
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          if (SKIP_DIRS.has(entry.name)) {
            continue;
          }
          stack.push(fullPath);
          continue;
        }

        if (!entry.isFile()) {
          continue;
        }

        const lower = entry.name.toLowerCase();
        if (lower.endsWith(".txt") || lower.endsWith(".eue")) {
          files.push(fullPath);
        }
      }
    }
  }

  return files;
}

function addDefinitionToIdIndex(targetMap, id, filePath, lineNo) {
  if (!targetMap.has(id)) {
    targetMap.set(id, []);
  }
  targetMap.get(id).push({ filePath, lineNo });
}

function indexStructuredIdsFromContent(content, filePath, idIndex) {
  const lines = content.split(/\r?\n/);
  const braceStack = [];
  const blockNameStack = [];
  let inMultilineString = false;

  for (let lineNo = 0; lineNo < lines.length; lineNo += 1) {
    const lineText = lines[lineNo];
    const analyzedLine = analyzeFtgLine(lineText, inMultilineString);
    inMultilineString = analyzedLine.endsInString;
    const codeText = analyzedLine.codeText;
    const braceText = analyzedLine.braceText;

    const blockOpenMatch = codeText.match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{/);
    let openedOnThisLine = false;

    for (let charNo = 0; charNo < braceText.length; charNo += 1) {
      const char = braceText[charNo];
      if (char === "{") {
        braceStack.push({ lineNo, charNo });
        const blockName =
          !openedOnThisLine && blockOpenMatch
            ? blockOpenMatch[1].toLowerCase()
            : null;
        blockNameStack.push(blockName);
        openedOnThisLine = true;
      } else if (char === "}" && braceStack.length) {
        braceStack.pop();
        blockNameStack.pop();
      }
    }

    if (!codeText.trim()) {
      continue;
    }

    const outerBlock = blockNameStack.length ? blockNameStack[0] : null;
    if (outerBlock !== "event" && outerBlock !== "decision") {
      continue;
    }

    const idMatch = codeText.match(/^\s*id\s*=\s*(\d+)\s*$/i);
    if (!idMatch) {
      continue;
    }

    const idVal = idMatch[1];
    if (outerBlock === "event") {
      addDefinitionToIdIndex(idIndex.events, idVal, filePath, lineNo);
    } else {
      addDefinitionToIdIndex(idIndex.decisions, idVal, filePath, lineNo);
    }
  }
}

function buildCrossFileIdIndex(root) {
  const idIndex = {
    events: new Map(),
    decisions: new Map(),
  };

  const files = collectStructuredFtgFilesForIdIndex(root);
  for (const filePath of files) {
    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    indexStructuredIdsFromContent(content, filePath, idIndex);
  }

  return idIndex;
}

function getCrossFileIdIndex(root) {
  const cached = crossFileIdIndexCache.get(root);
  if (cached) {
    return cached;
  }

  const built = buildCrossFileIdIndex(root);
  crossFileIdIndexCache.set(root, built);
  return built;
}

function clearAllCaches() {
  provinceCache.clear();
  dbLookupCache.clear();
  sourceDiscoveryCache.clear();
  completionDataCache.clear();
  crossFileIdIndexCache.clear();
}

function getWorkspaceRoot(document) {
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  return folder ? folder.uri.fsPath : undefined;
}

function parseSymbolFromLine(line) {
  const id = line.match(ID_DEF_RE);
  if (id) {
    return { kind: "id", symbol: id[1], label: `ID ${id[1]}` };
  }

  const flagSet = line.match(FLAG_SET_RE);
  if (flagSet) {
    return { kind: "flag", symbol: flagSet[1], label: `flag ${flagSet[1]}` };
  }

  const flagCheck = line.match(FLAG_CHECK_RE);
  if (flagCheck) {
    return {
      kind: "flag",
      symbol: flagCheck[1],
      label: `flag ${flagCheck[1]}`,
    };
  }

  const flagBracket = line.match(FLAG_BRACKET_RE);
  if (flagBracket) {
    return {
      kind: "flag",
      symbol: flagBracket[1],
      label: `flag ${flagBracket[1]}`,
    };
  }

  return undefined;
}

function parseSymbolAtPosition(document, position) {
  const line = document.lineAt(position.line).text;
  const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z0-9_]+/);
  const word = wordRange ? document.getText(wordRange) : "";

  if (/^\d+$/.test(word)) {
    return { kind: "id", symbol: word, label: `ID ${word}` };
  }

  const flagSet = line.match(FLAG_SET_RE);
  if (flagSet && word && flagSet[1].toLowerCase() === word.toLowerCase()) {
    return { kind: "flag", symbol: flagSet[1], label: `flag ${flagSet[1]}` };
  }

  const flagCheck = line.match(FLAG_CHECK_RE);
  if (flagCheck && word && flagCheck[1].toLowerCase() === word.toLowerCase()) {
    return {
      kind: "flag",
      symbol: flagCheck[1],
      label: `flag ${flagCheck[1]}`,
    };
  }

  const flagBracket = line.match(FLAG_BRACKET_RE);
  if (
    flagBracket &&
    word &&
    flagBracket[1].toLowerCase() === word.toLowerCase()
  ) {
    return {
      kind: "flag",
      symbol: flagBracket[1],
      label: `flag ${flagBracket[1]}`,
    };
  }

  return parseSymbolFromLine(line);
}

function parseProvinceIdAtPosition(document, position) {
  const lineText = document.lineAt(position.line).text;
  PROVINCE_ASSIGN_RE.lastIndex = 0;

  let match = PROVINCE_ASSIGN_RE.exec(lineText);
  while (match) {
    const provinceId = match[1];
    const startChar = match.index + match[0].lastIndexOf(provinceId);
    const endChar = startChar + provinceId.length;
    if (position.character >= startChar && position.character <= endChar) {
      return {
        id: provinceId,
        range: new vscode.Range(
          position.line,
          startChar,
          position.line,
          endChar,
        ),
      };
    }
    match = PROVINCE_ASSIGN_RE.exec(lineText);
  }

  return undefined;
}

function parseProvinceIdsInLine(lineText, lineNo) {
  const results = [];
  PROVINCE_ASSIGN_RE.lastIndex = 0;

  let match = PROVINCE_ASSIGN_RE.exec(lineText);
  while (match) {
    const provinceId = match[1];
    const startChar = match.index + match[0].lastIndexOf(provinceId);
    const endChar = startChar + provinceId.length;
    results.push({
      id: provinceId,
      range: new vscode.Range(lineNo, startChar, lineNo, endChar),
      hintPos: new vscode.Position(lineNo, endChar),
    });
    match = PROVINCE_ASSIGN_RE.exec(lineText);
  }

  return results;
}

function parseEventIdsInLine(lineText, lineNo) {
  const results = [];
  EVENT_ASSIGN_RE.lastIndex = 0;

  let match = EVENT_ASSIGN_RE.exec(lineText);
  while (match) {
    const eventId = match[1];
    const startChar = match.index + match[0].lastIndexOf(eventId);
    const endChar = startChar + eventId.length;
    results.push({
      kind: "event",
      id: eventId,
      hintPos: new vscode.Position(lineNo, endChar),
    });
    match = EVENT_ASSIGN_RE.exec(lineText);
  }

  return results;
}

function parseMonarchIdsInLine(lineText, lineNo) {
  const results = [];
  MONARCH_ASSIGN_RE.lastIndex = 0;

  let match = MONARCH_ASSIGN_RE.exec(lineText);
  while (match) {
    const monarchId = match[1];
    const startChar = match.index + match[0].lastIndexOf(monarchId);
    const endChar = startChar + monarchId.length;
    results.push({
      kind: "monarch",
      id: monarchId,
      hintPos: new vscode.Position(lineNo, endChar),
    });
    match = MONARCH_ASSIGN_RE.exec(lineText);
  }

  return results;
}

function parseCountryTagsInLine(lineText, lineNo) {
  const results = [];

  COUNTRY_FIELD_ASSIGN_RE.lastIndex = 0;
  let matchCountry = COUNTRY_FIELD_ASSIGN_RE.exec(lineText);
  while (matchCountry) {
    const tag = (matchCountry[1] || "").toUpperCase();
    const startChar =
      matchCountry.index + matchCountry[0].lastIndexOf(matchCountry[1]);
    const endChar = startChar + matchCountry[1].length;
    results.push({
      kind: "country",
      id: tag,
      hintPos: new vscode.Position(lineNo, endChar),
    });
    matchCountry = COUNTRY_FIELD_ASSIGN_RE.exec(lineText);
  }

  COUNTRY_TRIGGER_TAG_RE.lastIndex = 0;
  let matchTrigger = COUNTRY_TRIGGER_TAG_RE.exec(lineText);
  while (matchTrigger) {
    const tag = (matchTrigger[1] || "").toUpperCase();
    const startChar =
      matchTrigger.index + matchTrigger[0].lastIndexOf(matchTrigger[1]);
    const endChar = startChar + matchTrigger[1].length;
    results.push({
      kind: "country",
      id: tag,
      hintPos: new vscode.Position(lineNo, endChar),
    });
    matchTrigger = COUNTRY_TRIGGER_TAG_RE.exec(lineText);
  }

  PROVINCE_TRIGGER_DATA_TAG_RE.lastIndex = 0;
  let matchProvData = PROVINCE_TRIGGER_DATA_TAG_RE.exec(lineText);
  while (matchProvData) {
    const tag = (matchProvData[1] || "").toUpperCase();
    const startChar =
      matchProvData.index + matchProvData[0].lastIndexOf(matchProvData[1]);
    const endChar = startChar + matchProvData[1].length;
    results.push({
      kind: "country",
      id: tag,
      hintPos: new vscode.Position(lineNo, endChar),
    });
    matchProvData = PROVINCE_TRIGGER_DATA_TAG_RE.exec(lineText);
  }

  COMMAND_TYPE_WHICH_TAG_RE.lastIndex = 0;
  let matchWhich = COMMAND_TYPE_WHICH_TAG_RE.exec(lineText);
  while (matchWhich) {
    const type = (matchWhich[1] || "").toLowerCase();
    const tag = (matchWhich[2] || "").toUpperCase();
    if (FTG_COUNTRY_TARGET_TYPES.has(type)) {
      const startChar =
        matchWhich.index + matchWhich[0].lastIndexOf(matchWhich[2]);
      const endChar = startChar + matchWhich[2].length;
      results.push({
        kind: "country",
        id: tag,
        hintPos: new vscode.Position(lineNo, endChar),
      });
    }
    matchWhich = COMMAND_TYPE_WHICH_TAG_RE.exec(lineText);
  }

  return results;
}

function parseCommandWhichTargetsInLine(lineText, lineNo) {
  const results = [];
  COMMAND_TYPE_WHICH_RE.lastIndex = 0;

  let match = COMMAND_TYPE_WHICH_RE.exec(lineText);
  while (match) {
    const type = (match[1] || "").toLowerCase();
    const id = match[2];
    const numericId = Number(id);
    const startChar = match.index + match[0].lastIndexOf(id);
    const endChar = startChar + id.length;

    if (
      Number.isFinite(numericId) &&
      numericId > 0 &&
      PROVINCE_WHICH_TYPES.has(type)
    ) {
      results.push({
        kind: "province",
        id,
        hintPos: new vscode.Position(lineNo, endChar),
      });
    }

    if (
      Number.isFinite(numericId) &&
      numericId > 0 &&
      EVENT_WHICH_TYPES.has(type)
    ) {
      results.push({
        kind: "event",
        id,
        hintPos: new vscode.Position(lineNo, endChar),
      });
    }

    if (
      Number.isFinite(numericId) &&
      numericId > 0 &&
      MONARCH_WHICH_TYPES.has(type)
    ) {
      results.push({
        kind: "monarch",
        id,
        hintPos: new vscode.Position(lineNo, endChar),
      });
    }

    if (
      Number.isFinite(numericId) &&
      numericId > 0 &&
      LEADER_WHICH_TYPES.has(type)
    ) {
      results.push({
        kind: "leader",
        id,
        hintPos: new vscode.Position(lineNo, endChar),
      });
    }

    match = COMMAND_TYPE_WHICH_RE.exec(lineText);
  }

  // handle commands where value = province_id (e.g. secedeprovince, cedeprovince)
  COMMAND_TYPE_VALUE_RE.lastIndex = 0;
  let matchV = COMMAND_TYPE_VALUE_RE.exec(lineText);
  while (matchV) {
    const typeV = (matchV[1] || "").toLowerCase();
    const idV = matchV[2];
    const numericIdV = Number(idV);
    if (
      Number.isFinite(numericIdV) &&
      numericIdV > 0 &&
      PROVINCE_VALUE_TYPES.has(typeV)
    ) {
      const startChar = matchV.index + matchV[0].lastIndexOf(idV);
      const endChar = startChar + idV.length;
      results.push({
        kind: "province",
        id: idV,
        hintPos: new vscode.Position(lineNo, endChar),
      });
    }
    matchV = COMMAND_TYPE_VALUE_RE.exec(lineText);
  }

  return results;
}

function parseProvinceMap(content) {
  const map = new Map();
  const lines = content.split(/\r?\n/);

  let inProvinceBlock = false;
  let currentId = undefined;
  let currentName = undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inProvinceBlock) {
      if (/^province\s*=\s*\{\s*$/i.test(trimmed)) {
        inProvinceBlock = true;
        currentId = undefined;
        currentName = undefined;
      }
      continue;
    }

    const idMatch = trimmed.match(/^id\s*=\s*(\d+)\b/i);
    if (idMatch) {
      currentId = idMatch[1];
    }

    const nameMatch = trimmed.match(/^name\s*=\s*"([^"]+)"/i);
    if (nameMatch) {
      currentName = nameMatch[1];
    }

    if (/^\}/.test(trimmed)) {
      if (currentId && currentName) {
        map.set(currentId, currentName);
      }
      inProvinceBlock = false;
      currentId = undefined;
      currentName = undefined;
    }
  }

  return map;
}

function getProvinceMap(root) {
  const cfg = vscode.workspace.getConfiguration("ftgRefs");
  const provincesRel = (cfg.get("provincesPath", "") || "").trim();

  let provincesAbs;
  if (provincesRel) {
    provincesAbs = path.join(root, provincesRel);
  } else {
    const sources = getDataSources(root);
    provincesAbs = sources.provinceFile;
  }

  if (!provincesAbs || !fs.existsSync(provincesAbs)) {
    return undefined;
  }

  const stat = fs.statSync(provincesAbs);
  const cache = provinceCache.get(provincesAbs);
  if (cache && cache.mtimeMs === stat.mtimeMs) {
    return cache.map;
  }

  const content = fs.readFileSync(provincesAbs, "utf8");
  const parsed = parseProvinceMap(content);
  provinceCache.set(provincesAbs, { mtimeMs: stat.mtimeMs, map: parsed });
  return parsed;
}

function runRefsScript(root, kind, symbol) {
  return new Promise((resolve, reject) => {
    const cfg = vscode.workspace.getConfiguration("ftgRefs");
    const pythonPath = cfg.get("pythonPath", "python");
    const scriptRel = cfg.get("scriptPath", "Work Folder/tools/ftg_refs.py");
    const scriptAbs = path.join(root, scriptRel);

    const args = [
      scriptAbs,
      "--root",
      root,
      "--symbol",
      symbol,
      "--kind",
      kind,
    ];
    cp.execFile(
      pythonPath,
      args,
      { cwd: root, windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || stdout || error.message));
          return;
        }
        resolve(stdout || "");
      },
    );
  });
}

// JS-native search for monarch/leader references (bypasses Python script)
function findMonarchOrLeaderItemsJs(root, kind, id) {
  const sources = getDataSources(root);
  const items = [];
  const idStr = String(id);

  const isMonarch = kind === "monarch";
  const defFiles = isMonarch ? sources.monarchFiles : sources.leaderFiles;
  const blockRe = isMonarch
    ? /^\s*(?:historical)?monarch\s*=\s*\{/i
    : /^\s*(?:historical)?leader\s*=\s*\{/i;
  const refTypes = isMonarch
    ? new Set(["sleepmonarch", "wakemonarch"])
    : new Set(["sleepleader", "wakeleader"]);

  // Find definition blocks
  for (const filePath of defFiles) {
    try {
      const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
      let inBlock = false;
      let depth = 0;
      let blockStart = -1;
      let foundId = false;

      for (let i = 0; i < lines.length; i++) {
        const clean = lines[i].split("#")[0];

        if (!inBlock) {
          if (blockRe.test(clean)) {
            inBlock = true;
            blockStart = i;
            depth = countChar(clean, "{") - countChar(clean, "}");
            foundId = false;
          }
          continue;
        }

        const idMatch = clean.match(/\bid\s*=\s*(\d+)\b/i);
        if (idMatch && idMatch[1] === idStr) {
          foundId = true;
        }

        depth += countChar(clean, "{") - countChar(clean, "}");
        if (depth <= 0) {
          if (foundId) {
            const relPath = path.relative(root, filePath).replace(/\\/g, "/");
            items.push({
              relPath,
              absPath: filePath,
              lineNo: blockStart + 1,
              kind: `${kind}-def`,
              source: lines[blockStart].trim(),
            });
          }
          inBlock = false;
          foundId = false;
        }
      }
    } catch {}
  }

  // Find usages in all event files
  const searchFiles = sources.eventFiles;

  const usageRe = new RegExp(
    `\\btype\\s*=\\s*(?:${[...refTypes].join("|")})\\b[^\\n\\r}]*\\bwhich\\s*=\\s*0*(${idStr})\\b`,
    "i",
  );

  for (const filePath of searchFiles) {
    try {
      const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const clean = lines[i].split("#")[0];
        if (usageRe.test(clean)) {
          const relPath = path.relative(root, filePath).replace(/\\/g, "/");
          items.push({
            relPath,
            absPath: filePath,
            lineNo: i + 1,
            kind: `${kind}-ref`,
            source: lines[i].trim(),
          });
        }
      }
    } catch {}
  }

  return items;
}

// Resolves refs either via Python script or JS-native for monarch/leader
async function resolveRefs(root, kind, symbol) {
  if (kind === "monarch" || kind === "leader") {
    return findMonarchOrLeaderItemsJs(root, kind, symbol);
  }
  const out = await runRefsScript(root, kind, symbol);
  return parseRefsOutput(root, out);
}

function parseRefsOutput(root, output) {
  const lines = output.split(/\r?\n/);
  const refLines = lines.filter((line) => /:\d+:\s\[[^\]]+\]/.test(line));

  return refLines
    .map((line) => {
      const match = line.match(/^(.*?):(\d+):\s\[([^\]]+)\]\s(.*)$/);
      if (!match) {
        return undefined;
      }

      const relPath = match[1].trim();
      const lineNo = Number(match[2]);
      const kind = match[3];
      const source = match[4];

      return {
        relPath,
        absPath: path.join(root, relPath),
        lineNo,
        kind,
        source,
      };
    })
    .filter(Boolean);
}

async function openReference(item) {
  const uri = vscode.Uri.file(item.absPath);
  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc, { preview: false });
  const pos = new vscode.Position(Math.max(item.lineNo - 1, 0), 0);
  editor.selection = new vscode.Selection(pos, pos);
  editor.revealRange(
    new vscode.Range(pos, pos),
    vscode.TextEditorRevealType.InCenter,
  );
}

function toLocations(items) {
  return items.map(
    (item) =>
      new vscode.Location(
        vscode.Uri.file(item.absPath),
        new vscode.Position(Math.max(item.lineNo - 1, 0), 0),
      ),
  );
}

async function showReferences(kind, symbol, sourceDocument) {
  const root = getWorkspaceRoot(sourceDocument);
  if (!root) {
    vscode.window.showErrorMessage("FTG Refs: workspace folder not found.");
    return;
  }

  try {
    const items = await resolveRefs(root, kind, symbol);

    if (!items.length) {
      vscode.window.showInformationMessage(
        `FTG Refs: no references found for ${kind} ${symbol}.`,
      );
      return;
    }

    const picks = items.map((item) => ({
      label: `${item.relPath}:${item.lineNo}`,
      description: `[${item.kind}]`,
      detail: item.source,
      item,
    }));

    const choice = await vscode.window.showQuickPick(picks, {
      placeHolder: `References for ${kind} ${symbol} (${items.length})`,
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (choice) {
      await openReference(choice.item);
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `FTG Refs: script execution error: ${error.message || error}`,
    );
  }
}

async function getReferenceLocations(kind, symbol, sourceDocument) {
  const root = getWorkspaceRoot(sourceDocument);
  if (!root) {
    return [];
  }

  const items = await resolveRefs(root, kind, symbol);
  return toLocations(items);
}

async function peekReferences(kind, symbol, sourceDocument, originPosition) {
  try {
    const locations = await getReferenceLocations(kind, symbol, sourceDocument);
    if (!locations.length) {
      vscode.window.showInformationMessage(
        `FTG Refs: no references found for ${kind} ${symbol}.`,
      );
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const pos =
      originPosition || editor?.selection?.active || new vscode.Position(0, 0);
    await vscode.commands.executeCommand(
      "editor.action.showReferences",
      sourceDocument.uri,
      pos,
      locations,
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `FTG Refs: script execution error: ${error.message || error}`,
    );
  }
}

function pickDefinitionCandidates(kind, items) {
  if (kind === "id") {
    return items.filter((item) => item.kind === "id-def");
  }

  if (kind === "monarch" || kind === "leader") {
    return items.filter((item) => item.kind === `${kind}-def`);
  }

  const flagDefs = items.filter((item) => item.kind === "flag-setflag");
  if (flagDefs.length) {
    return flagDefs;
  }

  return items.filter((item) => item.kind === "flag-check");
}

async function goToDefinition(kind, symbol, sourceDocument) {
  const root = getWorkspaceRoot(sourceDocument);
  if (!root) {
    vscode.window.showErrorMessage("FTG Refs: workspace folder not found.");
    return;
  }

  try {
    const items = await resolveRefs(root, kind, symbol);
    const defs = pickDefinitionCandidates(kind, items);

    if (!defs.length) {
      vscode.window.showInformationMessage(
        `FTG Refs: no definition found for ${kind} ${symbol}.`,
      );
      return;
    }

    if (defs.length === 1) {
      await openReference(defs[0]);
      return;
    }

    const picks = defs.map((item) => ({
      label: `${item.relPath}:${item.lineNo}`,
      description: `[${item.kind}]`,
      detail: item.source,
      item,
    }));

    const choice = await vscode.window.showQuickPick(picks, {
      placeHolder: `Definitions for ${kind} ${symbol} (${defs.length})`,
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (choice) {
      await openReference(choice.item);
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `FTG Refs: script execution error: ${error.message || error}`,
    );
  }
}

function parseCommandEventReferencesInLine(lineText) {
  const results = [];

  COMMAND_TYPE_WHICH_RE.lastIndex = 0;
  let match = COMMAND_TYPE_WHICH_RE.exec(lineText);
  while (match) {
    const type = (match[1] || "").toLowerCase();
    const id = match[2];

    if (EVENT_WHICH_TYPES.has(type)) {
      const numericId = Number(id);
      if (Number.isFinite(numericId) && numericId > 0) {
        results.push({
          kind: "event",
          id,
          type,
        });
      }
    }

    if (MONARCH_WHICH_TYPES.has(type)) {
      const numericId = Number(id);
      if (Number.isFinite(numericId) && numericId > 0) {
        results.push({
          kind: "monarch",
          id,
          type,
        });
      }
    }

    if (LEADER_WHICH_TYPES.has(type)) {
      const numericId = Number(id);
      if (Number.isFinite(numericId) && numericId > 0) {
        results.push({
          kind: "leader",
          id,
          type,
        });
      }
    }

    match = COMMAND_TYPE_WHICH_RE.exec(lineText);
  }

  return results;
}

function extractCommandType(codePrefix) {
  const match = codePrefix.match(/\btype\s*=\s*([A-Za-z_]+)\b/i);
  return match ? match[1].toLowerCase() : undefined;
}

function createCompletionItems(
  values,
  kind,
  detail,
  wordRange,
  quoteValue = false,
) {
  return values.map((value, index) => {
    const item = new vscode.CompletionItem(value, kind);
    item.insertText = quoteValue ? `"${value}"` : value;
    item.detail = detail;
    item.sortText = `${index}`.padStart(3, "0");
    if (wordRange) {
      item.range = wordRange;
    }
    return item;
  });
}

function createSnippetItem(label, snippet, detail, sortText = "000") {
  const item = new vscode.CompletionItem(
    label,
    vscode.CompletionItemKind.Snippet,
  );
  item.insertText = new vscode.SnippetString(snippet);
  item.detail = detail;
  item.sortText = sortText;
  return item;
}

function getBlockStack(document, position) {
  const stack = [];

  for (let lineNo = 0; lineNo <= position.line; lineNo += 1) {
    const fullLine = document.lineAt(lineNo).text;
    const slice =
      lineNo === position.line
        ? fullLine.slice(0, position.character)
        : fullLine;
    const code = slice.split("#")[0];
    const tokenRe = /([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{|\{|\}/g;

    let token = tokenRe.exec(code);
    while (token) {
      if (token[1]) {
        stack.push(token[1].toLowerCase());
      } else if (token[0] === "{") {
        stack.push("{");
      } else if (token[0] === "}" && stack.length) {
        stack.pop();
      }

      token = tokenRe.exec(code);
    }
  }

  return stack;
}

function isActionBlockName(name) {
  return /^action(?:_[a-z])?$/.test(name || "");
}

function provideStructureCompletionItems(
  document,
  position,
  codePrefix,
  completionData,
) {
  const trimmed = codePrefix.trim();
  const stack = getBlockStack(document, position);
  const currentBlock = stack.length ? stack[stack.length - 1] : undefined;
  const parentBlock = stack.length > 1 ? stack[stack.length - 2] : undefined;
  const inEvent = stack.includes("event");
  const inDecision = stack.includes("decision");
  const inHistoricalMonarch = currentBlock === "historicalmonarch";
  const inHistoricalLeader = currentBlock === "historicalleader";
  // religion definition context: inside `heretic = {}` / `allowed_conversion = {}` etc.
  const inReligionListBlock = FTG_RELIGION_LIST_BLOCKS.has(currentBlock);
  // religion definition block: depth-2 block (name = { ... }) not event/decision/historicalmonarch/etc.
  const depth2ParentIsReligionDef =
    stack.length === 2 &&
    !["event", "decision", "historicalmonarch", "historicalleader"].includes(
      parentBlock,
    );
  const inReligionDefBlock =
    stack.length === 1 &&
    !["event", "decision", "historicalmonarch", "historicalleader"].includes(
      currentBlock,
    );
  const inTriggerContext = FTG_TRIGGER_CONTEXT_BLOCKS.has(currentBlock);
  const inAction = isActionBlockName(currentBlock);
  const inCommand = currentBlock === "command";
  const inDateBlock = currentBlock === "date" || currentBlock === "deathdate";
  const inCountrySubBlock =
    FTG_COUNTRY_SUB_BLOCKS.has(currentBlock) &&
    (FTG_TRIGGER_CONTEXT_BLOCKS.has(parentBlock) ||
      FTG_COUNTRY_SUB_BLOCKS.has(parentBlock));
  const inRelationSubBlock =
    currentBlock === "relation" && FTG_TRIGGER_CONTEXT_BLOCKS.has(parentBlock);
  const inProvReligionSubBlock =
    currentBlock === "provincereligion" &&
    FTG_TRIGGER_CONTEXT_BLOCKS.has(parentBlock);
  const inProvCultureSubBlock =
    (currentBlock === "provinceculture" || currentBlock === "cityculture") &&
    FTG_TRIGGER_CONTEXT_BLOCKS.has(parentBlock);
  const keyOnlyLine = /^\s*[A-Za-z_]*$/.test(codePrefix);

  if (!trimmed && !currentBlock) {
    return [
      createSnippetItem(
        "event block",
        [
          "event = {",
          "\tid = ${1:3000000}",
          "\trandom = no",
          "\tcountry = ${2:BYZ}",
          '\tname = "${3:EVENTNAME3000000}"',
          '\tdesc = "${4:EVENTHIST3000000}"',
          "\ttrigger = {",
          "\t\t${5}",
          "\t}",
          "\tdate = { day = 1 month = january year = ${6:1419} }",
          "\toffset = ${7:30}",
          "\tdeathdate = { day = 1 month = january year = ${8:1820} }",
          "\taction_a = {",
          '\t\tname = "${9:OK}"',
          "\t\tcommand = { type = ${10:stability} value = ${11:1} }",
          "\t}",
          "}",
        ].join("\n"),
        "FTG event template",
        "000",
      ),
      createSnippetItem(
        "decision block",
        [
          "decision = {",
          "\tid = ${1:5000000}",
          "\tmajor = yes",
          "\tpersistent = no",
          "\tunique = no",
          '\tname = "${2:DECISIONNAME5000000}"',
          '\tdesc = "${3:DECISIONDESC5000000}"',
          "\tpotential = {",
          "\t\t${4}",
          "\t}",
          "\ttrigger = {",
          "\t\t${5}",
          "\t}",
          "\tai_trigger = {",
          "\t\t${6:ai = yes}",
          "\t}",
          "\taction = {",
          "\t\tcommand = { type = ${7:stability} value = ${8:1} }",
          "\t}",
          "}",
        ].join("\n"),
        "FTG decision template",
        "001",
      ),
      createSnippetItem(
        "historicalmonarch block",
        [
          "historicalmonarch = {",
          "\tid = { type = 6 id = ${1:100000} }",
          '\tname = "${2:Name}"',
          "\tstartdate = { year = ${3:1337} }",
          "\tenddate = { year = ${4:1355} }",
          "\tADM = ${5:5}",
          "\tDIP = ${6:5}",
          "\tMIL = ${7:5}",
          "\tdormant = no",
          "}",
        ].join("\n"),
        "FTG historicalmonarch template",
        "002",
      ),
      createSnippetItem(
        "historicalleader block",
        [
          "historicalleader = {",
          "\tid = { type = 6 id = ${1:200000} }",
          "\tcategory = ${2|monarch,general,admiral,explorer,conquistador|}",
          '\tname = "${3:Name}"',
          "\tstartdate = { year = ${4:1337} }",
          "\tdeathdate = { year = ${5:1360} }",
          "\trank = ${6:3}",
          "\tfire = ${7:3}",
          "\tshock = ${8:3}",
          "\tsiege = ${9:1}",
          "\tmovement = ${10:3}",
          "}",
        ].join("\n"),
        "FTG historicalleader template",
        "003",
      ),
    ];
  }

  if (/\bevent\s*=\s*$/.test(codePrefix)) {
    return [
      createSnippetItem(
        "event braces",
        "{\n\t${1}\n}",
        "FTG event block",
        "000",
      ),
    ];
  }

  if (/\bdecision\s*=\s*$/.test(codePrefix)) {
    return [
      createSnippetItem(
        "decision braces",
        "{\n\t${1}\n}",
        "FTG decision block",
        "000",
      ),
    ];
  }

  if (/\b(?:date|deathdate)\s*=\s*$/.test(codePrefix)) {
    return [
      createSnippetItem(
        "date block",
        "{ day = ${1:1} month = ${2:january} year = ${3:1419} }",
        "FTG date structure",
        "000",
      ),
    ];
  }

  // ── trigger sub-block snippets (alliance = $, war = $, etc.) ──────────────
  if (
    /\b(?:alliance|vassal|war|dynastic|truce|union)\s*=\s*$/.test(codePrefix) &&
    inTriggerContext
  ) {
    return [
      createSnippetItem(
        "sub-block",
        "{ country = ${1:TAG} }",
        "FTG trigger sub-block",
        "000",
      ),
    ];
  }

  if (/\brelation\s*=\s*$/.test(codePrefix) && inTriggerContext) {
    return [
      createSnippetItem(
        "relation block",
        "{ country = ${1:TAG} value = ${2:-100} }",
        "FTG relation trigger",
        "000",
      ),
    ];
  }

  if (/\bprovincereligion\s*=\s*$/.test(codePrefix) && inTriggerContext) {
    return [
      createSnippetItem(
        "provincereligion block",
        "{ data = ${1:orthodox} province = ${2:-1} }",
        "FTG provincereligion trigger",
        "000",
      ),
    ];
  }

  if (
    /\bprovince(?:culture|cityculture)\s*=\s*$/.test(codePrefix) &&
    inTriggerContext
  ) {
    return [
      createSnippetItem(
        "provinceculture block",
        "{ data = ${1:latin} province = ${2:-1} }",
        "FTG provinceculture trigger",
        "000",
      ),
    ];
  }

  // ── field completions inside trigger sub-blocks ────────────────────────────
  if (keyOnlyLine && (inCountrySubBlock || inRelationSubBlock)) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    const fields = inRelationSubBlock
      ? FTG_RELATION_SUB_BLOCK_FIELDS
      : FTG_COUNTRY_SUB_BLOCK_FIELDS;
    return createCompletionItems(
      fields,
      vscode.CompletionItemKind.Field,
      "FTG sub-block field",
      wordRange,
    );
  }

  if (keyOnlyLine && inProvReligionSubBlock) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_PROV_RELIGION_SUB_BLOCK_FIELDS,
      vscode.CompletionItemKind.Field,
      "FTG sub-block field",
      wordRange,
    );
  }

  if (keyOnlyLine && inProvCultureSubBlock) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_PROV_CULTURE_SUB_BLOCK_FIELDS,
      vscode.CompletionItemKind.Field,
      "FTG sub-block field",
      wordRange,
    );
  }

  // ── country = TAG inside trigger sub-blocks ────────────────────────────────
  if (
    /\bcountry\s*=\s*[A-Za-z0-9_]*$/.test(codePrefix) &&
    (inCountrySubBlock || inRelationSubBlock)
  ) {
    const wordRange = document.getWordRangeAtPosition(
      position,
      /[A-Za-z0-9_]+/,
    );
    const tags = [...completionData.countries, ...FTG_COUNTRY_SPECIAL_VALUES];
    return createCompletionItems(
      tags,
      vscode.CompletionItemKind.Value,
      "FTG country tag",
      wordRange,
    );
  }

  // ── data = X inside trigger sub-blocks ────────────────────────────────────
  if (/\bdata\s*=\s*[A-Za-z_]*$/.test(codePrefix) && inProvReligionSubBlock) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      completionData.religions || [],
      vscode.CompletionItemKind.Value,
      "FTG religion",
      wordRange,
    );
  }

  if (/\bdata\s*=\s*[A-Za-z_]*$/.test(codePrefix) && inProvCultureSubBlock) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      completionData.cultures || [],
      vscode.CompletionItemKind.Value,
      "FTG culture",
      wordRange,
    );
  }

  if (keyOnlyLine && inEvent && currentBlock === "event") {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_EVENT_FIELDS,
      vscode.CompletionItemKind.Field,
      "FTG event field",
      wordRange,
    );
  }

  if (keyOnlyLine && inHistoricalMonarch) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_MONARCH_BLOCK_FIELDS,
      vscode.CompletionItemKind.Field,
      "FTG monarch field",
      wordRange,
    );
  }

  if (keyOnlyLine && inHistoricalLeader) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_LEADER_BLOCK_FIELDS,
      vscode.CompletionItemKind.Field,
      "FTG leader field",
      wordRange,
    );
  }

  if (keyOnlyLine && inReligionListBlock) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      completionData.religions || [],
      vscode.CompletionItemKind.Value,
      "FTG religion",
      wordRange,
    );
  }

  if (keyOnlyLine && inReligionDefBlock) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_RELIGION_BLOCK_FIELDS,
      vscode.CompletionItemKind.Field,
      "FTG religion field",
      wordRange,
    );
  }

  if (keyOnlyLine && inDecision && currentBlock === "decision") {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_DECISION_FIELDS,
      vscode.CompletionItemKind.Field,
      "FTG decision field",
      wordRange,
    );
  }

  if (keyOnlyLine && inAction) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_ACTION_FIELDS,
      vscode.CompletionItemKind.Field,
      "FTG action field",
      wordRange,
    );
  }

  if (keyOnlyLine && inDateBlock) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_DATE_FIELDS,
      vscode.CompletionItemKind.Field,
      "FTG date field",
      wordRange,
    );
  }

  if (keyOnlyLine && inCommand) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_COMMAND_FIELDS,
      vscode.CompletionItemKind.Field,
      "FTG command field",
      wordRange,
    );
  }

  if (keyOnlyLine && inTriggerContext) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_TRIGGER_KEYS,
      vscode.CompletionItemKind.Keyword,
      "FTG trigger",
      wordRange,
    );
  }

  if (/\b(?:atwar|isvassal|elector|emperor|hre|ai)\s*=\s*$/.test(codePrefix)) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_BOOLEAN_VALUES,
      vscode.CompletionItemKind.Value,
      "FTG boolean value",
      wordRange,
    );
  }

  if (/\bmonth\s*=\s*[A-Za-z_]*$/.test(codePrefix)) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      FTG_MONTH_NAMES,
      vscode.CompletionItemKind.Value,
      "FTG month",
      wordRange,
    );
  }

  if (/\bai_chance\s*=\s*\d*$/.test(codePrefix)) {
    const wordRange = document.getWordRangeAtPosition(position, /\d+/);
    return createCompletionItems(
      FTG_AI_CHANCE_VALUES,
      vscode.CompletionItemKind.Value,
      "FTG AI chance (%)",
      wordRange,
    );
  }

  if (/\b(?:exists|tag|neighbour)\s*=\s*[A-Z0-9]*$/.test(codePrefix)) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Z0-9]+/);
    return createCompletionItems(
      completionData.countries,
      vscode.CompletionItemKind.Value,
      "FTG country tag",
      wordRange,
    );
  }

  if (
    /\b(?:religion|province_religion|heretic)\s*=\s*[a-z_]*$/.test(codePrefix)
  ) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      completionData.religions || [],
      vscode.CompletionItemKind.Value,
      "FTG religion",
      wordRange,
    );
  }

  if (/\bgroup\s*=\s*[a-z_]*$/.test(codePrefix)) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      ["christian", "muslim", "eastern", "pagan"],
      vscode.CompletionItemKind.Value,
      "FTG religion group",
      wordRange,
    );
  }

  if (/\btechgroup\s*=\s*[a-z_]*$/.test(codePrefix)) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      ["latin", "orthodox", "muslim", "china", "exotic", "african"],
      vscode.CompletionItemKind.Value,
      "FTG techgroup",
      wordRange,
    );
  }

  if (
    /\b(?:alliance|dynastic|vassal|union|war|truce)\s*=\s*$/.test(codePrefix)
  ) {
    return [
      createSnippetItem(
        "country pair condition",
        "{ country = ${1:TAG} country = ${2:TAG} }",
        "FTG trigger condition",
      ),
    ];
  }

  if (
    /\b(?:owned|control|core_national|core_claim|core_casusbelli|fortresslevel|provincepopulation|provinceculture|cityculture|provincereligion)\s*=\s*$/.test(
      codePrefix,
    )
  ) {
    return [
      createSnippetItem(
        "province/data condition",
        "{ province = ${1} data = ${2} }",
        "FTG trigger condition",
      ),
    ];
  }

  if (/\b(?:ownerchange|controlchange)\s*=\s*$/.test(codePrefix)) {
    return [
      createSnippetItem(
        "time condition",
        "{ province = ${1} years = ${2} months = ${3} days = ${4} }",
        "FTG trigger condition",
      ),
    ];
  }

  if (/\b(?:AND|OR|NOT|someof)\s*=\s*$/i.test(codePrefix)) {
    return [
      createSnippetItem(
        "logic block",
        "{\n\t${1}\n}",
        "FTG logical trigger block",
      ),
    ];
  }

  if (
    keyOnlyLine &&
    parentBlock &&
    (parentBlock === "event" || parentBlock === "decision")
  ) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);
    return createCompletionItems(
      ["action_a", "action_b", "action_c", "action_d", "action_e", "action"],
      vscode.CompletionItemKind.Field,
      "FTG action block",
      wordRange,
    );
  }

  if (inAction && /\bname\s*=\s*"[^"]*"\s*$/.test(codePrefix)) {
    return [
      createSnippetItem(
        "ai_chance field",
        "ai_chance = ${1:100}",
        "FTG action AI chance",
      ),
      createSnippetItem(
        "command field",
        "command = { type = ${1:stability} value = ${2:1} }",
        "FTG action command",
      ),
    ];
  }

  return undefined;
}

function getWhichSuggestions(type, completionData) {
  if (!type) {
    return [];
  }

  if (type === "domestic") {
    return FTG_DOMESTIC_SLIDERS;
  }

  if (type === "flag") {
    return FTG_GAME_FLAG_VALUES;
  }

  if (
    type === "religion" ||
    type === "provincereligion" ||
    type === "alt_provincereligion"
  ) {
    return completionData.religions;
  }

  if (type === "technology") {
    return completionData.techgroups;
  }

  if (type === "ai") {
    return completionData.aiFiles;
  }

  if (FTG_COUNTRY_TARGET_TYPES.has(type)) {
    return [...completionData.countries, ...FTG_COUNTRY_SPECIAL_VALUES];
  }

  if (FTG_PROVINCE_TARGET_TYPES.has(type)) {
    return FTG_PROVINCE_SPECIAL_VALUES;
  }

  return [];
}

function getValueSuggestions(type, completionData) {
  if (!type) {
    return [];
  }

  if (type === "gainbuilding") {
    return FTG_BUILDING_VALUES;
  }

  if (type === "losebuilding") {
    return FTG_LOSE_BUILDING_VALUES;
  }

  if (type === "gainmanufactory") {
    return FTG_MANUFACTORY_VALUES;
  }

  if (type === "hre") {
    return FTG_BOOLEAN_VALUES;
  }

  if (
    type === "religion" ||
    type === "provincereligion" ||
    type === "alt_provincereligion" ||
    type === "heretic"
  ) {
    return completionData.religions;
  }

  if (
    type === "provinceculture" ||
    type === "cityculture" ||
    type === "add_countryculture" ||
    type === "remove_countryculture"
  ) {
    return completionData.cultures;
  }

  if (type === "goods") {
    return [
      "naval_supplies",
      "slaves",
      "grain",
      "fish",
      "wool",
      "cloth",
      "naval_equipment",
      "wine",
      "salt",
      "copper",
      "ivory",
      "chinaware",
      "spices",
      "coffee",
      "cotton",
      "sugar",
      "tobacco",
      "tea",
      "fur",
      "gold",
    ];
  }

  return [];
}

function shouldValidateDocument(document) {
  const normalized = document.uri.fsPath.replace(/\\/g, "/").toLowerCase();
  return FTG_VALIDATION_SELECTOR.some((segment) =>
    normalized.includes(`/${segment.toLowerCase()}`),
  );
}

function rangeForValue(lineText, lineNo, value) {
  const idx = lineText.indexOf(value);
  if (idx < 0) {
    return new vscode.Range(lineNo, 0, lineNo, Math.max(lineText.length, 1));
  }
  return new vscode.Range(lineNo, idx, lineNo, idx + value.length);
}

function analyzeFtgLine(lineText, initialInString = false) {
  let codeText = "";
  let braceText = "";
  let inString = initialInString;

  for (let index = 0; index < lineText.length; index += 1) {
    const char = lineText[index];

    if (!inString && char === "#") {
      break;
    }

    if (char === '"') {
      inString = !inString;
      codeText += char;
      braceText += " ";
      continue;
    }

    if (inString) {
      codeText += char;
      braceText += " ";
      continue;
    }

    codeText += char;
    braceText += char;
  }

  return {
    codeText,
    braceText,
    endsInString: inString,
  };
}

function isValidAssignmentChain(text) {
  let index = 0;

  while (index < text.length) {
    while (index < text.length && /\s/.test(text[index])) {
      index += 1;
    }

    if (index >= text.length) {
      return true;
    }

    const keyMatch = text
      .slice(index)
      .match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (!keyMatch) {
      return false;
    }
    index += keyMatch[0].length;

    while (index < text.length && /\s/.test(text[index])) {
      index += 1;
    }

    if (text[index] !== "=") {
      return false;
    }
    index += 1;

    while (index < text.length && /\s/.test(text[index])) {
      index += 1;
    }

    if (index >= text.length) {
      return false;
    }

    if (text[index] === '"') {
      index += 1;
      while (index < text.length && text[index] !== '"') {
        index += 1;
      }
      if (index >= text.length) {
        return false;
      }
      index += 1;
      continue;
    }

    if (text[index] === "{") {
      let depth = 0;
      let inString = false;

      while (index < text.length) {
        const char = text[index];

        if (char === '"') {
          inString = !inString;
          index += 1;
          continue;
        }

        if (!inString) {
          if (char === "{") {
            depth += 1;
          } else if (char === "}") {
            depth -= 1;
            if (depth === 0) {
              index += 1;
              break;
            }
          }
        }

        index += 1;
      }

      if (depth !== 0) {
        return false;
      }
      continue;
    }

    const tokenMatch = text.slice(index).match(/^-?[A-Za-z0-9_\.]+/);
    if (!tokenMatch) {
      return false;
    }
    index += tokenMatch[0].length;
  }

  return true;
}

function findTrailingGarbageAfterField(codeText) {
  const assignMatch = codeText.match(
    /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/,
  );
  if (!assignMatch) {
    return null;
  }

  const field = assignMatch[1];
  const rhs = assignMatch[2] || "";
  if (!rhs) {
    return null;
  }

  let index = 0;
  while (index < rhs.length && /\s/.test(rhs[index])) {
    index += 1;
  }

  if (index >= rhs.length) {
    return null;
  }

  if (rhs[index] === '"') {
    index += 1;
    while (index < rhs.length) {
      if (rhs[index] === '"') {
        const garbage = rhs.slice(index + 1).trim();
        return garbage ? { field, garbage } : null;
      }
      index += 1;
    }
    return null;
  }

  if (rhs[index] === "{") {
    let depth = 0;
    let inString = false;

    for (; index < rhs.length; index += 1) {
      const char = rhs[index];

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          const garbage = rhs.slice(index + 1).trim();
          return garbage ? { field, garbage } : null;
        }
      }
    }

    return null;
  }

  while (index < rhs.length && !/\s/.test(rhs[index])) {
    index += 1;
  }

  const garbage = rhs.slice(index).trim();
  if (garbage && isValidAssignmentChain(garbage)) {
    return null;
  }
  return garbage ? { field, garbage } : null;
}

function validateFieldPlacementInTriggerSubBlock(
  diagnostics,
  codeText,
  lineNo,
  currentBlock,
  parentBlock,
) {
  if (!currentBlock) {
    return;
  }

  const allowedFields = FTG_TRIGGER_SUB_BLOCK_ALLOWED_FIELDS.get(currentBlock);
  if (!allowedFields) {
    return;
  }

  if (!FTG_TRIGGER_CONTEXT_BLOCKS.has(parentBlock)) {
    return;
  }

  const blockOpenRe = new RegExp(`\\b${currentBlock}\\s*=\\s*\\{`, "i");
  if (blockOpenRe.test(codeText)) {
    return;
  }

  const fieldAssignRe = /\b([A-Za-z_][A-Za-z0-9_]*)\s*=/g;
  let match = fieldAssignRe.exec(codeText);
  while (match) {
    const field = (match[1] || "").toLowerCase();
    if (!allowedFields.has(field)) {
      diagnostics.push(
        new vscode.Diagnostic(
          rangeForValue(codeText, lineNo, match[1]),
          `Field '${match[1]}' is not valid inside '${currentBlock}' block. Allowed: ${[...allowedFields].join(", ")}.`,
          vscode.DiagnosticSeverity.Warning,
        ),
      );
    }
    match = fieldAssignRe.exec(codeText);
  }
}

function validateTopLevelFieldPlacement(
  diagnostics,
  codeText,
  lineNo,
  currentBlock,
  filePath,
) {
  if (currentBlock) {
    return;
  }

  const isStructuredFtgFile = isStructuredFtgFilePath(filePath);
  if (!isStructuredFtgFile) {
    return;
  }

  const assignMatch = codeText.match(
    /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$/,
  );
  if (!assignMatch) {
    const trimmed = codeText.trim();
    const hasWordLikeToken = /[A-Za-z0-9_]/.test(trimmed);
    if (hasWordLikeToken) {
      diagnostics.push(
        new vscode.Diagnostic(
          rangeForValue(codeText, lineNo, trimmed),
          "Unexpected content outside any FTG block. Check missing/extra braces or remove stray text.",
          vscode.DiagnosticSeverity.Warning,
        ),
      );
    }
    return;
  }

  const key = (assignMatch[1] || "").toLowerCase();
  const rhs = (assignMatch[2] || "").trim();
  const isValidTopLevelHeader =
    rhs.startsWith("{") && FTG_TOP_LEVEL_BLOCK_KEYS.has(key);
  if (isValidTopLevelHeader) {
    return;
  }

  diagnostics.push(
    new vscode.Diagnostic(
      rangeForValue(codeText, lineNo, assignMatch[1]),
      `Field '${assignMatch[1]}' appears outside any FTG block. Check missing/extra braces or move it inside the correct block.`,
      vscode.DiagnosticSeverity.Warning,
    ),
  );
}

function isStructuredFtgFilePath(filePath) {
  return (
    /[\\/]Db[\\/](Events|Decisions|Monarchs|Leaders)[\\/].*\.txt$/i.test(
      filePath,
    ) || /\.eue$/i.test(filePath)
  );
}

function validateUnexpectedContentInsideBlock(
  diagnostics,
  codeText,
  lineNo,
  currentBlock,
  filePath,
  isReligionsFile,
) {
  if (!currentBlock) {
    return;
  }

  if (!isStructuredFtgFilePath(filePath)) {
    return;
  }

  const trimmed = codeText.trim();
  if (!trimmed || /^[{}\s]+$/.test(trimmed)) {
    return;
  }

  if (trimmed.includes("=")) {
    return;
  }

  if (
    isReligionsFile &&
    FTG_RELIGION_LIST_BLOCKS.has(currentBlock) &&
    /^[a-z][a-z_0-9]*$/i.test(trimmed)
  ) {
    return;
  }

  diagnostics.push(
    new vscode.Diagnostic(
      rangeForValue(codeText, lineNo, trimmed),
      `Unexpected content inside '${currentBlock}' block. Remove stray text or turn it into a valid FTG field.`,
      vscode.DiagnosticSeverity.Warning,
    ),
  );
}

function validateTrailingGarbageAfterValidContent(
  diagnostics,
  codeText,
  lineNo,
  currentBlock,
  filePath,
) {
  if (!currentBlock) {
    return;
  }

  if (!isStructuredFtgFilePath(filePath)) {
    return;
  }

  const trailingGarbage = findTrailingGarbageAfterField(codeText);
  if (!trailingGarbage) {
    return;
  }

  diagnostics.push(
    new vscode.Diagnostic(
      rangeForValue(codeText, lineNo, trailingGarbage.garbage),
      `Unexpected trailing content after valid FTG field '${trailingGarbage.field}'. Remove stray text '${trailingGarbage.garbage}'.`,
      vscode.DiagnosticSeverity.Warning,
    ),
  );
}

function validateGarbageAfterBlockOpener(
  diagnostics,
  codeText,
  lineNo,
  currentBlock,
  filePath,
) {
  if (!currentBlock) {
    return;
  }

  if (!isStructuredFtgFilePath(filePath)) {
    return;
  }

  const match = codeText.match(
    /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{\s*([^#}]*)$/,
  );
  if (!match) {
    return;
  }

  const afterBrace = (match[2] || "").trim();
  if (!afterBrace) {
    return;
  }

  if (afterBrace.includes("=")) {
    return;
  }

  diagnostics.push(
    new vscode.Diagnostic(
      rangeForValue(codeText, lineNo, afterBrace),
      `Unexpected content after opening '{' in '${match[1]}' block. Remove stray text '${afterBrace}'.`,
      vscode.DiagnosticSeverity.Warning,
    ),
  );
}

function validateFtgDocument(document) {
  try {
  if (!shouldValidateDocument(document)) {
    return [];
  }

  const root = getWorkspaceRoot(document);
  const completionData = root
    ? getCompletionData(root)
    : {
        cultures: [],
        religions: [],
        techgroups: [],
        countries: [],
        aiFiles: [],
      };
  const provinceMap = root ? getProvinceMap(root) : undefined;
  const crossFileIdIndex = root ? getCrossFileIdIndex(root) : undefined;
  const diagnostics = [];

  const filePath = document.uri.fsPath;
  const isReligionsFile = /religions\.txt$/i.test(filePath);
  const isStructuredFtgFile = isStructuredFtgFilePath(filePath);

  const religionSet = new Set(
    (completionData.religions || []).map((value) => value.toLowerCase()),
  );
  const countrySet = new Set(
    (completionData.countries || []).map((value) => value.toUpperCase()),
  );
  const domesticSet = new Set(
    FTG_DOMESTIC_SLIDERS.map((value) => value.toLowerCase()),
  );
  const cultureSet = new Set(
    (completionData.cultures || []).map((value) => value.toLowerCase()),
  );
  // yes/no boolean trigger fields
  const BOOL_TRIGGER_FIELDS = new Set([
    "atwar",
    "isvassal",
    "elector",
    "emperor",
    "hre",
    "ai",
    "city",
    "bankrupt",
    "revolt",
    "occupied",
  ]);
  // country-tag trigger fields (single value on same line)
  const COUNTRY_TAG_TRIGGER_FIELDS = new Set([
    "exists",
    "tag",
    "neighbour",
    "overlord",
    "vassal",
    "alliance",
    "war",
    "dynastic",
  ]);
  // province-id trigger fields
  const PROVINCE_ID_TRIGGER_FIELDS = new Set(["owned", "control"]);

  const braceStack = [];
  // tracks block names for context (parallels braceStack)
  const blockNameStack = [];
  // tracks "type = X" value per depth inside command blocks: depth -> commandType
  const commandTypeByDepth = new Map();
  // event/decision ID uniqueness: id -> { lineNo, colStart }
  const eventIdMap = new Map();
  const decisionIdMap = new Map();
  let inMultilineString = false;

  for (let lineNo = 0; lineNo < document.lineCount; lineNo += 1) {
    const lineText = document.lineAt(lineNo).text;
    const analyzedLine = analyzeFtgLine(lineText, inMultilineString);
    const wasInMultilineString = inMultilineString;
    inMultilineString = analyzedLine.endsInString;
    const braceText = analyzedLine.braceText;
    const codeText = analyzedLine.codeText;

    // track block open/close before character scan so blockNameStack stays in sync
    // detect "blockname = {" on this line to name outgoing blocks
    const blockOpenMatch = codeText.match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{/);

    let openedOnThisLine = false;
    for (let charNo = 0; charNo < braceText.length; charNo += 1) {
      const char = braceText[charNo];
      if (char === "{") {
        braceStack.push({ lineNo, charNo });
        const blockName =
          !openedOnThisLine && blockOpenMatch
            ? blockOpenMatch[1].toLowerCase()
            : null;
        blockNameStack.push(blockName);
        openedOnThisLine = true;
      } else if (char === "}") {
        if (!braceStack.length) {
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(lineNo, charNo, lineNo, charNo + 1),
              "Unmatched closing brace '}'.",
              vscode.DiagnosticSeverity.Error,
            ),
          );
        } else {
          const depth = braceStack.length;
          commandTypeByDepth.delete(depth);
          braceStack.pop();
          blockNameStack.pop();
        }
      }
    }

    if (!codeText.trim()) {
      continue;
    }

    if (wasInMultilineString) {
      continue;
    }

    // current block context (innermost)
    const currentBlock = blockNameStack.length
      ? blockNameStack[blockNameStack.length - 1]
      : null;
    const parentBlock =
      blockNameStack.length > 1
        ? blockNameStack[blockNameStack.length - 2]
        : null;

    // ── misplaced fields outside blocks ─────────────────────────────────────
    validateTopLevelFieldPlacement(
      diagnostics,
      codeText,
      lineNo,
      currentBlock,
      filePath,
    );

    // ── stray standalone text inside blocks ────────────────────────────────
    validateUnexpectedContentInsideBlock(
      diagnostics,
      codeText,
      lineNo,
      currentBlock,
      filePath,
      isReligionsFile,
    );

    // ── trailing garbage after valid field content ─────────────────────────
    validateTrailingGarbageAfterValidContent(
      diagnostics,
      codeText,
      lineNo,
      currentBlock,
      filePath,
    );

    // ── garbage immediately after block opener ─────────────────────────────
    validateGarbageAfterBlockOpener(
      diagnostics,
      codeText,
      lineNo,
      currentBlock,
      filePath,
    );

    // ── track type = X inside command blocks ─────────────────────────────────
    if (currentBlock === "command") {
      const typeMatch = codeText.match(
        /\btype\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\b/i,
      );
      if (typeMatch) {
        commandTypeByDepth.set(braceStack.length, typeMatch[1].toLowerCase());
      }
    }

    // ── misplaced fields in trigger sub-blocks ──────────────────────────────
    validateFieldPlacementInTriggerSubBlock(
      diagnostics,
      codeText,
      lineNo,
      currentBlock,
      parentBlock,
    );

    // ── track type = X inside command blocks ─────────────────────────────────
    if (currentBlock === "command") {
      const typeMatch = codeText.match(
        /\btype\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\b/i,
      );
      if (typeMatch) {
        commandTypeByDepth.set(braceStack.length, typeMatch[1].toLowerCase());
      }
    }

    // ── religions.txt: bare religion name token in list blocks ───────────────
    if (
      isReligionsFile &&
      currentBlock &&
      FTG_RELIGION_LIST_BLOCKS.has(currentBlock)
    ) {
      const bareWordMatch = codeText.match(/^\s*([a-z][a-z_0-9]*)\s*$/i);
      if (bareWordMatch) {
        const value = bareWordMatch[1];
        if (!religionSet.has(value.toLowerCase()) && religionSet.size > 0) {
          diagnostics.push(
            new vscode.Diagnostic(
              rangeForValue(codeText, lineNo, value),
              `Unknown religion '${value}' in '${currentBlock}' list.`,
              vscode.DiagnosticSeverity.Warning,
            ),
          );
        }
      }
    }

    // ── type = religion/alt_provincereligion ... value = X (single-line cmd) ──
    const cmdRelMatch = codeText.match(
      /\btype\s*=\s*(religion|alt_provincereligion)\b[^\n\r}]*\bvalue\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\b/i,
    );
    if (cmdRelMatch) {
      const value = cmdRelMatch[2];
      if (!religionSet.has(value.toLowerCase()) && religionSet.size > 0) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown religion '${value}'. Check Db/Religions/religions.txt.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }

    // ── type = religion ... which = X (same line or multi-line command block) ─
    const cmdRelWhichSameLine = codeText.match(
      /\btype\s*=\s*(religion|alt_provincereligion)\b[^\n\r}]*\bwhich\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\b/i,
    );
    if (cmdRelWhichSameLine) {
      const value = cmdRelWhichSameLine[2];
      if (!religionSet.has(value.toLowerCase()) && religionSet.size > 0) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown religion '${value}'. Check Db/Religions/religions.txt.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    } else if (currentBlock === "command") {
      // multi-line: which = X on a separate line
      const cmdType = commandTypeByDepth.get(braceStack.length);
      if (cmdType === "religion" || cmdType === "alt_provincereligion") {
        const whichMatch = codeText.match(
          /\bwhich\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\b/i,
        );
        if (whichMatch) {
          const value = whichMatch[1];
          if (!religionSet.has(value.toLowerCase()) && religionSet.size > 0) {
            diagnostics.push(
              new vscode.Diagnostic(
                rangeForValue(codeText, lineNo, value),
                `Unknown religion '${value}'. Check Db/Religions/religions.txt.`,
                vscode.DiagnosticSeverity.Warning,
              ),
            );
          }
        }
      }
    }

    // ── religion = X ──────────────────────────────────────────────────────────
    const religionMatch = codeText.match(
      /\breligion\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\b/i,
    );
    if (religionMatch) {
      const value = religionMatch[1];
      if (!religionSet.has(value.toLowerCase())) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown religion '${value}'. Check Db/Religions/religions.txt.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }

    // ── type = domestic which = X ─────────────────────────────────────────────
    const domesticMatch = codeText.match(
      /\btype\s*=\s*domestic\b[^\n\r}]*\bwhich\s*=\s*([A-Za-z_]+)\b/i,
    );
    if (domesticMatch) {
      const value = domesticMatch[1];
      if (!domesticSet.has(value.toLowerCase())) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown domestic slider '${value}'.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }

    // ── type = relation which = TAG ───────────────────────────────────────────
    const relationMatch = codeText.match(
      /\btype\s*=\s*relation\b[^\n\r}]*\bwhich\s*=\s*([A-Za-z0-9_]+)\b/i,
    );
    if (relationMatch) {
      const value = relationMatch[1];
      const upper = value.toUpperCase();
      const isSpecial =
        FTG_COUNTRY_SPECIAL_VALUES.includes(value) ||
        FTG_COUNTRY_SPECIAL_VALUES.includes(upper.toLowerCase());
      if (!countrySet.has(upper) && !isSpecial) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown country tag '${value}' for relation.which.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }

    // ── type = addcore which = N ──────────────────────────────────────────────
    const addcoreMatch = codeText.match(
      /\btype\s*=\s*addcore\b[^\n\r}]*\bwhich\s*=\s*(-?\d+)\b/i,
    );
    if (addcoreMatch) {
      const value = addcoreMatch[1];
      const num = Number(value);
      if (
        Number.isFinite(num) &&
        num > 0 &&
        provinceMap &&
        !provinceMap.has(String(num))
      ) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown province id '${value}' for addcore.which.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }

    // ── action_X letter must be a-e ──────────────────────────────────────────
    const actionLetterMatch = codeText.match(/\baction_([A-Za-z])\s*=/i);
    if (actionLetterMatch) {
      const letter = actionLetterMatch[1].toLowerCase();
      if (!"abcde".includes(letter)) {
        const badToken = `action_${actionLetterMatch[1]}`;
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, badToken),
            `Invalid action name '${badToken}'. Only action_a through action_e are valid.`,
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }

    // ── id format + uniqueness (event/decision) ─────────────────────────────
    const idFieldMatch = codeText.match(/^\s*id\s*=\s*(.+?)\s*$/i);
    if (idFieldMatch) {
      const rawIdValue = (idFieldMatch[1] || "").trim();
      if (!/^\d+$/.test(rawIdValue)) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, rawIdValue || "id"),
            `Invalid id value '${rawIdValue}'. Field 'id' must contain only digits.`,
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }

    const idMatch = codeText.match(/^\s*id\s*=\s*(\d+)\s*$/i);
    if (idMatch) {
      const idVal = idMatch[1];
      const outerBlock = blockNameStack.length ? blockNameStack[0] : null;
      if (outerBlock === "event") {
        if (eventIdMap.has(idVal)) {
          diagnostics.push(
            new vscode.Diagnostic(
              rangeForValue(codeText, lineNo, idVal),
              `Duplicate event id '${idVal}' (first defined at line ${eventIdMap.get(idVal) + 1}).`,
              vscode.DiagnosticSeverity.Warning,
            ),
          );
        } else {
          eventIdMap.set(idVal, lineNo);
        }

        const refs = crossFileIdIndex?.events?.get(idVal) || [];
        const currentFileNorm = path.resolve(filePath).toLowerCase();
        const externalRefs = refs.filter(
          (ref) => path.resolve(ref.filePath).toLowerCase() !== currentFileNorm,
        );
        if (externalRefs.length > 0) {
          const firstRef = externalRefs[0];
          const relPath = root
            ? path.relative(root, firstRef.filePath).replace(/\\/g, "/")
            : firstRef.filePath;
          const suffix =
            externalRefs.length > 1
              ? ` (+${externalRefs.length - 1} more)`
              : "";

          diagnostics.push(
            new vscode.Diagnostic(
              rangeForValue(codeText, lineNo, idVal),
              `Duplicate event id '${idVal}' also found in '${relPath}' (line ${firstRef.lineNo + 1})${suffix}.`,
              vscode.DiagnosticSeverity.Warning,
            ),
          );
        }
      } else if (outerBlock === "decision") {
        if (decisionIdMap.has(idVal)) {
          diagnostics.push(
            new vscode.Diagnostic(
              rangeForValue(codeText, lineNo, idVal),
              `Duplicate decision id '${idVal}' (first defined at line ${decisionIdMap.get(idVal) + 1}).`,
              vscode.DiagnosticSeverity.Warning,
            ),
          );
        } else {
          decisionIdMap.set(idVal, lineNo);
        }

        const refs = crossFileIdIndex?.decisions?.get(idVal) || [];
        const currentFileNorm = path.resolve(filePath).toLowerCase();
        const externalRefs = refs.filter(
          (ref) => path.resolve(ref.filePath).toLowerCase() !== currentFileNorm,
        );
        if (externalRefs.length > 0) {
          const firstRef = externalRefs[0];
          const relPath = root
            ? path.relative(root, firstRef.filePath).replace(/\\/g, "/")
            : firstRef.filePath;
          const suffix =
            externalRefs.length > 1
              ? ` (+${externalRefs.length - 1} more)`
              : "";

          diagnostics.push(
            new vscode.Diagnostic(
              rangeForValue(codeText, lineNo, idVal),
              `Duplicate decision id '${idVal}' also found in '${relPath}' (line ${firstRef.lineNo + 1})${suffix}.`,
              vscode.DiagnosticSeverity.Warning,
            ),
          );
        }
      }
    }

    // ── offset must be a positive integer ────────────────────────────────────
    const offsetMatch = codeText.match(/\boffset\s*=\s*(-?[\d.]+)/);
    if (offsetMatch) {
      const raw = offsetMatch[1];
      const num = Number(raw);
      if (!Number.isInteger(num) || num < 0) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, raw),
            `'offset' must be a non-negative integer, got '${raw}'.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }
    const countryTagTriggerMatch = codeText.match(
      /\b(exists|tag|neighbour|overlord)\s*=\s*([A-Za-z0-9_]+)\b/i,
    );
    if (countryTagTriggerMatch) {
      const field = countryTagTriggerMatch[1].toLowerCase();
      const value = countryTagTriggerMatch[2];
      const upper = value.toUpperCase();
      const isNumSpecial = [
        "-1",
        "-2",
        "-3",
        "-4",
        "-5",
        "-6",
        "-7",
        "-9",
      ].includes(value);
      const isWordSpecial =
        FTG_COUNTRY_SPECIAL_VALUES.includes(value) ||
        FTG_COUNTRY_SPECIAL_VALUES.includes(upper.toLowerCase());
      if (
        COUNTRY_TAG_TRIGGER_FIELDS.has(field) &&
        !isNumSpecial &&
        !isWordSpecial &&
        !countrySet.has(upper)
      ) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown country tag '${value}' for trigger '${field}'.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }

    // ── trigger: country = TAG (in sub-blocks: alliance/vassal/war/...) ───────
    const countryFieldMatch = codeText.match(
      /\bcountry\s*=\s*([A-Za-z0-9_]+)\b/i,
    );
    if (countryFieldMatch) {
      const value = countryFieldMatch[1];
      const upper = value.toUpperCase();
      const isNumSpecial = [
        "-1",
        "-2",
        "-3",
        "-4",
        "-5",
        "-6",
        "-7",
        "-9",
      ].includes(value);
      const isWordSpecial =
        FTG_COUNTRY_SPECIAL_VALUES.includes(value) ||
        FTG_COUNTRY_SPECIAL_VALUES.includes(upper.toLowerCase());
      if (!isNumSpecial && !isWordSpecial && !countrySet.has(upper)) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown country tag '${value}' for 'country'.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }

    // ── trigger: owned/control = N ────────────────────────────────────────────
    const provinceTriggerMatch = codeText.match(
      /\b(owned|control)\s*=\s*(-?\d+)\b/i,
    );
    if (provinceTriggerMatch) {
      const field = provinceTriggerMatch[1];
      const value = provinceTriggerMatch[2];
      const num = Number(value);
      if (
        Number.isFinite(num) &&
        num > 0 &&
        provinceMap &&
        !provinceMap.has(String(num))
      ) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown province id '${value}' for trigger '${field}'.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }

    // ── trigger: yes/no boolean fields ───────────────────────────────────────
    const boolFieldMatch = codeText.match(
      /\b(atwar|isvassal|elector|emperor|hre|bankrupt|revolt|occupied|city)\s*=\s*([A-Za-z0-9_]+)\b/i,
    );
    if (boolFieldMatch) {
      const value = boolFieldMatch[2].toLowerCase();
      if (value !== "yes" && value !== "no") {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, boolFieldMatch[2]),
            `Field '${boolFieldMatch[1]}' expects 'yes' or 'no', got '${boolFieldMatch[2]}'.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }

    // ── trigger: data = X inside provincereligion / provinceculture blocks ────
    const dataMatch = codeText.match(
      /\bdata\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\b/i,
    );
    if (dataMatch && currentBlock) {
      const value = dataMatch[1];
      if (
        (currentBlock === "provincereligion" ||
          currentBlock === "changeprovinceculture") &&
        !religionSet.has(value.toLowerCase()) &&
        religionSet.size > 0
      ) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown religion '${value}' for '${currentBlock}.data'.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      } else if (
        (currentBlock === "provinceculture" ||
          currentBlock === "cityculture") &&
        !cultureSet.has(value.toLowerCase()) &&
        cultureSet.size > 0
      ) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown culture '${value}' for '${currentBlock}.data'.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }

    // ── single-line: provincereligion = { data = X } ─────────────────────────
    const inlineProvRelMatch = codeText.match(
      /\bprovincereligion\s*=\s*\{[^}]*\bdata\s*=\s*([A-Za-z_][A-Za-z0-9_]*)/i,
    );
    if (inlineProvRelMatch) {
      const value = inlineProvRelMatch[1];
      if (!religionSet.has(value.toLowerCase()) && religionSet.size > 0) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown religion '${value}' for provincereligion.data.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }

    // ── single-line: provinceculture = { data = X } ──────────────────────────
    const inlineProvCulMatch = codeText.match(
      /\bprovince(?:culture|cityculture)\s*=\s*\{[^}]*\bdata\s*=\s*([A-Za-z_][A-Za-z0-9_]*)/i,
    );
    if (inlineProvCulMatch) {
      const value = inlineProvCulMatch[1];
      if (!cultureSet.has(value.toLowerCase()) && cultureSet.size > 0) {
        diagnostics.push(
          new vscode.Diagnostic(
            rangeForValue(codeText, lineNo, value),
            `Unknown culture '${value}' for provinceculture.data.`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }
  }

  for (const openBrace of braceStack) {
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(
          openBrace.lineNo,
          openBrace.charNo,
          openBrace.lineNo,
          openBrace.charNo + 1,
        ),
        "Opening brace '{' is not closed.",
        vscode.DiagnosticSeverity.Error,
      ),
    );
  }

  return diagnostics;
  } catch (error) {
    const message =
      error && error.message
        ? `FTG validation internal error: ${error.message}`
        : "FTG validation internal error.";
    return [
      new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 1),
        message,
        vscode.DiagnosticSeverity.Error,
      ),
    ];
  }
}

function provideFtgCompletionItems(document, position) {
  const linePrefix = document
    .lineAt(position.line)
    .text.slice(0, position.character);
  const codePrefix = linePrefix.split("#")[0];
  const root = getWorkspaceRoot(document);
  const completionData = root
    ? getCompletionData(root)
    : {
        cultures: [],
        religions: [],
        techgroups: [],
        countries: [],
        aiFiles: [],
      };

  const structureItems = provideStructureCompletionItems(
    document,
    position,
    codePrefix,
    completionData,
  );
  if (structureItems?.length) {
    return structureItems;
  }

  if (/\bcommand\s*=\s*$/.test(codePrefix)) {
    const withWhich = new vscode.CompletionItem(
      "command block (type + which)",
      vscode.CompletionItemKind.Snippet,
    );
    withWhich.insertText = new vscode.SnippetString(
      "{ type = ${1|trigger,sleepevent,setflag,clrflag,provincetax,provincemanpower,provinceculture,provincereligion,sleepmonarch,wakemonarch,sleepleader,wakeleader|} which = ${2} }",
    );
    withWhich.detail = "FTG command block";
    withWhich.sortText = "000";

    const withValue = new vscode.CompletionItem(
      "command block (type + value)",
      vscode.CompletionItemKind.Snippet,
    );
    withValue.insertText = new vscode.SnippetString(
      "{ type = ${1|treasury,stability,inflation,relation,domestic,manpower,diplomats,merchants,colonists,missionaries|} value = ${2} }",
    );
    withValue.detail = "FTG command block";
    withValue.sortText = "001";

    const emptyBlock = new vscode.CompletionItem(
      "command block (empty)",
      vscode.CompletionItemKind.Snippet,
    );
    emptyBlock.insertText = new vscode.SnippetString("{ ${1} }");
    emptyBlock.detail = "FTG command block";
    emptyBlock.sortText = "002";

    return [withWhich, withValue, emptyBlock];
  }

  if (/\btype\s*=\s*[A-Za-z_]*$/.test(codePrefix)) {
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]+/);

    return createCompletionItems(
      FTG_COMMAND_TYPE_SUGGESTIONS,
      vscode.CompletionItemKind.Value,
      "FTG command type",
      wordRange,
    );
  }

  if (/\bwhich\s*=\s*"?[A-Za-z0-9_\-]*"?$/.test(codePrefix)) {
    const type = extractCommandType(codePrefix);
    const suggestions = getWhichSuggestions(type, completionData);
    if (suggestions.length) {
      const wordRange = document.getWordRangeAtPosition(
        position,
        /[A-Za-z0-9_\-]+/,
      );
      return createCompletionItems(
        suggestions,
        vscode.CompletionItemKind.Value,
        `FTG which value for ${type}`,
        wordRange,
        type === "ai",
      );
    }
  }

  if (/\bvalue\s*=\s*"?[A-Za-z0-9_\-]*"?$/.test(codePrefix)) {
    const type = extractCommandType(codePrefix);
    const suggestions = getValueSuggestions(type, completionData);
    if (suggestions.length) {
      const wordRange = document.getWordRangeAtPosition(
        position,
        /[A-Za-z0-9_\-]+/,
      );
      return createCompletionItems(
        suggestions,
        vscode.CompletionItemKind.Value,
        `FTG value for ${type}`,
        wordRange,
      );
    }
  }

  if (/\bcommand\s*=\s*\{\s*$/.test(codePrefix)) {
    const item = new vscode.CompletionItem(
      "type field",
      vscode.CompletionItemKind.Snippet,
    );
    item.insertText = new vscode.SnippetString("type = ${1}");
    item.detail = "FTG command field";
    return [item];
  }

  return undefined;
}

class FtgRefsCodeLensProvider {
  provideCodeLenses(document) {
    const enabled = vscode.workspace
      .getConfiguration("ftgRefs")
      .get("enableCodeLens", true);
    if (!enabled) {
      return [];
    }

    const lenses = [];

    for (let i = 0; i < document.lineCount; i += 1) {
      const text = document.lineAt(i).text;
      if (text.trimStart().startsWith("#")) {
        continue;
      }

      const commandEventRefs = parseCommandEventReferencesInLine(text);
      for (const ref of commandEventRefs) {
        if (ref.kind === "monarch" || ref.kind === "leader") {
          continue;
        }
        const range = new vscode.Range(i, 0, i, Math.max(text.length, 1));
        lenses.push(
          new vscode.CodeLens(range, {
            title: `References (inline): event ${ref.id} [${ref.type}]`,
            command: "ftgRefs.showReferences",
            arguments: ["id", ref.id, document.uri, i],
          }),
        );
      }

      const parsed = parseSymbolFromLine(text);
      if (!parsed) {
        continue;
      }

      const range = new vscode.Range(i, 0, i, Math.max(text.length, 1));
      lenses.push(
        new vscode.CodeLens(range, {
          title: `References (inline): ${parsed.label}`,
          command: "ftgRefs.showReferences",
          arguments: [parsed.kind, parsed.symbol, document.uri, i],
        }),
      );
    }

    return lenses;
  }
}

function activate(context) {
  const selector = [
    { language: "ftg", scheme: "file" },
    { pattern: "**/Db/**", scheme: "file" },
    { pattern: "**/AI/**", scheme: "file" },
    { pattern: "**/Scenarios/**", scheme: "file" },
    { pattern: "**/Localisation/**", scheme: "file" },
  ];

  const provider = new FtgRefsCodeLensProvider();
  const validationCollection =
    vscode.languages.createDiagnosticCollection("ftgValidation");
  context.subscriptions.push(validationCollection);

  const refreshValidation = (document) => {
    if (!document || !shouldValidateDocument(document)) {
      return;
    }

    try {
      validationCollection.set(document.uri, validateFtgDocument(document));
    } catch (error) {
      const message =
        error && error.message
          ? `FTG refresh validation error: ${error.message}`
          : "FTG refresh validation error.";
      validationCollection.set(document.uri, [
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 1),
          message,
          vscode.DiagnosticSeverity.Error,
        ),
      ]);
    }
  };

  const refreshOpenValidations = () => {
    for (const document of vscode.workspace.textDocuments) {
      refreshValidation(document);
    }
  };

  refreshOpenValidations();

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(selector, provider),
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      selector,
      {
        provideCompletionItems: (document, position) =>
          provideFtgCompletionItems(document, position),
      },
      "=",
      " ",
      "{",
    ),
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      clearAllCaches();
      refreshValidation(document);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidCreateFiles(() => {
      clearAllCaches();
      refreshOpenValidations();
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidDeleteFiles(() => {
      clearAllCaches();
      refreshOpenValidations();
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidRenameFiles(() => {
      clearAllCaches();
      refreshOpenValidations();
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      refreshValidation(document);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      refreshValidation(event.document);
    }),
  );

  context.subscriptions.push(
    vscode.languages.registerInlayHintsProvider(selector, {
      provideInlayHints: (document, range) => {
        const cfg = vscode.workspace.getConfiguration("ftgRefs");
        const enabled = cfg.get("enableProvinceInlayHints", true);
        if (!enabled) {
          return [];
        }

        const root = getWorkspaceRoot(document);
        if (!root) {
          return [];
        }

        let provinceMap;
        let lookups;
        try {
          provinceMap = getProvinceMap(root);
          lookups = getDbLookups(root);
        } catch {
          return [];
        }

        if (!provinceMap && !lookups) {
          return [];
        }

        const hints = [];
        for (
          let lineNo = range.start.line;
          lineNo <= range.end.line;
          lineNo += 1
        ) {
          const lineText = document.lineAt(lineNo).text;
          if (lineText.trimStart().startsWith("#")) {
            continue;
          }

          const codeText = lineText.split("#")[0];

          const lineTargets = [];

          const provinceIds = parseProvinceIdsInLine(codeText, lineNo);
          for (const item of provinceIds) {
            lineTargets.push({
              kind: "province",
              id: item.id,
              hintPos: item.hintPos,
            });
          }

          const commandTargets = parseCommandWhichTargetsInLine(
            codeText,
            lineNo,
          );
          for (const item of commandTargets) {
            lineTargets.push(item);
          }

          const eventTargets = parseEventIdsInLine(codeText, lineNo);
          for (const item of eventTargets) {
            lineTargets.push(item);
          }

          const monarchTargets = parseMonarchIdsInLine(codeText, lineNo);
          for (const item of monarchTargets) {
            lineTargets.push(item);
          }

          const countryTargets = parseCountryTagsInLine(codeText, lineNo);
          for (const item of countryTargets) {
            lineTargets.push(item);
          }

          for (const item of lineTargets) {
            let label;

            if (item.kind === "province") {
              const provinceNameRaw = provinceMap
                ? provinceMap.get(item.id)
                : undefined;
              const provinceName = normalizeDbName(provinceNameRaw);
              label = provinceName
                ? `  ⟶ ${provinceName}`
                : `  ⟶ [unknown province ${item.id}]`;
            } else if (item.kind === "event") {
              const eventName = lookups?.events?.get(item.id);
              label = eventName
                ? `  ⟶ event: ${eventName}`
                : `  ⟶ [unknown event ${item.id}]`;
            } else if (item.kind === "monarch") {
              const monarchName = lookups?.monarchs?.get(item.id);
              label = monarchName
                ? `  ⟶ monarch: ${monarchName}`
                : `  ⟶ [unknown monarch ${item.id}]`;
            } else if (item.kind === "leader") {
              const leaderName = lookups?.leaders?.get(item.id);
              label = leaderName
                ? `  ⟶ leader: ${leaderName}`
                : `  ⟶ [unknown leader ${item.id}]`;
            } else if (item.kind === "country") {
              const countryName = lookups?.countries?.get(item.id);
              label = countryName
                ? `  ⟶ country: ${countryName}`
                : `  ⟶ [unknown country ${item.id}]`;
            }

            if (!label) {
              continue;
            }

            const hint = new vscode.InlayHint(
              item.hintPos,
              label,
              vscode.InlayHintKind.Type,
            );
            hint.paddingLeft = true;
            hints.push(hint);
          }
        }

        return hints;
      },
    }),
  );

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, {
      provideDefinition: async (document, position) => {
        const parsed = parseSymbolAtPosition(document, position);
        if (!parsed) {
          return undefined;
        }

        const root = getWorkspaceRoot(document);
        if (!root) {
          return undefined;
        }

        try {
          const items = await resolveRefs(root, parsed.kind, parsed.symbol);
          const defs = pickDefinitionCandidates(parsed.kind, items);

          if (!defs.length) {
            return undefined;
          }

          return toLocations(defs);
        } catch {
          return undefined;
        }
      },
    }),
  );

  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(selector, {
      provideReferences: async (document, position) => {
        const parsed = parseSymbolAtPosition(document, position);
        if (!parsed) {
          return undefined;
        }

        try {
          return await getReferenceLocations(
            parsed.kind,
            parsed.symbol,
            document,
          );
        } catch {
          return undefined;
        }
      },
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ftgRefs.showReferences",
      async (kind, symbol, uri, lineNo) => {
        const doc = uri
          ? await vscode.workspace.openTextDocument(uri)
          : vscode.window.activeTextEditor?.document;
        if (!doc) {
          vscode.window.showErrorMessage("FTG Refs: no active document.");
          return;
        }

        const origin = Number.isInteger(lineNo)
          ? new vscode.Position(Math.max(lineNo, 0), 0)
          : vscode.window.activeTextEditor?.selection?.active;
        await peekReferences(kind, symbol, doc, origin);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ftgRefs.showReferencesFromCursor",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage("FTG Refs: no active editor.");
          return;
        }

        const parsed = parseSymbolAtPosition(
          editor.document,
          editor.selection.active,
        );
        if (!parsed) {
          vscode.window.showInformationMessage(
            "FTG Refs: no ID or flag found on the cursor line.",
          );
          return;
        }

        await peekReferences(
          parsed.kind,
          parsed.symbol,
          editor.document,
          editor.selection.active,
        );
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ftgRefs.goToDefinitionFromCursor",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage("FTG Refs: no active editor.");
          return;
        }

        const parsed = parseSymbolAtPosition(
          editor.document,
          editor.selection.active,
        );
        if (!parsed) {
          vscode.window.showInformationMessage(
            "FTG Refs: no ID or flag found under cursor.",
          );
          return;
        }

        await goToDefinition(parsed.kind, parsed.symbol, editor.document);
      },
    ),
  );

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, {
      provideHover: provideFtgHover,
    }),
  );
}

function provideFtgHover(document, position) {
  const line = document.lineAt(position.line).text;
  const code = line.split("#")[0];
  if (!code.trim()) {
    return null;
  }

  const specialHover = provideSpecialValueHover(document, position, code);
  if (specialHover) {
    return specialHover;
  }

  // Word under cursor
  const wordRange = document.getWordRangeAtPosition(
    position,
    /[A-Za-z_][A-Za-z0-9_]*/,
  );
  if (!wordRange) {
    return null;
  }
  const word = document.getText(wordRange);
  const key = word.toLowerCase();

  // Also check action_X pattern
  const actionRange = document.getWordRangeAtPosition(
    position,
    /action_[A-Za-z]/,
  );
  const actionWord = actionRange
    ? document.getText(actionRange).toLowerCase()
    : null;
  const lookupKey = FTG_HOVER_DOCS[actionWord]
    ? actionWord
    : FTG_HOVER_DOCS[key]
      ? key
      : FTG_HOVER_DOCS[word]
        ? word
        : null;

  if (!lookupKey) {
    return null;
  }

  const md = new vscode.MarkdownString(FTG_HOVER_DOCS[lookupKey]);
  md.isTrusted = true;
  return new vscode.Hover(md, actionWord ? actionRange : wordRange);
}

function parseAssignedValueAtPosition(code, startChar, endChar) {
  const valueRe =
    /\b(which|value|country|province|data|tag|exists|neighbour|overlord)\s*=\s*([A-Za-z_][A-Za-z0-9_]*|-?\d+)\b/gi;
  let match = valueRe.exec(code);
  while (match) {
    const value = match[2];
    const valueStart = match.index + match[0].lastIndexOf(value);
    const valueEnd = valueStart + value.length;
    if (startChar >= valueStart && endChar <= valueEnd) {
      return {
        field: (match[1] || "").toLowerCase(),
        value,
      };
    }
    match = valueRe.exec(code);
  }
  return undefined;
}

function inferSpecialValueContext(code, field, value) {
  const typeMatch = code.match(/\btype\s*=\s*([A-Za-z_]+)\b/i);
  const commandType = typeMatch ? typeMatch[1].toLowerCase() : undefined;

  if (
    field === "data" &&
    value === "-1" &&
    /\b(?:core_national|core_claim|core_casusbelli|owned|control)\s*=\s*\{[^\n\r}]*\bdata\s*=\s*-1\b/i.test(
      code,
    )
  ) {
    return "event_country";
  }

  if (
    field === "data" &&
    /\b(?:core_national|core_claim|core_casusbelli|owned|control)\s*=\s*\{[^\n\r}]*\bdata\s*=\s*(?:[A-Z][A-Z0-9]{2}|-1)\b/i.test(
      code,
    )
  ) {
    return "country";
  }

  if (field === "which") {
    if (commandType && FTG_COUNTRY_TARGET_TYPES.has(commandType)) {
      return "country";
    }
    if (commandType && FTG_PROVINCE_TARGET_TYPES.has(commandType)) {
      return "province";
    }
  }

  if (field === "value") {
    if (commandType && PROVINCE_VALUE_TYPES.has(commandType)) {
      return "province";
    }
  }

  if (["country", "tag", "exists", "neighbour", "overlord"].includes(field)) {
    return "country";
  }

  if (field === "province") {
    return "province";
  }

  return undefined;
}

function provideSpecialValueHover(document, position, code) {
  const tokenRange = findTokenRangeAtPosition(document, position, code);
  if (!tokenRange) {
    return null;
  }

  const token = document.getText(tokenRange);
  const tokenKey = token.toLowerCase();
  if (
    !FTG_SPECIAL_VALUE_TOKENS.has(tokenKey) &&
    !FTG_SPECIAL_VALUE_TOKENS.has(token)
  ) {
    return null;
  }

  const assigned = parseAssignedValueAtPosition(
    code,
    tokenRange.start.character,
    tokenRange.end.character,
  );
  if (!assigned) {
    return null;
  }

  const context = inferSpecialValueContext(
    code,
    assigned.field,
    assigned.value,
  );
  const doc =
    FTG_SPECIAL_VALUE_HOVER[tokenKey] || FTG_SPECIAL_VALUE_HOVER[token];
  if (!doc) {
    return null;
  }

  const meaning =
    (context && doc[context]) || doc.generic || doc.country || doc.province;
  if (!meaning) {
    return null;
  }

  const contextPart = context ? ` (context: ${context})` : "";
  const md = new vscode.MarkdownString(
    `**special value** \`${token}\` — ${meaning}${contextPart}`,
  );
  md.isTrusted = true;
  return new vscode.Hover(md, tokenRange);
}

function findTokenRangeAtPosition(document, position, code) {
  const tokenRe = /-?\d+|[A-Za-z_][A-Za-z0-9_]*/g;
  let match = tokenRe.exec(code);
  while (match) {
    const token = match[0];
    const startChar = match.index;
    const endChar = startChar + token.length;
    if (position.character >= startChar && position.character <= endChar) {
      return new vscode.Range(position.line, startChar, position.line, endChar);
    }
    match = tokenRe.exec(code);
  }
  return undefined;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
