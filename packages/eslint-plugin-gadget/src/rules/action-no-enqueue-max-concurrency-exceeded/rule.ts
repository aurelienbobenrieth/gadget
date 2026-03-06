import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import { staticKeyName } from "../../utils/static-key-name.js";

const MAX_CONCURRENCY_LIMIT = 100;

type MessageIds = "exceeded";

export const actionNoEnqueueMaxConcurrencyExceeded = createRule<[], MessageIds>({
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return;

        const callee = node.callee;
        if (callee.object.type !== AST_NODE_TYPES.Identifier || callee.object.name !== "api") return;
        if (callee.property.type !== AST_NODE_TYPES.Identifier || callee.property.name !== "enqueue") return;

        const options = node.arguments[2];
        if (!options || options.type !== AST_NODE_TYPES.ObjectExpression) return;

        const queueProp = options.properties.find((prop) => {
          if (prop.type !== AST_NODE_TYPES.Property) return false;
          return staticKeyName(prop.key) === "queue";
        });

        if (!queueProp || queueProp.type !== AST_NODE_TYPES.Property) return;
        if (queueProp.value.type !== AST_NODE_TYPES.ObjectExpression) return;

        const maxConcurrencyProp = queueProp.value.properties.find((prop) => {
          if (prop.type !== AST_NODE_TYPES.Property) return false;
          return staticKeyName(prop.key) === "maxConcurrency";
        });

        if (!maxConcurrencyProp || maxConcurrencyProp.type !== AST_NODE_TYPES.Property) return;
        if (maxConcurrencyProp.value.type !== AST_NODE_TYPES.Literal) return;
        if (typeof maxConcurrencyProp.value.value !== "number") return;

        if (maxConcurrencyProp.value.value > MAX_CONCURRENCY_LIMIT) {
          context.report({
            data: { value: String(maxConcurrencyProp.value.value) },
            messageId: "exceeded",
            node: maxConcurrencyProp.value,
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Disallow maxConcurrency values exceeding Gadget's hard limit of 100 in api.enqueue queue options.",
    },
    messages: {
      exceeded: "maxConcurrency {{ value }} exceeds Gadget's limit of 100.",
    },
    schema: [],
    type: "problem",
  },
  name: "action-no-enqueue-max-concurrency-exceeded",
});
