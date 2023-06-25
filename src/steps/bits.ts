import BinaryBuffer from '../binary-buffer';
import { BitStream } from '../external/bit-buffer/bit-buffer';
import { Buffer } from 'buffer';
import { Step } from '../types';

interface BitStepHelper<T> {
  name: keyof T;
  numBits: number;
  littleEndian: boolean;
}

interface ReadWriteBitStream {
  read?: BitStream;
  write?: BitStream;
}

export class BitStepAccumulator<T> {
  public numBits = 0;
  public steps: Array<BitStepHelper<T>> = [];
  public keys = new Set();
  public addStep(name: keyof T, numBits: number, littleEndian: boolean): void {
    this.numBits += numBits;
    this.keys.add(name);
    this.steps.push({
      name,
      numBits,
      littleEndian,
    });
  }
  public toBinaryFormatSteps(): Array<Step<T>> {
    const bitStream: ReadWriteBitStream = {
      read: undefined,
      write: undefined,
    };
    const steps: Array<Step<T>> = this.steps.map((step, stepNumber) => {
      const read = (binaryBuffer: BinaryBuffer) => {
        if (stepNumber === 0) {
          const buffer = binaryBuffer.rw.readBuffer(this.numBits / 8);
          bitStream.read = new BitStream(
            buffer,
            buffer.byteOffset,
            buffer.byteLength
          );
        }
        if (!bitStream.read) {
          throw new Error(
            'bitStream.read is undefined so cannot read any bits'
          );
        }
        bitStream.read.bigEndian = !step.littleEndian;
        const value = bitStream.read.readBits(step.numBits, false);
        if (stepNumber === this.steps.length - 1) {
          bitStream.read = undefined;
        }
        return value;
      };
      const write = (binaryBuffer: BinaryBuffer, value: unknown) => {
        if (stepNumber === 0) {
          const buffer = Buffer.alloc(this.numBits / 8);
          bitStream.write = new BitStream(
            buffer,
            buffer.byteOffset,
            buffer.byteLength
          );
        }
        if (!bitStream.write) {
          throw new Error(
            'bitStream.write is undefined so cannot write any bits'
          );
        }
        bitStream.write.bigEndian = !step.littleEndian;
        bitStream.write.writeBits(Number(value), step.numBits);
        if (stepNumber === this.steps.length - 1) {
          binaryBuffer.rw.writeBuffer(bitStream.write.buffer);
          bitStream.write = undefined;
        }
      };
      return {
        name: step.name,
        read,
        write,
      };
    });
    return steps;
  }
}
