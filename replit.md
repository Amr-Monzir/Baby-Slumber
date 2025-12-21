# BabySleep - White Noise App

## Overview

BabySleep is a white noise application designed to help babies sleep. It's a full-stack web application built with React on the frontend and Express on the backend, with PWA (Progressive Web App) capabilities and Capacitor support for building native Android APKs. The app generates soothing brown/pink noise using the Web Audio API to create a calming environment for babies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with custom theme variables
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for smooth transitions
- **Fonts**: Nunito (body) and Quicksand (display) from Google Fonts

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (compiled with tsx for development, esbuild for production)
- **API Structure**: RESTful endpoints prefixed with `/api`
- **Static Serving**: Express static middleware serves the built client in production

### Build System
- **Client Build**: Vite with React plugin
- **Server Build**: esbuild bundling with selective dependency externalization
- **Development**: Vite dev server with HMR proxied through Express

### Audio Generation
- Uses Web Audio API to generate white noise
- Applies lowpass filter (400Hz) to create brown/pink noise effect
- Custom React hook (`useWhiteNoise`) manages audio context, gain nodes, and playback state

### Mobile/PWA Support
- **PWA**: Service worker for offline caching, web app manifest for installability
- **Capacitor**: Configuration for building native Android APK
- Portrait-only orientation, standalone display mode

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Current Schema**: Basic users table (id, username, password)
- **Storage Pattern**: In-memory storage class implementing `IStorage` interface (can be swapped for database implementation)

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

## External Dependencies

### Database
- PostgreSQL (configured via `DATABASE_URL` environment variable)
- Drizzle Kit for migrations (`npm run db:push`)

### Third-Party Services
- Google Fonts CDN for typography

### Key npm Packages
- `@capacitor/core` and `@capacitor/android` for native mobile builds
- `drizzle-orm` and `drizzle-kit` for database operations
- `@tanstack/react-query` for data fetching
- `framer-motion` for animations
- Full shadcn/ui component suite via Radix UI primitives