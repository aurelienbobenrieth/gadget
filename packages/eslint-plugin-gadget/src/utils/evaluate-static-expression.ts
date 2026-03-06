import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";

type ArithmeticOperator = "*" | "+" | "-" | "/";

const ARITHMETIC_OPERATORS = new Set<string>(["*", "+", "-", "/"]);

export function evaluateStaticExpression(node: TSESTree.BinaryExpression): number | undefined {
  if (!isArithmeticOperator(node.operator)) return undefined;

  const left = numericLiteralValue(node.left);
  const right = numericLiteralValue(node.right);
  if (left === undefined || right === undefined) return undefined;
  if (node.operator === "/" && right === 0) return undefined;

  const result = compute(left, node.operator, right);
  return Number.isInteger(result) ? result : undefined;
}

function isArithmeticOperator(op: string): op is ArithmeticOperator {
  return ARITHMETIC_OPERATORS.has(op);
}

function compute(left: number, operator: ArithmeticOperator, right: number): number {
  switch (operator) {
    case "*":
      return left * right;
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "/":
      return left / right;
  }
}

function numericLiteralValue(node: TSESTree.Expression | TSESTree.PrivateIdentifier): number | undefined {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === "number") return node.value;
  return undefined;
}
