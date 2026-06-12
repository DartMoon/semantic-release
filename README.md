# semantic-release

A Next.js project with automated versioning and releases powered by **commitlint + semantic-release**. Versions and the changelog are generated from commit history — so the commit message format is critical.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run commit` | Interactive commit wizard (`@commitlint/prompt-cli`) |

---

## Release Pipeline (how it works)

```
  git commit ──▶  husky/commit-msg ──▶  commitlint  ──▶  push to main
                  (local, pre-commit)      ✅ format         │
                                                             ▼
                                            GitHub Actions: Release
                                                             │
                                                             ▼
                                      semantic-release reads commits
                                       since the last tag
                                                             │
                                                             ▼
                              version bump  →  CHANGELOG.md  →  git tag
                                                             │
                                                             ▼
                                         publish to npm + GitHub Release
```

Two pieces of the same system:

- **commitlint** (`commitlint.config.mjs`) — a linter for commit messages, triggered by the husky `commit-msg` hook. Blocks any commit that doesn't match the format.
- **semantic-release** — runs in CI on pushes to `main`: parses commits, computes the next SemVer version, generates the changelog, creates a git tag, and publishes a release.

If commits don't follow the convention, `semantic-release` will skip the release (nothing is published). That's why commitlint matters — it's the entry point of this pipeline.

---

## Commit Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Example:

```
feat(ui): add dark mode toggle
```

With a breaking change:

```
feat(ui)!: drop legacy ThemeProvider

BREAKING CHANGE: <ThemeProvider/> removed, use <AppTheme/> instead
```

A **space after the colon is mandatory**. Without it the parser can't split the header and commitlint will complain that `type`/`scope`/`subject` are empty.

### Allowed `type` values (from our `commitlint.config.mjs`)

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace — no logic changes |
| `refactor` | Refactor (neither a bug fix nor a feature) |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Other changes that don't touch src/tests |
| `build` | Build system or dependencies |
| `ci` | CI configuration |
| `revert` | Revert a previous commit |

### Allowed `scope` values

`test`, `ui`, `storybook`. To change the list, edit `commitlint.config.mjs:7`.

Scope is **required** (`scope-empty: never`). A bare `feat: ...` will not pass.

### How to commit

Two options:

```bash
# 1) Regular commit
git commit -m "feat(ui): add settings page"

# 2) Interactive wizard — prompts for type/scope/subject/body
npm run commit
```

If commitlint complains, fix the message and try again. To check a message manually before pushing:

```bash
echo "feat(ui): test message" | npx commitlint
```

---

## Versioning (which message yields which version)

`semantic-release` looks at every commit since the last tag and picks the highest bump:

| Bump | Trigger | Example |
|---|---|---|
| **MAJOR** `1.2.3 → 2.0.0` | `!` after type/scope **or** `BREAKING CHANGE:` in the footer | `feat(ui)!: redesign auth flow` |
| **MINOR** `1.2.3 → 1.3.0` | `feat` | `feat(ui): add settings page` |
| **PATCH** `1.2.3 → 1.2.4` | `fix`, `perf` | `fix(ui): correct button alignment` |
| **No release** | `docs`, `style`, `chore`, `refactor`, `test`, `build`, `ci`, `revert` | `chore(ui): bump tailwind` |

> ⚠️ `!` or `BREAKING CHANGE:` triggers a MAJOR on **any** type, not just `feat`. The type sets the default; the breaking marker overrides it.

### Concrete examples

```text
feat(ui): add dark mode                       → MINOR  (1.0.0 → 1.1.0)
fix(ui): fix overflow on small screens        → PATCH  (1.0.0 → 1.0.1)
perf(ui): memoize heavy list                  → PATCH
docs(storybook): add usage guide              → no release
chore(test): update vitest snapshot           → no release
refactor(ui)!: drop legacy props API          → MAJOR  (1.0.0 → 2.0.0)

feat(ui): new layout

BREAKING CHANGE: <OldLayout/> removed         → MAJOR
```

If a single batch contains a `fix`, a `feat`, and a breaking change, the release will be **MAJOR** (the highest bump wins).

---

## Release CI

File: `.github/workflows/release.yml`. Trigger: push to `main`.

Steps:

1. `npm ci`
2. `npm run build`
3. `npx semantic-release`

Required repository secrets:

- `GH_TOKEN` — for git tags and GitHub Releases
- `NPM_TOKEN` — for publishing to the npm registry

You don't need to run `semantic-release` locally — that's CI's job.

---

## FAQ / Troubleshooting

**Check whether a message would pass the linter without committing:**

```bash
echo "feat(ui): something" | npx commitlint
```

**Preview what semantic-release would publish without actually releasing:**

```bash
npx semantic-release --dry-run --no-ci
```

**I made a bunch of `chore` commits — why isn't anything being released?**
By default, `chore`/`docs`/`style`/`refactor`/`test`/`build`/`ci` do not trigger a release. That's fine — wait for the next `feat` or `fix`.

**Need to ship a hotfix urgently:**
`fix(scope): description` → patch. Merge to `main`, the release ships automatically.

**Committed with a bad message, how do I rewrite it:**

```bash
git commit --amend          # last commit
git rebase -i HEAD~N        # last N commits
```

Then `git push --force-with-lease` to your branch (never to `main`!).

**Want to add a new `scope`:**
Open `commitlint.config.mjs:7` and add it to the `scope-enum` array.

---

## Config Files

| File | Purpose |
|---|---|
| `commitlint.config.mjs` | Commit linter rules |
| `.husky/commit-msg` | Git hook that runs commitlint |
| `.github/workflows/release.yml` | Release CI pipeline |
| `package.json` | Dependencies + npm scripts |

There's no `semantic-release` config file yet — the defaults are used (branch `main`, plugins auto-detected from the installed `@semantic-release/*` packages). If you need tuning (other branches, custom `releaseRules`, pre-release channels), create `release.config.mjs` or `.releaserc.json` at the repo root.
