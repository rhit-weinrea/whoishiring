# HackerNews Job Board Backend

Complete FastAPI backend for scraping and managing HackerNews "Who is hiring?" job postings with AI-powered parsing.

## Features

- **JWT Authentication** - Secure user registration and login
- **Job Scraping** - Automated HN thread scraping with DeepSeek AI parsing
- **Advanced Filters** - Search by location, tech stack, remote status, company
- **User Preferences** - Customizable job matching preferences
- **Bookmarking** - Save and track job applications
- **Async/Await** - Fully asynchronous for high performance

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Create database
createdb hn_job_board

# Run application
python main.py
```

Visit http://localhost:8000/docs for API documentation.

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Create new account
- `POST /login` - Get JWT token
- `GET /profile` - Fetch user profile

### Jobs (`/api/v1/jobs`)
- `GET /browse` - Browse with filters
- `GET /{job_id}` - Get job details
- `GET /search/text` - Full-text search

### Preferences (`/api/v1/preferences`)
- `GET /my-preferences` - Get preferences
- `PUT /my-preferences` - Update preferences
- `DELETE /my-preferences` - Reset preferences

### Saved Jobs (`/api/v1/saved-jobs`)
- `POST /save` - Bookmark job
- `GET /my-saved-jobs` - List bookmarks
- `PATCH /{saved_id}` - Update bookmark
- `DELETE /{saved_id}` - Remove bookmark

### Admin (`/api/v1/admin`)
- `POST /trigger-scrape` - Start scraping (requires admin key)

## Environment Variables

```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/hn_job_board
SECRET_KEY=your-secret-key
DEEPSEEK_API_KEY=your-deepseek-key
ADMIN_API_KEY=your-admin-key
```

## Database Models

- **UserAccount** - User accounts with authentication
- **JobPosting** - Scraped job postings from HN
- **UserJobPreferences** - User job search preferences
- **SavedJob** - Bookmarked jobs with notes

## Tech Stack

- FastAPI - Web framework
- SQLAlchemy 2.0 - Async ORM
- PostgreSQL - Database
- DeepSeek API - AI parsing
- JWT - Authentication
- Bcrypt - Password hashing

## Development

```bash
# Run with auto-reload
uvicorn main:app --reload

# View logs
python main.py

# Access interactive docs
http://localhost:8000/docs
```
