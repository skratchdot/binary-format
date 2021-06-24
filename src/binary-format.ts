import BinaryFormatter from './binary-formatter';
import { arrayStep } from './steps/array';
import { bigIntStep } from './steps/bigint';
import { BitStepAccumulator } from './steps/bits';
import { bufferStep } from './steps/buffer';
import { choiceStep } from './steps/choice';
import { numberStep } from './steps/number';
import { stringStep } from './steps/string';
import {
  BigIntKey,
  ChoiceOptions,
  CustomFormatter,
  LengthOption,
  NumberKey,
  ReadAndWrite,
  Step,
} from './types';

class BinaryFormat<T> {
  private formatter: BinaryFormatter<T> | undefined;
  private steps: Array<Step<T>> = [];
  private bitSteps?: BitStepAccumulator<T>;
  private littleEndian = false;
  private keys = new Set();

  private addStep(step: Step<T>): BinaryFormat<T> {
    if (this.formatter) {
      throw new Error('cannot add steps. parser has already be created.');
    }
    this.checkStepName(step.name);
    if (this.bitSteps) {
      if (this.bitSteps.numBits % 8 !== 0) {
        throw new Error(
          'your previous bits() call(s) bitSize should be a multiple of 8'
        );
      } else {
        // add bit steps
        const steps = this.bitSteps.toBinaryFormatSteps();
        this.bitSteps = undefined;
        steps.forEach((step) => this.addStep(step));
      }
    }
    this.keys.add(step.name);
    this.steps.push(step);
    return this;
  }

  private checkStepName(name: keyof T): void {
    if (
      this.keys.has(name) ||
      (this.bitSteps && this.bitSteps.keys.has(name))
    ) {
      throw new Error(
        `cannot add step. the key "${name}" has alraedy been added.`
      );
    }
  }

  // Custom
  public custom = (
    name: keyof T,
    readAndWrite: ReadAndWrite | CustomFormatter<T>
  ): BinaryFormat<T> => {
    if (readAndWrite instanceof BinaryFormatter) {
      return this.addStep({
        name,
        read: readAndWrite._read,
        write: readAndWrite._write,
      });
    } else {
      const { read, write } = readAndWrite;
      return this.addStep({ name, read, write });
    }
  };

  // Numbers
  private buildNumber =
    (key: NumberKey, leKey?: NumberKey) =>
    (name: keyof T): BinaryFormat<T> =>
      this.custom(name, numberStep(this.littleEndian && leKey ? leKey : key));
  // 8: Signed
  public int8 = this.buildNumber('Int8');
  public int8be = this.buildNumber('Int8');
  public int8le = this.buildNumber('Int8');
  // 16: Signed
  public int16 = this.buildNumber('Int16BE', 'Int16LE');
  public int16be = this.buildNumber('Int16BE');
  public int16le = this.buildNumber('Int16LE');
  // 32: Signed
  public int32 = this.buildNumber('Int32BE', 'Int32LE');
  public int32be = this.buildNumber('Int32BE');
  public int32le = this.buildNumber('Int32LE');
  // 8: Unsigned
  public uint8 = this.buildNumber('UInt8');
  public uint8be = this.buildNumber('UInt8');
  public uint8le = this.buildNumber('UInt8');
  // 16: Unsigned
  public uint16 = this.buildNumber('UInt16BE', 'UInt16LE');
  public uint16be = this.buildNumber('UInt16BE');
  public uint16le = this.buildNumber('UInt16LE');
  // 32: Unsigned
  public uint32 = this.buildNumber('UInt32BE', 'UInt32LE');
  public uint32be = this.buildNumber('UInt32BE');
  public uint32le = this.buildNumber('UInt32LE');
  // Float
  public float = this.buildNumber('FloatBE', 'FloatLE');
  public floatbe = this.buildNumber('FloatBE');
  public floatle = this.buildNumber('FloatLE');
  // Double
  public double = this.buildNumber('DoubleBE', 'DoubleLE');
  public doublebe = this.buildNumber('DoubleBE');
  public doublele = this.buildNumber('DoubleLE');

