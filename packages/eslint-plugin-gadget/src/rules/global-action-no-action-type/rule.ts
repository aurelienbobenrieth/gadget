import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import { findOptionsExport } from "../../utils/find-options-export.js";
import { removeObjectProperty } from "../../utils/fixer-remove.js";
import { isGlobalActionFile } from "../../utils/is-action-file.js";
import { staticKeyName } from "../../utils/static-key-name.js";

type MessageIds = "actionTypeNotAllowed";

export const globalActionNoActionType = createRule<[], MessageIds>({
  create(context) {
    if (!isGlobalActionFile(context.filename)) return {};

    return {
      "Program:exit"(node) {
        const objectExpression = findOptionsExport(node.body);
        if (!objectExpression) return;

        for (const property of objectExpression.properties) {
          if (property.type !== AST_NODE_TYPES.Property) continue;
          if (property.computed) continue;
          if (staticKeyName(property.key) !== "actionType") continue;

          context.report({
            fix(fixer) {
              return removeObjectProperty(fixer, context.sourceCode, objectExpression, property);
            },
            messageId: "actionTypeNotAllowed",
            node: property,
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Disallow actionType in global action options.",
    },
    fixable: "code",
    messages: {
      actionTypeNotAllowed: "Remove actionType from global actions.",
    },
    schema: [],
    type: "problem",
  },
  name: "global-action-no-action-type",
});
