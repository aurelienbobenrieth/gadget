import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

export function findOptionsExport(body: TSESTree.Statement[]): null | TSESTree.ObjectExpression {
  for (const statement of body) {
    if (statement.type !== AST_NODE_TYPES.ExportNamedDeclaration) continue;

    const declaration = statement.declaration;
    if (!declaration || declaration.type !== AST_NODE_TYPES.VariableDeclaration || declaration.kind !== "const")
      continue;

    const declarator = declaration.declarations[0];
    if (!declarator) continue;
    if (declarator.id.type !== AST_NODE_TYPES.Identifier || declarator.id.name !== "options") continue;
    if (declarator.init?.type !== AST_NODE_TYPES.ObjectExpression) continue;

    return declarator.init;
  }

  return null;
}
