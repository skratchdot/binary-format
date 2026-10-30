# Contributing

Use Node.js 24.11+ (or 22.18+) and the pnpm version pinned in `package.json`.
These development requirements come from tsdown; supported consumer runtimes
are described in the [README](README.md).

## Set up and check a change

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

`check` runs formatting, linting, types, release-policy tests, coverage, and
packed-package checks. It builds the package as part of the package checks.
None of these commands publishes a release.

| Command                 | Purpose                             |
| ----------------------- | ----------------------------------- |
| `pnpm test`             | Run source tests                    |
| `pnpm run watch`        | Watch source tests                  |
| `pnpm run tsc`          | Check TypeScript types              |
| `pnpm run format`       | Format with oxfmt                   |
| `pnpm run lint`         | Check code with oxlint              |
| `pnpm run build`        | Build with tsdown                   |
| `pnpm run test:package` | Build and verify the packed package |
| `pnpm run test:release` | Check release-policy behavior       |

Development uses TypeScript 7. Declaration generation uses Oxc because
TypeScript 7 no longer exposes the classic compiler API. CI builds on Node 24
and runs source and packed-package checks on Node 22 and 24.

## Documentation and examples

Keep the [README](README.md) focused on installation and first use. Put practical
walkthroughs in the [guide](docs/guide.md), exact contracts in the
[API reference](docs/api.md), and upgrade instructions in the
[migration guide](docs/migration.md). Link to the authoritative explanation
instead of repeating it. The [changelog](CHANGELOG.md) owns version history.

The [schema patterns](examples/schema-patterns.ts) are executable companions to
the docs. Keep examples consistent with their assertions of decoded values,
exact bytes, and errors. `pnpm test` runs them against source;
`pnpm run test:package` type-checks and executes them against the packed package
in ESM and CommonJS. The package checker substitutes the package import for the
local source import in a temporary copy. The Node assertion harness belongs to
the examples, not to browser applications.

For behavior changes, test expected wire bytes as well as round trips.
For documentation changes, check relative links and heading anchors, and verify
code examples against the public exports. Keep maintainer tooling details out
of user-facing examples.

## Releases

Use Conventional Commit squash messages so Release Please can propose release
notes and versions. See the [release procedure](docs/releasing.md) for review,
preview, account setup, and recovery. Publishing is a separate maintainer action.
