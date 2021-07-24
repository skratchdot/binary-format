import BinaryBuffer from '../binary-buffer';
import {
  ReadAndWrite,
  ReadFunction,
  LengthOption,
  WriteFunction,
} from '../types';

export const stringRead = (
  length: LengthOption,
  encoding?: BufferEncoding
): ReadFunction => {
  if (typeof length === 'number') {
    return (binaryBuffer: BinaryBuffer): string =>
      binaryBuffer.rw.readString(length, encoding);
  } else if (length === 'eof') {
    return (binaryBuffer: BinaryBuffer): string =>
      binaryBuffer.rw.readString(encoding);
  } else if (length === 'nt') {
    // NOTE:
    // we could throw an error after reading if we are at the
    // end of the buffer and the last character read is not null.
    return (binaryBuffer: BinaryBuffer): string =>
      binaryBuffer.rw.readStringNT(encoding);
  } else {
    throw new Error(`invalid LengthOption of length="${length}"`);
  }
};

export const stringWrite = (
  length: LengthOption,
  encoding?: BufferEncoding
): WriteFunction => {
  if (typeof length === 'number') {
    return (binaryBuffer: BinaryBuffer, value: unknown): void => {
      const buffer = Buffer.from(String(value), encoding);
      for (let i = 0; i < length; i++) {
        binaryBuffer.rw.writeUInt8(i < buffer.length ? buffer.readUInt8(i) : 0);
      }
    };
  } else if (length === 'eof') {
    return (binaryBuffer: BinaryBuffer, value: unknown): void => {
      binaryBuffer.rw.writeString(String(value), encoding);
    };
  } else if (length === 'nt') {
    return (binaryBuffer: BinaryBuffer, value: unknown): void => {
      binaryBuffer.rw.writeStringNT(String(value), encoding);
    };
  } else {
    throw new Error(`invalid LengthOption of length="${length}"`);
  }
};

export const stringStep = (
  length: LengthOption,
  encoding?: BufferEncoding
): ReadAndWrite => ({
  read: stringRead(length, encoding),
  write: stringWrite(length, encoding),
});
