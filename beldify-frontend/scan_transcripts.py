import os, json
from pathlib import Path
from collections import Counter

base = Path('/root/.claude/projects/-var-local-beldify-auto-beldify-frontend')

# Gather all jsonl files with mtime
files = []
for p in base.rglob('*.jsonl'):
    try:
        files.append((p.stat().st_mtime, p))
    except Exception:
        pass

files.sort(reverse=True)
recent = files[:50]
print("Total files: %d, scanning: %d" % (len(files), len(recent)))

# Commands already auto-allowed by Claude Code -- skip these
ALREADY_ALLOWED = set([
    'ls','cat','head','tail','wc','stat','find','grep','egrep','fgrep','rg','diff',
    'echo','printf','pwd','whoami','date','which','type','file','sort','uniq','tree',
    'ps','df','du','free','id','uname','hostname','uptime','cal','seq','cut','paste',
    'tr','column','tac','rev','fold','expand','unexpand','jq','sed','xargs',
])

GIT_AUTO = set(['status','log','diff','show','blame','branch','tag','remote','ls-files',
            'ls-remote','rev-parse','describe','reflog','shortlog','cat-file',
            'for-each-ref','worktree','stash','config'])

GH_AUTO  = set(['pr','issue','run','workflow','repo','release','auth','api'])
DOCKER_AUTO = set(['ps','images','logs','inspect'])

# Tools where we want cmd+subcommand key
SUBCMD = set(['npm','npx','composer','artisan','next','yarn','pnpm',
          'node','php','python3','python','bun'])

cmd_counter = Counter()
raw_examples = {}

for _, fpath in recent:
    try:
        with open(fpath, errors='replace') as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                msg = obj.get('message', {})
                if not isinstance(msg, dict):
                    continue
                for item in msg.get('content', []):
                    if not isinstance(item, dict):
                        continue
                    if item.get('type') != 'tool_use' or item.get('name') != 'Bash':
                        continue
                    raw_cmd = item.get('input', {}).get('command', '').strip()
                    if not raw_cmd:
                        continue

                    # Parse leading token (skip env var prefixes like FOO=bar cmd)
                    tokens = raw_cmd.split()
                    idx = 0
                    while idx < len(tokens) and '=' in tokens[idx] and not tokens[idx].startswith('-'):
                        idx += 1
                    if idx >= len(tokens):
                        continue
                    lead = tokens[idx]
                    rest = tokens[idx+1:]

                    # Skip already-auto-allowed git/gh/docker subcommands
                    if lead == 'git' and rest and rest[0] in GIT_AUTO:
                        continue
                    if lead == 'gh' and rest and rest[0] in GH_AUTO:
                        continue
                    if lead == 'docker' and rest and rest[0] in DOCKER_AUTO:
                        continue
                    if lead in ALREADY_ALLOWED:
                        continue

                    # Build key
                    if lead in SUBCMD and rest:
                        sub = rest[0]
                        if not sub.startswith('-'):
                            key = lead + ' ' + sub
                        else:
                            key = lead
                    else:
                        key = lead

                    cmd_counter[key] += 1
                    if key not in raw_examples:
                        raw_examples[key] = raw_cmd[:120]

    except Exception as e:
        pass

print("\nTop 40 non-auto-allowed Bash commands:")
for cmd, count in cmd_counter.most_common(40):
    ex = raw_examples.get(cmd, '')
    print("  %4d  %-35s  # %s" % (count, cmd, ex[:80]))
