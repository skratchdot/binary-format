# v1 release notes (draft)

This is the first stable API, replacing the v0 chaining API. The package remains
`@binary-format/binary-format`. See the [migration guide](migration.md).

### Breaking changes

- Replace the default `BinaryFormat` constructor, chained fields, and `.done()`
  with composable schema factories and ordered `object` field tuples.
- Replace formatter `.read()` and `.write()` with `decode(schema, input)` and
  `encode(schema, value)`. Infer value types with `infer<typeof schema>`.
- Encoding returns `Uint8Array`. Decoding accepts ArrayBuffer and bounded views,
  including DataView and Node Buffer, without a runtime Buffer dependency.
- Custom schemas use explicit contexts and result counts rather than mutable
  reader/writer cursors. See the [API reference](api.md#custom-schemas).
- Node.js 22 or later is required. Development uses TypeScript 7; emitted
  declarations are checked with the project compiler. Older TypeScript versions
  are not part of the compatibility test matrix.

### Features and behavior

- Composable numeric, bigint, float, byte, UTF-8, Latin-1, object, array, choice,
  constant, reserved-byte, and bit-field schemas.
- ESM and CommonJS entry points with declarations, no runtime dependencies, and
  ESM tree shaking. Schemas include both encode and decode methods.
- Readonly encode inputs, optional omission of undefined object fields,
  sibling/root callback contexts, and structured nested errors.
- Bounds checks respect input views; malformed hexadecimal input and incomplete
  root bytes are rejected. Object keys such as `__proto__` are own data fields.
- Bit-field ordering and alignment checks reject unsafe shared-byte layouts.
  Whole-byte root choices and custom wrappers remain supported. See the
  [composition contract](bit-fields.md) for supported container layouts.

### Migration notes

Byte fields can share storage with their input. Fixed-length text pads or
truncates bytes, including potentially splitting a UTF-8 character. Count,
length, tag, and checksum fields are supplied by the caller. Streaming,
seek/pointer support, and separate encoder/decoder bundles are not included.

### Validation and release status

CI covers Node 22 and 24, known-byte and round-trip behavior, inferred types,
packed ESM/CommonJS consumers, executable examples, and browser tree shaking.
The [release procedure](releasing.md) prepares tarballs and supports an
explicit trusted-publishing step. No v1 npm release has been performed yet.
