import { describe, expect, it } from "vitest";

import plugin from "./index.js";

describe("plugin entry point", () => {
  it("exports meta with name and version", () => {
    expect(plugin.meta).toBeDefined();
    expect(plugin.meta.name).toBe("@aurelienbbn/eslint-plugin-gadget");
    expect(typeof plugin.meta.version).toBe("string");
  });

  it("exports all 16 rules", () => {
    expect(Object.keys(plugin.rules)).toHaveLength(16);
  });

  it("exports recommended config", () => {
    expect(plugin.configs.recommended).toBeDefined();
    expect(plugin.configs.recommended.rules).toBeDefined();
  });

  it("exports strict config", () => {
    expect(plugin.configs.strict).toBeDefined();
    expect(plugin.configs.strict.rules).toBeDefined();
  });

  it("every rule in recommended is also in strict", () => {
    const recommendedRules = Object.keys(plugin.configs.recommended.rules ?? {});
    const strictRules = Object.keys(plugin.configs.strict.rules ?? {});
    for (const rule of recommendedRules) {
      expect(strictRules).toContain(rule);
    }
  });

  it("every exported rule has a valid meta", () => {
    for (const [name, rule] of Object.entries(plugin.rules)) {
      expect(rule.meta, `Rule ${name} missing meta`).toBeDefined();
      expect(rule.meta.type, `Rule ${name} missing type`).toBeDefined();
      expect(rule.meta.docs?.description, `Rule ${name} missing description`).toBeDefined();
    }
  });
});
