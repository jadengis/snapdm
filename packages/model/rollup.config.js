import path from 'path';
import copy from 'rollup-plugin-copy';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import packageJson from './package.json';

const project = packageJson.name.split('/')[1];

const root = '../..';
const outputPath = path.join(root, `dist/packages/${project}`);
const name = 'index';

const bundle = (config) => ({
  ...config,
  input: `src/${name}.ts`,
  external: (id) => !/^[./]/.test(id),
});

export default [
  bundle({
    plugins: [
      esbuild({
        tsconfig: './tsconfig.lib.json',
      }),
      generatePackageJson({
        outputFolder: outputPath,
        baseContents: (pkg) => {
          const exports = {
            types: `./${name}.d.ts`,
            import: `./${name}.esm.js`,
            require: `./${name}.cjs`,
          };
          pkg.main = exports.require;
          pkg.module = exports.import;
          pkg.types = exports.types;
          pkg.exports = {
            '.': exports,
          };
          pkg.scripts = undefined;
          pkg.nx = undefined;
          return pkg;
        },
      }),
      copy({
        targets: [
          { src: ["README.md", `${root}/LICENSE`], dest: `${outputPath}`},
        ]
      })
    ],
    output: [
      {
        file: `${outputPath}/${name}.cjs`,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: `${outputPath}/${name}.esm.js`,
        format: 'es',
        sourcemap: true,
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: `${outputPath}/${name}.d.ts`,
      format: 'es',
    },
  }),
];
