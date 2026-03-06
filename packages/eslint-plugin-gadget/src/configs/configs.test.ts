import { describe, expect, it } from "vitest";

import plugin from "../index.js";

describe("configs", () => {
  describe("recommended", () => {
    it("includes only warning-level rules except for critical ones", () => {
      const rules = plugin.configs.recommended.rules ?? {};
      for (const [ruleName, severity] of Object.entries(rules)) {
        const isInvalidRule =
          ruleName === "gadget/action-no-invalid-options" ||
          ruleName === "gadget/action-no-invalid-params" ||
          ruleName === "gadget/action-no-invalid-timeout-ms";
        if (isInvalidRule) {
          expect(severity, `${ruleName} should be error`).toBe("error");
        } else {
          expect(severity, `${ruleName} should be warn`).toBe("warn");
        }
      }
    });
  });

  describe("strict", () => {
    it("includes error-level rules", () => {
      const rules = plugin.configs.strict.rules ?? {};
      const severities = Object.values(rules);
      expect(severities).toContain("error");
    });

    it("all rules are set to error", () => {
      const rules = plugin.configs.strict.rules ?? {};
      for (const [ruleName, severity] of Object.entries(rules)) {
        expect(severity, `${ruleName} should be error`).toBe("error");
      }
    });
  });

  describe("rule coverage", () => {
    it("every rule appears in at least one config", () => {
      const allConfigRules = new Set([
        ...Object.keys(plugin.configs.recommended.rules ?? {}),
        ...Object.keys(plugin.configs.strict.rules ?? {}),
      ]);
      for (const ruleName of Object.keys(plugin.rules)) {
        expect(allConfigRules.has(`gadget/${ruleName}`), `Rule ${ruleName} not in any config`).toBe(true);
      }
    });
  });
});
