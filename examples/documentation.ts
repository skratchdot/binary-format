/** Executable companion to docs/api.md and docs/migration.md. */
import * as bf from '@binary-format/binary-format';

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
export function runDocumentationExamples(): void {
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
  check(view[0] === 9, 'decoded bytes share input storage');
  check(bf.decode(bf.string(3), bf.encode(bf.string(3), 'a')) === 'a\0\0', 'text padding');
  check(bf.decode(bf.string(1), bf.encode(bf.string(1), 'é')) === '\ufffd', 'UTF-8 truncation');
  try {
    bf.decode(packet, bf.bytesFromHex('01 00'));
    throw new Error('truncated packet should fail');
  } catch (error) {
    check(error instanceof bf.BinaryFormatError, 'structured field error');
    if (error instanceof bf.BinaryFormatError) {
      check(JSON.stringify(error.fieldPath) === '["items",0]', 'error path');
      check(error.byteOffset === 1 && error.cause instanceof RangeError, 'error offset and cause');
    }
  }
}

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function roundTrip<T>(schema: bf.Schema<T>, value: T, wire: Uint8Array): void {
  check(
    JSON.stringify(bf.decode(schema, wire, { requireEOF: true })) === JSON.stringify(value),
    'decoded example value'
  );
  const encoded = bf.encode(schema, value);
  check(
    encoded.length === wire.length && encoded.every((byte, index) => byte === wire[index]),
    'encoded example bytes'
  );
}
