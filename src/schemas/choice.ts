import { assertByteAligned, assertByteResult } from '../helpers/context';
import type { DecodeContext, DecodeResult, EncodeContext, Schema } from '../types';

type ChoiceOptionMap = Readonly<Record<string | number, Schema<unknown>>>;

type ChoiceValue<TOptions extends ChoiceOptionMap> =
  TOptions[keyof TOptions] extends Schema<infer TValue> ? TValue : never;

type ChoiceSelector = (context: DecodeContext | EncodeContext) => string | number | undefined;

export const choice = <
  const TOptions extends ChoiceOptionMap,
  TDefault extends Schema<unknown> | undefined = undefined,
>(
  selector: ChoiceSelector,
  options: TOptions,
  defaultSchema?: TDefault
): Schema<ChoiceValue<TOptions> | (TDefault extends Schema<infer TValue> ? TValue : never)> => ({
  kind: 'choice',
  decode: (context) => {
    assertByteAligned(context, 'decode choice');
    const schema = selectChoiceSchema(selector(context), options, defaultSchema);
    const result = schema.decode(context);
    assertByteResult(result.bitsDecoded, 'choice branches');
    return result as DecodeResult<
      ChoiceValue<TOptions> | (TDefault extends Schema<infer TValue> ? TValue : never)
    >;
  },
  encode: (context) => {
    assertByteAligned(context, 'encode choice');
    const schema = selectChoiceSchema(selector(context), options, defaultSchema);
    const result = schema.encode(context);
    assertByteResult(result.bitsEncoded, 'choice branches');
    return result;
  },
});

const selectChoiceSchema = <
  TOptions extends ChoiceOptionMap,
  TDefault extends Schema<unknown> | undefined,
>(
  choiceValue: string | number | undefined,
  options: TOptions,
  defaultSchema: TDefault
): Schema<unknown> => {
  if (choiceValue !== undefined && Object.hasOwn(options, choiceValue)) {
    return options[choiceValue]!;
  }
  if (defaultSchema) {
    return defaultSchema;
  }
  throw new Error(`no choice schema found for value "${String(choiceValue)}"`);
};
