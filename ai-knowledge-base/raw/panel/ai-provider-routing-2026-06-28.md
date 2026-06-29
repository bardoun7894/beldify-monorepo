# Panel Verdict: Per-Feature AI Provider Routing

## Route

panel (4 reviewers: Claude + Codex + Gemini + OpenCode)

## Verdict

✅ ACCEPTED — all 4 reviewers agree on the approach

## Summary

Add `provider` field to config/ai.php features array, add `forFeature()` to AiManager, and swap 5 service/controller files from `ChatClient` → `AiManager` injection.

## Decision rationale

Minimal, backward-compatible change:

- Config default flips to deepseek (paid features)
- 4 free features get `provider: openrouter` override
- AiManager.forFeature() is a single method reusing existing provider() resolver
- No AppServiceProvider changes needed
- Each service edit follows the same mechanical pattern

## Risk assessment

LOW — mechanical refactor, no schema changes, no new dependencies. Primary risk is missing a `$this->client` call in truncated file reads (mitigated by full read).

## Voting

| Reviewer | Vote | Notes |
|----------|------|-------|
| Claude | ✅ | Straightforward, follows existing patterns |
| Codex | ✅ | Pattern is clean and composable |
| Gemini | ✅ | Zero-risk mechanical refactor |
| OpenCode | ✅ | Simple config + method addition |

## Next steps

Implement in order: config → AiManager → 4 services → controller
