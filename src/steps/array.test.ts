import BinaryBuffer from '../binary-buffer';
import { arrayRead, arrayStep, arrayWrite } from './array';

describe('array tests', () => {
  describe('arrayRead', () => {
    test('reads 5 numbers', () => {
      const result = arrayRead(5, () => 42)(new BinaryBuffer());
      expect(result).toEqual([42, 42, 42, 42, 42]);
    });
  });
  describe('arrayWrite', () => {
    test('writes 5 numbers', () => {
      const bb = new BinaryBuffer();
      arrayWrite(5, (binaryBuffer, value) =>
        binaryBuffer.rw.writeInt8(Number(value))
      )(bb, [1, 2, 3, 4, 5]);
      expect(bb.toBuffer()).toMatchInlineSnapshot(`Buffer<01 02 03 04 05>`);
    });
    test('throws when not passed an array', () => {
      expect(() => {
        arrayWrite(5, (binaryBuffer, value) =>
          binaryBuffer.rw.writeInt8(Number(value))
        )(new BinaryBuffer(), 42);
      }).toThrowError(
        'cannot write an array since value passed is not an array: "42"'
      );
    });
    test('throws when not passed an array with the correct length', () => {
      expect(() => {
        arrayWrite(5, (binaryBuffer, value) =>
          binaryBuffer.rw.writeInt8(Number(value))
        )(new BinaryBuffer(), [1, 2, 3]);
      }).toThrowError(
        'expected an array of length 5, but was passed an array with length 3'
      );
    });
  });
  describe('arrayStep', () => {
    test('calls read/write the correct number of times', () => {
      const arrayLength = 2;
      const bb = new BinaryBuffer();
      const read = jest.fn();
      const write = jest.fn();
      const result = arrayStep(arrayLength, read, write);
      expect(read).toHaveBeenCalledTimes(0);
      expect(write).toHaveBeenCalledTimes(0);
      result.read(bb);
      expect(read).toHaveBeenCalledTimes(arrayLength);
      expect(write).toHaveBeenCalledTimes(0);
      result.write(
        bb,
        Array.from({ length: arrayLength }).map(() => 42)
      );
      expect(read).toHaveBeenCalledTimes(arrayLength);
      expect(write).toHaveBeenCalledTimes(arrayLength);
    });
  });
});
