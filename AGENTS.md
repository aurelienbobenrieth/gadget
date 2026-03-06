# AGENTS.md

This repository supports agent-assisted contribution. Follow these rules when an agent reads, edits, tests, or documents the project.

## Critical rules

1. Use plain hyphens (`-`) or commas everywhere. The em dash character (U+2014) is banned from all files.
2. Write in affirmative form. State what something does or is, rather than what it is not.
3. Minimize output. Results and decisions only.
4. Code is the living documentation. Comments exist only to explain _why_, document business rules, warn about non-obvious constraints, or mark known limitations. If a comment can be replaced by a better function name, a const extraction, or a function extraction, do that instead. Section dividers (`// ====`, `// ----`) are banned in test files; use `describe()` blocks for structure. In source files under 300 lines, prefer whitespace over dividers.
5. TypeScript strictness is mandatory. `@ts-nocheck`, `@ts-ignore`, `@ts-expect-error`, `as any`, `as unknown as X` (type casting), and the `any` type are all banned. If a type problem seems unsolvable, ask the user before reaching for a suppression. The only exception is auto-generated files (`.generated` directories).
