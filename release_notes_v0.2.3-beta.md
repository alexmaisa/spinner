# Spinner v0.2.3-beta

A minor release focusing on hotfixing a critical UI crash in the history logs overlay and enhancing defensive runtime stability for unauthenticated and new users:

---

### 🚀 Key Features & Changes in this Release

*   **📜 History Log Panel Hotfix**:
    *   **Backend Empty State Handling**: Patched the Go database history query handler (`GetUserSpinHistory`) to instantiate an empty slice `history := []*models.SpinHistory{}` instead of leaving it as `nil` when there are no logged spin entries for a user yet. This guarantees that empty states correctly serialize to `[]` in the JSON API, eliminating `null` references.
    *   **Frontend State Guarding**: Injected standard fallback array assignment `data || []` in `loadHistory` inside `App.tsx` when resolving user history fetch calls.
    *   **JSX List Rendering Resilience**: Hardened rendering logic on the sidebar overlay list checker by utilizing strict falsy checks `!spinHistory || spinHistory.length === 0`. This completely halts any possible cascading runtime JavaScript `TypeError` crashes, protecting the viewport from going dark if a user views history for the first time.

---

### 📦 Artifacts & Image Registry
*   **Docker Registry Image**: `ghcr.io/alexmaisa/spinner:latest`
*   **License**: PolyForm Noncommercial 1.0.0
