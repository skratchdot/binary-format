# Historical release audit

The 16 npm versions `0.0.1`–`0.0.16` were audited on 2026-10-28 before releasing
v1. Their original tag names have no `v` prefix and remain unchanged. The
[changelog](../CHANGELOG.md) reconstructs release notes from the corresponding
commit ranges; it does not rely on Conventional Commit formatting.

## Verified evidence

For every version:

- npm's `gitHead` equals the existing Git tag's commit.
- Downloaded tarball bytes match npm's SHA-512 integrity and SHA-1 shasum.
- The tarball's complete `package.json` equals the tagged source manifest.
- Published README and LICENSE bytes equal the tagged files.
- Original npm publication timestamps are recorded in the
  [audit manifest](release-history.json), together with commit IDs and integrity.

The packages contain generated JavaScript and declarations rather than the full
TypeScript source. This audit does **not** establish byte-for-byte reproducible
builds, prove the historical build environment, or add retroactive npm provenance.
Old dependencies and lifecycle scripts were not installed or executed.

## Packaging findings

Versions `0.0.1`, `0.0.2`, and `0.0.3` point `types` at a declaration file absent
from their tarballs. Version `0.0.4` corrects it to `dist/src/index.d.ts`.
Version `0.0.2` contains extensionless JavaScript files; `0.0.3` declares
extensionless JavaScript entry points but contains `.js` files. CommonJS can
resolve a missing `.js` extension; exact-file inspection alone is not a runtime
compatibility test. Versions `0.0.4`–`0.0.16` contain all declared entry-point files.
The `0.0.12` tagged source adds buffer-input conversion, but the npm JavaScript
still contains the previous validation implementation. The conversion appears in
the `0.0.13` tarball. Version banners are also stale in `0.0.12` (says `0.0.11`),
`0.0.13` (says `0.0.12`), and `0.0.16` (says `0.0.15`). A stale banner alone does
not prove the implementation is stale; the `0.0.12` behavior mismatch was checked
in the bundle itself. Package manifest versions are correct for all 16 releases.

These findings are retained as historical facts, without modifying old packages.

## Reproduce or backfill

From the repository root, with Node 24 and `git`/`tar` installed:

```bash
git fetch origin --tags
node scripts/backfill-releases.mjs
```

The default command is read-only. It validates all 16 releases before any optional
writes. The manifest and changelog are checked in for review.

After merging, run **Actions → Backfill historical releases** on `main`, first
with the creation checkbox unchecked. Then enable **Create missing v0 GitHub
releases** to perform the backfill. The workflow uses GitHub's short-lived
repository token; no npm credentials, dependency install, or npm publishing step
is involved. The connected editing tools cannot dispatch this workflow, so a
maintainer must start it from GitHub or an authenticated GitHub CLI:

```bash
gh workflow run backfill-releases.yml --ref main -f write=false
gh workflow run backfill-releases.yml --ref main -f write=true
```

Existing releases and their notes are preserved on retries. The script checks
remote tags before creation and never deliberately creates or moves a tag. Newly
created historical releases are explicitly **not** marked latest. GitHub records
the backfill's creation/publication time; the original npm publication timestamp
is included in each release's notes. Creating these records does not trigger the
v1 publishing workflow.
