# Release procedure

Maintainer documentation. For published changes, see the [changelog](../CHANGELOG.md).

[Release Please](https://github.com/googleapis/release-please) proposes a version
and changelog in a pull request. You review and
squash-merge that PR when ready. It then creates the matching GitHub release and
tag and starts the **Release** workflow. Publishing waits for approval in the
protected GitHub `npm` environment. No permanent npm token is needed.

For upstream setup and configuration details, see the
[GitHub Action documentation](https://github.com/googleapis/release-please-action)
and [manifest configuration guide](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md).

- [Release checklist](#release-checklist)
- [Review and control](#review-and-control)
- [Version and tag policy](#version-and-tag-policy)
- [Automation](#automation)
- [One-time account setup](#one-time-account-setup)
- [Preview and recovery](#preview-and-recovery)

## Release checklist

1. Review the release PR's compatibility impact, version, changelog, and CI.
   Link breaking changes to the migration guide where applicable.
2. Confirm the [account settings](#one-time-account-setup) before publishing for the first time or
   after changes to repository or npm publishing configuration.
3. Preview the release PR branch with **Actions → Release → Run workflow**, with
   publishing unchecked. Review the checks, summary, and tarball, including the
   packaged README.
4. Squash-merge the release PR. Release Please creates the matching tag and GitHub
   release, then starts the publishing workflow at that tag.
5. Review and approve the pending `npm` deployment. Confirm the npm version,
   dist-tag, and provenance link. A GitHub release may exist before npm publishing
   succeeds; the npm registry is the source of truth for availability.

## Review and control

Conventional Commit squash messages suggest the next version: `fix:` means patch,
`feat:` means minor, and `!` or a `BREAKING CHANGE:` footer means major. These are
proposals, not an obligation to publish. Review the actual compatibility impact,
version, changelog, and CI before merging the release PR. Do not enable auto-merge
on release PRs.

### Override the suggested version

Put a `Release-As` footer in a commit **body on main**, for example by including
it in a normal PR's squash commit message:

```text
chore: prepare next release

Release-As: 1.2.3
```

Release Please will refresh its proposal for that explicit version. Alternatively,
a maintainer can push an empty commit with the same message if repository rules
allow it. Changing only the release PR title or `package.json` is not a reliable
version override: the manifest, changelog, and release metadata must agree. Prefer
the supported footer and review the regenerated PR. Avoid a permanent `release-as`
configuration value, which would keep forcing that version on later releases.

### Correct release notes or commit classification

For an incorrectly classified, already squash-merged PR, append an override to
that original PR's description, then manually run **Release please** on `main`:

```text
BEGIN_COMMIT_OVERRIDE
fix: describe the actual user-visible correction
END_COMMIT_OVERRIDE
```

This changes Release Please's interpretation without rewriting Git history. It
can also correct a missing breaking-change marker. See the upstream documentation
for [version overrides](https://github.com/googleapis/release-please#how-do-i-change-the-version-number)
and [release-note corrections](https://github.com/googleapis/release-please#how-can-i-fix-release-notes).

You can edit `CHANGELOG.md` directly in the open release PR to improve its prose.
Do this after the final automated refresh, and review the diff again if additional
commits land on `main`: refreshing the PR can replace edits to its proposed entry.
The GitHub release notes are extracted from that version's changelog entry.
The generated changelog is excluded from formatting checks to avoid requiring
a separate formatting commit on every release PR. Previously published GitHub release notes and older changelog sections are not
normally regenerated. Historical entries use standard `## 0.0.N` headings so new
entries are prepended above them.

Before merging, check that the proposed version is unused on npm and is the
appropriate patch/minor/major bump from the previous published version. After
merging, inspect the release workflow's version, commit, npm dist-tag, and tarball
before approving the `npm` deployment. npm versions cannot be overwritten once
published. Correct a published package in a new version; release-note prose can
be edited separately.

## Version and tag policy

- `package.json` is the package version; `.release-please-manifest.json` tracks
  the last release managed by Release Please. The release PR updates both.
- New stable releases use `X.Y.Z`, Git tag `vX.Y.Z`, and npm dist-tag `latest`.
  Existing v0 tags without a `v` prefix are preserved.
- The publishing workflow also accepts `X.Y.Z-rc.N`, tag `vX.Y.Z-rc.N`, and npm
  dist-tag `next`. Automated prerelease scheduling is not configured; explicitly
  review any release-candidate version and notes before creating its tag.
- Release tags must be reachable from `main`. Do not move a release tag to retry
  different source code. Versions with build metadata or leading zeroes fail.
- Pre-v1 history was backfilled manually. `bootstrap-sha` records the historical
  starting point; the manifest advances with each managed release.

## Automation

[release-please.yml](../.github/workflows/release-please.yml) runs on pushes to
`main` and manual dispatch. It uses the short-lived repository `GITHUB_TOKEN` to
maintain release PRs and create releases. It explicitly dispatches CI on release
PR branches and **Release** on newly created tags: ordinary PR/tag events created
by that token do not trigger other workflows. No personal access token is needed.
It does not auto-merge PRs. Backfilling an old GitHub release does not dispatch a
publish run.

[release.yml](../.github/workflows/release.yml) supports both that automatic
handoff and manual dispatch. The manual `publish` checkbox defaults to false:

1. Validate the version/ref pairing. Branches are allowed only for previews;
   tag refs must match the package version even during a dry run.
2. Run CI at the selected commit: quality/build on Node 24, tests and packed
   ESM/CommonJS consumer checks on Node 22 and 24.
3. Pack the validated build with pnpm, preview it with `npm publish --dry-run`,
   and upload a `release-package` artifact with the tarball and `SHA256SUMS`.
   Artifacts expire after 14 days.
4. When publishing is requested on a matching tag, wait for the `npm` environment
   approval, verify the checksum, and publish that tarball with provenance. The
   publishing job does not check out source, install dependencies, rebuild, or
   run package lifecycle scripts.

Only the publishing job has `id-token: write`. The final registry operation uses
npm's OIDC client (at least 11.5.1, checked at runtime); pnpm handles installation,
builds, and packing. Actions are pinned to full commit SHAs, with Dependabot
configured to propose updates.

## One-time account setup

In **GitHub → Settings → Actions → General → Workflow permissions**, allow GitHub
Actions to create pull requests. The workflows declare their own job permissions.

Create **Settings → Environments → npm** before the first publish:

- Add yourself as a required reviewer. Leave **Prevent self-review** off for a
  solo-maintainer workflow, so you can approve releases you initiated.
- Restrict deployments to selected **tags** matching `v*`, with no branch rule.
- Disable administrator bypass if you want the review gate enforced for admins.

The YAML's `environment: npm` alone does not enable these protections. Protect
`main` and release tags against unwanted changes using repository rules, and
limit repository write/admin access to trusted maintainers. Anyone able to change
workflows or environment protections has release-relevant privileges.

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

npm verifies GitHub's short-lived workflow identity rather than using your npm
password or a stored publishing token. PR checks do not receive that identity.
Keep account 2FA enabled. After trusted publishing works, remove unused legacy
publishing tokens and consider npm's setting to disallow token publishing.

## Preview and recovery

For any review branch, manually dispatch **Release** with publishing unchecked.
This creates neither an npm version nor a GitHub release/tag. Locally, `pnpm run
check` covers source, types, packed consumers, examples, and release-policy tests.

If Release Please creates a tag but its publishing handoff fails, manually
rerun **Release** at the existing tag. With GitHub CLI:

```bash
# Preview without publishing.
gh workflow run release.yml --ref v1.0.0 -f publish=false
# Validate again and request publishing, still subject to environment approval.
gh workflow run release.yml --ref v1.0.0 -f publish=true
```

If a publish job fails, check npm before retrying: the registry may already have
accepted the version. Never move the tag or try to overwrite an accepted version.
Finish release bookkeeping or prepare a new patch as appropriate. If a manually
edited release PR needs fresh checks, dispatch **CI** on its branch.
