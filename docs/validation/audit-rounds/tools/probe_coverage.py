"""Coverage probe for C6.

Lists every public function defined in the package under <src> and every test
function defined in <tests>, then reports which public functions are named by
at least one test function. Exits 0 only when every public function is covered.
"""

import ast
import pathlib
import sys

src_root = pathlib.Path(sys.argv[1])
tests_root = pathlib.Path(sys.argv[2])


def public_functions(package_root):
    found = []
    for path in sorted(package_root.rglob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if not node.name.startswith("_"):
                    found.append((node.name, path))
    return found


def test_functions(tests_root):
    found = []
    for path in sorted(tests_root.rglob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if node.name.startswith("test_"):
                    found.append((node.name, path))
    return found


funcs = public_functions(src_root)
tests = test_functions(tests_root)

print("PUBLIC FUNCTIONS in", src_root)
for name, path in funcs:
    print(f"  {name:<20} defined in {path.name}")
print()
print("TEST FUNCTIONS in", tests_root)
for name, path in tests:
    print(f"  {name:<62} in {path.name}")
print()

uncovered = []
for fname, fpath in funcs:
    covering = [tname for tname, tpath in tests if fname in tname]
    if covering:
        for tname in covering:
            tpath = next(p for n, p in tests if n == tname)
            print(f"COVERED   {fname} -> {tname} ({tpath.name})")
    else:
        uncovered.append(fname)
        print(f"UNCOVERED {fname} -> no test function names it")

print()
print(f"PUBLIC_FUNCTIONS={len(funcs)} UNCOVERED={len(uncovered)} {uncovered}")
sys.exit(1 if uncovered else 0)
