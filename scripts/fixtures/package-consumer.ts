/** Compiled against the packed declarations as both ESM and CommonJS; never executed. */
import * as bf from '@binary-format/binary-format';

declare function expectType<T>(value: T): void;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
declare function expectTrue<T extends true>(): T;

const item = bf.object([['value', bf.uint8()]]);
const nested = bf.object([
  ['items', bf.array(item, 1)],
  ['reserved', bf.skip(1), { omitUndefined: true }],
  ['required', bf.skip(0)],
]);
type Nested = bf.infer<typeof nested>;
expectTrue<Equal<Nested['items'][number]['value'], number>>();
expectTrue<Equal<{} extends Pick<Nested, 'reserved'> ? true : false, true>>();
expectTrue<Equal<{} extends Pick<Nested, 'required'> ? true : false, false>>();

const value: Nested = { items: [{ value: 42 }], required: undefined };
expectType<Uint8Array>(bf.encode(nested, value));
expectType<Nested>(bf.decode(nested, new Uint8Array()));
const readonlyValue = { items: [{ value: 42 }], required: undefined } as const;
bf.encode(nested, readonlyValue);
// @ts-expect-error nested numeric fields do not accept strings
const _invalidNested: Nested = { items: [{ value: '42' }], required: undefined };
// @ts-expect-error omitUndefined does not make other fields optional
const _missingRequired: Nested = { items: [] };
// @ts-expect-error the array field remains required
const _missingItems: Nested = { required: undefined };

const union = bf.choice(() => 0, { 0: bf.uint8(), 1: bf.string(1) });
expectTrue<Equal<bf.infer<typeof union>, number | string>>();
// @ts-expect-error a choice without a boolean branch does not accept booleans
const _invalidChoice: bf.infer<typeof union> = false;
const withFallback = bf.choice(() => undefined, { 0: bf.uint8() }, bf.string(1));
expectTrue<Equal<bf.infer<typeof withFallback>, number | string>>();

const flag = bf.custom<boolean>({
  kind: 'flag',
  decode: (context) => {
    expectType<bf.DecodeContext>(context);
    return { result: context.buffer[context.byteOffset] === 1, bytesDecoded: 1, bitsDecoded: 0 };
  },
  encode: (context) => {
    expectType<bf.EncodeContext>(context);
    return { result: Uint8Array.of(context.value ? 1 : 0), bytesEncoded: 1, bitsEncoded: 0 };
  },
});
expectTrue<Equal<bf.infer<typeof flag>, boolean>>();
const customObject = bf.object([['enabled', flag]]);
expectTrue<Equal<bf.infer<typeof customObject>['enabled'], boolean>>();
// @ts-expect-error custom schema inference is retained in object fields
const _invalidCustom: bf.infer<typeof customObject> = { enabled: 'yes' };
bf.custom<boolean>({
  // @ts-expect-error a custom decoder must return its declared value type
  decode: () => ({ result: 'yes', bytesDecoded: 0, bitsDecoded: 0 }),
  encode: flag.encode,
});

expectTrue<Equal<bf.infer<ReturnType<typeof bf.uint64>>, bigint>>();
expectTrue<Equal<bf.infer<ReturnType<typeof bf.float32>>, number>>();
expectTrue<Equal<bf.infer<ReturnType<typeof bf.bytes>>, Uint8Array>>();
expectTrue<Equal<typeof bf.uint8Array, typeof bf.bytes>>();
