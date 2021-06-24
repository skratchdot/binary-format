import BinaryBuffer from '../binary-buffer';
import { ReadAndWrite, ReadFunction, WriteFunction } from '../types';

export const arrayRead =
  <R>(length: number, fn: (binaryBuffer: BinaryBuffer) => R) =>
  (binaryBuffer: BinaryBuffer): R[] => {
    const arr = [];
    for (let i = 0; i < length; i++) {
      arr.push(fn(binaryBuffer));
    }
    return arr;
  };

export const arrayWrite =
  (length: number, fn: (binaryBuffer: BinaryBuffer, value: unknown) => void) =>
  (binaryBuffer: BinaryBuffer, value: unknown): void => {
    if (!Array.isArray(value)) {
      throw new Error(
        `cannot write an array since value passed is not an array: "${value}"`
      );
    } else if (value.length !== length) {
      throw new Error(
        `expected an array of length ${length}, but was passed an array with length ${value.length}`
      );
    }
    for (let i = 0; i < length; i++) {
      fn(binaryBuffer, value[i]);
    }
  };

export const arrayStep = (
  length: number,
  read: ReadFunction,
  write: WriteFunction
): ReadAndWrite => ({
  read: arrayRead(length, read),
  write: arrayWrite(length, write),
});
