import { createRuleTester } from "../../testing/create-rule-tester.js";
import { actionNoInvalidOptions } from "./rule.js";

const ruleTester = await createRuleTester();

const ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const NON_ACTION_FILE = "/project/src/utils/config.ts";

ruleTester.run("action-no-invalid-options", actionNoInvalidOptions, {
  invalid: [
    {
      code: `export const options: ActionOptions = { timeoutMS: 90_000 };`,
      errors: [{ messageId: "numericSeparator" }],
      filename: ACTION_FILE,
      name: "numeric separator fixes to plain number",
      output: `export const options: ActionOptions = { timeoutMS: 90000 };`,
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: 90 * 1000 };`,
      errors: [{ messageId: "nonLiteralValue" }],
      filename: ACTION_FILE,
      name: "binary expression fixes to computed value",
      output: `export const options: ActionOptions = { timeoutMS: 90000 };`,
    },
    {
      code: `export const options: ActionOptions = { timeoutMS: TIMEOUT };`,
      errors: [{ messageId: "nonLiteralValue" }],
      filename: ACTION_FILE,
      name: "variable reference has no fix",
    },
    {
      code: `export const options: ActionOptions = { [dynamicKey]: true };`,
      errors: [{ messageId: "computedKey" }],
      filename: ACTION_FILE,
      name: "computed key has no fix",
    },
    {
      code: `export const options: ActionOptions = { returnType };`,
      errors: [{ messageId: "shorthandProperty" }],
      filename: ACTION_FILE,
      name: "shorthand property has no fix",
    },
    {
      code: "export const options: ActionOptions = { select: `all` };",
      errors: [{ messageId: "nonLiteralValue" }],
      filename: ACTION_FILE,
      name: "static template literal fixes to string literal",
      output: 'export const options: ActionOptions = { select: "all" };',
    },
    {
      code: 'export const options: ActionOptions = { select: `he said "hi"` };',
      errors: [{ messageId: "nonLiteralValue" }],
      filename: ACTION_FILE,
      name: "template literal with quotes escapes properly",
      output: 'export const options: ActionOptions = { select: "he said \\"hi\\"" };',
    },
    {
      code: "export const options: ActionOptions = { select: `${dynamicValue}` };",
      errors: [{ messageId: "nonLiteralValue" }],
      filename: ACTION_FILE,
      name: "dynamic template literal has no fix",
    },
    {
      code: `export const options: ActionOptions = { ...defaults };`,
      errors: [{ messageId: "nonLiteralValue" }],
      filename: ACTION_FILE,
      name: "spread element is invalid",
    },
    {
      code: `export const options: ActionOptions = { nested: { invalid: VARIABLE } };`,
      errors: [{ messageId: "nonLiteralValue" }],
      filename: ACTION_FILE,
      name: "nested object with invalid value reports on the value",
    },
    {
      code: `export const options: ActionOptions = { tags: [VARIABLE] };`,
      errors: [{ messageId: "nonLiteralValue" }],
      filename: ACTION_FILE,
      name: "array with invalid element reports on the element",
    },
    {
      code: `export const options: ActionOptions = { tags: [...spread] };`,
      errors: [{ messageId: "nonLiteralValue" }],
      filename: ACTION_FILE,
      name: "array with spread element is invalid",
    },
    {
      code: `export const options: ActionOptions = { nested: { deep: { bad: VARIABLE } } };`,
      errors: [{ messageId: "nonLiteralValue" }],
      filename: ACTION_FILE,
      name: "deeply nested invalid value is caught",
    },
  ],
  valid: [
    {
      code: `export const options: ActionOptions = { returnType: true, timeoutMS: 50000 };`,
      filename: ACTION_FILE,
      name: "plain literal values",
    },
    {
      code: `export const options: ActionOptions = { returnType: false, type: "custom" };`,
      filename: ACTION_FILE,
      name: "string and boolean values",
    },
    {
      code: `export const options: ActionOptions = { key: null };`,
      filename: ACTION_FILE,
      name: "null is a valid literal",
    },
    {
      code: `export const options: ActionOptions = { triggers: { api: true } };`,
      filename: ACTION_FILE,
      name: "nested object with literal values is valid",
    },
    {
      code: `export const options: ActionOptions = { triggers: { api: true, scheduler: false } };`,
      filename: ACTION_FILE,
      name: "nested object with multiple literal values is valid",
    },
    {
      code: `export const options: ActionOptions = { tags: [1, 2, 3] };`,
      filename: ACTION_FILE,
      name: "array of literals is valid",
    },
    {
      code: `export const options: ActionOptions = { tags: ["a", "b"] };`,
      filename: ACTION_FILE,
      name: "array of strings is valid",
    },
    {
      code: `export const options: ActionOptions = { nested: { deep: { value: true } } };`,
      filename: ACTION_FILE,
      name: "deeply nested literal values are valid",
    },
    {
      code: `export const options: ActionOptions = { mixed: { list: [1, "two", true, null] } };`,
      filename: ACTION_FILE,
      name: "nested object containing array of mixed literals is valid",
    },
    {
      code: `export const options = { timeoutMS: 90_000 };`,
      filename: NON_ACTION_FILE,
      name: "non-action file is ignored",
    },
    {
      code: `export const options = { timeoutMS: 90000 };`,
      filename: ACTION_FILE,
      name: "missing ActionOptions type annotation still gets linted",
    },
    {
      code: `export let options: ActionOptions = { timeoutMS: 90_000 };`,
      filename: ACTION_FILE,
      name: "let declaration is ignored (only const matched)",
    },
  ],
});
