# Revv — Cut Through the GitHub Noise

Revv is a developer-focused notification intelligence platform. Instead of drowning in bot updates and irrelevant pings, Revv filters your GitHub notifications so you only see the pull requests, issues, and mentions that actually need your attention — right now.

## Live Demo

[https://project-aawll.vercel.app](https://project-aawll.vercel.app)

## What it does

- Connect your GitHub account via OAuth
- Filter out noise — dependabot PRs, bot comments, resolved threads
- See only what needs your action: review requests, direct mentions, overdue issues
- Set custom rules — mute labels, prioritize repos, get stale reminders
- Clean dashboard instead of a cluttered inbox

## Tech Stack

**Frontend** — React, Vite, TypeScript, Tailwind CSS, Framer Motion

**Backend** — FastAPI, Python, Uvicorn, GitHub OAuth

**Deployment** — Vercel (frontend), Render (backend)

## Project Structure

```
Revv/
├── frontend/                      # React (Vite) frontend
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page-level components
│   │   ├── services/              # API calls
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                       # VITE_API_URL
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/                       # FastAPI backend
│   ├── app/
│   │   ├── main.py                # FastAPI entry point
│   │   ├── routes/
│   │   │   └── auth.py            # GitHub OAuth routes
│   │   └── services/              # OAuth / business logic
│   ├── requirements.txt
│   └── .env                       # Backend env vars
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+

### 1. Clone the repo

```bash
git clone https://github.com/your-username/Revv.git
cd Revv
```

### 2. Setup frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Setup backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## GitHub OAuth Flow

1. User clicks "Connect GitHub"
2. Redirected to GitHub OAuth consent screen
3. GitHub sends auth code to `/auth/github/callback`
4. Backend exchanges code for access token
5. User data retrieved from GitHub API
6. User redirected to dashboard
