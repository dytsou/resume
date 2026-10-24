/**
 * Entry point for LaTeX conversion — certified TeX lane preferred, fuzzy Lane A fallback.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';

import { compileCertifiedResume } from '../compile/tex-engine.mjs';
import { detectTexTools } from '../compile/tex-tools.mjs';
import { convertLatexToHtml } from '../modules/latex/converter.mjs';
import { hashSourceContent } from '../modules/latex/source-hash.mjs';
import { CONFIG } from '../shared/config.mjs';
import { ensureDirectoryExists } from '../shared/utils.mjs';

/**
 * @param {string} outputDir
 * @param {string} fileBasename
 * @param {string} sourceHash
 * @param {object | null} existingManifestEntry
 */
export function canReuseCertifiedArtifacts(
  outputDir,
  fileBasename,
  sourceHash,
  existingManifestEntry
) {
  if (!existingManifestEntry || existingManifestEntry.lane !== 'certified') {
    return false;
  }
  if (existingManifestEntry.sourceHash !== sourceHash) {
    return false;
  }
  const htmlPath = join(outputDir, `${fileBasename}.html`);
  const pdfPath = join(outputDir, `${fileBasename}.pdf`);
  return existsSync(htmlPath) && existsSync(pdfPath);
}

/**
 * True when a certified PDF for this sourceHash must not be replaced by fuzzy.
 * @param {string} outputDir
 * @param {string} fileBasename
 * @param {string} sourceHash
 * @param {object | null} existingManifestEntry
 */
export function shouldPreserveCertifiedArtifacts(
  outputDir,
  fileBasename,
  sourceHash,
  existingManifestEntry
) {
  if (!existingManifestEntry || existingManifestEntry.lane !== 'certified') {
    return false;
  }
  if (existingManifestEntry.sourceHash !== sourceHash) {
    return false;
  }
  return existsSync(join(outputDir, `${fileBasename}.pdf`));
}

