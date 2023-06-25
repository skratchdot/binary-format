/**********************************************************
 *
 * BitStream
 *
 * Small wrapper for a BitView to maintain your position,
 * as well as to handle reading / writing of string data
 * to the underlying buffer.
 *
 **********************************************************/

import { BitView } from './bit-view';
import { Buffer } from 'buffer';

// @ts-expect-error bit-buffer
const reader = function (name, size) {
  return function () {
    // @ts-expect-error bit-buffer
    if (this._index + size > this._length) {
      throw new Error('Trying to read past the end of the stream');
    }
    // @ts-expect-error bit-buffer
    const val = this._view[name](this._index);
    // @ts-expect-error bit-buffer
    this._index += size;
    return val;
  };
};
// @ts-expect-error bit-buffer
const writer = function (name, size) {
  // @ts-expect-error bit-buffer
  return function (value) {
    // @ts-expect-error bit-buffer
    this._view[name](this._index, value);
    // @ts-expect-error bit-buffer
    this._index += size;
  };
};
// @ts-expect-error bit-buffer
function readASCIIString(stream, bytes) {
  return readString(stream, bytes, false);
}
// @ts-expect-error bit-buffer
function readUTF8String(stream, bytes) {
  return readString(stream, bytes, true);
}
// @ts-expect-error bit-buffer
function readString(stream, bytes, utf8) {
  if (bytes === 0) {
    return '';
  }
  let i = 0;
  const chars = [];
  let append = true;
  const fixedLength = !!bytes;
  if (!bytes) {
    bytes = Math.floor((stream._length - stream._index) / 8);
  }

  // Read while we still have space available, or until we've
  // hit the fixed byte length passed in.
  while (i < bytes) {
    const c = stream.readUint8();

    // Stop appending chars once we hit 0x00
    if (c === 0x00) {
      append = false;

      // If we don't have a fixed length to read, break out now.
      if (!fixedLength) {
        break;
      }
    }
    if (append) {
      chars.push(c);
    }

    i++;
  }

  const string = String.fromCharCode.apply(null, chars);
  if (utf8) {
    try {
      return decodeURIComponent(escape(string)); // https://stackoverflow.com/a/17192845
    } catch (e) {
      return string;
    }
  } else {
    return string;
  }
}
// @ts-expect-error bit-buffer
function writeASCIIString(stream, string, bytes) {
  const length = bytes || string.length + 1; // + 1 for NULL

  for (let i = 0; i < length; i++) {
    stream.writeUint8(i < string.length ? string.charCodeAt(i) : 0x00);
  }
}
// @ts-expect-error bit-buffer
function writeUTF8String(stream, string, bytes) {
  const byteArray = stringToByteArray(string);

  const length = bytes || byteArray.length + 1; // + 1 for NULL
  for (let i = 0; i < length; i++) {
    stream.writeUint8(i < byteArray.length ? byteArray[i] : 0x00);
  }
}
// @ts-expect-error bit-buffer
function stringToByteArray(str) {
  // https://gist.github.com/volodymyr-mykhailyk/2923227
  let b = [],
    i,
    unicode;
  for (i = 0; i < str.length; i++) {
    unicode = str.charCodeAt(i);
    // 0x00000000 - 0x0000007f -> 0xxxxxxx
    if (unicode <= 0x7f) {
      b.push(unicode);
      // 0x00000080 - 0x000007ff -> 110xxxxx 10xxxxxx
    } else if (unicode <= 0x7ff) {
      b.push((unicode >> 6) | 0xc0);
      b.push((unicode & 0x3f) | 0x80);
      // 0x00000800 - 0x0000ffff -> 1110xxxx 10xxxxxx 10xxxxxx
    } else if (unicode <= 0xffff) {
      b.push((unicode >> 12) | 0xe0);
      b.push(((unicode >> 6) & 0x3f) | 0x80);
      b.push((unicode & 0x3f) | 0x80);
      // 0x00010000 - 0x001fffff -> 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
    } else {
      b.push((unicode >> 18) | 0xf0);
      b.push(((unicode >> 12) & 0x3f) | 0x80);
      b.push(((unicode >> 6) & 0x3f) | 0x80);
      b.push((unicode & 0x3f) | 0x80);
    }
  }

  return b;
}

