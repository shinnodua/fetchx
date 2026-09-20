import { relative, resolve } from 'node:path';
import {
  auditSourceFiles,
  formatConventionViolations,
  type SourceFile,
  shouldFailConventionAudit,
} from './codeConventionAudit';

const rootDirectory = resolve(import.meta.dir, '..');
const sourceFiles = await getSourceFiles(rootDirectory);
const violations = auditSourceFiles(sourceFiles);
const isStrict = process.argv.includes('--strict');

console.log(formatConventionViolations(violations));
if (shouldFailConventionAudit(violations, isStrict)) process.exitCode = 1;

async function getSourceFiles(root: string): Promise<SourceFile[]> {
  const glob = new Bun.Glob('src/**/*.{ts,tsx}');
  const sourceFiles: SourceFile[] = [];

  for await (const path of glob.scan({ cwd: root, onlyFiles: true })) {
    if (path.includes('/test/') || path.endsWith('.gen.ts')) continue;
    sourceFiles.push({
      path,
      text: await Bun.file(resolve(root, path)).text(),
    });
  }

  return sourceFiles.sort((first, second) =>
    relative(root, first.path).localeCompare(relative(root, second.path)),
  );
}
