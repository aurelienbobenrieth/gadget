import { createRuleTester } from "../../testing/create-rule-tester.js";
import { globalActionNoActionType } from "./rule.js";

const ruleTester = await createRuleTester();

const GLOBAL_ACTION_FILE = "/project/api/actions/sendEmail.ts";
const MODEL_ACTION_FILE = "/project/api/models/widget/actions/create.ts";

ruleTester.run("global-action-no-action-type", globalActionNoActionType, {
  invalid: [
    {
      code: `export const options: ActionOptions = { actionType: "custom" };`,
      errors: [{ messageId: "actionTypeNotAllowed" }],
      filename: GLOBAL_ACTION_FILE,
      name: "actionType as only property is removed",
      output: `export const options: ActionOptions = {  };`,
    },
    {
      code: `export const options: ActionOptions = { actionType: "create", returnType: true };`,
      errors: [{ messageId: "actionTypeNotAllowed" }],
      filename: GLOBAL_ACTION_FILE,
      name: "actionType removed while preserving other properties",
      output: `export const options: ActionOptions = { returnType: true };`,
    },
    {
      code: `export const options = { actionType: "custom", returnType: true };`,
      errors: [{ messageId: "actionTypeNotAllowed" }],
      filename: GLOBAL_ACTION_FILE,
      name: "options without type annotation also validated",
      output: `export const options = { returnType: true };`,
    },
  ],
  valid: [
    {
      code: `export const options: ActionOptions = { returnType: true };`,
      filename: GLOBAL_ACTION_FILE,
      name: "no actionType in global action",
    },
    {
      code: `export const options: ActionOptions = { actionType: "custom" };`,
      filename: MODEL_ACTION_FILE,
      name: "model action file is not checked by this rule",
    },
  ],
});
