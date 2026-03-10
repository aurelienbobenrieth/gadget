# @aurelienbbn/eslint-plugin-gadget

[![npm version](https://img.shields.io/npm/v/@aurelienbbn/eslint-plugin-gadget.svg)](https://www.npmjs.com/package/@aurelienbbn/eslint-plugin-gadget)
[![npm downloads](https://img.shields.io/npm/dm/@aurelienbbn/eslint-plugin-gadget.svg)](https://www.npmjs.com/package/@aurelienbbn/eslint-plugin-gadget)
[![CI](https://github.com/aurelienbobenrieth/gadget/actions/workflows/ci.yml/badge.svg)](https://github.com/aurelienbobenrieth/gadget/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/aurelienbobenrieth/gadget/blob/main/LICENSE)

16 ESLint rules for [Gadget](https://gadget.dev) action files. Validates options, params, timeout configuration, enqueue calls, and runtime patterns before they reach production.

> This is a **community package**, not published or endorsed by Gadget. It complements Gadget's own [framework linter](https://docs.gadget.dev/guides/development-tools/framework-linter) with additional static checks.

## Install

```bash
pnpm add -D @aurelienbbn/eslint-plugin-gadget eslint
```

Requires Node `>=18.18`, ESLint `>=9`, and flat config (`eslint.config.js`).

## Quick start

```js
// eslint.config.js
import gadget from "@aurelienbbn/eslint-plugin-gadget";

export default [gadget.configs.recommended];
```

Two presets are available:

- **`recommended`** - three critical rules at `error`, the rest at `warn`.
- **`strict`** - every rule at `error`.

## Rules

| Category           | Rules   | What they catch                                                                       |
| ------------------ | ------- | ------------------------------------------------------------------------------------- |
| Options and params | 9 rules | Invalid options values, unsupported param types, timeout limits, missing return types |
| Runtime safety     | 5 rules | Empty handlers, missing type annotations, transaction timeout patterns                |
| Enqueue safety     | 2 rules | Concurrency limits, implicit retry defaults                                           |

8 rules provide auto-fixes.

## Documentation

Full documentation with code examples, severity matrices, and configuration guides:

**[gadget.aurelienbbn.com](https://gadget.aurelienbbn.com)**

- [Installation](https://gadget.aurelienbbn.com/eslint-plugin/getting-started/installation)
- [Quick start](https://gadget.aurelienbbn.com/eslint-plugin/getting-started/configuration)
- [How rules apply](https://gadget.aurelienbbn.com/eslint-plugin/guides/how-rules-apply)
- [Configurations reference](https://gadget.aurelienbbn.com/eslint-plugin/reference/configurations)
- [All rules](https://gadget.aurelienbbn.com/eslint-plugin/reference/rules)

## Contributing

- [Open an issue](https://github.com/aurelienbobenrieth/gadget/issues) to report bugs or request rules.
- [Start a discussion](https://github.com/aurelienbobenrieth/gadget/discussions) for broader ideas.

## License

[MIT](https://github.com/aurelienbobenrieth/gadget/blob/main/LICENSE)
