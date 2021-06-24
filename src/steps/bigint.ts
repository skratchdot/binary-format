import BinaryBuffer from '../binary-buffer';
import {
  BigIntKey,
  BigIntKeyRead,
  BigIntKeyWrite,
  ReadAndWrite,
} from '../types';

export const bigIntRead =
  (fnName: BigIntKeyRead) =>
  (binaryBuffer: BinaryBuffer): BigInt =>
    binaryBuffer.rw[fnName]();

export const bigIntWrite =
  (fnName: BigIntKeyWrite) =>
  (binaryBuffer: BinaryBuffer, value: unknown): void => {
    binaryBuffer.rw[fnName](
      typeof value === 'bigint' ? BigInt(value) : BigInt(Number(value))
    );
  };

export const bigIntStep = (bigIntKey: BigIntKey): ReadAndWrite => ({
  read: bigIntRead(`read${bigIntKey}`),
  write: bigIntWrite(`write${bigIntKey}`),
});
