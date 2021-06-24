import BinaryBuffer from '../binary-buffer';
import { ChoiceOptions, CustomFormatter, ReadAndWrite } from '../types';

export const choiceHelper = <T>(
  binaryBuffer: BinaryBuffer,
  fn: (customFormatter: CustomFormatter<T>) => unknown,
  choiceKey: keyof T,
  choiceOptions: ChoiceOptions<T>,
  defaultChoice?: CustomFormatter<T>
): unknown => {
  if (
    binaryBuffer.data &&
    Object.prototype.hasOwnProperty.call(binaryBuffer.data, choiceKey)
  ) {
    const choiceValue = (binaryBuffer.data as T)[choiceKey];
    if (
      (typeof choiceValue === 'string' || typeof choiceValue === 'number') &&
      Object.prototype.hasOwnProperty.call(choiceOptions, choiceValue)
    ) {
      return fn(choiceOptions[choiceValue]);
    }
  }
  if (defaultChoice) {
    return fn(defaultChoice);
  }
};

export const choiceStep = <T>(
  choiceKey: keyof T,
  choiceOptions: ChoiceOptions<T>,
  defaultChoice?: CustomFormatter<T>
): ReadAndWrite => ({
  read: (binaryBuffer: BinaryBuffer): unknown =>
    choiceHelper(
      binaryBuffer,
      (cf: CustomFormatter<T>) => cf._read(binaryBuffer),
      choiceKey,
      choiceOptions,
      defaultChoice
    ),
  write: (binaryBuffer: BinaryBuffer, value: unknown): void => {
    choiceHelper(
      binaryBuffer,
      (cf: CustomFormatter<T>) => cf._write(binaryBuffer, value),
      choiceKey,
      choiceOptions,
      defaultChoice
    );
  },
});
