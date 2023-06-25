/**********************************************************
 *
 * BitView
 *
 * BitView provides a similar interface to the standard
 * DataView, but with support for bit-level reads / writes.
 *
 **********************************************************/

import { Buffer } from 'buffer';

class BitView {
  _setBit: (offset: any, on: any) => void;
  _view: Uint8Array;
  bigEndian: boolean;
  getArrayBuffer: (offset: any, byteLength: any) => Uint8Array;
  getBits: (offset: any, bits: any, signed: any) => number;
  getBoolean: (offset: any) => boolean;
  getFloat32: (offset: any) => any;
  getFloat64: (offset: any) => any;
  getInt16: (offset: any) => any;
  getInt32: (offset: any) => any;
  getInt8: (offset: any) => any;
  getUint16: (offset: any) => any;
  getUint32: (offset: any) => any;
  getUint8: (offset: any) => any;
  setBits: (offset: any, value: any, bits: any) => void;
  setBoolean: (offset: any, value: any) => void;
  setFloat32: (offset: any, value: any) => void;
  setFloat64: (offset: any, value: any) => void;
  setInt16: (offset: any, value: any) => void;
  setInt32: (offset: any, value: any) => void;
  setInt8: (offset: any, value: any) => void;
  setUint16: (offset: any, value: any) => void;
  setUint32: (offset: any, value: any) => void;
  setUint8: (offset: any, value: any) => void;
  // Used to massage fp values so we can operate on them
  // at the bit level.
  static _scratch = new DataView(new ArrayBuffer(8));

