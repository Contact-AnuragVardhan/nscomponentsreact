const peerDepsExternal = require("rollup-plugin-peer-deps-external");
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const typescript = require("rollup-plugin-typescript2");
const postcss = require("rollup-plugin-postcss");
const copy = require("rollup-plugin-copy");

const packageJson = require("./package.json");

module.exports = {
  input: "src/index.ts",
  output: [
    {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true
    },
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: true
    }
  ],
  plugins: [
    peerDepsExternal(),
    resolve.nodeResolve ? resolve.nodeResolve() : resolve(),
    commonjs(),
    typescript({
      useTsconfigDeclarationDir: true
    }),
    postcss(),
    copy({
      targets: [
        { src: "src/variables.scss", dest: "build", rename: "variables.scss" },
        { src: "src/typography.scss", dest: "build", rename: "typography.scss" }
      ]
    })
  ]
};