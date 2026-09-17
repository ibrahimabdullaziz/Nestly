# Roovia

A hand-built learning project for a short-term rental / accommodation booking backend.

This project was created from scratch with Express, TypeScript, Prisma, and PostgreSQL to practice backend architecture, authentication, validation, file uploads, database modeling, and API design.

> The project name is Roovia, but this is not a NestJS app. It is a custom Express backend built manually as a learning project.

## Overview

Roovia is a backend API for a rental marketplace where users can:

- sign up, log in, and manage authentication
- browse countries, cities, currencies, and property categories
- create and manage rental units
- upload unit photos to Cloudinary
- make bookings for available dates
- leave reviews on units
- save favorite units
- manage OTP-based verification and email flows

## Tech Stack

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- JWT authentication
- Zod validation
- Cloudinary for image uploads
- Nodemailer for email sending
- Mocha + Chai + Sinon for tests

## Project Structure

```text
backend/

├── prisma/
│   ├── migrations/
│   │   └── ...
│   ├── schema.prisma
│   ├── seed-admin.ts
│   └── seed.ts
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── common/
│   │   ├── middleware/
│   │   │   ├── authGuard.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── roleGuard.ts
│   │   │   ├── upload.ts
│   │   │   └── validate.ts
│   │   ├── types/
│   │   │   └── express.d.ts
│   │   └── utils/
│   │       ├── ApiError.ts
│   │       ├── asyncHandler.ts
│   │       └── jwt.ts
│   ├── config/
│   │   ├── cloudinary.ts
│   │   └── env.ts
│   ├── db/
│   │   └── prisma.ts
│   └── modules/
│       ├── auth/
│       ├── bookings/
│       ├── categories/
│       ├── cities/
│       ├── countries/
│       ├── currencies/
│       ├── mail/
│       ├── otp/
│       ├── unit-favorites/
│       ├── unit-photos/
│       ├── unit-reviews/
│       ├── units/
│       └── users/
├── test/
│   ├── e2e/
│   │   ├── auth-setup.spec.ts
│   │   ├── booking-lifecycle.spec.ts
│   │   ├── booking-setup.spec.ts
│   │   ├── catalog-setup.spec.ts
│   │   ├── unit-setup.spec.ts
│   │   └── helpers/
│   ├── integration/
│   │   ├── bookings-availability.spec.ts
│   │   ├── bookings-lifecycle.spec.ts
│   │   ├── bookings-transaction.spec.ts
│   │   ├── cities.spec.ts
│   │   ├── countries.spec.ts
│   │   ├── database.spec.ts
│   │   ├── reviews-favorites.spec.ts
│   │   ├── units.spec.ts
│   │   ├── users.spec.ts
│   │   └── helpers/
│   └── unit/
│       ├── auth.controller.spec.ts
│       ├── auth.service.spec.ts
│       ├── bookings.controller.spec.ts
│       ├── bookings.service.spec.ts
│       ├── reviews-favorites-catalog.controller.spec.ts
│       ├── supporting-services.spec.ts
│       ├── unit-photos.controller.spec.ts
│       ├── units.controller.spec.ts
│       └── units.service.spec.ts
├── .mocharc.json
├── .nycrc.json
├── package.json
├── prisma.config.ts
├── tsconfig.json
├── README.md
└── ...
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 20+ recommended
- PostgreSQL installed and running
- A local database created for the app
- A `.env` file configured with all required variables

## Environment Variables

Create a `.env` file in the `backend` folder with values like this:

```env
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/roovia"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
SYSTEM_ADMIN_EMAIL="admin@example.com"
SYSTEM_ADMIN_PASSWORD="admin-password"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
MAIL_USER="your-email@example.com"
MAIL_PASS="your-email-password"
```

## Installation

From the backend folder:

```bash
npm install
```

## Database Setup

Generate Prisma client and prepare the database:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

If you want to seed an admin user, run:

```bash
npx tsx prisma/seed-admin.ts
```

## Running the App

Start the development server with hot reload:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start the built app:

```bash
npm run start
```

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run test
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:coverage
```

## API Notes

The app exposes REST endpoints under `/api`, with route groups including:

- `/api/auth`
- `/api/countries`
- `/api/cities`
- `/api/currencies`
- `/api/unit-categories`
- `/api/units`
- `/api/bookings`
- `/api/favorites`

The app also uses middleware for:

- request validation
- authentication
- authorization
- centralized error handling
- logger output via Morgan

## Testing

This backend includes unit, integration, and end-to-end tests.

### Run all tests

```bash
npm test
```

### Run specific test groups

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Coverage

```bash
npm run test:coverage
npm run test:coverage:critical
```

### Test setup notes

- Unit tests live under `test/unit/`
- Integration tests live under `test/integration/`
- End-to-end tests live under `test/e2e/`
- The project uses Mocha, Chai, Sinon, and Supertest
- Integration and E2E tests rely on environment variables from `.env.test` via `dotenv-cli`

## Notes for Learning

This is a great project to study if you want to understand:

- layered backend architecture
- Express route + service pattern
- Prisma schema design
- JWT-based auth flow
- reusable validation middleware
- handling uploads and external services
- test-driven backend development

## License

This project is for learning and personal development.

## Future Ideas

Possible extensions include:

- better pagination and filtering
- booking availability checks
- admin dashboard endpoints
- unit search by city/date/price
- improved refresh-token flow
- request rate limiting and security hardening
