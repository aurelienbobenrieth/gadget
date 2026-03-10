# @aurelienbbn/gadget

[![CI](https://github.com/aurelienbobenrieth/gadget/actions/workflows/ci.yml/badge.svg)](https://github.com/aurelienbobenrieth/gadget/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Community tools for the [Gadget](https://gadget.dev) ecosystem. This monorepo ships packages that catch mistakes, enforce conventions, and improve the developer experience for Gadget applications.

> These are **community packages**, not published or endorsed by Gadget. They complement Gadget's own [framework linter](https://docs.gadget.dev/guides/development-tools/framework-linter) with additional static checks.

## Packages

| Package                                                              | Version                                                                                                                                       | Description                             |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| [`@aurelienbbn/eslint-plugin-gadget`](packages/eslint-plugin-gadget) | [![npm](https://img.shields.io/npm/v/@aurelienbbn/eslint-plugin-gadget.svg)](https://www.npmjs.com/package/@aurelienbbn/eslint-plugin-gadget) | 16 ESLint rules for Gadget action files |

## Quick start

```bash
pnpm add -D @aurelienbbn/eslint-plugin-gadget eslint
```

```js
// eslint.config.js
import gadget from "@aurelienbbn/eslint-plugin-gadget";

export default [gadget.configs.recommended];
```

## Documentation

Full documentation is available at **[gadget.aurelienbbn.com](https://gadget.aurelienbbn.com)**, including rule reference pages, configuration guides, and code examples.

## Contributing

Pull requests are not accepted at this time. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to participate.

- [Open an issue](https://github.com/aurelienbobenrieth/gadget/issues) to report bugs or request rules.
- [Start a discussion](https://github.com/aurelienbobenrieth/gadget/discussions) for broader ideas or questions.

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
