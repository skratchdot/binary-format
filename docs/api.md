# API reference

Import public functions and types from `@binary-format/binary-format`.
For a walkthrough, start with the [usage guide](guide.md). For upgrades, see the
[migration guide](migration.md).

Examples below use `import * as bf from '@binary-format/binary-format'`.
Signatures are summaries; the package declarations provide full generic types.

- [Decode and encode](#decode-and-encode)
- [Numeric schemas](#numeric-schemas)
- [Bytes and text](#bytes-and-text)
- [Objects](#objects)
- [Arrays](#arrays)
- [Choices](#choices)
- [Contexts](#contexts)
- [Errors](#errors)
- [Bit fields](#bit-fields)
- [Custom schemas](#custom-schemas)
- [Types](#types)
- [Hexadecimal helper](#hexadecimal-helper)

## Decode and encode

### `decode`

```text
decode(schema, input, options?): T
```

Decode input using a schema and return its inferred value.

- `schema`: a `Schema<T>`.
- `input`: an `ArrayBuffer` or view, including `DataView` and Node.js `Buffer`.
  A view's offset and length bound the input; offsets start at zero within it.
- `options.requireEOF`: defaults to `false`. Set to `true` to reject trailing bytes.

```typescript
bf.decode(bf.uint16be(), bf.bytesFromHex('01 02'), { requireEOF: true }); // 258
```

Root operations must finish on a byte boundary. Truncated input, invalid values,
and alignment failures throw; see [errors](#errors). Root operations return
values or bytes, not consumed-length records.

### `encode`

```text
encode(schema, value): Uint8Array
```

Encode a value using a schema. `value` accepts the schema's inferred type or its
`DeepReadonly` form.

```typescript
bf.encode(bf.uint16be(), 258); // Uint8Array [1, 2]
```

Supply consistent count, size, tag, and checksum fields yourself; encoding does
not derive them. Root operations must finish on a byte boundary. Encoding is not
a general copy operation: a root byte schema can return the supplied storage.
Schema-specific validation and [errors](#errors) apply.

## Numeric schemas

Numeric factories return `Schema<number>`, except 64-bit integers, which return
`Schema<bigint>`.

```typescript
bf.decode(bf.uint16le(), bf.bytesFromHex('02 01')); // 258
bf.encode(bf.uint64be(), 258n); // 00 00 00 00 00 00 01 02
```

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
64-bit values are `bigint`; convert explicitly when serializing to JSON.
Floats use DataView conversion, so float32 can round or overflow to infinity.
All numeric schemas require byte alignment and reject truncated input.

## Bytes and text

### `bytes` and `uint8Array`

```text
bytes(length): Schema<Uint8Array>
uint8Array(length): Schema<Uint8Array> // Alias of bytes
```

Decode a view of the next bytes. Encoding requires exactly the resolved length,
unless it is `'eof'`. See [length options](#length-options).

```typescript
bf.decode(bf.bytes(2), bf.bytesFromHex('01 02')); // Uint8Array [1, 2]
```

Decoded values share storage with the input. Copy with `Uint8Array.from(value)`
when mutations must be independent. A root encode can return the supplied
storage too. Truncated input and fixed-length mismatches throw.

### `plainArray`

```text
plainArray(length): Schema<number[]>
```

Decode bytes into a copied number array. Length follows the same rules as
[bytes](#bytes-and-uint8array).

```typescript
bf.decode(bf.plainArray(2), bf.bytesFromHex('01 02')); // [1, 2]
```

Encoding converts with `Uint8Array.from`, then checks length. It coerces numbers
rather than validating each integer. Use `array(uint8(), count)` for strict
integer validation.

### `string`

```text
string(length): Schema<string>
```

Decode UTF-8 text. Encoding zero-pads or truncates encoded bytes to the resolved
length. Lengths count bytes, not characters; see [text behavior](#text-behavior).

```typescript
bf.decode(bf.string(3), bf.encode(bf.string(3), 'a')); // 'a\0\0'
```

### `latin1`

```text
latin1(length, options?): Schema<string>
```

Map each byte directly to a U+0000–U+00FF code unit. Encoding zero-pads or
truncates to the resolved byte length. `options.outOfRange` controls code units
above 255: `'throw'` (default), `'replace'` (write `?`), or `'truncate'` (keep the
low eight bits of each UTF-16 code unit). This encoding is not Windows-1252.

```typescript
bf.encode(bf.latin1(1, { outOfRange: 'replace' }), '€'); // Uint8Array [63]
```

### `skip`

```text
skip(length): Schema<undefined>
```

Consume a fixed number of bytes and decode to `undefined`. Encoding writes that
many zero bytes, ignoring the supplied value. `length` must be a non-negative
safe integer; callbacks and `'eof'` are unsupported. Truncated input throws.

```typescript
bf.decode(bf.skip(2), bf.bytesFromHex('ab cd')); // undefined
bf.encode(bf.skip(2), undefined); // Uint8Array [0, 0]
```

Use [omitUndefined](#objects) to leave a reserved field out of decoded objects.

### `constant`

```text
constant(expected): Schema<Uint8Array>
```

Match an expected byte sequence when decoding; a mismatch or truncated input
throws. `expected` accepts an ArrayBuffer, view, or readonly number array and is
snapshotted when the schema is created.

```typescript
const magic = bf.constant([0x42, 0x46]);
bf.decode(magic, bf.bytesFromHex('42 46')); // Uint8Array [66, 70]
```

Decoded values share input storage. Encoding writes a fresh copy of the expected
bytes, ignoring the supplied value.

### Length options

`LengthOption` is a non-negative safe integer, `'eof'`, or a callback returning
either. Lengths count **bytes**, not characters. A callback receives a
`DecodeContext | EncodeContext`. `'eof'` consumes the remaining input when
decoding, including inside nested objects (there is no implicit sub-buffer);
encoding uses the supplied bytes or encoded text length.
These options apply to `bytes`, `uint8Array`, `plainArray`, `string`, and `latin1`.
Arrays use a different [length contract](#arrays).

### Text behavior

Text decoding preserves NUL padding. UTF-8 decoding uses the standard
TextDecoder behavior, including removal of a leading UTF-8 BOM. UTF-8 truncation can split a character,
which the decoder replaces with U+FFFD; malformed UTF-8 also uses replacement.
Both `string` and `latin1` reject truncated input. Other encodings require a
custom schema with an appropriate polyfill or package.

## Objects

### `object`

```text
object(fields): Schema<InferredObject>
```

Compose ordered fields into an object schema.

```typescript
const header = bf.object([
  ['kind', bf.uint8()],
  ['reserved', bf.skip(1), { omitUndefined: true }],
]);
bf.decode(header, bf.bytesFromHex('01 00')); // { kind: 1 }
```

`fields` takes ordered tuples `[name, schema, options?]`. Wire order is
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

### `array`

```text
array(itemSchema, length): Schema<Item[]>
```

Repeat an item schema and return an array of its values.

```typescript
bf.decode(bf.array(bf.uint16be(), 2), bf.bytesFromHex('01 02 03 04')); // [258, 772]
```

`length` is a non-negative safe integer item count, `'eof'`, or a **predicate**, not a byte-length callback.

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
The [counted-list example](guide.md#read-a-counted-list) uses earlier sibling
`count` in both directions.
Direct bit-schema items are unsupported, even `bit8()`. An object item that
contains direct bit fields and finishes on a byte boundary is supported.

## Choices

### `choice`

```text
choice(selector, options, defaultSchema?): Schema<OptionValues | DefaultValue>
```

Select one schema from an options map using the current context.

```typescript
const selected = bf.choice(() => 1, { 1: bf.uint16be(), 2: bf.string(2) });
bf.decode(selected, bf.bytesFromHex('01 02')); // 258
```

`options` maps own keys to schemas. The selector receives the current decode or encode context and returns a
string, number, or `undefined`. Missing keys use the default schema, or throw
when no default exists. It does not try alternatives based on the value's type.
The inferred value is the union of option values and any default value.

The [tagged-value example](guide.md#select-a-tagged-value) uses an earlier tag field.
Supply a matching tag and value when encoding. Choices must start and finish
on byte boundaries. Whole-byte bit branches, such as `bit8()`, work at the root.
Inside arrays or objects, branches must return zero bit counts; select a
whole-byte object containing bit fields instead.

## Contexts

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

## Errors

### `BinaryFormatError`

Failures inside object fields and array items are wrapped in `BinaryFormatError`
with `fieldPath`, `byteOffset`, `bitOffset`, optional `schemaKind`, and original
`cause`. An existing BinaryFormatError keeps its deeper location. Root primitive
errors and container-level checks may throw ordinary errors instead; do not
assume every failure is wrapped. Use the structured fields, not message parsing.

## Bit fields

### `bit` and `bit1` through `bit32`

```text
bit(width, littleEndian = false): Schema<number>
bit4(littleEndian = false): Schema<number> // Also bit1() through bit32()
```

```typescript
const flags = bf.object([
  ['version', bf.bit4()],
  ['kind', bf.bit4()],
]);
bf.encode(flags, { version: 4, kind: 5 }); // Uint8Array [0x45]
```

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

### `custom`

```text
custom<T>(schema: Schema<T>): Schema<T>
```

See the [custom boolean walkthrough](guide.md#create-a-custom-schema) for a
complete extension that delegates byte access and validates values.

`custom<T>(schema)` returns the supplied `Schema<T>` unchanged. A structurally
compatible object also works without this helper. `kind` improves diagnostics.

For byte-aligned extensions, `decode(context)` returns
`{ result: T, bytesDecoded, bitsDecoded: 0 }`; `encode(context)` returns
`{ result: Uint8Array, bytesEncoded, bitsEncoded: 0 }`. Report the bytes consumed
or produced by this invocation, not absolute offsets. Return only this schema's
encoded bytes, not a prefix padded to `context.byteOffset`.

Custom code must validate input bounds, values, alignment, and its reported
counts. `custom` does not add validation or advance a mutable cursor. Delegating
to a built-in schema retains its checks; see the
[custom boolean example](guide.md#create-a-custom-schema).
`EncodeContext.value` is `unknown` by default, so validate it before conversion.
Use whole-byte extensions for composition; the internal bit writer's shared
state is not a public custom-schema API. Zero-byte schemas can be useful with a
fixed item count but cannot advance an EOF array.

## Types

| Export                            | Purpose                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `Schema<T>`                       | Structural interface with `decode`, `encode`, and optional diagnostic `kind` |
| `infer<typeof schema>`            | Extract the schema's value type                                              |
| `DeepReadonly<T>`                 | Recursively readonly objects and arrays; typed-array types remain intact     |
| `DecodeOptions`                   | Root decoding options, including `requireEOF`                                |
| `FieldOptions`                    | Object field options, including `omitUndefined`                              |
| `LengthOption`, `LengthFunction`  | Byte/text lengths and callbacks; see [length options](#length-options)       |
| `DecodeContext`, `EncodeContext`  | Schema and callback inputs; see [contexts](#contexts)                        |
| `DecodeResult<T>`, `EncodeResult` | Schema method results and counts; see [custom schemas](#custom-schemas)      |

## Hexadecimal helper

### `bytesFromHex`

```text
bytesFromHex(text: string): Uint8Array
```

Convert pairs of hexadecimal digits to bytes, ignoring whitespace.

```typescript
bf.bytesFromHex('01 ab CD'); // Uint8Array [1, 171, 205]
```

Odd digit counts and invalid characters throw. `0x` prefixes are not accepted.
