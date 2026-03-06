import { createRuleTester } from "../../testing/create-rule-tester.js";
import { actionRequireExplicitReturnType } from "./rule.js";

const ruleTester = await createRuleTester();

const MODEL_ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const GLOBAL_ACTION_FILE = "/project/api/actions/sendEmail.ts";
const NON_ACTION_FILE = "/project/src/utils/config.ts";

ruleTester.run("action-require-explicit-return-type", actionRequireExplicitReturnType, {
  invalid: [
    {
      code: `export const options: ActionOptions = { actionType: "create" };`,
      errors: [{ messageId: "missingReturnType" }],
      filename: MODEL_ACTION_FILE,
      name: "model action missing returnType adds false",
      output: `export const options: ActionOptions = { actionType: "create", returnType: false, };`,
    },
    {
      code: `export const options: ActionOptions = { actionType: "custom" };`,
      errors: [{ messageId: "missingReturnType" }],
      filename: GLOBAL_ACTION_FILE,
      name: "global action missing returnType adds true",
      output: `export const options: ActionOptions = { actionType: "custom", returnType: true, };`,
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 50000 };`,
      errors: [{ messageId: "missingReturnType" }],
      filename: MODEL_ACTION_FILE,
      name: "model action with other options but no returnType",
      output: `export const options: ActionOptions = { timeoutMS: 50000, returnType: false, };`,
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 50000 };`,
      errors: [{ messageId: "missingReturnType" }],
      filename: GLOBAL_ACTION_FILE,
      name: "global action with other options but no returnType",
      output: `export const options: ActionOptions = { timeoutMS: 50000, returnType: true, };`,
    },
    {
      code: `export const options = { actionType: "create" };`,
      errors: [{ messageId: "missingReturnType" }],
      filename: MODEL_ACTION_FILE,
      name: "options without type annotation still validated",
      output: `export const options = { actionType: "create", returnType: false, };`,
    },
    {
      code: `export const options: ActionOptions = {};`,
      errors: [{ messageId: "missingReturnType" }],
      filename: MODEL_ACTION_FILE,
      name: "empty options object on model action inserts returnType: false",
      output: `export const options: ActionOptions = { returnType: false };`,
    },
  ],
  valid: [
    {
      code: `export const options: ActionOptions = { returnType: true };`,
      filename: MODEL_ACTION_FILE,
      name: "model action with returnType true",
    },
    {
      code: `export const options: ActionOptions = { returnType: false };`,
      filename: MODEL_ACTION_FILE,
      name: "model action with returnType false",
    },
    {
      code: `export const options: ActionOptions = { returnType: true };`,
      filename: GLOBAL_ACTION_FILE,
      name: "global action with returnType true",
    },
    {
      code: `export const options: ActionOptions = { returnType: false };`,
      filename: GLOBAL_ACTION_FILE,
      name: "global action with returnType false",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 50000 };`,
      filename: NON_ACTION_FILE,
      name: "non-action file is ignored",
    },
  ],
});
