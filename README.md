# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.4.

## 📚 Documentation

### Configuration Management
- **[Configuration Management Guide](../docs/CONFIGURATION-MANAGEMENT.md)** - ⚙️ **IMPORTANT** - How configuration flows through environments
  - Learn how `.env` files work in local vs Azure
  - Understand `runtime-config.json` generation
  - JWT timeout and API URL configuration
  - Common pitfalls and solutions

### Development Guides
- **[Version Management](VERSION_MANAGEMENT.md)** - Build versioning and runtime config
- **[Frontend OIDC Implementation](FRONTEND-OIDC-IMPLEMENTATION.md)** - Authentication setup
- **[Dev Script Guide](FRONTEND-DEV-SCRIPT.md)** - Using `dev.ps1` helper scripts

---

## CI/CD overview

This repo has an automated workflow at `.github/workflows/frontend-image.yaml` that:

1) Logs in to Azure using OIDC (no client secrets).
2) Builds and pushes a container image to ACR using Docker Buildx and cache.
3) Resolves the image digest and dispatches it to this repo to trigger infra deploy and promotion.

- Image name: `${AZURE_ACR_NAME}.azurecr.io/raptor/frontend-${AZURE_ENV_NAME}:${short_sha}`
- Digest reference sent to infra: `${AZURE_ACR_NAME}.azurecr.io/raptor/frontend-${AZURE_ENV_NAME}@sha256:<digest>`
- The infra workflow consumes the digest, runs `azd up`, and prints the frontend URL in its job logs and summary.

### Required GitHub configuration

Set these in GitHub repository settings.

- Variables (Settings → Variables → Actions) — environment-scoped per GitHub Environment:
	- In `dev`: `AZURE_ACR_NAME` (e.g., ngraptordev), `AZURE_ENV_NAME` (e.g., dev)

- Secrets (scoped to environment `dev` to match the workflow):
	- `AZURE_CLIENT_ID` (App registration / Workload identity application ID)
	- `AZURE_TENANT_ID`
	- `AZURE_SUBSCRIPTION_ID`
	- `GH_PAT_REPO_DISPATCH` (Personal Access Token with access to the infra repo to send repository_dispatch events)

- Entra ID (App registration for `AZURE_CLIENT_ID`) → Federated credentials:
	- Issuer: `https://token.actions.githubusercontent.com`
	- Audience: `api://AzureADTokenExchange`
	- Subject: `repo:arif-md/rap-prototype:environment:dev`

#### Generate PAT and add as secret

Because rap-frontend and rap-infra are different repositories, you must use a PAT: the default `GITHUB_TOKEN` cannot send repository_dispatch to a different repository.

Option A — Classic PAT (recommended, simple):

1. Open https://github.com/settings/tokens/new
2. Note: e.g., “frontend → infra dispatch”
3. Expiration: choose a reasonable duration
4. Scopes: check `repo`
5. Generate and copy the token
6. If your infra repo is in an organization with SSO, click “Configure SSO” on the token and “Authorize” the organization
7. Add the token as an Environment secret in this repo (Settings → Environments → `dev` → Add secret):
	- Name: `GH_PAT_REPO_DISPATCH`
	- Value: the token

Option B — Fine-grained PAT (more restrictive):

1. Open https://github.com/settings/personal-access-tokens/new
2. Repository access: Only selected repositories → select your infra repo
3. Permissions (Repository):
	- Actions: Read and write
	- Metadata: Read
	- Contents: Read (optional)
4. Generate and copy; authorize SSO if prompted
5. Add as the `GH_PAT_REPO_DISPATCH` secret in the `dev` environment

### How to trigger

- Push to `main` with changes to `Dockerfile`, `package.json`, `angular.json`, or `src/**`.
- Or trigger manually via “Run workflow”.

On completion:

- The workflow logs “Built and pushed: <image@digest>”.
It sends a `repository_dispatch` to the infra repo, which triggers:
	- Infra deploy workflow (in the infra repo) to deploy to dev
	- Promotion workflow (in the infra repo) to promote to test (with approval)
Check the infra repo workflow run for “Frontend URL: https://...” and the URL in the job summary.

## Development server

Run locally without containers:

```bash
ng serve
```

Open `http://localhost:4200/`. The app reloads on source changes.

## Building

Build an optimized production bundle:

```bash
ng build
```

Artifacts are emitted to `dist/`.

## Optional: Manual Docker build/push

CI handles image builds automatically. If you need a manual build for local testing:

```bash
docker build -t frontend:local .
docker run -p 4200:80 frontend:local
# If pushing to ACR manually (requires ACR permissions):
REG="${AZURE_ACR_NAME}.azurecr.io"  # e.g., ngraptordev.azurecr.io
REPO="raptor/frontend-${AZURE_ENV_NAME}"  # e.g., raptor/frontend-dev
TAG="dev"
docker tag frontend:local "$REG/$REPO:$TAG"
az login
az acr login --name "$AZURE_ACR_NAME"
docker push "$REG/$REPO:$TAG"
```

Note: Deployments use digest references. The CI workflow automatically resolves and dispatches the digest to the workflows in this repo.

## Running unit tests

```bash
ng test
```

## Running end-to-end tests

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Troubleshooting

- OIDC login fails: Ensure repo environment `dev` contains the Azure secrets and the Entra federated credential subject matches `repo:arif-md/rap-prototype:environment:dev`.
- ACR push fails: Confirm the service principal (`AZURE_CLIENT_ID`) has `AcrPush` (or Contributor on the ACR/resource group).
- No deploy shows up: If using cross-repo dispatch, verify `GH_PAT_REPO_DISPATCH` has access to the infra repo and the `INFRA_REPO` value in the workflow is correct. For same-repo dispatch, ensure the workflow in `.github/workflows/infra-azd.yaml` exists.

## Additional Resources

For Angular CLI commands, see the [Angular CLI docs](https://angular.dev/tools/cli).
