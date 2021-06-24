import BinaryBuffer from '../binary-buffer';
import createBinaryBuffer from '../util/create-binary-buffer';
import { bufferRead, bufferStep, bufferWrite, validateBuffer } from './buffer';

describe('buffer tests', () => {
  describe('bufferRead', () => {
    test('can read a buffer of length 5', () => {
      const bb = createBinaryBuffer('hello world');
      const result = bufferRead(5)(bb);
      expect(result).toMatchInlineSnapshot(`Buffer<68 65 6c 6c 6f>`);
    });
    test('can read when length="eof"', () => {
      const bb = createBinaryBuffer('hello world');
      const result = bufferRead('eof')(bb);
      expect(result).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64>`
      );
    });
    test('can read when length="nt"', () => {
      const bb = createBinaryBuffer('hello\0world');
      const result = bufferRead('nt')(bb);
      expect(result).toMatchInlineSnapshot(`Buffer<68 65 6c 6c 6f>`);
    });
    test('will throw an error when an invalid length is passed in', () => {
      const bb = createBinaryBuffer('hello world');
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        bufferRead('xxx')(bb);
      }).toThrowError('invalid LengthOption of length="xxx"');
    });
  });
  describe('bufferWrite', () => {
    test('can write a buffer of length 5', () => {
      const bb = new BinaryBuffer();
      bufferWrite(5)(bb, Buffer.from('hello'));
      expect(bb.rw.writeOffset).toMatchInlineSnapshot(`5`);
      expect(bb.toBuffer()).toMatchInlineSnapshot(`Buffer<68 65 6c 6c 6f>`);
    });
    test('can write when length="eof"', () => {
      const bb = new BinaryBuffer();
      bufferWrite('eof')(bb, Buffer.from('hello world'));
      expect(bb.rw.writeOffset).toMatchInlineSnapshot(`11`);
      expect(bb.toBuffer()).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64>`
      );
    });
    test('can write when length="nt"', () => {
      const bb = new BinaryBuffer();
      bufferWrite('nt')(bb, Buffer.from('hello'));
      expect(bb.rw.writeOffset).toMatchInlineSnapshot(`6`);
      expect(bb.toBuffer()).toMatchInlineSnapshot(`Buffer<68 65 6c 6c 6f 00>`);
    });
    test('will throw an error when an invalid length is passed in', () => {
      const bb = new BinaryBuffer();
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        bufferWrite('xxx')(bb, Buffer.from('hello'));
      }).toThrowError('invalid LengthOption of length="xxx"');
    });
    test('will throw an error when length of buffer does not match the length that was passed in', () => {
      const bb = new BinaryBuffer();
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        bufferWrite(3)(bb, Buffer.from('hello'));
      }).toThrowError(
        'buffer has incorrect length. buffer.length=5 but wanted length=3'
      );
    });
  });
  describe('bufferStep', () => {
    test('calls the correct read/write methods', () => {
      const step = bufferStep(5);

      // read
      const bbRead = createBinaryBuffer('hello');
      const readResult = step.read(bbRead);
      expect(readResult).toMatchInlineSnapshot(`Buffer<68 65 6c 6c 6f>`);

      // write
      const bbWrite = new BinaryBuffer();
      step.write(bbWrite, Buffer.from('hello'));
      expect(bbWrite.toBuffer()).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f>`
      );
    });
  });
  describe('validateBuffer', () => {
    test('throw error when a buffer is not passed in', () => {
      expect(() => {
        validateBuffer(false);
      }).toThrowError('"false" is not a invalid buffer');
    });
    test('throw error when buffer length is not correct', () => {
      expect(() => {
        validateBuffer(Buffer.from('hello'), 10);
      }).toThrowError(
        'buffer has incorrect length. buffer.length=5 but wanted length=10'
      );
    });
    test('does not throw and error when buffer length is correct', () => {
      expect(() => {
        validateBuffer(Buffer.from('hello'), 5);
      }).not.toThrowError();
    });
  });
});
