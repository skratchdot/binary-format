import type { DecodeResult, EncodeResult, LengthOption, Schema } from '../types';
import { bytes } from './bytes';
import { resolveEncodeLength } from '../helpers/context';

const textDecoder = /* @__PURE__ */ new TextDecoder();
const textEncoder = /* @__PURE__ */ new TextEncoder();

export const string = (length: LengthOption): Schema<string> => ({
  kind: 'string',
  decode: (context): DecodeResult<string> => {
    const byteResult = bytes(length).decode(context);
    return {
      result: textDecoder.decode(byteResult.result),
      bytesDecoded: byteResult.bytesDecoded,
      bitsDecoded: 0,
    };
  },
  encode: (context): EncodeResult => {
    const encoded = textEncoder.encode(String(context.value));
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
