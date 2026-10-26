import * as bf from '../index';

import { describe, expect, it } from 'vitest';

describe('object schema', () => {
  it('decodes and encodes hello world with inferred object types', () => {
    const helloWorldSchema = bf.object([
      ['hello', bf.string(5)],
      ['asciiSpace', bf.uint8()],
      ['world', bf.string(5)],
      ['asciiExclamation', bf.uint8()],
    ]);
    type HelloWorld = bf.infer<typeof helloWorldSchema>;

    const buffer = new TextEncoder().encode('hello world!');
    const readResult: HelloWorld = bf.decode(helloWorldSchema, buffer);
    const writeResult = bf.encode(helloWorldSchema, readResult);

    expect(readResult).toMatchInlineSnapshot(`
      {
        "asciiExclamation": 33,
        "asciiSpace": 32,
        "hello": "hello",
        "world": "world",
      }
    `);
    expect([...writeResult]).toStrictEqual([...buffer]);
  });

  it('supports context-based byte lengths', () => {
    const schema = bf.object([
      ['length', bf.uint8()],
      [
        'payload',
        bf.bytes((context) => {
          const currentObject =
            'decodedObject' in context ? context.decodedObject : context.encodedObject;
          return Number(currentObject['length']);
        }),
      ],
    ]);

    const decoded = bf.decode(schema, Uint8Array.from([3, 0xaa, 0xbb, 0xcc]));

    expect(decoded).toStrictEqual({
      length: 3,
      payload: Uint8Array.from([0xaa, 0xbb, 0xcc]),
    });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([3, 0xaa, 0xbb, 0xcc]);
  });

  it('keeps undefined custom fields by default and can omit them per field', () => {
    const optionalSchema = bf.custom<undefined>({
      kind: 'optional',
      decode: () => ({ result: undefined, bytesDecoded: 0, bitsDecoded: 0 }),
      encode: () => ({
        result: new Uint8Array(),
        bytesEncoded: 0,
        bitsEncoded: 0,
      }),
    });

    const schema = bf.object([
      ['kept', optionalSchema],
      ['omitted', optionalSchema, { omitUndefined: true }],
      ['value', bf.uint8()],
    ]);

    const decoded = bf.decode(schema, Uint8Array.from([5]));

    expect(Object.keys(decoded)).toStrictEqual(['kept', 'value']);
    expect(decoded).toStrictEqual({ kept: undefined, value: 5 });
    expect([...bf.encode(schema, decoded)]).toStrictEqual([5]);
  });

  it('adds nested field paths to decode errors', () => {
    const schema = bf.object([
      [
        'header',
        bf.object([
          ['magic', bf.constant([0xde, 0xad])],
          ['version', bf.uint8()],
        ]),
      ],
    ]);

    expect(() => bf.decode(schema, Uint8Array.from([0xde, 0xef, 1]))).toThrow(
      'binary format error at header.magic (byteOffset 0, bitOffset 0) in constant: constant mismatch at byte offset 0: expected de ad but received de ef'
    );
  });
});
