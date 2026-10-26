export type LengthFunction = (context: DecodeContext | EncodeContext) => number | 'eof';
export type LengthOption = number | 'eof' | LengthFunction;

export type Schema<T> = {
  readonly kind?: string;
  readonly decode: (context: DecodeContext) => DecodeResult<T>;
  readonly encode: (context: EncodeContext) => EncodeResult;
};

export type infer<TSchema> = TSchema extends Schema<infer TValue> ? TValue : never;

export type DeepReadonly<T> = T extends (...args: readonly never[]) => unknown
  ? T
  : T extends ArrayBufferView
    ? T
    : T extends readonly (infer TValue)[]
      ? readonly DeepReadonly<TValue>[]
      : T extends object
        ? { readonly [TKey in keyof T]: DeepReadonly<T[TKey]> }
        : T;

export type DecodeContext<
  TRoot extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>,
> = {
  readonly buffer: Uint8Array;
  readonly view: DataView;
  readonly byteOffset: number;
  readonly bitOffset: number;
  readonly decodedObject: Partial<TRoot>;
  readonly path: readonly PropertyKey[];
  readonly root?: unknown;
};

export type EncodeContext<
  TValue = unknown,
  TRoot extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>,
> = {
  readonly value: TValue;
  readonly byteOffset: number;
  readonly bitOffset: number;
  readonly encodedObject: Partial<TRoot>;
  readonly path: readonly PropertyKey[];
  readonly root?: TRoot;
};

export type DecodeResult<T> = {
  readonly result: T;
  readonly bytesDecoded: number;
  readonly bitsDecoded: number;
};

export type EncodeResult = {
  readonly result: Uint8Array;
  readonly bytesEncoded: number;
  readonly bitsEncoded: number;
};

export type DecodeOptions = {
  readonly requireEOF?: boolean;
};

export type FieldOptions = {
  readonly omitUndefined?: boolean;
};
