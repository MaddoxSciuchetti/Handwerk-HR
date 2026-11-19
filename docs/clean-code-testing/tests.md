# Tests

Before pushing changes ensure that you have. (This is also listed in the pull request [template](../../.github/pull_request_template.md))

1. Written a test for this new feature
2. Ran the test on this feature
3. Ran the coverage for the respective runner to see if the changes you did, did not worsen the coverage of the codebase

## What PR CI runs

GitHub Actions workflow [`.github/workflows/pr-checks.yml`](../../.github/workflows/pr-checks.yml):

| Job | Commands |
| --- | --- |
| Client | `npm run lint:src`, `npm run typecheck`, `npm run test:unit` (in `client/`) |
| Server | `npm run typecheck`, `npx jest --testPathPatterns=test-unit` (in `server/`) |

## Understanding fixtures and types used in /server tests

Fixtures and types are based on the objects provided by Stripe and therefore can be confusing. Refer to their documentation to understand how the sent objects look like. This should clear any confusion to why something got done in the code: [stripe_docs](https://docs.stripe.com/api/checkout/sessions/update)

After making changes run coverage for the codebase to check that your added changes did not lead to a worse coverage. If yes ensure that you refactor so that the coverage is kept where it should be.

## Running tests

### Client (`client/`) — Vitest

Unit tests live under `client/test-unit/`.

| Command | Purpose |
| --- | --- |
| `npm run test:unit` | Run all Vitest unit tests once |
| `npm run test:unit:watch` | Watch mode for unit tests |
| `npm run test:all` | Same as `test:unit` (Vitest unit suite) |
| `npm run test:coverage` | Unit tests with coverage (files reached by the suite) |
| `npm run test:coverage:full` | Coverage including files not imported by tests (`VITEST_COVERAGE_FULL_TREE=1`) |

There is currently no `test:integration` or `test:e2e` npm script on the client. A leftover Playwright spec may still exist under `client/test-e2e/`, but it is not wired into package scripts or PR CI.

### Server (`server/`) — Jest

Jest roots are `server/src`, `server/test-unit`, and `server/test-integration` (see `jest.config.cjs`). Specs are named `*.test.ts`.

| Command | Purpose |
| --- | --- |
| `npm test` | Run the full Jest suite (all roots matching `*.test.ts`) |
| `npm run test:unit` | Jest limited to `test-unit` (same pattern PR CI uses) |
| `npm run coverage:webhook-handler` | Coverage focused on `stripeWebhook.controller.ts` and `CheckoutSessionCompleted` |
| `npm test -- --coverage` | Overall Jest coverage for the run |
| `npm test -- --coverage --collectCoverageFrom='src/**/*.ts' --collectCoverageFrom='!src/**/*.d.ts'` | Coverage across server `src/` including files not imported by tests |
| `npm run test:pdf-visual` | PDF visual checks (needs Poppler / `DOCUMENT_FONT_DIR`) |
| `npm run test:pdf-layout` | PDF layout checks (needs fonts; see root README) |

## Setting up test coverage

Client coverage uses Vitest (`@vitest/coverage-v8`). Server coverage uses Jest.

Note: coverage reports which files/lines are hit by tests. It does not mean every branch is meaningfully asserted.

## Example test coverage

Below is an example of a test coverage result before implementing a refactor and after implementing a refactor. The refactor could only be safely made due to extensive testing before ensuring that the refactor did not change the functionality of the refactored code.

## Before / after coverage screenshots

Example coverage screenshots used during a safe refactor:

- Before: [`before.png`](./before.png)
- After: [`after.png`](./after.png)

## Code analysis tools

This project uses Aikido Security ([docs](https://help.aikido.dev/)).

Aikido analyzes the codebase for security vulnerabilities, severity, and remediation guidance. Use it so changes do not introduce new security issues. Triage, secret/env push detection, and response times are documented under backend security.
