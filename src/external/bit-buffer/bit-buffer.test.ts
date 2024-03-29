import { BitStream } from './bit-stream';
import { BitView } from './bit-view';
import { Buffer } from 'buffer';
import { assert } from 'chai';

describe('BitBuffer', function () {
  let array: ArrayBuffer, bv: BitView, bsw: BitStream, bsr: BitStream;

  // todo: was previously setup
  beforeEach(function () {
    array = new ArrayBuffer(64);
    bv = new BitView(array);
    bsw = new BitStream(bv);
    // Test initializing straight from the array.
    bsr = new BitStream(array);
  });

  test('Min / max signed 5 bits', function () {
    const signed_max = (1 << 4) - 1;

    bsw.writeBits(signed_max, 5);
    bsw.writeBits(-signed_max - 1, 5);
    assert(bsr.readBits(5, true) === signed_max);
    assert(bsr.readBits(5, true) === -signed_max - 1);
  });

  test('Min / max unsigned 5 bits', function () {
    const unsigned_max = (1 << 5) - 1;

    bsw.writeBits(unsigned_max, 5);
    bsw.writeBits(-unsigned_max, 5);
    assert.equal(bsr.readBits(5), unsigned_max);
    assert.equal(bsr.readBits(5), 1);
  });

  test('Min / max int8', function () {
    const signed_max = 0x7f;

    bsw.writeInt8(signed_max);
    bsw.writeInt8(-signed_max - 1);
    assert.equal(bsr.readInt8(), signed_max);
    assert.equal(bsr.readInt8(), -signed_max - 1);
  });

  test('Min / max uint8', function () {
    const unsigned_max = 0xff;

    bsw.writeUint8(unsigned_max);
    bsw.writeUint8(-unsigned_max);
    assert.equal(bsr.readUint8(), unsigned_max);
    assert.equal(bsr.readUint8(), 1);
  });

  test('Min / max int16', function () {
    const signed_max = 0x7fff;

    bsw.writeInt16(signed_max);
    bsw.writeInt16(-signed_max - 1);
    assert.equal(bsr.readInt16(), signed_max);
    assert.equal(bsr.readInt16(), -signed_max - 1);
  });

  test('Min / max uint16', function () {
    const unsigned_max = 0xffff;

    bsw.writeUint16(unsigned_max);
    bsw.writeUint16(-unsigned_max);
    assert.equal(bsr.readUint16(), unsigned_max);
    assert.equal(bsr.readUint16(), 1);
  });

  test('Min / max int32', function () {
    const signed_max = 0x7fffffff;

    bsw.writeInt32(signed_max);
    bsw.writeInt32(-signed_max - 1);
    assert.equal(bsr.readInt32(), signed_max);
    assert.equal(bsr.readInt32(), -signed_max - 1);
  });

  test('Min / max uint32', function () {
    const unsigned_max = 0xffffffff;

    bsw.writeUint32(unsigned_max);
    bsw.writeUint32(-unsigned_max);
    assert.equal(bsr.readUint32(), unsigned_max);
    assert.equal(bsr.readUint32(), 1);
  });

  test('Unaligned reads', function () {
    bsw.writeBits(13, 5);
    bsw.writeUint8(0xff);
    bsw.writeBits(14, 5);

    assert.equal(bsr.readBits(5), 13);
    assert.equal(bsr.readUint8(), 0xff);
    assert.equal(bsr.readBits(5), 14);
  });

  test('Min / max float32 (normal values)', function () {
    const scratch = new DataView(new ArrayBuffer(8));

    scratch.setUint32(0, 0x00800000);
    scratch.setUint32(4, 0x7f7fffff);

    const min = scratch.getFloat32(0);
    const max = scratch.getFloat32(4);

    bsw.writeFloat32(min);
    bsw.writeFloat32(max);

    assert.equal(bsr.readFloat32(), min);
    assert.equal(bsr.readFloat32(), max);
  });

  test('Min / max float64 (normal values)', function () {
    const scratch = new DataView(new ArrayBuffer(16));

    scratch.setUint32(0, 0x00100000);
    scratch.setUint32(4, 0x00000000);
    scratch.setUint32(8, 0x7fefffff);
    scratch.setUint32(12, 0xffffffff);

    const min = scratch.getFloat64(0);
    const max = scratch.getFloat64(8);

    bsw.writeFloat64(min);
    bsw.writeFloat64(max);

    assert.equal(bsr.readFloat64(), min);
    assert.equal(bsr.readFloat64(), max);
  });

  test('Overwrite previous value with 0', function () {
    bv.setUint8(0, 13);
    bv.setUint8(0, 0);

    assert.equal(bv.getUint8(0), 0);
  });

  test('Read / write ASCII string, fixed length', function () {
    const str = 'foobar';
    const len = 16;

    bsw.writeASCIIString(str, len);
    assert.equal(bsw.byteIndex, len);

    assert.equal(bsr.readASCIIString(len), str);
    assert.equal(bsr.byteIndex, len);
  });

  test('Read / write ASCII string, unknown length', function () {
    const str = 'foobar';

    bsw.writeASCIIString(str);
    assert.equal(bsw.byteIndex, str.length + 1); // +1 for 0x00

    assert.equal(bsr.readASCIIString(), str);
    assert.equal(bsr.byteIndex, str.length + 1);
  });

  test('Read ASCII string, 0 length', function () {
    const str = 'foobar';

    bsw.writeASCIIString(str);
    assert.equal(bsw.byteIndex, str.length + 1); // +1 for 0x00

    assert.equal(bsr.readASCIIString(0), '');
    assert.equal(bsr.byteIndex, 0);
  });

  test('Read overflow', function () {
    let exception = false;

    try {
      bsr.readASCIIString(128);
    } catch (e) {
      exception = true;
    }

    assert(exception);
  });

  test('Write overflow', function () {
    let exception = false;

    try {
      bsw.writeASCIIString('foobar', 128);
    } catch (e) {
      exception = true;
    }

    assert(exception);
  });

  test('Get boolean', function () {
    bv.setUint8(0, 1);

    assert(bv.getBoolean(0));

    bv.setUint8(0, 0);
    assert(!bv.getBoolean(0));
  });

  test('Set boolean', function () {
    bv.setBoolean(0, true);

    assert(bv.getBoolean(0));

    bv.setBoolean(0, false);

    assert(!bv.getBoolean(0));
  });

  test('Read boolean', function () {
    bv.setBits(0, 1, 1);
    bv.setBits(1, 0, 1);

    assert(bsr.readBoolean());
    assert(!bsr.readBoolean());
  });

  test('Write boolean', function () {
    bsr.writeBoolean(true);
    assert.equal(bv.getBits(0, 1, false), 1);
    bsr.writeBoolean(false);
    assert.equal(bv.getBits(1, 1, false), 0);
  });

  test('Read / write UTF8 string, only ASCII characters', function () {
    const str = 'foobar';

    bsw.writeUTF8String(str);
    assert(bsw.byteIndex === str.length + 1); // +1 for 0x00

    assert.equal(bsr.readUTF8String(), str);
    assert.equal(bsr.byteIndex, str.length + 1);
  });

  test('Read / write UTF8 string, non ASCII characters', function () {
    const str = '日本語';

    const bytes = [0xe6, 0x97, 0xa5, 0xe6, 0x9c, 0xac, 0xe8, 0xaa, 0x9e];

    bsw.writeUTF8String(str);

    for (let i = 0; i < bytes.length; i++) {
      assert.equal(bytes[i], bv.getBits(i * 8, 8));
    }

    assert.equal(bsw.byteIndex, bytes.length + 1); // +1 for 0x00

    assert.equal(str, bsr.readUTF8String());
    assert.equal(bsr.byteIndex, bytes.length + 1);
  });

  test('readBitStream', function () {
    bsw.writeBits(0xf0, 8); //0b11110000
    bsw.writeBits(0xf1, 8); //0b11110001
    bsr.readBits(3); //offset
    const slice = bsr.readBitStream(8);
    assert.equal(slice.readBits(6), 0x3e); //0b111110
    assert.equal(9, slice._index);
    assert.equal(6, slice.index);
    assert.equal(8, slice.length);
    assert.equal(2, slice.bitsLeft);

    assert.equal(bsr._index, 11);
    assert.equal(64 * 8 - 11, bsr.bitsLeft);
  });

  test('readBitStream overflow', function () {
    bsw.writeBits(0xf0, 8); //0b11110000
    bsw.writeBits(0xf1, 8); //0b11110001
    bsr.readBits(3); //offset
    const slice = bsr.readBitStream(4);

    let exception = false;

    try {
      slice.readUint8();
    } catch (e) {
      exception = true;
    }

    assert(exception);
  });

  test('writeBitStream', function () {
    const buf = new ArrayBuffer(64);
    const sourceStream = new BitStream(buf);

    sourceStream.writeBits(0xf0, 8); //0b11110000
    sourceStream.writeBits(0xf1, 8); //0b11110001
    sourceStream.index = 0;
    sourceStream.readBits(3); //offset
    bsr.writeBitStream(sourceStream, 8);
    assert.equal(8, bsr.index);
    bsr.index = 0;
    assert.equal(bsr.readBits(6), 0x3e); //0b00111110
    assert.equal(11, sourceStream.index);

    const bin = new Uint8Array(buf);
    assert.equal(bin[0], 0xf0);
    assert.equal(bin[1], 0xf1);
  });

  test('writeBitStream Buffer', function () {
    const buf = Buffer.alloc(64);
    const sourceStream = new BitStream(buf);

    sourceStream.writeBits(0xf0, 8); //0b11110000
    sourceStream.writeBits(0xf1, 8); //0b11110001
    sourceStream.index = 0;
    sourceStream.readBits(3); //offset
    bsr.writeBitStream(sourceStream, 8);
    assert.equal(8, bsr.index);
    bsr.index = 0;
    assert.equal(bsr.readBits(6), 0x3e); //0b00111110
    assert.equal(11, sourceStream.index);

    const bin = new Uint8Array(buf.buffer);
    assert.equal(bin[0], 0xf0);
    assert.equal(bin[1], 0xf1);
  });

  test('writeBitStream long', function () {
    const sourceStream = new BitStream(new ArrayBuffer(64));

    sourceStream.writeBits(0xf0, 8);
    sourceStream.writeBits(0xf1, 8);
    sourceStream.writeBits(0xf1, 8);
    sourceStream.writeBits(0xf1, 8);
    sourceStream.writeBits(0xf1, 8);
    sourceStream.index = 0;
    sourceStream.readBits(3); //offset
    bsr.index = 3;
    bsr.writeBitStream(sourceStream, 35);
    assert.equal(38, bsr.index);
    bsr.index = 3;
    assert.equal(bsr.readBits(35), 1044266558);
    assert.equal(38, sourceStream.index);
  });

  test('readArrayBuffer', function () {
    bsw.writeBits(0xf0, 8); //0b11110000
    bsw.writeBits(0xf1, 8); //0b11110001
    bsw.writeBits(0xf0, 8); //0b11110000
    bsr.readBits(3); //offset

    const buffer = bsr.readArrayBuffer(2);

    assert.equal(0x3e, buffer[0]); //0b00111110
    assert.equal(0x1e, buffer[1]); //0b00011110

    assert.equal(3 + 2 * 8, bsr._index);
  });

  test('writeArrayBuffer', function () {
    const source = new Uint8Array(4);
    source[0] = 0xf0;
    source[1] = 0xf1;
    source[2] = 0xf1;
    bsr.readBits(3); //offset

    bsr.writeArrayBuffer(source.buffer, 2);
    assert.equal(19, bsr.index);

    bsr.index = 0;

    assert.equal(bsr.readBits(8), 128);
  });

  test('Get buffer from view', function () {
    bv.setBits(0, 0xffffffff, 32);
    const buffer = bv.buffer;

    assert.equal(64, buffer.length);
    assert.equal(0xffff, buffer.readUInt16LE(0));
  });

  test('Get buffer from stream', function () {
    bsw.writeBits(0xffffffff, 32);
    const buffer = bsr.buffer;

    assert.equal(64, buffer.length);
    assert.equal(0xffff, buffer.readUInt16LE(0));
  });
});

