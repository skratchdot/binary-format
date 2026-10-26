import * as bf from '../index';

import { describe, expect, it } from 'vitest';

describe('number schemas', () => {
  it('supports DataView-style endian booleans and named endian helpers', () => {
    const schema = bf.object([
      ['defaultEndian', bf.uint16()],
      ['bigEndian', bf.uint16be()],
      ['littleEndianFromBoolean', bf.uint16(true)],
      ['littleEndianFromHelper', bf.uint16le()],
    ]);

    const decoded = bf.decode(
      schema,
      Uint8Array.from([0x12, 0x34, 0x12, 0x34, 0x34, 0x12, 0x34, 0x12])
    );

    expect(decoded).toStrictEqual({
      defaultEndian: 0x12_34,
      bigEndian: 0x12_34,
      littleEndianFromBoolean: 0x12_34,
      littleEndianFromHelper: 0x12_34,
    });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([
      0x12, 0x34, 0x12, 0x34, 0x34, 0x12, 0x34, 0x12,
    ]);
  });
});
