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
    description: "Validate that `options` and `params` exports contain values Gadget can serialize and process.",
    icon: "gear",
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
    icon: "shield-check",
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
    icon: "arrow-right-to-bracket",
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
  if (ruleName.includes("enqueue")) return "All files (any file containing `api.enqueue()` calls)";
  return "Gadget action files (global and model)";
}

function scopeIcon(scope) {
  if (scope.startsWith("Model")) return "cube";
  if (scope.startsWith("Global")) return "globe";
  if (scope.startsWith("All")) return "layer-group";
  return "file-code";
}

function severityLabel(severity) {
  if (severity === "error") return "error";
  if (severity === "warn") return "warn";
  return "off";
}

function typeLabel(type) {
  if (type === "problem") return "problem";
  if (type === "suggestion") return "suggestion";
  return type;
}

function groupForRule(ruleName) {
  for (const group of ruleGroups) {
    if (group.rules.includes(ruleName)) return group.heading;
  }
  return "Other";
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
        `| [\`${ruleDoc.name}\`](/reference/rules/${ruleDoc.name}) | \`${ruleDoc.recommended}\` | \`${ruleDoc.strict}\` |`,
      );
    }

    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
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

      const badges = [];
      badges.push(severityLabel(ruleDoc.recommended));
      badges.push(typeLabel(ruleDoc.type));
      if (ruleDoc.fixable) badges.push("fixable");

      lines.push(
        `  <Card title="${ruleDoc.name}" icon="${scopeIcon(ruleDoc.scope)}" href="/reference/rules/${ruleDoc.name}">`,
      );
      lines.push(`    ${ruleDoc.description} ${badges.map((b) => `\`${b}\``).join(" ")}`);
      lines.push("  </Card>");
    }

    lines.push("</CardGroup>");
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function renderRulePage(ruleDoc) {
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
    ruleDoc.description,
    "",
    `| Property | Value |`,
    `| --- | --- |`,
    `| Type | \`${ruleDoc.type}\` |`,
    `| Fixable | ${ruleDoc.fixable ? "Yes (auto-fix available)" : "No"} |`,
    `| Recommended | \`${ruleDoc.recommended}\` |`,
    `| Strict | \`${ruleDoc.strict}\` |`,
    `| Scope | ${ruleDoc.scope} |`,
    `| Category | ${groupForRule(ruleDoc.name)} |`,
    "",
  ];

  // Messages section
  if (ruleDoc.messages.length > 0) {
    lines.push("## Reported messages", "");

    for (const [messageId, message] of ruleDoc.messages) {
      lines.push(`- **\`${messageId}\`**: ${message}`);
    }

    lines.push("");
  }

  // Examples section
  const hasInvalid = Boolean(ruleDoc.invalidExample);
  const hasOutput = Boolean(ruleDoc.invalidOutput);
  const hasValid = Boolean(ruleDoc.validExample);

  if (hasInvalid || hasValid) {
    lines.push("## Examples", "");
  }

  if (hasInvalid && hasOutput) {
    // Show before/after with CodeGroup when there is an auto-fix
    lines.push("<Tabs>");
    lines.push('  <Tab title="Incorrect">');
    lines.push("");
    lines.push("```ts");
    lines.push(ruleDoc.invalidExample);
    lines.push("```");
    lines.push("");
    lines.push("  </Tab>");
    lines.push('  <Tab title="Auto-fix output">');
    lines.push("");
    lines.push("```ts");
    lines.push(ruleDoc.invalidOutput);
    lines.push("```");
    lines.push("");
    lines.push("  </Tab>");

    if (hasValid) {
      lines.push('  <Tab title="Correct">');
      lines.push("");
      lines.push("```ts");
      lines.push(ruleDoc.validExample);
      lines.push("```");
      lines.push("");
      lines.push("  </Tab>");
    }

    lines.push("</Tabs>");
  } else {
    // No auto-fix: show invalid and valid separately
    if (hasInvalid) {
      lines.push("### Incorrect", "");
      lines.push("```ts");
      lines.push(ruleDoc.invalidExample);
      lines.push("```");
      lines.push("");
    }

    if (hasValid) {
      lines.push("### Correct", "");
      lines.push("```ts");
      lines.push(ruleDoc.validExample);
      lines.push("```");
      lines.push("");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function escapeFrontmatter(value) {
  return value.replace(/"/g, '\\"');
}
