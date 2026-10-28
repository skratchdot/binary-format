# Public API reference

The repository contains the unpublished v1 API. Import from
`@binary-format/binary-format`; Node.js 22+ is supported. See the
[migration guide](migration.md) for v0 and the [README](../README.md) for module
formats and tree shaking.

[Executable examples](../examples/schema-patterns.ts) demonstrate a greeting,
a count-prefixed packet, tagged choices, a custom boolean, and packed flags.
`pnpm run test:package` type-checks and runs that file against the packed package
in ESM and CommonJS. Assertions cover exact bytes, decoded values, and errors.
`pnpm test` also runs the assertions against source.
The local file imports the source entry point; the package checker substitutes
the package name in its temporary copy. The example harness uses Node assertions.

## Decode, encode, and types

- `decode(schema, input, { requireEOF?: boolean })` returns the schema's value.
  Input may be an `ArrayBuffer` or view, including `DataView` and Node `Buffer`.
  A view's offset and length bound the input; offsets start at zero within it.
  Trailing bytes are allowed by default; `requireEOF: true` rejects them.
- `encode(schema, value)` returns a `Uint8Array` and accepts the inferred value
  or its `DeepReadonly` form. It does not calculate count, size, or checksum
  fields for you. Supply values consistent with the format.
- `Schema<T>` has `decode`, `encode`, and an optional diagnostic `kind`.
  `infer<typeof schema>` extracts `T`. `DeepReadonly<T>` recursively describes
  readonly objects and arrays, leaving typed-array types intact.
- `bytesFromHex(text)` accepts pairs of hex digits, ignoring whitespace.
  Odd digit counts and invalid characters throw; `0x` prefixes are not accepted.

Root operations must finish on a byte boundary. They return the value or bytes,
not a consumed-length record; schema methods expose those records for extensions.

## Numeric schemas

| Factories                | Value    | Width and range                        |
| ------------------------ | -------- | -------------------------------------- |
| `int8()`, `uint8()`      | `number` | Signed / unsigned 8-bit integer        |
| `int16()`, `uint16()`    | `number` | Signed / unsigned 16-bit integer       |
| `int32()`, `uint32()`    | `number` | Signed / unsigned 32-bit integer       |
| `int64()`, `uint64()`    | `bigint` | Signed / unsigned 64-bit integer       |
| `float32()`, `float64()` | `number` | IEEE 754, including NaN and infinities |

Every multi-byte factory accepts `littleEndian = false` and has explicit `be`
and `le` variants, such as `uint16be()` and `uint16le()`. The default is big
endian. Integer encoders reject fractional or out-of-range values. Signed n-bit
ranges are −2^(n−1) through 2^(n−1)−1; unsigned ranges are 0 through 2^n−1.
Floats use DataView conversion, so float32 can round or overflow to infinity.
All numeric schemas require byte alignment and reject truncated input.

## Bytes and text

| Factory                                     | Decoded value            | Encoding behavior                                                      |
| ------------------------------------------- | ------------------------ | ---------------------------------------------------------------------- |
| `bytes(length)`, alias `uint8Array(length)` | `Uint8Array` view        | Requires exactly the resolved length, unless `'eof'`                   |
| `plainArray(length)`                        | Copied `number[]`        | Converts with `Uint8Array.from`, then checks length                    |
| `string(length)`                            | UTF-8 `string`           | Zero-pads or truncates encoded bytes                                   |
| `latin1(length, options?)`                  | One code unit per byte   | Zero-pads or truncates bytes                                           |
| `skip(length)`                              | `undefined`              | Writes `length` zero bytes                                             |
| `constant(expected)`                        | Matching input byte view | Writes a fresh copy of the expected bytes, ignoring the supplied value |

`LengthOption` is a non-negative safe integer, `'eof'`, or a callback returning
either. Lengths count **bytes**, not characters. A callback receives a
`DecodeContext | EncodeContext`. `'eof'` consumes the remaining input when
decoding, including inside nested objects (there is no implicit sub-buffer);
encoding uses the supplied bytes or encoded text length. `skip` takes
only a fixed numeric length. `constant` accepts an ArrayBuffer, view, or readonly
number array and snapshots it when the schema is created.

Decoded `bytes` and `constant` values share storage with the input. Copy with
`Uint8Array.from(value)` when mutations must be independent. A root `bytes`
encode can also return the supplied storage; encoding is not a general copy
operation. `plainArray` copies, but its encoder coerces numbers like
`Uint8Array.from` rather than validating each integer. Use `array(uint8(), ...)`
when strict element validation is needed.

Text decoding preserves NUL padding. UTF-8 decoding uses the standard
TextDecoder behavior, including removal of a leading UTF-8 BOM. UTF-8 truncation can split a character,
which the decoder replaces with U+FFFD; malformed UTF-8 also uses replacement.
Latin-1 maps byte values directly to U+0000–U+00FF. Its `outOfRange` option is
`'throw'` (default), `'replace'` (write `?`), or `'truncate'` (keep the low eight
bits of each UTF-16 code unit). It is not Windows-1252.

## Objects

`object(fields)` takes ordered tuples `[name, schema, options?]`. Wire order is
tuple order, independent of JavaScript property enumeration. Names may be
strings, numbers, or symbols, including `__proto__`; decoded fields are own data
properties on an ordinary object. Use distinct names to avoid overwriting values.

