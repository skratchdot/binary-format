import BinaryFormatter from './binary-formatter';
import { arrayStep } from './steps/array';
import { numberStep } from './steps/number';
import { stringStep } from './steps/string';

describe('BinaryFormatter', () => {
  test('no steps', () => {
    const buffer = Buffer.from('deadbeef', 'hex');
    const binaryFormatter = new BinaryFormatter();
    expect(binaryFormatter.read(buffer)).toMatchInlineSnapshot(`Object {}`);
    expect(binaryFormatter.write({})).toMatchInlineSnapshot(`Buffer<>`);
  });
  test('buffer with 1 number step', () => {
    const buffer = Buffer.from('deadbeef', 'hex');
    const binaryFormatter = new BinaryFormatter<{
      foo: number;
    }>([
      {
        name: 'foo',
        ...numberStep('UInt8'),
      },
    ]);
    expect(binaryFormatter.read(buffer)).toMatchInlineSnapshot(`
      Object {
        "foo": 222,
      }
    `);
    expect(binaryFormatter.write({ foo: 222 })).toMatchInlineSnapshot(
      `Buffer<de>`
    );
  });
  test('buffer with 1 array of numbers step', () => {
    interface TestInterface {
      foo: Array<number>;
      bar?: Array<string>;
    }
    const buffer = Buffer.from('deadbeef', 'hex');
    const rw = numberStep('UInt8');
    const binaryFormatter = new BinaryFormatter<TestInterface>([
      {
        name: 'foo',
        ...arrayStep(4, rw.read, rw.write),
      },
    ]);
    expect(binaryFormatter.read(buffer)).toMatchInlineSnapshot(`
      Object {
        "foo": Array [
          222,
          173,
          190,
          239,
        ],
      }
    `);
    expect(
      binaryFormatter.write({ foo: [222, 173, 190, 239] })
    ).toMatchInlineSnapshot(`Buffer<de ad be ef>`);

    // when we don't have a "foo" of length 4, we throw an error
    expect(() => {
      binaryFormatter.write({ foo: [222, 173] });
    }).toThrowError(
      'expected an array of length 4, but was passed an array with length 2'
    );
  });
  test('buffer with string steps', () => {
    const buffer = Buffer.from('hello world!');
    const binaryFormatter = new BinaryFormatter<{
      foo: string;
      bar: string;
    }>([
      {
        name: 'foo',
        ...stringStep(2),
      },
      {
        name: 'bar',
        ...stringStep(3),
      },
    ]);
    expect(binaryFormatter.read(buffer)).toMatchInlineSnapshot(`
      Object {
        "bar": "llo",
        "foo": "he",
      }
    `);
    expect(
      binaryFormatter.write({ foo: 'he', bar: 'llo' })
    ).toMatchInlineSnapshot(`Buffer<68 65 6c 6c 6f>`);
    // when we don't have a "bar" of length 3, we fill with zeros
    expect(
      binaryFormatter.write({ foo: 'he', bar: 'l' })
    ).toMatchInlineSnapshot(`Buffer<68 65 6c 00 00>`);
    // when we don't have a "bar" of length 3, we fill with zeros
    expect(binaryFormatter.write({ foo: 'he', bar: '' })).toMatchInlineSnapshot(
      `Buffer<68 65 00 00 00>`
    );
  });
});
