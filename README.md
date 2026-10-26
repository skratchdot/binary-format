# `@binary-format/binary-format`

`@binary-format/binary-format` is a schema-first TypeScript library for decoding
binary files into plain JavaScript objects and encoding them again. It favors
serializable, immutable-data-friendly values over a lowest-level byte API, with a composable, Valibot-style API.

Many binary libraries make different tradeoffs around speed, generated parsers,
or mutable data structures. This package intentionally favors plain objects
that work well with serializing and immutable-data tools such as Immer.

## Quick start

```typescript
import * as bf from '@binary-format/binary-format';

const helloWorldSchema = bf.object([
  ['hello', bf.string(5)],
  ['asciiSpace', bf.uint8()],
  ['world', bf.string(5)],
  ['asciiExclamation', bf.uint8()],
]);

type HelloWorld = bf.infer<typeof helloWorldSchema>;

const bytes = new TextEncoder().encode('hello world!');
const value: HelloWorld = bf.decode(helloWorldSchema, bytes);
const encoded = bf.encode(helloWorldSchema, value);

console.log({ value, encoded });
/*
{
  value: {
    hello: 'hello',
    asciiSpace: 32,
    world: 'world',
    asciiExclamation: 33
  },
  encoded: Uint8Array(12) [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33]
}
*/
```

## Concepts

- Build schemas with primitives, objects, arrays, choices, bytes, text, and
  bit fields.
- Use `bf.infer<typeof schema>` to derive the decoded TypeScript value.
- Use `bf.decode(schema, bytes)` and `bf.encode(schema, value)` at format
  boundaries.
- Implement custom schemas with `decode(context)` and `encode(context)` when a
  format needs behavior beyond the built-in schema types.

### Objects and arrays

```typescript
const schema = bf.object([
  ['count', bf.uint8()],
  ['items', bf.array(bf.uint16be(), 4)],
]);
```

Object fields can include options as a third tuple value. For example,
`{ omitUndefined: true }` skips an `undefined` decoded field while still
letting the field encode reserved bytes.

### Text

`bf.string(length)` reads UTF-8 text. `bf.latin1(length)` reads one-byte
Latin-1 text and supports explicit out-of-range handling. Object fields can
use `{ outOfRange: 'replace' }` or `{ outOfRange: 'truncate' }` with
`bf.latin1()` when needed. Other encodings can be implemented as custom
schemas with an appropriate polyfill or package.

### Custom schemas

Any object with `decode(context)` and `encode(context)` methods can be used as
a schema.

```typescript
const zeroByte = bf.custom<undefined>({
  kind: 'zeroByte',
  decode: (context) => {
    if (context.buffer[context.byteOffset] !== 0) {
      throw new Error('expected zero byte');
    }
    return { result: undefined, bytesDecoded: 1, bitsDecoded: 0 };
  },
  encode: () => ({
    result: Uint8Array.of(0),
    bytesEncoded: 1,
    bitsEncoded: 0,
  }),
});
```

## v1 migration

v1 replaces the v0 chaining API with composable schemas. This branch prepares
version 1.0.0; it has not been published to npm yet. The package name remains
`@binary-format/binary-format`.

- Replace chained format definitions with `object([['field', schema], ...])`.
- Replace formatter methods with `decode(schema, bytes)` and
  `encode(schema, value)`.
- Encoding returns `Uint8Array`. Decoding accepts `ArrayBuffer` and views,
  including Node.js `Buffer`, without a runtime buffer dependency.
- Use `infer<typeof schema>` for value types and `custom()` for extensions.
- See the [BMP](examples/bmp.ts), [IP](examples/ip.ts), and
  [TCP](examples/tcp.ts) schemas for complete examples.

This is a breaking release; the v0 chaining API is no longer exported.

## Modules and tree shaking

The package provides ESM and CommonJS builds with TypeScript declarations.
Use ESM imports with a tree-shaking bundler to omit unused schema factories:

```typescript
import { decode, uint8 } from '@binary-format/binary-format';

const value = decode(uint8(), Uint8Array.of(42));
```

Static namespace imports (as in the quick start) also work with modern bundlers.
Dynamic property access can retain additional exports. CommonJS consumers can
use `require('@binary-format/binary-format')`, but should use ESM for tree shaking.
Each schema includes its encode and decode methods; this does not promise
separate decoder-only and encoder-only bundles.

The runtime uses standard typed arrays, DataView, TextEncoder, and TextDecoder.
Node.js usage requires Node.js 22 or later. Development uses Node.js 24.11+
(or 22.18+) for tsdown. CI builds once on Node 24 and tests the built package
on Node 22 and 24.

## Development

```bash
npm ci
npm test
npm run tsc
npm run build
npm run check
```

`npm run format` formats with oxfmt; `npm run lint` checks code with oxlint.
`npm run build` generates the package with tsdown.

`npm run check` checks formatting, linting, types, coverage, and the packed package's
ESM/CommonJS entry points, declarations, and browser tree shaking. No command
above publishes a release.

## See also

Related libraries for exploring other approaches to binary formats.

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
