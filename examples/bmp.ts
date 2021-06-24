// ported from: https://github.com/keichi/binary-parser/blob/master/example/bmp.js
import BinaryFormat from '../src/binary-format';

export interface BitmapFileHeader {
  type: string;
  size: number;
  reserved1: number;
  reserved2: number;
  offBits: number;
}
export const BitmapFileHeaderFormat = new BinaryFormat<BitmapFileHeader>()
  .endianess('little')
  .string('type', 2) // TODO: assert type === 'BM'
  .uint32('size')
  .uint16('reserved1')
  .uint16('reserved2')
  .uint32('offBits')
  .done();

export interface BitmapInfoHeader {
  size: number;
  width: number;
  height: number;
  planes: number;
  bitCount: number;
  compression: number;
  sizeImage: number;
  xPelsPerMeter: number;
  yPelsPerMeter: number;
  clrUsed: number;
  clrImportant: number;
}
export const BitmapInfoHeaderFormat = new BinaryFormat<BitmapInfoHeader>()
  .endianess('little')
  .uint32('size')
  .int32('width')
  .int32('height')
  .uint16('planes')
  .uint16('bitCount')
  .uint32('compression')
  .uint32('sizeImage')
  .int32('xPelsPerMeter')
  .int32('yPelsPerMeter')
  .uint32('clrUsed')
  .uint32('clrImportant')
  .done();

export interface Bitmap {
  fileHeader: BitmapFileHeader;
  infoHeader: BitmapInfoHeader;
}
export const BitmapFormat = new BinaryFormat<Bitmap>()
  .custom('fileHeader', BitmapFileHeaderFormat)
  .custom('infoHeader', BitmapInfoHeaderFormat)
  .done();
