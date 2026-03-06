import { createRuleTester } from "../../testing/create-rule-tester.js";
import { actionRequireActionRunType } from "./rule.js";

const ruleTester = await createRuleTester();

const ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const NON_ACTION_FILE = "/project/src/utils/config.ts";

ruleTester.run("action-require-action-run-type", actionRequireActionRunType, {
  invalid: [
    {
      code: `import { applyParams, save } from "gadget-server";\nexport const run = async ({ params, record }) => {\n  await applyParams(record, params);\n  await save(record);\n};`,
      errors: [{ messageId: "missingRunType" }],
      filename: ACTION_FILE,
      name: "run with no annotation adds ActionRun without import",
      output: `import { applyParams, save } from "gadget-server";\nexport const run: ActionRun = async ({ params, record }) => {\n  await applyParams(record, params);\n  await save(record);\n};`,
    },
    {
      code: `export const run = async ({ params }) => {};`,
      errors: [{ messageId: "missingRunType" }],
      filename: ACTION_FILE,
      name: "run with no annotation adds ActionRun only",
      output: `export const run: ActionRun = async ({ params }) => {};`,
    },
    {
      code: `import { applyParams } from "gadget-server";\nexport const onSuccess = async () => {\n  console.log("done");\n};`,
      errors: [{ messageId: "missingOnSuccessType" }],
      filename: ACTION_FILE,
      name: "onSuccess with no annotation adds ActionOnSuccess only",
      output: `import { applyParams } from "gadget-server";\nexport const onSuccess: ActionOnSuccess = async () => {\n  console.log("done");\n};`,
    },
    {
      code: `import { ActionRun } from "gadget-server";\nexport const run: (params: any) => Promise<void> = async (params) => {};`,
      errors: [{ messageId: "manualRunType" }],
      filename: ACTION_FILE,
      name: "run with manual inline type replaces with native ActionRun",
      output: `export const run: ActionRun = async (params) => {};`,
    },
    {
      code: `import { ActionOnSuccess } from "gadget-server";\nexport const onSuccess: () => Promise<void> = async () => {\n  console.log("done");\n};`,
      errors: [{ messageId: "manualOnSuccessType" }],
      filename: ACTION_FILE,
      name: "onSuccess with manual type replaces with native ActionOnSuccess",
      output: `export const onSuccess: ActionOnSuccess = async () => {\n  console.log("done");\n};`,
    },
    {
      code: `export const run = async ({ logger }: { logger: Logger }) => {};`,
      errors: [{ messageId: "missingRunType" }],
      filename: ACTION_FILE,
      name: "run fix removes parameter type annotations",
      output: `export const run: ActionRun = async ({ logger }) => {};`,
    },
  ],
  valid: [
    {
      code: `import { ActionRun } from "gadget-server";\nexport const run: ActionRun = async ({ params, record }) => {\n  await save(record);\n};`,
      filename: ACTION_FILE,
      name: "run with ActionRun type already imported",
    },
    {
      code: `export const run: ActionRun = async ({ params, record }) => {\n  await save(record);\n};`,
      filename: ACTION_FILE,
      name: "run with ActionRun type",
    },
    {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await doSomething(record);\n};`,
      filename: ACTION_FILE,
      name: "onSuccess with ActionOnSuccess type",
    },
    {
      code: `export const run: ActionRun = async ({ params }) => {};\nexport const onSuccess: ActionOnSuccess = async () => {};`,
      filename: ACTION_FILE,
      name: "both run and onSuccess correctly typed",
    },
    {
      code: `export const run = async ({ params }) => {};`,
      filename: NON_ACTION_FILE,
      name: "non-action file is ignored",
    },
    {
      code: `/** @type { ActionRun } */\nexport const run = async ({ params, record }) => {\n  await save(record);\n};`,
      filename: ACTION_FILE,
      name: "run with JSDoc ActionRun type annotation",
    },
    {
      code: `/** @type { ActionOnSuccess } */\nexport const onSuccess = async ({ record }) => {\n  await doSomething(record);\n};`,
      filename: ACTION_FILE,
      name: "onSuccess with JSDoc ActionOnSuccess type annotation",
    },
  ],
});
