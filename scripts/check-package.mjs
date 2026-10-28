/**
 * Checks the package consumers install, including exports, types, and tree shaking.
 *
 * @remarks
 * Source tests cannot catch missing declaration files, broken package entry points,
 * or unused code retained by a bundler. This script packs the existing build into
 * a temporary consumer project and checks those boundaries without publishing.
 * Run `pnpm run test:package` to build first, or `node scripts/check-package.mjs`
 * from the repository root to check an existing `dist/` (as CI does).
 * Temporary files are removed even when a check fails.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporary = mkdtempSync(join(tmpdir(), 'binary-format-package-'));
/** Runs a consumer command in isolation; a nonzero exit fails the check. */
const run = (command, args, cwd = temporary) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' });

try {
  const sourceMetadata = JSON.parse(readFileSync('package.json', 'utf8'));
  /** Verify shipped files and unpack the tarball as a consumer dependency. */
  const packed = JSON.parse(
    run('pnpm', ['pack', '--json', '--pack-destination', temporary], process.cwd())
  );
  assert(packed.files.some(({ path }) => path === 'dist/index.d.ts'));
  assert(packed.files.some(({ path }) => path === 'dist/index.d.cts'));
  assert(packed.files.some(({ path }) => path === 'LICENSE'));
  assert(!packed.files.some(({ path }) => /test\.|^src\//.test(path)));
  const packageDir = join(temporary, 'node_modules/@binary-format/binary-format');
  mkdirSync(packageDir, { recursive: true });
  run('tar', [
    '-xzf',
    resolve(temporary, packed.filename),
    '--strip-components=1',
    '-C',
    packageDir,
  ]);
  /** Exercise package-name resolution and a binary round trip in ESM and CommonJS. */
  const name = '@binary-format/binary-format';
  const assertion = `
    const schema = bf.object([['value', bf.uint16be()]]);
    assert.deepEqual(bf.decode(schema, Uint8Array.of(1, 2)), { value: 258 });
    assert.deepEqual(bf.encode(schema, { value: 258 }), Uint8Array.of(1, 2));
  `;
  run('node', [
    '--input-type=module',
    '-e',
    `import assert from 'node:assert/strict'; import * as bf from '${name}'; ${assertion}`,
  ]);
  run('node', [
    '-e',
    `const assert = require('node:assert/strict'); const bf = require('${name}'); ${assertion}`,
  ]);

  /** Check shipped declarations with the project compiler, without skipping declaration validation. */
  for (const extension of ['mts', 'cts']) {
    const file = join(temporary, `consumer.${extension}`);
    writeFileSync(file, readFileSync('scripts/fixtures/package-consumer.ts', 'utf8'));
    run('node', [
      resolve('node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--target',
      'ES2022',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      file,
    ]);
  }

  /**
   * Keep local examples pointed at source; only the isolated copy imports the package.
   * Assert the import exists so a future edit cannot silently bypass this check.
   */
  const exampleSource = readFileSync('examples/schema-patterns.ts', 'utf8');
  const sourceImport = "import * as bf from '../src/index';";
  assert.equal(exampleSource.split(sourceImport).length, 2, 'expected one source import');
  const consumerExample = exampleSource.replace(sourceImport, `import * as bf from '${name}';`);
  /** Type-check and execute the examples against both published entry points. */
  for (const extension of ['mts', 'cts']) {
    const file = join(temporary, `schema-patterns.${extension}`);
    writeFileSync(file, consumerExample + '\nrunSchemaExamples();\n');
    run('node', [
      resolve('node_modules/typescript/bin/tsc'),
      '--strict',
      '--types',
      'node',
      '--typeRoots',
      resolve('node_modules/@types'),
      '--target',
      'ES2022',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      file,
    ]);
    run('node', [join(temporary, `schema-patterns.${extension === 'mts' ? 'mjs' : 'cjs'}`)]);
  }

  /** Bundle the installed package for browsers, without Node.js built-in polyfills. */
  const bundle = async (contents) => {
    const result = await build({
      stdin: { contents, resolveDir: temporary },
      bundle: true,
      write: false,
      platform: 'browser',
      format: 'esm',
      target: 'es2022',
      minify: true,
    });
    return result.outputFiles[0].text;
  };
  /**
   * Compare a numeric-only consumer with all exports to catch tree-shaking regressions.
   * The size ratio avoids pinning exact bytes; symbol checks catch unused text and
   * numeric helpers. Executing the result also verifies that the bundle still works.
   */
  const full = await bundle(`export * from '${name}';`);
  const minimal = await bundle(
    `import { decode, uint8 } from '${name}'; export const value = decode(uint8(), Uint8Array.of(42));`
  );
  assert(minimal.length < full.length / 2, 'unused schemas should be removed');
  assert(!/TextDecoder|TextEncoder|getBigInt64|setFloat64/.test(minimal));
  const { value } = await import(
    `data:text/javascript;base64,${Buffer.from(minimal).toString('base64')}`
  );
  assert.equal(value, 42);
  /** Check packed metadata against the source manifest so future version bumps work unchanged. */
  const metadata = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
  assert.equal(metadata.sideEffects, false);
  assert.equal(metadata.name, sourceMetadata.name);
  assert.equal(metadata.version, sourceMetadata.version);
  assert.equal(metadata.license, sourceMetadata.license);
  assert.equal(readFileSync(join(packageDir, 'LICENSE'), 'utf8'), readFileSync('LICENSE', 'utf8'));
  console.log(
    `Packed ESM, CommonJS, and declarations passed. Browser bundle: ${minimal.length} bytes vs ${full.length} bytes for all exports.`
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
