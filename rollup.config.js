import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import postcss from "rollup-plugin-postcss";
import copy from "rollup-plugin-copy";

const packageJson = require("./package.json");

export default {
  input: "src/index.ts",
  output: [
    {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true, // Generate source map for debugging
    },
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: true, // Generate source map for debugging
    },
  ],
  plugins: [
    peerDepsExternal(), // Exclude peer dependencies from the bundle
    resolve(), // Locate and bundle third-party dependencies in node_modules
    commonjs(), // Convert CommonJS modules to ES6
    typescript({ useTsconfigDeclarationDir: true }), // Handle TypeScript files
    postcss(), // Process CSS files
    copy({ // Copy specific files to the build directory
      targets: [
        { src: "src/variables.scss", dest: "build", rename: "variables.scss" },
        { src: "src/typography.scss", dest: "build", rename: "typography.scss" },
      ],
    }),
  ],
};
