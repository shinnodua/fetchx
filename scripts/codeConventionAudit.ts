export const MAX_SOURCE_FILE_LINES = 400;

export type ConventionRuleId =
  | 'file-too-large'
  | 'explicit-any'
  | 'arbitrary-color'
  | 'direct-fetch-outside-service';

export interface SourceFile {
  path: string;
  text: string;
}

export interface ConventionViolation {
  line: number;
  message: string;
  path: string;
  rule: ConventionRuleId;
}

const EXPLICIT_ANY_PATTERN = /(?:\b(?:as|type)\s+any\b|:\s*any\b|<any>)/;
const ARBITRARY_COLOR_PATTERN =
  /\b(?:bg|border|text|ring|from|to|via)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/;
const FETCH_CALL_PATTERN = /\bawait\s+fetch\s*\(/;

export function auditSourceFiles(
  sourceFiles: SourceFile[],
): ConventionViolation[] {
  return sourceFiles.flatMap((sourceFile) => auditSourceFile(sourceFile));
}

export function formatConventionViolations(
  violations: ConventionViolation[],
): string {
  if (violations.length === 0) {
    return 'Code convention audit passed: no tracked violations found.';
  }

  return [
    `Code convention audit found ${violations.length} violation${violations.length === 1 ? '' : 's'}:`,
    ...violations.map(
      (violation) =>
        `- ${violation.path}:${violation.line} [${violation.rule}] ${violation.message}`,
    ),
  ].join('\n');
}

export function shouldFailConventionAudit(
  violations: ConventionViolation[],
  strict: boolean,
): boolean {
  return strict && violations.length > 0;
}

function auditSourceFile(sourceFile: SourceFile): ConventionViolation[] {
  const lines = sourceFile.text.split('\n');
  const violations: ConventionViolation[] = [];

  if (lines.length > MAX_SOURCE_FILE_LINES) {
    violations.push({
      line: MAX_SOURCE_FILE_LINES + 1,
      message: `Source files must not exceed ${MAX_SOURCE_FILE_LINES} lines (found ${lines.length}).`,
      path: sourceFile.path,
      rule: 'file-too-large',
    });
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (EXPLICIT_ANY_PATTERN.test(line)) {
      violations.push({
        line: lineNumber,
        message:
          'Explicit any types are forbidden; use a precise type or unknown.',
        path: sourceFile.path,
        rule: 'explicit-any',
      });
    }
    if (ARBITRARY_COLOR_PATTERN.test(line)) {
      violations.push({
        line: lineNumber,
        message: 'Use a design-system token instead of a raw Tailwind color.',
        path: sourceFile.path,
        rule: 'arbitrary-color',
      });
    }
  });

  if (
    !sourceFile.path.startsWith('src/services/') &&
    FETCH_CALL_PATTERN.test(sourceFile.text)
  ) {
    violations.push({
      line: findLineNumber(sourceFile.text, FETCH_CALL_PATTERN),
      message: 'Move fetch-based side effects into a service module.',
      path: sourceFile.path,
      rule: 'direct-fetch-outside-service',
    });
  }

  return violations;
}

function findLineNumber(text: string, pattern: RegExp): number {
  const match = pattern.exec(text);
  return match ? text.slice(0, match.index).split('\n').length : 1;
}
