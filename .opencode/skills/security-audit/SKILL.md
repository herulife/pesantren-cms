---
name: security-audit
description: Use when reviewing code for security vulnerabilities, reliability issues, or code quality. Comprehensive checklists for security, QA, reliability, and code review. Deploy on any agent via the skill system.
---

# Security Audit

## Overview

Four checklists adapted from specialist review agents (security, QA, reliability, code review). Use whichever is relevant to the code being reviewed. Severity ratings enable prioritized triage.

**Core principle:** Every finding cites a checklist item. Every finding has a concrete fix. Every finding has a severity.

## When to Use

- Before deploying code that touches auth, data, APIs, or external systems
- When the verification-loop skill dispatches a security/reliability review
- When @lead routes a security question
- When reviewing third-party dependencies
- Before marking security-sensitive work complete

## Severity Definitions

| Level | Meaning | Action |
|-------|---------|--------|
| **CRITICAL** | Exploitable vulnerability, data loss risk, broken core functionality | Fix now. Blocks release. |
| **HIGH** | Security weakness, significant bug, missing error handling | Fix before deploy. |
| **MEDIUM** | Hardening opportunity, minor UX issue, test gap | Fix when possible. |
| **LOW** | Best practice, style, naming | Fix if convenient. |

## Checklist 1: Security Review

Run when code touches: authentication, authorization, user input, API endpoints, data storage, external services, secrets.

1. **Secrets** — No hardcoded credentials, API keys, tokens, or passwords in source code. Check for accidental commits of `.env` files, connection strings, JWT secrets.
2. **Injection** — All user input is parameterized or sanitized. No string concatenation in SQL queries, no `innerHTML` with user data, no `eval()` on user strings, no shell command injection.
3. **Auth** — Authentication required where needed. Authorization checked at every boundary (route, API, function). No assuming "the frontend already validated."
4. **Crypto** — No custom crypto implementations. Using proper algorithms (bcrypt/argon2 for passwords, AES-256 for encryption, RSA-2048+ for signing). No MD5/SHA1 for security purposes.
5. **Config** — Security headers set (CSP, HSTS, X-Frame-Options). CORS configured properly (not `*` for authenticated endpoints). HTTPS enforced.
6. **Errors** — No stack traces, internal paths, or database details in error responses to clients. Error messages don't leak information useful for attacks.
7. **Dependencies** — No known vulnerable packages. Run `npm audit` / `pip audit` / equivalent. Check for abandoned packages.
8. **Access** — Principle of least privilege applied. Service accounts have minimum permissions. No admin-by-default.

**Quick scan command:** Look for these patterns in the diff:
- `password`, `secret`, `token`, `api_key`, `credential` in strings
- `innerHTML`, `dangerouslySetInnerHTML`, `eval(`
- Raw SQL concatenation
- `Access-Control-Allow-Origin: *` with auth
- Hardcoded URLs with credentials

## Checklist 2: QA Review

Run when: new code exists, tests were written, or coverage needs verification.

1. **Read the code first** — Understand what was built before testing.
2. **Run existing tests** — Confirm nothing is broken. All green before new tests.
3. **Identify gaps** — What's new but untested? What edge cases exist?
4. **Write tests** — Unit tests first, then integration. Target 80%+ coverage on new code.
5. **Run all tests** — Confirm everything passes, old and new.
6. **Check coverage** — Report percentage. Flag files below 50%.

**Test quality checks:**
- Tests test behavior, not implementation
- No test-only methods in production code
- Mocks test isolation, not existence
- Each test has one assertion (or tests one behavior)
- Test names describe the expected behavior
- Edge cases covered: empty input, null/undefined, boundary values
- Error paths tested, not just happy paths

## Checklist 3: Reliability Review

Run when: code touches error handling, retries, data access, external calls, concurrency, or resource management.

1. **Errors** — Every error path handled. No silent catches (`catch {}`). Errors logged with context. No swallowed exceptions.
2. **Edge cases** — Empty inputs, null/undefined values, boundary conditions, extremely large inputs, concurrent access.
3. **Retries** — Exponential backoff with jitter. Maximum attempts defined. Idempotent retry operations. Dead letter or fallback after max retries.
4. **Timeouts** — All external calls have timeouts. No infinite waits. Reasonable defaults (not 30 minutes).
5. **Resources** — Database connections closed. File handles released. Cleanup in `finally` blocks or equivalent. No resource leaks on error paths.
6. **Concurrency** — No race conditions on shared state. Proper locking if needed. Atomic operations where required.
7. **Data** — Transactions where needed. Rollback on failure. No partial writes. Consistent state after errors.
8. **Degradation** — System works (partially) when dependencies fail. Circuit breakers on external calls. Fallback responses, not crashes.

**Quick scan command:** Look for these patterns:
- `catch {}` or `catch (e) {}` — swallowed exceptions
- `setTimeout` without corresponding `clearTimeout` — potential leaks
- New `Promise` without timeout — infinite waits
- Shared mutable state without synchronization — race conditions
- Database operations without transactions — partial writes

## Checklist 4: Code Review

Run on all code changes. Focus on readability, maintainability, and convention adherence.

1. **Naming** — Variables, functions, files have clear, descriptive names. No `data`, `info`, `tmp`, `result` as names.
2. **Size** — Functions < 50 lines. Files < 800 lines. If larger, extract.
3. **Nesting** — No deep nesting (> 4 levels). Use early returns, guard clauses, extraction.
4. **Mutation** — Immutable patterns preferred. No in-place mutation without clarity. No side effects in functions called `get` or `is`.
5. **Hardcoding** — No magic numbers or hardcoded strings. Extract to named constants or config.
6. **Patterns** — Consistent with existing codebase. Don't introduce a new pattern without reason.
7. **Complexity** — No over-engineering. No premature abstraction. Three similar lines before extracting. YAGNI.
8. **Errors** — Errors handled explicitly. No `as any` to suppress. No `// @ts-ignore` without explanation.

**Quick scan command:** Look for these patterns in the diff:
- Functions longer than 50 lines
- Files with > 800 lines
- More than 4 levels of indentation
- Magic numbers (numeric literals that aren't 0, 1, or iteration indices)
- `any` type assertions
- Catch blocks without logging or re-throwing

## Output Format

After running the relevant checklists, report:

```
## [Security|QA|Reliability|Code] Review

**Status:** PASS | FAIL | WARN

### Findings
- [CRITICAL|HIGH|MEDIUM|LOW] file:line — Description and suggested fix

### Verdict
One sentence summary.
```

## Integration with Our Team

This skill is a process, not a seat. Any agent can invoke it:

- `@eng` runs it during code review
- `@ui` runs Checklist 2 (QA) and Checklist 4 (Code Review) on UI code
- `@infra` runs Checklists 1 (Security) and 3 (Reliability) on infrastructure code
- `@lead` dispatches it via verification-loop when needed

The verification-loop skill dispatches this skill on the appropriate agent for the domain.