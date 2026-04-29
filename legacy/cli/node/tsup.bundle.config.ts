import { defineConfig } from "tsup";

// Produces a fully self-contained CommonJS bundle at
// `dist-bundle/cli.cjs` with every runtime dependency (including
// `commander` and `@pptx/sdk`) inlined. Consumed by the PyPI wrapper
// package (`sdk/cli-python`) so the wheel can ship a single Node-runnable
// script without a node_modules tree.
export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["cjs"],
  outDir: "dist-bundle",
  outExtension: () => ({ js: ".cjs" }),
  sourcemap: false,
  clean: true,
  splitting: false,
  treeshake: true,
  target: "node20",
  platform: "node",
  noExternal: [/.*/],
  shims: false,
});
