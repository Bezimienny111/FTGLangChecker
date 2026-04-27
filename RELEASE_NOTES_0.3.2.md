# FTG Toolkit v0.3.2

## New in 0.3.2

- Added cross-file duplicate ID validation:
  - detects duplicate `event` IDs across `Db/Events`
  - detects duplicate `decision` IDs across `Db/Decisions`
  - reports source file and line for the first conflicting definition
- Fixed false syntax errors on valid FTG command lines with chained assignments, for example:
  - `type = relation which = SPR value = -50`
  - `type = domestic which = CENTRALIZATION value = -2`
- Improved validation parser behavior for structured FTG content and multiline strings.
- Improved cache refresh behavior after save/create/delete/rename operations.

## Full application scope as of v0.3.2

### 1) FTG language support
- FTG grammar and highlighting for `.eue`, `.inc`, `.eug`, and FTG folder-scoped `.txt` files.
- Highlighting for structure fields (`event`, `decision`, `trigger`, `action`, `command`) and FTG command/trigger tokens.
- Context-aware token handling for command values, trigger values, and special engine values.

### 2) Completions
- Snippets for full `event`/`decision` blocks.
- Snippets for command blocks and logical trigger blocks (`AND`, `OR`, `NOT`, `someof`).
- Contextual completion for `type`, `which`, and `value` in commands.
- Contextual completion in trigger sub-blocks (`country`, `data`, province/religion/culture forms).
- Dynamic value suggestions based on mod data files (`countries`, `cultures`, `religions`, `techgroups`, `AI`).

### 3) Inlay hints
- Province names for province IDs in direct and command fields.
- Event names for event ID references.
- Monarch and leader names for relevant command references.
- Country name hints for recognized country-tag references.

### 4) Navigation and references
- Go to Definition (`F12`) for IDs and flags.
- Find All References (`Shift+F12`) for IDs and flags.
- Inline CodeLens references for supported symbols.
- Command palette helpers for references and definition lookup from cursor.

### 5) Hover docs
- Hover descriptions for FTG commands, triggers, structure fields, and special runtime values.
- Context-aware explanation for special placeholders like `-1`, `-2`, etc.

### 6) Validation suite (Problems)
- Invalid `id` value format checks.
- Duplicate ID checks within a file and across files.
- Invalid action label checks (`action_a`..`action_e`).
- Offset value sanity checks.
- Unknown religion/culture/country/province checks in supported contexts.
- Misplaced field checks in trigger sub-block contexts.
- Unexpected top-level or in-block stray content checks.
- Trailing-garbage checks after FTG assignments.
- Garbage-after-block-opener checks.
- Brace mismatch checks.
- Multiline-string-safe parsing in structured event/decision content.
