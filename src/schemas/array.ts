import type { DecodeContext, DecodeResult, EncodeContext, EncodeResult, Schema } from '../types';
import { assertByteAligned, assertByteResult, assertLength } from '../helpers/context';
import { concat } from '../helpers/bytes';
import { withBinaryFormatError } from '../helpers/errors';

type ArrayLengthPredicate<T> = (params: {
  readonly context: DecodeContext | EncodeContext;
  readonly index: number;
  readonly array: readonly T[];
}) => boolean;

type ArrayLengthOption<T> = number | 'eof' | ArrayLengthPredicate<T>;

export const array = <T>(itemSchema: Schema<T>, length: ArrayLengthOption<T>): Schema<T[]> => ({
  kind: 'array',
  decode: (context): DecodeResult<T[]> => {
    assertByteAligned(context, 'decode array');
    const output: T[] = [];
    let byteOffset = context.byteOffset;
    let index = 0;

    while (shouldContinueArray(length, context, index, output, byteOffset)) {
      const itemContext = {
        ...context,
        byteOffset,
        path: [...context.path, index],
      };
      const item = withBinaryFormatError(
        () => {
          const result = itemSchema.decode(itemContext);
          assertByteResult(result.bitsDecoded, 'array items');
          return result;
        },
        itemContext,
        itemSchema.kind
      );
      output.push(item.result);
      if (length === 'eof' && item.bytesDecoded === 0 && item.bitsDecoded === 0) {
        throw new Error('array item schema must consume bytes before eof');
      }
      byteOffset += item.bytesDecoded;
      index++;
    }

    return {
      result: output,
      bytesDecoded: byteOffset - context.byteOffset,
      bitsDecoded: 0,
    };
  },
  encode: (context): EncodeResult => {
    if (!Array.isArray(context.value)) {
      throw new TypeError('array schema encode value must be an array');
    }
    assertByteAligned(context, 'encode array');
    const chunks: Uint8Array[] = [];
    let byteOffset = context.byteOffset;
    let index = 0;

    while (shouldContinueArray(length, context, index, context.value, byteOffset)) {
      const itemContext = {
        value: context.value[index],
        byteOffset,
        bitOffset: 0,
        encodedObject: context.encodedObject,
        path: [...context.path, index],
        root: context.root,
      };
      const item = withBinaryFormatError(
        () => {
          const result = itemSchema.encode(itemContext);
          assertByteResult(result.bitsEncoded, 'array items');
          return result;
        },
        itemContext,
        itemSchema.kind
      );
      chunks.push(item.result);
      byteOffset += item.bytesEncoded;
      index++;
    }

    const result = concat(chunks);
    return {
      result,
      bytesEncoded: result.byteLength,
      bitsEncoded: 0,
    };
  },
});

const shouldContinueArray = <T>(
  length: ArrayLengthOption<T>,
  context: DecodeContext | EncodeContext,
  index: number,
  arrayValue: readonly T[],
  byteOffset: number
): boolean => {
  if (typeof length === 'number') {
    assertLength(length, 'array length');
    return index < length;
  }
  if (length === 'eof') {
    return 'buffer' in context ? byteOffset < context.buffer.byteLength : index < arrayValue.length;
  }
  return length({ context, index, array: arrayValue });
};
