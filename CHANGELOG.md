# Changelog

## [0.3.9]

### New Features
- **FTG: Create Workspace for Mod** -- automatically creates a `.code-workspace` file with full configuration (windows-1252 encoding, file associations, syntax coloring) based on the active file's mod root
- **FTG: Scan Problems** -- scans all Events/Decisions files, logs progress per-file in the Output Channel, copies results (TSV) to clipboard
- Context menu submenu label now shows the current version: **FTG Toolkit vX.X.X**

### Fixes
- Formatting: multiline `desc = "..."` strings now format correctly
- Scanning: support for mods with `Events/` outside `Db/`, flat `Db/events.txt` structure, and subfolders (`.eue`, `.eug`, `.inc`)
- Validation and duplicate ID index now include `Events/` at mod root level
- Validation exclusions: `Readme.txt`, `EVENT_IDs.txt`
- False positive fix: `id = { type = 6 id = X }` (monarch/leader blocks), `event = 187031 }` inside OR blocks
- All UI messages switched to English

## 0.3.8.135 (package: 0.3.8135)

- Context menu: submenu label now includes version number (`FTG Toolkit v0.3.8135`)

## 0.3.8.134 (package: 0.3.8134)

- Scanning: fixed missing subfolders -- `collectFtgFilesRecursive` now collects not only `.txt` but also `.eue`, `.eug`, `.inc` (e.g. `Events/RNGC/Reformation/*.eue`)

## 0.3.8.133 (package: 0.3.8133)

- README: added **Setting Up a Workspace for a Mod** section with step-by-step instructions for the `FTG: Create Workspace for Mod` command

## 0.3.8.132 (package: 0.3.8132)

- Validation and duplicate ID index: added support for `Events`/`Decisions` folders at mod root level (alongside `Db/`) -- fixed `isStructuredFtgFilePath` (regex with optional `Db/`) and `collectStructuredFtgFilesForIdIndex` (now scans root-level folders too)

## 0.3.8.131 (package: 0.3.8131)

- Scanning: added support for `Events`/`Decisions` folders at mod root level (not only inside `Db/`)

## 0.3.8.130 (package: 0.3.8130)

- Scanning: added fallback for mods with a flat structure (e.g. `Db/events.txt` instead of `Db/Events/`) -- when no `Events`/`Decisions` subfolders are found, scans all `.txt` files directly in `Db/`

## 0.3.8.129 (package: 0.3.8129)

- Scanning: `Events`/`Decisions` folder detection is now case-insensitive with recursive subfolder traversal; error message shows detected root and `Db/` path

## 0.3.8.128 (package: 0.3.8128)

- Command titles in menus switched to English: "FTG: Scan Problems (Events + Decisions -> clipboard)", "FTG: Create Workspace for Mod"

## 0.3.8.127 (package: 0.3.8127)

- Scanning: added Output Channel "FTG Toolkit" -- logs each scanned file ([X/N] Scanning: ...), problem count per file, open errors, and final summary with elapsed time

## 0.3.8.126 (package: 0.3.8126)

- Messages in `createWorkspace` and `scanAllProblems` commands switched to English; removed duplicate `createWorkspace` registration

## 0.3.8.125 (package: 0.3.8125)

- New command **FTG: Create Workspace for Mod** (FTG Toolkit menu / command palette): auto-detects mod root (folder containing `Db/`) from the active file, creates `<ModName>.code-workspace` with full settings (windows-1252 encoding, file associations for `.txt`/`.eug`/`.inc` with FTG language, syntax coloring), prompts to open the workspace immediately

## 0.3.8.124 (package: 0.3.8124)

- Scanning: fixed root detection -- when the command palette steals focus, `activeTextEditor` is `null`; now falls back to searching all workspace folders for one containing `Db/`

## 0.3.8.123 (package: 0.3.8123)

- Scan Problems: root is now detected automatically from the active file (walks up the directory tree looking for a `Db/` folder); falls back to the first workspace folder

## 0.3.8.122 (package: 0.3.8122)

- Formatting: fixed tokenizer -- multiline strings in `desc` are now correctly recognized as a single token (closing `"` is searched beyond the current line)

## 0.3.8.121 (package: 0.3.8121)

- Validation: `EVENT_IDs.txt` added to the exclusion list (alongside `Readme.txt`)

## 0.3.8.120 (package: 0.3.8120)

- Validation: `Readme.txt` (in all folders) is now skipped during validation -- no more false errors

## 0.3.8.119 (package: 0.3.8119)

- New command: **FTG: Scan Problems (Events + Decisions)** -- scans all files in `Db/Events` and `Db/Decisions`, collects errors/warnings (problem, file, line) and copies them to clipboard in TSV format

## 0.3.8.118 (package: 0.3.8118)

- UI: all FTG context menu commands moved into a dedicated **FTG Toolkit** submenu

## 0.3.8.117 (package: 0.3.8117)

- Validation: a closing `}` on the same line as a scalar value (e.g. `event = 187031 }`) is no longer incorrectly flagged as trailing garbage

## 0.3.8.116 (package: 0.3.8116)

