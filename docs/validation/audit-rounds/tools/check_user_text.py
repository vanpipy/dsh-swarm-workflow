import re, pathlib
def norm(s):
    s = s.strip()
    s = re.sub(r'^#+\s*', '', s)
    return s
pol_u = pathlib.Path(r"D:\project\.swarm-lab\policy_hit_1.txt").read_text(encoding="utf-8").splitlines()
sk_u  = pathlib.Path(r"D:\project\.swarm-lab\user_skill_paste.md").read_text(encoding="utf-8").splitlines()
pol_s = pathlib.Path(r"D:\project\dsh-plugins\swarm-workflow\swarm-prompt.md").read_text(encoding="utf-8").splitlines()
sk_s  = pathlib.Path(r"D:\project\dsh-plugins\swarm-workflow\skills\swarm-engineering.md").read_text(encoding="utf-8").splitlines()
def pool(lines):
    out = set()
    for l in lines:
        n = norm(l)
        if n: out.add(n)
    return out
P, S = pool(pol_s), pool(sk_s)
both = P | S
def missing(orig_lines, label):
    miss = []
    for i, l in enumerate(orig_lines, 1):
        n = norm(l)
        if not n: continue
        if n in both: continue
        miss.append((i, l.strip()[:110]))
    print(f"{label}: unmatched {len(miss)} of {len(orig_lines)} lines")
    for i, t in miss: print(f"   :{i}  {t}")
missing(pol_u, "POLICY")
missing(sk_u, "SKILL")
