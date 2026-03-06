import type { Linter } from "eslint";

export function recommended(plugin: Record<string, unknown>): Linter.Config {
  return {
    plugins: { gadget: plugin },
    rules: {
      "gadget/action-no-await-handle-result-in-action": "warn",
      "gadget/action-no-empty-on-success": "warn",
      "gadget/action-no-enqueue-max-concurrency-exceeded": "warn",
      "gadget/action-no-implicit-enqueue-retries": "warn",
      "gadget/action-no-invalid-options": "error",
      "gadget/action-no-invalid-params": "error",
      "gadget/action-no-invalid-timeout-ms": "error",
      "gadget/action-no-return-value-in-on-success": "warn",
      "gadget/action-require-action-run-type": "warn",
      "gadget/action-require-explicit-return-type": "warn",
      "gadget/action-require-run-with-on-success": "warn",
      "gadget/action-require-timeout-ms-comment": "warn",
      "gadget/global-action-no-action-type": "warn",
      "gadget/model-action-invalid-action-type": "warn",
      "gadget/model-action-no-invalid-trigger": "warn",
      "gadget/model-action-no-transactional-timeout-mismatch": "warn",
    },
  };
}
