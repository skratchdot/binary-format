import {
  LengthOption,
  ReadAndWrite,
  ReadFunction,
  WriteFunction,
} from '../types';

import BinaryBuffer from '../binary-buffer';
import { Buffer } from 'buffer';
import { bufferStep } from './buffer';

export const plainArrayRead =
  (read: ReadFunction): ReadFunction =>
  (binaryBuffer: BinaryBuffer): unknown => {
    const buffer = read(binaryBuffer);
    if (Buffer.isBuffer(buffer)) {
      return buffer.toJSON().data;
    } else {
      return [];
    }
  };

export const plainArrayWrite =
  (write: WriteFunction): WriteFunction =>
  (binaryBuffer: BinaryBuffer, value: unknown) => {
    if (Array.isArray(value)) {
      const buffer = Buffer.from(value);
      write(binaryBuffer, buffer);
    }
  };

export const plainArrayStep = (length: LengthOption): ReadAndWrite => {
  const bs = bufferStep(length);
  return {
    read: plainArrayRead(bs.read),
    write: plainArrayWrite(bs.write),
  };
};
