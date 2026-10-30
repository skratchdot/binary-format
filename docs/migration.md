# Migrating from v0 to v1

v1 replaces the chaining API with composable schemas. The package name remains
`@binary-format/binary-format`; Node.js 22+ is required. There is no compatibility
wrapper for v0's default export. For the release summary, see the
[changelog](../CHANGELOG.md). For current behavior, see the [API reference](api.md).

- [Replace the formatter](#replace-the-formatter)
- [Translate composition and extensions](#translate-composition-and-extensions)
- [Audit behavior at format boundaries](#audit-behavior-at-format-boundaries)

## Replace the formatter

Before (v0):

```typescript
import BinaryFormat from '@binary-format/binary-format';

const greeting = new BinaryFormat<{
  hello: string;
  space: number;
  world: string;
  exclamation: number;
}>()
  .string('hello', 5)
  .uint8('space')
  .string('world', 5)
  .uint8('exclamation')
  .done();

const value = greeting.read(Buffer.from('hello world!'));
const bytes = greeting.write(value);
```

After (v1):

```typescript
import * as bf from '@binary-format/binary-format';

const greeting = bf.object([
  ['hello', bf.string(5)],
  ['space', bf.uint8()],
  ['world', bf.string(5)],
  ['exclamation', bf.uint8()],
]);
type Greeting = bf.infer<typeof greeting>;

const value: Greeting = bf.decode(greeting, new TextEncoder().encode('hello world!'));
const bytes = bf.encode(greeting, value);
```

The v1 schema and exact wire values are checked in the
[executable examples](../examples/schema-patterns.ts). The v0 block is historical
syntax, not code run by the current test suite.

## Translate composition and extensions

| v0 concept                                                           | v1 replacement                                                                |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Default `BinaryFormat` constructor, chained field methods, `.done()` | Named schema factories in `object` field tuples                               |
| Formatter `.read(input)` / `.write(value)`                           | `decode(schema, input)` / `encode(schema, value)`                             |
| Explicit formatter value type                                        | `infer<typeof schema>`                                                        |
| Nested format definitions                                            | Reusable `object`, `array`, and `choice` schemas                              |
| Custom `read`/`write` callbacks using mutable buffer cursors         | `custom<T>` with explicit decode/encode contexts and consumed/produced counts |
| Buffer output                                                        | Uint8Array output; convert explicitly with `Buffer.from(bytes)` when needed   |

For a custom byte conversion, start with the [custom boolean example](guide.md#create-a-custom-schema). It delegates
to `uint8().decode(context)` and `uint8().encode(context)`, validates 0/1 or a
boolean, and preserves the returned counts. It does not mutate a cursor.

For counted lists, use an array predicate that reads the earlier sibling count
in both directions; see the [counted-list example](guide.md#read-a-counted-list). For a tagged union, use `choice` with a selector
that reads the tag; see the [tagged-value example](guide.md#select-a-tagged-value). Byte-length callbacks return a number or
`'eof'`, while array predicates return a boolean. These are different contracts.

## Audit behavior at format boundaries

- Keep count, length, tag, and checksum values consistent yourself when encoding.
  These fields are not automatically derived from other values.
- Use explicit endian factories such as `uint16le()` where the format needs
  little endian. Multi-byte numeric factories default to big endian.
- 64-bit integer values are `bigint`; plan a conversion when serializing to JSON.
- Decoding accepts ArrayBuffer views, including Buffer, and respects their bounds.
  Byte fields can alias the input; copy them when independent ownership matters.
- Text lengths count bytes. Fixed text is padded with zero bytes or truncated;
  UTF-8 truncation may split a character. Use `latin1` for one-byte code units.
- `skip` decodes to undefined and writes zeros. Use `{ omitUndefined: true }`
  to omit that property from decoded objects without removing the wire field.
- Put direct bit fields in an object and complete each byte before changing to a
  byte-based schema. Bit arrays and shared partial bytes through choices/custom
  schemas are unsupported.
- Enable `{ requireEOF: true }` when an input must contain exactly one record.
  Inspect `BinaryFormatError` fields and `cause` for nested failures; root errors
  are not always wrapped.

See the [API reference](api.md) for exact contracts and the existing
[BMP](../examples/bmp.ts), [IP](../examples/ip.ts), and [TCP](../examples/tcp.ts)
schemas for larger formats. Keep representative v0 files as fixtures and compare
expected decoded values and encoded bytes before migrating a consumer.
