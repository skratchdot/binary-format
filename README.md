# binary-format

a typescript library for reading and writing binary files to and from plain javascript objects.

there is a plethora of exiting libraries that accomplish the same goal, but all come with tradeoffs.

i am trading some speed in favor or using "plain" javascript objects that immer supports because i wanted
to use immutable data structures while working on an online editor that supports the editing of various
file formats.

## quick start

```typescript
import BinaryFormat from '@skratchdot/binary-format';
const helloWorldParser = new BinaryFormat<{
  hello: string;
  asciiSpace: number;
  world: string;
  asciiExclaimation: number;
}>()
  .string('hello', 5)
  .uint8('asciiSpace')
  .string('world', 5)
  .uint8('asciiExclaimation')
  .done();
const buffer = Buffer.from('hello world!');
const readResult = helloWorldParser.read(buffer);
const writeResult = helloWorldParser.write(readResult);
console.log({ readResult, writeResult });
/*
{
  readResult: {
    hello: 'hello',
    asciiSpace: 32,
    world: 'world',
    asciiExclaimation: 33
  },
  writeResult: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64 21>
}
*/
```

## features

- written in typescript
- supports both reading and writing of binary files
- supports formatting to/from "plain" javascript objects (that are serializable and supported via immutability libs like `immer`)
- supports formatting to/from "complex" javascript objects like typed arrays and buffers

## documentation

coming soon. for now check out the examples folder or the unit tests

#### Custom

```typescript
export const stringWithLength = (length: number): ReadAndWrite => ({
  read: (r: SmartBuffer) => r.readString(length),
  write: (w: SmartBuffer, v: unknown) => w.writeString(String(v), length),
});
```

## see also

#### parsing libs

- https://github.com/keichi/binary-parser
- https://github.com/anfema/bin-grammar
- https://github.com/substack/node-binary
- https://github.com/reklatsmasters/binary-data
- https://github.com/foliojs/restructure
- https://kaitai.io/
- https://github.com/lammas/bin-format
- https://github.com/RobertBorg/node-BinaryFormat
- https://www.npmjs.com/package/memory-efficient-object
- https://www.npmjs.com/package/@astronautlabs/bitstream?activeTab=readme

#### buffer libs:

- https://github.com/inolen/bit-buffer
- https://github.com/feross/buffer
- https://github.com/JoshGlazebrook/smart-buffer
- https://github.com/fredricrylander/bits
- https://github.com/uupaa/Bit.js/
- https://github.com/FlorianWendelborn/bitwise
- https://github.com/steinwurf/bitter (c library)
- https://www.npmjs.com/package/node-bit-stream
- https://github.com/thi-ng/umbrella/tree/develop/packages/bitstream
- https://github.com/conekt/bitsandbytes
- https://www.npmjs.com/package/bits-bytes (pack and unpack)
- https://github.com/francisrstokes/construct-js
- https://github.com/rochars/byte-data

## todos

- detect cycles
- add streaming support
- add example parsers
- remove all dependencies
  - update BinaryBuffer so it supports all the functionality of bit-buffer and smart-buffer (with bit/byte offset logic)
- consider "export parser" so endusers don't need to include unneeded generator code in their project
- generate api documentation and add better comments
- support signed/unsigned and big/little endian for _everything_ (right now i'm assuming unsigned for bits)
- add library comparison chart
- add benchmarks and make performance improvements
- add "assertion" logic
  - assert at EOF after reading (optional)
  - add `.assert(data => data.foo === 'must be this value')` to api
- add seek/pointer logic
- let `toArray()` take a funtion instead of a number as the only parameter (potentially other objects that take a length: `string()` and `buffer()` etc)
- add `typedarray` logic (maybe things like `uint8array()`)
- can we ever support `toArray()` being called on `bits()`?
