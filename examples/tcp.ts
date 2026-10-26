// ported from: https://github.com/keichi/binary-parser/blob/master/example/tcp.js
import * as bf from '../src/index';

export const TcpSchema = bf.object([
  ['srcPort', bf.uint16be()],
  ['dstPort', bf.uint16be()],
  ['seq', bf.uint32be()],
  ['ack', bf.uint32be()],
  ['dataOffset', bf.bit4()],
  ['reserved', bf.bit6()],
  ['flagUrg', bf.bit1()],
  ['flagAck', bf.bit1()],
  ['flagPsh', bf.bit1()],
  ['flagRst', bf.bit1()],
  ['flagSyn', bf.bit1()],
  ['flagFin', bf.bit1()],
  ['windowSize', bf.uint16be()],
  ['checksum', bf.uint16be()],
  ['urgentPointer', bf.uint16be()],
]);

export type TcpHeader = bf.infer<typeof TcpSchema>;
