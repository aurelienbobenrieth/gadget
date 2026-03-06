import type { TSESTree } from "@typescript-eslint/utils";
import type { TSESLint } from "@typescript-eslint/utils";
import type { SourceCode } from "@typescript-eslint/utils/ts-eslint";

export function removeObjectProperty(
  fixer: TSESLint.RuleFixer,
  sourceCode: SourceCode,
  objectExpression: TSESTree.ObjectExpression,
  property: TSESTree.Property,
): TSESLint.RuleFix {
  let start = property.range[0];
  let end = property.range[1];

  const tokenAfter = sourceCode.getTokenAfter(property);
  if (tokenAfter && tokenAfter.value === ",") {
    end = tokenAfter.range[1];

    const nextToken = sourceCode.getTokenAfter(tokenAfter);
    if (nextToken) {
      const text = sourceCode.getText();
      const between = text.slice(end, nextToken.range[0]);
      if (/^\s+$/.test(between) && !between.includes("\n")) {
        end = nextToken.range[0];
      }
    }
  } else {
    const tokenBefore = sourceCode.getTokenBefore(property);
    if (tokenBefore && tokenBefore.value === ",") {
      start = tokenBefore.range[0];
      const text = sourceCode.getText();
      const between = text.slice(tokenBefore.range[1], property.range[0]);
      if (/^\s+$/.test(between)) {
        start = tokenBefore.range[0];
      }
    }
  }

  const text = sourceCode.getText();
  const lineStart = text.lastIndexOf("\n", start - 1);
  const lineEnd = text.indexOf("\n", end);
  if (lineStart !== -1 && lineEnd !== -1) {
    const beforeOnLine = text.slice(lineStart + 1, start).trim();
    const afterOnLine = text.slice(end, lineEnd).trim();
    if (beforeOnLine === "" && afterOnLine === "") {
      start = lineStart + 1;
      end = lineEnd + 1;
    }
  }

  if (start < objectExpression.range[0] + 1) start = property.range[0];
  if (end > objectExpression.range[1] - 1) end = property.range[1];

  return fixer.removeRange([start, end]);
}

export function removeArrayElement(
  fixer: TSESLint.RuleFixer,
  sourceCode: SourceCode,
  array: TSESTree.ArrayExpression,
  element: TSESTree.Expression,
): TSESLint.RuleFix {
  let start = element.range[0];
  let end = element.range[1];

  const tokenAfter = sourceCode.getTokenAfter(element);
  if (tokenAfter && tokenAfter.value === ",") {
    end = tokenAfter.range[1];

    const nextToken = sourceCode.getTokenAfter(tokenAfter);
    if (nextToken) {
      const text = sourceCode.getText();
      const between = text.slice(end, nextToken.range[0]);
      if (/^\s+$/.test(between)) {
        end = nextToken.range[0];
      }
    }
  } else {
    const tokenBefore = sourceCode.getTokenBefore(element);
    if (tokenBefore && tokenBefore.value === ",") {
      start = tokenBefore.range[0];
    }
  }

  if (start < array.range[0]) start = element.range[0];
  if (end > array.range[1]) end = element.range[1];

  return fixer.removeRange([start, end]);
}
