import { stringRead, stringStep, stringWrite } from './string';

import BinaryBuffer from '../binary-buffer';
import createBinaryBuffer from '../util/create-binary-buffer';

describe('string tests', () => {
  describe('stringRead', () => {
    test('can read a string of length 5', () => {
      const bb = createBinaryBuffer('hello world');
      const result = stringRead(5)(bb);
      expect(result).toMatchInlineSnapshot(`"hello"`);
    });
    test('can read a 🔥 in utf8', () => {
      const bb = createBinaryBuffer('🔥fire🔥');
      const result = stringRead(4, 'utf8')(bb);
      expect(result).toMatchInlineSnapshot(`"🔥"`);
    });
    test('can read a 🔥 in ascii as "p%"', () => {
      const bb = createBinaryBuffer('🔥fire🔥');
      const result = stringRead(4, 'ascii')(bb);
      expect(result).toMatchInlineSnapshot(`"p%"`);
    });
    test('can read when length="eof"', () => {
      const bb = createBinaryBuffer('hello world');
      const result = stringRead('eof')(bb);
      expect(result).toMatchInlineSnapshot(`"hello world"`);
    });
    test('can read when length="nt"', () => {
      const bb = createBinaryBuffer('hello\0world');
      const result = stringRead('nt')(bb);
      expect(result).toMatchInlineSnapshot(`"hello"`);
    });
    test('will throw an error when an invalid length is passed in', () => {
      const bb = createBinaryBuffer('hello world');
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        stringRead('xxx')(bb);
      }).toThrowError('invalid LengthOption of length="xxx"');
    });
  });
  describe('stringWrite', () => {
    test('can write a string of length 5', () => {
      const bb = new BinaryBuffer();
      stringWrite(5)(bb, 'hello world');
      expect(bb.rw.writeOffset).toMatchInlineSnapshot(`5`);
      expect(bb.toBuffer()).toMatchInlineSnapshot(`Buffer<68 65 6c 6c 6f>`);
    });
    test('can write a 🔥 in utf8', () => {
      const bb = new BinaryBuffer();
      stringWrite(4, 'utf8')(bb, '🔥');
      expect(bb.rw.writeOffset).toMatchInlineSnapshot(`4`);
      expect(bb.toBuffer()).toMatchInlineSnapshot(`Buffer<f0 9f 94 a5>`);
    });
    test('can write a 🔥 in ascii', () => {
      const bb = new BinaryBuffer();
      stringWrite(4, 'ascii')(bb, '🔥');
      expect(bb.rw.writeOffset).toMatchInlineSnapshot(`4`);
      expect(bb.toBuffer()).toMatchInlineSnapshot(`Buffer<3d 25 00 00>`);
    });
    test('can write when length="eof"', () => {
      const bb = new BinaryBuffer();
      stringWrite('eof')(bb, 'hello world');
      expect(bb.rw.writeOffset).toMatchInlineSnapshot(`11`);
      expect(bb.toBuffer()).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64>`
      );
    });
    test('can write when length="nt"', () => {
      const bb = new BinaryBuffer();
      stringWrite('nt')(bb, 'hello');
      expect(bb.rw.writeOffset).toMatchInlineSnapshot(`6`);
      expect(bb.toBuffer()).toMatchInlineSnapshot(`Buffer<68 65 6c 6c 6f 00>`);
    });
    test('will throw an error when an invalid length is passed in', () => {
      const bb = new BinaryBuffer();
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        stringWrite('xxx')(bb, 'hello');
      }).toThrowError('invalid LengthOption of length="xxx"');
    });
  });
  describe('stringStep', () => {
    test('calls the correct read/write methods', () => {
      const step = stringStep(5);

      // read
      const bbRead = createBinaryBuffer('hello world');
      const readResult = step.read(bbRead);
      expect(readResult).toMatchInlineSnapshot(`"hello"`);

      // write
      const bbWrite = new BinaryBuffer();
      step.write(bbWrite, 'hello world');
      expect(bbWrite.toBuffer()).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f>`
      );
    });
  });
});
