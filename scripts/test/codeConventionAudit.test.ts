import { describe, expect, test } from 'bun:test';
import {
  auditSourceFiles,
  formatConventionViolations,
  shouldFailConventionAudit,
} from '../codeConventionAudit';

describe('code convention audit', () => {
  test('reports each supported source convention violation', () => {
    const violations = auditSourceFiles([
      {
        path: 'src/features/example/Example.tsx',
        text: [
          'const value: any = null;',
          'const color = "bg-red-500";',
          'await fetch("/api");',
          ...Array.from({ length: 398 }, () => ''),
        ].join('\n'),
      },
    ]);

    expect(violations.map((violation) => violation.rule)).toEqual([
      'file-too-large',
      'explicit-any',
      'arbitrary-color',
      'direct-fetch-outside-service',
    ]);
    expect(formatConventionViolations(violations)).toContain(
      'src/features/example/Example.tsx:401 [file-too-large]',
    );
  });

  test('allows service fetches and compliant source files', () => {
    expect(
      auditSourceFiles([
        {
          path: 'src/services/api/client.ts',
          text: 'export const request = async () => await fetch("/api");',
        },
      ]),
    ).toEqual([]);
  });

  test('fails only in strict mode when violations exist', () => {
    const violations = auditSourceFiles([
      { path: 'src/example.ts', text: 'const value: any = null;' },
    ]);

    expect(shouldFailConventionAudit(violations, false)).toBe(false);
    expect(shouldFailConventionAudit(violations, true)).toBe(true);
    expect(shouldFailConventionAudit([], true)).toBe(false);
  });
});
