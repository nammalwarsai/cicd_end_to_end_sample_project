# CI/CD Process for Full-Stack App

## 📋 Project Overview

| Component | Technology | Deployment Target |
|-----------|------------|-------------------|
| **Frontend** | React 19 + Vite 7 | Vercel (recommended) |
| **Backend** | Express 5 + Node.js | Render (recommended) |
| **Database** | Supabase | Already hosted |

---

## 🎯 Deployment Strategy Recommendation

### Frontend → **Vercel** ✅
- Native Vite/React support
- Automatic deployments from GitHub
- Free tier available
- Edge network for fast loading
- Environment variables support

### Backend → **Render** ✅
- Native Node.js/Express support
- Free tier available
- Automatic deployments from GitHub
- Environment variables support
- Docker support (optional)

---

## 🐳 Docker Setup

### Backend Dockerfile

Create `BACKEND/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]
```

### Backend .dockerignore

Create `BACKEND/.dockerignore`:

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
```

### Frontend Dockerfile (Optional - for Docker deployment)

Create `FRONTEND/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 🔄 GitHub Actions Workflows

### 1. CI Workflow (Lint & Build Test)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Frontend CI
  frontend:
    name: Frontend CI
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./FRONTEND

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: './FRONTEND/package-lock.json'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

  # Backend CI
  backend:
    name: Backend CI
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./BACKEND

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: './BACKEND/package-lock.json'

      - name: Install dependencies
        run: npm ci

      - name: Check syntax (dry run)
        run: node --check src/index.js
```

### 2. Deploy Frontend to Vercel

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'FRONTEND/**'

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel
        run: |
          cd FRONTEND
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 3. Deploy Backend to Render

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Render

on:
  push:
    branches: [main]
    paths:
      - 'BACKEND/**'

jobs:
  deploy:
    name: Deploy to Render
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

### 4. Docker Build & Push (Optional)

Create `.github/workflows/docker.yml`:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]
    paths:
      - 'BACKEND/**'

jobs:
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./BACKEND
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/cicd-backend:latest
```

---

## 🚀 Deployment Setup Steps

### Step 1: Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your repository
4. Set **Root Directory** to `FRONTEND`
5. Framework Preset: **Vite**
6. Add Environment Variables:
   - `VITE_API_URL` = Your Render backend URL
   - `VITE_SUPABASE_URL` = Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
7. Click Deploy

**For GitHub Actions deployment**, get these from Vercel:
- `VERCEL_TOKEN` - Account Settings → Tokens
- `VERCEL_ORG_ID` - Project Settings → General
- `VERCEL_PROJECT_ID` - Project Settings → General

### Step 2: Render (Backend)

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click "New" → "Web Service"
3. Connect your repository
4. Configure:
   - **Name**: `cicd-backend`
   - **Root Directory**: `BACKEND`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `PORT` = 5000
   - `FRONTEND_URL` = Your Vercel frontend URL
   - `SUPABASE_URL` = Your Supabase URL
   - `SUPABASE_SERVICE_KEY` = Your Supabase service key
6. Click "Create Web Service"

**For GitHub Actions deployment**, get Deploy Hook URL:
- Dashboard → Your Service → Settings → Deploy Hook

---

## 🔐 GitHub Secrets Required

Add these to your repo: **Settings → Secrets and variables → Actions**

| Secret | Description |
|--------|-------------|
| `VITE_API_URL` | Backend URL (e.g., https://your-backend.onrender.com) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VERCEL_TOKEN` | Vercel access token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `RENDER_DEPLOY_HOOK_URL` | Render deploy webhook URL |
| `DOCKER_USERNAME` | Docker Hub username (optional) |
| `DOCKER_PASSWORD` | Docker Hub password (optional) |

---

## 📁 Final Project Structure

```
CI CD_END TO END PRO/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-frontend.yml
│       ├── deploy-backend.yml
│       └── docker.yml (optional)
├── BACKEND/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── src/
│       ├── index.js
│       └── config/
│           └── supabase.js
├── FRONTEND/
│   ├── Dockerfile (optional)
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       └── config/
│           └── api.js
├── ci cd process.md
└── README.md
```

---

## ✅ CI/CD Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Developer Push                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI                         │
│  • Lint code                                                 │
│  • Run tests (when added)                                    │
│  • Build check                                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────────┐ ┌─────────────────────┐
│  Frontend Changed?  │ │  Backend Changed?   │
└─────────┬───────────┘ └─────────┬───────────┘
          │                       │
          ▼                       ▼
┌─────────────────────┐ ┌─────────────────────┐
│  Deploy to Vercel   │ │  Deploy to Render   │
│  (Auto or Action)   │ │  (Webhook trigger)  │
└─────────────────────┘ └─────────────────────┘
          │                       │
          └───────────┬───────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Production Live! 🚀                       │
│  Frontend: https://your-app.vercel.app                      │
│  Backend: https://your-backend.onrender.com                 │
│  Database: Supabase (already hosted)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Start Commands

```bash
# Create GitHub workflows directory
mkdir -p .github/workflows

# Test Docker build locally
cd BACKEND
docker build -t cicd-backend .
docker run -p 5000:5000 --env-file .env cicd-backend

# Test frontend build
cd FRONTEND
npm run build
npm run preview
```

---

## 📝 Notes

- **Vercel** automatically deploys on push (can disable if using GitHub Actions)
- **Render** free tier spins down after 15 mins of inactivity (first request may be slow)
- **Environment variables** must be set in both platforms AND GitHub secrets
- **CORS**: Update `FRONTEND_URL` in backend after getting Vercel URL
