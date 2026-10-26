import * as bf from '../src/index';

import { expect, test } from 'vitest';
import { TcpSchema } from './tcp';

test('tcp', () => {
  const bytes = bf.bytesFromHex(
    'e8a203e108e177e13d20756b801829d3004100000101080a2ea486ba793310bc'
  );
  const decoded = bf.decode(TcpSchema, bytes);
  const encoded = bf.encode(TcpSchema, decoded);

  expect(decoded).toMatchInlineSnapshot(`
    {
      "ack": 1025537387,
      "checksum": 65,
      "dataOffset": 8,
      "dstPort": 993,
      "flagAck": 1,
      "flagFin": 0,
      "flagPsh": 1,
      "flagRst": 0,
      "flagSyn": 0,
      "flagUrg": 0,
      "reserved": 0,
      "seq": 148994017,
      "srcPort": 59554,
      "urgentPointer": 0,
      "windowSize": 10707,
    }
  `);
  expect(encoded).toStrictEqual(bytes.subarray(0, encoded.byteLength));
  expect(encoded).not.toStrictEqual(bytes);
});
