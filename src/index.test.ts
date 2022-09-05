import BinaryFormat from './binary-format';
import * as main from './index';

describe('main exports', () => {
  test('we only export 1 class', () => {
    expect(main).toMatchInlineSnapshot(`
      {
        "default": [Function],
      }
    `);
    expect(main.default).toBe(BinaryFormat);
  });
});
