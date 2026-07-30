/**
 * Entry point for LaTeX to HTML/PDF conversion via TeX Live + lwarp
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, copyFileSync } from 'fs';
import { join, basename, extname } from 'path';

import { CONFIG } from './config.mjs';
import { ensureDirectoryExists } from './utils.mjs';
import { compileDocument } from './compile/tex-engine.mjs';

/**
 * Main function - processes all LaTeX files and generates HTML + PDF
 */
export function main() {
  console.log('Starting LaTeX to HTML/PDF conversion (lwarp)...');

  ensureDirectoryExists(CONFIG.outputDir);

  if (!existsSync(CONFIG.latexDir)) {
    console.error(`Error: LaTeX directory not found: ${CONFIG.latexDir}`);
    process.exit(1);
  }

  const files = readdirSync(CONFIG.latexDir).filter(
    (file) => extname(file) === '.tex'
  );

  if (files.length === 0) {
    console.log('No LaTeX files found in the latex directory.');
    writeFileSync(CONFIG.manifestFile, JSON.stringify([], null, 2));
    process.exit(0);
  }

  console.log(`Found ${files.length} LaTeX file(s) to convert.`);

  const manifest = [];
  let hasErrors = false;

  for (const file of files) {
    const filePath = join(CONFIG.latexDir, file);
    const fileBasename = basename(file, '.tex');
    const htmlOutputPath = join(CONFIG.outputDir, `${fileBasename}.html`);
    const pdfOutputPath = join(CONFIG.outputDir, `${fileBasename}.pdf`);

    console.log(`Converting: ${file}`);

    try {
      const latexContent = readFileSync(filePath, 'utf-8');
      const result = compileDocument({
        source: latexContent,
        filename: file,
        id: fileBasename,
        outputDir: CONFIG.outputDir,
      });

      if (result.success && result.html) {
        writeFileSync(htmlOutputPath, result.html);
        if (result.pdfPath && existsSync(result.pdfPath)) {
          copyFileSync(result.pdfPath, pdfOutputPath);
        }

        manifest.push({
          id: fileBasename,
          filename: file,
          title: result.metadata?.title ?? fileBasename,
          author: result.metadata?.author ?? 'Unknown Author',
          date: result.metadata?.date ?? new Date().toISOString().split('T')[0],
          htmlPath: `converted-docs/${fileBasename}.html`,
          pdfPath: `converted-docs/${fileBasename}.pdf`,
          lastConverted: new Date().toISOString(),
        });

        console.log(`  ✓ HTML: ${htmlOutputPath}`);
        console.log(`  ✓ PDF:  ${pdfOutputPath}`);
      } else {
        console.error(`  ✗ Failed to convert ${file}: ${result.error}`);
        if (result.log) {
          console.error(result.log.slice(-2000));
        }
        hasErrors = true;
      }
    } catch (error) {
      console.error(`  ✗ Error processing ${file}: ${error.message}`);
      hasErrors = true;
    }
  }

  writeFileSync(CONFIG.manifestFile, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to: ${CONFIG.manifestFile}`);
  console.log(
    `Successfully converted: ${manifest.length}/${files.length} files`
  );

  if (hasErrors) {
    console.error(
      '\nSome files failed to convert. Fix errors before deployment.'
    );
    process.exit(1);
  } else {
    console.log('\nAll LaTeX files converted successfully!');
    process.exit(0);
  }
}

main();
