import { Buffer } from 'buffer';
import { SmartBuffer } from './external/smart-buffer/smartbuffer';

type BinaryBufferType = 'reader' | 'writer';

class BinaryBuffer {
  public rw: SmartBuffer;
  public type: BinaryBufferType;
  public isReader: boolean;
  public isWriter: boolean;
  public currentKey = '';
  public data: unknown;
  constructor(
    rw: SmartBuffer = new SmartBuffer(),
    type: BinaryBufferType = 'writer'
  ) {
    this.rw = rw;
    this.type = type;
    this.isReader = this.type === 'reader';
    this.isWriter = this.type === 'writer';
  }
  static fromBuffer(buffer: Buffer): BinaryBuffer {
    const rw = SmartBuffer.fromBuffer(buffer);
    return new BinaryBuffer(rw, 'reader');
  }
  public toBuffer(): Buffer {
    return this.rw.toBuffer();
  }
  public destroy(): void {
    this.rw.destroy();
    this.data = null;
  }
}

export default BinaryBuffer;
