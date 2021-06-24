import createBinaryBuffer from './create-binary-buffer';

describe('createBinaryBuffer', () => {
  test('handles deadbeef with different encodings', () => {
    expect(
      createBinaryBuffer('deadbeef', 'hex').toBuffer()
    ).toMatchInlineSnapshot(`Buffer<de ad be ef>`);
    expect(
      createBinaryBuffer('deadbeef', 'utf8').toBuffer()
    ).toMatchInlineSnapshot(`Buffer<64 65 61 64 62 65 65 66>`);
    expect(
      createBinaryBuffer('deadbeef', 'ascii').toBuffer()
    ).toMatchInlineSnapshot(`Buffer<64 65 61 64 62 65 65 66>`);
  });
});
