# WhoIsHiring - Backend

FastAPI backend with async SQLAlchemy, JWT authentication, and DeepSeek AI-powered job parsing.

## Features

- JWT authentication (registration, login, password reset)
- HackerNews "Who is hiring?" thread scraping
- DeepSeek AI-powered job parsing (company, location, tech stack, remote status)
- Advanced filtering (location, remote, visa, tech keywords, full-text search)
- User preferences and email notifications (via AWS SES)
- Job bookmarking with application tracking
- Location suggestion endpoint (autocomplete from parsed job data)
- Scheduled background scraping via APScheduler

## Quick Start

```bash
# Setup virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL, API keys, and SMTP settings

# Run the application
python main.py
```

Or use the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

API docs: http://localhost:8000/docs

## Docker

Build and run:
```bash
docker build -t whoishiring-api .
docker run -p 8000:8000 --env-file .env whoishiring-api
```

Or with Docker Compose (from repo root):
```bash
docker-compose up
```

This starts PostgreSQL on port 5432 and the API on port 8000.

## API Endpoints

### Authentication (`/api/v1/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Create account |
| POST | `/login` | Get JWT token |
| GET | `/profile` | Get current user profile |
| PUT | `/profile/email` | Update email address |
| POST | `/forgot-password` | Request password reset email |
| POST | `/reset-password` | Reset password with token |

### Jobs (`/api/v1/jobs`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/browse` | Browse jobs with filters (location, remote, visa, tech) |
| GET | `/{job_id}` | Get job details |
| GET | `/search/text` | Full-text search |
| GET | `/locations/suggest` | Location autocomplete suggestions |

### Preferences (`/api/v1/preferences`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/my-preferences` | Get user preferences |
| PUT | `/my-preferences` | Update preferences |
| DELETE | `/my-preferences` | Reset to defaults |

### Saved Jobs (`/api/v1/saved-jobs`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/save` | Bookmark a job |
| GET | `/my-saved-jobs` | List bookmarked jobs |
| PATCH | `/{saved_id}` | Update bookmark (notes, status) |
| DELETE | `/{saved_id}` | Remove bookmark |

### Feedback (`/api/v1/feedback`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Submit feedback (sends email notification) |

### Admin (`/api/v1/admin`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/trigger-scrape` | Trigger HN scrape (requires admin API key) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Async PostgreSQL URL (`postgresql+asyncpg://...`) |
| `DATABASE_URL_SYNC` | Sync PostgreSQL URL (for migrations) |
| `SECRET_KEY` | JWT signing secret |
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI job parsing |
| `ADMIN_API_KEY` | Admin endpoint authorization key |
| `SMTP_HOST` | SMTP server (e.g. `email-smtp.us-east-2.amazonaws.com`) |
| `SMTP_PORT` | SMTP port (default 587) |
| `SMTP_USERNAME` | SMTP username (AWS SES credentials) |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM_EMAIL` | Sender email address |
| `CORS_ORIGINS` | Comma-separated allowed origins |

## Database Models

- **UserAccount** - Users with hashed passwords and email
- **JobPosting** - Parsed job listings (company, location, tech stack, remote status, visa)
- **UserJobPreferences** - Search keywords, locations, tech keywords, notification settings
- **SavedJob** - Bookmarked jobs with notes and application status

## Technology Stack

- **FastAPI 0.109** - Async web framework
- **SQLAlchemy 2.0** - Async ORM with asyncpg
- **PostgreSQL 15** - Database (AWS RDS)
- **DeepSeek API** - AI-powered job parsing
- **APScheduler** - Background job scheduling
- **python-jose** - JWT tokens
- **Bcrypt** - Password hashing
- **AWS SES** - Transactional email
