import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const GENERATED_RULES_DIRNAME = "rules";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const packageRoot = path.join(repoRoot, "packages", "eslint-plugin-gadget");
const packageDistEntry = path.join(packageRoot, "dist", "index.js");
const docsReferenceRoot = path.join(repoRoot, "docs", "eslint-plugin", "reference");
const docsRulesRoot = path.join(docsReferenceRoot, GENERATED_RULES_DIRNAME);

const ruleGroups = [
  {
    heading: "Options and params",
    description: "Validate that `options` and `params` exports contain values Gadget can serialize and process.",
    rules: [
      "action-no-invalid-options",
      "action-no-invalid-params",
      "action-no-invalid-timeout-ms",
      "action-require-explicit-return-type",
      "action-require-timeout-ms-comment",
      "global-action-no-action-type",
      "model-action-invalid-action-type",
      "model-action-no-invalid-trigger",
      "model-action-no-transactional-timeout-mismatch",
    ],
  },
  {
    heading: "Runtime safety",
    description:
      "Prevent empty handlers, missing types, and patterns that cause transaction timeouts or billing surprises.",
    rules: [
      "action-no-await-handle-result-in-action",
      "action-no-empty-on-success",
      "action-no-return-value-in-on-success",
      "action-require-action-run-type",
      "action-require-run-with-on-success",
    ],
  },
  {
    heading: "Enqueue safety",
    description: "Enforce explicit retries and concurrency limits on `api.enqueue()` calls.",
    rules: ["action-no-enqueue-max-concurrency-exceeded", "action-no-implicit-enqueue-retries"],
  },
];

// Gadget docs links per rule. Omit opinionated rules with no matching Gadget page.
const gadgetDocsLinks = {
  "action-no-invalid-options": "https://docs.gadget.dev/guides/actions/code#options-object",
  "action-no-invalid-params": "https://docs.gadget.dev/guides/actions/code#adding-parameters-to-actions",
  "action-no-invalid-timeout-ms": "https://docs.gadget.dev/guides/actions/code#timeoutms",
  "action-require-explicit-return-type": "https://docs.gadget.dev/guides/actions/code#returntype",
  "global-action-no-action-type": "https://docs.gadget.dev/guides/actions/code#actiontype",
  "model-action-invalid-action-type": "https://docs.gadget.dev/guides/actions/code#actiontype",
  "model-action-no-invalid-trigger": "https://docs.gadget.dev/guides/actions#scheduler-trigger",
  "model-action-no-transactional-timeout-mismatch":
    "https://docs.gadget.dev/guides/actions/code#gadgettransaction-callback-params",
  "action-no-await-handle-result-in-action":
    "https://docs.gadget.dev/guides/actions/background-actions#considerations-for-await-handle-result",
  "action-no-return-value-in-on-success": "https://docs.gadget.dev/guides/actions/code#returntype",
  "action-require-run-with-on-success": "https://docs.gadget.dev/guides/actions/code#onsuccess-function",
  "action-no-enqueue-max-concurrency-exceeded":
    "https://docs.gadget.dev/guides/actions/background-actions#background-action-limits",
  "action-no-implicit-enqueue-retries": "https://docs.gadget.dev/guides/actions/background-actions#retrying-on-failure",
};

// Default filenames per scope (used when test constants cannot be resolved)
const defaultFilenames = {
  "Model action files": "api/models/widget/actions/create.ts",
  "Global action files": "api/actions/sendEmail.ts",
  "Gadget action files (global and model)": "api/models/widget/actions/create.ts",
  "All files (any file containing `api.enqueue()` calls)": "api/models/widget/actions/create.ts",
};

