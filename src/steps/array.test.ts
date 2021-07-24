import BinaryBuffer from '../binary-buffer';
import { ArrayLengthParams } from '../types';
import {
  arrayFunctionEof,
  arrayFunctionLength,
  arrayRead,
  arrayStep,
  arrayWrite,
} from './array';

describe('array tests', () => {
  describe('arrayFunctionLength', () => {
    test.each([
      [true, 0, 3],
      [true, 1, 3],
      [true, 2, 3],
      [false, 3, 3],
      [false, 4, 3],
      [false, 5, 3],
    ])(
      'should return %p when index=%p and length=%p',
      (expected, index, length) => {
        expect(
          arrayFunctionLength(length)({
            index,
          } as unknown as ArrayLengthParams)
        ).toEqual(expected);
      }
    );
  });
  describe('arrayFunctionEof', () => {
    test.each([
      [true, 0, 3],
      [true, 1, 3],
      [true, 2, 3],
      [false, 3, 3],
      [false, 4, 3],
      [false, 5, 3],
    ])(
      'when reading: should return %p when buffer.readOffset=%p and buffer.length=%p',
      (expected, readOffset, length) => {
        const binaryBuffer = {
          isReader: true,
          rw: {
            readOffset,
            length,
          },
        };
        expect(
          arrayFunctionEof()({
            binaryBuffer,
          } as unknown as ArrayLengthParams)
        ).toEqual(expected);
      }
    );
    test.each([
      [true, 0, 3],
      [true, 1, 3],
      [true, 2, 3],
      [false, 3, 3],
      [false, 4, 3],
      [false, 5, 3],
    ])(
      'when writing: should return %p when index=%p and array.length=%p',
      (expected, index, length) => {
        const binaryBuffer = { isReader: false };
        const array = Array.from({ length });
        expect(
          arrayFunctionEof()({
            binaryBuffer,
            index,
            array,
          } as unknown as ArrayLengthParams)
        ).toEqual(expected);
      }
    );
  });
  describe('arrayRead', () => {
    test('reads 5 numbers', () => {
      const result = arrayRead(
        arrayFunctionLength(5),
        () => 42
      )(new BinaryBuffer());
      expect(result).toEqual([42, 42, 42, 42, 42]);
    });
  });
  describe('arrayWrite', () => {
    test('writes 5 numbers', () => {
      const bb = new BinaryBuffer();
      arrayWrite(
        arrayFunctionLength(5),
        (binaryBuffer, value) => binaryBuffer.rw.writeInt8(Number(value)),
        5
      )(bb, [1, 2, 3, 4, 5]);
      expect(bb.toBuffer()).toMatchInlineSnapshot(`Buffer<01 02 03 04 05>`);
    });
    test('throws when not passed an array', () => {
      expect(() => {
        arrayWrite(
          arrayFunctionLength(5),
          (binaryBuffer, value) => binaryBuffer.rw.writeInt8(Number(value)),
          5
        )(new BinaryBuffer(), 42);
      }).toThrowError(
        'cannot write an array since value passed is not an array: "42"'
      );
    });
    test('throws when not passed an array with the correct length', () => {
      expect(() => {
        arrayWrite(
          arrayFunctionLength(5),
          (binaryBuffer, value) => binaryBuffer.rw.writeInt8(Number(value)),
          5
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
      const result = arrayStep(
        arrayFunctionLength(arrayLength),
        read,
        write,
        arrayLength
      );
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
