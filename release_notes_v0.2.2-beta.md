# Spinner v0.2.2-beta

A comprehensive update resolving the critical blank black screen issue during passwordless redirection callbacks, updating local and deployment container infrastructure, and standardizing monorepo package constraints:

---

### 🚀 Key Features & Changes in this Release

*   **🔒 Passwordless Redirect & Black Screen Resolution**:
    *   **Backend Database Fix**: Patched `GetUserSpinnerConfigs` to return a fully-initialized empty slice `[]*models.SpinnerConfig{}` instead of a `nil` slice when a user has no configurations in the SQLite database. This ensures the backend serializes an empty array `[]` rather than `null` in JSON payloads.
    *   **Frontend Rendering Hardening**: Handled `null` or `undefined` values defensively using `!savedConfigs || savedConfigs.length === 0` in sidebar JSX layout checks to completely prevent fatal unhandled TypeErrors.
    *   **State Updates Synchronization**: Modified `useEffect` and `loadSavedSpinners` to forward the URL query parameter `authToken` directly to initial fetch calls, completely bypassing React's asynchronous state updating delay.
    *   **Robust base64url Decoding**: Upgraded `decodeJwtEmail` utility to automatically clean hyphens (`-`), underscores (`_`), and dynamically compute standard base64 character padding (`=`) to natively support `base64url` encoded tokens across all modern browser clients.
*   **🤖 CI/CD Build Hardening**:
    *   Created `.github/workflows/docker-publish.yaml` to build and publish standardized images automatically to GitHub Container Registry (GHCR) at `ghcr.io/alexmaisa/spinner` upon published releases.
    *   Forced javascript actions runners to target **Node.js 24** (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`) to preemptively mitigate deprecated runner warnings.
*   **🐳 Deployment Adaptability**:
    *   Renamed the private Forgejo-specific Docker Compose configuration file to `docker/compose.forgejo.yaml`.
    *   Drafted a brand new `docker/compose.yaml` pointing natively to the public automation image (`ghcr.io/alexmaisa/spinner:latest`).
*   **📦 Monorepo Package Constraints**:
    *   Enforced standard environment setups by pinning package manager to `pnpm@10.32.1` in `package.json`.
    *   Injected a `preinstall` check running `npx only-allow pnpm` to actively block other runtimes (like `npm`) from executing and messing with monorepo locks.

---

### 📦 Artifacts & Image Registry
*   **Docker Registry Image**: `ghcr.io/alexmaisa/spinner:latest`
*   **License**: PolyForm Noncommercial 1.0.0
