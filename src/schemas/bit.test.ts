import * as bf from '../index';

import { describe, expect, it } from 'vitest';

describe('bit schemas', () => {
  it('supports current big-endian bit ordering', () => {
    const schema = bf.object([
      ['a', bf.bit4()],
      ['b', bf.bit4()],
    ]);

    const decoded = bf.decode(schema, Uint8Array.from([0xab]));

    expect(decoded).toStrictEqual({ a: 10, b: 11 });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([0xab]);
  });

  it('supports current little-endian bit ordering', () => {
    const schema = bf.object([
      ['b', bf.bit4(true)],
      ['a', bf.bit4(true)],
    ]);

    const decoded = bf.decode(schema, Uint8Array.from([0xab]));

    expect(decoded).toStrictEqual({ a: 10, b: 11 });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([0xab]);
  });

  it('supports mixed bit lengths before byte-aligned schemas', () => {
    const schema = bf.object([
      ['h1', bf.bit(4)],
      ['h2', bf.bit(4)],
      ['e1', bf.bit8()],
      ['ll', bf.bit16()],
      ['o1', bf.bit3()],
      ['o2', bf.bit2()],
      ['o3', bf.bit3()],
      ['space', bf.uint8()],
      ['world', bf.bytes(5)],
      ['exclamation', bf.uint8()],
    ]);

    const buffer = new TextEncoder().encode('hello world!');
    const decoded = bf.decode(schema, buffer);

    expect(decoded).toStrictEqual({
      h1: 6,
      h2: 8,
      e1: 101,
      ll: 27_756,
      o1: 3,
      o2: 1,
      o3: 7,
      space: 32,
      world: new TextEncoder().encode('world'),
      exclamation: 33,
    });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([...buffer]);
  });

  it('throws when object bit fields do not end on a byte boundary', () => {
    const schema = bf.object([['a', bf.bit4()]]);

    expect(() => bf.decode(schema, Uint8Array.from([0xab]))).toThrow(
      'object bit fields must end on a byte boundary'
    );
    expect(() => bf.encode(schema, { a: 10 })).toThrow(
      'object bit fields must end on a byte boundary'
    );
  });
});
