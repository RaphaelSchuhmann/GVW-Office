# GVW Office – Project Outline
## 1. Project Overview
Purpose:
Desktop application for managing members, events, reports, and sheet music of Gesangverein Weppersdorf, with built-in PDF generation for official documentation.

Primary user:
Schriftführer, potentially future non-technical choir members.

Platform:
Cross-platform desktop app: Windows 10+ / macOS / Linux

Centralized database hosted on Strato (MariaDB or MySQL 8).

2. Name & Branding

Official Name: GVW Office

Tone: Professional, clean, trustworthy, choir-related

UI Direction:

Colors: Deep burgundy/navy blue primary, gold/cream accents

Typography: Clean sans-serif (Inter, Noto Sans, Lato)

Logo: “GVW” monogram with subtle music note or document icon

3. Architecture
3.1 Overall Layout
        ┌───────────────────────────────┐
        │      Electron Desktop App     │
        │───────────────────────────────│
        │ React frontend                │
        │ Connects to backend API       │
        │ Local PDF generation optional │
        └─────────────┬─────────────────┘
                      │
                      ▼
          Node.js Backend (bundled)
          ├─ Express.js API (localhost)
          ├─ Prisma ORM (DB access)
          └─ PDF Generation (Puppeteer/pdfkit)
                      │
                      ▼
             Strato MySQL/MariaDB

3.2 Key Design Decisions

Backend packaged separately but bundled

Electron spawns backend as a local service on install.

Backend automatically starts on boot.

Local service approach preserves modular separation, faster frontend startup, and testability.

Dynamic port selection

Backend chooses first free port from a predefined range.

Frontend detects chosen port at startup via temp file, IPC, or stdout.

Database hosting:

MySQL 8 (preferred over MariaDB) on Strato

Backend communicates directly with DB (API hosted locally)

HTTPS unnecessary for local-only backend; ensure DB connection secure.

PDF Generation:

Puppeteer or pdfmake for HTML → PDF reports.

Templates for events, meetings, member reports.

Security:

Backend binds only to 127.0.0.1

Optional JWT auth if multi-user later

Database credentials stored securely inside Electron backend (or encrypted config).

4. Tech Stack
Layer	Technology	Notes
Desktop framework	Electron	Cross-platform GUI
Frontend	React + TailwindCSS	Clean, modular UI
Backend	Node.js + Express.js	Local API service
ORM / DB	Prisma + MySQL 8	Easy schema management and queries
PDF generation	Puppeteer / pdfmake / pdfkit	Templates for reports
Installer	Electron Builder	Creates OS-specific installers with backend service
System service	node-windows / LaunchAgent / systemd	Auto-start backend on boot
CI/Dev	TypeScript	Strong typing across frontend & backend
5. Project Structure
GVW-Office/
 ├── backend/                # Node.js API logic
 │    ├── src/
 │    │    ├── api/          # Express routes/controllers
 │    │    ├── db/           # Prisma / MySQL access
 │    │    ├── pdf/          # PDF generation
 │    │    └── utils/        # Helpers, port detection
 │    ├── package.json
 │    └── tsconfig.json
 ├── frontend/               # Electron renderer
 │    ├── src/
 │    │    ├── components/
 │    │    ├── pages/
 │    │    └── services/     # API calls
 │    ├── package.json
 │    └── tsconfig.json
 ├── electron/               # Main process + preload
 │    ├── main.ts
 │    └── preload.ts
 ├── installer/              # Scripts for Windows/macOS/Linux installer
 └── shared/                 # Types, constants shared across frontend & backend

6. Deployment & Installer

Goal:

One-click install for non-technical users.

Backend runs as service/daemon automatically.

OS-specific setup:

Windows: NSIS installer via Electron Builder; backend as Windows Service (node-windows)

macOS: .dmg or .pkg; backend as LaunchAgent/LaunchDaemon

Linux: .AppImage or .deb; backend as systemd service

Features:

Start backend on boot

Dynamic port detection

Frontend auto-connects to local backend

7. Development & Maintenance Notes

Modular separation ensures testable code (frontend, backend, PDF, DB).

Dynamic backend port avoids conflicts and simplifies install.

Future-proofing:

Multi-user support or remote API hosting is possible with minimal changes.

Database migrations via Prisma.

Frontend remains decoupled from backend implementation.

✅ Summary:
GVW Office will be a modular, cross-platform, Electron-based desktop app with a local bundled API service and Strato-hosted MySQL 8 database, designed for a single non-technical user but with clean architecture for future expansion.
