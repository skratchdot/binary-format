import type { DecodeContext, EncodeContext } from '../types';

export class BinaryFormatError extends Error {
  public readonly bitOffset: number;
  public readonly byteOffset: number;
  public readonly fieldPath: readonly PropertyKey[];
  public readonly schemaKind?: string;

  public constructor({
    bitOffset,
    byteOffset,
    cause,
    fieldPath,
    message,
    schemaKind,
  }: {
    readonly bitOffset: number;
    readonly byteOffset: number;
    readonly cause: unknown;
    readonly fieldPath: readonly PropertyKey[];
    readonly message: string;
    readonly schemaKind?: string;
  }) {
    super(
      `binary format error at ${formatPath(
        fieldPath
      )} (byteOffset ${byteOffset}, bitOffset ${bitOffset})${
        schemaKind ? ` in ${schemaKind}` : ''
      }: ${message}`
    );
    this.name = 'BinaryFormatError';
    this.bitOffset = bitOffset;
    this.byteOffset = byteOffset;
    this.cause = cause;
    this.fieldPath = fieldPath;
    this.schemaKind = schemaKind;
  }
}

export const withBinaryFormatError = <T>(
  fn: () => T,
  context: Pick<DecodeContext | EncodeContext, 'bitOffset' | 'byteOffset' | 'path'>,
  schemaKind?: string
): T => {
  try {
    return fn();
  } catch (error) {
    if (error instanceof BinaryFormatError) {
      throw error;
    }
    throw new BinaryFormatError({
      bitOffset: context.bitOffset,
      byteOffset: context.byteOffset,
      cause: error,
      fieldPath: context.path,
      message: getErrorMessage(error),
      schemaKind,
    });
  }
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const formatPath = (path: readonly PropertyKey[]): string => {
  if (path.length === 0) {
    return '<root>';
  }
  return path
    .map((part) =>
      typeof part === 'number' ? `[${part}]` : String(part).replaceAll('.', String.raw`\.`)
    )
    .join('.');
};
