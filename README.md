<h1 align="center">Spinner</h1>

<p align="center">
  <img src="https://img.shields.io/badge/UI-Premium-a855f7" alt="UI-Premium">
  <img src="https://img.shields.io/badge/version-v0.1.0--beta-f97316" alt="Version">
  <img src="https://img.shields.io/badge/license-PolyForm%20Noncommercial-ef4444" alt="License">
  <img src="https://img.shields.io/badge/Status-Active-22c55e" alt="Status">
  <img src="https://img.shields.io/badge/Platform-Web-64748b" alt="Platform">
  <img src="https://img.shields.io/badge/Tech-Go%20%7C%20TypeScript%20%7C%20SQLite%20%7C%20Docker-3b82f6" alt="Tech">
  <img src="https://img.shields.io/badge/Randomizer-CSPRNG-00bcd4" alt="Randomizer CSPRNG">
</p>

---

**Spinner** is a free, premium, lightweight, and completely ad-free web randomizer application. Built with a highly responsive, modern glassmorphism dark interface and backed by a cryptographically secure Go server, Spinner makes spinning custom wheels, rolling dice, flipping coins, and generating random numbers elegant, secure, and incredibly fast.

---

## ✨ Key Features

*   **🔒 Passwordless Magic-Link Authentication**: Clean, secure, and hassle-free registration and login. Users enter their email and receive a cryptographically secure hex-token magic link. No passwords stored, and JWT sessions are securely persisted for 30 days.
*   **🎲 Cryptographically Secure Randomization**: Backed by a Go server using secure CSPRNG (cryptographically secure pseudo-random number generator) algorithms for completely fair results.
*   **💎 Premium Glassmorphism UI**: Beautiful, dark-mode design system with stunning micro-animations, vibrant neon HSL theme colors, and fully responsive layouts that look exceptional on mobile, tablet, and desktop.
*   **📜 History & Persistent Storage**: Saves your randomized results and wheels securely in a lightweight SQLite database so you never lose your spin history.
*   **🐳 Hardened Docker Architecture**: Multi-stage Docker configuration that builds into a minimal, reproducible Alpine image running as a secure, unprivileged non-root user (`spinner` UID 10001) to completely shut down RCE container-escape vectors.
*   **📬 Embedded Mailpit sidecar**: Seamless local dev integration with an SMTP mail catcher to test magic-link emails locally without real-world SMTP credentials.

---

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), TypeScript, Tailwind CSS / Vanilla HSL custom styles, Lucide Icons
*   **Backend**: Golang 1.26+, SQLite (via modern `go-sqlite3`)
*   **DevOps & Security**: Docker Compose, Multi-stage Hardened Dockerfile, Pinned base images (`alpine:3.20.5`), non-root users

---

## 🚀 Installation & Running

### 📋 Prerequisites

Ensure you have the following installed on your machine:
*   [Go 1.26 or newer](https://go.dev/)
*   [Node.js 22 or newer](https://nodejs.org/) & [pnpm](https://pnpm.io/)
*   [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (for building/running containers)
*   `make` (GNU Make tool)

---

### 💻 Local Development Mode

To run backend and frontend native processes concurrently on your local machine:

1.  **Clone the repository** and navigate to the project directory:
    ```bash
    git clone <repository-url>
    cd spinner
    ```
2.  **Configure environment variables**:
    Copy the example template to create your `.env` file:
    ```bash
    cp .env.example .env
    ```
    *Note: The default SMTP values are configured to connect to Mailpit on port `1025`.*

3.  **Install all dependencies**:
    Install both the monorepo frontend (pnpm) and backend (go modules) dependencies:
    ```bash
    make install
    ```

4.  **Start the local development server**:
    ```bash
    make dev
    ```
    This starts the Go backend on `http://localhost:8080` and the Vite/React dev server on `http://localhost:5173` concurrently. 
    *   **Login Verification**: Since Mailpit is not active in local native mode, look at the backend console log output to see the printed magic-link URL, or run a Mailpit container separately to catch emails.

---

### 🐳 Local Docker Build (Testing Production Locally)

To build and run the entire production-hardened environment locally using Docker:

1.  **Configure `.env`**:
    Ensure your `.env` is created. The Docker compose stack will automatically load environment variables from the `.env` file at the root.

2.  **Build the Docker image locally**:
    Uses multi-stage compilation to build both backend and frontend securely:
    ```bash
    make build
    ```

3.  **Start the application container & Mailpit sidecar**:
    ```bash
    make docker-dev
    ```
    This builds/downloads all containers and runs them in detached mode in the background:
    *   **Web App**: Accessible at [http://localhost:8080](http://localhost:8080)
    *   **Mailpit SMTP Catcher**: Access the web-based inbox at [http://localhost:8025](http://localhost:8025) to view and click your magic-link login emails.

4.  **Stop the running containers**:
    ```bash
    make stop
    ```

---

### 🌐 Production Deployment

The production deployment runs in a dedicated stack that utilizes pre-built registry images and excludes development-only components (like Mailpit).

The configuration is specified in [docker/compose.yaml](file:///Volumes/staDiff/GitHub/spinner/docker/compose.yaml).

1.  **Create your production `.env`**:
    Configure your environment variables for production. You **must** provide a real, working SMTP service (e.g., Resend, SendGrid, Mailgun, or Gmail App Password) to allow users to sign in:
    ```env
    # --- Database ---
    DB_PATH=/app/data/spinner.db

    # --- Server ---
    PORT=8080

    # --- JWT Security ---
    JWT_SECRET=insert-your-strong-random-jwt-secret-here

    # --- Application URLs ---
    FRONTEND_URL=https://spinner.yourdomain.com
    BASE_URL=https://spinner.yourdomain.com

    # --- Production SMTP Server ---
    SMTP_HOST=smtp.resend.com
    SMTP_PORT=465
    SMTP_USERNAME=resend
    SMTP_PASSWORD=re_YourSecretSMTPPassword Here
    SMTP_FROM=login@spinner.yourdomain.com
    ```

2.  **Run the production stack**:
    Deploy the compose stack in detached mode:
    ```bash
    docker compose -f docker/compose.yaml up -d
    ```
    This pulls the hardened production image (`repo.alexmaisa.my.id/alexmaisa/spinner:latest`) and spins up the application server. Data will be safely persisted in a secure Docker volume named `spinner-data`.

---

## 📄 License

This project is licensed under the terms of the **PolyForm Noncommercial License 1.0.0**. 

You are free to use, modify, and distribute this software for personal, educational, research, and noncommercial purposes. Any commercial use requires a separate commercial license from the project owner. See the [LICENSE](file:///Volumes/staDiff/GitHub/spinner/LICENSE) file for the full legal text.
