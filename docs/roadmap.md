# Development roadmap

The composable v1 implementation is merged. These are proposed follow-ups, in
priority order; they are not promises of features or a release schedule.

## Delivery plan

Plan for five focused PRs covering the four goals below. Add a separate fix PR
only if the new tests expose a substantial behavioral issue.

| PR  | Scope                                                                  | Roadmap goal  |
| --- | ---------------------------------------------------------------------- | ------------- |
| 1   | Numeric wire-value tests and packed-consumer type-inference tests      | 1, first part |
| 2   | Input boundaries, arrays, callbacks, object keys, and nested contexts  | 1, remainder  |
| 3   | API reference, migration guide, and executable documentation examples  | 2             |
| 4   | Define bit-field composition contracts and enforce unsupported cases   | 3             |
| 5   | Release notes, version/tag policy, and publishing-workflow preparation | 4             |

Reuse the existing Node 22/24 CI jobs and package-consumer fixture. Keep tests and
documentation examples table-driven where that removes repetition. Build each
PR on merged work to avoid maintaining a stack of overlapping changes.

PR 4 should define and test the supported contract before adding composition
features. PR 5 prepares a release; running a publish workflow and migrating
downstream consumers still require separate requests.

## 1. Expand behavioral and type coverage

- Turn the numeric smoke checks into permanent table-driven tests: signed and
  unsigned bounds, both byte orders, bigint, floats, and offset buffer views.
- Add type-level regression cases for nested objects, choice unions,
  `omitUndefined`, readonly values, and custom schemas.
- Exercise truncation, empty input, EOF arrays, and callback-based lengths;
  include zero-progress custom schemas and malformed input.
- Test unusual object field names and nested context propagation.

Acceptance: tests run in the existing Node 22/24 CI matrix, verify expected bytes
as well as round trips, and catch invalid values and types. Keep any behavioral
changes in focused PRs with regression cases.

## 2. Document the public API

- Add a schema reference under `docs/`, linked from the README.
- Explain decode/encode contexts, root versus sibling fields, lengths, and errors.
- Document byte-view aliasing, text padding/truncation, and custom schema contracts.
- Expand the v0 migration guide with before/after examples.
- Keep the README's See also list; add comparisons only when backed by examples
  or measurements.

Acceptance: examples type-check and run against the public package exports;
document current limitations alongside supported composition patterns.

## 3. Decide bit-field composition semantics

The current API supports direct object bit fields that finish on byte boundaries.
Bit schemas in arrays are unsupported, and fields within a byte must use the same
bit ordering.

The [bit-field composition contract](bit-fields.md) defines the supported layouts
and rejection behavior, backed by round-trip and known-byte tests. Containers
require byte-only results; root choices and custom wrappers also accept
whole-byte bit results.
Sharing partial bytes across these boundaries remains a future API decision.

## 4. Prepare a release when requested

- Write release notes covering the breaking API and Node 22+ requirement.
- Choose a version/tag policy and publishing workflow, including npm provenance.
- Validate the tarball in a separate consumer project and run all package checks.
- Update the README's unpublished status only after a successful release.

Publishing and switching downstream consumers to the public npm package remain
separate tasks. Streaming, seek/pointer support, benchmarks, and separate
encode/decode bundles should follow concrete consumer needs.
