/**
 * Backward-compatible entry point for LaTeX conversion.
 *
 * The implementation lives under commands/modules so each script concern
 * can be maintained independently without changing existing commands.
 */

import { main } from './commands/convert-latex.mjs';

main();
