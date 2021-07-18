import pkg from './package.json';
import license from 'rollup-plugin-license';
// import typescript from '@rollup/plugin-typescript';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main + '.js',
      format: 'cjs',
      exports: 'named',
      // sourcemap: true,
    },
    {
      file: pkg.module + '.js',
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
