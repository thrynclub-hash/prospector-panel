# Testing Patterns

**Analysis Date:** 2026-07-07

## Test Framework

**Runner:** None. No test runner is installed (`package.json` has no `test` script, no Jest/Vitest/Playwright dependency).

**Assertion Library:** N/A.

**Run Commands:** N/A — there is nothing to run.

## Test File Organization

**Location:** No test files exist anywhere in the repository (`*.test.ts`, `*.spec.ts`, `__tests__/`, `tests/`, `e2e/` — none present).

## Test Structure

N/A — no existing pattern to follow.

## Mocking

N/A.

## Fixtures and Factories

N/A.

## Coverage

**Requirements:** None enforced. No CI pipeline exists to enforce anything.

## Test Types

**Unit Tests:** None.

**Integration Tests:** None. The only verification performed so far in this project's history has been manual: running `npm run build` locally to confirm the app compiles (used to catch the Resend module-scope-instantiation build crash).

**E2E Tests:** None.

## Common Patterns

N/A.

## Recommendation for New Work

Given the app is about to grow real product logic (external API calls to Google Places, AI-generated site content, webhook handling), and there is currently **zero** safety net:

- The highest-leverage first addition would be a test runner (Vitest fits a Next.js/TypeScript stack with minimal config) plus route-handler-level tests for the money-path logic that already exists and has already broken once in production (Kiwify webhook, magic-link issuance) — this is genuine regression risk, not speculative.
- New external integrations (Google Places, whatever service ends up doing the site "redesign" generation) should get at least a mocked-request test given they involve paid APIs and are easy to accidentally call for real during development.

This is a recommendation, not an existing convention — there is no established pattern to match yet.

---

*Testing analysis: 2026-07-07*
*Update when test patterns change*
