import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES, AST_TOKEN_TYPES } from "@typescript-eslint/utils";

import { createRule } from "../../utils/create-rule.js";
import { isActionFile } from "../../utils/is-action-file.js";

type MessageIds = "manualOnSuccessType" | "manualRunType" | "missingOnSuccessType" | "missingRunType";

interface ExportInfo {
  expectedType: string;
  manualMessageId: MessageIds;
  missingMessageId: MessageIds;
  name: string;
}

const EXPORTS: ExportInfo[] = [
  { expectedType: "ActionRun", manualMessageId: "manualRunType", missingMessageId: "missingRunType", name: "run" },
  {
    expectedType: "ActionOnSuccess",
    manualMessageId: "manualOnSuccessType",
    missingMessageId: "missingOnSuccessType",
    name: "onSuccess",
  },
];

export const actionRequireActionRunType = createRule<[], MessageIds>({
  create(context) {
    if (!isActionFile(context.filename)) return {};

    return {
      ExportNamedDeclaration(node) {
        const declaration = node.declaration;
        if (!declaration || declaration.type !== AST_NODE_TYPES.VariableDeclaration || declaration.kind !== "const")
          return;

        const declarator = declaration.declarations[0];
        if (!declarator) return;
        if (declarator.id.type !== AST_NODE_TYPES.Identifier) return;

        const id = declarator.id;
        const exportInfo = EXPORTS.find((e) => e.name === id.name);
        if (!exportInfo) return;

        if (hasJSDocTypeAnnotation(context, node, exportInfo.expectedType)) return;

        const annotation = id.typeAnnotation?.typeAnnotation;

        if (!annotation) {
          context.report({
            fix(fixer) {
              return buildTypeFixes(fixer, context, exportInfo.expectedType, declarator);
            },
            messageId: exportInfo.missingMessageId,
            node: id,
          });
          return;
        }

        if (isCorrectTypeReference(annotation, exportInfo.expectedType)) return;

        const typeAnnotation = id.typeAnnotation;
        if (!typeAnnotation) return;

        context.report({
          fix(fixer) {
            return buildTypeFixes(fixer, context, exportInfo.expectedType, declarator);
          },
          messageId: exportInfo.manualMessageId,
          node: id,
        });
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Require Gadget action run and onSuccess exports to use generated type annotations.",
    },
    fixable: "code",
    messages: {
      manualOnSuccessType: "Use ActionOnSuccess for onSuccess.",
      manualRunType: "Use ActionRun for run.",
      missingOnSuccessType: "Type onSuccess as ActionOnSuccess.",
      missingRunType: "Type run as ActionRun.",
    },
    schema: [],
    type: "problem",
  },
  name: "action-require-action-run-type",
});

type RuleContext = Parameters<typeof actionRequireActionRunType.create>[0];
type Fixer = Parameters<NonNullable<Parameters<RuleContext["report"]>[0]["fix"]>>[0];

function buildTypeFixes(
  fixer: Fixer,
  context: RuleContext,
  expectedType: string,
  declarator: TSESTree.VariableDeclarator,
): ReturnType<Fixer["remove"]>[] {
  const fixes: ReturnType<Fixer["remove"]>[] = [];

  if (declarator.id.type === AST_NODE_TYPES.Identifier) {
    const existingAnnotation = declarator.id.typeAnnotation;
    if (existingAnnotation) {
      fixes.push(fixer.replaceText(existingAnnotation, `: ${expectedType}`));
    } else {
      fixes.push(fixer.insertTextAfter(declarator.id, `: ${expectedType}`));
    }
  }

  const init = declarator.init;
  if (
    init &&
    (init.type === AST_NODE_TYPES.ArrowFunctionExpression || init.type === AST_NODE_TYPES.FunctionExpression)
  ) {
    collectFunctionTypeFixes(fixer, init, fixes);
  }

  fixes.push(...collectNativeTypeImportFixes(fixer, context, expectedType));
  return fixes;
}

function isCorrectTypeReference(annotation: TSESTree.TypeNode, expectedName: string): boolean {
  return (
    annotation.type === AST_NODE_TYPES.TSTypeReference &&
    annotation.typeName.type === AST_NODE_TYPES.Identifier &&
    annotation.typeName.name === expectedName
  );
}

function hasJSDocTypeAnnotation(
  context: RuleContext,
  node: TSESTree.ExportNamedDeclaration,
  expectedType: string,
): boolean {
  const comments = context.sourceCode.getCommentsBefore(node);
  return comments.some(
    (comment) =>
      comment.type === AST_TOKEN_TYPES.Block &&
      new RegExp(`@type\\s*\\{\\s*${expectedType}\\s*\\}`).test(comment.value),
  );
}

function collectFunctionTypeFixes(
  fixer: Fixer,
  node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
  fixes: ReturnType<Fixer["remove"]>[],
): void {
  for (const param of node.params) {
    collectParameterTypeFixes(fixer, param, fixes);
  }

  if (node.returnType) {
    fixes.push(fixer.remove(node.returnType));
  }
}

function collectParameterTypeFixes(
  fixer: Fixer,
  node:
    | TSESTree.AssignmentPattern
    | TSESTree.BindingName
    | TSESTree.DestructuringPattern
    | TSESTree.Parameter
    | TSESTree.RestElement
    | TSESTree.TSParameterProperty,
  fixes: ReturnType<Fixer["remove"]>[],
): void {
  if (
    node.type === AST_NODE_TYPES.Identifier ||
    node.type === AST_NODE_TYPES.ObjectPattern ||
    node.type === AST_NODE_TYPES.ArrayPattern
  ) {
    if (node.typeAnnotation) {
      fixes.push(fixer.remove(node.typeAnnotation));
    }
    return;
  }

  if (node.type === AST_NODE_TYPES.AssignmentPattern) {
    collectParameterTypeFixes(fixer, node.left, fixes);
    return;
  }

  if (node.type === AST_NODE_TYPES.RestElement) {
    collectParameterTypeFixes(fixer, node.argument, fixes);
    return;
  }

  if (node.type === AST_NODE_TYPES.TSParameterProperty) {
    collectParameterTypeFixes(fixer, node.parameter, fixes);
  }
}

function collectNativeTypeImportFixes(
  fixer: Fixer,
  context: RuleContext,
  typeName: string,
): ReturnType<Fixer["remove"]>[] {
  const sourceCode = context.sourceCode;
  const program = sourceCode.ast;
  const fixes: ReturnType<Fixer["remove"]>[] = [];

  for (const statement of program.body) {
    if (statement.type !== AST_NODE_TYPES.ImportDeclaration) continue;
    if (statement.source.value !== "gadget-server") continue;

    for (const specifier of statement.specifiers) {
      if (specifier.type !== AST_NODE_TYPES.ImportSpecifier) continue;
      if (specifier.imported.type !== AST_NODE_TYPES.Identifier || specifier.imported.name !== typeName) continue;
      fixes.push(removeImportSpecifier(fixer, sourceCode, statement, specifier));
    }
  }

  return fixes;
}

function removeImportSpecifier(
  fixer: Fixer,
  sourceCode: RuleContext["sourceCode"],
  declaration: TSESTree.ImportDeclaration,
  specifier: TSESTree.ImportSpecifier,
): ReturnType<Fixer["remove"]> {
  if (declaration.specifiers.length === 1) {
    const text = sourceCode.getText();
    let end = declaration.range[1];
    const lineEnd = text.indexOf("\n", end);
    if (lineEnd !== -1) {
      end = lineEnd + 1;
    }
    return fixer.removeRange([declaration.range[0], end]);
  }

  const text = sourceCode.getText();
  let start = specifier.range[0];
  let end = specifier.range[1];

  const tokenAfter = sourceCode.getTokenAfter(specifier);
  if (tokenAfter?.value === ",") {
    end = tokenAfter.range[1];
    const nextToken = sourceCode.getTokenAfter(tokenAfter);
    if (nextToken) {
      const between = text.slice(end, nextToken.range[0]);
      if (/^\s+$/.test(between)) {
        end = nextToken.range[0];
      }
    }
    return fixer.removeRange([start, end]);
  }

  const tokenBefore = sourceCode.getTokenBefore(specifier);
  if (tokenBefore?.value === ",") {
    start = tokenBefore.range[0];
    return fixer.removeRange([start, end]);
  }

  return fixer.remove(specifier);
}
