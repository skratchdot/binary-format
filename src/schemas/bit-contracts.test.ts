import * as bf from '../index';
import { describe, expect, it } from 'vitest';

const pair = (littleEndian = false) =>
  bf.object([
    ['a', bf.bit4(littleEndian)],
    ['b', bf.bit4(littleEndian)],
  ]);

const wrappedBit = (width: number) =>
  bf.custom<number>({
    kind: 'wrappedBit',
    decode: (context) => bf.bit(width).decode(context),
    encode: (context) => bf.bit(width).encode(context),
  });

function roundTrip<T>(schema: bf.Schema<T>, value: T, wire: readonly number[]): void {
  const input = Uint8Array.from(wire);
  expect(bf.decode(schema, input, { requireEOF: true })).toStrictEqual(value);
  expect(bf.encode(schema, value)).toStrictEqual(input);
}

function rejects<T>(
  schema: bf.Schema<T>,
  value: T,
  wire: readonly number[],
  message: string
): void {
  expect(() => bf.decode(schema, Uint8Array.from(wire))).toThrow(message);
  expect(() => bf.encode(schema, value)).toThrow(message);
}

describe('supported bit composition', () => {
  it.each([
    { littleEndian: false, wire: [0xab, 0xcd] },
    { littleEndian: true, wire: [0xbc, 0xda] },
  ])('packs fields across byte boundaries ($littleEndian)', ({ littleEndian, wire }) => {
    roundTrip(
      bf.object([
        ['a', bf.bit(12, littleEndian)],
        ['b', bf.bit4(littleEndian)],
      ]),
      { a: 0xabc, b: 0xd },
      wire
    );
  });

  it.each([false, true])('handles 32-bit unsigned values (%s)', (littleEndian) => {
    roundTrip(
      bf.bit32(littleEndian),
      0x89abcdef,
      littleEndian ? [0xef, 0xcd, 0xab, 0x89] : [0x89, 0xab, 0xcd, 0xef]
    );
    roundTrip(
      bf.object([['value', bf.bit32(littleEndian)]]),
      { value: 0xffffffff },
      [0xff, 0xff, 0xff, 0xff]
    );
  });

  it('allows ordering changes at byte boundaries and resets after byte fields', () => {
    roundTrip(
      bf.object([
        ['first', bf.bit8()],
        ['a', bf.bit4(true)],
        ['b', bf.bit4(true)],
        ['middle', bf.uint8()],
        ['c', bf.bit4()],
        ['d', bf.bit4()],
      ]),
      { first: 0xab, a: 0xc, b: 0xd, middle: 0x12, c: 3, d: 4 },
      [0xab, 0xdc, 0x12, 0x34]
    );
  });

  it('supports EOF arrays of complete bit-field objects through bounded views', () => {
    const schema = bf.array(pair(true), 'eof');
    const backing = Uint8Array.of(0xff, 0x21, 0x43, 0xff);
    const input = new DataView(backing.buffer, 1, 2);
    const value = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    expect(bf.decode(schema, input, { requireEOF: true })).toStrictEqual(value);
    expect(bf.encode(schema, value)).toStrictEqual(Uint8Array.of(0x21, 0x43));
  });

  it('allows a little-to-big ordering change at a byte boundary', () => {
    roundTrip(
      bf.object([
        ['first', bf.bit8(true)],
        ['a', bf.bit4()],
        ['b', bf.bit4()],
      ]),
      { first: 0xab, a: 0xc, b: 0xd },
      [0xab, 0xcd]
    );
  });

  it('composes byte-complete objects through arrays, choices, and custom schemas', () => {
    const inner = pair();
    const delegated = bf.custom<bf.infer<typeof inner>>({
      decode: inner.decode,
      encode: inner.encode,
    });
    const schema = bf.object([
      ['prefix', bf.uint8()],
      ['items', bf.array(inner, 2)],
      ['selected', bf.choice(() => 1, { 1: inner })],
      ['fallback', bf.choice(() => undefined, {}, inner)],
      ['custom', delegated],
      ['suffix', bf.uint8()],
    ]);
    roundTrip(
      schema,
      {
        prefix: 0x99,
        items: [
          { a: 1, b: 2 },
          { a: 3, b: 4 },
        ],
        selected: { a: 5, b: 6 },
        fallback: { a: 7, b: 8 },
        custom: { a: 9, b: 10 },
        suffix: 0xff,
      },
      [0x99, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xff]
    );
  });
});

