import license from 'rollup-plugin-license';
import pkg from './package.json' assert { type: 'json' };
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      // sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      // sourcemap: true,
    },
  ],
  plugins: [
    typescript({}),
    license({
      banner: [
        '<%= pkg.name %>',
        'version  <%= pkg.version %>',
        '<%= pkg.homepage %>',
        '',
        'Copyright (c) <%= moment().format("YYYY") %> <%= pkg.author %>',
        'Licensed under the MIT license.',
      ].join('\n'),
    }),
  ],
  external: ['bit-buffer', 'smart-buffer'],
};
