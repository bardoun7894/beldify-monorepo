---
title: Pi Memory — Global
type: source
sync_origin: pi-memory://global
source: ~/.pi/memory/GLOBAL.md
---

# Pi Memory — Global

Agent behavior + environment notes, all projects.

- OpenCode Go can be installed as a Pi provider via `pi install npm:pi-opencode-bridge` — registers Go models from `~/.cache/opencode/models.json` and routes via Pi's OpenAI-compatible handler to `https://opencode.ai/zen/go/v1`; requires Go subscription key set via `/opencode-go-key` command.
- Pi stack 2026-06-26: base=@tmustier/pi-agent-teams + @tmustier UI. github.com/h4ni0/pi [filtered: keeps memory/subagents/image-gen/workflow/ui/code-state/side-chat; drops firecrawl-web.ts]. Custom: searxng-web.ts (SearXNG @ 127.0.0.1:8888, auto-starts), warp-image-paste.ts, workflow-enforcement.ts. Add-ons: pi-opencode-bridge, pi-lens, @ayulab/pi-rewind. Removed pi-subagents+pi-extensions (conflicted h4ni0/pi). `memory-kb-sync` mirrors ~/.pi/memory → ai-knowledge-base/raw/memory-sync/.
- Session start: auto-check all 22 projects for uncompiled sessions (raw/sessions/ newer than knowledge/) and run compile.py for any that need it — same model, not subprocess.
- DeepSeek API models (via deepseek provider at api.deepseek.com/v1): deepseek-v4-flash (284B/13B, non-thinking, 1M ctx, workhorse), deepseek-v4-pro (1.6T/49B, reasoning with thinking:enabled + reasoning_effort, 1M ctx). deepseek-chat & deepseek-reasoner deprecated 2026-07-24, mapped to v4-flash non-thinking/thinking modes.
- Pi 4 delegation systems: delegate (single sub-agent, inherits model), teams (parallel multi-agent + task lists + mailboxes), workflow_run (sequential YAML phases, conditional routing, per-phase model/tools), dev-stack agents (8 role .md files at ~/.claude/agents/ → dev-stack/agents/, adapted to deepseek-v4-flash). Use delegate for single task, teams for 2+ parallel, workflow for sequential pipeline with conditions, workflow+teams for large features.
- Stale teams lock files: pi crash leaves config.json.lock under ~/.pi/agent/teams/<uuid>/. Lock is JSON {pid, createdAt, label}. If PID is dead, rm the lock. Workflow enforcement blocks trivial `rm` — satisfy gates by editing specs/_session log (specDone) → delegate compact (orchestratorDone) → then bash works. Or use workflow-enforcement bypass-once.
