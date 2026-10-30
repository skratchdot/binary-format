# `@binary-format/binary-format`

Define a binary format once, decode it into plain JavaScript objects, and encode
those objects back into bytes. This TypeScript library uses composable schemas
with inferred value types, ESM and CommonJS builds, and no runtime dependencies.
It favors plain objects that work well with immutable-data tools such as Immer.

## Install

```bash
npm install @binary-format/binary-format
```

Node.js 22 or later is supported. Browser usage relies on standard typed arrays,
DataView, TextEncoder, and TextDecoder.

## Quick start

```typescript
import * as bf from '@binary-format/binary-format';

const greeting = bf.object([
  ['hello', bf.string(5)],
  ['space', bf.uint8()],
  ['world', bf.string(5)],
  ['exclamation', bf.uint8()],
]);

type Greeting = bf.infer<typeof greeting>;

const input = new TextEncoder().encode('hello world!');
const value: Greeting = bf.decode(greeting, input);
// { hello: 'hello', space: 32, world: 'world', exclamation: 33 }

const output = bf.encode(greeting, value);
// Uint8Array containing the same bytes as input
```

An object schema reads and writes fields in tuple order. Compose schemas with
objects, arrays, and tagged choices; use `bf.infer` to derive their value types.
Encoding returns `Uint8Array`; decoding accepts `ArrayBuffer` and bounded views,
including Node.js `Buffer`.

Schemas describe the wire format. Supply consistent count, length, tag, and
checksum fields yourself when encoding. Text lengths are measured in bytes.

## Documentation

| I want to…                     | Read                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Learn to build a format        | [Usage guide](https://github.com/skratchdot/binary-format/blob/main/docs/guide.md)         |
| Look up a function or behavior | [API reference](https://github.com/skratchdot/binary-format/blob/main/docs/api.md)         |
| Pack fields into bits          | [Bit fields](https://github.com/skratchdot/binary-format/blob/main/docs/bit-fields.md)     |
| Upgrade from v0                | [Migration guide](https://github.com/skratchdot/binary-format/blob/main/docs/migration.md) |
| See what changed               | [Changelog](https://github.com/skratchdot/binary-format/blob/main/CHANGELOG.md)            |
| Contribute or run checks       | [Contributing](https://github.com/skratchdot/binary-format/blob/main/CONTRIBUTING.md)      |

Runnable examples cover [schema patterns](https://github.com/skratchdot/binary-format/blob/main/examples/schema-patterns.ts)
and larger [BMP](https://github.com/skratchdot/binary-format/blob/main/examples/bmp.ts),
[IP](https://github.com/skratchdot/binary-format/blob/main/examples/ip.ts), and
[TCP](https://github.com/skratchdot/binary-format/blob/main/examples/tcp.ts) formats.

## Modules and tree shaking

Use ESM imports with a tree-shaking bundler to omit unused factories:

```typescript
import { decode, uint8 } from '@binary-format/binary-format';

const value = decode(uint8(), Uint8Array.of(42)); // 42
```

Static namespace imports also work with modern bundlers. Dynamic property access
can retain additional exports. CommonJS consumers can use
`require('@binary-format/binary-format')`; use ESM for tree shaking.
Each schema includes both encode and decode methods.

## Related libraries

<details>
<summary>Other approaches to binary parsing and byte manipulation</summary>

### Parsing libraries

- [binary-parser](https://github.com/keichi/binary-parser)
- [bin-grammar](https://github.com/anfema/bin-grammar)
- [node-binary](https://github.com/substack/node-binary)
- [binary-data](https://github.com/reklatsmasters/binary-data)
- [restructure](https://github.com/foliojs/restructure)
- [Kaitai Struct](https://kaitai.io/)
- [bin-format](https://github.com/lammas/bin-format)
- [BinaryFormat](https://github.com/RobertBorg/node-BinaryFormat)
- [memory-efficient-object](https://www.npmjs.com/package/memory-efficient-object)
- [@astronautlabs/bitstream](https://www.npmjs.com/package/@astronautlabs/bitstream)

### Bit, byte, and buffer libraries

- [bit-buffer](https://github.com/inolen/bit-buffer)
- [buffer](https://github.com/feross/buffer)
- [smart-buffer](https://github.com/JoshGlazebrook/smart-buffer)
- [bits](https://github.com/fredricrylander/bits)
- [Bit.js](https://github.com/uupaa/Bit.js/)
- [bitwise](https://github.com/FlorianWendelborn/bitwise)
- [bitter](https://github.com/steinwurf/bitter) (C)
- [node-bit-stream](https://www.npmjs.com/package/node-bit-stream)
- [thi.ng bitstream](https://github.com/thi-ng/umbrella/tree/develop/packages/bitstream)
- [bitsandbytes](https://github.com/conekt/bitsandbytes)
- [bits-bytes](https://www.npmjs.com/package/bits-bytes)
- [construct-js](https://github.com/francisrstokes/construct-js)
- [byte-data](https://github.com/rochars/byte-data)

</details>
