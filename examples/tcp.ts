// ported from: https://github.com/keichi/binary-parser/blob/master/example/tcp.js
import BinaryFormat from '../src/binary-format';

export interface TcpHeader {
  srcPort: number;
  dstPort: number;
  seq: number;
  ack: number;
  dataOffset: number;
  reserved: number;
  flag_urg: number;
  flag_ack: number;
  flag_psh: number;
  flag_rst: number;
  flag_syn: number;
  flag_fin: number;
  windowSize: number;
  checksum: number;
  urgentPointer: number;
}

export const TcpFormat = new BinaryFormat<TcpHeader>()
  .endianess('big')
  .uint16('srcPort')
  .uint16('dstPort')
  .uint32('seq')
  .uint32('ack')
  .bit4('dataOffset')
  .bit6('reserved')
  // TODO: allow custom() nodes when bitOffset is not zero so we can had a top-level "flogs"
  .bit1('flag_urg')
  .bit1('flag_ack')
  .bit1('flag_psh')
  .bit1('flag_rst')
  .bit1('flag_syn')
  .bit1('flag_fin')
  .uint16('windowSize')
  .uint16('checksum')
  .uint16('urgentPointer')
  .done();
