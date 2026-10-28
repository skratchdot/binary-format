import type { DecodeContext, DecodeResult, EncodeContext, LengthOption } from '../types';

export const emptyObject: Record<PropertyKey, never> = {};

export const assertByteAligned = (context: DecodeContext | EncodeContext, action: string): void => {
  if (context.bitOffset !== 0) {
    throw new Error(`cannot ${action} while bitOffset is ${context.bitOffset}`);
  }
};

export const assertCanRead = (context: DecodeContext, byteLength: number): void => {
  if (context.byteOffset + byteLength > context.buffer.byteLength) {
    throw new RangeError(`cannot decode ${byteLength} byte(s) at offset ${context.byteOffset}`);
  }
};

export const assertCanReadBits = (context: DecodeContext, bitLength: number): void => {
  const absoluteBitOffset = context.byteOffset * 8 + context.bitOffset;
  if (absoluteBitOffset + bitLength > context.buffer.byteLength * 8) {
    throw new RangeError(
      `cannot decode ${bitLength} bit(s) at offset ${context.byteOffset}:${context.bitOffset}`
    );
  }
};

export const assertLength = (length: number, label: string): void => {
  if (!Number.isSafeInteger(length) || length < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
};

export const resolveLength = (length: LengthOption, context: DecodeContext): number => {
  const resolvedLength = resolveLengthValue(length, context);
  if (resolvedLength === 'eof') {
    return context.buffer.byteLength - context.byteOffset;
  }
  assertLength(resolvedLength, 'length');
  return resolvedLength;
};

export const resolveEncodeLength = (
  length: LengthOption,
  context: EncodeContext
): number | 'eof' => {
  const resolvedLength = resolveLengthValue(length, context);
  if (resolvedLength !== 'eof') {
    assertLength(resolvedLength, 'length');
  }
  return resolvedLength;
};

export const advanceOffset = (
  byteOffset: number,
  bitOffset: number,
  result: Pick<DecodeResult<unknown>, 'bytesDecoded' | 'bitsDecoded'>
): { readonly byteOffset: number; readonly bitOffset: number } => {
  const totalBits = bitOffset + result.bitsDecoded;
  return {
    byteOffset: byteOffset + result.bytesDecoded + Math.floor(totalBits / 8),
    bitOffset: totalBits % 8,
  };
};

const resolveLengthValue = (
  length: LengthOption,
  context: DecodeContext | EncodeContext
): number | 'eof' => (typeof length === 'function' ? length(context) : length);

/** Containers compose byte results; only direct bit fields share an object's bit writer. */
export const assertByteResult = (bits: number, label: string): void => {
  if (bits !== 0) {
    throw new Error(`${label} must return byte-only results (bit count must be zero)`);
  }
};
