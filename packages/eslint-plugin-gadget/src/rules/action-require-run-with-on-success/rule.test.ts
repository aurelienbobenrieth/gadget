import { createRuleTester } from "../../testing/create-rule-tester.js";
import { actionRequireRunWithOnSuccess } from "./rule.js";

const ruleTester = await createRuleTester();

const ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const NON_ACTION_FILE = "/project/src/utils/config.ts";

ruleTester.run("action-require-run-with-on-success", actionRequireRunWithOnSuccess, {
  invalid: [
    {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await doSomething(record);\n};`,
      errors: [{ messageId: "onSuccessWithoutRun" }],
      filename: ACTION_FILE,
      name: "onSuccess without run export",
    },
    {
      code: `export const options: ActionOptions = { returnType: true };\nexport const onSuccess: ActionOnSuccess = async () => {};`,
      errors: [{ messageId: "onSuccessWithoutRun" }],
      filename: ACTION_FILE,
      name: "onSuccess with options but no run export",
    },
  ],
  valid: [
    {
      code: `export const run: ActionRun = async ({ params }) => {};\nexport const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await doSomething(record);\n};`,
      filename: ACTION_FILE,
      name: "both run and onSuccess present",
    },
    {
      code: `export const run: ActionRun = async ({ params }) => {};`,
      filename: ACTION_FILE,
      name: "only run present",
    },
    {
      code: `export const options: ActionOptions = { returnType: true };`,
      filename: ACTION_FILE,
      name: "neither run nor onSuccess present",
    },
    {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await doSomething(record);\n};`,
      filename: NON_ACTION_FILE,
      name: "non-action file is ignored",
    },
  ],
});
