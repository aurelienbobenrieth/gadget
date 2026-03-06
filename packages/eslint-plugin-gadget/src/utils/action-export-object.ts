import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

interface ExportObjectMatch {
  identifierName: string;
  typeAnnotationName?: string;
}

export function extractExportedConstObject(
  node: TSESTree.ExportNamedDeclaration,
  match: ExportObjectMatch,
): TSESTree.ObjectExpression | undefined {
  const declarator = firstConstDeclarator(node);
  if (!declarator) return undefined;
  if (!isIdentifierNamed(declarator.id, match.identifierName)) return undefined;
  if (match.typeAnnotationName && !hasTypeAnnotationNamed(declarator.id, match.typeAnnotationName)) return undefined;
  if (declarator.init?.type !== AST_NODE_TYPES.ObjectExpression) return undefined;
  return declarator.init;
}

function firstConstDeclarator(node: TSESTree.ExportNamedDeclaration): TSESTree.VariableDeclarator | undefined {
  const declaration = node.declaration;
  if (!declaration || declaration.type !== AST_NODE_TYPES.VariableDeclaration || declaration.kind !== "const")
    return undefined;
  return declaration.declarations[0];
}

function isIdentifierNamed(id: TSESTree.BindingName, name: string): id is TSESTree.Identifier {
  return id.type === AST_NODE_TYPES.Identifier && id.name === name;
}

function hasTypeAnnotationNamed(id: TSESTree.Identifier, typeName: string): boolean {
  const annotation = id.typeAnnotation?.typeAnnotation;
  return (
    annotation?.type === AST_NODE_TYPES.TSTypeReference &&
    annotation.typeName.type === AST_NODE_TYPES.Identifier &&
    annotation.typeName.name === typeName
  );
}
