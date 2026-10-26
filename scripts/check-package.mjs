import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporary = mkdtempSync(join(tmpdir(), 'binary-format-package-'));
const run = (command, args, cwd = temporary) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' });

try {
  const [packed] = JSON.parse(
    run(
      'npm',
      ['pack', '--json', '--pack-destination', temporary],
      process.cwd()
    )
  );
  assert(packed.files.some(({ path }) => path === 'dist/index.d.ts'));
  assert(packed.files.some(({ path }) => path === 'dist/index.d.cts'));
  assert(!packed.files.some(({ path }) => /test\.|^src\//.test(path)));
  const packageDir = join(
    temporary,
    'node_modules/@binary-format/binary-format'
  );
  mkdirSync(packageDir, { recursive: true });
  run('tar', [
    '-xzf',
    join(temporary, packed.filename),
    '--strip-components=1',
    '-C',
    packageDir,
  ]);
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

  for (const extension of ['mts', 'cts']) {
    const file = join(temporary, `consumer.${extension}`);
    writeFileSync(
      file,
      `import * as bf from '${name}';
const schema = bf.object([['value', bf.uint8()]]);
type Value = bf.infer<typeof schema>;
const value: Value = { value: 42 };
bf.encode(schema, value);
// @ts-expect-error inferred field must be a number
const invalid: Value = { value: 'wrong' };
`
    );
    run('node', [
      resolve('node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      '--target',
      'ES2022',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      file,
    ]);
  }

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
  const metadata = JSON.parse(
    readFileSync(join(packageDir, 'package.json'), 'utf8')
  );
  assert.equal(metadata.sideEffects, false);
  assert.equal(metadata.version, '1.0.0');
  console.log(
    `Packed ESM, CommonJS, and declarations passed. Browser bundle: ${minimal.length} bytes vs ${full.length} bytes for all exports.`
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
