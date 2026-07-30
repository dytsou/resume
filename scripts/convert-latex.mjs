/**
 * Entry point for LaTeX to HTML/PDF conversion via TeX Live + lwarp
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  copyFileSync,
} from 'node:fs';
import { join, basename, extname } from 'node:path';

import { CONFIG } from './config.mjs';
import { ensureDirectoryExists } from './utils.mjs';
import { compileDocument } from './compile/tex-engine.mjs';
import { isTexAvailable } from './compile/tex-available.mjs';

/**
 * @param {string[]} texFiles
 */
function hasPrebuiltArtifacts(texFiles) {
  return texFiles.every((file) => {
    const base = basename(file, '.tex');
    return existsSync(join(CONFIG.outputDir, `${base}.html`));
  });
}

function listTexFiles() {
  if (!existsSync(CONFIG.latexDir)) {
    console.error(`Error: LaTeX directory not found: ${CONFIG.latexDir}`);
    process.exit(1);
  }
  return readdirSync(CONFIG.latexDir).filter((file) => extname(file) === '.tex');
}

/** @param {string[]} files */
function exitIfNoTexAndNoArtifacts(files) {
  if (isTexAvailable()) return;
  if (hasPrebuiltArtifacts(files)) {
    console.warn(
      'TeX unavailable; skipping convert and using public/converted-docs/ (ponytail: Cloudflare Workers Builds has no TeX Live).'
    );
    process.exit(0);
  }
  console.error(
    'TeX Live not found and no prebuilt HTML in public/converted-docs/. Install TeX Live or commit converted artifacts.'
  );
  process.exit(1);
}

/**
 * @param {string} file
 * @returns {{ ok: true, entry: object } | { ok: false, error: string, log?: string }}
 */
function convertOneFile(file) {
  const fileBasename = basename(file, '.tex');
  const filePath = join(CONFIG.latexDir, file);
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

    if (!result.success || !result.html) {
      return { ok: false, error: result.error ?? 'Unknown error', log: result.log };
    }

    writeFileSync(htmlOutputPath, result.html);
    if (result.pdfPath && existsSync(result.pdfPath)) {
      copyFileSync(result.pdfPath, pdfOutputPath);
    }

    console.log(`  ✓ HTML: ${htmlOutputPath}`);
    console.log(`  ✓ PDF:  ${pdfOutputPath}`);

    return {
      ok: true,
      entry: {
        id: fileBasename,
        filename: file,
        title: result.metadata?.title ?? fileBasename,
        author: result.metadata?.author ?? 'Unknown Author',
        date: result.metadata?.date ?? new Date().toISOString().split('T')[0],
        htmlPath: `converted-docs/${fileBasename}.html`,
        pdfPath: `converted-docs/${fileBasename}.pdf`,
        lastConverted: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** @param {object[]} manifest @param {number} total @param {boolean} hasErrors */
function finish(manifest, total, hasErrors) {
  writeFileSync(CONFIG.manifestFile, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to: ${CONFIG.manifestFile}`);
  console.log(`Successfully converted: ${manifest.length}/${total} files`);

  if (hasErrors) {
    console.error('\nSome files failed to convert. Fix errors before deployment.');
    process.exit(1);
  }
  console.log('\nAll LaTeX files converted successfully!');
  process.exit(0);
}

export function main() {
  console.log('Starting LaTeX to HTML/PDF conversion (lwarp)...');
  ensureDirectoryExists(CONFIG.outputDir);

  const files = listTexFiles();
  if (files.length === 0) {
    console.log('No LaTeX files found in the latex directory.');
    writeFileSync(CONFIG.manifestFile, JSON.stringify([], null, 2));
    process.exit(0);
  }

  console.log(`Found ${files.length} LaTeX file(s) to convert.`);
  exitIfNoTexAndNoArtifacts(files);

  const manifest = [];
  let hasErrors = false;

  for (const file of files) {
    const outcome = convertOneFile(file);
    if (outcome.ok) {
      manifest.push(outcome.entry);
    } else {
      console.error(`  ✗ Failed to convert ${file}: ${outcome.error}`);
      if (outcome.log) console.error(outcome.log.slice(-2000));
      hasErrors = true;
    }
  }

  finish(manifest, files.length, hasErrors);
}

main();
