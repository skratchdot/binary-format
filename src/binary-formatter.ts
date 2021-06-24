import BinaryBuffer from './binary-buffer';
import { Step } from './types';

class BinaryFormatter<T> {
  private steps: Array<Step<T>>;
  constructor(steps: Array<Step<T>> = []) {
    this.steps = steps;
  }
  public _read = (binaryBuffer: BinaryBuffer): T => {
    const data = {} as T;
    this.steps.forEach((step) => {
      binaryBuffer.currentKey = step.name as string;
      binaryBuffer.data = data;
      data[step.name] = step.read(binaryBuffer) as T[keyof T];
    });
    return data;
  };
  public _write = (binaryBuffer: BinaryBuffer, data: T): void => {
    this.steps.forEach((step) => {
      binaryBuffer.currentKey = String(step.name);
      binaryBuffer.data = data;
      step.write(binaryBuffer, data[step.name]);
    });
  };
  public read = (buffer: Buffer): T => {
    const binaryBuffer = BinaryBuffer.fromBuffer(buffer);
    const result = this._read(binaryBuffer);
    binaryBuffer.destroy();
    return result;
  };
  public write = (data: T): Buffer => {
    const binaryBuffer = new BinaryBuffer();
    this._write(binaryBuffer, data);
    const buffer = binaryBuffer.toBuffer();
    binaryBuffer.destroy();
    return buffer;
  };
}

export default BinaryFormatter;