  constructor(
    source: ArrayBuffer | Buffer | BitView,
    byteOffset?: number,
    byteLength?: number
  ) {
    const isBuffer =
      source instanceof ArrayBuffer ||
      (typeof Buffer !== 'undefined' && source instanceof Buffer);

    if (!isBuffer) {
      throw new Error('Must specify a valid ArrayBuffer or Buffer.');
    }

    byteOffset = byteOffset || 0;
    byteLength =
      byteLength ||
      source.byteLength /* ArrayBuffer */ ||
      // @ts-expect-error bit-buffer
      source.length /* Buffer */;

    this._view = new Uint8Array(
      // @ts-expect-error bit-buffer
      source.buffer || source,
      byteOffset,
      byteLength
    );

    this.bigEndian = false;

    this._setBit = function (offset, on) {
      if (on) {
        this._view[offset >> 3] |= 1 << (offset & 7);
      } else {
        this._view[offset >> 3] &= ~(1 << (offset & 7));
      }
    };

    this.getBits = function (offset, bits, signed) {
      const available = this._view.length * 8 - offset;

      if (bits > available) {
        throw new Error(
          'Cannot get ' +
            bits +
            ' bit(s) from offset ' +
            offset +
            ', ' +
            available +
            ' available'
        );
      }

      let value = 0;
      for (let i = 0; i < bits; ) {
        const remaining = bits - i;
        const bitOffset = offset & 7;
        const currentByte = this._view[offset >> 3];

        // the max number of bits we can read from the current byte
        const read = Math.min(remaining, 8 - bitOffset);

        // eslint-disable-next-line no-var
        var mask, readBits;
        if (this.bigEndian) {
          // create a mask with the correct bit width
          mask = ~(0xff << read);
          // shift the bits we want to the start of the byte and mask of the rest
          readBits = (currentByte >> (8 - read - bitOffset)) & mask;

          value <<= read;
          value |= readBits;
        } else {
          // create a mask with the correct bit width
          mask = ~(0xff << read);
          // shift the bits we want to the start of the byte and mask off the rest
          readBits = (currentByte >> bitOffset) & mask;

          value |= readBits << i;
        }

        offset += read;
        i += read;
      }

      if (signed) {
        // If we're not working with a full 32 bits, check the
        // imaginary MSB for this bit count and convert to a
        // valid 32-bit signed value if set.
        if (bits !== 32 && value & (1 << (bits - 1))) {
          value |= -1 ^ ((1 << bits) - 1);
        }

        return value;
      }

      return value >>> 0;
    };

    this.setBits = function (offset, value, bits) {
      const available = this._view.length * 8 - offset;

      if (bits > available) {
        throw new Error(
          'Cannot set ' +
            bits +
            ' bit(s) from offset ' +
            offset +
            ', ' +
            available +
            ' available'
        );
      }

      for (let i = 0; i < bits; ) {
        const remaining = bits - i;
        const bitOffset = offset & 7;
        const byteOffset = offset >> 3;
        const wrote = Math.min(remaining, 8 - bitOffset);

        // eslint-disable-next-line no-var
        var mask, writeBits, destMask;
        if (this.bigEndian) {
          // create a mask with the correct bit width
          mask = ~(~0 << wrote);
          // shift the bits we want to the start of the byte and mask of the rest
          writeBits = (value >> (bits - i - wrote)) & mask;

          const destShift = 8 - bitOffset - wrote;
          // destination mask to zero all the bits we're changing first
          destMask = ~(mask << destShift);

          this._view[byteOffset] =
            (this._view[byteOffset] & destMask) | (writeBits << destShift);
        } else {
          // create a mask with the correct bit width
          mask = ~(0xff << wrote);
          // shift the bits we want to the start of the byte and mask of the rest
          writeBits = value & mask;
          value >>= wrote;

          // destination mask to zero all the bits we're changing first
          destMask = ~(mask << bitOffset);

          this._view[byteOffset] =
            (this._view[byteOffset] & destMask) | (writeBits << bitOffset);
        }

        offset += wrote;
        i += wrote;
      }
    };

    this.getBoolean = function (offset) {
      return this.getBits(offset, 1, false) !== 0;
    };
    this.getInt8 = function (offset) {
      return this.getBits(offset, 8, true);
    };
    this.getUint8 = function (offset) {
      return this.getBits(offset, 8, false);
    };
    this.getInt16 = function (offset) {
      return this.getBits(offset, 16, true);
    };
    this.getUint16 = function (offset) {
      return this.getBits(offset, 16, false);
    };
    this.getInt32 = function (offset) {
      return this.getBits(offset, 32, true);
    };
    this.getUint32 = function (offset) {
      return this.getBits(offset, 32, false);
    };
    this.getFloat32 = function (offset) {
      BitView._scratch.setUint32(0, this.getUint32(offset));
      return BitView._scratch.getFloat32(0);
    };
    this.getFloat64 = function (offset) {
      BitView._scratch.setUint32(0, this.getUint32(offset));
      // DataView offset is in bytes.
      BitView._scratch.setUint32(4, this.getUint32(offset + 32));
      return BitView._scratch.getFloat64(0);
    };
    this.setBoolean = function (offset, value) {
      this.setBits(offset, value ? 1 : 0, 1);
    };
    this.setInt8 = this.setUint8 = function (offset, value) {
      this.setBits(offset, value, 8);
    };
    this.setInt16 = this.setUint16 = function (offset, value) {
      this.setBits(offset, value, 16);
    };
    this.setInt32 = this.setUint32 = function (offset, value) {
      this.setBits(offset, value, 32);
    };
    this.setFloat32 = function (offset, value) {
      BitView._scratch.setFloat32(0, value);
      this.setBits(offset, BitView._scratch.getUint32(0), 32);
    };
    this.setFloat64 = function (offset, value) {
      BitView._scratch.setFloat64(0, value);
      this.setBits(offset, BitView._scratch.getUint32(0), 32);
      this.setBits(offset + 32, BitView._scratch.getUint32(4), 32);
    };
    this.getArrayBuffer = function (offset, byteLength) {
      const buffer = new Uint8Array(byteLength);
      for (let i = 0; i < byteLength; i++) {
        buffer[i] = this.getUint8(offset + i * 8);
      }
      return buffer;
    };
  }
  get buffer() {
    return typeof Buffer !== 'undefined'
      ? Buffer.from(this._view.buffer)
      : this._view.buffer;
  }
  get byteLength() {
    return this._view.length;
  }
}

export { BitView };
