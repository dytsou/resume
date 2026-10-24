# Convert fidelity budget (tracked)

Certified convert for `latex/resume.tex` may rely only on packages and document classes in:

- `allowed-packages.json`
- `allowed-document-classes.json`

That list is the **certified ceiling** (R2). Adding a package to the resume without updating these allowlists is a fidelity violation: certified convert must fail with structured diagnostics (R11).

A longer product-facing note also lives at `docs/convert-fidelity-budget.md` when local CE docs are present.

## Fuzzy lane (Lane A) claim

The `@unified-latex` fuzzy path does **not** claim the full certified budget. It only claims:

- Document metadata (`\title`, `\author`, `\date`)
- A best-effort HTML rendering of resume macros and body text inside the packages already used by `latex/resume.tex`

Fuzzy output is never publish authority when certified artifacts exist for the same `sourceHash` (R3, R10).

## Updating the budget

1. Add the package or class to the JSON allowlists.
2. Ensure CI TeX install (`tl_packages`) can provide it.
3. Re-run certified convert and fidelity gates.