describe('Reading big/little endian', function () {
  let array: ArrayBuffer, u8: Uint8Array, bsr: BitStream;

  // todo: was previously setup
  beforeEach(function () {
    array = new ArrayBuffer(64);
    u8 = new Uint8Array(array);
    u8[0] = 0x01;
    u8[1] = 0x02;
    // Test initializing straight from the array.
    bsr = new BitStream(array);
  });

  test('4b, little-endian', function () {
    assert.equal(bsr.index, 0, "BitStream didn't init at offset 0");

    const result = [];
    result.push(bsr.readBits(4));
    result.push(bsr.readBits(4));
    result.push(bsr.readBits(4));
    result.push(bsr.readBits(4));

    // 0000 0001  0000 0010  [01 02]
    // [#2] [#1]  [#4] [#3]
    assert.deepEqual(result, [1, 0, 2, 0]);
  });

  test('8b, little-endian', function () {
    assert.equal(bsr.index, 0, "BitStream didn't init at offset 0");

    const result = [];
    result.push(bsr.readBits(8));
    result.push(bsr.readBits(8));

    // 0000 0001  0000 0010  [01 02]
    // [     #1]  [     #2]
    assert.deepEqual(result, [1, 2]);
  });

  test('10b, little-endian', function () {
    assert.equal(bsr.index, 0, "BitStream didn't init at offset 0");

    const result = [];
    result.push(bsr.readBits(10));

    // 0000 0001  0000 0010  [01 02]
    // ...   #1]  [   #2][#1...
    assert.deepEqual(result, [513]);
  });

  test('16b, little-endian', function () {
    assert.equal(bsr.index, 0, "BitStream didn't init at offset 0");

    const result = [];
    result.push(bsr.readBits(16));

    // 0000 0001  0000 0010  [01 02]
    // [                #1]
    assert.deepEqual(result, [0x201]);
  });

  test('24b, little-endian', function () {
    u8[2] = 0x03;
    assert.equal(bsr.index, 0, "BitStream didn't init at offset 0");

    const result = [];
    result.push(bsr.readBits(24));

    // 0000 0001  0000 0010  0000 0011  [01 02 03]
    // [                           #1]
    assert.deepEqual(result, [0x30201]);
  });

  test('4b, big-endian', function () {
    bsr.bigEndian = true;
    assert.equal(bsr.index, 0, "BitStream didn't init at offset 0");

    const result = [];
    result.push(bsr.readBits(4));
    result.push(bsr.readBits(4));
    result.push(bsr.readBits(4));
    result.push(bsr.readBits(4));

    // 0000 0001  0000 0010  [01 02]
    // [#1] [#2]  [#3] [#4]
    assert.deepEqual(result, [0, 1, 0, 2]);
  });

  test('8b, big-endian', function () {
    bsr.bigEndian = true;
    assert.equal(bsr.index, 0, "BitStream didn't init at offset 0");

    const result = [];
    result.push(bsr.readBits(8));
    result.push(bsr.readBits(8));

    // 0000 0001  0000 0010  [01 02]
    // [     #1]  [     #2]
    assert.deepEqual(result, [1, 2]);
  });

  test('10b, big-endian', function () {
    bsr.bigEndian = true;
    assert.equal(bsr.index, 0, "BitStream didn't init at offset 0");

    const result = [];
    result.push(bsr.readBits(10));
    result.push(bsr.readBits(6));

    // 0000 0001  0000 0010  [01 02]
    // [         #1][   #2]
    assert.deepEqual(result, [4, 2]);
  });

  test('16b, big-endian', function () {
    bsr.bigEndian = true;
    assert.equal(bsr.index, 0, "BitStream didn't init at offset 0");

    const result = [];
    result.push(bsr.readBits(16));

    // 0000 0001  0000 0010  [01 02]
    // [                #1]
    assert.deepEqual(result, [0x102]);
  });

  test('24b, big-endian', function () {
    u8[2] = 0x03;
    bsr.bigEndian = true;
    assert.equal(bsr.index, 0, "BitStream didn't init at offset 0");

    const result = [];
    result.push(bsr.readBits(24));

    // 0000 0001  0000 0010  0000 0011  [01 02 03]
    // [                           #1]
    assert.deepEqual(result, [0x10203]);
  });
});

