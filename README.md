# FTG Toolkit

VS Code extension for For The Glory modding: syntax highlighting, completions, validation, and reference navigation.

## Features

### 1) FTG Syntax Highlighting

- Built-in `ftg` language grammar (`.eue`, `.inc`, `.eug`, plus FTG mod folders).
- Structure highlighting for `event`, `decision`, `trigger`, `action`, and `command`.
- Command and trigger highlighting (including `addcore`, `provincemanpower`, `domestic`, `relation`, etc.).
- Context-aware value highlighting (religions, domestic sliders, country tags, and more).

### 2) Intelligent Completions

- Snippets for full `event` and `decision` blocks.
- Snippets for `command = { ... }`, `date`, `deathdate`, and trigger logic (`AND/OR/NOT/someof`).
- `type = ...` command suggestions based on FTG command lists.
- Context-aware `which = ...` and `value = ...` suggestions depending on `type`.
- In-place province ID menu while typing in `province =`, province-target `which =`, and province-target `value =` fields (`name (id)` list + cascade picker action).
- Trigger sub-block snippets: `alliance`, `vassal`, `war`, `dynastic`, `truce`, `union` → `{ country = TAG }`, `relation` → `{ country = TAG value = N }`, `provincereligion`/`provinceculture` → `{ data = ... province = N }`.
- Field + value completions inside trigger sub-blocks (`country = TAG`, `data = religion/culture`).
- Dynamic suggestions sourced from the mod files:
  - Religions: `Db/Religions/religions.txt`
  - Cultures: `Db/cultures.txt`
  - Tech groups: `Db/Technologies/techgroups.txt`
  - Country tags: `Db/countries.txt`
  - AI files: `AI/` folder

### 3) Inlay Hints (Inline)

- Province name for `province = <id>`.
- Province name for commands using `which = <id>` (e.g. `provincetax`, `provincemanpower`, `capital`, `addcore`).
- Event name for `event = <id>` and `type = trigger|sleepevent which = <id>`.
- Monarch and leader names for relevant `which = <id>` commands.

### 4) References and Definitions

- `F12` (Go to Definition) for IDs and flags.
- `Shift+F12` (Find All References) with inline `Peek References`.
- CodeLens above ID/flag lines and selected `which = <id>` command lines.
- CodeLens above `decision = {` for one-click `Localize decision (inline)`.
- Commands:
  - `FTG: Show References`
  - `FTG: Show References from Cursor`
  - `FTG: Go to Definition from Cursor`
  - `FTG: Jump Source <-> Localization`
  - `FTG: Localize Current Event`
  - `FTG: Localize Current Decision`
  - `FTG: Insert Province ID (Cascade Picker)`

### 5) Validation (Problems)

**Event/decision validation:**

- Duplicate `id` within the same file and across `Db/Events`/`Db/Decisions` (reported for both events and decisions).
- Invalid action letter (`action_f` or higher — only `action_a` through `action_e` are valid).
- Negative `offset` value.

**Command validation:**

- Unknown religion (`religion = ...`).
- Unknown domestic slider (`type = domestic which = ...`).
- Unknown country tag (`type = relation which = ...`).
- Unknown province ID for `type = addcore which = ...`.
- Unknown event ID for `event = ID` and `type = trigger|sleepevent which = ID`.
- Brace validation for `{}` (missing/extra closing braces).

**Trigger validation:**

- Unknown country tag for `exists`, `tag`, `neighbour`, `overlord`.
- Unknown country tag for `country = ...` (inside `alliance`, `vassal`, `war`, `dynastic` sub-blocks).
- Unknown province ID for `owned = N` and `control = N`.
- Boolean check for `atwar`, `isvassal`, `elector`, `emperor`, `hre`, `city`, `bankrupt`, `revolt`, `occupied` (must be `yes` or `no`).
- Unknown religion for `provincereligion = { data = ... }` (single-line and multi-line).
- Unknown culture for `provinceculture = { data = ... }` and `cityculture = { data = ... }`.

### 6) Hover Tooltips

Hovering over any FTG keyword shows a description:

