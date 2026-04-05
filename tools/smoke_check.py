#!/usr/bin/env python3
"""Simple smoke check for tutorial module migration.

This checks each tutorial index.html contains a module script that imports
`initTutorial` from the shared runtime and reports any mismatches.
"""
import glob
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
pattern = os.path.join(ROOT, 'tutorials', '*', 'index.html')
paths = sorted(glob.glob(pattern))
failures = []
for p in paths:
    s = open(p, 'r', encoding='utf-8').read()
    if 'import { initTutorial }' not in s or 'type="module"' not in s:
        failures.append(p)

print(f'Checked {len(paths)} tutorials')
if failures:
    print('FAIL: some tutorials are not migrated to the shared runtime:')
    for f in failures:
        print(' -', os.path.relpath(f, ROOT))
    raise SystemExit(2)
print('OK: all tutorials import initTutorial and use module scripts')
