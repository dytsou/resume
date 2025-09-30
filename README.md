# LaTeX to HTML Converter with Automated Deployment

A web application that automatically converts LaTeX documents to arXiv-style HTML and deploys them to GitHub Pages. Every time you push to the repository, the system validates that all LaTeX files can be successfully converted before deploying.

## Features

- **Automated LaTeX Conversion**: Converts `.tex` files to beautiful HTML with proper mathematical notation
- **arXiv-style Rendering**: Clean, academic presentation similar to arXiv HTML papers
- **CI/CD Pipeline**: GitHub Actions workflow that validates and deploys automatically
- **Fail-Safe Deployment**: Blocks deployment if any LaTeX file fails to convert
- **Document Browser**: Browse all converted documents in a clean, responsive interface
- **MathJax Integration**: Proper rendering of mathematical formulas
- **Supabase Database**: Track conversion history and document metadata

## Project Structure

```
project/
├── latex/                  # Store your LaTeX documents here
│   └── sample-paper.tex    # Example LaTeX document
├── scripts/
│   └── convert-latex.mjs   # LaTeX to HTML conversion script
├── src/
│   ├── components/
│   │   └── DocumentBrowser.tsx  # Document listing UI
│   ├── lib/
│   │   └── supabase.ts     # Database client
│   └── App.tsx             # Main application
├── public/
│   ├── converted-docs/     # Generated HTML files (created during build)
│   └── documents-manifest.json  # Document metadata (created during build)
└── .github/
    └── workflows/
        └── deploy.yml      # CI/CD pipeline configuration
```

## Getting Started

### 1. Add Your LaTeX Documents

Place your `.tex` files in the `latex/` directory. The converter will automatically process all files with a `.tex` extension.

Example structure:
```
latex/
├── my-research-paper.tex
├── math-notes.tex
└── thesis.tex
```

### 2. Test Locally

Convert and build the project:

```bash
npm install
npm run convert  # Convert LaTeX files only
npm run build    # Convert + build entire project
```

### 3. Set Up GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to **Pages** section
3. Under **Source**, select "GitHub Actions"

### 4. Configure Secrets

Add your Supabase credentials as repository secrets:

1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Add the following secrets:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### 5. Push to Deploy

```bash
git add .
git commit -m "Add LaTeX documents"
git push origin main
```

The GitHub Actions workflow will:
1. Install dependencies
2. Convert all LaTeX files
3. Validate conversion success
4. Build the React application
5. Deploy to GitHub Pages (only if all conversions succeed)

## How It Works

### Conversion Process

1. **LaTeX Parsing**: Uses `@unified-latex` to parse LaTeX source
2. **HTML Generation**: Converts LaTeX AST to HTML with proper structure
3. **MathJax Integration**: Mathematical formulas are rendered client-side
4. **Styling**: Applies arXiv-inspired CSS for clean academic presentation
5. **Manifest Creation**: Generates a JSON file with document metadata

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) ensures:

- All LaTeX files convert successfully before deployment
- Build fails if any conversion errors occur
- Only successfully built sites are deployed to GitHub Pages
- Environment variables are properly injected during build

### Database Tracking

The Supabase database stores:

- **Documents Table**: Metadata about each LaTeX file (title, author, date)
- **Conversion Logs**: History of conversion attempts and errors

## Available Scripts

- `npm run dev` - Start development server
- `npm run convert` - Convert LaTeX files to HTML
- `npm run build` - Convert LaTeX + build production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Customization

### Changing Base Path

If your repository name is different, update `vite.config.ts`:

```typescript
base: process.env.GITHUB_PAGES === 'true' ? '/your-repo-name/' : '/',
```

### Styling

Modify the CSS in `scripts/convert-latex.mjs` to customize the HTML output appearance.

### Document Metadata

The converter extracts metadata from LaTeX commands:
- `\title{...}` - Document title
- `\author{...}` - Author names
- `\date{...}` - Publication date

## Deployment

Your site will be available at:
```
https://<username>.github.io/<repository-name>/
```

## Troubleshooting

### Conversion Fails

Check the GitHub Actions logs to see which LaTeX file failed and why. Common issues:
- Unsupported LaTeX packages
- Syntax errors in LaTeX source
- Missing closing braces

### Deployment Blocked

If deployment is blocked, the CI/CD pipeline detected conversion failures. Fix the LaTeX files and push again.

### Local Testing

Run the conversion locally to debug issues:
```bash
npm run convert
```

Check the generated files in `public/converted-docs/` and review `public/documents-manifest.json`.

## Technologies Used

- **React + TypeScript**: Frontend framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **@unified-latex**: LaTeX parsing and conversion
- **MathJax**: Mathematical notation rendering
- **Supabase**: Database for tracking conversions
- **GitHub Actions**: CI/CD automation
- **GitHub Pages**: Static site hosting

## License

MIT
