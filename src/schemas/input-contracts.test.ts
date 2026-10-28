import * as bf from '../index';
import { describe, expect, it } from 'vitest';

const empty = bf.custom<undefined>({
  decode: () => ({ result: undefined, bytesDecoded: 0, bitsDecoded: 0 }),
  encode: () => ({ result: new Uint8Array(), bytesEncoded: 0, bitsEncoded: 0 }),
});

describe('input boundaries', () => {
  it.each([
    ['bytes', bf.bytes(2)],
    ['string', bf.string(2)],
    ['latin1', bf.latin1(2)],
    ['plainArray', bf.plainArray(2)],
    ['skip', bf.skip(2)],
    ['constant', bf.constant([1, 2])],
  ] as const)(
    '%s rejects short views even when their backing buffer is long enough',
    (_name, schema) => {
      const padded = Uint8Array.of(0xff, 1, 2, 0xff);
      for (const length of [0, 1]) {
        expect(() =>
          bf.decode(schema as bf.Schema<unknown>, new DataView(padded.buffer, 1, length))
        ).toThrow(RangeError);
      }
    }
  );

  it('handles empty byte, text, and EOF array schemas', () => {
    expect(bf.decode(bf.bytes('eof'), new Uint8Array())).toStrictEqual(new Uint8Array());
    expect(bf.decode(bf.string('eof'), new Uint8Array())).toBe('');
    expect(bf.decode(bf.latin1(0), new Uint8Array())).toBe('');
    expect(bf.decode(bf.array(bf.uint16(), 'eof'), new Uint8Array())).toStrictEqual([]);
    expect(bf.encode(bf.array(bf.uint16(), 'eof'), [])).toStrictEqual(new Uint8Array());
  });

  it('returns byte views but copies plain arrays', () => {
    const input = Uint8Array.of(1, 2);
    const view = bf.decode(bf.bytes(2), input);
    const plain = bf.decode(bf.plainArray(2), input);
    input[0] = 9;
    expect(view[0]).toBe(9);
    expect(plain).toStrictEqual([1, 2]);
    view[1] = 8;
    expect(input[1]).toBe(8);
  });

  it('captures constant bytes independently of later input and output mutation', () => {
    const original = Uint8Array.of(1, 2);
    const schema = bf.constant(original);
    original[0] = 9;
    const first = bf.encode(schema, new Uint8Array());
    first[1] = 9;
    expect(bf.encode(schema, new Uint8Array())).toStrictEqual(Uint8Array.of(1, 2));
  });

  it('pads and truncates text by byte length, including a split UTF-8 character', () => {
    expect(bf.encode(bf.string(3), 'a')).toStrictEqual(Uint8Array.of(97, 0, 0));
    expect(bf.decode(bf.string(3), Uint8Array.of(97, 0, 0))).toBe('a\0\0');
    expect(bf.encode(bf.string(1), 'é')).toStrictEqual(Uint8Array.of(0xc3));
    expect(bf.decode(bf.string(1), Uint8Array.of(0xc3))).toBe('\ufffd');
    expect(bf.encode(bf.latin1(2), 'abc')).toStrictEqual(Uint8Array.of(97, 98));
    expect(bf.encode(bf.latin1(2), 'é')).toStrictEqual(Uint8Array.of(0xe9, 0));
  });

  it.each([-1, 0.5, NaN, Infinity])('rejects invalid callback byte length %s', (length) => {
    const schema = bf.bytes(() => length);
    expect(() => bf.decode(schema, Uint8Array.of(1))).toThrow(RangeError);
    expect(() => bf.encode(schema, Uint8Array.of(1))).toThrow(RangeError);
  });

  it('rejects byte-length mismatches while allowing EOF callback lengths', () => {
    expect(() => bf.encode(bf.bytes(2), Uint8Array.of(1))).toThrow('expected 2 bytes');
    const schema = bf.object([
      ['header', bf.uint8()],
      ['tail', bf.bytes(() => 'eof')],
    ]);
    const input = Uint8Array.of(1, 2, 3);
    expect(bf.decode(schema, input)).toStrictEqual({ header: 1, tail: Uint8Array.of(2, 3) });
    expect(bf.encode(schema, { header: 1, tail: Uint8Array.of(2, 3) })).toStrictEqual(input);
  });
});

