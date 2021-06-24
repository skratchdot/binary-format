import BinaryBuffer from '../binary-buffer';
import createBinaryBuffer from '../util/create-binary-buffer';
import { numberRead, numberStep, numberWrite } from './number';

describe('bigint tests', () => {
  describe('numberRead', () => {
    test('can call readInt32BE', () => {
      const bb = createBinaryBuffer('deadbeef', 'hex');
      const result = numberRead('readInt32BE')(bb);
      expect(result).toMatchInlineSnapshot(`-559038737`);
    });
  });
  describe('numberWrite', () => {
    test('can call writeInt32BE on a number', () => {
      const bb = new BinaryBuffer();
      numberWrite('writeInt32BE')(bb, 5);
      expect(bb.toBuffer()).toMatchInlineSnapshot(`Buffer<00 00 00 05>`);
    });
    test('can call writeInt32BE on a string', () => {
      const bb = new BinaryBuffer();
      numberWrite('writeInt32BE')(bb, '5');
      expect(bb.toBuffer()).toMatchInlineSnapshot(`Buffer<00 00 00 05>`);
    });
  });
  describe('numberStep', () => {
    test('calls the correct read/write methods', () => {
      const step = numberStep('Int32BE');

      // read
      const bbRead = createBinaryBuffer('deadbeef', 'hex');
      const readResult = step.read(bbRead);
      expect(readResult).toMatchInlineSnapshot(`-559038737`);

      // write
      const bbWrite = new BinaryBuffer();
      step.write(bbWrite, -559038737);
      expect(bbWrite.toBuffer()).toMatchInlineSnapshot(`Buffer<de ad be ef>`);
    });
  });
});
