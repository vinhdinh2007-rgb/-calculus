# CI/CD Pipeline Plan
**Docker Hub Publish via GitHub Actions — Version 6 (Final)**

---

## Summary

This plan implements a Docker-only GitHub Actions pipeline for a Vite application. It replaces the existing GitHub Pages deployment with a registry-based workflow that is deterministic, cache-enabled, fork-PR-safe, and guarded against configuration drift and race conditions.

The pipeline delivers five core capabilities:

- Validates `DOCKERHUB_REPO` format before any expensive step runs.
- Builds and validates the Docker image on pull requests with no registry authentication or push.
- Pushes tagged images to Docker Hub on pushes to `main` or `master`.
- Publishes `latest` only when the pushed branch equals the repository default branch.
- Maintains SHA-pinned actions via Dependabot for ongoing supply-chain hygiene.

---

## Configuration Contract

The workflow depends on exactly two repository-level values.

| Name | Type | Format / Notes |
|---|---|---|
| `DOCKERHUB_REPO` | Variable | `namespace/image` — e.g. `myuser/calc` or `myorg/calc` |
| `DOCKERHUB_TOKEN` | Secret | Docker Hub access token (not password) |

**`DOCKERHUB_USERNAME` is removed.** The workflow derives the Docker Hub username at runtime by extracting the left side of the slash in `DOCKERHUB_REPO`. Storing username separately created silent drift risk when one value was updated without the other.

**`DOCKERHUB_REPO` validation.** The first workflow step validates the value against this regex before any build or login runs:

```
^[a-z0-9]([a-z0-9_-]*[a-z0-9])?\/[a-z0-9]([a-z0-9._-]*[a-z0-9])?$
```

On failure the step emits a human-readable error and exits immediately, surfacing misconfiguration before any compute is wasted.

---

## Planned File Changes

### 1. `.github/workflows/docker-publish.yml`

Replaces the existing `deploy.yml`. Workflow and job-level settings:

| Setting | Value |
|---|---|
| `permissions` | `contents: read` |
| `concurrency group` | `docker-publish-${{ github.ref }}` |
| `cancel-in-progress` | `true` |
| `timeout-minutes` | `20` |
| `runs-on` | `ubuntu-24.04` |

**Triggers:**
- `push` on branches: `main`, `master`
- `pull_request` targeting: `main`, `master`
- `workflow_dispatch` with a boolean input `force_no_cache` (default: `false`)

**Step sequence:**
1. Validate `DOCKERHUB_REPO` format — fails fast with explicit message if invalid
2. `actions/checkout` (SHA-pinned)
3. `docker/setup-buildx-action` (SHA-pinned)
4. `docker/login-action` (SHA-pinned) — skipped on PR events via `if: github.event_name != 'pull_request'`
5. `docker/metadata-action` (SHA-pinned) — generates tags per rules below
6. `docker/build-push-action` (SHA-pinned) — two mutually exclusive steps based on `force_no_cache`

**Cache toggle implementation.**
The `force_no_cache` input is a string (`'true'`/`'false'`) in GitHub Actions, not a native boolean. Two explicit build steps handle this correctly:

- **Step A** `if: github.event.inputs.force_no_cache != 'true'` — includes `cache-from`/`cache-to` (`type=gha, mode=max`)
- **Step B** `if: github.event.inputs.force_no_cache == 'true'` — omits cache flags entirely, clean build

> On non-`workflow_dispatch` events, `github.event.inputs.force_no_cache` is null/empty, so `!= 'true'` evaluates true and Step A (cached) runs. This is the correct default behavior.

---

### 2. `Dockerfile`

Multi-stage build:

- **Stage 1 — build:** Node base image. Runs `npm ci` then `npm run build`. Produces the `dist/` directory.
- **Stage 2 — runtime:** Nginx Alpine base. Copies `dist/` from Stage 1 into the Nginx web root. Final image contains no Node tooling.

---

### 3. `nginx.conf`

Provides SPA fallback routing so that direct navigation to any React Router path returns the app shell instead of a 404:

```nginx
try_files $uri /index.html;
```

> Gzip compression, long-cache headers for hashed assets, and security headers are intentionally out of scope for this iteration and noted in a comment in the file.

---

### 4. `.dockerignore`

| Entry | Reason |
|---|---|
| `node_modules/` | Rebuilt inside Docker; including it wastes bandwidth and risks version mismatch |
| `.git/` | Not needed at build time; large and sensitive |
| `dist/` | Regenerated inside Docker by `npm run build`; must not override internal output |
| `.github/` | CI config not needed inside image |
| `*.md` | Size optimization; revisit if build tooling ever reads markdown files |
| `.env*` | Environment files must never be baked into images |
| `.vscode/`, `.idea/` | Editor config not needed inside image |
| `coverage/`, `npm-debug.log*` | Test artifacts and debug logs not needed inside image |

