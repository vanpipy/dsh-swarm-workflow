# swarmlab quality comparison

Two arms, one instrument:

- control (`D:\project\swarm-lab-control`): the same specification implemented in one pass, without the
  swarm workflow — no requirement file, no separate Tester lane, no Reviewer lane, no
  per-requirement checks, no `.swarm` documentation set.
- workflow (`D:\project\swarm-lab-python`): the same specification implemented through the swarm
  workflow — a durable requirement set, a Developer lane, a Tester lane, a Reviewer lane
  and the workspace documentation set.

Both arms are measured by a copy of this repository's own `tools/quality_report.py`,
run inside each tree, so the numbers come from the same code.

| metric | control | workflow | verdict |
| --- | --- | --- | --- |
| package_modules | 5 | 5 | same |
| public_functions | 5 | 5 | same |
| annotation_coverage | 1.0 | 1.0 | same |
| docstring_coverage | 1.0 | 1.0 | same |
| module_docstring_coverage | 1.0 | 1.0 | same |
| public_functions_without_tests_count | 0 | 0 | same |
| avg_function_length | 15.8 | 5.6 | better |
| max_function_length | 25 | 14 | better |
| max_nesting_depth | 3 | 2 | better |
| duplicate_line_ratio | 0.1048 | 0.0 | better |
| test_functions | 42 | 51 | better |

A higher number is better for coverage and test counts; a lower number is better for
length, nesting, duplication and untested public functions.
