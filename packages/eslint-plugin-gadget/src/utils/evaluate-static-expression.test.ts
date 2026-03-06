import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { evaluateStaticExpression } from "./evaluate-static-expression.js";

function createBinaryExpression(left: number, operator: string, right: number): TSESTree.BinaryExpression {
  return {
    left: {
      raw: String(left),
      type: AST_NODE_TYPES.Literal,
      value: left,
    } as TSESTree.Literal,
    operator,
    right: {
      raw: String(right),
      type: AST_NODE_TYPES.Literal,
      value: right,
    } as TSESTree.Literal,
    type: AST_NODE_TYPES.BinaryExpression,
  } as TSESTree.BinaryExpression;
}

describe("evaluateStaticExpression", () => {
  describe("arithmetic operations", () => {
    it("evaluates addition", () => {
      const expr = createBinaryExpression(5, "+", 3);
      expect(evaluateStaticExpression(expr)).toBe(8);
    });

    it("evaluates subtraction", () => {
      const expr = createBinaryExpression(10, "-", 4);
      expect(evaluateStaticExpression(expr)).toBe(6);
    });

    it("evaluates multiplication", () => {
      const expr = createBinaryExpression(6, "*", 7);
      expect(evaluateStaticExpression(expr)).toBe(42);
    });

    it("evaluates division with integer result", () => {
      const expr = createBinaryExpression(20, "/", 4);
      expect(evaluateStaticExpression(expr)).toBe(5);
    });
  });

  describe("edge cases", () => {
    it("returns undefined for division by zero", () => {
      const expr = createBinaryExpression(10, "/", 0);
      expect(evaluateStaticExpression(expr)).toBeUndefined();
    });

    it("returns undefined for non-integer division result", () => {
      const expr = createBinaryExpression(10, "/", 3);
      expect(evaluateStaticExpression(expr)).toBeUndefined();
    });

    it("returns undefined for non-arithmetic operators", () => {
      const expr = createBinaryExpression(5, "===", 5);
      expect(evaluateStaticExpression(expr)).toBeUndefined();
    });

    it("returns undefined for non-numeric left operand", () => {
      const expr = {
        left: {
          raw: '"hello"',
          type: AST_NODE_TYPES.Literal,
          value: "hello",
        } as TSESTree.Literal,
        operator: "+",
        right: {
          raw: "5",
          type: AST_NODE_TYPES.Literal,
          value: 5,
        } as TSESTree.Literal,
        type: AST_NODE_TYPES.BinaryExpression,
      } as TSESTree.BinaryExpression;
      expect(evaluateStaticExpression(expr)).toBeUndefined();
    });

    it("returns undefined for identifier operands", () => {
      const expr = {
        left: {
          name: "x",
          type: AST_NODE_TYPES.Identifier,
        } as TSESTree.Identifier,
        operator: "+",
        right: {
          raw: "5",
          type: AST_NODE_TYPES.Literal,
          value: 5,
        } as TSESTree.Literal,
        type: AST_NODE_TYPES.BinaryExpression,
      } as TSESTree.BinaryExpression;
      expect(evaluateStaticExpression(expr)).toBeUndefined();
    });
  });

  describe("common use cases", () => {
    it("evaluates 60 * 1000 for milliseconds", () => {
      const expr = createBinaryExpression(60, "*", 1000);
      expect(evaluateStaticExpression(expr)).toBe(60000);
    });

    it("evaluates 5 * 60 * 1000 style expressions are not supported (nested)", () => {
      // This tests the limitation: nested expressions are not handled
      const innerExpr = createBinaryExpression(5, "*", 60);
      const expr = {
        left: innerExpr,
        operator: "*",
        right: {
          raw: "1000",
          type: AST_NODE_TYPES.Literal,
          value: 1000,
        } as TSESTree.Literal,
        type: AST_NODE_TYPES.BinaryExpression,
      } as TSESTree.BinaryExpression;
      expect(evaluateStaticExpression(expr)).toBeUndefined();
    });
  });
});
