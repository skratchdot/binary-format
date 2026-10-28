import assert from 'node:assert/strict';
import { test } from 'node:test';
import { releasePlan } from './release-policy.mjs';

const plan = (overrides = {}) =>
  releasePlan({
    version: '1.0.0',
    ref: 'refs/tags/v1.0.0',
    publish: true,
    ...overrides,
  });

test('stable tags publish to latest', () => {
  assert.deepEqual(plan(), { version: '1.0.0', tag: 'v1.0.0', npmTag: 'latest' });
});
test('release candidates never use latest', () => {
  assert.equal(plan({ version: '1.1.0-rc.1', ref: 'refs/tags/v1.1.0-rc.1' }).npmTag, 'next');
});
test('branches are preview-only', () => {
  assert.equal(plan({ ref: 'refs/heads/main', publish: false }).tag, 'v1.0.0');
  assert.throws(() => plan({ ref: 'refs/heads/main' }), /requires refs\/tags/);
  assert.throws(() => plan({ ref: 'refs/heads/v1.0.0' }), /requires refs\/tags/);
});
test('tag mismatch is rejected even for dry runs', () => {
  for (const publish of [false, true]) {
    assert.throws(() => plan({ ref: 'refs/tags/v0.0.16', publish }), /requires refs\/tags/);
  }
});
test('invalid versions and non-boolean publishing flags are rejected', () => {
  for (const version of [
    '01.0.0',
    '1.0',
    '1.0.0-rc.01',
    '1.0.0+build',
    '1.0.0\n',
    '1.0.0\nref=bad',
  ]) {
    assert.throws(() => plan({ version }), /release version/);
  }
  assert.throws(() => plan({ publish: 'false' }), /boolean/);
});
