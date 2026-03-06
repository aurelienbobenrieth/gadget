# gadget

`gadget` is the open-source home of `@aurelienbbn/eslint-plugin-gadget`, an ESLint plugin for Gadget action files.

The repository is intentionally small for the first public release: one published package, one CI pipeline, and a release flow built around npm publishes with provenance from Git tags.

## Package

- npm: `@aurelienbbn/eslint-plugin-gadget`
- Package docs: `packages/eslint-plugin-gadget/README.md`
- License: MIT

## Repository layout

```text
.
|- packages/
|  \- eslint-plugin-gadget/
|- .github/workflows/
|- CONTRIBUTING.md
|- SECURITY.md
\- README.md
```

## Local development

Prerequisites:

- Node `22`
- pnpm `10`

```bash
pnpm install
pnpm run ci
```

Useful commands:

```bash
pnpm run build
pnpm run test
pnpm run cq:check
pnpm run format:fix
```

## Release process

- Releases are manual and tag-driven.
- Nothing is published on branch pushes.
- Publishing only happens when a `v*.*.*` tag points at a commit already on `main`.
- The release workflow runs the full validation suite before publishing to npm with provenance.

Example:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Contributing

Start with `CONTRIBUTING.md` for setup, scope, and quality expectations.

## Security

Please report vulnerabilities privately as described in `SECURITY.md`.
