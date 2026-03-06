import type { TSESTree } from "@typescript-eslint/utils";

import { AST_TOKEN_TYPES } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { formatDurationComment, isDurationComment } from "./duration-comment.js";

describe("formatDurationComment", () => {
  describe("minute formatting", () => {
    it("formats 60000ms as 1 minute", () => {
      expect(formatDurationComment(60_000)).toBe("// 1 minutes");
    });

    it("formats 120000ms as 2 minutes", () => {
      expect(formatDurationComment(120_000)).toBe("// 2 minutes");
    });

    it("formats 300000ms as 5 minutes", () => {
      expect(formatDurationComment(300_000)).toBe("// 5 minutes");
    });
  });

  describe("second formatting", () => {
    it("formats 1000ms as 1 second", () => {
      expect(formatDurationComment(1_000)).toBe("// 1 seconds");
    });

    it("formats 30000ms as 30 seconds", () => {
      expect(formatDurationComment(30_000)).toBe("// 30 seconds");
    });

    it("formats 45000ms as 45 seconds", () => {
      expect(formatDurationComment(45_000)).toBe("// 45 seconds");
    });
  });
});

describe("isDurationComment", () => {
  function createComment(value: string): TSESTree.Comment {
    return {
      loc: { end: { column: value.length, line: 1 }, start: { column: 0, line: 1 } },
      range: [0, value.length],
      type: AST_TOKEN_TYPES.Line,
      value,
    } as TSESTree.Comment;
  }

  describe("matching patterns", () => {
    it("matches '1 second'", () => {
      expect(isDurationComment(createComment(" 1 second"))).toBe(true);
    });

    it("matches '30 seconds'", () => {
      expect(isDurationComment(createComment(" 30 seconds"))).toBe(true);
    });

    it("matches '1 minute'", () => {
      expect(isDurationComment(createComment(" 1 minute"))).toBe(true);
    });

    it("matches '5 minutes'", () => {
      expect(isDurationComment(createComment(" 5 minutes"))).toBe(true);
    });

    it("is case insensitive", () => {
      expect(isDurationComment(createComment(" 5 MINUTES"))).toBe(true);
      expect(isDurationComment(createComment(" 30 Seconds"))).toBe(true);
    });
  });

  describe("non-matching patterns", () => {
    it("does not match text without numbers", () => {
      expect(isDurationComment(createComment(" some comment"))).toBe(false);
    });

    it("does not match numbers without duration words", () => {
      expect(isDurationComment(createComment(" 123"))).toBe(false);
    });

    it("does not match other time units", () => {
      expect(isDurationComment(createComment(" 5 hours"))).toBe(false);
      expect(isDurationComment(createComment(" 2 days"))).toBe(false);
    });
  });
});
