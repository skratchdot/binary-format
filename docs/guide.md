# Usage guide

Start with the [README quick start](../README.md#quick-start). This guide builds
on it with counted lists, tagged values, errors, and extensions. All examples use:

```typescript
import * as bf from '@binary-format/binary-format';
```

- [Define fields and infer values](#define-fields-and-infer-values)
- [Read a counted list](#read-a-counted-list)
- [Select a tagged value](#select-a-tagged-value)
- [Handle invalid input](#handle-invalid-input)
- [Create a custom schema](#create-a-custom-schema)
- [Choose the next example](#choose-the-next-example)

## Define fields and infer values

An object schema lists fields in wire order. The following packet has a one-byte
count, two big-endian 16-bit items, and any remaining bytes as a tail:

```typescript
const fixedPacket = bf.object([
  ['count', bf.uint8()],
  ['items', bf.array(bf.uint16be(), 2)],
  ['tail', bf.bytes('eof')],
]);

type FixedPacket = bf.infer<typeof fixedPacket>;
// { count: number; items: number[]; tail: Uint8Array }

const fixedValue: FixedPacket = bf.decode(fixedPacket, bf.bytesFromHex('02 01 02 03 04 09'), {
  requireEOF: true,
});
// { count: 2, items: [258, 772], tail: Uint8Array [9] }

bf.encode(fixedPacket, fixedValue); // 02 01 02 03 04 09
```

`uint16be()` makes the byte order explicit; `uint16()` also defaults to big
endian. Use `uint16le()` for little endian. An array's numeric length counts
items, while a byte or text schema's length counts bytes.

`'eof'` reads to the end of the root input, including inside nested objects.
It does not establish a smaller boundary for a nested record. See
[length options](api.md#length-options) and [arrays](api.md#arrays).

## Read a counted list

To use the count stored in the packet, replace the fixed item count with a
predicate. Callbacks run during both decoding and encoding:

```typescript
const packet = bf.object([
  ['count', bf.uint8()],
  [
    'items',
    bf.array(bf.uint16be(), ({ context, index }) => {
      const siblings = 'decodedObject' in context ? context.decodedObject : context.encodedObject;
      return index < Number(siblings['count']);
    }),
  ],
  ['tail', bf.bytes('eof')],
]);

const input = bf.bytesFromHex('02 01 02 03 04 09');
const value = bf.decode(packet, input, { requireEOF: true });
bf.encode(packet, value); // 02 01 02 03 04 09
```

Earlier sibling fields are available through `decodedObject` or `encodedObject`.
The `in` check narrows the context to the operation in progress. See
[contexts](api.md#contexts) for nested objects and root access.

When encoding, supply `count: 2` and two items yourself. The library does not
calculate the count from the array or check that the two agree. Numeric counts
and predicates can ignore extra array values or pass missing values to the item
schema. Validate application values before encoding when consistency matters.

## Select a tagged value

A choice uses a selector to choose a schema. Here tag `1` means a 16-bit number
and tag `2` means two bytes of UTF-8 text:

```typescript
const tagged = bf.object([
  ['tag', bf.uint8()],
  [
    'value',
    bf.choice(
      (context) => {
        const siblings = 'decodedObject' in context ? context.decodedObject : context.encodedObject;
        return Number(siblings['tag']);
      },
      { 1: bf.uint16be(), 2: bf.string(2) }
    ),
  ],
]);

bf.decode(tagged, bf.bytesFromHex('01 01 02')); // { tag: 1, value: 258 }
bf.encode(tagged, { tag: 2, value: 'hi' }); // 02 68 69
```

The inferred `value` type is `number | string`; the object type does not correlate
each tag with its value type. Supply a matching tag and value when encoding.
Unknown tags throw unless the choice has a default schema. See [choice](api.md#choices).

## Handle invalid input

Use `{ requireEOF: true }` when the input should contain exactly one record.
Without it, decoding allows trailing bytes. A schema that consumes `'eof'`
already includes the remaining input in its value.

```typescript
try {
  bf.decode(packet, bf.bytesFromHex('01 00'));
} catch (error) {
  if (error instanceof bf.BinaryFormatError) {
    console.log(error.fieldPath); // ['items', 0]
    console.log(error.byteOffset); // 1
    console.log(error.cause); // Original failure: truncated uint16
  } else {
    throw error;
  }
}
```

Object-field and array-item failures carry structured locations. Root primitive
and container checks can throw ordinary errors instead. Use error fields rather
than parsing messages. See [errors](api.md#errors).

## Create a custom schema

Delegate byte access to a built-in schema to retain its bounds and alignment
checks. This schema stores a boolean as `0` or `1`:

```typescript
const booleanByte = bf.custom<boolean>({
  kind: 'booleanByte',
  decode: (context) => {
    const decoded = bf.uint8().decode(context);
    if (decoded.result !== 0 && decoded.result !== 1) {
      throw new RangeError('expected 0 or 1');
    }
    return { ...decoded, result: decoded.result === 1 };
  },
  encode: (context) => {
    if (typeof context.value !== 'boolean') {
      throw new TypeError('expected boolean');
    }
    return bf.uint8().encode({ ...context, value: context.value ? 1 : 0 });
  },
});

bf.decode(booleanByte, Uint8Array.of(1)); // true
bf.encode(booleanByte, false); // Uint8Array [0]
```

Schema methods return a value or bytes plus consumed/produced counts. Delegating
preserves those counts. `custom()` does not add validation or move a mutable
cursor; extension code is responsible for its own contracts. See
[custom schemas](api.md#custom-schemas) before implementing direct buffer access.

## Choose the next example

- [Bit fields](bit-fields.md): pack flags and understand alignment and ordering.
- [API reference](api.md): byte ownership, text padding, lengths, and exact contracts.
- [Schema patterns](../examples/schema-patterns.ts): the executable versions of
  this guide's counted packet, tagged value, boolean, and packed flags.
- [BMP](../examples/bmp.ts), [IP](../examples/ip.ts), and [TCP](../examples/tcp.ts):
  larger schemas for existing formats.
- [Migration guide](migration.md): replace v0 formatters with v1 schemas.
