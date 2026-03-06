import { createRuleTester } from "../../testing/create-rule-tester.js";
import { modelActionNoInvalidTrigger } from "./rule.js";

const ruleTester = await createRuleTester();

const MODEL_ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const GLOBAL_ACTION_FILE = "/project/api/actions/sendEmail.ts";

ruleTester.run("model-action-no-invalid-trigger", modelActionNoInvalidTrigger, {
  invalid: [
    {
      code: `export const options: ActionOptions = {\n  triggers: [{ type: "scheduler" }],\n};`,
      errors: [{ messageId: "schedulerNotAllowed" }],
      filename: MODEL_ACTION_FILE,
      name: "scheduler trigger is removed and triggers property is removed when array becomes empty",
      output: `export const options: ActionOptions = {\n};`,
    },
    {
      code: `export const options: ActionOptions = {\n  triggers: [{ type: "api" }, { type: "scheduler" }],\n};`,
      errors: [{ messageId: "schedulerNotAllowed" }],
      filename: MODEL_ACTION_FILE,
      name: "scheduler trigger element is removed from multi-element array",
      output: `export const options: ActionOptions = {\n  triggers: [{ type: "api" }],\n};`,
    },
  ],
  valid: [
    {
      code: `export const options: ActionOptions = {\n  triggers: [{ type: "api" }],\n};`,
      filename: MODEL_ACTION_FILE,
      name: "non-scheduler triggers are valid",
    },
    {
      code: `export const options: ActionOptions = { returnType: true };`,
      filename: MODEL_ACTION_FILE,
      name: "no triggers property is valid",
    },
    {
      code: `export const options: ActionOptions = {\n  triggers: [{ type: "scheduler" }],\n};`,
      filename: GLOBAL_ACTION_FILE,
      name: "global action file is not checked by this rule",
    },
  ],
});
