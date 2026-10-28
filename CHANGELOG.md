# Changelog

Entries for 0.0.1–0.0.16 were reconstructed from Git history and audited npm
artifacts. Dates are the original npm publication dates (UTC). See the
[historical release audit](docs/release-history.md) for evidence and limitations.

## 0.0.16 (2023-07-09)

- Vendor the bit-buffer and smart-buffer implementations, retain their license notices, and use explicit imports from the `buffer` package.
- Replace deprecated Buffer construction and update tests, linting, and TypeScript checks.
- Upgrade development dependencies.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.15...0.0.16) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.16)

## 0.0.15 (2023-02-05)

- Upgrade development dependencies.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.14...0.0.15) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.15)

## 0.0.14 (2022-09-05)

- Upgrade development dependencies.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.13...0.0.14) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.14)

## 0.0.13 (2022-02-22)

- Rebuild the package to ship the buffer-input conversion introduced in the 0.0.12 source. The bundled version banner still reads 0.0.12.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.12...0.0.13) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.13)

## 0.0.12 (2022-02-22)

- Add conversion of non-Buffer inputs with `Buffer.from()` in the tagged source. The published JavaScript still contains the previous behavior; the change ships in 0.0.13.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.11...0.0.12) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.12)

## 0.0.11 (2022-02-22)

- Clarify the error message for invalid buffer inputs.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.10...0.0.11) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.11)

## 0.0.10 (2022-01-15)

- Upgrade development dependencies.
- Add byte-data to the related-library list.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.9...0.0.10) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.10)

## 0.0.9 (2021-10-17)

- Upgrade development dependencies.
- Add construct-js to the related-library list.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.8...0.0.9) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.9)

## 0.0.8 (2021-07-25)

- Add `plainArray()` for arrays of primitive values.
- Reorganize buffer validation.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.7...0.0.8) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.8)

## 0.0.7 (2021-07-24)

- Allow the choice key to be a callback function.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.6...0.0.7) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.7)

## 0.0.6 (2021-07-24)

- Allow `toArray()` counts to be numbers, `"eof"`, or callback functions.
- Write fixed-length strings by encoded byte count, truncating or zero-padding to the requested length.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.5...0.0.6) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.6)

## 0.0.5 (2021-07-19)

- Fix formats containing two nibbles (two four-bit fields).

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.4...0.0.5) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.5)

## 0.0.4 (2021-07-18)

- Correct the TypeScript entry point to `dist/src/index.d.ts`, matching the published declarations.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.3...0.0.4) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.4)

## 0.0.3 (2021-07-18)

- Adjust the JavaScript and declaration entry-point paths again.
- Historical packaging issue: the declared TypeScript entry point was still absent; JavaScript entry points were extensionless while the tarball contained `.js` files.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.2...0.0.3) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.3)

## 0.0.2 (2021-07-18)

- Adjust the package entry-point configuration in an attempt to fix declaration discovery.
- Historical packaging issue: the declared TypeScript entry point was still absent from the npm tarball.

[Changes](https://github.com/skratchdot/binary-format/compare/0.0.1...0.0.2) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.2)

## 0.0.1 (2021-07-18)

- Initial release of the chaining API for reading and writing binary data.
- Historical packaging issue: the declared TypeScript entry point was absent from the npm tarball.

[Changes](https://github.com/skratchdot/binary-format/commit/e8e97b5b7d6472b68f4497b48821686cbd53c3e3) · [Tag](https://github.com/skratchdot/binary-format/tree/0.0.1)
