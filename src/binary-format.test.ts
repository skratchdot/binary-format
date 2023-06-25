import BinaryFormat from './binary-format';
import BinaryFormatter from './binary-formatter';
import { Buffer } from 'buffer';

let buffer: Buffer;

describe('BinaryFormat tests', () => {
  describe('general tests', () => {
    test('cannot add step after calling done()', () => {
      const binaryFormat = new BinaryFormat<{
        a: string;
        b: string;
        c: string;
        d: string;
      }>();
      binaryFormat.string('a', 1);
      binaryFormat.string('b', 1);
      binaryFormat.string('c', 1);
      binaryFormat.done();
      expect(() => {
        binaryFormat.string('d', 1);
      }).toThrowError('cannot add steps. parser has already be created.');
    });
    test('calling done multiple times returns the same formatter', () => {
      const binaryFormat = new BinaryFormat();
      const bf1 = new BinaryFormatter();
      const bf2 = binaryFormat.done();
      const bf3 = binaryFormat.done();
      expect(bf1).toBe(bf1);
      expect(bf1).not.toBe(bf2);
      expect(bf1).not.toBe(bf3);
      expect(bf2).toBe(bf3);
    });
    test('cannot call toArray if there is not a previous step', () => {
      expect(() => {
        new BinaryFormat().toArray(5).done();
      }).toThrowError(
        'cannot convert previous step to an array because no previous steps exist'
      );
    });
    test('cannot try to add the same key multiple times', () => {
      expect(() => {
        new BinaryFormat<{ a: number }>().uint8('a').uint8('a').done();
      }).toThrowError('cannot add step. the key "a" has alraedy been added.');
    });
  });

  describe('"hello world!" tests', () => {
    beforeEach(() => {
      buffer = Buffer.from('hello world!');
    });
    test('empty format', () => {
      const bf = new BinaryFormat().done();
      const r1 = bf.read(buffer);
      const r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`{}`);
      expect(r2).toMatchInlineSnapshot(`Buffer<>`);
    });
    test('a few numbers', () => {
      const bf = new BinaryFormat<{
        a: number;
        b: number;
        c: number;
        d: number;
      }>()
        .uint16('a')
        .int16('b')
        .int32le('c')
        .uint32be('d')
        .done();
      const r1 = bf.read(buffer);
      const r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "a": 26725,
          "b": 27756,
          "c": 1870078063,
          "d": 1919706145,
        }
      `);
      expect(r2).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
      );
    });
    test('big ints: uint64be', () => {
      const bf = new BinaryFormat<{ a: bigint; b: number }>()
        .uint64be('a')
        .uint32be('b')
        .done();
      const r1 = bf.read(buffer);
      const r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "a": 7522537965568948079n,
          "b": 1919706145,
        }
      `);
      expect(r2).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
      );
    });
    test('big ints: uint64le', () => {
      const bf = new BinaryFormat<{ a: bigint; b: number }>()
        .uint64le('a')
        .uint32be('b')
        .done();
      const r1 = bf.read(buffer);
      const r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "a": 8031924123371070824n,
          "b": 1919706145,
        }
      `);
      expect(r2).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
      );
    });
    test('big ints: uint64 with little endian set', () => {
      const bf = new BinaryFormat<{ a: bigint; b: number }>()
        .endianess('little')
        .uint64('a')
        .uint32be('b')
        .done();
      const r1 = bf.read(buffer);
      const r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "a": 8031924123371070824n,
          "b": 1919706145,
        }
      `);
      expect(r2).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
      );
    });
    test('endianess sets default mode', () => {
      interface TestInterface {
        a: number;
        b: number;
        c: number;
      }
      let bf: BinaryFormatter<TestInterface>;
      bf = new BinaryFormat<TestInterface>()
        .endianess('big')
        .uint32('a')
        .uint32('b')
        .uint32('c')
        .done();
      expect(bf.read(buffer)).toMatchInlineSnapshot(`
        {
          "a": 1751477356,
          "b": 1864398703,
          "c": 1919706145,
        }
      `);
      bf = new BinaryFormat<TestInterface>()
        .endianess('little')
        .uint32('a')
        .uint32('b')
        .uint32('c')
        .done();
      expect(bf.read(buffer)).toMatchInlineSnapshot(`
        {
          "a": 1819043176,
          "b": 1870078063,
          "c": 560229490,
        }
      `);
      bf = new BinaryFormat<TestInterface>()
        .endianess('little')
        .uint32('a')
        .endianess('big')
        .uint32('b')
        .endianess('little')
        .uint32('c')
        .done();
      expect(bf.read(buffer)).toMatchInlineSnapshot(`
        {
          "a": 1819043176,
          "b": 1864398703,
          "c": 560229490,
        }
      `);
      expect(() => {
        bf = new BinaryFormat<TestInterface>()
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          .endianess('xxx')
          .uint32('a')
          .uint32('b')
          .uint32('c')
          .done();
      }).toThrowError('invalid "endianess" value. can be "little" or "big".');
    });
    test('string parsing', () => {
      const bf = new BinaryFormat<{
        hello: number;
        space: number;
        world: number;
        exclaimation: number;
      }>()
        .string('hello', 5)
        .string('space', 1)
        .string('world', 5)
        .string('exclaimation', 1)
        .done();
      const r1 = bf.read(buffer);
      const r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "exclaimation": "!",
          "hello": "hello",
          "space": " ",
          "world": "world",
        }
      `);
      expect(r2).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
      );
    });
    describe('toArray', () => {
      test('arrays', () => {
        const bf = new BinaryFormat<{
          singleChars: Array<string>;
          twoChars: Array<string>;
        }>()
          .string('twoChars', 2)
          .toArray(3)
          .string('singleChars', 1)
          .toArray(6)
          .done();
        const r1 = bf.read(buffer);
        const r2 = bf.write(r1);
        expect(r1).toMatchInlineSnapshot(`
          {
            "singleChars": [
              "w",
              "o",
              "r",
              "l",
              "d",
              "!",
            ],
            "twoChars": [
              "he",
              "ll",
              "o ",
            ],
          }
        `);
        expect(r2).toMatchInlineSnapshot(
          `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
        );
      });
      test('array of arrays', () => {
        const bf = new BinaryFormat<{
          chars: Array<Array<string>>;
        }>()
          .string('chars', 2)
          .toArray(3)
          .toArray(2)
          .done();
        const r1 = bf.read(buffer);
        const r2 = bf.write(r1);
        expect(r1).toMatchInlineSnapshot(`
          {
            "chars": [
              [
                "he",
                "ll",
                "o ",
              ],
              [
                "wo",
                "rl",
                "d!",
              ],
            ],
          }
        `);
        expect(r2).toMatchInlineSnapshot(
          `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
        );
      });
      test('toArray(number) works', () => {
        const bf = new BinaryFormat<{
          a: Array<string>;
          b: Array<string>;
        }>()
          .string('a', 1)
          .toArray(6)
          .string('b', 1)
          .toArray(6)
          .done();
        const r1 = bf.read(buffer);
        const r2 = bf.write(r1);
        expect(r1).toMatchInlineSnapshot(`
          {
            "a": [
              "h",
              "e",
              "l",
              "l",
              "o",
              " ",
            ],
            "b": [
              "w",
              "o",
              "r",
              "l",
              "d",
              "!",
            ],
          }
        `);
        expect(r2).toMatchInlineSnapshot(
          `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
        );
      });
      test('toArray("eof") works', () => {
        const bf = new BinaryFormat<{
          a: Array<string>;
          b: Array<string>;
        }>()
          .string('a', 1)
          .toArray(2)
          .string('b', 1)
          .toArray('eof')
          .done();
        const r1 = bf.read(buffer);
        const r2 = bf.write(r1);
        expect(r1).toMatchInlineSnapshot(`
          {
            "a": [
              "h",
              "e",
            ],
            "b": [
              "l",
              "l",
              "o",
              " ",
              "w",
              "o",
              "r",
              "l",
              "d",
              "!",
            ],
          }
        `);
        expect(r2).toMatchInlineSnapshot(
          `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
        );
      });
      test('toArray(function) works', () => {
        const bf = new BinaryFormat<{
          a: Array<string>;
          b: Array<string>;
        }>()
          .string('a', 1)
          .toArray(({ index }) => index < 4)
          .string('b', 1)
          .toArray(({ index }) => index < 8)
          .done();
        const r1 = bf.read(buffer);
        const r2 = bf.write(r1);
        expect(r1).toMatchInlineSnapshot(`
          {
            "a": [
              "h",
              "e",
              "l",
              "l",
            ],
            "b": [
              "o",
              " ",
              "w",
              "o",
              "r",
              "l",
              "d",
              "!",
            ],
          }
        `);
        expect(r2).toMatchInlineSnapshot(
          `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
        );
      });
    });
    test('nested objects', () => {
      interface TopLevel {
        hello: string;
        space: number;
        world: World;
        exclaimation: number;
      }
      interface World {
        w: string;
        o: string;
        r: string;
        l: string;
        d: string;
      }
      const world = new BinaryFormat<World>()
        .string('w', 1)
        .string('o', 1)
        .string('r', 1)
        .string('l', 1)
        .string('d', 1)
        .done();
      const helloWorld = new BinaryFormat<TopLevel>()
        .string('hello', 5)
        .uint8('space')
        .custom('world', world)
        .uint8('exclaimation')
        .done();
      const r1 = helloWorld.read(buffer);
      const r2 = helloWorld.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "exclaimation": 33,
          "hello": "hello",
          "space": 32,
          "world": {
            "d": "d",
            "l": "l",
            "o": "o",
            "r": "r",
            "w": "w",
          },
        }
      `);
      expect(r2).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
      );
    });
    test('buffers', () => {
      const bf = new BinaryFormat<{
        hello: Buffer;
        space: number;
        world: Buffer;
        exclaimation: number;
      }>()
        .buffer('hello', 5)
        .uint8('space')
        .buffer('world', 5)
        .uint8('exclaimation')
        .done();
      const r1 = bf.read(buffer);
      const r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "exclaimation": 33,
          "hello": Buffer<68 65 6c 6c 6f>,
          "space": 32,
          "world": Buffer<77 6f 72 6c 64>,
        }
      `);
      expect(r2).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
      );
    });

    test('plainarrays', () => {
      const bf = new BinaryFormat<{
        hello: Array<number>;
        space: number;
        world: Array<number>;
        exclaimation: number;
      }>()
        .plainarray('hello', 5)
        .uint8('space')
        .plainarray('world', 5)
        .uint8('exclaimation')
        .done();
      const r1 = bf.read(buffer);
      const r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "exclaimation": 33,
          "hello": [
            104,
            101,
            108,
            108,
            111,
          ],
          "space": 32,
          "world": [
            119,
            111,
            114,
            108,
            100,
          ],
        }
      `);
      expect(r2).toMatchInlineSnapshot(
        `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
      );
    });

    describe('bits', () => {
      test('normal bits() usage works and defaults to big endian', () => {
        const bf = new BinaryFormat<{
          h1: number;
          h2: number;
          e1: number;
          ll: number;
          o1: number;
          o2: number;
          o3: number;
          space: number;
          world: Buffer;
          exclaimation: number;
        }>()
          .bits('h1', 4)
          .bits('h2', 4)
          .bits('e1', 8)
          .bits('ll', 16)
          .bits('o1', 3)
          .bits('o2', 2)
          .bits('o3', 3)
          .uint8('space')
          .buffer('world', 5)
          .uint8('exclaimation')
          .done();
        const r1 = bf.read(buffer);
        const r2 = bf.write(r1);
        expect(r1).toMatchInlineSnapshot(`
          {
            "e1": 101,
            "exclaimation": 33,
            "h1": 6,
            "h2": 8,
            "ll": 27756,
            "o1": 3,
            "o2": 1,
            "o3": 7,
            "space": 32,
            "world": Buffer<77 6f 72 6c 64>,
          }
        `);
        expect(r2).toMatchInlineSnapshot(
          `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
        );
      });
      test('little endian bits() usage works', () => {
        const bf = new BinaryFormat<{
          h1: number;
          h2: number;
          e1: number;
          ll: number;
          o1: number;
          o2: number;
          o3: number;
          space: number;
          world: Buffer;
          exclaimation: number;
        }>()
          .endianess('little')
          .bits('h1', 4)
          .bits('h2', 4)
          .bits('e1', 8)
          .bits('ll', 16)
          .bits('o1', 3)
          .bits('o2', 2)
          .bits('o3', 3)
          .uint8('space')
          .buffer('world', 5)
          .uint8('exclaimation')
          .done();
        const r1 = bf.read(buffer);
        const r2 = bf.write(r1);
        expect(r1).toMatchInlineSnapshot(`
          {
            "e1": 101,
            "exclaimation": 33,
            "h1": 8,
            "h2": 6,
            "ll": 27756,
            "o1": 7,
            "o2": 1,
            "o3": 3,
            "space": 32,
            "world": Buffer<77 6f 72 6c 64>,
          }
        `);
        expect(r2).toMatchInlineSnapshot(
          `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
        );
      });
      test('bitN() usage works and defaults to big endian', () => {
        const bf = new BinaryFormat<{
          h1: number;
          h2: number;
          e1: number;
          ll: number;
          o1: number;
          o2: number;
          o3: number;
          space: number;
          world: Buffer;
          exclaimation: number;
        }>()
          .bit4('h1')
          .bit4('h2')
          .bit8('e1')
          .bit16('ll')
          .bit3('o1')
          .bit2('o2')
          .bit3('o3')
          .uint8('space')
          .buffer('world', 5)
          .uint8('exclaimation')
          .done();
        const r1 = bf.read(buffer);
        const r2 = bf.write(r1);
        expect(r1).toMatchInlineSnapshot(`
          {
            "e1": 101,
            "exclaimation": 33,
            "h1": 6,
            "h2": 8,
            "ll": 27756,
            "o1": 3,
            "o2": 1,
            "o3": 7,
            "space": 32,
            "world": Buffer<77 6f 72 6c 64>,
          }
        `);
        expect(r2).toMatchInlineSnapshot(
          `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
        );
      });

      test('cannot call toArray() after a bits() call', () => {
        expect(() => {
          new BinaryFormat<{
            a: number;
          }>()
            .bits('a', 8)
            .toArray(1)
            .done();
        }).toThrow('cannot convert previous bits() call to an array');
      });
      test('cannot call other methods after bits() if you have not reached the end of a byte', () => {
        expect(() => {
          new BinaryFormat<{
            a: number;
            b: number;
          }>()
            .bits('a', 4)
            .uint8('b')
            .done();
        }).toThrow(
          'your previous bits() call(s) bitSize should be a multiple of 8'
        );
      });
    });

    describe('choice', () => {
      test('choice with choiceKey as string', () => {
        const choiceHello = new BinaryFormat<{
          endOfHelloAndSpace: string;
        }>()
          .string('endOfHelloAndSpace', 5)
          .done();
        const choiceWorld = new BinaryFormat<{
          endOfWorldAndExclaimation: string;
        }>()
          .string('endOfWorldAndExclaimation', 5)
          .done();
        const choices = {
          h: choiceHello,
          w: choiceWorld,
        };
        const bf = new BinaryFormat<{
          choice1Tag: number;
          choice1Value: number;
          choice2Tag: number;
          choice2Value: number;
        }>()
          .string('choice1Tag', 1)
          .choice('choice1Value', 'choice1Tag', choices)
          .string('choice2Tag', 1)
          .choice('choice2Value', 'choice2Tag', choices)
          .done();
        const r1 = bf.read(buffer);
        const r2 = bf.write(r1);
        expect(r1).toMatchInlineSnapshot(`
          {
            "choice1Tag": "h",
            "choice1Value": {
              "endOfHelloAndSpace": "ello ",
            },
            "choice2Tag": "w",
            "choice2Value": {
              "endOfWorldAndExclaimation": "orld!",
            },
          }
        `);
        expect(r2).toMatchInlineSnapshot(
          `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
        );
      });

      test('choice with choiceKey as function', () => {
        const choiceHello = new BinaryFormat<{
          endOfHelloAndSpace: string;
        }>()
          .string('endOfHelloAndSpace', 5)
          .done();
        const choiceWorld = new BinaryFormat<{
          endOfWorldAndExclaimation: string;
        }>()
          .string('endOfWorldAndExclaimation', 5)
          .done();
        const choices = {
          h: choiceHello,
          w: choiceWorld,
        };
        const bf = new BinaryFormat<{
          choice1Tag: number;
          choice1Value: number;
          choice2Tag: number;
          choice2Value: number;
        }>()
          .string('choice1Tag', 1)
          .choice('choice1Value', () => 'h', choices)
          .string('choice2Tag', 1)
          .choice('choice2Value', () => 'w', choices)
          .done();
        const r1 = bf.read(buffer);
        const r2 = bf.write(r1);
        expect(r1).toMatchInlineSnapshot(`
          {
            "choice1Tag": "h",
            "choice1Value": {
              "endOfHelloAndSpace": "ello ",
            },
            "choice2Tag": "w",
            "choice2Value": {
              "endOfWorldAndExclaimation": "orld!",
            },
          }
        `);
        expect(r2).toMatchInlineSnapshot(
          `Buffer<68 65 6c 6c 6f 20 77 6f 72 6c 64 21>`
        );
      });
    });
  });

  describe('string tests', () => {
    test('can read different string encodings - some of which do not write data back in the same format', () => {
      buffer = Buffer.from('ffffffffffffffff', 'hex');
      expect(buffer).toMatchInlineSnapshot(`Buffer<ff ff ff ff ff ff ff ff>`);
      let bf;
      let r1;
      let r2;
      bf = new BinaryFormat<{ a: number }>().string('a', 8).done();
      r1 = bf.read(buffer);
      r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "a": "��������",
        }
      `);
      expect(r2).toMatchInlineSnapshot(`Buffer<ef bf bd ef bf bd ef bf>`);
      bf = new BinaryFormat<{ a: number }>().string('a', 8, 'utf8').done();
      r1 = bf.read(buffer);
      r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "a": "��������",
        }
      `);
      expect(r2).toMatchInlineSnapshot(`Buffer<ef bf bd ef bf bd ef bf>`);
      bf = new BinaryFormat<{ a: number }>().string('a', 8, 'utf16le').done();
      r1 = bf.read(buffer);
      r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "a": "￿￿￿￿",
        }
      `);
      expect(r2).toMatchInlineSnapshot(`Buffer<ff ff ff ff ff ff ff ff>`);
      bf = new BinaryFormat<{ a: number }>().string('a', 8, 'latin1').done();
      r1 = bf.read(buffer);
      r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "a": "ÿÿÿÿÿÿÿÿ",
        }
      `);
      expect(r2).toMatchInlineSnapshot(`Buffer<ff ff ff ff ff ff ff ff>`);
    });
  });

  describe('bit tests', () => {
    test('can read in 2 nibbles: big endian', () => {
      buffer = Buffer.from('ab', 'hex');
      const bf = new BinaryFormat<{
        a: number;
        b: number;
      }>()
        .endianess('big')
        .bit4('a')
        .bit4('b')
        .done();
      const r1 = bf.read(buffer);
      const r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "a": 10,
          "b": 11,
        }
      `);
      expect(r2).toMatchInlineSnapshot(`Buffer<ab>`);
    });
    test('can read in 2 nibbles: little endian', () => {
      buffer = Buffer.from('ab', 'hex');
      const bf = new BinaryFormat<{
        a: number;
        b: number;
      }>()
        .endianess('little')
        .bit4('b')
        .bit4('a')
        .done();
      const r1 = bf.read(buffer);
      const r2 = bf.write(r1);
      expect(r1).toMatchInlineSnapshot(`
        {
          "a": 10,
          "b": 11,
        }
      `);
      expect(r2).toMatchInlineSnapshot(`Buffer<ab>`);
    });
    test('throw an error if done() is called before ending bitStep accumulation', () => {
      buffer = Buffer.from('ab', 'hex');
      expect(() => {
        new BinaryFormat<{
          a: number;
        }>()
          .bit4('a')
          .done();
      }).toThrow(
        'your previous bits() call(s) bitSize should be a multiple of 8'
      );
    });
  });
});
