# Contributing

Thanks for helping improve `eslint-plugin-gadget`.

## Development setup

- Use Node `22` and pnpm `10`.
- Install dependencies with `pnpm install`.
- Run the full validation suite with `pnpm run ci` before opening a pull request.

## Project structure

- `packages/eslint-plugin-gadget`: published package source, tests, and package metadata.
- `.github/workflows`: CI and release automation.

## Pull requests

- Keep changes focused and easy to review.
- Add or update tests when behavior changes.
- Update docs when user-facing behavior, install steps, or rule behavior changes.
- Avoid unrelated refactors in the same pull request.

## Quality bar

Before submitting, make sure these pass locally:

```bash
pnpm run ci
```

## Release notes

User-facing changes should be easy to summarize from the pull request description. Include the motivation, any migration notes, and examples when useful.
