import type { DecodeResult, EncodeResult, Schema } from '../types';

import { assertCanReadBits } from '../helpers/context';
import { concat } from '../helpers/bytes';

export type BitSchema = {
  readonly kind: 'bit';
  readonly bitLength: number;
  readonly littleEndian: boolean;
} & Schema<number>;

export type BitEncodeState = {
  currentByte: number;
  bitOffset: number;
};

export const bit = (bitLength: number, littleEndian = false): BitSchema => {
  if (!Number.isSafeInteger(bitLength) || bitLength < 1 || bitLength > 32) {
    throw new RangeError('bit length must be an integer from 1 to 32');
  }
  return {
    kind: 'bit',
    bitLength,
    littleEndian,
    decode: (context): DecodeResult<number> => {
      assertCanReadBits(context, bitLength);
      return {
        result: readBits(
          context.buffer,
          context.byteOffset,
          context.bitOffset,
          bitLength,
          littleEndian
        ),
        bytesDecoded: 0,
        bitsDecoded: bitLength,
      };
    },
    encode: (context): EncodeResult => {
      if (typeof context.value !== 'number') {
        throw new TypeError('bit schema encode value must be a number');
      }
      const state: BitEncodeState = {
        currentByte: 0,
        bitOffset: context.bitOffset,
      };
      return encodeBitValue(context.value, bitLength, littleEndian, state);
    },
  };
};

export const bit1 = (littleEndian = false): Schema<number> =>
  bit(1, littleEndian);
export const bit2 = (littleEndian = false): Schema<number> =>
  bit(2, littleEndian);
export const bit3 = (littleEndian = false): Schema<number> =>
  bit(3, littleEndian);
export const bit4 = (littleEndian = false): Schema<number> =>
  bit(4, littleEndian);
export const bit5 = (littleEndian = false): Schema<number> =>
  bit(5, littleEndian);
export const bit6 = (littleEndian = false): Schema<number> =>
  bit(6, littleEndian);
export const bit7 = (littleEndian = false): Schema<number> =>
  bit(7, littleEndian);
export const bit8 = (littleEndian = false): Schema<number> =>
  bit(8, littleEndian);
export const bit9 = (littleEndian = false): Schema<number> =>
  bit(9, littleEndian);
export const bit10 = (littleEndian = false): Schema<number> =>
  bit(10, littleEndian);
export const bit11 = (littleEndian = false): Schema<number> =>
  bit(11, littleEndian);
export const bit12 = (littleEndian = false): Schema<number> =>
  bit(12, littleEndian);
export const bit13 = (littleEndian = false): Schema<number> =>
  bit(13, littleEndian);
export const bit14 = (littleEndian = false): Schema<number> =>
  bit(14, littleEndian);
export const bit15 = (littleEndian = false): Schema<number> =>
  bit(15, littleEndian);
export const bit16 = (littleEndian = false): Schema<number> =>
  bit(16, littleEndian);
export const bit17 = (littleEndian = false): Schema<number> =>
  bit(17, littleEndian);
export const bit18 = (littleEndian = false): Schema<number> =>
  bit(18, littleEndian);
export const bit19 = (littleEndian = false): Schema<number> =>
  bit(19, littleEndian);
export const bit20 = (littleEndian = false): Schema<number> =>
  bit(20, littleEndian);
export const bit21 = (littleEndian = false): Schema<number> =>
  bit(21, littleEndian);
export const bit22 = (littleEndian = false): Schema<number> =>
  bit(22, littleEndian);
export const bit23 = (littleEndian = false): Schema<number> =>
  bit(23, littleEndian);
export const bit24 = (littleEndian = false): Schema<number> =>
  bit(24, littleEndian);
export const bit25 = (littleEndian = false): Schema<number> =>
  bit(25, littleEndian);
export const bit26 = (littleEndian = false): Schema<number> =>
  bit(26, littleEndian);
export const bit27 = (littleEndian = false): Schema<number> =>
  bit(27, littleEndian);
export const bit28 = (littleEndian = false): Schema<number> =>
  bit(28, littleEndian);
export const bit29 = (littleEndian = false): Schema<number> =>
  bit(29, littleEndian);
export const bit30 = (littleEndian = false): Schema<number> =>
  bit(30, littleEndian);
export const bit31 = (littleEndian = false): Schema<number> =>
  bit(31, littleEndian);
export const bit32 = (littleEndian = false): Schema<number> =>
  bit(32, littleEndian);

export const isBitSchema = (schema: Schema<unknown>): schema is BitSchema =>
  schema.kind === 'bit' && 'bitLength' in schema && 'littleEndian' in schema;

export const encodeBitField = (
  schema: BitSchema,
  value: unknown,
  state: BitEncodeState
): EncodeResult => {
  if (typeof value !== 'number') {
    throw new TypeError('bit schema encode value must be a number');
  }
  return encodeBitValue(value, schema.bitLength, schema.littleEndian, state);
};

const getBit = (
  buffer: Uint8Array,
  absoluteBitOffset: number,
  littleEndian: boolean
): number => {
  const byte = buffer[Math.floor(absoluteBitOffset / 8)] ?? 0;
  const bitOffset = absoluteBitOffset % 8;
  const bitIndex = littleEndian ? bitOffset : 7 - bitOffset;
  return (byte >> bitIndex) & 1;
};

const readBits = (
  buffer: Uint8Array,
  byteOffset: number,
  bitOffset: number,
  bitLength: number,
  littleEndian: boolean
): number => {
  const absoluteBitOffset = byteOffset * 8 + bitOffset;
  let value = 0;
  for (let index = 0; index < bitLength; index++) {
    const nextBit = getBit(buffer, absoluteBitOffset + index, littleEndian);
    if (littleEndian) {
      value += nextBit * 2 ** index;
    } else {
      value = value * 2 + nextBit;
    }
  }
  return value;
};

const encodeBitValue = (
  value: number,
  bitLength: number,
  littleEndian: boolean,
  state: BitEncodeState
): EncodeResult => {
  if (!Number.isSafeInteger(value) || value < 0 || value >= 2 ** bitLength) {
    throw new RangeError('bit schema value is out of range');
  }
  const chunks: Uint8Array[] = [];
  for (let index = 0; index < bitLength; index++) {
    const bitValue = littleEndian
      ? Math.floor(value / 2 ** index) & 1
      : Math.floor(value / 2 ** (bitLength - index - 1)) & 1;
    const bitIndex = littleEndian ? state.bitOffset : 7 - state.bitOffset;
    state.currentByte |= bitValue << bitIndex;
    state.bitOffset++;
    if (state.bitOffset === 8) {
      chunks.push(Uint8Array.of(state.currentByte));
      state.currentByte = 0;
      state.bitOffset = 0;
    }
  }
  return {
    result: concat(chunks),
    bytesEncoded: chunks.length,
    bitsEncoded: bitLength,
  };
};