`{ omitUndefined: true }` leaves an undefined decoded field out of the object
and makes it optional in the inferred type. Encoding still visits its schema;
for example, an omitted `skip(2)` field still writes two zero bytes. Extra input
object properties are not encoded.

Nested objects start and finish on byte boundaries. See `flags` in the
[examples](../examples/schema-patterns.ts) for reserved bytes and direct bit fields.

## Arrays

`array(itemSchema, length)` returns an array of item values. Its length argument
is an item count, `'eof'`, or a **predicate**, not a byte-length callback.

- A numeric count processes exactly that many items. Encoding does not check
  that the supplied array has the same length: extra values are ignored and
  missing values are passed as `undefined` to the item schema.
- `'eof'` decodes until the input ends, and encodes all supplied items. A partial
  final item throws. A zero-progress item while decoding before EOF throws.
- A predicate receives `{ context, index, array }` before each item and returns
  whether to continue. On decode, `array` holds prior results; on encode it is
  the complete supplied array. Ensure predicates terminate and supply enough
  values when encoding.

The predicate's `context` is the array's entry context, not an updated per-item
cursor. Item schemas receive their own advancing offsets and indexed paths.
The `packet` example uses earlier sibling `count` in both directions.
Direct bit-schema items are unsupported, even `bit8()`. An object item that
contains direct bit fields and finishes on a byte boundary is supported.

## Choices

`choice(selector, options, defaultSchema?)` selects an own key of the options
map. The selector receives the current decode or encode context and returns a
string, number, or `undefined`. Missing keys use the default schema, or throw
when no default exists. It does not try alternatives based on the value's type.
The inferred value is the union of option values and any default value.

The `tagged` example selects a number or string using an earlier tag field.
Supply a matching tag and value when encoding. Choices must start and finish
on byte boundaries. Whole-byte bit branches, such as `bit8()`, work at the root.
Inside arrays or objects, branches must return zero bit counts; select a
whole-byte object containing bit fields instead.

## Contexts and errors

| Context field             | Meaning                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `byteOffset`, `bitOffset` | Current position relative to the root input/output, including inside nested schemas     |
| `path`                    | Ordered object keys and array indices; root is `[]`                                     |
| `buffer`, `view` (decode) | Uint8Array and DataView bounded to the supplied input                                   |
| `value` (encode)          | Value for this schema, not necessarily the root object                                  |
| `decodedObject` (decode)  | Earlier decoded siblings in the nearest object                                          |
| `encodedObject` (encode)  | Earlier sibling input values already processed in the nearest object                    |
| `root`                    | First enclosing object's result under construction on decode; its input value on encode |

`root` can be absent outside objects. A root array does not become `root`;
each object item establishes its own root unless an outer object already did.
On decode, later fields are unavailable. On encode, `root` can contain later
input fields, but `encodedObject` contains only earlier siblings, including
supplied values that a schema may have normalized or ignored. Treat contexts
as read-only. Narrow the union with `'decodedObject' in context` (or
`'buffer' in context`) before reading direction-specific fields. Dynamic
sibling/root values may need runtime checks or type narrowing.

Failures inside object fields and array items are wrapped in `BinaryFormatError`
with `fieldPath`, `byteOffset`, `bitOffset`, optional `schemaKind`, and original
`cause`. An existing BinaryFormatError keeps its deeper location. Root primitive
errors and container-level checks may throw ordinary errors instead; do not
assume every failure is wrapped. Use the structured fields, not message parsing.

## Bit fields

`bit(width, littleEndian = false)` and `bit1()` through `bit32()` encode unsigned
numbers. Width must be 1–32, and values must be integers in 0 through 2^width−1.
The default visits high bits first and accumulates the value most-significant
bit first; `true` visits low bits first and accumulates least-significant bit
first. This is bit ordering, not just a byte swap.

Place bit fields directly in an object, use one ordering within each byte,
and finish a whole byte before a byte-based or nested schema. For example,
`version: bit4()` = 4 followed by `kind: bit4()` = 5 produces `45` hex.
Root bit schemas must also finish whole bytes. Mixed ordering within a byte,
non-bit fields at partial-byte offsets, and partial-byte choice branches are
rejected in both directions. Arrays and non-bit object fields require zero bit
counts. Root choices and custom wrappers can forward whole-byte bit results.
See the [bit-field composition contract](bit-fields.md) for supported layouts,
exact bytes, error behavior, and migration alternatives.

## Custom schemas

`custom<T>(schema)` returns the supplied `Schema<T>` unchanged. A structurally
compatible object also works without this helper. `kind` improves diagnostics.

For byte-aligned extensions, `decode(context)` returns
`{ result: T, bytesDecoded, bitsDecoded: 0 }`; `encode(context)` returns
`{ result: Uint8Array, bytesEncoded, bitsEncoded: 0 }`. Report the bytes consumed
or produced by this invocation, not absolute offsets. Return only this schema's
encoded bytes, not a prefix padded to `context.byteOffset`.

Custom code must validate input bounds, values, alignment, and its reported
counts. `custom` does not add validation or advance a mutable cursor. Delegating
to a built-in schema retains its checks; see `booleanByte` in the examples.
`EncodeContext.value` is `unknown` by default, so validate it before conversion.
Use whole-byte extensions for composition; the internal bit writer's shared
state is not a public custom-schema API. Zero-byte schemas can be useful with a
fixed item count but cannot advance an EOF array.
