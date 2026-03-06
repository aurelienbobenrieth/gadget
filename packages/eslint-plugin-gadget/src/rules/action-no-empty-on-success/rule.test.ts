import { createRuleTester } from "../../testing/create-rule-tester.js";
import { actionNoEmptyOnSuccess } from "./rule.js";

const ruleTester = await createRuleTester();

const ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const NON_ACTION_FILE = "/project/src/utils/config.ts";

ruleTester.run("action-no-empty-on-success", actionNoEmptyOnSuccess, {
  invalid: [
    {
      code: `export const onSuccess: ActionOnSuccess = async () => {};`,
      errors: [{ messageId: "emptyOnSuccess" }],
      filename: ACTION_FILE,
      name: "empty arrow function body",
      output: ``,
    },
    {
      code: `export const onSuccess: ActionOnSuccess = async () => {\n  // nothing here\n};`,
      errors: [{ messageId: "emptyOnSuccess" }],
      filename: ACTION_FILE,
      name: "arrow function body with only a comment",
      output: ``,
    },
    {
      code: `export const onSuccess = async function() {};`,
      errors: [{ messageId: "emptyOnSuccess" }],
      filename: ACTION_FILE,
      name: "empty function expression",
      output: ``,
    },
    {
      code: `export const run: ActionRun = async () => {};\nexport const onSuccess: ActionOnSuccess = async () => {};`,
      errors: [{ messageId: "emptyOnSuccess" }],
      filename: ACTION_FILE,
      name: "empty onSuccess alongside run export",
      output: `export const run: ActionRun = async () => {};`,
    },
  ],
  valid: [
    {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await doSomething(record);\n};`,
      filename: ACTION_FILE,
      name: "onSuccess with body content",
    },
    {
      code: `export const run: ActionRun = async ({ params }) => {};`,
      filename: ACTION_FILE,
      name: "no onSuccess export at all",
    },
    {
      code: `export const onSuccess: ActionOnSuccess = async () => {};`,
      filename: NON_ACTION_FILE,
      name: "non-action file is ignored",
    },
  ],
});
