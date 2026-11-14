import re, pathlib, sys
root = pathlib.Path(r"D:\project\.swarm-lab\head_tree2")
bad = 0
for name in ("pick-daily-profile.md", "pick-daily-feed-verdict.md"):
    p = root / ".swarm" / "requirements" / name
    text = p.read_text(encoding="utf-8")
    for m in re.finditer(r"([A-Za-z0-9_./\\-]+\.(?:py|yaml|yml|md)):(\d+)(?:-(\d+))?", text):
        f, a, b = m.group(1), int(m.group(2)), m.group(3)
        target = root / f.replace("\\", "/")
        if not target.exists():
            print(f"MISSING FILE {name}: {f}"); bad += 1; continue
        n = len(target.read_text(encoding="utf-8").splitlines())
        hi = int(b) if b else a
        ok = 1 <= a <= hi <= n
        print(f"{'OK  ' if ok else 'DRIFT'} {name}: {f}:{a}{'-'+b if b else ''} (file has {n} lines)")
        if not ok: bad += 1
print("BAD =", bad)