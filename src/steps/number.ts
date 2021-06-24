import BinaryBuffer from '../binary-buffer';
import {
  NumberKey,
  NumberKeyRead,
  NumberKeyWrite,
  ReadAndWrite,
} from '../types';

export const numberRead =
  (fnName: NumberKeyRead) =>
  (binaryBuffer: BinaryBuffer): number =>
    binaryBuffer.rw[fnName]();

export const numberWrite =
  (fnName: NumberKeyWrite) =>
  (binaryBuffer: BinaryBuffer, value: unknown): void => {
    binaryBuffer.rw[fnName](Number(value));
  };

export const numberStep = (numberKey: NumberKey): ReadAndWrite => ({
  read: numberRead(`read${numberKey}`),
  write: numberWrite(`write${numberKey}`),
});