- Validation: `id = { type = 6 id = X }` in Monarchs/Leaders files is no longer incorrectly flagged as invalid -- the validator checks for the `{ type = 6 ... }` pattern and the surrounding block context (historicalmonarch/historicalleader/monarch/leader)

## 0.3.8.115 (package: 0.3.8115)

- Validation: boolean field checks (`yes`/`no`) for fields like `city`, `atwar`, `hre` etc. are now restricted to structured files (Events/Decisions/Monarchs/Leaders) -- no false alarms for `city = OHI` in `cultures.txt`

## 0.3.8.114 (package: 0.3.8114)

- Syntax coloring: `religion = X` and `type = religion which = X` / `type = religion value = X` moved to `#techgroupAssignments` (before `#eventFields`) -- religion values are highlighted as constants in all nested blocks
- Keyword `continent` added to triggerTypes (grammar) and FTG_TRIGGER_KEYS (validation/autocomplete)

## 0.3.8.113 (package: 0.3.8113)

- Fixed coloring of `type = technology which = X`: pattern moved to `#techgroupAssignments` and placed before `#eventFields` in all nested blocks (previously `type` was consumed as a keyword before the full expression could match)

## 0.3.8.112 (package: 0.3.8112)

- Fixed coloring of `technology = X` inside nested blocks (OR/AND/NOT/trigger etc.): `#techgroupAssignments` added before `#triggerTypes` in all 4 inner pattern lists of `logicalBlocks`

## 0.3.8.111 (package: 0.3.8111)

- Fixed coloring of `technology = X`: `#techgroupAssignments` moved before `#commandTypes` (which was consuming the bare word `technology` before the full assignment could match)

## 0.3.8.110 (package: 0.3.8110)

- Fixed JSON syntax error in grammar (orphaned `captures` block introduced in 0.3.8.19 caused complete coloring breakdown)

## 0.3.8.19 (package: 0.3.819)

- Fixed techgroup coloring: `techgroup|technology = X` pattern moved to a separate `#techgroupAssignments` rule executed before `#triggerTypes` (previously `technology` was consumed as a keyword before the value could match)

## 0.3.8.18 (package: 0.3.818)

- Syntax coloring: technology group values (`latin`, `orthodox`, `muslim`, `asian`, `african`, `pagan`, `china`, `exotic`) highlighted as constants after `techgroup =`, `technology =` (trigger) and `which =` in `type = technology`

## 0.3.8.17 (package: 0.3.817)

- Validation and autocomplete: `technology = X` (trigger) and `techgroup = X` linked to `Db/Technologies/techgroups.txt` -- invalid tech group name underlined as a warning
- Validation: `type = technology which = X` (command) -- `which` value checked against techgroups.txt
- Autocomplete for `techgroup =` now dynamically reads names from the file instead of using a hardcoded list

## 0.3.8.16 (package: 0.3.816)

- Formatter: `trigger`/`potential`/`ai_trigger` with a single element that is a block (e.g. `OR = { ... }`) now expands to multiple lines instead of staying inline

## 0.3.8.15 (package: 0.3.815)

- Format Document: `type = X`, `which = Y`, `value = Z` are collapsed to one line when appearing consecutively inside a block (e.g. inside `command = {` after a `trigger` block)

## 0.3.8.14 (package: 0.3.814)

- Format Document: fixed expansion of `trigger`/`potential`/`ai_trigger` blocks -- if a block has 1 top-level element (even a nested `OR = {...}`), it stays on one line; with 2+ elements it expands
- Format Document: fixed flat block collector (`collectFlatDeep`) -- old code stopped at the first `}` without tracking depth, causing nested block content to be lost

## 0.3.8.13 (package: 0.3.813)

- Format Document: `AND`/`OR`/`NOT`/`someof` blocks with 1 element -> one line (`NOT = { event = 2296001 }`); with >1 elements -> expanded to multiple lines
- Format Document: blank line after `desc = "..."` and before `action_a = {`

## 0.3.8.12 (package: 0.3.812)

- Syntax: added `knows` as a trigger keyword (`triggerTypes`), `discover` as a command keyword (`commandTypes`)
- Inlay hints: `knows = TAG` -> country name label; `TAG = {` (e.g. `ENG = {` in OR/trigger blocks) -> country name label; `type = discover which = N` -> province name label

## 0.3.8.11 (package: 0.3.811)

- Format Document: fixed comments between events -- a `#...` comment on its own line was incorrectly appended to the closing `}` of the previous event. The tokenizer now tracks line numbers and `trailingComment()` only picks up a comment when it is on the same line as the previous token.

## 0.3.8.10 (package: 0.3.810)

- Format Document: fixed missing `}` -- a flat block containing an inline `#` comment was incorrectly collapsed to a single line with `}` after the comment text (making it invisible to the parser). Such blocks are now always expanded to multiple lines.

## 0.3.8.9 (package: 0.3.89)

- Format Document: flat blocks (no nested `{`) stay on one line -- e.g. `command = { type = stability value = -1 }` is not expanded to multiple lines.

## 0.3.8.8 (package: 0.3.88)

