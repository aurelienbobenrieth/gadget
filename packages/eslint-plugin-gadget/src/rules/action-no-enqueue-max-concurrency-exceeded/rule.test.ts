import { createRuleTester } from "../../testing/create-rule-tester.js";
import { actionNoEnqueueMaxConcurrencyExceeded } from "./rule.js";

const ruleTester = await createRuleTester();

const ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const NON_ACTION_FILE = "/project/src/utils/config.ts";

ruleTester.run("action-no-enqueue-max-concurrency-exceeded", actionNoEnqueueMaxConcurrencyExceeded, {
  invalid: [
    {
      code: `api.enqueue(api.publish, {}, { queue: { name: "q", maxConcurrency: 101 } })`,
      errors: [{ data: { value: "101" }, messageId: "exceeded" }],
      filename: ACTION_FILE,
      name: "maxConcurrency 101 exceeds limit",
    },
    {
      code: `api.enqueue(api.publish, {}, { queue: { name: "q", maxConcurrency: 500 } })`,
      errors: [{ data: { value: "500" }, messageId: "exceeded" }],
      filename: ACTION_FILE,
      name: "maxConcurrency 500 exceeds limit",
    },
    {
      code: `api.enqueue(api.publish, {}, { queue: { name: "q", maxConcurrency: 500 } })`,
      errors: [{ data: { value: "500" }, messageId: "exceeded" }],
      filename: NON_ACTION_FILE,
      name: "file outside action scope still triggers (enqueue rule applies everywhere)",
    },
    {
      code: `api.enqueue(api.publish, {}, { queue: { name: "q", maxConcurrency: 200 } })`,
      errors: [{ data: { value: "200" }, messageId: "exceeded" }],
      filename: ACTION_FILE,
      name: "maxConcurrency 200 exceeds limit",
    },
  ],
  valid: [
    {
      code: `api.enqueue(api.publish, {}, { queue: { name: "q", maxConcurrency: 100 } })`,
      filename: ACTION_FILE,
      name: "maxConcurrency at the boundary (100)",
    },
    {
      code: `api.enqueue(api.publish, {}, { queue: { name: "q", maxConcurrency: 1 } })`,
      filename: ACTION_FILE,
      name: "maxConcurrency well under limit",
    },
    {
      code: `api.enqueue(api.publish, {}, { queue: { name: "q", maxConcurrency: myVar } })`,
      filename: ACTION_FILE,
      name: "dynamic value is skipped silently",
    },
    {
      code: `api.enqueue(api.publish, {}, { queue: "my-queue" })`,
      filename: ACTION_FILE,
      name: "string form queue has no maxConcurrency",
    },
    {
      code: `api.enqueue(api.publish, {}, {})`,
      filename: ACTION_FILE,
      name: "no queue option at all",
    },
    {
      code: `api.enqueue(api.publish, {}, { queue: { name: "q", maxConcurrency: 50 } })`,
      filename: NON_ACTION_FILE,
      name: "file outside action scope with valid maxConcurrency is valid",
    },
    {
      code: `api.enqueue(api.publish, {}, { queue: { name: "q", maxConcurrency: 0 } })`,
      filename: ACTION_FILE,
      name: "maxConcurrency zero is valid",
    },
    {
      code: `api.enqueue(api.publish)`,
      filename: ACTION_FILE,
      name: "no options argument at all is valid",
    },
  ],
});
