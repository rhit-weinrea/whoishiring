# WhoIsHiring

Full-stack application for browsing HackerNews "Who is hiring?" job postings with AI-powered parsing, search filters, and user preferences.

## Architecture

| Component | Technology | Hosting |
|-----------|-----------|---------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS | AWS Amplify |
| Backend | FastAPI, SQLAlchemy 2.0 (async) | Docker / EC2 |
| Database | PostgreSQL 15 | AWS RDS (us-east-2) |
| Email | SES | AWS SES (us-east-2) |
| AI Parsing | DeepSeek API | External |

## Project Structure

```
whoishiring/
├── frontend/               # Next.js 14 app (see frontend/README.md)
│   ├── app/                # App Router pages
│   ├── components/         # React components
│   └── lib/api.ts          # API client
├── backend/                # FastAPI app (see backend/README.md)
│   ├── routes/             # API endpoint routers
│   ├── models/             # SQLAlchemy models
│   ├── utilities/          # Scraping, parsing, notifications
│   └── main.py             # App entrypoint
└── docker-compose.yml      # Local dev: PostgreSQL + API
```

## Quick Start (Local Development)

### Option 1: Docker Compose

```bash
docker-compose up
```

This starts PostgreSQL on port 5432 and the API on port 8000.

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit with your credentials
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

- Backend API docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

## AWS Deployment

### Frontend (Amplify)

The frontend is deployed via AWS Amplify. Amplify is connected to the repo and auto-builds on push to `main`.

```bash
# Manual trigger if needed
aws amplify start-job --app-id d1j1xagueqmavc --branch-name main --job-type RELEASE --region us-east-2
```

To check build status:
```bash
aws amplify list-jobs --app-id d1j1xagueqmavc --branch-name main --region us-east-2 --max-results 3
```

### Backend

The backend runs as a Docker container. To build and deploy:

```bash
cd backend
docker build -t whoishiring-api .
```

Push to your container registry or deploy to EC2 directly. The container exposes port 8000 and runs Uvicorn.

### Database

PostgreSQL is hosted on AWS RDS in us-east-2. Connection string is configured in `backend/.env` via `DATABASE_URL`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Async PostgreSQL connection string |
| `DATABASE_URL_SYNC` | Sync PostgreSQL connection string (migrations) |
| `SECRET_KEY` | JWT signing key |
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI parsing |
| `ADMIN_API_KEY` | Key for admin endpoints (scrape trigger) |
| `SMTP_HOST` | SES SMTP endpoint |
| `SMTP_PORT` | SES SMTP port |
| `SMTP_USERNAME` | SES SMTP username |
| `SMTP_PASSWORD` | SES SMTP password |
| `SMTP_FROM_EMAIL` | Sender email address |
| `CORS_ORIGINS` | Comma-separated allowed origins |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:8000`) |
