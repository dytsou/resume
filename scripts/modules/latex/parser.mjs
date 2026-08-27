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

    for (let parsedArgs = 0; parsedArgs < argCount; parsedArgs++) {
      const argument = readBraceArgument(content, pos);
      if (!argument) {
        break;
      }

      args.push(argument.value);
      pos = argument.end;

      if (parsedArgs < argCount - 1) {
        pos = findNextArgumentStart(content, pos);
        if (pos === -1) {
          break;
        }
      }
    }

    if (args.length >= argCount) {
      const fullMatch = content.substring(startPos, pos + 1);
      matches.push([fullMatch, ...args]);
    }
  }

  return matches;
}

function readBraceArgument(content, openingBrace) {
  let braceCount = 1;
  let currentArg = '';

  for (let pos = openingBrace + 1; pos < content.length; pos++) {
    const char = content[pos];

    if (char === '{') {
      braceCount++;
      currentArg += char;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        return { value: currentArg.trim(), end: pos };
      }
      currentArg += char;
    } else {
      currentArg += char;
    }
  }

  return null;
}

function findNextArgumentStart(content, closingBrace) {
  for (let pos = closingBrace + 1; pos < content.length; pos++) {
    const char = content[pos];

    if (isWhitespace(char)) {
      continue;
    }

    if (char === '%') {
      while (pos < content.length && !isLineBreak(content[pos])) {
        pos++;
      }
      continue;
    }

    if (char === '{') {
      return pos;
    }

    if (/[a-zA-Z\\]/.test(char)) {
      return -1;
    }
  }

  return -1;
}

function isWhitespace(char) {
  return char === ' ' || char === '\t' || char === '\n' || char === '\r';
}

function isLineBreak(char) {
  return char === '\n' || char === '\r';
}

/**
 * Extracts all resume macro matches from LaTeX content
 */
export function extractMacroMatches(latexContent) {
  return {
    trio: parseLatexMacro(latexContent, 'resumeTrioHeading', 3),
    trioTitle: parseLatexMacro(latexContent, 'resumeTrioHeadingTitle', 4),
    quadDetails: parseLatexMacro(latexContent, 'resumeQuadHeadingDetails', 3),
    quadHeading: parseLatexMacro(latexContent, 'resumeQuadHeading', 4),
    sectionType: Array.from(
      latexContent.matchAll(
        /\\resumeSectionType\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g
      )
    ),
  };
}
