# Claude Code GitHub Automation

This document explains how the `@claude` issue-to-PR automation works in this repository, and the standard practice this team follows for using it safely.

## 📚 Related documentation
- [Configuration Management Guide](../docs/CONFIGURATION-MANAGEMENT.md)
- [Version Management](VERSION_MANAGEMENT.md)
- [Frontend OIDC Implementation](FRONTEND-OIDC-IMPLEMENTATION.md)

---

## How it works

1. **An issue is created**, describing a bug fix or feature request. See [Writing good issues for Claude](#writing-good-issues-for-claude) below.
2. **A comment mentioning `@claude`** is posted on the issue (e.g. `@claude implement this`). This triggers the `.github/workflows/claude.yaml` workflow.
3. **Claude reads the issue**, locates the relevant code, implements the change, and opens a **pull request** linked back to the issue.
4. **A separate CI workflow** (`.github/workflows/build-test.yaml`) automatically runs `npm run build`, `npm run lint`, and `npm run test` against that PR — same as any other PR in this repo.
5. **A human reviews the PR** — the diff, the CI result, and whether the implementation actually matches the intent of the issue.
6. **If CI fails or the implementation needs changes**, a human comments on the PR (e.g. `@claude fix the failing tests` or `@claude the tab color doesn't match our theme, use var(--primary) instead`). This re-triggers Claude on the same branch/PR.
7. **Once CI is green and a human approves**, the PR is merged normally. Branch protection on `main` enforces that the CI check must pass — see [Branch protection setup](#branch-protection).

## Why the implement → PR → test cycle is set up this way

This mirrors the pattern most teams converge on when using coding agents in CI, for a few concrete reasons:

- **Claude's implementation run and the CI validation run are deliberately separate workflows.** Running a full build/test loop *inside* Claude's own turn budget is slow and turn-expensive, and a single build/lint failure can spiral into repeated retries that exhaust the turn limit before the actual task is even attempted. Keeping CI external means Claude gets a clean, bounded task ("implement this change") and your existing pipeline does what it's already good at (full validation).
- **Nothing merges automatically.** CI passing proves the change doesn't break existing behavior — it does not prove the change is the *correct* or *best* implementation, especially for anything visual/UX-related where "looks right" is a judgment call. A human always reviews and approves before merge.
- **Re-triggering Claude to fix a failure is an explicit human decision**, not an automatic loop. This keeps a person deciding, case by case, whether a CI failure is worth asking Claude to retry, or whether the underlying issue description needs to be rewritten, or whether it's faster for a person to just fix it directly.
- **Branch protection makes the "must pass" requirement structural**, not just a convention — see below.

## Writing good issues for Claude

Vague issues produce vague implementations. Issues that work well:
- Name the exact file or component path (e.g. `src/app/shared/dashboard`)
- Describe current vs. desired behavior concretely
- Include screenshots for anything visual
- List clear acceptance criteria
- Scope to one concern per issue (one component, one bug, one feature) rather than broad, multi-part requests

## Branch protection setup

To make CI a hard requirement rather than a suggestion, `main` has (or should have) a protection rule requiring the `build-and-test` status check to pass before merge, with no bypass allowed for admins. See repository **Settings → Branches** for the current configuration.

## Workflow files reference

| File | Purpose | Trigger |
|---|---|---|
| `.github/workflows/claude.yaml` | Implements issues / responds to `@claude` mentions, opens PRs | `issue_comment`, `issues`, `pull_request_review_comment`, `pull_request_review` |
| `.github/workflows/build-test.yaml` | Validates every PR (build, lint, test) | `pull_request` (opened, synchronize, reopened) |
