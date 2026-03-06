import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import { findOptionsExport } from "../../utils/find-options-export.js";
import { isModelActionFile } from "../../utils/is-action-file.js";
import { staticKeyName } from "../../utils/static-key-name.js";

type MessageIds = "invalidActionType";

const VALID_ACTION_TYPES = new Set(["create", "custom", "delete", "update"]);

export const modelActionInvalidActionType = createRule<[], MessageIds>({
  create(context) {
    if (!isModelActionFile(context.filename)) return {};

    return {
      "Program:exit"(node) {
        const objectExpression = findOptionsExport(node.body);
        if (!objectExpression) return;

        for (const property of objectExpression.properties) {
          if (property.type !== AST_NODE_TYPES.Property) continue;
          if (property.computed) continue;
          if (staticKeyName(property.key) !== "actionType") continue;

          if (property.value.type === AST_NODE_TYPES.Literal && typeof property.value.value === "string") {
            if (!VALID_ACTION_TYPES.has(property.value.value)) {
              context.report({
                data: { value: property.value.value },
                messageId: "invalidActionType",
                node: property.value,
              });
            }
          }
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Disallow invalid actionType values in model action options.",
    },
    messages: {
      invalidActionType: 'actionType "{{ value }}" must be create, update, delete, or custom.',
    },
    schema: [],
    type: "problem",
  },
  name: "model-action-invalid-action-type",
});
