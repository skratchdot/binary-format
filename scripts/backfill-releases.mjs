import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

/**
 * Audit the original v0 npm artifacts against their existing Git tags, then
 * optionally create missing GitHub releases from the curated changelog.
 *
 * The default is read-only. Pass --write only to create GitHub releases; existing
 * release notes are preserved. This never publishes to npm, creates/moves tags,
 * installs old dependencies, or runs code from historical packages. Run from the
 * repository root with all tags fetched. GitHub writes require GH_TOKEN.
 */
const args = process.argv.slice(2);
assert(
  args.length === 0 || (args.length === 1 && args[0] === '--write'),
  'Usage: node scripts/backfill-releases.mjs [--write]'
);
const write = args.length === 1;
const repository = 'skratchdot/binary-format';
const packageName = '@binary-format/binary-format';
const history = JSON.parse(readFileSync('docs/release-history.json', 'utf8'));
const changelog = readFileSync('CHANGELOG.md', 'utf8');
assert.deepEqual(
  history.map(({ version }) => version),
  Array.from({ length: 16 }, (_, i) => `0.0.${i + 1}`)
);

async function get(url) {
  const response = await fetch(url);
  assert(response.ok, `Read failed (${response.status}): ${url}`);
  return response;
}

const registry = await (
  await get('https://registry.npmjs.org/@binary-format%2fbinary-format')
).json();
const releases = [];
// Validate every artifact before creating any releases, so audit failures cannot
// leave a partially backfilled history. A later API failure is safe to retry.
for (const record of history) {
  const { version, publishedAt, gitHead, integrity } = record;
  const tagCommit = execFileSync('git', ['rev-parse', `${version}^{commit}`], {
    encoding: 'utf8',
  }).trim();
  assert.equal(tagCommit, gitHead, `${version}: tag moved`);
  const metadata = registry.versions[version];
  assert.equal(metadata.gitHead, gitHead, `${version}: npm gitHead mismatch`);
  assert.equal(registry.time[version], publishedAt);
  assert.equal(metadata.dist.integrity, integrity);
  const tarballUrl = new URL(metadata.dist.tarball);
  assert.equal(tarballUrl.origin, 'https://registry.npmjs.org');
  const tarball = Buffer.from(await (await get(tarballUrl)).arrayBuffer());
  const [algorithm, digest] = integrity.split('-');
  assert.equal(createHash(algorithm).update(tarball).digest('base64'), digest);
  assert.equal(createHash('sha1').update(tarball).digest('hex'), metadata.dist.shasum);
  const archived = (path) =>
    execFileSync('tar', ['-xzOf', '-', `package/${path}`], { input: tarball });
  const tagged = (path) => execFileSync('git', ['show', `${version}:${path}`]);
  const manifest = JSON.parse(archived('package.json'));
  assert.equal(manifest.name, packageName);
  assert.equal(manifest.version, version);
  assert.deepEqual(manifest, JSON.parse(tagged('package.json')));
  for (const path of ['README.md', 'LICENSE']) {
    assert.deepEqual(archived(path), tagged(path), `${version}: ${path} differs`);
  }
  const heading = `## ${version} (${publishedAt.slice(0, 10)})\n`;
  assert.equal(changelog.split(heading).length, 2, `${version}: missing/duplicate notes`);
  const notes = changelog.split(heading)[1].split('\n## ')[0].trim();
  assert(notes.length > 0);
  releases.push({
    tag_name: version,
    name: version,
    body: `Originally published to npm on ${publishedAt}.\n\n${notes}\n\nThese notes were reconstructed from Git history. See the [audit](https://github.com/${repository}/blob/main/docs/release-history.md); this is not a new npm publication.`,
    draft: false,
    prerelease: false,
    make_latest: 'false',
  });
  console.log(`${version}: tag, integrity, package metadata, README, and license verified`);
}

if (write) {
  assert(process.env.GH_TOKEN, 'GH_TOKEN is required for --write');
  const api = async (path, body) => {
    const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!body && response.status === 404) return undefined;
    assert(response.ok, `GitHub ${body ? 'write' : 'read'} failed: ${response.status}`);
    return response.json();
  };
  for (const release of releases) {
    // Refuse tag creation if a remote tag was removed or moved after checkout.
    const ref = await api(`/git/ref/tags/${release.tag_name}`);
    assert(ref, `${release.tag_name}: remote tag missing`);
    let object = ref.object;
    while (object.type === 'tag') {
      object = (await api(`/git/tags/${object.sha}`)).object;
    }
    assert.equal(object.type, 'commit');
    assert.equal(object.sha, history.find(({ version }) => version === release.tag_name).gitHead);
    const existing = await api(`/releases/tags/${release.tag_name}`);
    if (existing) {
      console.log(`${release.tag_name}: existing release preserved`);
      continue;
    }
    const created = await api('/releases', release);
    console.log(`Created ${created.html_url}`);
  }
} else {
  console.log('Audit passed. No releases created. Use --write to backfill GitHub releases.');
}
