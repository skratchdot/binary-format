import { bigIntRead, bigIntStep, bigIntWrite } from './bigint';

import BinaryBuffer from '../binary-buffer';
import createBinaryBuffer from '../util/create-binary-buffer';

describe('bigint tests', () => {
  describe('bigIntRead', () => {
    test('can call readBigInt64BE', () => {
      const bb = createBinaryBuffer('deadbeefdeadbeef', 'hex');
      const result = bigIntRead('readBigInt64BE')(bb);
      expect(result).toMatchInlineSnapshot(`-2401053088876216593n`);
    });
  });
  describe('bigIntWrite', () => {
    test('can call writeBigInt64BE on a BigInt', () => {
      const bb = new BinaryBuffer();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      bigIntWrite('writeBigInt64BE')(bb, -2401053088876216593n);
      expect(bb.toBuffer()).toMatchInlineSnapshot(
        `Buffer<de ad be ef de ad be ef>`
      );
    });
    test('can call writeBigInt64BE on a number', () => {
      const bb = new BinaryBuffer();
      bigIntWrite('writeBigInt64BE')(bb, 5);
      expect(bb.toBuffer()).toMatchInlineSnapshot(
        `Buffer<00 00 00 00 00 00 00 05>`
      );
    });
    test('can call writeBigInt64BE on a string', () => {
      const bb = new BinaryBuffer();
      bigIntWrite('writeBigInt64BE')(bb, '5');
      expect(bb.toBuffer()).toMatchInlineSnapshot(
        `Buffer<00 00 00 00 00 00 00 05>`
      );
    });
  });
  describe('bigIntStep', () => {
    test('calls the correct read/write methods', () => {
      const step = bigIntStep('BigInt64BE');

      // read
      const bbRead = createBinaryBuffer('deadbeefdeadbeef', 'hex');
      const readResult = step.read(bbRead);
      expect(readResult).toMatchInlineSnapshot(`-2401053088876216593n`);

      // write
      const bbWrite = new BinaryBuffer();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      step.write(bbWrite, -2401053088876216593n);
      expect(bbWrite.toBuffer()).toMatchInlineSnapshot(
        `Buffer<de ad be ef de ad be ef>`
      );
    });
  });
});
