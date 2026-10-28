# Releases

Release preparation is implemented; v1 has not been published. Merging code,
pushing tags, or creating GitHub releases does not publish to npm. Only an
explicit manual **Release** workflow run with `publish: true` can do that.

## Version and tag policy

- Use SemVer: patch for compatible fixes, minor for compatible additions, and
  major for breaking API or supported-runtime changes.
- `package.json` is the version source. The matching Git tag is `vX.Y.Z`.
  Stable releases publish to npm's `latest` dist-tag.
- Optional release candidates use `X.Y.Z-rc.N`, Git tag `vX.Y.Z-rc.N`, and npm
  dist-tag `next`. The workflow deliberately accepts only stable and `rc.N`
  versions, without build metadata or leading zeroes.
- Merge the version and changelog changes to `main` before tagging. Tagged
  commits must be reachable from `main`. Tags and published versions are
  immutable: fix a published problem in a new version.
- Use succinct lowercase Conventional Commit PR titles with structured bodies
  for squash merges. Version bumps remain explicit; commit labels do not
  automatically calculate or publish a version.

## Workflow behavior

[release.yml](../.github/workflows/release.yml) runs only through
`workflow_dispatch`. Its `publish` checkbox defaults to false.

1. Validate the version/ref pairing. Branch refs are allowed only for previews;
   tag refs must match the package version, including during a dry run.
2. Run the existing CI workflow at the selected commit: quality/build on Node 24,
   plus tests and packed-consumer checks on Node 22 and 24.
3. Download that validated build, pack it with pnpm, preview the tarball with
   `npm publish --dry-run`, and upload a `release-package` artifact containing
   the tarball and `SHA256SUMS`. Artifacts expire after 14 days.
4. Only when explicitly requested on a matching tag, enter the `npm` environment,
   verify the checksum, and publish that tarball with provenance. The publishing
   job does not rebuild or run package lifecycle scripts.

pnpm remains the package manager for installation, builds, and packing. The
final registry operation uses npm's supported OIDC client. Node 24 supplies npm;
the workflow checks that it is at least 11.5.1. Only the publish job receives
`id-token: write`; repository permissions otherwise remain read-only.

## One-time setup before publishing

Configure the existing npm package's trusted publisher using
[npm's instructions](https://docs.npmjs.com/trusted-publishers/):

| Setting           | Value                |
| ----------------- | -------------------- |
| Provider          | GitHub Actions       |
| Organization/user | `skratchdot`         |
| Repository        | `binary-format`      |
| Workflow filename | `release.yml`        |
| Environment       | `npm`                |
| Allowed action    | Direct `npm publish` |

Create the matching GitHub `npm` environment. Configure its release-tag
restrictions and any desired reviewer protection before publishing. The workflow
uses GitHub-hosted runners and OIDC rather than a stored npm publishing token.
Trusted publishing supplies provenance for this public repository/package; the
command also requests it explicitly. Keep the configured workflow and environment
names in sync if either is renamed.

This PR does not configure npm settings or GitHub environment protection. Those
settings must be checked by a package maintainer before the first real publish.

## Preview without publishing

After the workflow is merged to the default branch, open **Actions → Release →
Run workflow**, select `main` (or a review branch containing this workflow), and
leave **Publish to npm** unchecked. Inspect the checks, run summary, and artifact.
This creates neither an npm version nor a GitHub release or tag.

Locally, `pnpm run check` performs all source and packed-package checks. The
package checker unpacks into a separate temporary consumer, tests imports and
emitted declarations, and exercises the documented examples. The release-policy
checks also run via `pnpm run test:release` and in CI.

## Publish when explicitly requested

1. Review the version, changelog, and green checks on the release commit. Confirm
   the npm version is unused and the trusted-publisher/environment setup matches.
2. Create and push an annotated matching tag at that exact merged commit, for
   example `v1.0.0`. Do not move a release tag to retry different source code.
3. Dispatch **Release** at the tag with publishing unchecked first. Review the
   tarball contents and validation. A real publish run will validate and pack
   again at the same immutable tag, then publish its own validated artifact.
4. Dispatch **Release** at the same tag with **Publish to npm** checked. Using
   GitHub CLI, the explicit command is:

   ```bash
   gh workflow run release.yml --ref v1.0.0 -f publish=true
   ```

5. Confirm the npm version, `latest` or `next` dist-tag, and provenance link.
   Create the GitHub release at the existing tag using the changelog notes.
6. After successful publication, update the README, API/migration docs, and
   changelog to remove unpublished wording and record the release date. The
   package README changes reach npm with the next publication.

If a publish run fails, check whether npm already accepted the version before
retrying. Never assume a failed job means nothing was published. A version
already accepted by npm must not be overwritten; finish any remaining release
bookkeeping or prepare a new patch version as appropriate.

No publish, tag creation, environment configuration, or downstream consumer
migration is part of release preparation itself.
