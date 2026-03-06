import { createRuleTester } from "../../testing/create-rule-tester.js";
import { actionNoImplicitEnqueueRetries } from "./rule.js";

const ruleTester = await createRuleTester();

const ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const NON_ACTION_FILE = "/project/src/utils/config.ts";

ruleTester.run("action-no-implicit-enqueue-retries", actionNoImplicitEnqueueRetries, {
  invalid: [
    {
      code: `api.enqueue(api.publish, {})`,
      errors: [{ messageId: "missingRetries" }],
      filename: ACTION_FILE,
      name: "no options argument",
    },
    {
      code: `api.enqueue(api.publish, {}, { queue: "my-queue" })`,
      errors: [{ messageId: "missingRetries" }],
      filename: ACTION_FILE,
      name: "options present but no retries property",
    },
    {
      code: `api.enqueue(api.publish, {}, {})`,
      errors: [{ messageId: "missingRetries" }],
      filename: ACTION_FILE,
      name: "empty options object",
    },
    {
      code: `api.enqueue(api.publish, {})`,
      errors: [{ messageId: "missingRetries" }],
      filename: NON_ACTION_FILE,
      name: "file outside action scope still triggers (enqueue rule applies everywhere)",
    },
    {
      code: `api.enqueue(api.publish)`,
      errors: [{ messageId: "missingRetries" }],
      filename: ACTION_FILE,
      name: "only one argument (no params, no options)",
    },
  ],
  valid: [
    {
      code: `api.enqueue(api.publish, {}, { retries: 0 })`,
      filename: ACTION_FILE,
      name: "explicit zero retries",
    },
    {
      code: `api.enqueue(api.publish, {}, { retries: 3 })`,
      filename: ACTION_FILE,
      name: "explicit retry count",
    },
    {
      code: `api.enqueue(api.publish, {}, { retries: { retryCount: 5, backoffFactor: 2 } })`,
      filename: ACTION_FILE,
      name: "explicit retry object form",
    },
    {
      code: `api.enqueue(api.publish, {}, { retries: 0 })`,
      filename: NON_ACTION_FILE,
      name: "file outside action scope with retries set is valid",
    },
  ],
});
