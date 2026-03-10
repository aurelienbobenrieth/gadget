import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const GENERATED_RULES_DIRNAME = "rules";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const packageRoot = path.join(repoRoot, "packages", "eslint-plugin-gadget");
const packageDistEntry = path.join(packageRoot, "dist", "index.js");
const docsReferenceRoot = path.join(repoRoot, "docs", "reference");
const docsRulesRoot = path.join(docsReferenceRoot, GENERATED_RULES_DIRNAME);

const ruleGroups = [
  {
    heading: "Options and params",
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
    rules: ["action-no-enqueue-max-concurrency-exceeded", "action-no-implicit-enqueue-retries"],
  },
];

await mkdir(docsReferenceRoot, { recursive: true });
await mkdir(docsRulesRoot, { recursive: true });

const { default: plugin } = await import(pathToFileURL(packageDistEntry).href);

const ruleNames = Object.keys(plugin.rules).sort();
const ruleDocs = await Promise.all(ruleNames.map((ruleName) => buildRuleDoc(ruleName, plugin)));
const ruleDocMap = new Map(ruleDocs.map((ruleDoc) => [ruleDoc.name, ruleDoc]));

await clearGeneratedRulePages();
await writeFile(path.join(docsReferenceRoot, "configurations.mdx"), renderConfigurationsPage(ruleDocs));
await writeFile(path.join(docsRulesRoot, "index.mdx"), renderRuleIndexPage(ruleDocMap));

for (const ruleDoc of ruleDocs) {
  await writeFile(path.join(docsRulesRoot, `${ruleDoc.name}.mdx`), renderRulePage(ruleDoc));
}

async function buildRuleDoc(ruleName, pluginObject) {
  const rule = pluginObject.rules[ruleName];
  const testExamples = await readRuleExamples(ruleName);

  return {
    description: rule.meta.docs?.description ?? "",
    fixable: rule.meta.fixable === "code",
    invalidExample: testExamples.invalidExample,
    invalidOutput: testExamples.invalidOutput,
    messages: Object.entries(rule.meta.messages ?? {}),
    name: ruleName,
    recommended: readSeverity(pluginObject.configs.recommended.rules, ruleName),
    scope: readScope(ruleName),
    strict: readSeverity(pluginObject.configs.strict.rules, ruleName),
    type: rule.meta.type,
    validExample: testExamples.validExample,
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
  if (ruleName.includes("enqueue")) return "Any file containing api.enqueue(...)";
  return "Gadget action files";
}

async function readRuleExamples(ruleName) {
  const testFilePath = path.join(packageRoot, "src", "rules", ruleName, "rule.test.ts");
  const sourceText = await readFile(testFilePath, "utf8");
  const sourceFile = ts.createSourceFile(testFilePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const examples = { invalidExample: "", invalidOutput: "", validExample: "" };

  visit(sourceFile);
  return examples;

  function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const propertyName = readPropertyName(node.name);

      if (propertyName === "invalid" && !examples.invalidExample && ts.isArrayLiteralExpression(node.initializer)) {
        const firstCase = node.initializer.elements[0];
        if (firstCase && ts.isObjectLiteralExpression(firstCase)) {
          examples.invalidExample = readStringProperty(firstCase, "code");
          examples.invalidOutput = readStringProperty(firstCase, "output");
        }
      }

      if (propertyName === "valid" && !examples.validExample && ts.isArrayLiteralExpression(node.initializer)) {
        const firstCase = node.initializer.elements[0];
        if (firstCase && ts.isObjectLiteralExpression(firstCase)) {
          examples.validExample = readStringProperty(firstCase, "code");
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

function renderConfigurationsPage(ruleDocs) {
  const lines = [
    "---",
    'title: "Configurations"',
    'description: "Generated severity matrix for the recommended and strict Gadget ESLint presets."',
    'keywords: ["eslint", "gadget", "recommended", "strict"]',
    "---",
    "",
    "This page is generated from the exported plugin configs. Run `pnpm run docs:generate` after changing a preset.",
    "",
    "| Rule | Recommended | Strict |",
    "| --- | --- | --- |",
    ...ruleDocs.map(
      (ruleDoc) =>
        `| [\`${ruleDoc.name}\`](/reference/rules/${ruleDoc.name}) | \`${ruleDoc.recommended}\` | \`${ruleDoc.strict}\` |`,
    ),
  ];

  return `${lines.join("\n")}\n`;
}

function renderRuleIndexPage(ruleDocMap) {
  const lines = [
    "---",
    'title: "Rules"',
    'description: "Generated rule reference for the Gadget ESLint plugin."',
    'keywords: ["eslint", "gadget", "rules", "reference"]',
    "---",
    "",
    "This page is generated from rule metadata, exported configs, and the first valid and invalid test cases for each rule.",
  ];

  for (const group of ruleGroups) {
    lines.push(
      "",
      `## ${group.heading}`,
      "",
      "| Rule | Recommended | Strict | Type | Fixable |",
      "| --- | --- | --- | --- | --- |",
    );

    for (const ruleName of group.rules) {
      const ruleDoc = ruleDocMap.get(ruleName);
      if (!ruleDoc) continue;

      lines.push(
        `| [\`${ruleDoc.name}\`](/reference/rules/${ruleDoc.name}) | \`${ruleDoc.recommended}\` | \`${ruleDoc.strict}\` | \`${ruleDoc.type}\` | ${ruleDoc.fixable ? "yes" : "no"} |`,
      );
    }
  }

  return `${lines.join("\n")}\n`;
}

function renderRulePage(ruleDoc) {
  const lines = [
    "---",
    `title: "${ruleDoc.name}"`,
    `description: "${escapeFrontmatter(ruleDoc.description)}"`,
    `keywords: ["eslint", "gadget", "${ruleDoc.name}"]`,
    "---",
    "",
    "This page is generated from the rule metadata and tests.",
    "",
    `- Scope: ${ruleDoc.scope}`,
    `- Type: \`${ruleDoc.type}\``,
    `- Fixable: ${ruleDoc.fixable ? "yes" : "no"}`,
    `- Recommended: \`${ruleDoc.recommended}\``,
    `- Strict: \`${ruleDoc.strict}\``,
    "",
    "## Description",
    "",
    ruleDoc.description,
    "",
    "## Reported messages",
    "",
  ];

  for (const [messageId, message] of ruleDoc.messages) {
    lines.push(`- \`${messageId}\`: ${message}`);
  }

  if (ruleDoc.invalidExample) {
    lines.push("", "## Invalid example", "", "```ts", ruleDoc.invalidExample, "```");
  }

  if (ruleDoc.invalidOutput) {
    lines.push("", "## Auto-fix output", "", "```ts", ruleDoc.invalidOutput, "```");
  }

  if (ruleDoc.validExample) {
    lines.push("", "## Valid example", "", "```ts", ruleDoc.validExample, "```");
  }

  return `${lines.join("\n")}\n`;
}

function escapeFrontmatter(value) {
  return value.replace(/"/g, '\\"');
}
