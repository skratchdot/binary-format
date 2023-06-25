import { Buffer } from 'buffer';
import { TcpFormat } from './tcp';

test('tcp', () => {
  const buffer = Buffer.from(
    'e8a203e108e177e13d20756b801829d3004100000101080a2ea486ba793310bc',
    'hex'
  );
  const r1 = TcpFormat.read(buffer);
  const r2 = TcpFormat.write(r1);
  expect(r1).toMatchInlineSnapshot(`
    {
      "ack": 1025537387,
      "checksum": 65,
      "dataOffset": 8,
      "dstPort": 993,
      "flag_ack": 1,
      "flag_fin": 0,
      "flag_psh": 1,
      "flag_rst": 0,
      "flag_syn": 0,
      "flag_urg": 0,
      "reserved": 0,
      "seq": 148994017,
      "srcPort": 59554,
      "urgentPointer": 0,
      "windowSize": 10707,
    }
  `);
  expect(r2).toMatchInlineSnapshot(
    `Buffer<e8 a2 03 e1 08 e1 77 e1 3d 20 75 6b 80 18 29 d3 00 41 00 00>`
  );
  // Note: this parser is not complete and does not read/write the same data
  expect(r2).not.toEqual(buffer);
  expect(buffer).toMatchInlineSnapshot(`
    Buffer<
      e8 a2 03 e1 08 e1 77 e1 3d 20 75 6b 80 18 29 d3 00 41 00 00 01 01 08 0a 2e a4
      86 ba 79 33 10 bc
    >
  `);
});
