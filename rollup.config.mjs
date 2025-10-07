import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const production = !process.env.ROLLUP_WATCH;

export default [
  // ES5 UMD build for legacy browsers and Webpack 4
  {
    input: 'src/index-legacy.ts',
    output: [
      {
        file: 'dist/legacy/index.umd.js',
        format: 'umd',
        name: 'Sentinel',
        sourcemap: true,
      },
      {
        file: 'dist/legacy/index.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
    ],
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.legacy.json',
        declaration: false,
        declarationMap: false,
      }),
      production && terser(),
    ],
  },
  // Type declarations for legacy build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/legacy/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
