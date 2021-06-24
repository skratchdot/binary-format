import fs from 'fs';
import path from 'path';
import { BitmapFormat } from './bmp';

test('bmp (bitmap)', async () => {
  const buffer = await fs.promises.readFile(
    path.resolve(__dirname, './data/test.bmp')
  );
  const r1 = BitmapFormat.read(buffer);
  const r2 = BitmapFormat.write(r1);
  expect(r1).toMatchInlineSnapshot(`
    Object {
      "fileHeader": Object {
        "offBits": 54,
        "reserved1": 0,
        "reserved2": 0,
        "size": 46182,
        "type": "BM",
      },
      "infoHeader": Object {
        "bitCount": 24,
        "clrImportant": 0,
        "clrUsed": 0,
        "compression": 0,
        "height": 124,
        "planes": 1,
        "size": 40,
        "sizeImage": 0,
        "width": 124,
        "xPelsPerMeter": 0,
        "yPelsPerMeter": 0,
      },
    }
  `);
  expect(r2).toMatchInlineSnapshot(`
    Buffer<
      42 4d 66 b4 00 00 00 00 00 00 36 00 00 00 28 00 00 00 7c 00 00 00 7c 00 00 00
      01 00 18 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
      00 00
    >
  `);
  // NOTE: this parser is not complete, and does not write valid bitmap files
  expect(r2).not.toEqual(buffer);
});
