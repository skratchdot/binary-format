import * as bf from '../index';

import { describe, expect, it } from 'vitest';

describe('byte range schemas', () => {
  it('supports bytes and plain arrays', () => {
    const schema = bf.object([
      ['raw', bf.bytes(2)],
      ['plain', bf.plainArray(2)],
    ]);

    const decoded = bf.decode(schema, Uint8Array.from([1, 2, 3, 4]));

    expect(decoded).toStrictEqual({
      raw: Uint8Array.from([1, 2]),
      plain: [3, 4],
    });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([1, 2, 3, 4]);
  });

  it('supports skipped byte ranges', () => {
    const schema = bf.object([
      ['prefix', bf.uint8()],
      ['_reserved', bf.skip(2), { omitUndefined: true }],
      ['suffix', bf.uint8()],
    ]);

    const decoded = bf.decode(schema, Uint8Array.from([1, 0xaa, 0xbb, 2]));

    expect(decoded).toStrictEqual({ prefix: 1, suffix: 2 });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([1, 0x00, 0x00, 2]);
  });

  it('supports constant byte ranges', () => {
    const schema = bf.object([
      ['magic', bf.constant([0x80, 0x00, 0x7f, 0xff])],
      ['value', bf.uint8()],
    ]);

    const decoded = bf.decode(schema, Uint8Array.from([0x80, 0x00, 0x7f, 0xff, 5]));

    expect(decoded).toStrictEqual({
      magic: Uint8Array.from([0x80, 0x00, 0x7f, 0xff]),
      value: 5,
    });
    expect([...bf.encode(schema, { value: 5, magic: new Uint8Array() })]).toStrictEqual([
      0x80, 0x00, 0x7f, 0xff, 5,
    ]);
  });

  it('throws when constant bytes do not match', () => {
    const schema = bf.constant([0xde, 0xad]);

    expect(() => bf.decode(schema, Uint8Array.from([0xde, 0xef]))).toThrow(
      'constant mismatch at byte offset 0: expected de ad but received de ef'
    );
  });

  it('converts hex strings to bytes', () => {
    expect([...bf.bytesFromHex('de ad\nbeef')]).toStrictEqual([0xde, 0xad, 0xbe, 0xef]);
  });

  it('validates hex strings', () => {
    expect(() => bf.bytesFromHex('abc')).toThrow(
      'hex string must contain an even number of digits'
    );
    expect(() => bf.bytesFromHex('xx')).toThrow('hex string contains invalid digits');
  });

  it.each(['0g', 'fZ', '-1', '+1', '0x', 'de a!'])('rejects malformed hex %s', (hex) => {
    expect(() => bf.bytesFromHex(hex)).toThrow('hex string contains invalid digits');
  });

  it('accepts empty hex strings and mixed-case digits with whitespace', () => {
    expect(bf.bytesFromHex(' \n')).toStrictEqual(new Uint8Array());
    expect(bf.bytesFromHex('aB CD\t01')).toStrictEqual(Uint8Array.of(0xab, 0xcd, 1));
  });
});
