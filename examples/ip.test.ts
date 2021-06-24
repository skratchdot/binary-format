import { IpFormat } from './ip';

test('ip', () => {
  const buffer = Buffer.from('450002c5939900002c06ef98adc24f6c850186d1', 'hex');
  const r1 = IpFormat.read(buffer);
  const r2 = IpFormat.write(r1);
  expect(r1).toMatchInlineSnapshot(`
    Object {
      "checksum": 61336,
      "dst": Array [
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
      "src": Array [
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
  expect(r2).toMatchInlineSnapshot(
    `Buffer<45 00 02 c5 93 99 00 00 2c 06 ef 98 ad c2 4f 6c 85 01 86 d1>`
  );
  expect(r2).toEqual(buffer);
});