describe('array termination', () => {
  it('rejects zero-progress EOF decoding instead of looping', () => {
    expect(() => bf.decode(bf.array(empty, 'eof'), Uint8Array.of(1))).toThrow(
      'must consume bytes before eof'
    );
    // Count-bounded schemas may intentionally consume no bytes.
    expect(bf.decode(bf.array(empty, 2), new Uint8Array())).toStrictEqual([undefined, undefined]);
    expect(bf.encode(bf.array(empty, 'eof'), [undefined, undefined])).toStrictEqual(
      new Uint8Array()
    );
  });

  it('reports the failing EOF item and preserves its cause on truncation', () => {
    try {
      bf.decode(bf.array(bf.uint16be(), 'eof'), Uint8Array.of(0, 1, 0));
      expect.unreachable('truncated item should throw');
    } catch (error) {
      expect(error).toBeInstanceOf(bf.BinaryFormatError);
      expect(error).toMatchObject({
        fieldPath: [1],
        byteOffset: 2,
        bitOffset: 0,
        schemaKind: 'uint16be',
      });
      expect((error as bf.BinaryFormatError).cause).toBeInstanceOf(RangeError);
    }
  });

  it('uses index and prior decoded values for sentinel-terminated arrays', () => {
    const schema = bf.array(bf.uint8(), ({ context, index, array }) =>
      'buffer' in context ? index === 0 || array[index - 1] !== 0 : index < array.length
    );
    const value = [3, 2, 0];
    expect(bf.decode(schema, Uint8Array.of(3, 2, 0, 9))).toStrictEqual(value);
    expect(bf.encode(schema, value)).toStrictEqual(Uint8Array.of(3, 2, 0));
    expect(() => bf.decode(schema, Uint8Array.of(3, 2))).toThrow(bf.BinaryFormatError);
  });
});

describe('object keys and contexts', () => {
  it('treats __proto__, constructor, numbers, symbols, and dotted names as ordinary own fields', () => {
    const symbol = Symbol('field');
    const schema = bf.object([
      ['__proto__', bf.object([['value', bf.uint8()]])],
      ['constructor', bf.uint8()],
      [0, bf.uint8()],
      [symbol, bf.uint8()],
      ['a.b', bf.uint8()],
    ]);
    const value = { ['__proto__']: { value: 1 }, constructor: 2, 0: 3, [symbol]: 4, 'a.b': 5 };
    const decoded = bf.decode(schema, Uint8Array.of(1, 2, 3, 4, 5));
    expect(Object.getPrototypeOf(decoded)).toBe(Object.prototype);
    expect(Object.hasOwn(decoded, '__proto__')).toBe(true);
    expect(decoded).toStrictEqual(value);
    expect(bf.encode(schema, value)).toStrictEqual(Uint8Array.of(1, 2, 3, 4, 5));
  });

  it('exposes an own __proto__ field to sibling length callbacks during decode and encode', () => {
    const schema = bf.object([
      ['__proto__', bf.uint8()],
      [
        'data',
        bf.bytes((context) => {
          const siblings =
            'decodedObject' in context ? context.decodedObject : context.encodedObject;
          expect(Object.hasOwn(siblings, '__proto__')).toBe(true);
          expect(Object.getPrototypeOf(siblings)).toBe(Object.prototype);
          return Number(siblings['__proto__']);
        }),
      ],
    ]);
    const input = Uint8Array.of(2, 7, 8);
    const value = { ['__proto__']: 2, data: Uint8Array.of(7, 8) };
    expect(bf.decode(schema, input)).toStrictEqual(value);
    expect(bf.encode(schema, value)).toStrictEqual(input);
  });

  it('propagates the root, sibling fields, path, and absolute offsets through nested arrays', () => {
    const observed: Array<{ path: readonly PropertyKey[]; offset: number }> = [];
    const schema = bf.object([
      ['count', bf.uint8()],
      [
        'records',
        bf.array(
          bf.object([
            ['size', bf.uint8()],
            [
              'data',
              bf.bytes((context) => {
                const siblings =
                  'decodedObject' in context ? context.decodedObject : context.encodedObject;
                expect(context.root).toMatchObject({ count: 2 });
                expect(Object.keys(siblings)).toStrictEqual(['size']);
                observed.push({ path: context.path, offset: context.byteOffset });
                return Number(siblings['size']);
              }),
            ],
          ]),
          ({ context, index }) => {
            const siblings =
              'decodedObject' in context ? context.decodedObject : context.encodedObject;
            return index < Number(siblings['count']);
          }
        ),
      ],
    ]);
    const bytes = Uint8Array.of(2, 1, 7, 2, 8, 9);
    const value = {
      count: 2,
      records: [
        { size: 1, data: Uint8Array.of(7) },
        { size: 2, data: Uint8Array.of(8, 9) },
      ],
    };
    expect(bf.decode(schema, bytes, { requireEOF: true })).toStrictEqual(value);
    expect(bf.encode(schema, value)).toStrictEqual(bytes);
    expect(observed).toStrictEqual([
      { path: ['records', 0, 'data'], offset: 2 },
      { path: ['records', 1, 'data'], offset: 4 },
      { path: ['records', 0, 'data'], offset: 2 },
      { path: ['records', 1, 'data'], offset: 4 },
    ]);
  });
});
