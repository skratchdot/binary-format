import * as main from './index';

import BinaryFormat from './binary-format';

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
