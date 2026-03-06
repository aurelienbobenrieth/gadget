import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

import { getExportedFunctionInit, isExportedFunctionInitNode } from "./exported-function-init.js";

export interface ExportScopeTracker<TKind extends string> {
  getDirectScope(): TKind | undefined;
  listeners(onExportEnter?: (kind: TKind) => void): Record<string, (node: TSESTree.Node) => void>;
}

export function createExportScopeTracker<TKind extends string>(
  exportNames: Record<string, TKind>,
): ExportScopeTracker<TKind> {
  const scopeStack: (TKind | undefined)[] = [];
  const names = Object.keys(exportNames);

  function getDirectScope(): TKind | undefined {
    if (scopeStack.length !== 1) return undefined;
    return scopeStack[0];
  }

  function onNestedFunctionEnter(
    node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression,
  ): void {
    if (scopeStack.length === 0) return;
    if (node.type !== AST_NODE_TYPES.FunctionDeclaration && isExportedFunctionInitNode(node, ...names)) return;
    scopeStack.push(undefined);
  }

  function onFunctionExit(): void {
    if (scopeStack.length > 0) {
      scopeStack.pop();
    }
  }

  function listeners(onExportEnter?: (kind: TKind) => void): Record<string, (node: TSESTree.Node) => void> {
    return {
      ArrowFunctionExpression(node: TSESTree.Node) {
        onNestedFunctionEnter(node as TSESTree.ArrowFunctionExpression);
      },
      "ArrowFunctionExpression:exit": onFunctionExit,
      ExportNamedDeclaration(node: TSESTree.Node) {
        const exportNode = node as TSESTree.ExportNamedDeclaration;
        for (const [name, kind] of Object.entries(exportNames)) {
          if (getExportedFunctionInit(exportNode, name)) {
            scopeStack.push(kind);
            onExportEnter?.(kind);
            return;
          }
        }
      },
      FunctionDeclaration(node: TSESTree.Node) {
        onNestedFunctionEnter(node as TSESTree.FunctionDeclaration);
      },
      "FunctionDeclaration:exit": onFunctionExit,
      FunctionExpression(node: TSESTree.Node) {
        onNestedFunctionEnter(node as TSESTree.FunctionExpression);
      },
      "FunctionExpression:exit": onFunctionExit,
    };
  }

  return { getDirectScope, listeners };
}
