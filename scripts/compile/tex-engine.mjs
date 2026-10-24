/**
 * Certified TeX-running convert adapter (lwarp first, make4ht fallback).
 */

import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createDiagnostic,
  findBudgetViolations,
  serializeDiagnostics,
} from '../modules/latex/diagnostics.mjs';
import { assertHtmlLandmarks, assertPdfNonEmpty } from './fidelity.mjs';
import { compileWithLwarp } from './lwarp.mjs';
import { compileWithMake4ht } from './make4ht.mjs';
import { detectTexTools } from './tex-tools.mjs';

/**
 * @param {{
 *   sourcePath: string,
 *   outputDir: string,
 *   basename?: string,
 *   tools?: ReturnType<typeof detectTexTools>,
 *   compileLwarp?: typeof compileWithLwarp,
 *   compileMake4ht?: typeof compileWithMake4ht,
 * }} options
 */
export function compileCertifiedResume(options) {
  const {
    sourcePath,
    outputDir,
    basename = 'resume',
    tools = detectTexTools(),
    compileLwarp = compileWithLwarp,
    compileMake4ht = compileWithMake4ht,
  } = options;

  const latexContent = readFileSync(sourcePath, 'utf8');
  const budgetDiagnostics = findBudgetViolations(latexContent, { lane: 'certified' });
  if (budgetDiagnostics.length > 0) {
    return {
      success: false,
      lane: 'certified',
      tool: null,
      htmlPath: null,
      pdfPath: null,
      diagnostics: budgetDiagnostics,
      diagnosticsJson: serializeDiagnostics(budgetDiagnostics),
      error: budgetDiagnostics[0].message,
      log: '',
    };
  }

  if (!tools.texAvailable) {
    const diagnostic = createDiagnostic({
      code: 'tex_unavailable',
      message: 'No TeX-running converter available (lwarpmk/make4ht/latexmk+xelatex)',
      lane: 'certified',
    });
    return {
      success: false,
      lane: 'certified',
      tool: null,
      htmlPath: null,
      pdfPath: null,
      diagnostics: [diagnostic],
      diagnosticsJson: serializeDiagnostics([diagnostic]),
      error: diagnostic.message,
      log: '',
    };
  }

  const workDir = mkdtempSync(join(tmpdir(), 'resume-certified-'));
  try {
    let result = null;
    let tool = null;

    if (tools.lwarp) {
      result = compileLwarp({ workDir: join(workDir, 'lwarp'), sourcePath });
      tool = 'lwarp';
      if (!result.success && tools.make4ht) {
        result = compileMake4ht({ workDir: join(workDir, 'make4ht'), sourcePath });
        tool = 'make4ht';
      }
    } else if (tools.make4ht) {
      result = compileMake4ht({ workDir: join(workDir, 'make4ht'), sourcePath });
      tool = 'make4ht';
    } else {
      // PDF-only tools present without HTML converter — still not certified HTML.
      const diagnostic = createDiagnostic({
        code: 'html_converter_unavailable',
        message: 'xelatex/latexmk present but neither lwarpmk nor make4ht found',
        lane: 'certified',
      });
      return {
        success: false,
        lane: 'certified',
        tool: null,
        htmlPath: null,
        pdfPath: null,
        diagnostics: [diagnostic],
        diagnosticsJson: serializeDiagnostics([diagnostic]),
        error: diagnostic.message,
        log: '',
      };
    }

    if (!result?.success) {
      const diagnostic = createDiagnostic({
        code: 'tex_compile_failed',
        message: result?.error ?? 'certified compile failed',
        lane: 'certified',
      });
      return {
        success: false,
        lane: 'certified',
        tool,
        htmlPath: null,
        pdfPath: null,
        diagnostics: [diagnostic],
        diagnosticsJson: serializeDiagnostics([diagnostic]),
        error: diagnostic.message,
        log: result?.log ?? '',
      };
    }

    const html = readFileSync(result.htmlPath, 'utf8');
    const htmlCheck = assertHtmlLandmarks(html);
    if (!htmlCheck.ok) {
      const diagnostic = createDiagnostic({
        code: htmlCheck.reason,
        message: `Certified HTML failed fidelity check: ${htmlCheck.reason}`,
        lane: 'certified',
      });
      return {
        success: false,
        lane: 'certified',
        tool,
        htmlPath: null,
        pdfPath: null,
        diagnostics: [diagnostic],
        diagnosticsJson: serializeDiagnostics([diagnostic]),
        error: diagnostic.message,
        log: result.log,
      };
    }

    if (!result.pdfPath) {
      const diagnostic = createDiagnostic({
        code: 'pdf_missing',
        message: 'Certified convert produced HTML but no PDF',
        lane: 'certified',
      });
      return {
        success: false,
        lane: 'certified',
        tool,
        htmlPath: null,
        pdfPath: null,
        diagnostics: [diagnostic],
        diagnosticsJson: serializeDiagnostics([diagnostic]),
        error: diagnostic.message,
        log: result.log,
      };
    }

    const pdfBytes = readFileSync(result.pdfPath);
    const pdfCheck = assertPdfNonEmpty(pdfBytes);
    if (!pdfCheck.ok) {
      const diagnostic = createDiagnostic({
        code: pdfCheck.reason,
        message: `Certified PDF failed fidelity check: ${pdfCheck.reason}`,
        lane: 'certified',
      });
      return {
        success: false,
        lane: 'certified',
        tool,
        htmlPath: null,
        pdfPath: null,
        diagnostics: [diagnostic],
        diagnosticsJson: serializeDiagnostics([diagnostic]),
        error: diagnostic.message,
        log: result.log,
      };
    }

    mkdirSync(outputDir, { recursive: true });
    const htmlOut = join(outputDir, `${basename}.html`);
    const pdfOut = join(outputDir, `${basename}.pdf`);
    writeFileSync(htmlOut, html);
    copyFileSync(result.pdfPath, pdfOut);

    return {
      success: true,
      lane: 'certified',
      tool,
      htmlPath: htmlOut,
      pdfPath: pdfOut,
      diagnostics: [],
      diagnosticsJson: serializeDiagnostics([]),
      error: null,
      log: result.log,
    };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}
