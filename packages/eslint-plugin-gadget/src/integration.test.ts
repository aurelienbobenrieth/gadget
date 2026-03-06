import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

describe("ESLint integration", () => {
  it("loads the plugin and lints without errors", async () => {
    const eslint = new ESLint({
      overrideConfig: {
        plugins: {
          gadget: (await import("./index.js")).default as unknown as ESLint.Plugin,
        },
        rules: {
          "gadget/action-no-invalid-timeout-ms": "error",
        },
      },
      overrideConfigFile: true,
    });

    const results = await eslint.lintText(
      `export const options = { timeoutMS: 1000 };
export const run: ActionRun = async ({ api }) => { return {}; };`,
      { filePath: "api/actions/test.ts" },
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.fatalErrorCount).toBe(0);
  });

  it("applies the recommended config without fatal errors", async () => {
    const pluginModule = await import("./index.js");
    const eslint = new ESLint({
      overrideConfig: [pluginModule.default.configs.recommended],
      overrideConfigFile: true,
    });

    const results = await eslint.lintText(
      `export const options = { timeoutMS: 60000 };
export const run: ActionRun = async ({ api }) => { return {}; };`,
      { filePath: "api/actions/test.ts" },
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.fatalErrorCount).toBe(0);
  });

  it("applies the strict config without fatal errors", async () => {
    const pluginModule = await import("./index.js");
    const eslint = new ESLint({
      overrideConfig: [pluginModule.default.configs.strict],
      overrideConfigFile: true,
    });

    const results = await eslint.lintText(
      `export const options = { timeoutMS: 60000 };
export const run: ActionRun = async ({ api }) => { return {}; };`,
      { filePath: "api/actions/test.ts" },
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.fatalErrorCount).toBe(0);
  });
});