function loadExistingManifest(manifestFile) {
  if (!existsSync(manifestFile)) {
    return [];
  }
  try {
    const parsed = JSON.parse(readFileSync(manifestFile, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function certifiedReuseEntry(file, fileBasename, sourceHash, prior) {
  return {
    id: fileBasename,
    filename: file,
    title: prior.title,
    author: prior.author,
    date: prior.date,
    htmlPath: `converted-docs/${fileBasename}.html`,
    pdfPath: `converted-docs/${fileBasename}.pdf`,
    lane: 'certified',
    sourceHash,
    converter: prior.converter,
    lastConverted: prior.lastConverted ?? new Date().toISOString(),
  };
}

function tryCertifiedResume({
  file,
  filePath,
  fileBasename,
  latexContent,
  sourceHash,
  outputDir,
  tools,
  compileCertified,
  convertFuzzy,
  requireCertified,
  messages,
}) {
  const certified = compileCertified({
    sourcePath: filePath,
    outputDir,
    basename: fileBasename,
    tools,
  });
  if (certified.success) {
    const meta = convertFuzzy(latexContent, fileBasename);
    messages.push(`Certified convert OK for ${file} via ${certified.tool}`);
    return {
      status: 'ok',
      entry: {
        id: fileBasename,
        filename: file,
        title: meta.metadata?.title ?? 'Untitled Document',
        author: meta.metadata?.author ?? 'Unknown Author',
        date: meta.metadata?.date ?? new Date().toISOString().split('T')[0],
        htmlPath: `converted-docs/${fileBasename}.html`,
        pdfPath: `converted-docs/${fileBasename}.pdf`,
        lane: 'certified',
        sourceHash,
        converter: certified.tool,
        lastConverted: new Date().toISOString(),
      },
    };
  }

  messages.push(`Certified convert failed for ${file}: ${certified.error}`);
  if (requireCertified) {
    messages.push(certified.diagnosticsJson);
    if (certified.log) {
      messages.push(`Certified compile log (tail):\n${certified.log.slice(-4000)}`);
    }
    return { status: 'error' };
  }
  return { status: 'fallback' };
}

function fuzzyOrPreserve({
  file,
  fileBasename,
  latexContent,
  sourceHash,
  outputDir,
  prior,
  convertFuzzy,
  messages,
}) {
  const result = convertFuzzy(latexContent, fileBasename);
  if (!result.success) {
    messages.push(`Fuzzy convert failed for ${file}: ${result.error}`);
    return { status: 'error' };
  }

  const htmlOut = join(outputDir, `${fileBasename}.html`);
  const pdfOut = join(outputDir, `${fileBasename}.pdf`);
  const preserve = shouldPreserveCertifiedArtifacts(
    outputDir,
    fileBasename,
    sourceHash,
    prior
  );

  if (preserve) {
    if (!existsSync(htmlOut)) {
      writeFileSync(htmlOut, result.html);
    }
    messages.push(
      `Preserved certified PDF for ${file}; refused fuzzy overwrite of ${pdfOut}`
    );
    return {
      status: 'ok',
      entry: {
        id: fileBasename,
        filename: file,
        title: prior.title ?? result.metadata.title,
        author: prior.author ?? result.metadata.author,
        date: prior.date ?? result.metadata.date,
        htmlPath: `converted-docs/${fileBasename}.html`,
        pdfPath: `converted-docs/${fileBasename}.pdf`,
        lane: 'certified',
        sourceHash,
        converter: prior.converter,
        lastConverted: prior.lastConverted ?? new Date().toISOString(),
      },
    };
  }

  writeFileSync(htmlOut, result.html);
  messages.push(`Fuzzy convert OK for ${file}`);
  return {
    status: 'ok',
    entry: {
      id: fileBasename,
      filename: file,
      title: result.metadata.title,
      author: result.metadata.author,
      date: result.metadata.date,
      htmlPath: `converted-docs/${fileBasename}.html`,
      lane: 'fuzzy',
      sourceHash,
      lastConverted: new Date().toISOString(),
    },
  };
}

/**
 * @param {{
 *   latexDir?: string,
 *   outputDir?: string,
 *   manifestFile?: string,
 *   tools?: ReturnType<typeof detectTexTools>,
 *   compileCertified?: typeof compileCertifiedResume,
 *   convertFuzzy?: typeof convertLatexToHtml,
 *   requireCertified?: boolean,
 * }} [options]
 */
export function convertAll(options = {}) {
  const latexDir = options.latexDir ?? CONFIG.latexDir;
  const outputDir = options.outputDir ?? CONFIG.outputDir;
  const manifestFile = options.manifestFile ?? CONFIG.manifestFile;
  const tools = options.tools ?? detectTexTools();
  const compileCertified = options.compileCertified ?? compileCertifiedResume;
  const convertFuzzy = options.convertFuzzy ?? convertLatexToHtml;
  const requireCertified =
    options.requireCertified ?? process.env.CONVERT_REQUIRE_CERTIFIED === '1';

  ensureDirectoryExists(outputDir);
  ensureDirectoryExists(dirname(manifestFile));

  if (!existsSync(latexDir)) {
    return {
      ok: false,
      error: `LaTeX directory not found: ${latexDir}`,
      manifest: [],
      messages: [],
    };
  }

  const files = readdirSync(latexDir).filter((file) => extname(file) === '.tex');
  if (files.length === 0) {
    writeFileSync(manifestFile, JSON.stringify([], null, 2));
    return { ok: true, manifest: [], messages: ['No LaTeX files found'] };
  }

  const existingManifest = loadExistingManifest(manifestFile);
  const manifest = [];
  const messages = [];
  let hasErrors = false;

  for (const file of files) {
    const filePath = join(latexDir, file);
    const fileBasename = basename(file, '.tex');
    const latexContent = readFileSync(filePath, 'utf8');
    const sourceHash = hashSourceContent(latexContent);
    const prior = existingManifest.find((item) => item.id === fileBasename) ?? null;
    const isResume = fileBasename === 'resume';

    if (
      isResume &&
      canReuseCertifiedArtifacts(outputDir, fileBasename, sourceHash, prior)
    ) {
      manifest.push(certifiedReuseEntry(file, fileBasename, sourceHash, prior));
      messages.push(`Reused certified artifacts for ${file} (sourceHash match)`);
      continue;
    }

    if (isResume && tools.texAvailable) {
      const certifiedAttempt = tryCertifiedResume({
        file,
        filePath,
        fileBasename,
        latexContent,
        sourceHash,
        outputDir,
        tools,
        compileCertified,
        convertFuzzy,
        requireCertified,
        messages,
      });
      if (certifiedAttempt.status === 'ok') {
        manifest.push(certifiedAttempt.entry);
        continue;
      }
      if (certifiedAttempt.status === 'error') {
        hasErrors = true;
        continue;
      }
    }

    const fuzzyAttempt = fuzzyOrPreserve({
      file,
      fileBasename,
      latexContent,
      sourceHash,
      outputDir,
      prior,
      convertFuzzy,
      messages,
    });
    if (fuzzyAttempt.status === 'error') {
      hasErrors = true;
      continue;
    }
    manifest.push(fuzzyAttempt.entry);
  }

  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  return { ok: !hasErrors, manifest, messages };
}

/**
 * CLI entry — processes all LaTeX files and generates HTML/PDF.
 */
export function main() {
  console.log('Starting LaTeX conversion (certified preferred, fuzzy fallback)...');
  const result = convertAll();
  for (const message of result.messages ?? []) {
    console.log(message);
  }
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  console.log(`Manifest written to: ${CONFIG.manifestFile}`);
  if (!result.ok) {
    console.error('Some files failed to convert. Fix errors before deployment.');
    process.exit(1);
  }
  console.log('All LaTeX files converted successfully!');
  process.exit(0);
}
