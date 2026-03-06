import { createRuleTester } from "../../testing/create-rule-tester.js";
import { actionNoAwaitHandleResultInAction } from "./rule.js";

const ruleTester = await createRuleTester();

const ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const NON_ACTION_FILE = "/project/src/utils/config.ts";

ruleTester.run("action-no-await-handle-result-in-action", actionNoAwaitHandleResultInAction, {
  invalid: [
    {
      code: `export const run = async () => {\n  const handle = await api.enqueue(api.publish, {});\n  await handle.result();\n};`,
      errors: [{ messageId: "inRun" }],
      filename: ACTION_FILE,
      name: "await handle.result() directly inside run",
    },
    {
      code: `export const onSuccess = async () => {\n  const handle = await api.enqueue(api.publish, {});\n  await handle.result();\n};`,
      errors: [{ messageId: "inOnSuccess" }],
      filename: ACTION_FILE,
      name: "await handle.result() directly inside onSuccess",
    },
    {
      code: `export const run = async () => {\n  await (await api.enqueue(api.publish, {})).result();\n};`,
      errors: [{ messageId: "inRun" }],
      filename: ACTION_FILE,
      name: "chained await api.enqueue().result() inside run",
    },
    {
      code: `export const onSuccess = async () => {\n  const result = await handle.result();\n};`,
      errors: [{ messageId: "inOnSuccess" }],
      filename: ACTION_FILE,
      name: "assigned await handle.result() inside onSuccess",
    },
  ],
  valid: [
    {
      code: `export const onSuccess = async () => {\n  await items.map(async (item) => {\n    await handle.result();\n  });\n};`,
      filename: ACTION_FILE,
      name: "await handle.result() inside a nested callback within onSuccess does not trigger",
    },
    {
      code: `export const run = async () => {\n  handle.result();\n};`,
      filename: ACTION_FILE,
      name: "handle.result() without await does not trigger",
    },
    {
      code: `async function doStuff() {\n  await handle.result();\n}`,
      filename: ACTION_FILE,
      name: "await handle.result() outside any action export does not trigger",
    },
    {
      code: `export const run = async () => {\n  await handle.status();\n};`,
      filename: ACTION_FILE,
      name: "different method name (status) does not trigger",
    },
    {
      code: `export const run = async () => {\n  await handle.result();\n};`,
      filename: NON_ACTION_FILE,
      name: "non-action file is ignored",
    },
    {
      code: `export const run = async () => {\n  const fn = async () => {\n    await handle.result();\n  };\n  await fn();\n};`,
      filename: ACTION_FILE,
      name: "await handle.result() inside nested arrow function in run does not trigger",
    },
  ],
});
