# Changelog

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
