import * as bf from '../index';

import { describe, expect, it } from 'vitest';

describe('latin1 schema', () => {
  it('supports one-byte latin1 strings', () => {
    const schema = bf.object([
      ['ascii', bf.latin1(2)],
      ['accented', bf.latin1(1)],
    ]);

    const decoded = bf.decode(schema, Uint8Array.from([0x68, 0x69, 0xe9]));

    expect(decoded).toStrictEqual({
      accented: 'é',
      ascii: 'hi',
    });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([0x68, 0x69, 0xe9]);
  });

  it('pads and truncates to fixed byte lengths', () => {
    const schema = bf.object([
      ['short', bf.latin1(3)],
      ['long', bf.latin1(2)],
    ]);

    expect([
      ...bf.encode(schema, {
        long: 'abcd',
        short: 'é',
      }),
    ]).toStrictEqual([0xe9, 0x00, 0x00, 0x61, 0x62]);
  });

  it('throws for code units outside latin1', () => {
    const schema = bf.latin1(2);

    expect(() => bf.encode(schema, 'Ā')).toThrow('latin1 value contains code units above 0xff');
  });

  it('can replace code units outside latin1', () => {
    const schema = bf.latin1(4, { outOfRange: 'replace' });

    expect([...bf.encode(schema, 'aĀ😀')]).toStrictEqual([0x61, 0x3f, 0x3f, 0x3f]);
  });

  it('can truncate code units outside latin1', () => {
    const schema = bf.latin1(4, { outOfRange: 'truncate' });

    expect([...bf.encode(schema, 'aĀ😀')]).toStrictEqual([0x61, 0x00, 0x3d, 0x00]);
  });
});
