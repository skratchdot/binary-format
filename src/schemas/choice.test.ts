import * as bf from '../index';

import { describe, expect, it } from 'vitest';

describe('choice schema', () => {
  it('supports choices selected from previously decoded fields', () => {
    const oneBytePayload = bf.object([['value', bf.uint8()]]);
    const twoBytePayload = bf.object([['value', bf.uint16be()]]);
    const schema = bf.object([
      ['tag', bf.uint8()],
      [
        'payload',
        bf.choice(
          (context) => {
            const currentObject =
              'decodedObject' in context ? context.decodedObject : context.encodedObject;
            return 'tag' in currentObject ? Number(currentObject.tag) : undefined;
          },
          {
            1: oneBytePayload,
            2: twoBytePayload,
          }
        ),
      ],
    ]);

    const decoded = bf.decode(schema, Uint8Array.from([2, 0x12, 0x34]));

    expect(decoded).toStrictEqual({
      tag: 2,
      payload: { value: 0x12_34 },
    });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([2, 0x12, 0x34]);
  });
});
