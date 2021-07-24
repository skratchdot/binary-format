import BinaryBuffer from '../binary-buffer';
import {
  ArrayLengthFunction,
  ArrayLengthParams,
  ReadAndWrite,
  ReadFunction,
  WriteFunction,
} from '../types';

export const arrayFunctionLength =
  (length: number): ArrayLengthFunction =>
  ({ index }: ArrayLengthParams): boolean =>
    index < length;

export const arrayFunctionEof =
  (): ArrayLengthFunction =>
  ({ binaryBuffer, index, array }: ArrayLengthParams): boolean => {
    if (binaryBuffer.isReader) {
      return binaryBuffer.rw.readOffset < binaryBuffer.rw.length;
    } else {
      return index < array.length;
    }
  };

export const arrayRead =
  (
    arrayLengthFunction: ArrayLengthFunction,
    readFunction: (binaryBuffer: BinaryBuffer) => unknown
  ) =>
  (binaryBuffer: BinaryBuffer): Array<unknown> => {
    const array: Array<unknown> = [];
    let index = 0;
    while (arrayLengthFunction({ binaryBuffer, index, array })) {
      array.push(readFunction(binaryBuffer));
      index++;
    }
    return array;
  };

export const arrayWrite =
  (
    arrayLengthFunction: ArrayLengthFunction,
    writeFunction: (binaryBuffer: BinaryBuffer, value: unknown) => void,
    confirmLength?: number
  ) =>
  (binaryBuffer: BinaryBuffer, value: unknown): void => {
    if (!Array.isArray(value)) {
      throw new Error(
        `cannot write an array since value passed is not an array: "${value}"`
      );
    } else if (
      typeof confirmLength === 'number' &&
      value.length !== confirmLength
    ) {
      throw new Error(
        `expected an array of length ${confirmLength}, but was passed an array with length ${value.length}`
      );
    }
    let index = 0;
    while (arrayLengthFunction({ binaryBuffer, index, array: value })) {
      writeFunction(binaryBuffer, value[index]);
      index++;
    }
  };

export const arrayStep = (
  arrayLengthFunction: ArrayLengthFunction,
  read: ReadFunction,
  write: WriteFunction,
  confirmLength?: number
): ReadAndWrite => ({
  read: arrayRead(arrayLengthFunction, read),
  write: arrayWrite(arrayLengthFunction, write, confirmLength),
});
