/**
 * LaTeX macro parsing functions
 * Handles parsing of custom resume macros with proper brace counting
 */

/**
 * Parses LaTeX macro arguments with proper brace counting
 * Handles nested braces correctly
 */
export function parseLatexMacro(content, macroName, argCount) {
  const matches = [];
  const regex = new RegExp(`\\\\${macroName}\\{`, 'g');
  let match;

  while ((match = regex.exec(content)) !== null) {
    const startPos = match.index;
    let pos = match.index + match[0].length - 1;
    const args = [];
    let currentArg = '';
    let braceCount = 1;
    let parsedArgs = 0;

    while (parsedArgs < argCount && pos < content.length) {
      pos++;
      const char = content[pos];

      if (char === '{') {
        braceCount++;
        currentArg += char;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          args.push(currentArg.trim());
          parsedArgs++;
          currentArg = '';
          // Look for next argument
          while (pos < content.length && content[pos] !== '{') {
            pos++;
          }
          if (pos < content.length) {
            braceCount = 1;
          }
        } else {
          currentArg += char;
        }
      } else {
        currentArg += char;
      }
    }

    if (args.length >= argCount) {
      const fullMatch = content.substring(startPos, pos + 1);
      matches.push([fullMatch, ...args]);
    }
  }

  return matches;
}

/**
 * Extracts all resume macro matches from LaTeX content
 */
export function extractMacroMatches(latexContent) {
  return {
    trio: parseLatexMacro(latexContent, 'resumeTrioHeading', 3),
    quadDetails: parseLatexMacro(latexContent, 'resumeQuadHeadingDetails', 3),
    quadHeading: parseLatexMacro(latexContent, 'resumeQuadHeading', 4),
    sectionType: Array.from(
      latexContent.matchAll(
        /\\resumeSectionType\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g
      )
    ),
  };
}
