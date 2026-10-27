import type { DecodeResult, EncodeResult, LengthOption, Schema } from '../types';
import {
  assertByteAligned,
  assertCanRead,
  assertLength,
  resolveEncodeLength,
  resolveLength,
} from '../helpers/context';
import { bytesEqual, formatBytes, toUint8Array, toUint8ArrayLike } from '../helpers/bytes';

export const bytes = (length: LengthOption): Schema<Uint8Array> => ({
  kind: 'bytes',
  decode: (context): DecodeResult<Uint8Array> => {
    assertByteAligned(context, 'decode bytes');
    const byteLength = resolveLength(length, context);
    assertCanRead(context, byteLength);
    const start = context.byteOffset;
    const end = start + byteLength;
    return {
      result: context.buffer.subarray(start, end),
      bytesDecoded: byteLength,
      bitsDecoded: 0,
    };
  },
  encode: (context): EncodeResult => {
    assertByteAligned(context, 'encode bytes');
    const value = toUint8Array(context.value);
    const byteLength = resolveEncodeLength(length, context);
    if (typeof byteLength === 'number' && value.byteLength !== byteLength) {
      throw new RangeError(`expected ${byteLength} bytes but received ${value.byteLength}`);
    }
    return {
      result: value,
      bytesEncoded: value.byteLength,
      bitsEncoded: 0,
    };
  },
});

export const uint8Array: typeof bytes = bytes;

export const skip = (length: number): Schema<undefined> => ({
  kind: 'skip',
  decode: (context): DecodeResult<undefined> => {
    assertByteAligned(context, 'decode skip');
    assertLength(length, 'skip length');
    assertCanRead(context, length);
    return {
      result: undefined,
      bytesDecoded: length,
      bitsDecoded: 0,
    };
  },
  encode: (context): EncodeResult => {
    assertByteAligned(context, 'encode skip');
    assertLength(length, 'skip length');
    const result = new Uint8Array(length);
    return {
      result,
      bytesEncoded: result.byteLength,
      bitsEncoded: 0,
    };
  },
});

export const constant = (
  expected: ArrayBuffer | ArrayBufferView | readonly number[]
): Schema<Uint8Array> => {
  const expectedBytes = toUint8ArrayLike(expected);
  return {
    kind: 'constant',
    decode: (context): DecodeResult<Uint8Array> => {
      assertByteAligned(context, 'decode constant');
      assertCanRead(context, expectedBytes.byteLength);
      const actual = context.buffer.subarray(
        context.byteOffset,
        context.byteOffset + expectedBytes.byteLength
      );
      if (!bytesEqual(actual, expectedBytes)) {
        throw new Error(
          `constant mismatch at byte offset ${
            context.byteOffset
          }: expected ${formatBytes(expectedBytes)} but received ${formatBytes(actual)}`
        );
      }
      return {
        result: actual,
        bytesDecoded: expectedBytes.byteLength,
        bitsDecoded: 0,
      };
    },
    encode: (context): EncodeResult => {
      assertByteAligned(context, 'encode constant');
      return {
        result: Uint8Array.from(expectedBytes),
        bytesEncoded: expectedBytes.byteLength,
        bitsEncoded: 0,
      };
    },
  };
};

export const plainArray = (length: LengthOption): Schema<number[]> => ({
  kind: 'plainArray',
  decode: (context): DecodeResult<number[]> => {
    const byteResult = bytes(length).decode(context);
    return {
      result: [...byteResult.result],
      bytesDecoded: byteResult.bytesDecoded,
      bitsDecoded: 0,
    };
  },
  encode: (context): EncodeResult => {
    if (!Array.isArray(context.value)) {
      throw new TypeError('plainArray schema encode value must be an array');
    }
    return bytes(length).encode({
      ...context,
      value: Uint8Array.from(context.value),
    });
  },
});
