import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    server: "src/server.ts",
    stdio: "src/stdio.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: "node20",
  platform: "node",
  // Bundle the local @pptx/sdk so the published package is self-contained
  // and has no runtime dependency on an unpublished workspace package.
  noExternal: ["@pptx/sdk"],
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
  // stdio.ts includes a shebang so `npx pptx-mcp` and chmod+x just work.
  shims: false,
});
