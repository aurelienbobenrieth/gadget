import { createRuleTester } from "../../testing/create-rule-tester.js";
import { actionNoInvalidTimeoutMs } from "./rule.js";

const ruleTester = await createRuleTester();

const ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const NON_ACTION_FILE = "/project/src/utils/config.ts";

ruleTester.run("action-no-invalid-timeout-ms", actionNoInvalidTimeoutMs, {
  invalid: [
    {
      code: `export const options: ActionOptions = { timeoutMS: 950000 };`,
      errors: [{ messageId: "exceedsMaximum" }],
      filename: ACTION_FILE,
      name: "exceeds maximum clamps to 900000",
      output: `export const options: ActionOptions = { timeoutMS: 900000 };`,
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 1800000 };`,
      errors: [{ messageId: "exceedsMaximum" }],
      filename: ACTION_FILE,
      name: "double maximum clamps to 900000",
      output: `export const options: ActionOptions = { timeoutMS: 900000 };`,
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 900001 };`,
      errors: [{ messageId: "exceedsMaximum" }],
      filename: ACTION_FILE,
      name: "one above maximum clamps to 900000",
      output: `export const options: ActionOptions = { timeoutMS: 900000 };`,
    },
    {
      code: `export const options = { timeoutMS: 950000 };`,
      errors: [{ messageId: "exceedsMaximum" }],
      filename: ACTION_FILE,
      name: "untyped options export is also checked",
      output: `export const options = { timeoutMS: 900000 };`,
    },
  ],
  valid: [
    {
      code: `export const options: ActionOptions = { timeoutMS: 50000 };`,
      filename: ACTION_FILE,
      name: "value within limit",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 900000 };`,
      filename: ACTION_FILE,
      name: "value at exact maximum",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 0 };`,
      filename: ACTION_FILE,
      name: "zero is valid",
    },
    {
      code: `export const options: ActionOptions = { returnType: true };`,
      filename: ACTION_FILE,
      name: "no timeoutMS property",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: "50000" };`,
      filename: ACTION_FILE,
      name: "string timeoutMS is ignored (handled by action-no-invalid-options)",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 999999 };`,
      filename: NON_ACTION_FILE,
      name: "non-action file is ignored",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 1 };`,
      filename: ACTION_FILE,
      name: "value of 1 is valid",
    },
  ],
});
