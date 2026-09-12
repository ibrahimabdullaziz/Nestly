# Nestly Testing Learning Roadmap

## Summary

Build tests locally using Mocha + Chai + Sinon in small learning milestones. Start with isolated unit tests, then
add real-PostgreSQL integration tests, then one API-level end-to-end booking journey. Defer CI/CD until the local
suite is reliable.

Current project facts: TypeScript + Express + Prisma/PostgreSQL, with auth, roles, units, bookings, reviews,
favorites, OTP/email, and no existing test setup.

## Testing stack and structure

- Install and configure: mocha, chai, sinon, tsx, nyc, plus TypeScript type packages.
- Use test/\*_/_.spec.ts, grouped by feature: test/unit/..., test/integration/..., and test/e2e/....
- Add scripts for:
  - test:unit
  - test:integration
  - test:e2e
  - test:coverage
  - test to run the appropriate local suite.

- Use Chai expect, Sinon stubs/spies/fake timers, and Mocha hooks (before, beforeEach, afterEach, after).
- Unit tests must stub Prisma, mail, JWT, bcrypt, Cloudinary, and time—never use real database/network services.
- Keep one test per business behavior, use Arrange–Act–Assert, and test observable outcomes rather than internal
  implementation details.

## Study-and-build sequence

1. Testing foundations
   - Learn: test pyramid, unit vs integration vs E2E, AAA, test naming, deterministic tests, test doubles.
   - Practice on ApiError, asyncHandler, and JWT helpers.
   - Cover successful output, invalid/expired JWT, and error propagation.

2. Chai and asynchronous tests
   - Learn expect, deep equality, throws/rejections, promises, and custom assertions.
   - Test validation schemas and validate middleware:
     - valid request calls next;
     - invalid input returns the expected ApiError;
     - malformed/empty payload cases.

3. Sinon
   - Learn spies, stubs, stub return/reject behavior, restore discipline, fake timers, and why mocks are rarely
     needed.

   - Test authGuard and roleGuard:
     - no/malformed Bearer token;
     - invalid token;
     - valid token attaches req.user;
     - allowed and blocked roles.

   - Add fake-timer tests to OTP expiry behavior.

4. Controller unit tests
   - Stub each service module and call controllers with lightweight fake req, res, and next.
   - Verify HTTP status/body and correct service arguments.
   - Start with auth and booking controllers; then units, reviews, favorites, and catalog modules.
   - Test controller error forwarding consistently.

5. Service unit tests — highest value
   - Stub Prisma and all external collaborators.
   - Auth:
     - registration creates user, issues both tokens, generates OTP, and requests mail;
     - failed user creation;
     - unknown user/wrong password;
     - refresh-token failure;
     - email verification, forgot-password, and password-reset errors.

   - Units:
     - create/update ownership;
     - inactive/deleted units excluded from public listing;
     - city/category/price filters and pagination;
     - activation, deactivation, and soft-delete permission checks.

   - Bookings, as the priority module:
     - price by number of nights;
     - missing unit, invalid/zero/negative dates;
     - overlap rules, including exact boundary dates;
     - pending/confirmed bookings block availability;
     - cancelled/rejected bookings do not block availability;
     - guests may update/cancel only their own pending booking;
     - hosts may confirm/reject only bookings for their units;
     - transaction failure is surfaced correctly.

   - Add unit tests for favorites, reviews, unit photos, OTP, and catalog CRUD after core workflows are protected.

6. Coverage and quality checkpoint
   - Learn statement/branch/function coverage and why 100% is not the goal.
   - Start with a local threshold for critical modules: auth, middleware, units, and bookings.
   - Review uncovered branches manually and add tests only for meaningful behavior.
   - Optional advanced exercise: intentionally change a comparison in booking availability and confirm a test fails
     (a small mutation-testing lesson).

## Integration testing phase

- Create a dedicated local PostgreSQL database named nestly_test; never point tests at development data.
- Add a separate test environment file with test-only secrets and database URL.
- Prisma migrations run against this database before integration tests; clean test tables between suites in
  dependency-safe order.

- Use the real Prisma client and database for repository/service integration tests; keep email, Cloudinary, and
  other external services fake.

- Run database suites serially to avoid conflicts, especially for booking availability tests.
- Focus integration coverage on:
  - unique constraints for users, categories, currencies, and city/country pairs;
  - persisted filtering/pagination and soft-deleted unit visibility;
  - booking overlap query correctness;
  - booking transaction behavior and the FOR UPDATE availability flow;
  - unique review-per-guest-per-unit and favorite-per-user-per-unit rules.

## API E2E phase

- Add Supertest for API-level E2E tests against the exported Express app; do not start a network listener.
- First full journey: booking lifecycle.
  - Create host and guest accounts.
  - Authenticate both roles.
  - Prepare required catalog data and an active host unit.
  - Guest creates booking.
  - Host confirms or rejects it.
  - Guest reads, changes when still pending, or cancels their own booking.
  - Assert forbidden cross-user/cross-role actions and unavailable overlapping dates.

- Keep E2E tests few and high-value: they validate routing, validation, middleware, controllers, services, Prisma,
  and database together.

- Browser E2E is out of scope until Nestly has a frontend; then use Playwright for the same user journeys.

## Alternatives and decisions

- Chosen: Mocha + Chai + Sinon, because it directly reinforces what you are learning.
- Alternative later: Vitest is simpler to configure and faster for some projects, but do not switch while learning
  Mocha’s core concepts.

- Chosen integration database: dedicated local PostgreSQL database. Docker Compose is a good later upgrade for
  reproducibility.

- Chosen E2E focus: booking journey, because it crosses authentication, authorization, units, dates, transactions,
  and roles.

## Local workflow and future CI/CD

- Before each feature change: add or update the smallest relevant unit test.
- When local testing is stable, learn GitHub Actions by adding a workflow that installs dependencies, builds
  TypeScript, runs unit tests, then runs integration tests using a PostgreSQL service container.

- Later CI/CD topics: environment secrets, database migration safety, test reports/coverage artifacts, branch
  protection, and deployment gates.

## Acceptance criteria

- Unit tests run locally without PostgreSQL or external network access.
- Integration tests can only use nestly_test and clean their own data.
- The critical auth, authorization, unit, and booking rules have meaningful passing and failing-path tests.
- One booking lifecycle E2E test proves the main API journey works end to end.
- A documented local command sequence lets you run each test layer confidently.

## Assumptions

- This plan covers the current backend only; no frontend exists in the repository yet.
- CI/CD is intentionally deferred as a learning milestone, not omitted.
- Existing behavior is the initial contract; when tests expose a bug or ambiguous rule, decide the intended behavior
  first, then update code and test together.
