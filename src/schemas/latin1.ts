import type { DecodeResult, EncodeResult, LengthOption, Schema } from '../types';

import { bytes } from './bytes';
import { resolveEncodeLength } from '../helpers/context';

export type Latin1OutOfRange = 'replace' | 'throw' | 'truncate';

export type Latin1Options = {
  readonly outOfRange?: Latin1OutOfRange;
};

export const latin1 = (length: LengthOption, options: Latin1Options = {}): Schema<string> => ({
  kind: 'latin1',
  decode: (context): DecodeResult<string> => {
    const byteResult = bytes(length).decode(context);
    return {
      result: decodeLatin1(byteResult.result),
      bytesDecoded: byteResult.bytesDecoded,
      bitsDecoded: 0,
    };
  },
  encode: (context): EncodeResult => {
    const encoded = encodeLatin1(String(context.value), options.outOfRange ?? 'throw');
    const resolvedLength = resolveEncodeLength(length, context);
    const byteLength = typeof resolvedLength === 'number' ? resolvedLength : encoded.byteLength;
    const result = new Uint8Array(byteLength);
    result.set(encoded.subarray(0, byteLength));
    return {
      result,
      bytesEncoded: result.byteLength,
      bitsEncoded: 0,
    };
  },
});

const decodeLatin1 = (bytesValue: Uint8Array): string => {
  let result = '';
  for (const byte of bytesValue) {
    result += String.fromCodePoint(byte);
  }
  return result;
};

const encodeLatin1 = (value: string, outOfRange: Latin1OutOfRange): Uint8Array => {
  const output = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index++) {
    const codeUnit = codeUnitAt(value, index);
    if (codeUnit > 0xff) {
      if (outOfRange === 'throw') {
        throw new RangeError('latin1 value contains code units above 0xff');
      }
      output[index] = outOfRange === 'replace' ? 0x3f : codeUnit & 0xff;
    } else {
      output[index] = codeUnit;
    }
  }
  return output;
};

const codeUnitAt = (value: string, index: number): number =>
  // Latin-1 binary strings are one byte per JavaScript UTF-16 code unit.
  value.charCodeAt(index);