class BitStream {
  _index: number;
  _length: number;
  _startIndex: number;
  _view: any;
  readBits: (bits: number, signed?: boolean) => any;
  readBoolean: () => any;
  readFloat32: () => any;
  readFloat64: () => any;
  readInt16: () => any;
  readInt32: () => any;
  readInt8: () => any;
  readUint16: () => any;
  readUint32: () => any;
  readUint8: () => any;
  writeArrayBuffer: (buffer: any, byteLength: any) => void;
  writeBits: (value: any, bits: any) => void;
  writeBitStream: (stream: any, length: any) => void;
  writeBoolean: (value: any) => void;
  writeFloat32: (value: any) => void;
  writeFloat64: (value: any) => void;
  writeInt16: (value: any) => void;
  writeInt32: (value: any) => void;
  writeInt8: (value: any) => void;
  writeUint16: (value: any) => void;
  writeUint32: (value: any) => void;
  writeUint8: (value: any) => void;

  constructor(
    source: ArrayBuffer | Buffer | BitView,
    byteOffset?: number,
    byteLength?: number
  ) {
    const isBuffer =
      source instanceof ArrayBuffer ||
      (typeof Buffer !== 'undefined' && source instanceof Buffer);

    if (!(source instanceof BitView) && !isBuffer) {
      throw new Error('Must specify a valid BitView, ArrayBuffer or Buffer');
    }

    if (isBuffer) {
      this._view = new BitView(source, byteOffset, byteLength);
    } else {
      this._view = source;
    }
    this._index = 0;
    this._startIndex = 0;
    this._length = this._view.byteLength * 8;

    this.readBits = function (bits, signed) {
      const val = this._view.getBits(this._index, bits, signed);
      this._index += bits;
      return val;
    };
    this.writeBits = function (value, bits) {
      this._view.setBits(this._index, value, bits);
      this._index += bits;
    };

    this.readBoolean = reader('getBoolean', 1);
    this.readInt8 = reader('getInt8', 8);
    this.readUint8 = reader('getUint8', 8);
    this.readInt16 = reader('getInt16', 16);
    this.readUint16 = reader('getUint16', 16);
    this.readInt32 = reader('getInt32', 32);
    this.readUint32 = reader('getUint32', 32);
    this.readFloat32 = reader('getFloat32', 32);
    this.readFloat64 = reader('getFloat64', 64);

    this.writeBoolean = writer('setBoolean', 1);
    this.writeInt8 = writer('setInt8', 8);
    this.writeUint8 = writer('setUint8', 8);
    this.writeInt16 = writer('setInt16', 16);
    this.writeUint16 = writer('setUint16', 16);
    this.writeInt32 = writer('setInt32', 32);
    this.writeUint32 = writer('setUint32', 32);
    this.writeFloat32 = writer('setFloat32', 32);
    this.writeFloat64 = writer('setFloat64', 64);
    // @ts-expect-error bit-buffer
    this.readASCIIString = function (bytes) {
      return readASCIIString(this, bytes);
    };
    // @ts-expect-error bit-buffer
    this.readUTF8String = function (bytes) {
      return readUTF8String(this, bytes);
    };
    // @ts-expect-error bit-buffer
    this.writeASCIIString = function (string, bytes) {
      writeASCIIString(this, string, bytes);
    };
    // @ts-expect-error bit-buffer
    this.writeUTF8String = function (string, bytes) {
      writeUTF8String(this, string, bytes);
    };
    // @ts-expect-error bit-buffer
    this.readBitStream = function (bitLength) {
      const slice = new BitStream(this._view);
      slice._startIndex = this._index;
      slice._index = this._index;
      slice.length = bitLength;
      this._index += bitLength;
      return slice;
    };
    this.writeBitStream = function (stream, length) {
      if (!length) {
        length = stream.bitsLeft;
      }

      let bitsToWrite;
      while (length > 0) {
        bitsToWrite = Math.min(length, 32);
        this.writeBits(stream.readBits(bitsToWrite), bitsToWrite);
        length -= bitsToWrite;
      }
    };
    // @ts-expect-error bit-buffer
    this.readArrayBuffer = function (byteLength) {
      const buffer = this._view.getArrayBuffer(this._index, byteLength);
      this._index += byteLength * 8;
      return buffer;
    };
    this.writeArrayBuffer = function (buffer, byteLength) {
      this.writeBitStream(new BitStream(buffer), byteLength * 8);
    };
  }

  get index() {
    return this._index - this._startIndex;
  }
  set index(val) {
    this._index = val + this._startIndex;
  }
  get length() {
    return this._length - this._startIndex;
  }
  set length(val) {
    this._length = val + this._startIndex;
  }
  get bitsLeft() {
    return this._length - this._index;
  }
  get byteIndex() {
    return Math.ceil(this._index / 8);
  }
  set byteIndex(val) {
    this._index = val * 8;
  }
  get buffer() {
    return this._view.buffer;
  }
  get view() {
    return this._view;
  }
  get bigEndian() {
    return this._view.bigEndian;
  }
  set bigEndian(val) {
    this._view.bigEndian = val;
  }
}

export { BitStream };
