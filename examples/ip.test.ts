import * as bf from '../src/index';

import { expect, test } from 'vitest';
import { IpSchema } from './ip';

test('ip', () => {
  const bytes = bf.bytesFromHex('450002c5939900002c06ef98adc24f6c850186d1');
  const decoded = bf.decode(IpSchema, bytes);
  const encoded = bf.encode(IpSchema, decoded);

  expect(decoded).toMatchInlineSnapshot(`
    {
      "checksum": 61336,
      "dst": [
        133,
        1,
        134,
        209,
      ],
      "fragOffset": 0,
      "headerLength": 5,
      "id": 37785,
      "offset": 0,
      "packetLength": 709,
      "protocol": 6,
      "src": [
        173,
        194,
        79,
        108,
      ],
      "tos": 0,
      "ttl": 44,
      "version": 4,
    }
  `);
  expect(encoded).toStrictEqual(bytes);
});
