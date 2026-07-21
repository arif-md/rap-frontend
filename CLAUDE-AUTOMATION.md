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
3. **Claude checks out `development`** (not `main`) as its base branch, branches off it (e.g. `claude/issue-1-...`), implements the change, and opens a **pull request targeting `development`**, linked back to the issue.
4. **A separate CI workflow** (`.github/workflows/build-test.yaml`) automatically runs `npm run build`, `npm run lint`, and `npm run test` against that PR — same as any other PR into `main` or `development` in this repo.
5. **A human reviews the PR** — the diff, the CI result, and whether the implementation actually matches the intent of the issue. `CODEOWNERS` auto-requests the designated reviewer.
6. **If CI fails or the implementation needs changes**, a human comments on the PR (e.g. `@claude fix the failing tests` or `@claude the tab color doesn't match our theme, use var(--primary) instead`). This re-triggers Claude on the same branch/PR.
7. **Once CI is green and a human approves**, the PR is merged into `development` normally. Branch protection on both `main` and `development` enforces that the CI check must pass — see [Branch protection setup](#branch-protection).
8. **`development` is promoted to `main`** on your team's existing release cadence, via a normal human-reviewed PR — this part is unchanged and stays entirely manual.

## Why one shared integration branch

Both human developers and Claude work against the same `development` branch, rather than Claude having its own isolated branch. A separate AI-only branch was considered and rejected: it would create two parallel integration streams that could silently drift and conflict with each other, while the review gate (required PR approval + CI) already provides the same safety whichever branch the PR targets. One shared branch means one merge queue, one place to catch conflicts early, and no redundant promotion step.

## Why the implement → PR → test cycle is set up this way

This mirrors the pattern most teams converge on when using coding agents in CI, for a few concrete reasons:

- **Claude's implementation run and the CI validation run are deliberately separate workflows.** Running a full build/test loop *inside* Claude's own turn budget is slow and turn-expensive, and a single build/lint failure can spiral into repeated retries that exhaust the turn limit before the actual task is even attempted. Keeping CI external means Claude gets a clean, bounded task ("implement this change") and your existing pipeline does what it's already good at (full validation).
- **Nothing merges automatically.** CI passing proves the change doesn't break existing behavior — it does not prove the change is the *correct* or *best* implementation, especially for anything visual/UX-related where "looks right" is a judgment call. A human always reviews and approves before merge.
- **Re-triggering Claude to fix a failure is an explicit human decision**, not an automatic loop. This keeps a person deciding, case by case, whether a CI failure is worth asking Claude to retry, or whether the underlying issue description needs to be rewritten, or whether it's faster for a person to just fix it directly.
- **Branch protection makes the "must pass" requirement structural**, not just a convention — see below.

## Automatic PR creation (bot-authored)

`claude-code-action` deliberately does not open PRs itself — it posts a "Create PR" link that a human must click, by design, so a human always stays in the loop. On a personal/solo-maintainer repo this creates a specific problem: if the repo owner clicks that link, they become the PR author, and GitHub does not allow an author to approve their own PR, which blocks the required-review branch protection rule.

`.github/workflows/auto-create-pr.yaml` solves this by listening for any push to a `claude/**` branch and opening the PR automatically using the GitHub Actions bot identity (`github-actions[bot]`), rather than a human clicking the link. Because the bot — not the repo owner — is the PR author, the owner is a genuinely separate identity and can review and approve the PR normally.

Updated flow:

1. `@claude` comment → Claude implements the change on a `claude/issue-N-...` branch
2. `auto-create-pr.yaml` fires on that push → opens a PR into `development`, authored by `github-actions[bot]`
3. `build-test.yaml` runs CI (build, lint, test) on the PR
4. `CODEOWNERS` auto-requests the repo owner as reviewer
5. The repo owner reviews the diff and CI result, approves, and merges into `development`
6. `development` is promoted to `main` on the team's normal release cadence (manual, unchanged)

This requires **Settings → Actions → General → Workflow permissions → Read and write permissions** to be enabled, since the default `GITHUB_TOKEN` needs write access to open pull requests.

## One branch per issue

Claude names each branch after the GitHub issue number it was triggered from (e.g. `claude/issue-14-20260721-1439`). This means:
- **A new issue** always gets its own new branch.
- **A follow-up `@claude` comment on the same issue** (e.g. asking Claude to fix a failing test or adjust the implementation) reuses that issue's existing branch and PR, pushing new commits to it rather than opening a duplicate.

This is the action's built-in convention — no extra configuration is required to keep issues isolated from one another. It relies on the request being tied to an actual GitHub issue; a PR comment unrelated to any issue does not get this same issue-number-based branch naming.

## Writing good issues for Claude

Vague issues produce vague implementations. Issues that work well:
- Name the exact file or component path (e.g. `src/app/shared/dashboard`)
- Describe current vs. desired behavior concretely
- Include screenshots for anything visual
- List clear acceptance criteria
- Scope to one concern per issue (one component, one bug, one feature) rather than broad, multi-part requests

## Branch protection setup

To make CI a hard requirement rather than a suggestion, both `main` and `development` have protection rules requiring the `build-and-test` status check to pass before merge, at least one approval, and no bypass allowed for admins. See repository **Settings → Branches** for the current configuration.

## Workflow files reference

| File | Purpose | Trigger |
|---|---|---|
| `.github/workflows/claude.yaml` | Implements issues / responds to `@claude` mentions, opens PRs | `issue_comment`, `issues`, `pull_request_review_comment`, `pull_request_review` |
| `.github/workflows/build-test.yaml` | Validates every PR (build, lint, test) | `pull_request` (opened, synchronize, reopened) |
