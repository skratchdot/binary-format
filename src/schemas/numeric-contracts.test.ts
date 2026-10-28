import * as bf from '../index';
import { describe, expect, it } from 'vitest';

// Literal wire values catch endian/signedness mistakes that a round trip alone can hide.
const integerFamilies = [
  {
    name: 'int16',
    factory: bf.int16,
    be: bf.int16be,
    le: bf.int16le,
    min: -32768,
    max: 32767,
    sample: 0x1234,
    hex: '1234',
    minHex: '8000',
    maxHex: '7fff',
  },
  {
    name: 'uint16',
    factory: bf.uint16,
    be: bf.uint16be,
    le: bf.uint16le,
    min: 0,
    max: 65535,
    sample: 0x1234,
    hex: '1234',
    minHex: '0000',
    maxHex: 'ffff',
  },
  {
    name: 'int32',
    factory: bf.int32,
    be: bf.int32be,
    le: bf.int32le,
    min: -2147483648,
    max: 2147483647,
    sample: 0x12345678,
    hex: '12345678',
    minHex: '80000000',
    maxHex: '7fffffff',
  },
  {
    name: 'uint32',
    factory: bf.uint32,
    be: bf.uint32be,
    le: bf.uint32le,
    min: 0,
    max: 4294967295,
    sample: 0x12345678,
    hex: '12345678',
    minHex: '00000000',
    maxHex: 'ffffffff',
  },
];
const bigintFamilies = [
  {
    name: 'int64',
    factory: bf.int64,
    be: bf.int64be,
    le: bf.int64le,
    min: -9223372036854775808n,
    max: 9223372036854775807n,
    sample: 0x0123456789abcdefn,
    hex: '0123456789abcdef',
    minHex: '8000000000000000',
    maxHex: '7fffffffffffffff',
  },
  {
    name: 'uint64',
    factory: bf.uint64,
    be: bf.uint64be,
    le: bf.uint64le,
    min: 0n,
    max: 18446744073709551615n,
    sample: 0x0123456789abcdefn,
    hex: '0123456789abcdef',
    minHex: '0000000000000000',
    maxHex: 'ffffffffffffffff',
  },
];

function variants<T>(family: {
  name: string;
  factory: (littleEndian?: boolean) => bf.Schema<T>;
  be: () => bf.Schema<T>;
  le: () => bf.Schema<T>;
}) {
  return [
    { name: `${family.name}()`, schema: family.factory(), littleEndian: false },
    { name: `${family.name}(false)`, schema: family.factory(false), littleEndian: false },
    { name: `${family.name}(true)`, schema: family.factory(true), littleEndian: true },
    { name: `${family.name}be()`, schema: family.be(), littleEndian: false },
    { name: `${family.name}le()`, schema: family.le(), littleEndian: true },
  ];
}

function wire(hex: string, littleEndian: boolean): Uint8Array {
  const bytes = Uint8Array.from(Buffer.from(hex, 'hex'));
  return littleEndian ? bytes.reverse() : bytes;
}

function checkWire<T extends number | bigint>(
  schema: bf.Schema<T>,
  value: T,
  expected: Uint8Array
) {
  expect(bf.encode(schema, value)).toStrictEqual(expected);
  expect(bf.decode(schema, expected, { requireEOF: true })).toBe(value);
}

function checkInputViews<T extends number | bigint>(
  schema: bf.Schema<T>,
  value: T,
  expected: Uint8Array
) {
  const padded = new Uint8Array(expected.length + 4).fill(0xee);
  padded.set(expected, 2);
  const inputs = [
    expected.slice().buffer,
    padded.subarray(2, 2 + expected.length),
    new DataView(padded.buffer, 2, expected.length),
    Buffer.from(padded.buffer, 2, expected.length),
  ];
  for (const input of inputs) {
    expect(bf.decode(schema, input, { requireEOF: true })).toBe(value);
  }
  // A short view must not read sentinel bytes that exist outside the view.
  for (let length = 0; length < expected.length; length++) {
    expect(() => bf.decode(schema, new DataView(padded.buffer, 2, length))).toThrow(RangeError);
  }
}

