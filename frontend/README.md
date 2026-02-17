# WhoIsHiring - Frontend

Next.js 14 frontend with TypeScript and Tailwind CSS, deployed on AWS Amplify.

## Features

- Authentication portal (login + registration with auto-login)
- Job listing browser with search filters and location suggestions
- Pin system for saving interesting listings
- Profile manager with keyword, location, and tech preferences
- Email notification preferences
- Responsive design with dark/light theme support

## Getting Started

```bash
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the development server:
```bash
npm run dev
```

Open http://localhost:3000.

## Building for Production

```bash
npm run build
npm start
```

## Deploying to AWS Amplify

The app is deployed on AWS Amplify (app ID: `d1j1xagueqmavc`, region: `us-east-2`). Amplify is connected to the GitHub repo and auto-builds when changes are pushed to `main`.

To manually trigger a build:
```bash
aws amplify start-job --app-id d1j1xagueqmavc --branch-name main --job-type RELEASE --region us-east-2
```

Check build status:
```bash
aws amplify list-jobs --app-id d1j1xagueqmavc --branch-name main --region us-east-2 --max-results 3
```

Amplify environment variables (set in the Amplify console):
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx                    # Landing page with login/registration
│   ├── globals.css                 # Global styles and theme variables
│   ├── layout.tsx                  # Root layout
│   ├── dashboard/
│   │   ├── page.tsx                # Main job listing browser
│   │   ├── pinned/page.tsx         # Saved/pinned jobs
│   │   └── profile/page.tsx        # Profile and preferences manager
│   ├── feedback/page.tsx           # Feedback form
│   ├── forgot-password/page.tsx    # Password reset request
│   └── reset-password/page.tsx     # Password reset form
├── components/
│   ├── EntryPortal.tsx             # Login form
│   ├── AccountRegistry.tsx         # Registration form
│   ├── EmploymentCard.tsx          # Job listing card
│   ├── QueryRefinery.tsx           # Search filters with location suggestions
│   └── NavigationBeam.tsx          # Dashboard navigation bar
└── lib/
    └── api.ts                      # API client (auth, jobs, preferences, etc.)
```

## Technology Stack

- **Next.js 14** - App Router
- **TypeScript 5.4** - Type safety
- **Tailwind CSS 3.4** - Utility-first styling
- **Bootstrap Icons** - Icon set
- **React 18** - UI library
