import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as { version: string };

export default defineConfig({
  define: {
    __PACKAGE_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    name: "eslint-plugin-gadget",
    dir: "./src",
    watch: false,
    coverage: {
      enabled: true,
      provider: "istanbul",
      include: ["src/**/*"],
      exclude: ["src/**/*.test.ts"],
      reporter: ["text", "lcov", "json-summary"],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