  // BigInts
  private buildBigInt =
    (key: BigIntKey, leKey?: BigIntKey) =>
    (name: keyof T): BinaryFormat<T> =>
      this.custom(name, bigIntStep(this.littleEndian && leKey ? leKey : key));
  // 64: Signed
  public int64 = this.buildBigInt('BigInt64BE', 'BigInt64LE');
  public int64be = this.buildBigInt('BigInt64BE');
  public int64le = this.buildBigInt('BigInt64LE');
  // 64: Unsigned
  public uint64 = this.buildBigInt('BigUInt64BE', 'BigUInt64LE');
  public uint64be = this.buildBigInt('BigUInt64BE');
  public uint64le = this.buildBigInt('BigUInt64LE');

  // Bits
  private buildBits = (numBits: number) => (name: keyof T) =>
    this.bits(name, numBits);
  public bits = (name: keyof T, numBits: number): BinaryFormat<T> => {
    this.checkStepName(name);
    if (!this.bitSteps) {
      this.bitSteps = new BitStepAccumulator();
    }
    this.bitSteps.addStep(name, numBits, this.littleEndian);
    return this;
  };
  public bit1 = this.buildBits(1);
  public bit2 = this.buildBits(2);
  public bit3 = this.buildBits(3);
  public bit4 = this.buildBits(4);
  public bit5 = this.buildBits(5);
  public bit6 = this.buildBits(6);
  public bit7 = this.buildBits(7);
  public bit8 = this.buildBits(8);
  public bit9 = this.buildBits(9);
  public bit10 = this.buildBits(10);
  public bit11 = this.buildBits(11);
  public bit12 = this.buildBits(12);
  public bit13 = this.buildBits(13);
  public bit14 = this.buildBits(14);
  public bit15 = this.buildBits(15);
  public bit16 = this.buildBits(16);
  public bit17 = this.buildBits(17);
  public bit18 = this.buildBits(18);
  public bit19 = this.buildBits(19);
  public bit20 = this.buildBits(20);
  public bit21 = this.buildBits(21);
  public bit22 = this.buildBits(22);
  public bit23 = this.buildBits(23);
  public bit24 = this.buildBits(24);
  public bit25 = this.buildBits(25);
  public bit26 = this.buildBits(26);
  public bit27 = this.buildBits(27);
  public bit28 = this.buildBits(28);
  public bit29 = this.buildBits(29);
  public bit30 = this.buildBits(30);
  public bit31 = this.buildBits(31);
  public bit32 = this.buildBits(32);

  // Strings
  public string = (
    name: keyof T,
    length: LengthOption,
    encoding?: BufferEncoding
  ): BinaryFormat<T> => this.custom(name, stringStep(length, encoding));

  // Arrays
  public toArray = (length: number): BinaryFormat<T> => {
    if (this.bitSteps) {
      throw new Error('cannot convert previous bits() call to an array');
    }
    const step = this.steps.pop();
    if (!step) {
      throw new Error(
        'cannot convert previous step to an array because no previous steps exist'
      );
    }
    this.keys.delete(step.name);
    return this.custom(step.name, arrayStep(length, step.read, step.write));
  };

  // Buffers
  public buffer = (name: keyof T, length: LengthOption): BinaryFormat<T> =>
    this.custom(name, bufferStep(length));

  // Choice / Switch
  public choice = (
    name: keyof T,
    choiceKey: keyof T,
    choiceOptions: ChoiceOptions<T>,
    defaultChoice?: CustomFormatter<T>
  ): BinaryFormat<T> => {
    return this.custom(
      name,
      choiceStep(choiceKey, choiceOptions, defaultChoice)
    );
  };

  // Misc Functions
  public endianess(endian: 'little' | 'big'): BinaryFormat<T> {
    if (endian === 'little') {
      this.littleEndian = true;
    } else if (endian === 'big') {
      this.littleEndian = false;
    } else {
      throw new Error('invalid "endianess" value. can be "little" or "big".');
    }
    return this;
  }
  public done(): BinaryFormatter<T> {
    if (this.formatter === undefined) {
      this.formatter = new BinaryFormatter(this.steps);
    }
    return this.formatter;
  }
}

export default BinaryFormat;
