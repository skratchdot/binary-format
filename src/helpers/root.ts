import { isBitSchema } from '../schemas/bit';
import type { DecodeOptions, DeepReadonly, Schema } from '../types';
import { advanceOffset, assertByteResult, emptyObject } from './context';
import { toDataView, toUint8Array } from './bytes';

export const decode = <T>(
  schema: Schema<T>,
  input: ArrayBuffer | ArrayBufferView,
  options: DecodeOptions = {}
): T => {
  const buffer = toUint8Array(input);
  const result = schema.decode({
    buffer,
    view: toDataView(buffer),
    byteOffset: 0,
    bitOffset: 0,
    decodedObject: emptyObject,
    path: [],
  });
  if (!isBitSchema(schema)) assertByteResult(result.bitsDecoded, 'root schemas');
  const finalOffset = advanceOffset(0, 0, result);
  if (options.requireEOF && finalOffset.byteOffset !== buffer.byteLength) {
    throw new RangeError(
      `expected EOF at byte offset ${finalOffset.byteOffset} but input has ${buffer.byteLength} byte(s)`
    );
  }
  if (finalOffset.bitOffset !== 0) {
    throw new Error(`schema decoded a partial byte ending at bit offset ${finalOffset.bitOffset}`);
  }
  return result.result;
};

export const encode = <T>(schema: Schema<T>, value: T | DeepReadonly<T>): Uint8Array => {
  const result = schema.encode({
    value,
    byteOffset: 0,
    bitOffset: 0,
    encodedObject: emptyObject,
    path: [],
  });
  if (!isBitSchema(schema)) assertByteResult(result.bitsEncoded, 'root schemas');
  const finalBitOffset = result.bitsEncoded % 8;
  if (finalBitOffset !== 0) {
    throw new Error(`schema encoded a partial byte ending at bit offset ${finalBitOffset}`);
  }
  return result.result;
};

export const custom = <T>(schema: Schema<T>): Schema<T> => schema;
