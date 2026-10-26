// cspell:ignore: Pels
// ported from: https://github.com/keichi/binary-parser/blob/master/example/bmp.js
import * as bf from '../src/index';

export const BitmapFileHeaderSchema = bf.object([
  ['type', bf.string(2)],
  ['size', bf.uint32le()],
  ['reserved1', bf.uint16le()],
  ['reserved2', bf.uint16le()],
  ['offBits', bf.uint32le()],
]);

export type BitmapFileHeader = bf.infer<typeof BitmapFileHeaderSchema>;

export const BitmapInfoHeaderSchema = bf.object([
  ['size', bf.uint32le()],
  ['width', bf.int32le()],
  ['height', bf.int32le()],
  ['planes', bf.uint16le()],
  ['bitCount', bf.uint16le()],
  ['compression', bf.uint32le()],
  ['sizeImage', bf.uint32le()],
  ['xPelsPerMeter', bf.int32le()],
  ['yPelsPerMeter', bf.int32le()],
  ['clrUsed', bf.uint32le()],
  ['clrImportant', bf.uint32le()],
]);

export type BitmapInfoHeader = bf.infer<typeof BitmapInfoHeaderSchema>;

export const BitmapSchema = bf.object([
  ['fileHeader', BitmapFileHeaderSchema],
  ['infoHeader', BitmapInfoHeaderSchema],
]);

export type Bitmap = bf.infer<typeof BitmapSchema>;
