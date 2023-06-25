import {
  ChoiceKeyFunction,
  ChoiceOptions,
  CustomFormatter,
  ReadAndWrite,
} from '../types';

import BinaryBuffer from '../binary-buffer';

export const fromChoiceKey =
  <T>(choiceKey: keyof T): ChoiceKeyFunction =>
  (binaryBuffer: BinaryBuffer): unknown => {
    if (
      binaryBuffer.data &&
      Object.prototype.hasOwnProperty.call(binaryBuffer.data, choiceKey)
    ) {
      return (binaryBuffer.data as T)[choiceKey];
    }
  };

export const choiceHelper = <T>(
  binaryBuffer: BinaryBuffer,
  fn: (customFormatter: CustomFormatter<T>) => unknown,
  choiceKeyFunction: ChoiceKeyFunction,
  choiceOptions: ChoiceOptions<T>,
  defaultChoice?: CustomFormatter<T>
): unknown => {
  const choiceValue = choiceKeyFunction(binaryBuffer);
  if (
    (typeof choiceValue === 'string' || typeof choiceValue === 'number') &&
    Object.prototype.hasOwnProperty.call(choiceOptions, choiceValue)
  ) {
    return fn(choiceOptions[choiceValue]);
  }
  if (defaultChoice) {
    return fn(defaultChoice);
  }
};

export const choiceStep = <T>(
  choiceKeyFunction: ChoiceKeyFunction,
  choiceOptions: ChoiceOptions<T>,
  defaultChoice?: CustomFormatter<T>
): ReadAndWrite => ({
  read: (binaryBuffer: BinaryBuffer): unknown =>
    choiceHelper(
      binaryBuffer,
      (cf: CustomFormatter<T>) => cf._read(binaryBuffer),
      choiceKeyFunction,
      choiceOptions,
      defaultChoice
    ),
  write: (binaryBuffer: BinaryBuffer, value: unknown): void => {
    choiceHelper(
      binaryBuffer,
      (cf: CustomFormatter<T>) => cf._write(binaryBuffer, value),
      choiceKeyFunction,
      choiceOptions,
      defaultChoice
    );
  },
});
