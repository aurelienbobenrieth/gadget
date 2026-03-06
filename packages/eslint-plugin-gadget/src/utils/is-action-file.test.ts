import { describe, expect, it } from "vitest";

import { isActionFile, isGlobalActionFile, isModelActionFile } from "./is-action-file.js";

describe("isActionFile", () => {
  describe("global action patterns", () => {
    it("matches api/actions/foo.ts", () => {
      expect(isActionFile("api/actions/foo.ts")).toBe(true);
    });

    it("matches api/actions/nested/bar.js", () => {
      expect(isActionFile("api/actions/nested/bar.js")).toBe(true);
    });

    it("matches full path with api/actions", () => {
      expect(isActionFile("/project/api/actions/test.ts")).toBe(true);
    });

    it("matches Windows paths with backslashes", () => {
      expect(isActionFile("C:\\project\\api\\actions\\test.ts")).toBe(true);
    });
  });

  describe("model action patterns", () => {
    it("matches api/models/user/actions/create.ts", () => {
      expect(isActionFile("api/models/user/actions/create.ts")).toBe(true);
    });

    it("matches nested model paths", () => {
      expect(isActionFile("api/models/deep/nested/model/actions/update.js")).toBe(true);
    });
  });

  describe("non-matching patterns", () => {
    it("does not match regular files", () => {
      expect(isActionFile("src/utils/helper.ts")).toBe(false);
    });

    it("does not match models without actions", () => {
      expect(isActionFile("api/models/user/user.ts")).toBe(false);
    });

    it("does not match actions outside api directory", () => {
      expect(isActionFile("src/actions/test.ts")).toBe(false);
    });
  });
});

describe("isModelActionFile", () => {
  it("matches model action files", () => {
    expect(isModelActionFile("api/models/user/actions/create.ts")).toBe(true);
  });

  it("does not match global action files", () => {
    expect(isModelActionFile("api/actions/foo.ts")).toBe(false);
  });

  it("matches Windows paths", () => {
    expect(isModelActionFile("C:\\project\\api\\models\\user\\actions\\create.ts")).toBe(true);
  });
});

describe("isGlobalActionFile", () => {
  it("matches global action files", () => {
    expect(isGlobalActionFile("api/actions/foo.ts")).toBe(true);
  });

  it("does not match model action files", () => {
    // The global pattern **/api/actions/**/*.{js,ts} does not match
    // api/models/user/actions/create.ts because the path contains "models"
    expect(isGlobalActionFile("api/models/user/actions/create.ts")).toBe(false);
  });

  it("matches Windows paths", () => {
    expect(isGlobalActionFile("C:\\project\\api\\actions\\test.ts")).toBe(true);
  });
});
