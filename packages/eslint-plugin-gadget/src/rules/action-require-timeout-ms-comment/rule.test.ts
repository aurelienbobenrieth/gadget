import { createRuleTester } from "../../testing/create-rule-tester.js";
import { actionRequireTimeoutMsComment } from "./rule.js";

const ruleTester = await createRuleTester();

const ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const NON_ACTION_FILE = "/project/src/utils/config.ts";

ruleTester.run("action-require-timeout-ms-comment", actionRequireTimeoutMsComment, {
  invalid: [
    {
      code: `export const options: ActionOptions = { timeoutMS: 50000 };`,
      errors: [{ messageId: "missingComment" }],
      filename: ACTION_FILE,
      name: "missing comment inserts seconds",
      output: `export const options: ActionOptions = { timeoutMS: 50000 // 50 seconds\n };`,
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 120000 // timeout
};`,
      errors: [{ messageId: "missingComment" }],
      filename: ACTION_FILE,
      name: "non-duration comment gets replaced",
      output: `export const options: ActionOptions = { timeoutMS: 120000 // 2 minutes
};`,
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 50000 // TODO
};`,
      errors: [{ messageId: "missingComment" }],
      filename: ACTION_FILE,
      name: "TODO comment gets replaced with duration",
      output: `export const options: ActionOptions = { timeoutMS: 50000 // 50 seconds
};`,
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 60000 /* config */ };`,
      errors: [{ messageId: "missingComment" }],
      filename: ACTION_FILE,
      name: "block comment without duration gets replaced",
      output: `export const options: ActionOptions = { timeoutMS: 60000 // 1 minutes\n };`,
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 50000, };`,
      errors: [{ messageId: "missingComment" }],
      filename: ACTION_FILE,
      name: "missing comment with trailing comma inserts after comma",
      output: `export const options: ActionOptions = { timeoutMS: 50000, // 50 seconds\n };`,
    },
    {
      code: `export const options: ActionOptions = {\n  timeoutMS: 50000,\n};`,
      errors: [{ messageId: "missingComment" }],
      filename: ACTION_FILE,
      name: "missing comment with trailing comma on its own line",
      output: `export const options: ActionOptions = {\n  timeoutMS: 50000, // 50 seconds\n};`,
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 50000, // timeout\n};`,
      errors: [{ messageId: "missingComment" }],
      filename: ACTION_FILE,
      name: "non-duration comment after trailing comma gets replaced",
      output: `export const options: ActionOptions = { timeoutMS: 50000, // 50 seconds\n};`,
    },
    {
      code: `export const options = { timeoutMS: 50000 };`,
      errors: [{ messageId: "missingComment" }],
      filename: ACTION_FILE,
      name: "untyped options export also requires duration comment",
      output: `export const options = { timeoutMS: 50000 // 50 seconds\n };`,
    },
  ],
  valid: [
    {
      code: `export const options: ActionOptions = { timeoutMS: 50000 // 50 seconds
};`,
      filename: ACTION_FILE,
      name: "seconds comment present",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 120000 // 2 minutes
};`,
      filename: ACTION_FILE,
      name: "minutes comment present",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 50000, // 50 seconds
};`,
      filename: ACTION_FILE,
      name: "seconds comment present with trailing comma",
    },
    {
      code: `export const options: ActionOptions = { returnType: true };`,
      filename: ACTION_FILE,
      name: "no timeoutMS property",
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 50000 };`,
      filename: NON_ACTION_FILE,
      name: "non-action file is ignored",
    },
  ],
});
