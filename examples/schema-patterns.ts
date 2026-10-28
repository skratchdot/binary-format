/** Executable companion to docs/api.md and docs/migration.md. */
import assert from 'node:assert/strict';
import * as bf from '../src/index';

// Migration: replace the chained formatter with a reusable schema.
export const greeting = bf.object([
  ['hello', bf.string(5)],
  ['space', bf.uint8()],
  ['world', bf.string(5)],
  ['exclamation', bf.uint8()],
]);
export type Greeting = bf.infer<typeof greeting>;

// Context callbacks run in both directions. Earlier siblings supply the count.
export const packet = bf.object([
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

export const tagged = bf.object([
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

// Delegate byte access to a built-in schema so bounds/alignment checks are retained.
export const booleanByte = bf.custom<boolean>({
  kind: 'booleanByte',
  decode: (context) => {
    const decoded = bf.uint8().decode(context);
    if (decoded.result !== 0 && decoded.result !== 1) throw new RangeError('expected 0 or 1');
    return { ...decoded, result: decoded.result === 1 };
  },
  encode: (context) => {
    if (typeof context.value !== 'boolean') throw new TypeError('expected boolean');
    return bf.uint8().encode({ ...context, value: context.value ? 1 : 0 });
  },
});

export const flags = bf.object([
  ['version', bf.bit4()],
  ['kind', bf.bit4()],
  ['reserved', bf.skip(1), { omitUndefined: true }],
  ['enabled', booleanByte],
]);

/** Throws on drift between the documented values and their wire representation. */
export function runSchemaExamples(): void {
  const greetingValue: Greeting = {
    hello: 'hello',
    space: 32,
    world: 'world',
    exclamation: 33,
  };
  roundTrip(greeting, greetingValue, bf.bytesFromHex('68 65 6c 6c 6f 20 77 6f 72 6c 64 21'));
  roundTrip(
    packet,
    { count: 2, items: [258, 772], tail: Uint8Array.of(9) },
    bf.bytesFromHex('02 01 02 03 04 09')
  );
  roundTrip(tagged, { tag: 1, value: 258 }, bf.bytesFromHex('01 01 02'));
  roundTrip(tagged, { tag: 2, value: 'hi' }, bf.bytesFromHex('02 68 69'));
  roundTrip(flags, { version: 4, kind: 5, enabled: true }, bf.bytesFromHex('45 00 01'));

  const input = Uint8Array.of(1, 2);
  const view = bf.decode(bf.bytes(2), input);
  input[0] = 9;
  assert(view[0] === 9, 'decoded bytes share input storage');
  assert(bf.decode(bf.string(3), bf.encode(bf.string(3), 'a')) === 'a\0\0', 'text padding');
  assert(bf.decode(bf.string(1), bf.encode(bf.string(1), 'é')) === '\ufffd', 'UTF-8 truncation');
  assert.throws(
    () => bf.decode(packet, bf.bytesFromHex('01 00')),
    (error: unknown) => {
      assert(error instanceof bf.BinaryFormatError);
      assert.deepEqual(error.fieldPath, ['items', 0]);
      assert.equal(error.byteOffset, 1);
      assert.equal(error.bitOffset, 0);
      assert(error.cause instanceof RangeError);
      return true;
    }
  );
  roundTrip(booleanByte, false, Uint8Array.of(0));
  assert.throws(() => bf.decode(booleanByte, Uint8Array.of(2)), RangeError);
  assert.throws(() => bf.decode(booleanByte, new Uint8Array()), RangeError);
  // Schema methods receive unknown values and must validate runtime input.
  assert.throws(
    () =>
      booleanByte.encode({
        value: 1,
        byteOffset: 0,
        bitOffset: 0,
        encodedObject: {},
        path: [],
      }),
    TypeError
  );
}

function roundTrip<T>(schema: bf.Schema<T>, value: T, wire: Uint8Array): void {
  assert.deepEqual(bf.decode(schema, wire, { requireEOF: true }), value);
  assert.deepEqual(bf.encode(schema, value), wire);
}
