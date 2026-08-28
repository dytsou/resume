# LaTeX Resume Converter

This project converts LaTeX documents into styled, responsive HTML and serves the generated resume as a static HTML page with a small Vanilla JS enhancement. The production site is deployed to Cloudflare Pages and is available at [dy.tsou.me/resume](https://dy.tsou.me/resume/).

## Features

- Converts every `.tex` file in `latex/` to a standalone HTML document
- Preserves resume-specific macros for headings, skills, lists, contacts, links, and icons
- Renders math in the generated documents with MathJax
- Embeds the generated resume content directly in the static page for SEO
- Optionally provides a Google Drive PDF download button
- Fails the build when any LaTeX document cannot be converted
- Deploys through GitHub Actions after CI succeeds

## Requirements

- Node.js 24 or newer
- pnpm 11 (enabled with Corepack)

```bash
corepack enable
pnpm install
```

## Adding or Updating a Resume

Put source documents in `latex/`. The default document is `latex/resume.tex`; the converter also processes any other files with a `.tex` extension.

```text
latex/
└── resume.tex
```

The converter extracts `\title{...}`, `\author{...}`, and `\date{...}` metadata. Missing values fall back to `Untitled Document`, `Unknown Author`, and the current date.

## Development

Convert the LaTeX sources without building the application:

```bash
pnpm run convert
```

Start the Vite development server:

```bash
pnpm run dev
```

Build the application (conversion runs automatically first), then preview the production output with Wrangler:

```bash
pnpm run build
pnpm run preview
```

Generated HTML files are written to `public/converted-docs/` and the conversion manifest to `public/documents-manifest.json`. These generated files, along with `dist/`, are ignored by Git.

## Configuration

`VITE_GOOGLE_DRIVE_RESUME_LINK` is optional. When set, the application displays a download button and accepts a Google Drive sharing URL or file ID.

For local development, create a `.env` file based on `.env.example`:

```dotenv
VITE_GOOGLE_DRIVE_RESUME_LINK=https://drive.google.com/file/d/YOUR_FILE_ID
```

`BASE_PATH` controls the URL prefix used by Vite. The production front-door route uses `/resume/`; local development and the standalone Cloudflare Pages preview use `/`. Set `WORKER_SUBPATH=true` when building assets into `dist/resume/` for a Worker mounted under `/resume`.

## Commands

| Command                  | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `pnpm run dev`           | Start the Vite development server                  |
| `pnpm run convert`       | Convert all LaTeX files                            |
| `pnpm run convert:latex` | Run the LaTeX conversion module directly           |
| `pnpm run build`         | Convert LaTeX files and build the Vite application |
| `pnpm run preview`       | Build and serve locally with Wrangler              |
| `pnpm run lint`          | Run ESLint                                         |
| `pnpm run typecheck`     | Run the TypeScript checker                         |
| `pnpm test`              | Run Node.js tests                                  |
| `pnpm run format`        | Format supported source files with Prettier        |
| `pnpm run format:check`  | Check Prettier formatting                          |
| `pnpm run deploy`        | Build and deploy with Wrangler                     |

## CI and Deployment

`.github/workflows/ci.yml` runs linting, tests, type checking, and a production build on pushes and pull requests. The main-branch build verifies `dist/index.html`, checks the `/resume/` asset prefix, and validates `deploy-contract.json`.

`.github/workflows/deploy.yml` runs after successful CI on `main` (or manually). It builds with `BASE_PATH=/resume/`, uploads the `dist/` artifact, and deploys it to the `dy-tsou-resume` Cloudflare Pages project. The deployment action also registers the `/resume/` front-door route in the `dytsou/site` manifest.

The configured deployment URLs are:

- Canonical: `https://dy.tsou.me/resume/`
- Cloudflare Pages preview: `https://resume.tsou.me`

To deploy locally with Wrangler:

```bash
pnpm run deploy
```

The GitHub Actions deployment requires `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `MANIFEST_REPO_TOKEN` secrets. The optional `VITE_GOOGLE_DRIVE_RESUME_LINK` is configured as a repository variable.

The publish workflow publishes the `@dytsou/resume-converter` package to npmjs and GitHub Packages when its package or converter sources change.

## Project Structure

```text
resume/
├── latex/                         # LaTeX source documents
├── scripts/
│   ├── commands/                  # CLI entry points
│   ├── modules/latex/             # LaTeX parsing and conversion
│   ├── modules/html/              # HTML transformations and template
│   └── shared/                    # Shared configuration and utilities
├── src/
│   └── main.js                    # Small Vanilla JS enhancements
├── public/                        # Static assets and generated conversion output
├── tests/                         # Node.js unit tests
├── vite.config.ts                 # Vite and deployment path configuration
├── wrangler.toml                  # Cloudflare configuration (Pages/assets build)
└── deploy-contract.json           # Deployment invariants checked in CI
```

## Technologies

- Static HTML with Vanilla JS
- Vite 8 with `@cloudflare/vite-plugin`
- Cloudflare Pages and Wrangler
- `@unified-latex` and `unified`
- MathJax
- GitHub Actions

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