- **Commands**: `stability`, `addcore`, `INF`, `CAV`, `relation`, `domestic`, `provincereligion`, etc.
- **Triggers**: `AND`, `OR`, `NOT`, `exists`, `atwar`, `owned`, `control`, `year`, `flag`, etc.
- **Structural fields**: `offset`, `deathdate`, `persistent`, `action_a`–`action_e`.
- **Localization keys in `name`/`desc`**: hover on keys like `EVENTNAME1234`, `EVENTHIST1234`, `ACTIONNAME1234A` shows resolved value from `Localisation/English/*.csv`.

## Configuration

- `ftgRefs.enableCodeLens` - enable/disable CodeLens.
- `ftgRefs.pythonPath` - Python command (default: `python`).
- `ftgRefs.scriptPath` - path to `ftg_refs.py` relative to workspace root.
- `ftgRefs.provincesPath` - optional path to `provinces.txt`.
- `ftgRefs.enableProvinceInlayHints` - enable/disable province inlay hints.
- `ftgRefs.autoDetectDataFiles` - auto-detect FTG data files.

## Installation

1. Install the extension from `.vsix`:

- VS Code → `Extensions: Install from VSIX...`
- Select `ftg-refs-codelens-<version>.vsix`

2. Reload VS Code window (`Developer: Reload Window`).

## Enable Syntax on FTG Text Files

By default, the extension registers `.eue`, `.inc`, and `.eug`. Most FTG mod files are `.txt`, so add file associations in your workspace/user `settings.json`:

```json
{
  "files.associations": {
    "Db/**/*.txt": "ftg",
    "AI/**/*.txt": "ftg",
    "Scenarios/**/*.txt": "ftg",
    "Localisation/**/*.txt": "ftg",
    "**/*.eue": "ftg",
    "**/*.inc": "ftg",
    "**/*.eug": "ftg"
  }
}
```

Then reload VS Code window (F1) -> (`Developer: Reload Window`).

## Quick Start

1. Open an FTG mod file (event/decision/AI/scenario).
2. You should see:

- FTG syntax highlighting,
- inline hints (province/event/monarch/leader names),
- CodeLens references above relevant lines,
- validation warnings in `Problems`.

3. No manual enable is required. After installation + window reload, the extension works automatically.

4. (Optional) Use commands from Command Palette:

- `FTG: Show References`
- `FTG: Show References from Cursor`
- `FTG: Go to Definition from Cursor`
- `FTG: Jump Source <-> Localization`
- `FTG: Localize Current Event`
- `FTG: Localize Current Decision`
- `FTG: Insert Province ID (Cascade Picker)`

## Changelog

### 0.3.2

- Validation: cross-file duplicate ID detection added for `event` and `decision` definitions.
- Validation: fixed false positives for valid command assignment chains such as `type = relation which = TAG value = N`.
- Validation: parser and cache flow hardened for large structured FTG files.

### 0.3.1

- Validation: strict `id` format check added (`id` must contain digits only). Invalid values like `id = 3001011abc` are now reported as errors.
- Validation: fixed false positives for logical trigger blocks (`NOT = { ... }`, `AND/OR/someof` patterns) in trailing-content detection.
- Validation: fixed multi-line quoted strings in fields like `desc = "..."` (including empty lines inside the string) so they are no longer reported as stray content.
- Validation: fixed structured file path detection on Windows (`Db\\Events\\...`) so event/decision rules trigger correctly.

### 0.3.0

- Fixed: `NOT` and `AND` were highlighted as country tags (3-letter uppercase match) instead of logic keywords. Tags pattern now excludes `NOT` and `AND` via negative lookahead.

### 0.2.9

- Inlay hints: `secedeprovince` and `cedeprovince` now show province name for `value = N` (province ID is in `value`, not `which`). Same for `giveaccess`, `cancelaccess`, `revokeaccess`, `givetrade`, `revoketrade`.
- Added missing commands to province ID hint detection: `addcore_national`, `addcore_claim`, `addcore_casusbelli`, `removecore_*`, `gainbuilding`, `losebuilding`, `mine`, `terrain`, `heretic`, `discovered`, `tradingpost`, `vp`.

