import * as bf from '../index';

import { describe, expect, it } from 'vitest';

describe('root encode/decode helpers', () => {
  it.each([1, 7, 9, 31])('rejects partial-byte root encoding for %i bits', (width) => {
    expect(() => bf.encode(bf.bit(width), 1)).toThrow('schema encoded a partial byte');
    expect(() => bf.decode(bf.bit(width), new Uint8Array(4))).toThrow(
      'schema decoded a partial byte'
    );
  });

  it.each([8, 16, 24, 32])('round trips byte-aligned root bit schemas of %i bits', (width) => {
    const schema = bf.bit(width);
    const value = 2 ** width - 1;
    const encoded = bf.encode(schema, value);
    expect(encoded).toHaveLength(width / 8);
    expect(bf.decode(schema, encoded, { requireEOF: true })).toBe(value);
  });

  it('can require EOF at the root decode helper', () => {
    const schema = bf.object([['value', bf.uint8()]]);

    expect(bf.decode(schema, Uint8Array.from([1, 2]))).toStrictEqual({
      value: 1,
    });
    expect(() => bf.decode(schema, Uint8Array.from([1, 2]), { requireEOF: true })).toThrow(
      'expected EOF at byte offset 1 but input has 2 byte(s)'
    );
  });
});
