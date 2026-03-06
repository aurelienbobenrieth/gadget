import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import { findOptionsExport } from "../../utils/find-options-export.js";
import { isActionFile, isModelActionFile } from "../../utils/is-action-file.js";
import { staticKeyName } from "../../utils/static-key-name.js";

type MessageIds = "missingReturnType";

export const actionRequireExplicitReturnType = createRule<[], MessageIds>({
  create(context) {
    if (!isActionFile(context.filename)) return {};

    return {
      "Program:exit"(node) {
        const objectExpression = findOptionsExport(node.body);
        if (!objectExpression) return;

        const hasReturnType = objectExpression.properties.some(
          (prop) => prop.type === AST_NODE_TYPES.Property && !prop.computed && staticKeyName(prop.key) === "returnType",
        );

        if (hasReturnType) return;

        const isModel = isModelActionFile(context.filename);
        const defaultValue = isModel ? "false" : "true";

        context.report({
          fix(fixer) {
            const lastProperty = objectExpression.properties[objectExpression.properties.length - 1];
            if (lastProperty) {
              const tokenAfter = context.sourceCode.getTokenAfter(lastProperty);
              const hasTrailingComma = tokenAfter?.value === ",";
              const insertAfter = hasTrailingComma ? tokenAfter : lastProperty;
              const prefix = hasTrailingComma ? " " : ", ";
              return fixer.insertTextAfter(insertAfter, `${prefix}returnType: ${defaultValue},`);
            }

            return fixer.replaceText(objectExpression, `{ returnType: ${defaultValue} }`);
          },
          messageId: "missingReturnType",
          node: objectExpression,
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Require returnType to be explicitly set in the options export of Gadget actions.",
    },
    fixable: "code",
    messages: {
      missingReturnType: "Set returnType explicitly in options.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "action-require-explicit-return-type",
});