### 0.2.8

- Validation: `command = { type = religion which = orthodox }` now validates the religion name in `which` against `Db/Religions/religions.txt`, both in single-line and multi-line command blocks. Same applies to `alt_provincereligion`.

### 0.2.7

- Syntax highlighting for `religions.txt`: religion definition names (`catholic = {`) highlighted as definitions; religion-specific field keywords (`group`, `subgroup`, `color`, `allowed_conversion`, `heretic`, `tech_speed`, `stability_bonus`, etc.) highlighted.
- Validation: bare religion names in `heretic`/`allowed_conversion`/`war`/`aggressiveness`/`conflict`/`income_bonus` lists inside `religions.txt` validated against known religions. Also validates `type = religion value = X` single-line commands.
- Completions: `religion = `, `province_religion = `, `heretic = ` → suggest religion names; `group = ` → suggest group names (`christian`, `muslim`, `eastern`, `pagan`); `techgroup = ` → suggest techgroup values; cursor on bare word inside `heretic`/`allowed_conversion` block → suggest religions; cursor on key inside religion definition block → suggest religion field keywords.
- Hover tooltips added for all religion field keywords.

### 0.2.6

- Added missing grammar keywords: `historicalmonarch`, `historicalleader`, `dormant`, `category`, `rank`, `fire`, `shock`, `siege`, `movement`, `location`, `remark`, `special`, `techgroup` (structure fields), and trigger keywords `bankrupt`, `revolt`, `occupied`, `manpower`.
- Completions: monarch block fields (`ADM/DIP/MIL`, `dormant`, etc.) and leader block fields (`category`, `rank`, stats) suggested when inside `historicalmonarch`/`historicalleader` blocks.
- Top-level snippets: `historicalmonarch` and `historicalleader` full block templates.
- Hover tooltips added for all new keywords.

### 0.2.5

- Removed "References (inline)" CodeLens for `sleepmonarch`, `wakemonarch`, `sleepleader`, `wakeleader` — inlay hint showing the name value remains.

### 0.2.4

- Fixed: References and Go-to-Definition now work for monarch and leader IDs (`sleepmonarch`, `wakemonarch`, `sleepleader`, `wakeleader`). Previously the Python script was called with unsupported kind — now handled natively in JS. Definition jumps to the monarch/leader block in `Db/Monarchs/` or `Db/Leaders/`; references find all usages in event files.

### 0.2.3

- Added hover tooltips: hovering over any FTG command keyword (`stability`, `addcore`, `INF`, etc.) or trigger keyword (`exists`, `atwar`, `AND`, `owned`, etc.) shows a description with syntax and usage.

### 0.2.2

- Added completions for trigger sub-blocks: `alliance`, `vassal`, `war`, `dynastic`, `truce`, `union` → snippet `{ country = TAG }` and field suggestions inside the block.
- Added completion for `relation = { country = TAG value = N }` in trigger context.
- Added completions for `provincereligion = { data = ... }` and `provinceculture/cityculture = { data = ... }` in trigger context.
- `country = ` inside sub-blocks suggests country tags; `data = ` suggests religions or cultures based on context.

### 0.2.1

- Event validation: duplicate `id` in same file (events and decisions reported separately), invalid action letter (`action_f` etc.), negative `offset` value.

### 0.2.0

- Added trigger validation: country tags (`exists`, `tag`, `neighbour`, `overlord`, `country =`), province IDs (`owned`, `control`), boolean fields (`atwar`, `isvassal`, `elector`, `emperor`, `hre`, `city`, `bankrupt`, `revolt`, `occupied`), `provincereligion.data` (religion), `provinceculture.data` / `cityculture.data` (culture).

### 0.1.9

- Added syntax highlighting for `addcore`, `provincemanpower`, `relation which = TAG`, `provincereligion data = ...`, `type = domestic which = ...` (case-insensitive).
- Validation for religion, domestic slider, relation/country, addcore/province, brace matching.
- Inlay hints for province, event, monarch, and leader names.
- Full README and `.vsix` packaging.
