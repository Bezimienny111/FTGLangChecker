# Changelog

## 0.3.7
- Navigation: added bidirectional jump between source and localization with `FTG: Jump Source <-> Localization` (`Ctrl+Alt+Shift+J`), available via context menu and Command Palette.
- Navigation: `F12` on localization keys (`EVENTNAME`, `EVENTHIST`, `ACTIONNAME`, `DECISIONNAME`, `DECISIONHIST`) now jumps directly to source definitions or localization entries depending on current file.
- Decisions localization: added `FTG: Localize Current Decision` (`Ctrl+Alt+Shift+D`) with automatic key generation (`DECISIONNAME<ID>`, `DECISIONHIST<ID>`) and append to `Localisation/English/decisions.csv`.
- CodeLens: added one-click `Localize decision (inline)` above `decision = {` blocks.
- Province workflow: added in-place province ID completion menu (`name + id`) for `province`, province-target `which`, and province-target `value`, plus cascade picker integration.
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
