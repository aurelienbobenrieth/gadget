# eslint-plugin-gadget

`@aurelienbbn/eslint-plugin-gadget` provides ESLint rules for [Gadget](https://gadget.dev) action files. It catches invalid options, params, timeout configuration, and runtime footguns before they reach production.

## Requirements

- Node `>=18.18`
- ESLint `>=9`
- Flat config (`eslint.config.js`)

## Install

```bash
pnpm add -D @aurelienbbn/eslint-plugin-gadget eslint
```

## Setup

```js
import gadget from "@aurelienbbn/eslint-plugin-gadget";

export default [gadget.configs.recommended];

// Or use gadget.configs.strict for all rules at error level.
```

## How the plugin scopes rules

- Action-specific rules only activate on Gadget action files matching `**/api/actions/**/*.{js,ts}` and `**/api/models/**/actions/**/*.{js,ts}`.
- The two enqueue rules apply globally because they inspect `api.enqueue(...)` usage directly.
- `export const options = { ... }` is linted with or without an `ActionOptions` type annotation.
- The timeout option name is `timeoutMS` with a capital `MS`, matching Gadget's action options API.

## Configs

- `gadget.configs.recommended`: practical defaults with a mix of `warn` and `error` severities.
- `gadget.configs.strict`: every exported rule at `error`.

## Rule overview

### Options validation

| Rule                                             | Description                                                                                                                         | Fixable |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `action-no-invalid-options`                      | Options must be JSON-serializable literals. Catches numeric separators, expressions, template literals, computed keys, and spreads. | yes     |
| `action-no-invalid-timeout-ms`                   | `timeoutMS` must not exceed `900000` ms (15 minutes).                                                                               | yes     |
| `action-require-timeout-ms-comment`              | `timeoutMS` must have a trailing `// N seconds` or `// N minutes` comment.                                                          | yes     |
| `action-require-explicit-return-type`            | `returnType` must be explicitly set in options. Defaults differ between model and global actions.                                   | yes     |
| `global-action-no-action-type`                   | `actionType` is not valid in global actions.                                                                                        | yes     |
| `model-action-invalid-action-type`               | Model action `actionType` must be one of `create`, `update`, `delete`, or `custom`.                                                 | no      |
| `model-action-no-invalid-trigger`                | Model actions cannot use `scheduler` triggers.                                                                                      | yes     |
| `model-action-no-transactional-timeout-mismatch` | `timeoutMS > 5000` on a transactional model action has no effect because the run is killed at 5 seconds.                            | no      |

### Params validation

| Rule                       | Description                                                                                                                                                        | Fixable |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `action-no-invalid-params` | Params must use supported types (`string`, `number`, `integer`, `boolean`, `array`, `object`). Object params may also use `properties` and `additionalProperties`. | no      |

### Runtime safety

| Rule                                      | Description                                                                                                      | Fixable |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------- |
| `action-no-empty-on-success`              | Empty `onSuccess` exports can be removed.                                                                        | yes     |
| `action-no-return-value-in-on-success`    | `onSuccess` cannot return a value because Gadget ignores it.                                                     | yes     |
| `action-no-await-handle-result-in-action` | `await handle.result()` inside `run` risks transaction timeouts; inside `onSuccess` it bills the full wait time. | no      |
| `action-require-run-with-on-success`      | `onSuccess` requires `run` to also be exported.                                                                  | no      |
| `action-require-action-run-type`          | `run` and `onSuccess` must use `ActionRun` and `ActionOnSuccess` type annotations.                               | yes     |

### Enqueue safety

| Rule                                         | Description                                                                 | Fixable |
| -------------------------------------------- | --------------------------------------------------------------------------- | ------- |
| `action-no-enqueue-max-concurrency-exceeded` | `maxConcurrency` in `api.enqueue` cannot exceed `100`.                      | no      |
| `action-no-implicit-enqueue-retries`         | `api.enqueue` must set `retries` explicitly because Gadget defaults to `6`. | no      |

## Example

```ts
import type { ActionOptions } from "gadget-server";

export const params = {
  count: { type: "integer" },
  name: { type: "string" },
};

export const options: ActionOptions = {
  returnType: true,
  timeoutMS: 120000, // 2 minutes
};
```

## Rule notes

### `action-no-invalid-options`

Rejects non-literal values in exported `options`, including computed keys, spreads, shorthand properties, expressions, and template literals with runtime interpolation.

### `action-no-invalid-timeout-ms`

Clamps `timeoutMS` to Gadget's 15-minute maximum.

### `action-require-timeout-ms-comment`

Requires an inline duration comment on `timeoutMS` so long-running actions stay readable in code review.

### `action-require-explicit-return-type`

Requires `returnType` to be set explicitly because Gadget defaults differ between model and global actions.

### `global-action-no-action-type`

Removes `actionType` from global actions where the property has no meaning.

### `model-action-invalid-action-type`

Ensures model actions only use supported action types.

### `model-action-no-invalid-trigger`

Prevents unsupported `scheduler` triggers on model actions.

### `model-action-no-transactional-timeout-mismatch`

Warns when `timeoutMS` suggests a longer runtime than Gadget will allow for transactional model actions.

### `action-no-invalid-params`

Validates exported `params` so they stay within the subset of schema features supported by Gadget. Object params may use nested `properties` plus `additionalProperties`.

### `action-no-empty-on-success`

Removes empty `onSuccess` handlers that add noise but no behavior.

### `action-no-return-value-in-on-success`

Prevents misleading return values from `onSuccess` because Gadget ignores them.

### `action-no-await-handle-result-in-action`

Flags `await handle.result()` in action code when it can create transaction or billing surprises.

### `action-require-run-with-on-success`

Prevents exporting `onSuccess` without the matching `run` handler.

### `action-require-action-run-type`

Requires the canonical Gadget handler types for `run` and `onSuccess` exports.

### `action-no-enqueue-max-concurrency-exceeded`

Prevents `api.enqueue(...)` calls from setting `maxConcurrency` above Gadget's limit.

### `action-no-implicit-enqueue-retries`

Requires `api.enqueue(...)` to set `retries` explicitly instead of inheriting Gadget's default.

## Overriding rules

```js
import gadget from "@aurelienbbn/eslint-plugin-gadget";

export default [
  gadget.configs.recommended,
  {
    rules: {
      "gadget/action-require-timeout-ms-comment": "off",
    },
  },
];
```

## Local package testing

### `pnpm pack`

```bash
pnpm run build
cd packages/eslint-plugin-gadget
pnpm pack
```

Then install the generated tarball into a fresh project and verify both a valid and invalid action file.

### `pnpm link`

```bash
pnpm run build
cd packages/eslint-plugin-gadget
pnpm link --global

# in your project
pnpm link --global @aurelienbbn/eslint-plugin-gadget
```

Re-run `pnpm run build` after local changes.

## License

MIT
