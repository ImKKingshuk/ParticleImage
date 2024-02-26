import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ["cjs", "esm"],
  dts: true, // Generate .d.ts declaration files
  external: ["react", "react-dom"], // Externalize peer dependencies
});
