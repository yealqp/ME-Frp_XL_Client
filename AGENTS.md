# AGENTS.md

## Purpose
This file is for agentic coding tools working in this repository.
Use it as the repo-local guide before making changes.

## Stack Summary
- Frontend: Vue 3, TypeScript, Vite, Pinia, Vue Router, Naive UI.
- Desktop shell: Tauri 2.
- Backend: Rust in `src-tauri/`.
- Package manager: `pnpm`.
- Test runner: Vitest with `happy-dom`.

## Repo-Specific Rules
- No repo-local Cursor rules were found in `.cursor/rules/`.
- No `.cursorrules` file was found.
- No Copilot instructions file was found at `.github/copilot-instructions.md`.
- Prefer `pnpm` commands over `npm` in this repo.
- Do not trust README commands blindly; verify against `package.json`, `vitest.config.ts`, and `src-tauri/tauri.conf.json`.
- Keep edits surgical; do not reformat unrelated files.

## Important Paths
- `src/`: Vue frontend source.
- `src/components/`: route components and shared UI.
- `src/composables/`: reusable Composition API logic.
- `src/stores/`: Pinia setup stores.
- `src/utils/`: frontend utilities.
- `src/types/`: shared TypeScript types.
- `src-tauri/src/lib.rs`: Tauri command registration and app setup.
- `src-tauri/src/api/`: backend HTTP API wrappers.
- `src-tauri/src/config/`: YAML config load/save/migration.
- `src-tauri/src/tunnel/`: process/config handling for FRP tunnels.

## Build And Dev Commands
- Install deps: `pnpm install`
- Frontend dev: `pnpm dev`
- Tauri dev: `pnpm tauri dev`
- Frontend build: `pnpm build`
- Frontend preview: `pnpm preview`
- Tauri production build: `pnpm tauri build`

## Validation / Lint Equivalents
There is no working `lint` script in `package.json`, and no committed ESLint or Prettier config.
Use these commands as the real validation surface:

- Frontend typecheck + build: `pnpm build`
- Frontend typecheck only: `pnpm exec vue-tsc --noEmit`
- Rust check: `cargo check --manifest-path src-tauri/Cargo.toml`
- Rust build: `cargo build --manifest-path src-tauri/Cargo.toml`

If you report that "lint passed", explicitly say what you actually ran.

## Test Commands
- Run all frontend tests: `pnpm exec vitest`
- Run frontend tests once: `pnpm exec vitest run`
- Run coverage: `pnpm exec vitest run --coverage`
- Run one frontend file: `pnpm exec vitest run path/to/file.test.ts`
- Run one frontend test by name: `pnpm exec vitest run path/to/file.test.ts -t "case name"`
- Run all Rust tests: `cargo test --manifest-path src-tauri/Cargo.toml`
- Run one Rust test exactly: `cargo test test_name --manifest-path src-tauri/Cargo.toml -- --exact`
- Run Rust tests by substring: `cargo test token --manifest-path src-tauri/Cargo.toml`

Current repo state:
- `vitest.config.ts` exists and uses `happy-dom`.
- No committed frontend `*.test.*` / `*.spec.*` files were found.
- No Rust `#[test]` or `#[tokio::test]` cases were found.
- If you add tests, run the narrowest relevant command first and mention it in the final report.

## Frontend Architecture Notes
- The app uses Vue 3 Composition API and favors `<script setup lang="ts">`.
- State is organized around Pinia setup stores, not Options API stores.
- Shared helpers already exist in `src/utils/` and `src/composables/`; reuse them before adding new abstractions.
- Route-level components often act as orchestration surfaces; avoid stuffing repeated business logic into them.

## Frontend Code Style
- Prefer `<script setup lang="ts">` for Vue components.
- Use `@/` imports for cross-folder code under `src/`.
- Use relative imports only when they are shorter and clearer.
- Use `import type` for type-only imports.
- Use `storeToRefs()` when destructuring reactive state/getters from stores.
- Prefer `useTemplateRef()` for template refs in Vue 3.5+.
- Extract repeated async flows into `src/composables/` or `src/utils/`.
- Reuse existing helpers such as `extractErrorMessage`, `handleApiError`, and shared config utilities.

