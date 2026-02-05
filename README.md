# Hub Apps - Corporate App Distribution Hub

Modern distribution platform for Windows applications with Apple 2026 aesthetics.

## 🚀 Quick Start (Development)

1. **Backend**:
   ```bash
   cd server
   npm install
   # Create .env based on .env.example
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 🌐 Production Deployment (EasyPanel / VPS)

This project is optimized for **EasyPanel** using Docker Compose.

### 1. Requirements
- A VPS with Docker and Docker Compose installed.
- Easypanel (recommended) or any Docker-based manager.

### 2. Deployment Steps
1. Create a new "App" or "Service" in Easypanel.
2. Link it to your GitHub repository.
3. Configure the following environment variables in the admin panel:
   - `JWT_SECRET`: A long random string.
   - `ADMIN_EMAIL`: Your corporate admin email.
   - `ADMIN_PASSWORD_HASH`: Bcrypt hash of your password.
   - `PORT`: 5000 (default for server).

### 3. Volume Persistence
Ensure the following directories are mapped to persistent volumes to avoid losing data on rebuilds:
- `/app/server/data` (for `apps.json`)
- `/app/server/uploads` (for installer files)
- `/app/server/logos` (for app icons)

## ⚙️ Configuration & Limits

- **Max File Size**: 500MB per installer (Configure in `server/routes/apps.js`).
- **Allowed Formats**: `.exe`, `.msi` for installers; `.jpg`, `.png`, `.webp` for logos.
- **Admin Access**: Default is `admin@empresa.com` / `admin123`.

## 🛠 Tech Stack
- **Frontend**: React + Vite + Tailwind CSS v4 + Framer Motion.
- **Backend**: Node.js + Express + Multer.
- **Database**: JSON-based (Persistence via Docker Volumes).

---
Developed with ❤️ by Antigravity for Corporate Efficiency.
