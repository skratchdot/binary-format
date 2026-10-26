// cspell:ignore Pels
import * as bf from '../src/index';

import { expect, test } from 'vitest';
import { BitmapSchema } from './bmp';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

test('bmp (bitmap)', async () => {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const bytes = new Uint8Array(
    await fs.promises.readFile(
      path.resolve(currentDirectory, './data/test.bmp')
    )
  );
  const decoded = bf.decode(BitmapSchema, bytes);
  const encoded = bf.encode(BitmapSchema, decoded);

  expect(decoded).toMatchInlineSnapshot(`
    {
      "fileHeader": {
        "offBits": 54,
        "reserved1": 0,
        "reserved2": 0,
        "size": 46182,
        "type": "BM",
      },
      "infoHeader": {
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
  expect(encoded).toStrictEqual(
    bf.bytesFromHex(`
      42 4d 66 b4 00 00 00 00 00 00 36 00 00 00 28 00 00 00 7c 00 00 00
      7c 00 00 00 01 00 18 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
      00 00 00 00 00 00 00 00 00 00
    `)
  );
  expect(encoded).not.toStrictEqual(bytes);
});
