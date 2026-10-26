// ported from: https://github.com/keichi/binary-parser/blob/master/example/ip.js
import * as bf from '../src/index';

export const IpSchema = bf.object([
  ['version', bf.bit4()],
  ['headerLength', bf.bit4()],
  ['tos', bf.uint8()],
  ['packetLength', bf.uint16be()],
  ['id', bf.uint16be()],
  ['offset', bf.bit3()],
  ['fragOffset', bf.bit13()],
  ['ttl', bf.uint8()],
  ['protocol', bf.uint8()],
  ['checksum', bf.uint16be()],
  ['src', bf.plainArray(4)],
  ['dst', bf.plainArray(4)],
]);

export type Ip = bf.infer<typeof IpSchema>;
