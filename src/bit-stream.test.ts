import { BitStream } from './external/bit-buffer/bit-stream';
import { Buffer } from 'buffer';

const getByteString = (char: string) =>
  char.charCodeAt(0).toString(2).padStart(8, '0');

describe('BitStream tests', () => {
  test('Confirm our BitStream using with the string "He" works', () => {
    const buffer = Buffer.from('He');
    const big = new BitStream(buffer, buffer.byteOffset, buffer.byteLength);
    const little = new BitStream(buffer, buffer.byteOffset, buffer.byteLength);

    // Binary representations of "He"
    expect(getByteString('H')).toMatchInlineSnapshot(`"01001000"`);
    expect(getByteString('e')).toMatchInlineSnapshot(`"01100101"`);

    // Setup endianess
    big.bigEndian = true;
    little.bigEndian = false;

    // big endian reads 'H' first (from "left")
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`1`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`1`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`0`);
    // big endian reads 'e' second (from "left")
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`1`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`1`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`1`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(big.readBits(1, false)).toMatchInlineSnapshot(`1`);

    // little endian reads 'H' first (from "right")
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`1`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`1`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`0`);
    // little endian reads 'e' first (from "right")
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`1`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`1`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`0`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`1`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`1`);
    expect(little.readBits(1, false)).toMatchInlineSnapshot(`0`);
  });
});
