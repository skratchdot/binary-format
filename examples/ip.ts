// ported from: https://github.com/keichi/binary-parser/blob/master/example/ip.js
import BinaryFormat from '../src/binary-format';

export interface Ip {
  version: number;
  headerLength: number;
  tos: number;
  packetLength: number;
  id: number;
  offset: number;
  fragOffset: number;
  ttl: number;
  protocol: number;
  checksum: number;
  src: number;
  dst: number;
}

export const IpFormat = new BinaryFormat<Ip>()
  .endianess('big')
  .bit4('version')
  .bit4('headerLength')
  .uint8('tos')
  .uint16('packetLength')
  .uint16('id')
  .bit3('offset')
  .bit13('fragOffset')
  .uint8('ttl')
  .uint8('protocol')
  .uint16('checksum')
  .uint8('src')
  .toArray(4)
  .uint8('dst')
  .toArray(4)
  .done();