describe('unsupported bit composition', () => {
  it.each([false, true])('rejects ordering changes inside a byte (%s)', (littleEndian) => {
    rejects(
      bf.object([
        ['a', bf.bit4(littleEndian)],
        ['b', bf.bit4(!littleEndian)],
      ]),
      { a: 1, b: 2 },
      [0x12],
      'bit ordering cannot change within a byte'
    );
    rejects(
      bf.object([
        ['a', bf.bit(12, littleEndian)],
        ['b', bf.bit4(!littleEndian)],
      ]),
      { a: 1, b: 2 },
      [0, 0x12],
      'bit ordering cannot change within a byte'
    );
  });

  it.each([
    ['choice', bf.choice(() => 1, { 1: bf.bit4() })],
    ['custom', wrappedBit(4)],
    ['text', bf.string(1)],
    ['object', pair()],
    ['array', bf.array(bf.uint8(), 1)],
  ] as const)('rejects a %s after an unfinished direct bit field', (_name, schema) => {
    rejects(
      bf.object([
        ['a', bf.bit4()],
        ['b', schema as bf.Schema<unknown>],
      ]),
      { a: 1, b: 2 },
      [0x12, 0x34],
      'while bitOffset is 4'
    );
  });

  it.each([4, 8])('rejects direct and wrapped %i-bit array items', (width) => {
    for (const schema of [bf.bit(width), wrappedBit(width)]) {
      rejects(bf.array(schema, 1), [1], [0x10], 'array items must return byte-only results');
    }
  });

  it.each([4, 8])('rejects selected and default %i-bit choices', (width) => {
    for (const schema of [
      bf.choice(() => 1, { 1: bf.bit(width) }),
      bf.choice(() => undefined, {}, bf.bit(width)),
      bf.choice(() => 1, { 1: wrappedBit(width) }),
    ]) {
      rejects(schema, 1, [0x10], 'choice branches must return byte-only results');
    }
  });

  it.each([4, 8])('rejects custom bit counts at the root and in object fields (%i)', (width) => {
    rejects(wrappedBit(width), 1, [0x10], 'root schemas must return byte-only results');
    rejects(
      bf.object([['value', wrappedBit(width)]]),
      { value: 1 },
      [0x10],
      'non-bit object fields must return byte-only results'
    );
  });

  it('rejects misaligned fields before invoking their callbacks', () => {
    let calls = 0;
    const schema = bf.object([
      ['a', bf.bit4()],
      [
        'b',
        bf.choice(
          () => {
            calls++;
            return 1;
          },
          { 1: bf.bit4() }
        ),
      ],
    ]);
    rejects(schema, { a: 1, b: 2 }, [0x12], 'while bitOffset is 4');
    expect(calls).toBe(0);
  });

  it('preserves the offending field location for mixed ordering', () => {
    const schema = bf.object([
      ['prefix', bf.uint8()],
      [
        'items',
        bf.array(
          bf.object([
            ['a', bf.bit4()],
            ['b', bf.bit4(true)],
          ]),
          1
        ),
      ],
    ]);
    const verify = (operation: () => unknown) => {
      try {
        operation();
        expect.unreachable('expected an error');
      } catch (error) {
        expect(error).toBeInstanceOf(bf.BinaryFormatError);
        expect(error).toMatchObject({
          fieldPath: ['items', 0, 'b'],
          byteOffset: 1,
          bitOffset: 4,
          schemaKind: 'bit',
        });
      }
    };
    verify(() => bf.decode(schema, Uint8Array.of(0, 0x12)));
    verify(() => bf.encode(schema, { prefix: 0, items: [{ a: 1, b: 2 }] }));
  });
});
