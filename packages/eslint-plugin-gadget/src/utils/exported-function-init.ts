import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

export function getExportedFunctionInit(
  node: TSESTree.ExportNamedDeclaration,
  name: string,
): TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | undefined {
  const declaration = node.declaration;
  if (!declaration || declaration.type !== AST_NODE_TYPES.VariableDeclaration || declaration.kind !== "const")
    return undefined;

  const declarator = declaration.declarations[0];
  if (!declarator) return undefined;
  if (declarator.id.type !== AST_NODE_TYPES.Identifier || declarator.id.name !== name) return undefined;

  const init = declarator.init;
  if (!init) return undefined;
  if (init.type !== AST_NODE_TYPES.ArrowFunctionExpression && init.type !== AST_NODE_TYPES.FunctionExpression)
    return undefined;

  return init;
}

export function isExportedFunctionInitNode(
  node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
  ...names: string[]
): boolean {
  const parent = node.parent;
  if (parent.type !== AST_NODE_TYPES.VariableDeclarator) return false;
  if (parent.id.type !== AST_NODE_TYPES.Identifier) return false;
  if (!names.includes(parent.id.name)) return false;

  return parent.parent.parent.type === AST_NODE_TYPES.ExportNamedDeclaration;
}