const byteFamilies = [
  {
    name: 'int8()',
    schema: bf.int8(),
    min: -128,
    max: 127,
    sample: -2,
    hex: 'fe',
    minHex: '80',
    maxHex: '7f',
    littleEndian: false,
  },
  {
    name: 'uint8()',
    schema: bf.uint8(),
    min: 0,
    max: 255,
    sample: 254,
    hex: 'fe',
    minHex: '00',
    maxHex: 'ff',
    littleEndian: false,
  },
];
const integers = [
  ...byteFamilies,
  ...integerFamilies.flatMap((family) =>
    variants(family).map((variant) => ({ ...family, ...variant }))
  ),
];

for (const row of integers) {
  describe(row.name, () => {
    it('matches known wire values at the boundaries and within the range', () => {
      checkWire(row.schema, row.min, wire(row.minHex, row.littleEndian));
      checkWire(row.schema, row.max, wire(row.maxHex, row.littleEndian));
      checkWire(row.schema, row.sample, wire(row.hex, row.littleEndian));
    });
    it('honors input view bounds and rejects truncated input', () => {
      checkInputViews(row.schema, row.sample, wire(row.hex, row.littleEndian));
    });
    it('rejects overflow, fractions, non-finite numbers, and non-number values', () => {
      for (const value of [row.min - 1, row.max + 1, 1.5, NaN, Infinity, -Infinity]) {
        expect(() => bf.encode(row.schema, value)).toThrow(RangeError);
      }
      for (const value of ['1', 1n, null, undefined, true]) {
        expect(() => bf.encode(row.schema, value as never)).toThrow(TypeError);
      }
    });
  });
}

for (const family of bigintFamilies) {
  for (const row of variants(family)) {
    describe(row.name, () => {
      it('preserves all 64 bits at the boundaries and above Number.MAX_SAFE_INTEGER', () => {
        checkWire(row.schema, family.min, wire(family.minHex, row.littleEndian));
        checkWire(row.schema, family.max, wire(family.maxHex, row.littleEndian));
        checkWire(row.schema, family.sample, wire(family.hex, row.littleEndian));
      });
      it('honors input view bounds and rejects truncated input', () => {
        checkInputViews(row.schema, family.sample, wire(family.hex, row.littleEndian));
      });
      it('rejects overflow and non-bigint values', () => {
        for (const value of [family.min - 1n, family.max + 1n]) {
          expect(() => bf.encode(row.schema, value)).toThrow(RangeError);
        }
        for (const value of [1, '1', null, undefined, true]) {
          expect(() => bf.encode(row.schema, value as never)).toThrow(TypeError);
        }
      });
    });
  }
}

const floatFamilies = [
  {
    name: 'float32',
    factory: bf.float32,
    be: bf.float32be,
    le: bf.float32le,
    hex: '3fc00000',
    negativeZero: '80000000',
    positiveInfinity: '7f800000',
    negativeInfinity: 'ff800000',
    nan: '7fc00001',
  },
  {
    name: 'float64',
    factory: bf.float64,
    be: bf.float64be,
    le: bf.float64le,
    hex: '3ff8000000000000',
    negativeZero: '8000000000000000',
    positiveInfinity: '7ff0000000000000',
    negativeInfinity: 'fff0000000000000',
    nan: '7ff8000000000001',
  },
];
for (const family of floatFamilies) {
  for (const row of variants(family)) {
    describe(row.name, () => {
      it('matches IEEE-754 wire values including signed zero and infinities', () => {
        checkWire(row.schema, 1.5, wire(family.hex, row.littleEndian));
        checkWire(row.schema, -0, wire(family.negativeZero, row.littleEndian));
        checkWire(row.schema, Infinity, wire(family.positiveInfinity, row.littleEndian));
        checkWire(row.schema, -Infinity, wire(family.negativeInfinity, row.littleEndian));
        expect(bf.decode(row.schema, wire(family.nan, row.littleEndian))).toBeNaN();
        // NaN payload bits are not part of the public contract.
        expect(bf.decode(row.schema, bf.encode(row.schema, NaN))).toBeNaN();
      });
      it('honors input view bounds and rejects truncated input', () => {
        checkInputViews(row.schema, 1.5, wire(family.hex, row.littleEndian));
      });
      it('rejects non-number values', () => {
        for (const value of ['1.5', 1n, null, undefined, true]) {
          expect(() => bf.encode(row.schema, value as never)).toThrow(TypeError);
        }
      });
    });
  }
}

it('rounds float32 to its representable precision', () => {
  expect(bf.encode(bf.float32be(), 0.1)).toStrictEqual(wire('3dcccccd', false));
  expect(bf.decode(bf.float32be(), wire('3dcccccd', false))).toBe(0.10000000149011612);
});
