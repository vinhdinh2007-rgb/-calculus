# CALC CI/CD

## Setup

1. Ensure Docker Hub repository exists (example: `myuser/calc`).
2. In GitHub repository settings, add:

- Variable: `DOCKERHUB_REPO` with format `namespace/image`
- Secret: `DOCKERHUB_TOKEN` (Docker Hub access token with push permission)

3. Push to `main` or `master`, open a PR to these branches, or run workflow manually via `workflow_dispatch`.

## Variables and Secrets

| Name              | Type     | Required | Notes                                          |
| ----------------- | -------- | -------- | ---------------------------------------------- |
| `DOCKERHUB_REPO`  | Variable | Yes      | Must match `namespace/image` using lowercase   |
| `DOCKERHUB_TOKEN` | Secret   | Yes      | Docker Hub access token (not account password) |

`DOCKERHUB_USERNAME` is intentionally not used. Username is derived automatically from `DOCKERHUB_REPO`.

## Local Docker Usage

```bash
# Verify app build
npm ci
npm run build

# Build image locally
docker build -t local/calc:test .

# Run container
docker run -d -p 8080:80 --name calc-smoke local/calc:test

# Root smoke test
curl --fail http://localhost:8080

# SPA fallback test (React shell should load)
curl --fail http://localhost:8080/some/deep/route | grep -q 'id="root"'
```

## CI Trigger Matrix

| Event                             | Build | Docker Login | Push |
| --------------------------------- | ----- | ------------ | ---- |
| `pull_request` to `main`/`master` | Yes   | No           | No   |
| `push` to `main`/`master`         | Yes   | Yes          | Yes  |
| `workflow_dispatch` on branch     | Yes   | Yes          | Yes  |
| `workflow_dispatch` on tag ref    | Yes   | Yes          | Yes  |

`workflow_dispatch` input:

- `force_no_cache`:
  - `false` (default): build with `type=gha` cache
  - `true`: build without cache flags

## Tag Reference

| Condition                                  | Tags Produced                               |
| ------------------------------------------ | ------------------------------------------- |
| All events (where push is allowed)         | `sha-<shortsha>`                            |
| Branch ref (`push` or `workflow_dispatch`) | `sha-<shortsha>`, `<branch-name>`           |
| Default branch only                        | `sha-<shortsha>`, `<branch-name>`, `latest` |
| Tag ref via `workflow_dispatch`            | `sha-<shortsha>`, `<tag-name>`              |
| Pull request                               | Build-only validation, no push              |

`latest` is emitted only when the source branch equals repository default branch. This prevents `latest` race conditions during `main`/`master` transitions.

## Troubleshooting

`DOCKERHUB_REPO must be in format namespace/image`

- `DOCKERHUB_REPO` is missing, empty, uppercase, or malformed.
- Fix value in GitHub Settings -> Variables -> Actions.

Docker login authentication failure

- `DOCKERHUB_TOKEN` is missing, expired, or lacks push permission.
- Regenerate token in Docker Hub and update GitHub secret.

`latest` missing after push

- Branch is not the default branch, or a previous run was cancelled while pushing.
- Re-run workflow or push a new commit on the default branch.

Stale build output

- Trigger `workflow_dispatch` and set `force_no_cache=true` for a clean build.
