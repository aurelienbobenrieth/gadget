import type { TSESTree } from "@typescript-eslint/utils";
import type { SourceCode } from "@typescript-eslint/utils/ts-eslint";

import { AST_TOKEN_TYPES } from "@typescript-eslint/utils";

const DURATION_COMMENT_PATTERN = /\d+\s*(second|minute)/i;

export function formatDurationComment(ms: number): string {
  if (ms % 60_000 === 0) return `// ${String(ms / 60_000)} minutes`;
  return `// ${String(ms / 1000)} seconds`;
}

export function findSameLineComment(
  sourceCode: SourceCode,
  afterNode: TSESTree.Node | TSESTree.Token,
): TSESTree.Comment | undefined {
  const token = sourceCode.getTokenAfter(afterNode, { includeComments: true });
  if (!token) return undefined;

  const isComment = token.type === AST_TOKEN_TYPES.Line || token.type === AST_TOKEN_TYPES.Block;
  const isSameLine = token.loc.start.line === afterNode.loc.end.line;
  if (isComment && isSameLine) return token as TSESTree.Comment;

  return undefined;
}

export function isDurationComment(comment: TSESTree.Comment): boolean {
  return DURATION_COMMENT_PATTERN.test(comment.value);
}