---

### 5. `.github/dependabot.yml`

Enables automated weekly PRs to update SHA-pinned actions to their latest revisions. Without this, pinned SHAs silently drift from upstream security patches.

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

> If the Dockerfile pins specific Node or Nginx base image versions, add a second entry with `package-ecosystem: docker` to receive base image bump PRs.

---

### 6. `README.md`

Must include these sections at minimum: Setup, Variables and Secrets, Local Docker Usage, CI Trigger Matrix, Tag Reference, and Troubleshooting (see entries below).

---

## Tag Behavior

| Condition | Tags Produced |
|---|---|
| All events | `sha-<shortsha>` |
| Push to branch / `workflow_dispatch` on branch | `sha-<shortsha>`, `<branch-name>` |
| Push to default branch | `sha-<shortsha>`, `<branch-name>`, `latest` |
| `workflow_dispatch` on tag ref (e.g. `v1.0.0`) | `sha-<shortsha>`, `v1.0.0` — `latest` is **not** produced |
| Pull request | Build only — no tags pushed |

If both `main` and `master` are active during a branch migration, only whichever equals the repository default branch produces `latest`. The other branch produces only SHA and branch tags, preventing the `latest` race condition.

`workflow_dispatch` on a version tag ref produces the ref tag but not `latest`. Version-tag publishing via `push.tags` is intentionally deferred and out of scope.

---

## Concurrency Behavior

The concurrency group `docker-publish-${{ github.ref }}` ensures a newer push to the same branch cancels any in-progress run for that branch before the new run starts.

Each pull request has a unique ref (`refs/pull/<number>/merge`), so concurrent PRs do not cancel each other. Only multiple pushes to the same branch compete within the same group.

> If a run is cancelled while `docker/build-push-action` is mid-push, the target tags at Docker Hub may be temporarily absent or show an incomplete manifest. If `latest` is missing after a push, verify no concurrent run was cancelled and re-push or manually re-run the workflow.

---

## Validation and Test Cases

### Local

```bash
# Verify the Vite build succeeds independently of Docker
npm ci && npm run build

# Build and smoke test the container
docker build -t local/calc:test .
docker run -d -p 8080:80 --name calc-smoke local/calc:test

# Root smoke test
curl --fail http://localhost:8080

# SPA fallback and app-shell assertion
curl --fail http://localhost:8080/some/deep/route | grep -q 'id="root"'
```

> The `grep` pattern matches `id="root"` rather than the full div tag to avoid brittleness from whitespace normalization or minification. Verify this string appears in your actual built `index.html` before committing the assertion.

### CI — Pull Request

- Validation step passes or fails with a clear message
- Login step is skipped (confirmed in logs)
- Build step completes successfully
- No image push occurs

### CI — Push to `main` or `master`

- Validation step passes
- Login succeeds
- Image pushed with SHA tag and branch name tag
- `latest` pushed only if pushed branch equals the repository default branch

### Docker Hub Verification

- Expected tags appear in the Docker Hub repository
- `latest` is stable and corresponds to the most recent successful default-branch run
- No `latest` flapping between branches

---

## Troubleshooting

**Workflow fails immediately with "DOCKERHUB_REPO must be in format namespace/image"**
`DOCKERHUB_REPO` is missing, empty, contains uppercase, or has no slash. Check repository Settings > Variables and set it to a lowercase `namespace/image` value.

**Login step fails with authentication error**
`DOCKERHUB_TOKEN` is missing, expired, or lacks write permission for the target repository. Regenerate the token in Docker Hub under Account Settings > Security and re-add it as a secret named `DOCKERHUB_TOKEN`.

**`latest` tag is missing from Docker Hub after a push**
The pushed branch does not match the repository default branch, or a concurrent run was cancelled mid-push. Confirm the pushed branch is set as default in GitHub repo settings. If a cancellation occurred, re-push or manually re-run the workflow.

**Build uses stale output despite source changes**
The GitHub Actions cache returned a stale layer. Trigger `workflow_dispatch` and set `force_no_cache` to `true` to force a clean build for that run.

---

## Assumptions and Explicit Defaults

| Assumption | Status |
|---|---|
| Docker Hub is the only delivery target; GitHub Pages deployment is retired | In scope |
| Version-tag publishing via `push.tags` (e.g. `v1.0.0`) | Intentionally deferred |
| Nginx hardening: gzip, security headers, long-cache strategy for hashed assets | Intentionally deferred |
| Artifact upload on build failure for offline log inspection | Intentionally deferred; raw job logs are primary diagnostic source |
| Multi-platform builds (e.g. `linux/arm64`) | Out of scope; `linux/amd64` only |
