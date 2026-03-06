import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import { findOptionsExport } from "../../utils/find-options-export.js";
import { removeArrayElement, removeObjectProperty } from "../../utils/fixer-remove.js";
import { isModelActionFile } from "../../utils/is-action-file.js";
import { staticKeyName } from "../../utils/static-key-name.js";

type MessageIds = "schedulerNotAllowed";

export const modelActionNoInvalidTrigger = createRule<[], MessageIds>({
  create(context) {
    if (!isModelActionFile(context.filename)) return {};

    return {
      "Program:exit"(node) {
        const objectExpression = findOptionsExport(node.body);
        if (!objectExpression) return;

        const triggersProperty = objectExpression.properties.find(
          (prop): prop is TSESTree.Property =>
            prop.type === AST_NODE_TYPES.Property && !prop.computed && staticKeyName(prop.key) === "triggers",
        );

        if (!triggersProperty) return;
        if (triggersProperty.value.type !== AST_NODE_TYPES.ArrayExpression) return;

        const triggersArray = triggersProperty.value;

        for (const element of triggersArray.elements) {
          if (!element || element.type !== AST_NODE_TYPES.ObjectExpression) continue;

          if (isSchedulerTrigger(element)) {
            const nonNullElements = triggersArray.elements.filter((el): el is TSESTree.Expression => el !== null);
            const isOnlyElement = nonNullElements.length === 1;

            context.report({
              fix(fixer) {
                if (isOnlyElement) {
                  return removeObjectProperty(fixer, context.sourceCode, objectExpression, triggersProperty);
                }
                return removeArrayElement(fixer, context.sourceCode, triggersArray, element);
              },
              messageId: "schedulerNotAllowed",
              node: element,
            });
          }
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Disallow scheduler triggers in model action options.",
    },
    fixable: "code",
    messages: {
      schedulerNotAllowed: "Model actions cannot use scheduler triggers.",
    },
    schema: [],
    type: "problem",
  },
  name: "model-action-no-invalid-trigger",
});

function isSchedulerTrigger(obj: TSESTree.ObjectExpression): boolean {
  return obj.properties.some(
    (prop) =>
      prop.type === AST_NODE_TYPES.Property &&
      !prop.computed &&
      staticKeyName(prop.key) === "type" &&
      prop.value.type === AST_NODE_TYPES.Literal &&
      prop.value.value === "scheduler",
  );
}