## Formatting Conventions
- The repo is not fully uniform; newer TS/Vue files lean toward double quotes and semicolons.
- Match the style of the file you are editing instead of reformatting whole files.
- In new TS/Vue files, prefer double quotes, semicolons, and minimal comments.
- Avoid formatting-only diffs unless the task is explicitly formatting.

## Naming Conventions
- Vue components: PascalCase file names like `UserCenter.vue`.
- Composables: `useXxx.ts`.
- Stores: concise domain names like `auth.ts`, `theme.ts`, `tunnel.ts`.
- TS interfaces/types: PascalCase.
- Variables/functions: camelCase.
- Constants: UPPER_SNAKE_CASE only for true constants.
- Route paths: kebab-case, e.g. `/create-tunnel`.
- Rust modules/functions: snake_case.
- Rust structs/enums: PascalCase.

## Types And Data Modeling
- Prefer explicit interfaces/types for API payloads and config structures.
- Reuse shared types from `src/types/` instead of inline `any`.
- Keep `unknown` at boundaries and narrow it deliberately.
- Keep TypeScript config names aligned with Rust `serde(rename = "...")` output.
- When frontend data mirrors Rust models, keep camelCase on the TS side and honor the existing serialized contract.

## Import Ordering
Use this general order unless the surrounding file strongly suggests otherwise:

1. Vue / platform imports.
2. Third-party packages.
3. `@/` alias imports.
4. Relative imports.
5. Type-only imports alongside their source using `import type`.

Do not churn large import blocks unless you are already touching them.

## Error Handling
- Fail with actionable messages.
- In frontend code, prefer `extractErrorMessage` / `handleApiError` where applicable.
- Always clear transient loading UI in `finally` or equivalent cleanup.
- Keep user-facing text concise; preserve existing Chinese copy unless the task requires changing UX wording.
- Log errors with context, but avoid noisy duplicate logs.
- In Tauri commands, prefer `Result<T, String>` and attach context with `map_err`.
- Avoid `unwrap()` / `expect()` in request or command paths unless failure is truly unrecoverable.

## Tauri / Rust Guidelines
- Keep Tauri commands in `src-tauri/src/lib.rs` thin; push real logic into modules.
- Put HTTP API logic in `src-tauri/src/api/`.
- Put config persistence in `src-tauri/src/config/`.
- Put long-running FRP process management in `src-tauri/src/tunnel/`.
- Register every new frontend/backend bridge in `generate_handler!` and update the caller in the same change.
- Be careful with command naming: this repo has both older and newer naming patterns, so verify the existing call sites before renaming anything.
- Preserve frontend-facing field names with `serde(rename = "...")` when necessary.

## UI And Styling Guidelines
- Use scoped styles in SFCs unless a rule is intentionally global.
- Prefer existing CSS variables and theme helpers over hardcoded colors.
- Reuse Naive UI components before creating custom controls.
- Keep theme-aware behavior compatible with `themeStore` and CSS variable application.
- Avoid broad visual rewrites unless explicitly requested.

## Testing And Change Scope
- Validate the smallest relevant surface first, then broaden if needed.
- If you touch only frontend TS/Vue, run at least `pnpm exec vue-tsc --noEmit` or `pnpm build`.
- If you touch Rust, run `cargo check --manifest-path src-tauri/Cargo.toml`.
- If you add tests, run the single file or single test case before running the wider suite.
- Do not silently fix unrelated files just because you noticed drift.

## Final Reporting Expectations
- Mention exactly which commands you ran.
- If a documented command does not exist, say so explicitly.
- Reference changed files by path.
- Call out follow-up risk, especially around Tauri command naming, config serialization, and frontend/backend contract changes.
