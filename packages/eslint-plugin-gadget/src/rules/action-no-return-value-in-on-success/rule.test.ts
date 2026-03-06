import { createRuleTester } from "../../testing/create-rule-tester.js";
import { actionNoReturnValueInOnSuccess } from "./rule.js";

const ruleTester = await createRuleTester();

const ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const NON_ACTION_FILE = "/project/src/utils/config.ts";

ruleTester.run("action-no-return-value-in-on-success", actionNoReturnValueInOnSuccess, {
  invalid: [
    {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  return { success: true };\n};`,
      errors: [{ messageId: "noReturnValue" }],
      filename: ACTION_FILE,
      name: "return object literal in onSuccess is removed when last statement",
      output: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n};`,
    },
    {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await notify(record);\n  return someVariable;\n};`,
      errors: [{ messageId: "noReturnValue" }],
      filename: ACTION_FILE,
      name: "return variable in onSuccess is removed when last statement",
      output: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await notify(record);\n};`,
    },
    {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  return await someAsyncCall();\n};`,
      errors: [{ messageId: "noReturnValue" }],
      filename: ACTION_FILE,
      name: "return await expression in onSuccess is removed when last statement",
      output: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n};`,
    },
    {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  if (record.changed) return someValue;\n  await notify(record);\n};`,
      errors: [{ messageId: "noReturnValue" }],
      filename: ACTION_FILE,
      name: "return value not last in block is replaced with bare return",
      output: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  if (record.changed) return;\n  await notify(record);\n};`,
    },
  ],
  valid: [
    {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await notify(record);\n};`,
      filename: ACTION_FILE,
      name: "onSuccess with no return statement",
    },
    {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await notify(record);\n  return;\n};`,
      filename: ACTION_FILE,
      name: "onSuccess with bare return",
    },
    {
      code: `export const onSuccess: ActionOnSuccess = async () => {\n  await items.map(item => {\n    return item.id;\n  });\n};`,
      filename: ACTION_FILE,
      name: "nested callback with return value does not trigger",
    },
    {
      code: `export const run: ActionRun = async ({ params }) => {\n  return { result: true };\n};`,
      filename: ACTION_FILE,
      name: "run function returning a value does not trigger",
    },
    {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  return { success: true };\n};`,
      filename: NON_ACTION_FILE,
      name: "file outside action scope is ignored",
    },
  ],
});
