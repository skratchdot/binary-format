# Bit-field composition

Bit fields share a byte only when they are direct fields of the same `object`.
An object owns the shared writer and returns a complete byte sequence to its
parent. Containers do not pass partially written bytes to one another.

## Supported layouts

| Layout                             | Contract                                                             |
| ---------------------------------- | -------------------------------------------------------------------- |
| Root `bit(width)`                  | Width is 8, 16, 24, or 32                                            |
| Direct object bit fields           | Widths may cross bytes; every shared byte uses one bit ordering      |
| Bit fields followed by byte fields | Finish the byte before starting the next field                       |
| Nested object with bit fields      | Start and finish on byte boundaries                                  |
| Array items or choice branches     | Use byte-based schemas, including whole-byte objects with bit fields |
| Custom schema                      | Return whole bytes with `bitsDecoded: 0` / `bitsEncoded: 0`          |

All bit values are unsigned integers. Widths are 1–32 and values range from zero
to 2^width−1. `bit1()` through `bit32()` follow the same rules as `bit(width)`.
An ordering change is allowed at a byte boundary, including immediately after
another bit field. A field spanning multiple bytes uses its selected ordering
throughout.

## Ordering and known bytes

With `littleEndian = false` (default), bits are visited high to low within each
byte and the value is accumulated most-significant bit first. With `true`, bits
are visited low to high and the value is accumulated least-significant bit first.
For widths that are not multiples of eight, this is more than a byte swap.

| Direct fields in wire order             | Ordering      | Result (hex)  |
| --------------------------------------- | ------------- | ------------- |
| 4-bit value `0xa`, 4-bit value `0xb`    | Default       | `ab`          |
| 4-bit value `0xa`, 4-bit value `0xb`    | Little endian | `ba`          |
| 12-bit value `0xabc`, 4-bit value `0xd` | Default       | `ab cd`       |
| 12-bit value `0xabc`, 4-bit value `0xd` | Little endian | `bc da`       |
| 32-bit value `0x89abcdef`               | Default       | `89 ab cd ef` |
| 32-bit value `0x89abcdef`               | Little endian | `ef cd ab 89` |

The [bit contract tests](../src/schemas/bit-contracts.test.ts) check exact bytes
and round trips. The [schema patterns](../examples/schema-patterns.ts) include
flags followed by reserved bytes and a custom byte schema. The
[IP example](../examples/ip.ts) demonstrates a larger header.

## Rejected layouts and alternatives

- Mixing bit ordering within a byte throws in both directions, at the field
  that changes ordering. Finish the byte before changing ordering.
- A non-bit object field cannot start inside an unfinished byte, even if it
  consumes no bytes. Finish the byte with direct bit fields first.
- Direct bit-schema array items are rejected, including `bit8()`. Use `uint8()`
  for byte values or wrap a complete group of bit fields in an object.
- Choice branches must return byte-only results, including the default branch.
  A direct `bit8()` branch is rejected too. Select `uint8()`, a numeric byte
  schema, or an object whose bit fields complete whole bytes.
- A custom wrapper cannot forward a bit schema's nonzero bit counts into a
  root operation, object, array, or choice. Delegate to a complete object or
  implement a byte-based conversion, reporting bytes and zero bits.
- Root bit schemas and object bit groups cannot end on a partial byte. Padding
  is explicit: add a direct bit field and supply its value when encoding.

These checks run during encoding and decoding, not when constructing a schema.
Only reached fields, selected branches, and processed array items are checked.
A schema that is never visited, such as the item of an empty array, does not fail
merely because it is present in the definition.

Alignment is checked before invoking a non-bit object field or a choice selector.
Result bit counts are checked after invoking an array item, choice branch, or
custom schema, since those counts are returned by the schema. Custom code must
still validate its own byte counts, bounds, and values; these checks are not
transactional and cannot undo callback side effects.

## Errors and compatibility

Errors inside object fields and array items carry `BinaryFormatError` locations,
including nested paths and absolute byte/bit offsets. Root checks can throw an
ordinary Error. See [contexts and errors](api.md#contexts-and-errors).

This contract tightens the unpublished v1 implementation: mixed bit ordering
and some wrapped bit schemas previously decoded without rejection even though
encoding could lose data or count offsets incorrectly. Direct whole-byte choices
and custom wrappers that forwarded bit counts are now rejected consistently,
including cases that happened to work at the root. Byte-based schemas and
complete bit-field objects keep their wire representation.

Supporting shared partial bytes across arrays, choices, or custom schemas would
require a shared read/write cursor contract. That is outside the current API.
