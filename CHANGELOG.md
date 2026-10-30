# Changelog

## [1.0.0](https://github.com/skratchdot/binary-format/compare/0.0.16...v1.0.0) (2026-10-28)


### ⚠ BREAKING CHANGES

* remove the v0 chaining API. Define formats with composable schemas, call decode(schema, bytes) and encode(schema, value), and use infer<typeof schema> for value types. Encoding returns Uint8Array. Node.js 22 or later is required.

### Features

* introduce composable binary schemas for v1 ([#1](https://github.com/skratchdot/binary-format/issues/1)) ([b947ecf](https://github.com/skratchdot/binary-format/commit/b947ecf9e079eceef84d09a2893af4131748e522))


### Bug Fixes

* enforce bit-field composition contracts ([#8](https://github.com/skratchdot/binary-format/issues/8)) ([978ac7a](https://github.com/skratchdot/binary-format/commit/978ac7a759561de4b4738625e9afc6a959871d05))
* handle unchanged release proposals ([#14](https://github.com/skratchdot/binary-format/issues/14)) ([9492f1d](https://github.com/skratchdot/binary-format/commit/9492f1da50ee16d120cf16f36799c7e673a7c831))
* preserve object fields and cover input boundaries ([#6](https://github.com/skratchdot/binary-format/issues/6)) ([d98e3bf](https://github.com/skratchdot/binary-format/commit/d98e3bff7344e39cbaa97ac9a9740481495c958b))


### Miscellaneous Chores

* automate reviewed releases ([#9](https://github.com/skratchdot/binary-format/issues/9)) ([3f7557d](https://github.com/skratchdot/binary-format/commit/3f7557d5b772388895b82647ac4e75474a1bc7f5))

### Documentation

* See the [migration guide](docs/migration.md) for v0-to-v1 examples and the [API reference](docs/api.md) for current contracts and limitations.

### Compatibility notes

* v1 is the first stable API. The package name remains `@binary-format/binary-format`; there is no compatibility wrapper for the removed default export.
* Custom schemas use explicit contexts and result counts instead of mutable reader/writer cursors. Encoding accepts readonly values and returns `Uint8Array`; decoding accepts bounded ArrayBuffer views, including DataView and Node Buffer.
* ESM and CommonJS builds include declarations and have no runtime dependencies. ESM supports tree shaking; schemas include both encoding and decoding methods.
* Development uses TypeScript 7, and emitted declarations are checked with the project compiler. Older TypeScript versions are outside the compatibility test matrix.
* Byte fields can share input storage. Fixed-length text pads or truncates bytes, potentially splitting UTF-8 characters. Callers supply count, length, tag, and checksum values.
* Bit-field composition enforces ordering and alignment. Whole-byte root choices and custom wrappers are supported; see the [bit-field guide](docs/bit-fields.md).
* Streaming, seek/pointer support, and separate encoder/decoder bundles are not included.

## [0.0.16](https://github.com/skratchdot/binary-format/compare/0.0.15...0.0.16) (2023-07-09)

### Miscellaneous Chores

* Vendor the bit-buffer and smart-buffer implementations, retain their license notices, and use explicit imports from the `buffer` package.
* Replace deprecated Buffer construction and update tests, linting, and TypeScript checks.
* Upgrade development dependencies.

## [0.0.15](https://github.com/skratchdot/binary-format/compare/0.0.14...0.0.15) (2023-02-05)

### Miscellaneous Chores

* Upgrade development dependencies.

## [0.0.14](https://github.com/skratchdot/binary-format/compare/0.0.13...0.0.14) (2022-09-05)

### Miscellaneous Chores

* Upgrade development dependencies.

## [0.0.13](https://github.com/skratchdot/binary-format/compare/0.0.12...0.0.13) (2022-02-22)

### Bug Fixes

* Rebuild the package to ship the buffer-input conversion introduced in the 0.0.12 source. The bundled version banner still reads 0.0.12.

## [0.0.12](https://github.com/skratchdot/binary-format/compare/0.0.11...0.0.12) (2022-02-22)

### Bug Fixes

* Add conversion of non-Buffer inputs with `Buffer.from()` in the tagged source. The published JavaScript still contains the previous behavior; the change ships in 0.0.13.

## [0.0.11](https://github.com/skratchdot/binary-format/compare/0.0.10...0.0.11) (2022-02-22)

### Bug Fixes

* Clarify the error message for invalid buffer inputs.

## [0.0.10](https://github.com/skratchdot/binary-format/compare/0.0.9...0.0.10) (2022-01-15)

### Miscellaneous Chores

* Upgrade development dependencies.

### Documentation

* Add byte-data to the related-library list.

## [0.0.9](https://github.com/skratchdot/binary-format/compare/0.0.8...0.0.9) (2021-10-17)

### Miscellaneous Chores

* Upgrade development dependencies.

### Documentation

* Add construct-js to the related-library list.

## [0.0.8](https://github.com/skratchdot/binary-format/compare/0.0.7...0.0.8) (2021-07-25)

### Features

* Add `plainArray()` for arrays of primitive values.

### Miscellaneous Chores

* Reorganize buffer validation.

## [0.0.7](https://github.com/skratchdot/binary-format/compare/0.0.6...0.0.7) (2021-07-24)

### Features

* Allow the choice key to be a callback function.

## [0.0.6](https://github.com/skratchdot/binary-format/compare/0.0.5...0.0.6) (2021-07-24)

### Features

* Allow `toArray()` counts to be numbers, `"eof"`, or callback functions.

### Bug Fixes

* Write fixed-length strings by encoded byte count, truncating or zero-padding to the requested length.

## [0.0.5](https://github.com/skratchdot/binary-format/compare/0.0.4...0.0.5) (2021-07-19)

### Bug Fixes

* Fix formats containing two nibbles (two four-bit fields).

## [0.0.4](https://github.com/skratchdot/binary-format/compare/0.0.3...0.0.4) (2021-07-18)

### Bug Fixes

* Correct the TypeScript entry point to `dist/src/index.d.ts`, matching the published declarations.

## [0.0.3](https://github.com/skratchdot/binary-format/compare/0.0.2...0.0.3) (2021-07-18)

### Bug Fixes

* Adjust the JavaScript and declaration entry-point paths again.

### Notes

* Historical packaging issue: the declared TypeScript entry point was still absent; JavaScript entry points were extensionless while the tarball contained `.js` files.

## [0.0.2](https://github.com/skratchdot/binary-format/compare/0.0.1...0.0.2) (2021-07-18)

### Bug Fixes

* Adjust the package entry-point configuration in an attempt to fix declaration discovery.

### Notes

* Historical packaging issue: the declared TypeScript entry point was still absent from the npm tarball.

## [0.0.1](https://github.com/skratchdot/binary-format/commit/e8e97b5b7d6472b68f4497b48821686cbd53c3e3) (2021-07-18)

### Features

* Initial release of the chaining API for reading and writing binary data.

### Notes

* Historical packaging issue: the declared TypeScript entry point was absent from the npm tarball.
