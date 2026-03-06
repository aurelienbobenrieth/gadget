import { createRuleTester } from "../../testing/create-rule-tester.js";
import { modelActionNoTransactionalTimeoutMismatch } from "./rule.js";

const ruleTester = await createRuleTester();

const MODEL_ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const GLOBAL_ACTION_FILE = "/project/api/actions/sendEmail.ts";

ruleTester.run("model-action-no-transactional-timeout-mismatch", modelActionNoTransactionalTimeoutMismatch, {
  invalid: [
    {
      code: `export const options: ActionOptions = { timeoutMS: 6000 };`,
      errors: [{ data: { value: "6000" }, messageId: "mismatch" }],
      filename: MODEL_ACTION_FILE,
      name: "timeoutMS above 5000 without transactional: false",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 900000 };`,
      errors: [{ data: { value: "900000" }, messageId: "mismatch" }],
      filename: MODEL_ACTION_FILE,
      name: "large timeoutMS without transactional: false",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 30000, transactional: true };`,
      errors: [{ data: { value: "30000" }, messageId: "mismatch" }],
      filename: MODEL_ACTION_FILE,
      name: "timeoutMS above 5000 with transactional explicitly true",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 5001 };`,
      errors: [{ data: { value: "5001" }, messageId: "mismatch" }],
      filename: MODEL_ACTION_FILE,
      name: "timeoutMS just above 5000 boundary",
    },
  ],
  valid: [
    {
      code: `export const options: ActionOptions = { timeoutMS: 3000 };`,
      filename: MODEL_ACTION_FILE,
      name: "timeoutMS under 5000 without transactional property",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 30000, transactional: false };`,
      filename: MODEL_ACTION_FILE,
      name: "timeoutMS above 5000 with transactional: false",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 5000 };`,
      filename: MODEL_ACTION_FILE,
      name: "timeoutMS exactly at 5000 boundary",
    },
    {
      code: `export const options: ActionOptions = { transactional: false };`,
      filename: MODEL_ACTION_FILE,
      name: "no timeoutMS property at all",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 30000 };`,
      filename: GLOBAL_ACTION_FILE,
      name: "global action file is not checked by this rule",
    },
  ],
});
