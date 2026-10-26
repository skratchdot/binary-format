import * as bf from '../index';

import { describe, expect, it } from 'vitest';

describe('root encode/decode helpers', () => {
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
