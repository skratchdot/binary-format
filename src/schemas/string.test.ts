import * as bf from '../index';

import { describe, expect, it } from 'vitest';

describe('string schema', () => {
  it('supports utf8 strings', () => {
    const schema = bf.object([
      ['ascii', bf.string(2)],
      ['utf8', bf.string(2)],
    ]);

    const decoded = bf.decode(schema, Uint8Array.from([0x68, 0x69, 0xc3, 0xa9]));

    expect(decoded).toStrictEqual({
      ascii: 'hi',
      utf8: 'é',
    });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([0x68, 0x69, 0xc3, 0xa9]);
  });

  it('supports context-based string lengths', () => {
    const schema = bf.object([
      ['nameLength', bf.uint8()],
      [
        'name',
        bf.string((context) => {
          const currentObject =
            'decodedObject' in context ? context.decodedObject : context.encodedObject;
          return Number(currentObject['nameLength']);
        }),
      ],
    ]);

    const decoded = bf.decode(schema, new TextEncoder().encode('\u{5}hello'));

    expect(decoded).toStrictEqual({
      nameLength: 5,
      name: 'hello',
    });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([5, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
  });
});
