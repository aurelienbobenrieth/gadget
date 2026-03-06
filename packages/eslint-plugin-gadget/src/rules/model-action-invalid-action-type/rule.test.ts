import { createRuleTester } from "../../testing/create-rule-tester.js";
import { modelActionInvalidActionType } from "./rule.js";

const ruleTester = await createRuleTester();

const MODEL_ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const GLOBAL_ACTION_FILE = "/project/api/actions/sendEmail.ts";

ruleTester.run("model-action-invalid-action-type", modelActionInvalidActionType, {
  invalid: [
    {
      code: `export const options: ActionOptions = { actionType: "scheduler" };`,
      errors: [{ messageId: "invalidActionType" }],
      filename: MODEL_ACTION_FILE,
      name: "actionType scheduler is invalid",
    },
    {
      code: `export const options: ActionOptions = { actionType: "read" };`,
      errors: [{ messageId: "invalidActionType" }],
      filename: MODEL_ACTION_FILE,
      name: "actionType read is invalid",
    },
    {
      code: `/** @type { ActionOptions } */\nexport const options = { actionType: "scheduler" };`,
      errors: [{ messageId: "invalidActionType" }],
      filename: MODEL_ACTION_FILE,
      name: "JSDoc annotated options with invalid actionType",
    },
    {
      code: `export const options: ActionOptions = { actionType: "unknown" };`,
      errors: [{ messageId: "invalidActionType" }],
      filename: MODEL_ACTION_FILE,
      name: "actionType unknown is invalid",
    },
    {
      code: `export const options: ActionOptions = { actionType: "" };`,
      errors: [{ messageId: "invalidActionType" }],
      filename: MODEL_ACTION_FILE,
      name: "empty string actionType is invalid",
    },
  ],
  valid: [
    {
      code: `export const options: ActionOptions = { actionType: "create" };`,
      filename: MODEL_ACTION_FILE,
      name: "actionType create is valid",
    },
    {
      code: `export const options: ActionOptions = { actionType: "update" };`,
      filename: MODEL_ACTION_FILE,
      name: "actionType update is valid",
    },
    {
      code: `export const options: ActionOptions = { actionType: "delete" };`,
      filename: MODEL_ACTION_FILE,
      name: "actionType delete is valid",
    },
    {
      code: `export const options: ActionOptions = { actionType: "custom" };`,
      filename: MODEL_ACTION_FILE,
      name: "actionType custom is valid",
    },
    {
      code: `export const options: ActionOptions = { returnType: true };`,
      filename: MODEL_ACTION_FILE,
      name: "no actionType property is valid",
    },
    {
      code: `export const options: ActionOptions = { actionType: "scheduler" };`,
      filename: GLOBAL_ACTION_FILE,
      name: "global action file is not checked by this rule",
    },
    {
      code: `/** @type { ActionOptions } */\nexport const options = { actionType: "update" };`,
      filename: MODEL_ACTION_FILE,
      name: "JSDoc annotated options with valid actionType",
    },
  ],
});