- New feature: **FTG: Format Document (expand blocks)** -- available via right-click and Command Palette. Formats the entire file or selection: expands compact blocks to multiple lines, indents with tabs, preserves `#` comments in place.

## 0.3.8.7 (package: 0.3.87)

- Inlay hints: fixed `? [unknown event X]` for compact-style events (`event = { id = X name = "..." }` on one line) -- `parseEventNamesFromFile` was skipping `id`/`name` from the block-opening line due to a premature `continue`.

## 0.3.8.6 (package: 0.3.86)

- Validation: fixed false "Unknown event id" for events defined in compact style `event = { id = XXXX ... }` -- the cross-file index was looking for `id = X` only as a complete line, missing IDs written on the same line as `event = {`.

## 0.3.8.5 (package: 0.3.85)

- Validation: fixed false positive for fields inside blocks without a captured name (e.g. a second `AND = {` opener on the same line as `trigger = {`) -- the validator now checks block stack depth, not just block name, to correctly determine whether we are inside a block.

## 0.3.8.4 (package: 0.3.84)

- Validation: fixed false positive "trailing garbage" for `desc`/`name` fields with embedded `"` in prose -- `findTrailingGarbageAfterField` now searches for the last `"` in the line as the string closing delimiter instead of the first.

## 0.3.8.3 (package: 0.3.83)

- Validation/parsing: fixed false positives for `desc`/`name` strings containing embedded `"` in prose -- parser now closes the string on the last `"` in the line before any `#` comment.

## 0.3.8.2 (package: 0.3.82)

- Validation: fixed false positive "Field appears outside any FTG block" for compact-style lines like `command = { ... }}}` -- the validator now uses block context from the start of the line, not from after processing trailing `}`.

## 0.3.8.1 (package: 0.3.81)

- Validation: fixed false positive "trailing garbage" when a field's closing `}` is followed only by parent-block closing braces (`}}`), e.g. `command = { ... }}}` in compact style.

## 0.3.7

- Navigation: added bidirectional jump between source and localization with `FTG: Jump Source <-> Localization` (Ctrl+Alt+Shift+J), available via context menu and Command Palette.
- Navigation: F12 on localization keys (EVENTNAME, EVENTHIST, ACTIONNAME, DECISIONNAME, DECISIONHIST) now jumps directly to source definitions or localization entries depending on current file.
- Event localization: added/expanded `FTG: Localize Current Event` flow for converting raw event `name`/`desc`/`action name` fields into localization keys and writing entries to `Localisation/English/events.csv`.
- Decisions localization: added `FTG: Localize Current Decision` (Ctrl+Alt+Shift+D) with automatic key generation (DECISIONNAME<ID>, DECISIONHIST<ID>) and append to `Localisation/English/decisions.csv`.
- CodeLens: added one-click `Localize decision (inline)` above `decision = {` blocks.
- Province workflow: added in-place province ID completion menu (name + id) for `province`, province-target `which`, and province-target `value`, plus cascade picker integration.
- Validation: added missing-event checks for `event = ID` and `type = trigger|sleepevent which = ID` references.
- UX/robustness: improved localization jump behavior when cursor is inside event/decision blocks and added fallback opening of target localization file when key entry is missing.

## 0.3.2

- Validation: cross-file duplicate ID detection for `event` and `decision` definitions across `Db/Events` and `Db/Decisions`.
- Validation: fixed false positive on valid command assignment chains (e.g. `type = relation which = TAG value = N`) that were incorrectly reported as trailing garbage.
- Validation internals: improved structured parsing utilities and cache invalidation for project-wide diagnostics after file create/delete/rename/save.

### Application capabilities as of 0.3.2

- FTG syntax highlighting for structure blocks, command/trigger keywords, contextual value tokens, and FTG data files.
- Context-aware completions for event/decision skeletons, command fields, trigger logic blocks, trigger sub-blocks, and typed values (`which`, `value`, `country`, `data`).
- Inlay hints for provinces, events, monarchs, leaders, and country tags sourced from mod data.
- Go to Definition / Find References for IDs and flags, plus CodeLens for inline references.
- Hover documentation for FTG commands, triggers, fields, and special runtime values (`-1`, `-2`, etc.) with context-aware meanings.
- Validation suite covering:
  - malformed `id` values,
  - duplicate IDs (same file and cross-file),
  - invalid action labels,
  - offset errors,
  - mismatched braces,
  - unknown country/religion/culture/province references,
  - misplaced fields in trigger sub-blocks,
  - stray content outside and inside structured blocks,
  - garbage after valid assignments and block openers,
  - multiline string-safe parsing in event/decision files.

## 0.3.1

- Validation: strict `id` format check (`id` must contain only digits).
- Validation: fixed false positives for logical trigger blocks (`NOT`, `AND`, `OR`, `someof`) in trailing-content detection.
- Validation: fixed multi-line quoted strings for fields like `desc` (including blank lines inside string values).
- Validation: fixed structured file-path recognition on Windows for `Db/Events`, `Db/Decisions`, `Db/Monarchs`, `Db/Leaders`.

## 0.3.0

- Fixed syntax highlighting where `NOT` and `AND` could be interpreted as country tags.