describe('Writing big/little endian', function () {
  let array: ArrayBuffer, u8: Uint8Array, bv: BitView, bsw: BitStream;

  // todo: was previously setup
  beforeEach(function () {
    array = new ArrayBuffer(2);
    u8 = new Uint8Array(array);
    bv = new BitView(array);
    bsw = new BitStream(bv);
  });

  test('4b, little-endian', function () {
    // 0000 0001  0000 0010  [01 02]
    // [#2] [#1]  [#4] [#3]
    bsw.writeBits(1, 4);
    bsw.writeBits(0, 4);
    bsw.writeBits(2, 4);
    bsw.writeBits(0, 4);

    assert.deepEqual(u8, new Uint8Array([0x01, 0x02]));
  });

  test('8b, little-endian', function () {
    // 0000 0001  0000 0010  [01 02]
    // [     #1]  [     #2]
    bsw.writeBits(1, 8);
    bsw.writeBits(2, 8);

    assert.deepEqual(u8, new Uint8Array([0x01, 0x02]));
  });

  test('10b, little-endian', function () {
    // 0000 0001  0000 0010  [01 02]
    // ...   #1]  [   #2][#1...
    bsw.writeBits(513, 10);

    assert.deepEqual(u8, new Uint8Array([0x01, 0x02]));
  });

  test('16b, little-endian', function () {
    // 0000 0001  0000 0010  [01 02]
    // [                #1]
    bsw.writeBits(0x201, 16);

    assert.deepEqual(u8, new Uint8Array([0x01, 0x02]));
  });

  test('4b, big-endian', function () {
    bsw.bigEndian = true;

    // 0000 0001  0000 0010  [01 02]
    // [#1] [#2]  [#3] [#4]
    bsw.writeBits(0, 4);
    bsw.writeBits(1, 4);
    bsw.writeBits(0, 4);
    bsw.writeBits(2, 4);

    assert.deepEqual(u8, new Uint8Array([0x01, 0x02]));
  });

  test('8b, big-endian', function () {
    bsw.bigEndian = true;

    // 0000 0001  0000 0010  [01 02]
    // [     #1]  [     #2]
    bsw.writeBits(1, 8);
    bsw.writeBits(2, 8);

    assert.deepEqual(u8, new Uint8Array([0x01, 0x02]));
  });

  test('10b, big-endian', function () {
    bsw.bigEndian = true;

    // 0000 0001  0000 0010  [01 02]
    // [         #1][   #2]
    bsw.writeBits(4, 10);
    bsw.writeBits(2, 6);

    assert.deepEqual(u8, new Uint8Array([0x01, 0x02]));
  });

  test('16b, big-endian', function () {
    bsw.bigEndian = true;

    // 0000 0001  0000 0010  [01 02]
    // [                #1]
    bsw.writeBits(0x102, 16);

    assert.deepEqual(u8, new Uint8Array([0x01, 0x02]));
  });
});
