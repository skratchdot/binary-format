import BinaryBuffer from '../binary-buffer';
import {
  ReadAndWrite,
  ReadFunction,
  LengthOption,
  WriteFunction,
} from '../types';

export const validateBuffer = (buffer: unknown, length?: number): Buffer => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error(`"${buffer}" is not a invalid buffer`);
  } else if (length && buffer.length !== length) {
    throw new Error(
      `buffer has incorrect length. buffer.length=${buffer.length} but wanted length=${length}`
    );
  }
  return buffer;
};

export const bufferRead = (length: LengthOption): ReadFunction => {
  if (typeof length === 'number') {
    return (binaryBuffer: BinaryBuffer): Buffer =>
      binaryBuffer.rw.readBuffer(length);
  } else if (length === 'eof') {
    return (binaryBuffer: BinaryBuffer): Buffer => binaryBuffer.rw.readBuffer();
  } else if (length === 'nt') {
    // NOTE:
    // we could throw an error after reading if we are at the
    // end of the buffer and the last character read is not null.
    return (binaryBuffer: BinaryBuffer): Buffer =>
      binaryBuffer.rw.readBufferNT();
  } else {
    throw new Error(`invalid LengthOption of length="${length}"`);
  }
};

export const bufferWrite = (length: LengthOption): WriteFunction => {
  if (typeof length === 'number') {
    return (binaryBuffer: BinaryBuffer, value: unknown): void => {
      // const expectedEnd = binaryBuffer.rw.writeOffset + length;
      binaryBuffer.rw.writeBuffer(validateBuffer(value, length));
    };
  } else if (length === 'eof') {
    return (binaryBuffer: BinaryBuffer, value: unknown): void => {
      binaryBuffer.rw.writeBuffer(validateBuffer(value));
    };
  } else if (length === 'nt') {
    return (binaryBuffer: BinaryBuffer, value: unknown): void => {
      binaryBuffer.rw.writeBufferNT(validateBuffer(value));
    };
  } else {
    throw new Error(`invalid LengthOption of length="${length}"`);
  }
};

export const bufferStep = (length: LengthOption): ReadAndWrite => ({
  read: bufferRead(length),
  write: bufferWrite(length),
});
