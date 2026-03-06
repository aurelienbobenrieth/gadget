import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { extractExportedConstObject } from "../../utils/action-export-object.js";
import { createRule } from "../../utils/create-rule.js";
import { evaluateStaticExpression } from "../../utils/evaluate-static-expression.js";
import { isActionFile } from "../../utils/is-action-file.js";

type MessageIds = "computedKey" | "nonLiteralValue" | "numericSeparator" | "shorthandProperty";

export const actionNoInvalidOptions = createRule<[], MessageIds>({
  create(context) {
    if (!isActionFile(context.filename)) return {};

    return {
      ExportNamedDeclaration(node) {
        const objectExpression = extractExportedConstObject(node, {
          identifierName: "options",
        });
        if (!objectExpression) return;

        validateObjectProperties(context, objectExpression);
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Enforce that the Gadget action options export contains only valid JSON-serializable literals.",
    },
    fixable: "code",
    messages: {
      computedKey: "Option keys must be plain identifiers or string literals.",
      nonLiteralValue: "Option values must be JSON-serializable literals.",
      numericSeparator: "Numeric separator {{ raw }} is not valid JSON. Use {{ fixed }}.",
      shorthandProperty: "Shorthand properties are not allowed in options.",
    },
    schema: [],
    type: "problem",
  },
  name: "action-no-invalid-options",
});

type RuleContext = Parameters<typeof actionNoInvalidOptions.create>[0];

function validateObjectProperties(context: RuleContext, objectExpression: TSESTree.ObjectExpression): void {
  for (const property of objectExpression.properties) {
    validateProperty(context, property);
  }
}

function validateProperty(context: RuleContext, property: TSESTree.ObjectLiteralElement): void {
  if (property.type === AST_NODE_TYPES.SpreadElement) {
    context.report({ messageId: "nonLiteralValue", node: property });
    return;
  }

  if (property.computed) {
    context.report({ messageId: "computedKey", node: property.key });
    return;
  }

  if (property.shorthand) {
    context.report({ messageId: "shorthandProperty", node: property });
    return;
  }

  if (property.value.type === AST_NODE_TYPES.AssignmentPattern) {
    context.report({ messageId: "nonLiteralValue", node: property.value });
    return;
  }

  validateExpression(context, property.value as TSESTree.Expression);
}

function validateExpression(context: RuleContext, node: TSESTree.Expression): void {
  if (isNumericSeparatorLiteral(node)) {
    reportNumericSeparator(context, node);
    return;
  }

  if (node.type === AST_NODE_TYPES.Literal) return;

  if (node.type === AST_NODE_TYPES.ObjectExpression) {
    validateObjectProperties(context, node);
    return;
  }

  if (node.type === AST_NODE_TYPES.ArrayExpression) {
    validateArrayElements(context, node);
    return;
  }

  if (node.type === AST_NODE_TYPES.BinaryExpression) {
    reportBinaryExpression(context, node);
    return;
  }

  if (isStaticTemplateLiteral(node)) {
    reportStaticTemplateLiteral(context, node);
    return;
  }

  context.report({ messageId: "nonLiteralValue", node });
}

function validateArrayElements(context: RuleContext, node: TSESTree.ArrayExpression): void {
  for (const element of node.elements) {
    if (element === null) continue;

    if (element.type === AST_NODE_TYPES.SpreadElement) {
      context.report({ messageId: "nonLiteralValue", node: element });
      continue;
    }

    validateExpression(context, element);
  }
}

function isNumericSeparatorLiteral(node: TSESTree.Expression): node is TSESTree.NumberLiteral {
  return node.type === AST_NODE_TYPES.Literal && typeof node.value === "number" && node.raw.includes("_");
}

function isStaticTemplateLiteral(node: TSESTree.Expression): node is TSESTree.TemplateLiteral {
  return node.type === AST_NODE_TYPES.TemplateLiteral && node.expressions.length === 0 && node.quasis.length === 1;
}

function reportNumericSeparator(context: RuleContext, node: TSESTree.NumberLiteral): void {
  const fixed = node.raw.replace(/_/g, "");
  context.report({
    data: { fixed, raw: node.raw },
    fix: (fixer) => fixer.replaceText(node, fixed),
    messageId: "numericSeparator",
    node,
  });
}

function reportBinaryExpression(context: RuleContext, node: TSESTree.BinaryExpression): void {
  const result = evaluateStaticExpression(node);

  if (result !== undefined) {
    context.report({
      fix: (fixer) => fixer.replaceText(node, String(result)),
      messageId: "nonLiteralValue",
      node,
    });
    return;
  }

  context.report({ messageId: "nonLiteralValue", node });
}

function reportStaticTemplateLiteral(context: RuleContext, node: TSESTree.TemplateLiteral): void {
  const quasi = node.quasis[0];
  if (!quasi) return;

  const rawValue = quasi.value.cooked;
  const escaped = rawValue.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  context.report({
    fix: (fixer) => fixer.replaceText(node, `"${escaped}"`),
    messageId: "nonLiteralValue",
    node,
  });
}
