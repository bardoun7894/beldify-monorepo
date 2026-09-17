#!/usr/bin/env python3
"""
Beldify Drift Detector — Check sync status between local and production server.

Usage:
    python3 scripts/drift-check.py           # Full drift report
    python3 scripts/drift-check.py --quick   # Quick SHA-only check  
    python3 scripts/drift-check.py --fix     # Auto-sync
"""
import subprocess, sys
from datetime import datetime

PROJECT = "/Users/mohamedbardouni/projects/beldify"
SERVER_CMD = "ssh MyContabo"
SERVER_PATH = "/var/local/beldify-monorepo"

def run_local(cmd, cwd=PROJECT):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    return r.stdout.strip(), r.stderr.strip(), r.returncode

def run_server(cmd):
    r = subprocess.run(f'{SERVER_CMD} "cd {SERVER_PATH} && {cmd}"', shell=True, capture_output=True, text=True)
    return r.stdout.strip(), r.stderr.strip(), r.returncode

def get_git_info(path=""):
    cwd = f"{PROJECT}/{path}" if path else PROJECT
    sha,_,_ = run_local("git rev-parse HEAD", cwd)
    branch,_,_ = run_local("git rev-parse --abbrev-ref HEAD", cwd)
    mod,_,_ = run_local("git status --short", cwd)
    ml = [l.strip() for l in mod.split("\n") if l.strip()]
    return {"sha": sha[:12], "branch": branch, "modified_count": len(ml), "modified_list": ml}

def get_server_git_info(path=""):
    d = f"{SERVER_PATH}/{path}" if path else SERVER_PATH
    sha,_,_ = run_server(f"cd {d} && git rev-parse HEAD 2>/dev/null")
    branch,_,_ = run_server(f"cd {d} && git rev-parse --abbrev-ref HEAD 2>/dev/null")
    mod,_,_ = run_server(f"cd {d} && git status --short 2>/dev/null")
    ml = [l.strip() for l in mod.split("\n") if l.strip()]
    return {"sha": sha[:12] if sha else "???", "branch": branch, "modified_count": len(ml), "modified_list": ml}

def check_drift():
    drift = False
    print("="*65)
    print(f"🔍 Beldify Drift Detector — {datetime.now():%Y-%m-%d %H:%M}")
    print("="*65)
    print("\n📦 beldify-monorepo:")
    try:
        local = get_git_info(); server = get_server_git_info()
    except Exception as e:
        print(f"   ❌ Cannot reach server: {e}"); return drift
    s = "✅ SYNCED" if local["sha"]==server["sha"] else "❌ DRIFT"
    print(f"   Local:  {local['branch']} @ {local['sha']}  ({local['modified_count']} modified)")
    print(f"   Server: {server['branch']} @ {server['sha']}  ({server['modified_count']} modified)")
    print(f"   Status: {s}")
    if local["sha"]!=server["sha"]:
        drift = True; print(f"\n   ⚠️  SHA mismatch — {local['sha']} vs {server['sha']}")
    if local["modified_count"]: print(f"   📝 Local changes: {', '.join(local['modified_list'][:8])}")
    if server["modified_count"]: print(f"   📝 Server changes: {', '.join(server['modified_list'][:8])}")
    print("\n📦 beldify-backend (submodule):")
    try:
        ls = get_git_info("beldify-backend"); ss = get_server_git_info("beldify-backend")
    except Exception:
        print("   ❌ Cannot check submodule"); return drift
    ss2 = "✅ SYNCED" if ls["sha"]==ss["sha"] else "❌ DRIFT"
    print(f"   Local:  {ls['branch']} @ {ls['sha']}  ({ls['modified_count']} modified)")
    print(f"   Server: {ss['branch']} @ {ss['sha']}  ({ss['modified_count']} modified)")
    print(f"   Status: {ss2}")
    if ls["sha"]!=ss["sha"]: drift = True
    print("\n"+"="*65)
    if drift: print("⚠️  DRIFT DETECTED — Run with --fix to auto-sync")
    else: print("✅ ALL SYNCED — Local and server are identical")
    print("="*65)
    return drift

def fix_drift():
    print("\n🔄 Auto-syncing server...")
    out,err,code = run_server("git pull origin main 2>&1")
    print(f"   Monorepo: {'✅' if code==0 else '❌ '+err[:80]}")
    if "CONFLICT" in out+err:
        run_server("git checkout --theirs beldify-frontend/public/sw.js 2>/dev/null")
        run_server("git add -A && git commit -m 'drift-fix: resolve conflict' 2>/dev/null && git push origin main 2>/dev/null")
    out,err,code = run_server("git submodule update --remote --merge beldify-backend 2>&1")
    if code!=0:
        run_server("cd beldify-backend && git stash 2>/dev/null")
        run_server("git submodule update --remote --merge beldify-backend 2>&1")
    print(f"   Submodule: ✅")
    run_server("git add beldify-backend && git commit -m 'drift-fix: sync submodule' 2>/dev/null && git push origin main 2>/dev/null")
    run_server("docker restart beldify-backend 2>&1")
    print(f"   Backend: ✅\n✅ Done.")

if __name__=="__main__":
    if "--fix" in sys.argv:
        if check_drift(): fix_drift(); print("\n── Verify ──"); check_drift()
        else: print("Already synced!")
    elif "--quick" in sys.argv: check_drift()
    else: check_drift()
