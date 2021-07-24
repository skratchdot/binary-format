import BinaryBuffer from './binary-buffer';
import { SmartBuffer } from 'smart-buffer';
import BinaryFormatter from './binary-formatter';

export type NumberKey =
  | 'Int8'
  | 'Int16BE'
  | 'Int16LE'
  | 'Int32BE'
  | 'Int32LE'
  | 'UInt8'
  | 'UInt16BE'
  | 'UInt16LE'
  | 'UInt32BE'
  | 'UInt32LE'
  | 'FloatBE'
  | 'FloatLE'
  | 'DoubleBE'
  | 'DoubleLE';
export type NumberKeyRead = keyof SmartBuffer & `read${NumberKey}`;
export type NumberKeyWrite = keyof SmartBuffer & `write${NumberKey}`;

export type BigIntKey =
  | 'BigInt64BE'
  | 'BigInt64LE'
  | 'BigUInt64BE'
  | 'BigUInt64LE';
export type BigIntKeyRead = keyof SmartBuffer & `read${BigIntKey}`;
export type BigIntKeyWrite = keyof SmartBuffer & `write${BigIntKey}`;

export type ReadFunction = (binaryBuffer: BinaryBuffer) => unknown;
export type WriteFunction = (
  binaryBuffer: BinaryBuffer,
  value: unknown
) => void;

export interface ReadAndWrite {
  read: ReadFunction;
  write: WriteFunction;
}

export interface Step<T> extends ReadAndWrite {
  name: keyof T;
}

export type EOF = 'eof';
export type NT = 'nt';

export type LengthOption = number | EOF | NT;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CustomFormatter<T> = BinaryFormatter<Exclude<any, T>>;

export type ChoiceOptions<T> = Record<string | number, CustomFormatter<T>>;

export type ArrayLengthFunction = (params: ArrayLengthParams) => boolean;

export type ArrayLengthParams = {
  binaryBuffer: BinaryBuffer;
  index: number;
  array: Array<unknown>;
};

export type ArrayLengthOption = number | 'eof' | ArrayLengthFunction;
