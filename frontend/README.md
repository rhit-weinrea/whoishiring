# HN Career Hub - Frontend

Next.js 14 frontend application for the Hacker News job board.

## Features

- **Authentication Portal**: Secure login and registration system
- **Listing Browser**: Browse and search employment opportunities
- **Pin System**: Save interesting listings for later
- **Profile Manager**: Customize search preferences and alerts
- **Responsive Design**: Modern UI with Tailwind CSS

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Technology Stack

- **Next.js 14**: App Router architecture
- **TypeScript**: Type-safe code throughout
- **Tailwind CSS**: Utility-first styling
- **React Hooks**: State management

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx                    # Landing zone with auth
│   ├── dashboard/
│   │   ├── page.tsx                # Main listing browser
│   │   ├── pinned/page.tsx         # Pinned collection
│   │   └── profile/page.tsx        # Profile manager
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── EntryPortal.tsx             # Login component
│   ├── AccountRegistry.tsx         # Registration component
│   ├── EmploymentCard.tsx          # Job listing card
│   ├── QueryRefinery.tsx           # Search filters
│   └── NavigationBeam.tsx          # Dashboard navigation
└── lib/
    └── api.ts                      # API client
```

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Building for Production

```bash
npm run build
npm start
```
