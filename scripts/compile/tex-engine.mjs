/**
 * Certified TeX-running convert adapter (make4ht + latexmk XeLaTeX PDF).
 * PDF is the certified artifact; web HTML comes from the resume framework.
 */

import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createDiagnostic,
  findBudgetViolations,
  serializeDiagnostics,
} from '../modules/latex/diagnostics.mjs';
import { assertHtmlLandmarks, assertPdfNonEmpty } from './fidelity.mjs';
import { compileWithMake4ht } from './make4ht.mjs';
import { detectTexTools } from './tex-tools.mjs';

/**
 * @param {{
 *   sourcePath: string,
 *   outputDir: string,
 *   basename?: string,
 *   tools?: ReturnType<typeof detectTexTools>,
 *   compileMake4ht?: typeof compileWithMake4ht,
 * }} options
 */
export function compileCertifiedResume(options) {
  const {
    sourcePath,
    outputDir,
    basename = 'resume',
    tools = detectTexTools(),
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

  if (!tools.make4ht) {
    const diagnostic = createDiagnostic({
      code: 'tex_unavailable',
      message: 'No TeX-running converter available (make4ht)',
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
    const paths = tools.paths ?? {};
    const result = compileMake4ht({
      workDir,
      sourcePath,
      make4htPath: paths.make4ht ?? undefined,
      latexmkPath: paths.latexmk ?? undefined,
    });
    const tool = 'make4ht';

    if (!result.success) {
      const diagnostic = createDiagnostic({
        code: 'tex_compile_failed',
        message: result.error ?? 'certified compile failed',
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
        log: result.log ?? '',
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
    // PDF is the certified publish artifact. Web HTML is written by convert
    // via the resume layout framework (fuzzy) so page layout stays usable.
    const pdfOut = join(outputDir, `${basename}.pdf`);
    copyFileSync(result.pdfPath, pdfOut);

    return {
      success: true,
      lane: 'certified',
      tool,
      htmlPath: null,
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
