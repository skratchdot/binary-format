import BinaryBuffer from '../binary-buffer';
import { Buffer } from 'buffer';

const createBinaryBuffer = (
  str: string,
  encoding?: BufferEncoding
): BinaryBuffer => BinaryBuffer.fromBuffer(Buffer.from(str, encoding));

export default createBinaryBuffer;
