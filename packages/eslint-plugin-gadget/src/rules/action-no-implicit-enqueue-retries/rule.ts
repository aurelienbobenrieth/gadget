import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import { staticKeyName } from "../../utils/static-key-name.js";

type MessageIds = "missingRetries";

export const actionNoImplicitEnqueueRetries = createRule<[], MessageIds>({
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return;

        const callee = node.callee;
        if (callee.object.type !== AST_NODE_TYPES.Identifier || callee.object.name !== "api") return;
        if (callee.property.type !== AST_NODE_TYPES.Identifier || callee.property.name !== "enqueue") return;

        const options = node.arguments[2];

        if (!options) {
          context.report({ messageId: "missingRetries", node });
          return;
        }

        if (options.type !== AST_NODE_TYPES.ObjectExpression) return;

        const hasRetries = options.properties.some((prop) => {
          if (prop.type !== AST_NODE_TYPES.Property) return false;
          return staticKeyName(prop.key) === "retries";
        });

        if (!hasRetries) {
          context.report({ messageId: "missingRetries", node });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Require explicit retries option on api.enqueue calls to avoid unintended retry behavior.",
    },
    messages: {
      missingRetries: "Set api.enqueue retries explicitly. Gadget defaults to 6.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "action-no-implicit-enqueue-retries",
});
