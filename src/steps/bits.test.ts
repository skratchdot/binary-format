import BinaryBuffer from '../binary-buffer';
import { BitStepAccumulator } from './bits';
import { Buffer } from 'buffer';

describe('BitStepAccumulator tests', () => {
  describe('addStep', () => {
    test('multiple addStep calls work', () => {
      const bitSteps = new BitStepAccumulator<{
        foo: number;
        bar: number;
      }>();
      bitSteps.addStep('foo', 4, false);
      bitSteps.addStep('bar', 1, true);
      expect(bitSteps.keys).toMatchInlineSnapshot(`
        Set {
          "foo",
          "bar",
        }
      `);
      expect(bitSteps.numBits).toMatchInlineSnapshot(`5`);
      expect(bitSteps.steps).toMatchInlineSnapshot(`
        [
          {
            "littleEndian": false,
            "name": "foo",
            "numBits": 4,
          },
          {
            "littleEndian": true,
            "name": "bar",
            "numBits": 1,
          },
        ]
      `);
    });
  });
  describe('toBinaryFormatSteps', () => {
    const getTestSteps = (littleEndian: boolean) => {
      const bitSteps = new BitStepAccumulator<{
        a: number;
        b: number;
        c: number;
        d: number;
      }>();
      bitSteps.addStep('a', 4, littleEndian);
      bitSteps.addStep('b', 4, littleEndian);
      bitSteps.addStep('c', 4, littleEndian);
      bitSteps.addStep('d', 4, littleEndian);
      return bitSteps;
    };

    describe('read()', () => {
      test('calling toBinaryFormatSteps() works with little endian steps and read() calls', () => {
        const bitSteps = getTestSteps(true);

        const buffer = Buffer.from('abcd', 'hex');
        expect(buffer).toMatchInlineSnapshot(`Buffer<ab cd>`);

        const binaryBuffer = BinaryBuffer.fromBuffer(buffer);
        const steps = bitSteps.toBinaryFormatSteps();

        // test reading
        expect(steps[0].read(binaryBuffer)).toMatchInlineSnapshot(`11`);
        expect(steps[1].read(binaryBuffer)).toMatchInlineSnapshot(`10`);
        expect(steps[2].read(binaryBuffer)).toMatchInlineSnapshot(`13`);
        expect(steps[3].read(binaryBuffer)).toMatchInlineSnapshot(`12`);
      });

      test('calling toBinaryFormatSteps() works with big endian steps and read() calls', () => {
        const bitSteps = getTestSteps(false);

        const buffer = Buffer.from('abcd', 'hex');
        expect(buffer).toMatchInlineSnapshot(`Buffer<ab cd>`);

        const binaryBuffer = BinaryBuffer.fromBuffer(buffer);
        const steps = bitSteps.toBinaryFormatSteps();

        // test reading
        expect(steps[0].read(binaryBuffer)).toMatchInlineSnapshot(`10`);
        expect(steps[1].read(binaryBuffer)).toMatchInlineSnapshot(`11`);
        expect(steps[2].read(binaryBuffer)).toMatchInlineSnapshot(`12`);
        expect(steps[3].read(binaryBuffer)).toMatchInlineSnapshot(`13`);
      });

      test('reading out of order causes an error', () => {
        const bitSteps = getTestSteps(false);

        const buffer = Buffer.from('abcd', 'hex');
        expect(buffer).toMatchInlineSnapshot(`Buffer<ab cd>`);

        const binaryBuffer = BinaryBuffer.fromBuffer(buffer);
        const steps = bitSteps.toBinaryFormatSteps();

        expect(() => {
          steps[1].read(binaryBuffer);
        }).toThrowError('bitStream.read is undefined so cannot read any bits');
      });
    });

    describe('write()', () => {
      test('calling toBinaryFormatSteps() works with little endian steps and write() calls', () => {
        const bitSteps = getTestSteps(true);

        const buffer = Buffer.from('abcd', 'hex');
        expect(buffer).toMatchInlineSnapshot(`Buffer<ab cd>`);

        const binaryBuffer = BinaryBuffer.fromBuffer(buffer);
        const steps = bitSteps.toBinaryFormatSteps();

        // test writing
        steps[0].write(binaryBuffer, 0xb);
        steps[1].write(binaryBuffer, 0xa);
        steps[2].write(binaryBuffer, 0xd);
        steps[3].write(binaryBuffer, 0xc);
        expect(binaryBuffer.toBuffer()).toMatchInlineSnapshot(`Buffer<ab cd>`);
      });

      test('calling toBinaryFormatSteps() works with big endian steps and write() calls', () => {
        const bitSteps = getTestSteps(false);

        const buffer = Buffer.from('abcd', 'hex');
        expect(buffer).toMatchInlineSnapshot(`Buffer<ab cd>`);

        const binaryBuffer = BinaryBuffer.fromBuffer(buffer);
        const steps = bitSteps.toBinaryFormatSteps();

        // test writing
        steps[0].write(binaryBuffer, 0xa);
        steps[1].write(binaryBuffer, 0xb);
        steps[2].write(binaryBuffer, 0xc);
        steps[3].write(binaryBuffer, 0xd);
        expect(binaryBuffer.toBuffer()).toMatchInlineSnapshot(`Buffer<ab cd>`);
      });

      test('writing out of order causes an error', () => {
        const bitSteps = getTestSteps(true);

        const buffer = Buffer.from('abcd', 'hex');
        expect(buffer).toMatchInlineSnapshot(`Buffer<ab cd>`);

        const binaryBuffer = BinaryBuffer.fromBuffer(buffer);
        const steps = bitSteps.toBinaryFormatSteps();

        expect(() => {
          steps[1].write(binaryBuffer, 0xa);
        }).toThrowError(
          'bitStream.write is undefined so cannot write any bits'
        );
      });
    });
  });
});
