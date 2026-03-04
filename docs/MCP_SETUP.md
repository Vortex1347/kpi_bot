# MCP Setup (Portable)

Цель: хранить MCP-конфиг в репозитории, чтобы быстро переносить окружение в новый проект.

## Чеклист для нового разработчика

Сделай ровно эти 3 шага после `git clone`:

1. Подставь свой `CONTEXT7_API_KEY` вместо `REPLACE_WITH_CONTEXT7_API_KEY`:
   - Cursor: `/.cursor/mcp.json`
   - Codex: `~/.codex/config.toml` (или сначала скопируй `/.codex/config.toml.example`)
2. Выполни синк project skills:
   - `bash scripts/sync-codex-skills.sh`
3. Перезапусти текущую сессию:
   - Cursor (или MCP session в IDE)
   - Codex CLI

## Что в репозитории

- `/.cursor/mcp.json` — проектный MCP-конфиг для Cursor.
- `/.codex/config.toml.example` — шаблон MCP-конфига для Codex CLI.
- `/.codex/skills/*` — project skills pack (`carcas-*`) для Codex.
- `/scripts/sync-codex-skills.sh` — скрипт синхронизации skills в `~/.codex/skills`.

## Cursor

Файл `/.cursor/mcp.json` уже содержит:
- `serena`
- `playwright`
- `context7`

Перед использованием:
1. Открой `/.cursor/mcp.json`.
2. Замени `REPLACE_WITH_CONTEXT7_API_KEY` на свой ключ.
3. Перезапусти Cursor/сессию MCP.

## Codex CLI

1. Скопируй шаблон:
   - `cp .codex/config.toml.example ~/.codex/config.toml`
   - или вручную merge секции `mcp_servers.*` в уже существующий `~/.codex/config.toml`.
2. Вставь свой ключ в `CONTEXT7_API_KEY`.
3. Перезапусти Codex CLI.

## Project Skills (Codex)

В репозитории уже лежит pack skills:
- `/.codex/skills/carcas-local-operations`
- `/.codex/skills/carcas-domain-deploy`
- `/.codex/skills/carcas-architecture-guardrails`

Установка в локальный Codex:

```bash
bash scripts/sync-codex-skills.sh
```

или вручную:

```bash
mkdir -p ~/.codex/skills
cp -R .codex/skills/* ~/.codex/skills/
```

## Безопасность

- Не коммить реальные ключи (`CONTEXT7_API_KEY` и любые secret values).
- В репозитории держим только шаблоны/плейсхолдеры.
