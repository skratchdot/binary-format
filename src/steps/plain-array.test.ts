import { plainArrayRead, plainArrayStep } from './plain-array';

import BinaryBuffer from '../binary-buffer';
import createBinaryBuffer from '../util/create-binary-buffer';

describe('plain-array', () => {
  describe('plainArrayRead', () => {
    test('can read a plainarray of length 5', () => {
      const bb = createBinaryBuffer('hello world');
      const step = plainArrayStep(5);
      const result = step.read(bb);
      expect(result).toMatchInlineSnapshot(`
        [
          104,
          101,
          108,
          108,
          111,
        ]
      `);
    });
    test('returns an empty array if not called with a buffer', () => {
      const bb = createBinaryBuffer('hello world');
      const result = plainArrayRead(() => 42)(bb);
      expect(result).toMatchInlineSnapshot(`[]`);
    });
  });
  describe('plainArrayWrite', () => {
    test('can write a buffer of length 5', () => {
      const bb = new BinaryBuffer();
      const step = plainArrayStep(5);
      step.write(bb, [104, 101, 108, 108, 111]);
      expect(bb.rw.writeOffset).toMatchInlineSnapshot(`5`);
      expect(bb.toBuffer()).toMatchInlineSnapshot(`Buffer<68 65 6c 6c 6f>`);
    });
    test('writes nothing if not called with an array', () => {
      const bb = new BinaryBuffer();
      const step = plainArrayStep(5);
      step.write(bb, 42);
      expect(bb.rw.writeOffset).toMatchInlineSnapshot(`0`);
      expect(bb.toBuffer()).toMatchInlineSnapshot(`Buffer<>`);
    });
  });
});
