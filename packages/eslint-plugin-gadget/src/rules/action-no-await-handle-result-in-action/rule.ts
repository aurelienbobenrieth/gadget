import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import { createExportScopeTracker } from "../../utils/export-scope-tracker.js";
import { isActionFile } from "../../utils/is-action-file.js";

type ExportKind = "onSuccess" | "run";
type MessageIds = "inOnSuccess" | "inRun";

export const actionNoAwaitHandleResultInAction = createRule<[], MessageIds>({
  create(context) {
    if (!isActionFile(context.filename)) return {};

    const tracker = createExportScopeTracker<ExportKind>({ onSuccess: "onSuccess", run: "run" });

    return {
      ...tracker.listeners(),
      AwaitExpression(node: TSESTree.AwaitExpression) {
        const exportKind = tracker.getDirectScope();
        if (!exportKind) return;

        if (node.argument.type !== AST_NODE_TYPES.CallExpression) return;
        if (!isHandleResultCall(node.argument)) return;

        context.report({
          messageId: exportKind === "run" ? "inRun" : "inOnSuccess",
          node,
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Disallow awaiting handle.result() inside run or onSuccess exports in Gadget actions.",
    },
    messages: {
      inOnSuccess: "Do not await handle.result() in onSuccess, it bills the full wait time.",
      inRun: "Do not await handle.result() in run, it causes GGT_TRANSACTION_TIMEOUT.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "action-no-await-handle-result-in-action",
});

function isHandleResultCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return false;
  if (node.callee.property.type !== AST_NODE_TYPES.Identifier || node.callee.property.name !== "result") return false;

  const obj = node.callee.object;
  if (obj.type === AST_NODE_TYPES.Identifier) return true;
  if (obj.type === AST_NODE_TYPES.AwaitExpression && obj.argument.type === AST_NODE_TYPES.CallExpression) return true;

  return false;
}