// Hand-curated example overrides for rules where automatic test-case selection
// produces inconsistent or misleading Incorrect/Correct pairs. Each override
// specifies code with an inline comment explaining WHY it is invalid or correct.
// Rules not listed here use the best example picked from their test file.
const ruleExampleOverrides = {
  "action-no-await-handle-result-in-action": {
    invalid: {
      code: `export const run = async () => {\n  const handle = await api.enqueue(api.publish, {});\n  // awaiting the result blocks the transaction and causes GGT_TRANSACTION_TIMEOUT\n  await handle.result();\n};`,
    },
    valid: {
      code: `export const run = async () => {\n  // enqueue the background action and move on\n  await api.enqueue(api.publish, {});\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "action-no-empty-on-success": {
    invalid: {
      code: `// empty onSuccess adds overhead without doing anything\nexport const onSuccess: ActionOnSuccess = async () => {};`,
    },
    valid: {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  // onSuccess must contain at least one statement, or be omitted entirely\n  await doSomething(record);\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "action-no-invalid-options": {
    invalid: {
      code: `export const options: ActionOptions = {\n  // numeric separators are not valid JSON\n  timeoutMS: 90_000,\n};`,
    },
    valid: {
      code: `export const options: ActionOptions = {\n  // use plain numeric literals without separators\n  timeoutMS: 90000,\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "action-no-invalid-params": {
    invalid: {
      code: `export const params = {\n  // "date" is not a supported type - use "string", "number", "boolean", or "object"\n  name: { type: "date" },\n};`,
    },
    valid: {
      code: `export const params = {\n  // supported types: "string", "number", "boolean", "object"\n  name: { type: "string" },\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "action-no-invalid-timeout-ms": {
    invalid: {
      code: `export const options: ActionOptions = {\n  // 950000ms exceeds the max of 900000ms (15 minutes)\n  timeoutMS: 950000,\n};`,
    },
    valid: {
      code: `export const options: ActionOptions = {\n  // maximum allowed value is 900000ms (15 minutes)\n  timeoutMS: 900000,\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "action-no-return-value-in-on-success": {
    invalid: {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await notify(record);\n  // return values in onSuccess are silently ignored by Gadget\n  return someVariable;\n};`,
    },
    valid: {
      code: `export const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await notify(record);\n  // no return value - onSuccess results are always discarded\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "action-require-action-run-type": {
    invalid: {
      code: `import { applyParams, save } from "gadget-server";\n// missing ActionRun type annotation\nexport const run = async ({ params, record }) => {\n  await applyParams(record, params);\n  await save(record);\n};`,
    },
    valid: {
      code: `import { applyParams, save } from "gadget-server";\n// ActionRun provides type-safe params and record\nexport const run: ActionRun = async ({ params, record }) => {\n  await applyParams(record, params);\n  await save(record);\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "action-require-explicit-return-type": {
    invalid: {
      code: `export const options: ActionOptions = {\n  // missing returnType - defaults differ between model and global actions\n  timeoutMS: 50000,\n};`,
    },
    valid: {
      code: `export const options: ActionOptions = {\n  timeoutMS: 50000,\n  // set returnType explicitly to avoid confusion between model and global defaults\n  returnType: false,\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "action-require-run-with-on-success": {
    invalid: {
      code: `// onSuccess cannot exist without a run export\nexport const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await doSomething(record);\n};`,
    },
    valid: {
      code: `// run must be defined alongside onSuccess\nexport const run: ActionRun = async ({ params }) => {};\nexport const onSuccess: ActionOnSuccess = async ({ record }) => {\n  await doSomething(record);\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "action-require-timeout-ms-comment": {
    invalid: {
      code: `export const options: ActionOptions = {\n  // missing inline duration comment\n  timeoutMS: 50000,\n};`,
    },
    valid: {
      code: `export const options: ActionOptions = {\n  timeoutMS: 50000, // 50 seconds\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "model-action-invalid-action-type": {
    invalid: {
      code: `export const options: ActionOptions = {\n  // "scheduler" is not valid - must be create, update, delete, or custom\n  actionType: "scheduler",\n};`,
    },
    valid: {
      code: `export const options: ActionOptions = {\n  // valid actionType values: create, update, delete, custom\n  actionType: "custom",\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "action-no-enqueue-max-concurrency-exceeded": {
    invalid: {
      code: `// 101 exceeds Gadget's hard limit of 100\napi.enqueue(api.publish, {}, { queue: { name: "q", maxConcurrency: 101 } })`,
    },
    valid: {
      code: `// maxConcurrency must be 100 or less\napi.enqueue(api.publish, {}, { queue: { name: "q", maxConcurrency: 100 } })`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "action-no-implicit-enqueue-retries": {
    invalid: {
      code: `// missing retries option - Gadget silently defaults to 6 retries\napi.enqueue(api.publish, {})`,
    },
    valid: {
      code: `// always set retries explicitly to avoid unexpected retry behavior\napi.enqueue(api.publish, {}, { retries: 0 })`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "global-action-no-action-type": {
    invalid: {
      code: `export const options: ActionOptions = {\n  // actionType only applies to model actions, not global actions\n  actionType: "create",\n  returnType: true,\n};`,
    },
    valid: {
      code: `export const options: ActionOptions = {\n  // global actions do not support actionType\n  returnType: true,\n};`,
    },
    filename: "api/actions/sendEmail.ts",
  },
  "model-action-no-invalid-trigger": {
    invalid: {
      code: `export const options: ActionOptions = {\n  // scheduler triggers are only valid in global actions\n  triggers: [{ type: "scheduler" }],\n};`,
    },
    valid: {
      code: `export const options: ActionOptions = {\n  // model actions support api, shopify, and other non-scheduler triggers\n  triggers: [{ type: "api" }],\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
  "model-action-no-transactional-timeout-mismatch": {
    invalid: {
      code: `export const options: ActionOptions = {\n  // 30000ms has no effect when transactional is true (max 5000ms)\n  timeoutMS: 30000,\n  transactional: true,\n};`,
    },
    valid: {
      code: `export const options: ActionOptions = {\n  // set transactional: false to use timeouts above 5000ms\n  timeoutMS: 30000,\n  transactional: false,\n};`,
    },
    filename: "api/models/widget/actions/create.ts",
  },
};

await mkdir(docsReferenceRoot, { recursive: true });
await mkdir(docsRulesRoot, { recursive: true });

const { default: plugin } = await import(pathToFileURL(packageDistEntry).href);

const ruleNames = Object.keys(plugin.rules).toSorted();
const ruleDocs = await Promise.all(ruleNames.map((ruleName) => buildRuleDoc(ruleName, plugin)));
const ruleDocsByName = new Map(ruleDocs.map((ruleDoc) => [ruleDoc.name, ruleDoc]));

await clearGeneratedRulePages();
await writeFile(path.join(docsReferenceRoot, "configurations.mdx"), renderConfigurationsPage(ruleDocs));
await writeFile(path.join(docsRulesRoot, "index.mdx"), renderRuleIndexPage(ruleDocsByName));

await Promise.all(
  ruleDocs.map((ruleDoc) => writeFile(path.join(docsRulesRoot, `${ruleDoc.name}.mdx`), renderRulePage(ruleDoc))),
);

async function buildRuleDoc(ruleName, pluginObject) {
  const rule = pluginObject.rules[ruleName];
  const testExamples = await readRuleExamples(ruleName);
  const scope = readScope(ruleName);
  const override = ruleExampleOverrides[ruleName];

  // Resolve filename: prefer override, then extracted from test, then scope default
  const resolvedFilename =
    override?.filename || testExamples.invalidFilename || testExamples.validFilename || defaultFilenames[scope] || "";

  return {
    description: rule.meta.docs?.description ?? "",
    filename: resolvedFilename,
    fixable: rule.meta.fixable === "code",
    invalidExample: override?.invalid?.code ?? testExamples.invalidExample,
    messages: Object.entries(rule.meta.messages ?? {}),
    name: ruleName,
    recommended: readSeverity(pluginObject.configs.recommended.rules, ruleName),
    scope,
    strict: readSeverity(pluginObject.configs.strict.rules, ruleName),
    type: rule.meta.type,
    validExample: override?.valid?.code ?? testExamples.validExample,
  };
}

async function clearGeneratedRulePages() {
  const entries = await readdir(docsRulesRoot, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name !== "index.mdx")
      .map((entry) => rm(path.join(docsRulesRoot, entry.name))),
  );
}

function readSeverity(rules, ruleName) {
  const severity = rules?.[`gadget/${ruleName}`];
  return typeof severity === "string" ? severity : "off";
}

function readScope(ruleName) {
  if (ruleName.startsWith("model-action-")) return "Model action files";
  if (ruleName.startsWith("global-action-")) return "Global action files";
  if (ruleName.includes("enqueue")) return "All files (any file containing `api.enqueue()` calls)";
  return "Gadget action files (global and model)";
}

function scopeIcon(scope) {
  if (scope.startsWith("Model")) return "cube";
  if (scope.startsWith("Global")) return "globe";
  if (scope.startsWith("All")) return "layer-group";
  return "file-code";
}

// Format single-line options/params exports as multi-line for readability
function formatCode(code) {
  if (!code) return "";
  // Already multi-line? leave as-is
  if (code.includes("\n")) return code;
  // Single-line export const options/params with object literal
  const match = code.match(/^(export const (?:options|params)(?::\s*\w+)?\s*=\s*)\{(.+)\};$/);
  if (match) {
    const prefix = match[1];
    const body = match[2].trim();
    const props = splitTopLevelProps(body);
    if (props.length >= 1) {
      const formatted = props.map((p) => `  ${p.trim()},`).join("\n");
      return `${prefix}{\n${formatted}\n};`;
    }
  }
  return code;
}

// Split object properties at top-level commas (not inside nested braces/brackets)
function splitTopLevelProps(body) {
  const props = [];
  let depth = 0;
  let current = "";
  for (const char of body) {
    if (char === "{" || char === "[") depth++;
    else if (char === "}" || char === "]") depth--;
    if (char === "," && depth === 0) {
      props.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) props.push(current);
  return props;
}

// Scoring function: prefer multi-line, realistic examples
// kind = "valid" | "invalid" - adjusts heuristics per role
function scoreExample(code, kind) {
  if (!code) return -Infinity;
  let score = 0;
  const lines = code.split("\n").length;
  score += lines * 10;
  if (lines === 1) score -= 15;
  if (code.includes("returnType")) score += 5;
  if (code.includes("timeoutMS")) score += 5;
  if (code.includes("transactional")) score += 5;
  if (code.includes("triggers")) score += 5;
  if (code.includes("applyParams") || code.includes("save(")) score += 8;
  if (code.includes("{ record }") || code.includes("{ params")) score += 5;
  if (code.includes("import ")) score += 3;

  if (kind === "invalid") {
    // For invalid examples, prefer those with realistic async patterns
    if (code.includes("await ")) score += 3;
  }

  // For valid examples, penalize scope-boundary tests (nested functions wrapping
  // the flagged pattern) - these pass the linter but are misleading as docs
  if (kind === "valid") {
    const nestedFnPatterns = ["=> {", "async (", "function ", ".map(", ".forEach(", ".filter("];
    const fnCount = nestedFnPatterns.reduce((n, pat) => n + (code.includes(pat) ? 1 : 0), 0);
    if (fnCount >= 2) score -= 30;
  }

  return score;
}

// Reward valid examples that differ from the invalid example in a meaningful
// way. Penalize those that still contain the problematic call/expression.
function contrastBonus(validCode, invalidCode) {
  // Extract distinctive statements from the invalid code (lines that are not
  // just export/function boilerplate)
  const invalidLines = invalidCode
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("export ") && !l.startsWith("};") && l !== "};");

  let shared = 0;
  for (const line of invalidLines) {
    if (validCode.includes(line)) shared++;
  }

  // Heavy penalty when valid code contains the same problematic lines
  return shared > 0 ? -shared * 20 : 10;
}

async function readRuleExamples(ruleName) {
  const testFilePath = path.join(packageRoot, "src", "rules", ruleName, "rule.test.ts");
  const sourceText = await readFile(testFilePath, "utf8");
  const sourceFile = ts.createSourceFile(testFilePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const result = {
    invalidExample: "",
    invalidFilename: "",
    validExample: "",
    validFilename: "",
  };

  // First pass: collect top-level const declarations to resolve filename constants
  const constants = new Map();
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement) && statement.declarationList.declarations.length > 0) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          if (ts.isStringLiteral(decl.initializer) || ts.isNoSubstitutionTemplateLiteral(decl.initializer)) {
            constants.set(decl.name.text, decl.initializer.text);
          }
        }
      }
    }
  }

  // Collect ALL test cases
  const invalidCases = [];
  const validCases = [];

  visit(sourceFile);

  // Pick the best invalid case
  let bestInvalid = null;
  let bestInvalidScore = -Infinity;
  for (const ic of invalidCases) {
    const s = scoreExample(ic.code, "invalid");
    if (s > bestInvalidScore) {
      bestInvalidScore = s;
      bestInvalid = ic;
    }
  }
  if (bestInvalid) {
    result.invalidExample = bestInvalid.code;
    result.invalidFilename = bestInvalid.filename;
  }

  // Pick the best valid case, penalizing examples that look too similar to
  // the chosen invalid example (scope-boundary tests rather than real fixes)
  let bestValid = null;
  let bestValidScore = -Infinity;
  for (const vc of validCases) {
    let s = scoreExample(vc.code, "valid");
    if (bestInvalid) {
      s += contrastBonus(vc.code, bestInvalid.code);
    }
    if (s > bestValidScore) {
      bestValidScore = s;
      bestValid = vc;
    }
  }
  if (bestValid) {
    result.validExample = bestValid.code;
    result.validFilename = bestValid.filename;
  }

  return result;

  function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const propertyName = readPropertyName(node.name);

      if (propertyName === "invalid" && ts.isArrayLiteralExpression(node.initializer)) {
        for (const element of node.initializer.elements) {
          if (ts.isObjectLiteralExpression(element)) {
            const code = readStringProperty(element, "code");
            const filename = resolveProperty(element, "filename", constants);
            if (code) invalidCases.push({ code, filename });
          }
        }
      }

      if (propertyName === "valid" && ts.isArrayLiteralExpression(node.initializer)) {
        for (const element of node.initializer.elements) {
          if (ts.isObjectLiteralExpression(element)) {
            const code = readStringProperty(element, "code");
            const filename = resolveProperty(element, "filename", constants);
            if (code) validCases.push({ code, filename });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }
}

function readPropertyName(nameNode) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode)) return nameNode.text;
  return "";
}

// Read a string property value, or resolve an identifier reference via constants map
function resolveProperty(objectLiteral, propertyName, constants) {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    if (readPropertyName(property.name) !== propertyName) continue;
    // Direct string literal (isStringLiteralLike covers NoSubstitutionTemplateLiteral)
    if (ts.isStringLiteralLike(property.initializer)) return property.initializer.text;
    // Identifier reference to a constant
    if (ts.isIdentifier(property.initializer)) {
      return constants.get(property.initializer.text) ?? "";
    }
  }
  return "";
}

function readStringProperty(objectLiteral, propertyName) {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    if (readPropertyName(property.name) !== propertyName) continue;
    if (ts.isStringLiteralLike(property.initializer)) return property.initializer.text;
    if (ts.isNoSubstitutionTemplateLiteral(property.initializer)) return property.initializer.text;
    if (ts.isTemplateExpression(property.initializer)) return property.initializer.getText().slice(1, -1);
  }
  return "";
}

function shortFilename(fullPath) {
  if (!fullPath) return "";
  // Already a short relative path (from overrides)
  if (fullPath.startsWith("api/") || fullPath.startsWith("src/")) return fullPath;
  // Extract from absolute test paths like /project/api/...
  const match = fullPath.match(/\/(api\/.+)$/);
  if (match) return match[1];
  const srcMatch = fullPath.match(/\/(src\/.+)$/);
  if (srcMatch) return srcMatch[1];
  return path.basename(fullPath);
}

// ---------------------------------------------------------------------------
// Page renderers
// ---------------------------------------------------------------------------

function renderConfigurationsPage(allRuleDocs) {
  const lines = [
    "---",
    'title: "Configurations"',
    'description: "Severity matrix for the recommended and strict presets."',
    'keywords: ["eslint", "gadget", "recommended", "strict", "configurations"]',
    "---",
    "",
    "{/* This page is generated. Run pnpm run docs:generate to update. */}",
    "",
    "The plugin ships two presets. Both register the plugin under the `gadget` namespace.",
    "",
    "| Preset | Description |",
    "| --- | --- |",
    "| `recommended` | Three critical rules at `error`, the rest at `warn`. Good default for most projects. |",
    "| `strict` | Every rule at `error`. Use when you want the full set to block CI. |",
    "",
    "## Severity matrix",
    "",
  ];

  for (const group of ruleGroups) {
    lines.push(`### ${group.heading}`, "");
    lines.push("| Rule | Recommended | Strict |");
    lines.push("| --- | --- | --- |");

    for (const ruleName of group.rules) {
      const ruleDoc = allRuleDocs.find((rd) => rd.name === ruleName);
      if (!ruleDoc) continue;

      lines.push(
        `| [\`${ruleDoc.name}\`](/eslint-plugin/reference/rules/${ruleDoc.name}) | ${severityBadgeMdx(ruleDoc.recommended)} | ${severityBadgeMdx(ruleDoc.strict)} |`,
      );
    }

    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function severityBadgeMdx(severity) {
  if (severity === "error") return '<Badge color="red" size="sm">error</Badge>';
  if (severity === "warn") return '<Badge color="orange" size="sm">warn</Badge>';
  return '<Badge color="gray" size="sm">off</Badge>';
}

function fixableBadgeMdx(fixable) {
  if (fixable) return '<Badge color="green" size="sm">true</Badge>';
  return '<Badge color="gray" size="sm">false</Badge>';
}

function renderRuleIndexPage(ruleDocMap) {
  const lines = [
    "---",
    'title: "Rules"',
    'description: "All 16 rules organized by category with severity, type, and fixability."',
    'keywords: ["eslint", "gadget", "rules", "reference"]',
    "---",
    "",
    "{/* This page is generated. Run pnpm run docs:generate to update. */}",
    "",
  ];

  for (const group of ruleGroups) {
    lines.push(`## ${group.heading}`);
    lines.push("");
    lines.push(group.description);
    lines.push("");
    lines.push("<CardGroup cols={1}>");

    for (const ruleName of group.rules) {
      const ruleDoc = ruleDocMap.get(ruleName);
      if (!ruleDoc) continue;

      const badgeParts = [];
      badgeParts.push(severityBadgeMdx(ruleDoc.recommended));
      if (ruleDoc.fixable) badgeParts.push('<Badge color="green" size="sm">fixable</Badge>');

      lines.push(
        `  <Card title="${ruleDoc.name}" icon="${scopeIcon(ruleDoc.scope)}" href="/eslint-plugin/reference/rules/${ruleDoc.name}">`,
      );
      lines.push(`    ${ruleDoc.description} ${badgeParts.join(" ")}`);
      lines.push("  </Card>");
    }

    lines.push("</CardGroup>");
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function renderRulePage(ruleDoc) {
  const gadgetLink = gadgetDocsLinks[ruleDoc.name];
  const filename = shortFilename(ruleDoc.filename);

  const lines = [
    "---",
    `title: "${ruleDoc.name}"`,
    `sidebarTitle: "${ruleDoc.name}"`,
    `description: "${escapeFrontmatter(ruleDoc.description)}"`,
    `keywords: ["eslint", "gadget", "${ruleDoc.name}"]`,
    "---",
    "",
    "{/* This page is generated. Run pnpm run docs:generate to update. */}",
    "",
  ];

  // Metadata table with Badge components
  const scopeLabel = ruleDoc.scope.replace(" (global and model)", "");
  lines.push("| Recommended | Strict | Auto-fixable | Scope |");
  lines.push("| --- | --- | --- | --- |");
  lines.push(
    `| ${severityBadgeMdx(ruleDoc.recommended)} | ${severityBadgeMdx(ruleDoc.strict)} | ${fixableBadgeMdx(ruleDoc.fixable)} | ${scopeLabel} |`,
  );
  lines.push("");

  // Gadget docs link
  if (gadgetLink) {
    lines.push(`<Tip>Related Gadget documentation: [Gadget docs](${gadgetLink})</Tip>`);
    lines.push("");
  }

  // Messages section
  if (ruleDoc.messages.length > 0) {
    if (ruleDoc.messages.length === 1) {
      const [, message] = ruleDoc.messages[0];
      lines.push("**What the linter reports:**", "");
      lines.push(`> ${escapeMdxBraces(message)}`);
    } else {
      lines.push("**What the linter reports:**", "");
      for (const [, message] of ruleDoc.messages) {
        lines.push(`- ${escapeMdxBraces(message)}`);
      }
    }
    lines.push("");
  }

  // Examples section (always Tabs with Incorrect / Correct)
  const invalidCode = formatCode(ruleDoc.invalidExample);
  const validCode = formatCode(ruleDoc.validExample);

  const hasInvalid = Boolean(invalidCode);
  const hasValid = Boolean(validCode);

  if (hasInvalid || hasValid) {
    lines.push("## Examples", "");
  }

  const codeTitle = filename ? ` title="${filename}"` : "";

  if (hasInvalid && hasValid) {
    lines.push("<Tabs>");
    lines.push('  <Tab title="Incorrect">');
    lines.push("");
    lines.push(`\`\`\`ts${codeTitle}`);
    lines.push(invalidCode);
    lines.push("```");
    lines.push("");
    lines.push("  </Tab>");
    lines.push('  <Tab title="Correct">');
    lines.push("");
    lines.push(`\`\`\`ts${codeTitle}`);
    lines.push(validCode);
    lines.push("```");
    lines.push("");
    lines.push("  </Tab>");
    lines.push("</Tabs>");
  } else {
    if (hasInvalid) {
      lines.push("### Incorrect", "");
      lines.push(`\`\`\`ts${codeTitle}`);
      lines.push(invalidCode);
      lines.push("```");
      lines.push("");
    }

    if (hasValid) {
      lines.push("### Correct", "");
      lines.push(`\`\`\`ts${codeTitle}`);
      lines.push(validCode);
      lines.push("```");
      lines.push("");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function escapeFrontmatter(value) {
  return value.replace(/"/g, '\\"');
}

// Escape ESLint message template placeholders ({{ var }}) so MDX does not
// interpret the braces as JSX expressions. Replaces {{ var }} with `var`.
function escapeMdxBraces(text) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, "`$1`");
}
