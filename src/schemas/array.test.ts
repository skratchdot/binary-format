import * as bf from '../index';

import { describe, expect, it } from 'vitest';

describe('array schema', () => {
  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid fixed length %s for decode and encode',
    (length) => {
      const schema = bf.array(bf.uint8(), length);
      expect(() => bf.decode(schema, Uint8Array.of(1, 2))).toThrow(
        'array length must be a non-negative integer'
      );
      expect(() => bf.encode(schema, [1, 2])).toThrow(
        'array length must be a non-negative integer'
      );
    }
  );

  it('supports empty fixed arrays', () => {
    const schema = bf.array(bf.uint8(), 0);
    expect(bf.decode(schema, new Uint8Array())).toStrictEqual([]);
    expect(bf.encode(schema, [])).toStrictEqual(new Uint8Array());
  });

  it('supports fixed arrays and eof arrays', () => {
    const schema = bf.object([
      ['header', bf.array(bf.uint8(), 2)],
      ['body', bf.array(bf.uint16be(), 'eof')],
    ]);

    const decoded = bf.decode(schema, Uint8Array.from([0xaa, 0xbb, 0x00, 0x01, 0x00, 0x02]));

    expect(decoded).toStrictEqual({
      header: [0xaa, 0xbb],
      body: [1, 2],
    });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([0xaa, 0xbb, 0x00, 0x01, 0x00, 0x02]);
  });

  it('supports choices selected from byte offsets', () => {
    const mono = bf.object([['kind', bf.uint8()]]);
    const stereo = bf.object([['kind', bf.uint16be()]]);
    const schema = bf.array(
      bf.choice((context) => (context.byteOffset < 1 ? 0 : 1), {
        0: mono,
        1: stereo,
      }),
      2
    );

    const decoded = bf.decode(schema, Uint8Array.from([0x7f, 0x12, 0x34]));

    expect(decoded).toStrictEqual([{ kind: 0x7f }, { kind: 0x12_34 }]);
    expect([...bf.encode(schema, decoded)]).toStrictEqual([0x7f, 0x12, 0x34]);
  });

  it('adds array indexes to encode errors', () => {
    const schema = bf.array(bf.uint8(), 2);

    expect(() => bf.encode(schema, [1, 300])).toThrow(
      'binary format error at [1] (byteOffset 1, bitOffset 0) in uint8: uint8 value is out of range'
    );
  });
});
