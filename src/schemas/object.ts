import type {
  DecodeResult,
  EncodeResult,
  FieldOptions,
  Schema,
} from '../types';
import { advanceOffset, assertByteAligned } from '../helpers/context';
import { encodeBitField, isBitSchema } from './bit';
import type { BitEncodeState } from './bit';
import { concat } from '../helpers/bytes';
import { withBinaryFormatError } from '../helpers/errors';

type ObjectField = readonly [
  name: PropertyKey,
  schema: Schema<unknown>,
  options?: FieldOptions,
];

type FieldName<TField> = TField extends readonly [
  infer TName extends PropertyKey,
  Schema<unknown>,
]
  ? TName
  : TField extends readonly [
      infer TName extends PropertyKey,
      Schema<unknown>,
      FieldOptions,
    ]
  ? TName
  : never;

type FieldValue<TField> = TField extends readonly [
  PropertyKey,
  Schema<infer TValue>,
]
  ? TValue
  : TField extends readonly [PropertyKey, Schema<infer TValue>, FieldOptions]
  ? TValue
  : never;

type IsOptionalField<TField> = TField extends readonly [
  PropertyKey,
  Schema<unknown>,
  infer TOptions,
]
  ? TOptions extends { readonly omitUndefined: true }
    ? true
    : false
  : false;

type ObjectFromFields<TFields extends readonly ObjectField[]> = {
  [TField in TFields[number] as IsOptionalField<TField> extends true
    ? never
    : FieldName<TField>]: FieldValue<TField>;
} & {
  [TField in TFields[number] as IsOptionalField<TField> extends true
    ? FieldName<TField>
    : never]?: Exclude<FieldValue<TField>, undefined>;
};

export const object = <const TFields extends readonly ObjectField[]>(
  fields: TFields
): Schema<ObjectFromFields<TFields>> => ({
  kind: 'object',
  decode: (context): DecodeResult<ObjectFromFields<TFields>> => {
    assertByteAligned(context, 'decode object');
    const output: Record<PropertyKey, unknown> = {};
    let byteOffset = context.byteOffset;
    let bitOffset = context.bitOffset;

    for (const [name, schema, options] of fields) {
      const fieldContext = {
        ...context,
        byteOffset,
        bitOffset,
        decodedObject: output,
        path: [...context.path, name],
        root: context.root ?? output,
      };
      const field = withBinaryFormatError(
        () => schema.decode(fieldContext),
        fieldContext,
        schema.kind
      );
      if (!(options?.omitUndefined && field.result === undefined)) {
        output[name] = field.result;
      }
      const nextOffset = advanceOffset(byteOffset, bitOffset, field);
      byteOffset = nextOffset.byteOffset;
      bitOffset = nextOffset.bitOffset;
    }

    if (bitOffset !== 0) {
      throw new Error('object bit fields must end on a byte boundary');
    }

    return {
      result: output as ObjectFromFields<TFields>,
      bytesDecoded: byteOffset - context.byteOffset,
      bitsDecoded: 0,
    };
  },
  encode: (context): EncodeResult => {
    assertByteAligned(context, 'encode object');
    if (!isRecord(context.value)) {
      throw new TypeError('object schema encode value must be an object');
    }
    const root = context.root ?? context.value;
    const chunks: Uint8Array[] = [];
    const encodedObject: Record<PropertyKey, unknown> = {};
    let byteOffset = context.byteOffset;
    let bitOffset = context.bitOffset;
    const bitState: BitEncodeState = {
      currentByte: 0,
      bitOffset,
    };

    for (const [name, schema] of fields) {
      const value = context.value[name];
      const fieldIsBitSchema = isBitSchema(schema);
      const fieldContext = {
        value,
        byteOffset,
        bitOffset,
        encodedObject,
        path: [...context.path, name],
        root,
      };
      const field = withBinaryFormatError(
        () =>
          fieldIsBitSchema
            ? encodeBitField(schema, value, bitState)
            : schema.encode({
                value,
                byteOffset,
                bitOffset,
                encodedObject,
                path: fieldContext.path,
                root,
              }),
        fieldContext,
        schema.kind
      );
      chunks.push(field.result);
      encodedObject[name] = value;
      const nextOffset = fieldIsBitSchema
        ? advanceOffset(byteOffset, bitOffset, {
            bytesDecoded: 0,
            bitsDecoded: field.bitsEncoded,
          })
        : advanceOffset(byteOffset, bitOffset, {
            bytesDecoded: field.bytesEncoded,
            bitsDecoded: field.bitsEncoded,
          });
      byteOffset = nextOffset.byteOffset;
      bitOffset = nextOffset.bitOffset;
      bitState.bitOffset = bitOffset;
    }

    if (bitOffset !== 0) {
      throw new Error('object bit fields must end on a byte boundary');
    }
    const result = concat(chunks);
    return {
      result,
      bytesEncoded: result.byteLength,
      bitsEncoded: 0,
    };
  },
});

const isRecord = (value: unknown): value is Record<PropertyKey, unknown> =>
  (typeof value === 'object' || typeof value === 'function') && value !== null;
