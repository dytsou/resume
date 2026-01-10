/**
 * Entry point for LaTeX to HTML conversion
 * Processes all LaTeX files and generates HTML
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

import { CONFIG } from './config.mjs';
import { ensureDirectoryExists } from './utils.mjs';
import { convertLatexToHtml } from './converter.mjs';

/**
 * Main function - processes all LaTeX files and generates HTML
 */
export function main() {
  console.log('Starting LaTeX to HTML conversion...');

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
    const outputPath = join(CONFIG.outputDir, `${fileBasename}.html`);

    console.log(`Converting: ${file}`);

    try {
      const latexContent = readFileSync(filePath, 'utf-8');
      const result = convertLatexToHtml(latexContent, fileBasename);

      if (result.success) {
        writeFileSync(outputPath, result.html);

        manifest.push({
          id: fileBasename,
          filename: file,
          title: result.metadata.title,
          author: result.metadata.author,
          date: result.metadata.date,
          htmlPath: `converted-docs/${fileBasename}.html`,
          lastConverted: new Date().toISOString(),
        });

        console.log(`  ✓ Successfully converted to: ${outputPath}`);
      } else {
        console.error(`  ✗ Failed to convert ${file}: ${result.error}`);
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
