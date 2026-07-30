# LaTeX Resume — HTML, PDF, and Authoring

Converts LaTeX documents in `latex/` to HTML and PDF via TeX Live (lwarp + XeLaTeX), serves them as a static Cloudflare site, and provides a dev-only authoring app with live preview.

## Features

- **lwarp + XeLaTeX**: Real TeX engine for HTML (`lwarpmk html`) and PDF (`lwarpmk print`)
- **Batch convert**: `pnpm run convert` writes `public/converted-docs/` and updates `documents-manifest.json`
- **Authoring (dev)**: Document list, view, and split-pane editor with debounced live preview
- **Built PDF**: Published alongside HTML; no external Google Drive link
- **CI**: TeX Live (cached), Vitest, lint, typecheck, and build on every PR

## Prerequisites

- **Node.js** >= 24
- **pnpm** 11.x (`corepack enable`)
- **TeX Live** with packages listed in `scripts/tex/tl_packages` (required for convert/build/tests locally; CI installs automatically)

## Quick start

```bash
pnpm install
pnpm run convert   # HTML + PDF under public/converted-docs/
pnpm run build     # convert + Vite production build
pnpm dev           # Vite + local compile server (live preview + save API)
```

Authoring routes (with `pnpm dev`):

| Route       | Purpose                               |
| ----------- | ------------------------------------- |
| `/`         | Document list from manifest           |
| `/view/:id` | Published HTML preview + PDF download |
| `/edit/:id` | CodeMirror editor + live preview      |

Save in the editor writes `latex/{id}.tex` via dev-only `PUT /api/documents/:id`. Run `pnpm run build` to refresh published artifacts.

## Project layout

```
latex/                  # Source .tex files
scripts/compile/        # tex-engine, lwarp, validation
scripts/tex/            # CI package list + allowlists
public/converted-docs/  # Generated HTML/PDF (gitignored output from convert)
src/pages/              # List, view, edit UI
```

## How conversion works

1. **Preamble validation** — `\documentclass` and `\usepackage` checked against allowlists
2. **lwarp** — XeLaTeX + `lwarpmk html` / `lwarpmk print` in a temp workdir
3. **Post-process** — HTML asset paths normalized for static hosting
4. **Manifest** — `documents-manifest.json` lists `htmlPath` and `pdfPath` per document

## Deploy

Production remains static-only. `pnpm run deploy` builds and deploys via Wrangler. Subpath hosting uses `BASE_PATH=/resume/` (see `vite.config.ts`).
