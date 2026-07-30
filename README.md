# Vento Decor

Full-stack TypeScript project with separate frontend and backend applications.

## Stack

- Frontend: Next.js, React, TypeScript, App Router, Tailwind CSS, and ESLint
- Backend: NestJS, TypeScript in strict mode, and npm

## Project structure

```text
.
|-- frontend/  Next.js application
`-- backend/   NestJS application
```

## Getting started

Install dependencies in each application directory:

```bash
npm --prefix frontend install
npm --prefix backend install
```

Copy `backend/.env.example` to `backend/.env`, fill in your own local database
and Cloudinary values, then generate the Prisma client:

```bash
npm --prefix backend run prisma:generate
```

Never commit `backend/.env`. Start the applications in separate terminals from
the project root:

```bash
npm run dev:frontend
npm run dev:backend
```

The frontend runs at `http://localhost:3002` and the backend runs at
`http://localhost:3001` by default. Set `PORT` to override the backend port.

## Database changes

Apply the versioned SQL files from `backend/prisma/sql` in numeric order before
deploying a backend version. Database schema changes are intentionally not run
automatically when the application starts.

## Commands

```bash
npm run build
npm run lint
npm test
```
