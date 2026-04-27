# Changelog

## 0.3.1
- Validation: strict `id` format check (`id` must contain only digits).
- Validation: fixed false positives for logical trigger blocks (`NOT`, `AND`, `OR`, `someof`) in trailing-content detection.
- Validation: fixed multi-line quoted strings for fields like `desc` (including blank lines inside string values).
- Validation: fixed structured file-path recognition on Windows for `Db/Events`, `Db/Decisions`, `Db/Monarchs`, `Db/Leaders`.

## 0.3.0
- Fixed syntax highlighting where `NOT` and `AND` could be interpreted as country tags.
