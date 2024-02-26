import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",

    setupFiles: "./path/to/setupTests.ts",

    coverage: {
      provider: "v8",
      exclude: ["node_modules", "tests"],
    },
  },
});
