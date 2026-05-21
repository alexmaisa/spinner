# Spinner v0.1.0-beta

We are excited to announce the first beta release of **Spinner** (v0.1.0-beta)! This version lays down the complete, production-hardened foundational architecture for our free, lightweight, and premium randomizer platform.

---

### 🚀 Key Features in this Release

*   **🔒 Passwordless Magic-Link Auth**: Replaced username/password registration and login entirely with email-only authentication. Verification links are cryptographically random, secure, and issue a JWT session valid for 30 days.
*   **🎲 Cryptographically Secure Randomization**: Multi-functional randomizer (spin wheels, roll dice, flip coins, generate random numbers) powered by CSPRNG (cryptographically secure pseudo-random number generator) on our Go backend.
*   **💎 Premium UI/UX**: Stunning responsive glassmorphism dark-mode user interface with micro-animations and cohesive neon styling. Included a persistent spin history overlay directly on the homepage.
*   **🐳 Hardened Docker Containerization**: Implemented a multi-stage production Docker build targeting pinned stable `alpine:3.20.5` and running as a secure, unprivileged non-root user (`spinner` UID/GID `10001`) to close RCE vulnerabilities.
*   **📬 Embedded Local SMTP Developer Tool**: Added a Mailpit SMTP catcher sidecar to the local development Compose stack for capturing local registration and sign-in emails effortlessly.
*   **⚖️ License & Versioning**: Formally licensed under the **PolyForm Noncommercial License 1.0.0**. Version `v0.1.0-beta` has been established across the codebase, configuration, and documentation.

---

### 📦 Artifacts & Image Registry
*   **Docker Registry Image**: `repo.alexmaisa.my.id/alexmaisa/spinner:latest`
*   **License**: PolyForm Noncommercial 1.0.0
