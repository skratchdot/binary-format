export const toUint8Array = (input: unknown): Uint8Array => {
  if (input instanceof Uint8Array) {
    return input;
  }
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  if (!(input instanceof ArrayBuffer)) {
    throw new TypeError('expected an ArrayBuffer or ArrayBufferView');
  }
  return new Uint8Array(input);
};

export const toUint8ArrayLike = (
  input: ArrayBuffer | ArrayBufferView | readonly number[]
): Uint8Array => {
  if (Array.isArray(input) || isReadonlyNumberArray(input)) {
    return Uint8Array.from(input);
  }
  return Uint8Array.from(toUint8Array(input));
};

export const toDataView = (buffer: Uint8Array): DataView =>
  new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

export const bytesEqual = (left: Uint8Array, right: Uint8Array): boolean => {
  if (left.byteLength !== right.byteLength) {
    return false;
  }
  for (let index = 0; index < left.byteLength; index++) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
};

export const formatBytes = (bytesValue: Uint8Array): string =>
  [...bytesValue].map((byte) => byte.toString(16).padStart(2, '0')).join(' ');

export const concat = (chunks: readonly Uint8Array[]): Uint8Array => {
  const byteLength = chunks.reduce(
    (total, chunk) => total + chunk.byteLength,
    0
  );
  const output = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
};

export const bytesFromHex = (hex: string): Uint8Array => {
  const normalized = hex.replaceAll(/\s/g, '');
  if (normalized.length % 2 !== 0) {
    throw new RangeError('hex string must contain an even number of digits');
  }
  const bytesValue = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < bytesValue.length; index++) {
    const byte = Number.parseInt(
      normalized.slice(index * 2, index * 2 + 2),
      16
    );
    if (Number.isNaN(byte)) {
      throw new TypeError('hex string contains invalid digits');
    }
    bytesValue[index] = byte;
  }
  return bytesValue;
};

const isReadonlyNumberArray = (value: unknown): value is readonly number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number');
