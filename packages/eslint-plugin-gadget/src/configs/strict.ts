import type { Linter } from "eslint";

export function strict(plugin: Record<string, unknown>): Linter.Config {
  return {
    plugins: { gadget: plugin },
    rules: {
      "gadget/action-no-await-handle-result-in-action": "error",
      "gadget/action-no-empty-on-success": "error",
      "gadget/action-no-enqueue-max-concurrency-exceeded": "error",
      "gadget/action-no-implicit-enqueue-retries": "error",
      "gadget/action-no-invalid-options": "error",
      "gadget/action-no-invalid-params": "error",
      "gadget/action-no-invalid-timeout-ms": "error",
      "gadget/action-no-return-value-in-on-success": "error",
      "gadget/action-require-action-run-type": "error",
      "gadget/action-require-explicit-return-type": "error",
      "gadget/action-require-run-with-on-success": "error",
      "gadget/action-require-timeout-ms-comment": "error",
      "gadget/global-action-no-action-type": "error",
      "gadget/model-action-invalid-action-type": "error",
      "gadget/model-action-no-invalid-trigger": "error",
      "gadget/model-action-no-transactional-timeout-mismatch": "error",
    },
  };
}
