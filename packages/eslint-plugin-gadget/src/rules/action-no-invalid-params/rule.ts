import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { extractExportedConstObject } from "../../utils/action-export-object.js";
import { createRule } from "../../utils/create-rule.js";
import { isActionFile } from "../../utils/is-action-file.js";
import { staticKeyName } from "../../utils/static-key-name.js";

const SUPPORTED_TYPES = new Set(["array", "boolean", "integer", "number", "object", "string"]);

const SUPPORTED_DESCRIPTOR_KEYS = new Set(["type"]);

const OBJECT_DESCRIPTOR_KEYS = new Set(["additionalProperties", "properties", "type"]);

type MessageIds =
  | "additionalPropertiesMustBeBoolean"
  | "missingType"
  | "paramMustBeObject"
  | "propertiesMustBeObject"
  | "typeNotStringLiteral"
  | "unsupportedParamType"
  | "unsupportedProperty";

export const actionNoInvalidParams = createRule<[], MessageIds>({
  create(context) {
    if (!isActionFile(context.filename)) return {};

    return {
      ExportNamedDeclaration(node) {
        const objectExpression = extractExportedConstObject(node, { identifierName: "params" });
        if (!objectExpression) return;

        for (const property of objectExpression.properties) {
          if (property.type === AST_NODE_TYPES.SpreadElement) continue;
          if (property.computed || property.shorthand) continue;

          validateParamDefinition(context, property);
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Enforce that Gadget action params export only uses supported JSON schema types and properties.",
    },
    messages: {
      additionalPropertiesMustBeBoolean: '"additionalProperties" for "{{ name }}" must be true or false.',
      missingType: 'Parameter "{{ name }}" must define a type ({{ supportedTypes }}).',
      paramMustBeObject: 'Parameter "{{ name }}" must be an object with a "type" property.',
      propertiesMustBeObject: '"properties" for "{{ name }}" must be an object literal.',
      typeNotStringLiteral: '"type" for "{{ name }}" must be a string literal.',
      unsupportedParamType:
        'Parameter "{{ name }}" uses unsupported type "{{ type }}". Supported: {{ supportedTypes }}.',
      unsupportedProperty: 'Parameter "{{ name }}" uses unsupported property "{{ property }}".',
    },
    schema: [],
    type: "problem",
  },
  name: "action-no-invalid-params",
});

type RuleContext = Parameters<typeof actionNoInvalidParams.create>[0];

function validateParamDefinition(context: RuleContext, property: TSESTree.Property): void {
  const paramName = staticKeyName(property.key) ?? "<computed>";

  if (property.value.type !== AST_NODE_TYPES.ObjectExpression) {
    context.report({ data: { name: paramName }, messageId: "paramMustBeObject", node: property.value });
    return;
  }

  validateDescriptorProperties(context, paramName, property.value);
}

function validateDescriptorProperties(
  context: RuleContext,
  paramName: string,
  descriptor: TSESTree.ObjectExpression,
): void {
  let hasType = false;
  const isObjectType = resolveTypeValue(descriptor) === "object";
  const allowedKeys = isObjectType ? OBJECT_DESCRIPTOR_KEYS : SUPPORTED_DESCRIPTOR_KEYS;

  for (const prop of descriptor.properties) {
    if (prop.type === AST_NODE_TYPES.SpreadElement) {
      context.report({
        data: { name: paramName, property: "...spread" },
        messageId: "unsupportedProperty",
        node: prop,
      });
      continue;
    }

    const keyName = staticKeyName(prop.key);

    if (keyName === "type") {
      hasType = true;
      validateTypeValue(context, paramName, prop);
      continue;
    }

    if (keyName === "properties" && isObjectType) {
      validatePropertiesValue(context, paramName, prop);
      continue;
    }

    if (keyName === "additionalProperties" && isObjectType) {
      validateAdditionalPropertiesValue(context, paramName, prop);
      continue;
    }

    if (keyName !== undefined && !allowedKeys.has(keyName)) {
      context.report({ data: { name: paramName, property: keyName }, messageId: "unsupportedProperty", node: prop });
    }
  }

  if (!hasType) {
    const supportedTypes = [...SUPPORTED_TYPES].join(", ");
    context.report({ data: { name: paramName, supportedTypes }, messageId: "missingType", node: descriptor });
  }
}

function resolveTypeValue(descriptor: TSESTree.ObjectExpression): string | undefined {
  for (const prop of descriptor.properties) {
    if (prop.type === AST_NODE_TYPES.SpreadElement) continue;

    const keyName = staticKeyName(prop.key);
    if (keyName !== "type") continue;

    const valueNode = prop.value;
    if (valueNode.type === AST_NODE_TYPES.Literal && typeof valueNode.value === "string") {
      return valueNode.value;
    }
  }

  return undefined;
}

function validatePropertiesValue(context: RuleContext, paramName: string, property: TSESTree.Property): void {
  const valueNode = property.value;

  if (valueNode.type !== AST_NODE_TYPES.ObjectExpression) {
    context.report({ data: { name: paramName }, messageId: "propertiesMustBeObject", node: valueNode });
    return;
  }

  for (const prop of valueNode.properties) {
    if (prop.type === AST_NODE_TYPES.SpreadElement) continue;
    if (prop.computed || prop.shorthand) continue;

    const nestedName = `${paramName}.${staticKeyName(prop.key) ?? "<computed>"}`;

    if (prop.value.type !== AST_NODE_TYPES.ObjectExpression) {
      context.report({ data: { name: nestedName }, messageId: "paramMustBeObject", node: prop.value });
      continue;
    }

    validateSimpleDescriptor(context, nestedName, prop.value);
  }
}

function validateSimpleDescriptor(
  context: RuleContext,
  paramName: string,
  descriptor: TSESTree.ObjectExpression,
): void {
  let hasType = false;

  for (const prop of descriptor.properties) {
    if (prop.type === AST_NODE_TYPES.SpreadElement) {
      context.report({
        data: { name: paramName, property: "...spread" },
        messageId: "unsupportedProperty",
        node: prop,
      });
      continue;
    }

    const keyName = staticKeyName(prop.key);

    if (keyName === "type") {
      hasType = true;
      validateTypeValue(context, paramName, prop);
      continue;
    }

    if (keyName !== undefined && !SUPPORTED_DESCRIPTOR_KEYS.has(keyName)) {
      context.report({ data: { name: paramName, property: keyName }, messageId: "unsupportedProperty", node: prop });
    }
  }

  if (!hasType) {
    const supportedTypes = [...SUPPORTED_TYPES].join(", ");
    context.report({ data: { name: paramName, supportedTypes }, messageId: "missingType", node: descriptor });
  }
}

function validateAdditionalPropertiesValue(context: RuleContext, paramName: string, property: TSESTree.Property): void {
  const valueNode = property.value;

  if (valueNode.type !== AST_NODE_TYPES.Literal || typeof valueNode.value !== "boolean") {
    context.report({ data: { name: paramName }, messageId: "additionalPropertiesMustBeBoolean", node: valueNode });
  }
}

function validateTypeValue(context: RuleContext, paramName: string, property: TSESTree.Property): void {
  const valueNode = property.value;

  if (valueNode.type === AST_NODE_TYPES.AssignmentPattern) {
    context.report({ data: { name: paramName }, messageId: "typeNotStringLiteral", node: valueNode });
    return;
  }

  const value = valueNode as TSESTree.Expression;

  if (value.type !== AST_NODE_TYPES.Literal || typeof value.value !== "string") {
    context.report({ data: { name: paramName }, messageId: "typeNotStringLiteral", node: value });
    return;
  }

  if (!SUPPORTED_TYPES.has(value.value)) {
    const supportedTypes = [...SUPPORTED_TYPES].join(", ");
    context.report({
      data: { name: paramName, supportedTypes, type: value.value },
      messageId: "unsupportedParamType",
      node: value,
    });
  }
}
