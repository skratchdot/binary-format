import type { DecodeResult, EncodeResult, Schema } from '../types';
import { assertByteAligned, assertCanRead } from '../helpers/context';

import { toDataView } from '../helpers/bytes';

type NumberGetter = (view: DataView, byteOffset: number) => number;
type NumberSetter = (view: DataView, byteOffset: number, value: number) => void;
type BigIntGetter = (view: DataView, byteOffset: number) => bigint;
type BigIntSetter = (view: DataView, byteOffset: number, value: bigint) => void;

const numberSchema = (
  kind: string,
  byteLength: number,
  min: number,
  max: number,
  get: NumberGetter,
  set: NumberSetter
): Schema<number> => ({
  kind,
  decode: (context): DecodeResult<number> => {
    assertByteAligned(context, `decode ${kind}`);
    assertCanRead(context, byteLength);
    return {
      result: get(context.view, context.byteOffset),
      bytesDecoded: byteLength,
      bitsDecoded: 0,
    };
  },
  encode: (context): EncodeResult => {
    assertByteAligned(context, `encode ${kind}`);
    if (typeof context.value !== 'number') {
      throw new TypeError(`${kind} encode value must be a number`);
    }
    if (
      Number.isSafeInteger(min) &&
      Number.isSafeInteger(max) &&
      (!Number.isSafeInteger(context.value) || context.value < min || context.value > max)
    ) {
      throw new RangeError(`${kind} value is out of range`);
    }
    const result = new Uint8Array(byteLength);
    set(toDataView(result), 0, context.value);
    return {
      result,
      bytesEncoded: byteLength,
      bitsEncoded: 0,
    };
  },
});

const bigIntSchema = (
  kind: string,
  min: bigint,
  max: bigint,
  get: BigIntGetter,
  set: BigIntSetter
): Schema<bigint> => ({
  kind,
  decode: (context): DecodeResult<bigint> => {
    assertByteAligned(context, `decode ${kind}`);
    assertCanRead(context, 8);
    return {
      result: get(context.view, context.byteOffset),
      bytesDecoded: 8,
      bitsDecoded: 0,
    };
  },
  encode: (context): EncodeResult => {
    assertByteAligned(context, `encode ${kind}`);
    if (typeof context.value !== 'bigint') {
      throw new TypeError(`${kind} encode value must be a bigint`);
    }
    if (context.value < min || context.value > max) {
      throw new RangeError(`${kind} value is out of range`);
    }
    const result = new Uint8Array(8);
    set(toDataView(result), 0, context.value);
    return {
      result,
      bytesEncoded: 8,
      bitsEncoded: 0,
    };
  },
});

export const int8 = (): Schema<number> =>
  numberSchema(
    'int8',
    1,
    -0x80,
    0x7f,
    (view, offset) => view.getInt8(offset),
    (view, offset, value) => view.setInt8(offset, value)
  );

export const uint8 = (): Schema<number> =>
  numberSchema(
    'uint8',
    1,
    0,
    0xff,
    (view, offset) => view.getUint8(offset),
    (view, offset, value) => view.setUint8(offset, value)
  );

export const int16 = (littleEndian = false): Schema<number> =>
  numberSchema(
    littleEndian ? 'int16le' : 'int16be',
    2,
    -0x80_00,
    0x7f_ff,
    (view, offset) => view.getInt16(offset, littleEndian),
    (view, offset, value) => view.setInt16(offset, value, littleEndian)
  );
export const int16be = (): Schema<number> => int16(false);
export const int16le = (): Schema<number> => int16(true);

export const uint16 = (littleEndian = false): Schema<number> =>
  numberSchema(
    littleEndian ? 'uint16le' : 'uint16be',
    2,
    0,
    0xff_ff,
    (view, offset) => view.getUint16(offset, littleEndian),
    (view, offset, value) => view.setUint16(offset, value, littleEndian)
  );
export const uint16be = (): Schema<number> => uint16(false);
export const uint16le = (): Schema<number> => uint16(true);

export const int32 = (littleEndian = false): Schema<number> =>
  numberSchema(
    littleEndian ? 'int32le' : 'int32be',
    4,
    -0x80_00_00_00,
    0x7f_ff_ff_ff,
    (view, offset) => view.getInt32(offset, littleEndian),
    (view, offset, value) => view.setInt32(offset, value, littleEndian)
  );
export const int32be = (): Schema<number> => int32(false);
export const int32le = (): Schema<number> => int32(true);

export const uint32 = (littleEndian = false): Schema<number> =>
  numberSchema(
    littleEndian ? 'uint32le' : 'uint32be',
    4,
    0,
    0xff_ff_ff_ff,
    (view, offset) => view.getUint32(offset, littleEndian),
    (view, offset, value) => view.setUint32(offset, value, littleEndian)
  );
export const uint32be = (): Schema<number> => uint32(false);
export const uint32le = (): Schema<number> => uint32(true);

export const float32 = (littleEndian = false): Schema<number> =>
  numberSchema(
    littleEndian ? 'float32le' : 'float32be',
    4,
    -Infinity,
    Infinity,
    (view, offset) => view.getFloat32(offset, littleEndian),
    (view, offset, value) => view.setFloat32(offset, value, littleEndian)
  );
export const float32be = (): Schema<number> => float32(false);
export const float32le = (): Schema<number> => float32(true);

export const float64 = (littleEndian = false): Schema<number> =>
  numberSchema(
    littleEndian ? 'float64le' : 'float64be',
    8,
    -Infinity,
    Infinity,
    (view, offset) => view.getFloat64(offset, littleEndian),
    (view, offset, value) => view.setFloat64(offset, value, littleEndian)
  );
export const float64be = (): Schema<number> => float64(false);
export const float64le = (): Schema<number> => float64(true);

export const int64 = (littleEndian = false): Schema<bigint> =>
  bigIntSchema(
    littleEndian ? 'int64le' : 'int64be',
    -(1n << 63n),
    (1n << 63n) - 1n,
    (view, offset) => view.getBigInt64(offset, littleEndian),
    (view, offset, value) => view.setBigInt64(offset, value, littleEndian)
  );
export const int64be = (): Schema<bigint> => int64(false);
export const int64le = (): Schema<bigint> => int64(true);

export const uint64 = (littleEndian = false): Schema<bigint> =>
  bigIntSchema(
    littleEndian ? 'uint64le' : 'uint64be',
    0n,
    (1n << 64n) - 1n,
    (view, offset) => view.getBigUint64(offset, littleEndian),
    (view, offset, value) => view.setBigUint64(offset, value, littleEndian)
  );
export const uint64be = (): Schema<bigint> => uint64(false);
export const uint64le = (): Schema<bigint> => uint64(true);
