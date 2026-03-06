import { createRuleTester } from "../../testing/create-rule-tester.js";
import { actionNoInvalidParams } from "./rule.js";

const ruleTester = await createRuleTester();

const ACTION_FILE = "/project/api/models/widget/actions/create.ts";
const GLOBAL_ACTION_FILE = "/project/api/actions/myAction.ts";
const NON_ACTION_FILE = "/project/src/utils/config.ts";

ruleTester.run("action-no-invalid-params", actionNoInvalidParams, {
  invalid: [
    {
      code: `export const params = { name: { type: "date" } };`,
      errors: [{ messageId: "unsupportedParamType" }],
      filename: ACTION_FILE,
      name: 'unsupported type "date"',
    },
    {
      code: `export const params = { name: { type: "null" } };`,
      errors: [{ messageId: "unsupportedParamType" }],
      filename: ACTION_FILE,
      name: 'unsupported type "null"',
    },
    {
      code: `export const params = { name: { type: "any" } };`,
      errors: [{ messageId: "unsupportedParamType" }],
      filename: ACTION_FILE,
      name: 'unsupported type "any"',
    },
    {
      code: `export const params = { name: { type: "string", required: true } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"required" is unsupported',
    },
    {
      code: `export const params = { name: { type: "string", minLength: 1 } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"minLength" is unsupported',
    },
    {
      code: `export const params = { name: { type: "string", maxLength: 255 } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"maxLength" is unsupported',
    },
    {
      code: `export const params = { age: { type: "number", minimum: 0 } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"minimum" is unsupported',
    },
    {
      code: `export const params = { age: { type: "number", maximum: 150 } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"maximum" is unsupported',
    },
    {
      code: `export const params = { email: { type: "string", pattern: "^.+@.+$" } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"pattern" is unsupported',
    },
    {
      code: `export const params = { email: { type: "string", format: "email" } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"format" is unsupported',
    },
    {
      code: `export const params = { status: { type: "string", enum: ["active", "inactive"] } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"enum" is unsupported',
    },
    {
      code: `export const params = { name: { type: "string", default: "hello" } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"default" is unsupported',
    },
    {
      code: `export const params = { items: { type: "array", items: { type: "string" } } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"items" is unsupported',
    },
    {
      code: `export const params = { name: { type: "string", properties: { foo: { type: "string" } } } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"properties" is unsupported on non-object type',
    },
    {
      code: `export const params = { name: { type: "string", additionalProperties: true } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"additionalProperties" is unsupported on non-object type',
    },
    {
      code: `export const params = { data: { type: "object", properties: "invalid" } };`,
      errors: [{ messageId: "propertiesMustBeObject" }],
      filename: ACTION_FILE,
      name: '"properties" must be an object literal',
    },
    {
      code: `export const params = { data: { type: "object", additionalProperties: "yes" } };`,
      errors: [{ messageId: "additionalPropertiesMustBeBoolean" }],
      filename: ACTION_FILE,
      name: '"additionalProperties" must be a boolean literal',
    },
    {
      code: `export const params = { data: { type: "object", additionalProperties: 1 } };`,
      errors: [{ messageId: "additionalPropertiesMustBeBoolean" }],
      filename: ACTION_FILE,
      name: '"additionalProperties" as number is invalid',
    },
    {
      code: `export const params = { data: { type: "object", properties: { nested: "string" } } };`,
      errors: [{ messageId: "paramMustBeObject" }],
      filename: ACTION_FILE,
      name: "nested property must be an object descriptor",
    },
    {
      code: `export const params = { data: { type: "object", properties: { nested: {} } } };`,
      errors: [{ messageId: "missingType" }],
      filename: ACTION_FILE,
      name: "nested property missing type",
    },
    {
      code: `export const params = { data: { type: "object", properties: { nested: { type: "date" } } } };`,
      errors: [{ messageId: "unsupportedParamType" }],
      filename: ACTION_FILE,
      name: "nested property unsupported type",
    },
    {
      code: `export const params = { data: { type: "object", properties: { nested: { type: "string", required: true } } } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: "nested property unsupported key",
    },
    {
      code: `export const params = { data: { type: "object", unknownKey: true } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: "unsupported key on object type descriptor",
    },
    {
      code: `export const params = { name: { type: "string", allOf: [{ minLength: 1 }] } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"allOf" is unsupported',
    },
    {
      code: `export const params = { name: { type: "string", anyOf: [{ type: "string" }] } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"anyOf" is unsupported',
    },
    {
      code: `export const params = { name: { type: "string", oneOf: [{ type: "string" }] } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"oneOf" is unsupported',
    },
    {
      code: `export const params = { name: { type: "string", not: { type: "number" } } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"not" is unsupported',
    },
    {
      code: `export const params = { name: { type: "string", if: { minLength: 1 } } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"if" is unsupported',
    },
    {
      code: `export const params = { name: { type: "string", then: { maxLength: 10 } } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"then" is unsupported',
    },
    {
      code: `export const params = { name: { type: "string", else: { maxLength: 20 } } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"else" is unsupported',
    },
    {
      code: `export const params = { name: { type: "string", $ref: "#/defs/Name" } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"$ref" is unsupported',
    },
    {
      code: `export const params = { name: { type: "string", description: "A name" } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: '"description" is unsupported',
    },
    {
      code: `export const params = { name: "string" };`,
      errors: [{ messageId: "paramMustBeObject" }],
      filename: ACTION_FILE,
      name: "string literal instead of object",
    },
    {
      code: `export const params = { enabled: true };`,
      errors: [{ messageId: "paramMustBeObject" }],
      filename: ACTION_FILE,
      name: "boolean literal instead of object",
    },
    {
      code: `export const params = { count: 42 };`,
      errors: [{ messageId: "paramMustBeObject" }],
      filename: ACTION_FILE,
      name: "number literal instead of object",
    },
    {
      code: `export const params = { name: {} };`,
      errors: [{ messageId: "missingType" }],
      filename: ACTION_FILE,
      name: "empty object missing type",
    },
    {
      code: `export const params = { name: { required: true } };`,
      errors: [{ messageId: "missingType" }, { messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: "only unsupported property and no type",
    },
    {
      code: `export const params = { name: { type: someVariable } };`,
      errors: [{ messageId: "typeNotStringLiteral" }],
      filename: ACTION_FILE,
      name: "type set to a variable",
    },
    {
      code: `export const params = { name: { type: 42 } };`,
      errors: [{ messageId: "typeNotStringLiteral" }],
      filename: ACTION_FILE,
      name: "type set to a number",
    },
    {
      code: `export const params = { name: { type: true } };`,
      errors: [{ messageId: "typeNotStringLiteral" }],
      filename: ACTION_FILE,
      name: "type set to a boolean",
    },
    {
      code: `export const params = { name: { type: "string", required: true, minLength: 1 } };`,
      errors: [{ messageId: "unsupportedProperty" }, { messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: "multiple unsupported properties on same param",
    },
    {
      code: `export const params = { name: { type: "date" }, age: { type: "number", required: true } };`,
      errors: [{ messageId: "unsupportedParamType" }, { messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: "errors across multiple params",
    },
    {
      code: `export const params = { name: { type: "string", required: true } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: GLOBAL_ACTION_FILE,
      name: "global action file also validates",
    },
    {
      code: `export const params = { name: { type: "string", ...extra } };`,
      errors: [{ messageId: "unsupportedProperty" }],
      filename: ACTION_FILE,
      name: "spread in descriptor is unsupported",
    },
  ],
  valid: [
    {
      code: `export const params = { name: { type: "string" } };`,
      filename: ACTION_FILE,
      name: 'type "string"',
    },
    {
      code: `export const params = { count: { type: "number" } };`,
      filename: ACTION_FILE,
      name: 'type "number"',
    },
    {
      code: `export const params = { count: { type: "integer" } };`,
      filename: ACTION_FILE,
      name: 'type "integer"',
    },
    {
      code: `export const params = { enabled: { type: "boolean" } };`,
      filename: ACTION_FILE,
      name: 'type "boolean"',
    },
    {
      code: `export const params = { tags: { type: "array" } };`,
      filename: ACTION_FILE,
      name: 'type "array"',
    },
    {
      code: `export const params = { metadata: { type: "object" } };`,
      filename: ACTION_FILE,
      name: 'type "object"',
    },
    {
      code: `export const params = { name: { type: "string" }, enabled: { type: "boolean" }, count: { type: "integer" } };`,
      filename: ACTION_FILE,
      name: "multiple valid params",
    },
    {
      code: `export const params = { fields: { type: "object", properties: { fileName: { type: "string" } }, additionalProperties: true } };`,
      filename: ACTION_FILE,
      name: "object type with properties and additionalProperties",
    },
    {
      code: `export const params = { data: { type: "object", properties: { name: { type: "string" }, count: { type: "number" } } } };`,
      filename: ACTION_FILE,
      name: "object type with multiple nested properties",
    },
    {
      code: `export const params = { data: { type: "object", additionalProperties: false } };`,
      filename: ACTION_FILE,
      name: "object type with additionalProperties false",
    },
    {
      code: `export const params = { data: { type: "object", properties: {} } };`,
      filename: ACTION_FILE,
      name: "object type with empty properties",
    },
    {
      code: `export const params = { name: { type: "date", required: true } };`,
      filename: NON_ACTION_FILE,
      name: "non-action file is ignored",
    },
    {
      code: `export const params = { sendNotifications: { type: "boolean" } };`,
      filename: GLOBAL_ACTION_FILE,
      name: "global action file valid params",
    },
    {
      code: `export const options = { timeoutMs: 50000 };`,
      filename: ACTION_FILE,
      name: "non-params export is ignored",
    },
    {
      code: `export const config = { name: { type: "date", required: true } };`,
      filename: ACTION_FILE,
      name: "non-params identifier is ignored",
    },
    {
      code: `export let params = { name: { type: "date" } };`,
      filename: ACTION_FILE,
      name: "let declaration is ignored (only const matched)",
    },
  ],
});
