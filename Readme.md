# Full-Stack Authentication & User Management Assessment

## 1. Project Overview

This project is a full-stack authentication and user-management application built using:

* **Frontend:** React + TypeScript
* **Backend:** Node.js + Express
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Authentication:** JWT
* **Password Hashing:** bcrypt
* **Validation:** Zod
* **HTTP Client:** Axios

### Features

* User registration
* User login
* JWT-based authentication
* HttpOnly cookie-based token storage
* Access-token refresh
* User profile retrieval and update
* Password change
* Logout
* Role-based authorization
* Admin-only operations
* Consistent API responses
* Centralized error handling
* Backend error logging

---

# 2. Architecture

```text
React + TypeScript Frontend
          |
          | HTTP Requests
          | HttpOnly Cookies
          v
Node.js + Express Backend
          |
          +---- Routes
          |
          +---- Controllers
          |
          +---- Validation
          |
          +---- Authentication
          |
          +---- Authorization
          |
          +---- Global Error Handler
          |
          v
       Prisma ORM
          |
          v
     PostgreSQL Database
```

The frontend handles UI, user interaction, and client-side validation.

The backend is the actual security boundary and independently performs validation, authentication, authorization, password verification, and database operations.

---

# Architecture Decision Records (ADR)

This section documents the major architectural and security decisions made during development, including the reasoning, trade-offs, and consequences of each decision.

The goal is not only to document **what** was implemented, but also **why** it was implemented that way.

---

## ADR-001: Store JWTs in HttpOnly Cookies

### Status

**Accepted**

### Context

The application requires authentication across multiple API requests.

A common approach is to store JWTs in browser storage such as `localStorage`. However, tokens stored there are directly accessible to JavaScript.

If an XSS vulnerability occurs, malicious JavaScript may be able to read those tokens.

### Decision

Store both access and refresh tokens in **HttpOnly cookies**.

The cookies use:

```text
HttpOnly
SameSite=Strict
Secure=true in production
```

The refresh cookie is additionally restricted to the refresh endpoint using its cookie path.

### Rationale

The primary reason for this decision is to prevent normal frontend JavaScript from directly reading authentication tokens.

This reduces the impact of token theft through many XSS scenarios.

It also allows the browser to manage cookie transmission automatically.

### Trade-offs

The decision introduces additional requirements:

* Correct CORS configuration
* `credentials: true`
* CSRF consideration
* Correct cookie attributes
* Different `Secure` behavior between development and production

Therefore, HttpOnly cookies improve token protection but do not eliminate the need for secure application design.

### Consequence

The frontend does not need to store or manually attach JWTs.

Authentication state is represented by the authenticated user rather than by exposing the JWT to React code.

---

## ADR-002: Use Short-Lived Access Tokens and Longer-Lived Refresh Tokens

### Status

**Accepted**

### Context

A single long-lived JWT creates a large security window if the token is compromised.

At the same time, forcing the user to log in frequently creates poor usability.

### Decision

Use:

* A short-lived access token for normal API requests.
* A longer-lived refresh token for obtaining a new access token.

### Rationale

This creates a balance between security and usability.

If an access token is compromised, its useful lifetime is limited.

The refresh token is handled separately and is validated against a server-side refresh session.

### Trade-offs

The design is more complex than using one JWT.

The application must handle:

* Access-token expiration
* Refresh-token validation
* Refresh sessions
* Logout/revocation
* Refresh failures
* Retry of the original request

### Consequence

Users can remain authenticated without repeatedly entering credentials while the application maintains a shorter lifetime for normal access tokens.

---

## ADR-003: Use bcrypt for Password Hashing

### Status

**Accepted**

### Context

Passwords must never be stored in plaintext.

General-purpose hashing algorithms such as MD5 or SHA-256 are designed to be fast and therefore are not ideal for password storage.

### Decision

Use bcrypt for password hashing and password verification.

### Rationale

bcrypt is specifically designed for password hashing and intentionally increases the computational cost of password guessing.

The cost factor can be tuned according to the security requirements and server performance.

### Trade-offs

Increasing the bcrypt cost factor improves resistance against brute-force attacks but increases CPU usage and request latency.

Therefore, the cost factor should be selected using an appropriate security/performance benchmark.

### Consequence

Even if the database is compromised, attackers do not immediately obtain users' plaintext passwords.

---

## ADR-004: Validate Requests on Both Frontend and Backend

### Status

**Accepted**

### Context

Frontend validation improves the user experience but cannot be trusted for security.

A client can bypass the React application and send requests directly to the API.

### Decision

Perform validation independently on:

1. The frontend for user experience.
2. The backend for security and data integrity.

Zod is used for backend request validation.

### Rationale

The backend must treat every request as untrusted input.

Frontend validation and backend validation have different responsibilities.

```text
Frontend Validation
        |
        +--> UX

Backend Validation
        |
        +--> Security
        +--> Data Integrity
```

### Trade-offs

Validation logic may exist in two places.

This creates some duplication but provides a clear security boundary.

### Consequence

Invalid or malicious requests cannot bypass validation simply by avoiding the frontend.

---

## ADR-005: Use Database-Level Constraints for Data Integrity

### Status

**Accepted**

### Context

The application requires email addresses to be unique.

An application-level check such as:

```text
Does email exist?
```

followed by:

```text
Create user
```

is not sufficient because concurrent requests can pass the check simultaneously.

### Decision

Define email as unique in the Prisma schema:

```prisma
email String @unique
```

### Rationale

The database is the final authority for data integrity.

A database constraint prevents duplicate values even when multiple requests execute concurrently.

### Trade-offs

The application must correctly handle the resulting Prisma error.

For example:

```text
P2002
```

must be translated into an appropriate API response.

### Consequence

Duplicate emails cannot be stored even under concurrent requests.

---

## ADR-006: Use Explicit Prisma Error Mapping

### Status

**Accepted**

### Context

Database errors contain implementation-specific information.

Returning raw Prisma errors to clients can expose internal implementation details.

Treating every database error as a `500` also produces poor API semantics.

### Decision

Known Prisma errors are explicitly mapped to safe application-level errors.

Examples:

```text
P2002 -> 409 DUPLICATE_RESOURCE
P2025 -> 404 RESOURCE_NOT_FOUND
```

### Rationale

The API should expose meaningful business-level errors rather than database internals.

### Trade-offs

Additional error-handling logic is required.

New Prisma errors may need to be mapped as the application grows.

### Consequence

Clients receive predictable errors while database implementation details remain internal.

---

## ADR-007: Use a Consistent API Error Contract

### Status

**Accepted**

### Context

Different controllers returning different error structures make frontend error handling complicated and fragile.

### Decision

All API errors follow:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Validation errors may additionally contain `details`.

### Rationale

The frontend can consistently inspect:

```text
success
error.code
error.message
```

instead of implementing different error parsers for every endpoint.

### Trade-offs

Controllers and middleware must follow the same response convention.

### Consequence

The API becomes easier to consume, debug, test, and maintain.

---

## ADR-008: Use Centralized Error Handling

### Status

**Accepted**

### Context

Handling errors independently inside every controller leads to duplicated logic and inconsistent responses.

### Decision

Use a centralized Express error handler.

The handler is responsible for:

* Classifying errors
* Determining HTTP status
* Determining application error code
* Logging errors
* Returning safe client responses

### Rationale

Error handling is cross-cutting functionality.

Centralizing it ensures consistent behavior throughout the API.

### Trade-offs

Developers must correctly pass errors to the centralized handler.

### Consequence

The API has a single place responsible for translating internal errors into public API responses.

---

## ADR-009: Do Not Log Authentication Secrets

### Status

**Accepted**

### Context

Logs are useful for debugging and observability but may be stored or accessed by multiple systems or people.

Logging authentication secrets would create another security exposure.

### Decision

Never intentionally log:

* Passwords
* Password hashes
* Access tokens
* Refresh tokens
* JWT secrets
* Database credentials
* Authentication cookies

### Rationale

A debugging system should not become a second credential store.

### Consequence

Error logs remain useful without exposing authentication credentials.

---

## ADR-010: Keep Observability Simple for This Assessment

### Status

**Accepted**

### Context

A small assessment does not require a full distributed observability stack.

Introducing multiple logging and monitoring technologies would increase implementation complexity without providing proportional value for the assessment.

### Decision

Use centralized backend error logging to the terminal.

Logs include:

```text
Timestamp
HTTP method
Path
Status code
Application error code
Error name
Message
Development stack trace
```

### Rationale

The primary observability requirement is to make backend failures diagnosable.

Terminal-based centralized error logging is sufficient for this project's scope.

### Trade-offs

This is not a complete production observability solution.

It does not provide:

* Centralized log retention
* Dashboards
* Metrics
* Distributed tracing
* Alerting

### Consequence

The implementation remains simple while still demonstrating meaningful error observability.

Production monitoring would be a future improvement.

---

## ADR-011: Enforce Authorization on the Backend

### Status

**Accepted**

### Context

Frontend role-based UI restrictions can be bypassed by directly calling an API endpoint.

### Decision

Role authorization is enforced by backend middleware/controllers.

For example:

```text
USER
  |
  +--> User endpoints
  |
  X--> Admin endpoints

ADMIN
  |
  +--> User endpoints
  |
  +--> Admin endpoints
```

### Rationale

The backend is the security boundary.

The frontend should never be the authority for deciding whether an operation is permitted.

### Consequence

Even if a user manually constructs an admin API request, the backend still checks their role.

---

## ADR-012: Use Prisma Migrations for Database Schema Changes

### Status

**Accepted**

### Context

Production databases require controlled and traceable schema changes.

Directly pushing schema changes without migration history makes deployments harder to reproduce and audit.

### Decision

Use Prisma migrations.

Development:

```bash
npx prisma migrate dev
```

Production:

```bash
npx prisma migrate deploy
```

### Rationale

Migrations provide a versioned history of database changes.

This makes database changes reproducible across environments.

### Trade-offs

Migration management requires additional discipline.

Destructive schema changes require planning and may require data migrations or backward-compatible deployment strategies.

### Consequence

Database schema changes become versioned, reviewable, and deployable.

---

## ADR-013: Do Not Implement Refresh-Token Rotation in This Assessment Version

### Status

**Accepted — Scope Decision**

### Context

Refresh-token rotation can improve security by detecting token reuse and limiting refresh-token replay.

However, implementing rotation correctly requires additional session-management logic.

### Decision

The current assessment version does **not** implement refresh-token rotation.

The current system validates:

* Refresh JWT
* JTI
* Database session
* User identity
* Revocation status
* Expiration

and then generates a new access token.

### Rationale

The goal of this assessment is to demonstrate secure authentication architecture without unnecessarily expanding the scope.

The missing rotation mechanism is explicitly documented rather than being represented as implemented.

### Trade-offs

Without rotation, a stolen valid refresh token may remain usable until it expires or is revoked.

### Future Improvement

Implement:

```text
Refresh Token A
       |
       v
Validate
       |
       v
Revoke A
       |
       v
Create B
       |
       v
Store B
       |
       v
Send B
```

and detect reuse of already-revoked refresh tokens.

---

# Explicit Technical Rationale Summary

The major decisions can be summarized as follows:

| Decision                  | Rationale                                               |
| ------------------------- | ------------------------------------------------------- |
| HttpOnly cookies          | Reduce direct JavaScript access to JWTs                 |
| Short-lived access token  | Limit exposure window of compromised access tokens      |
| Refresh token             | Maintain user sessions without long-lived access tokens |
| bcrypt                    | Password-specific, computationally expensive hashing    |
| Backend validation        | Frontend cannot be trusted                              |
| `@unique` email           | Database-level data integrity                           |
| Explicit Prisma errors    | Correct API semantics without leaking internals         |
| Consistent error contract | Predictable frontend handling                           |
| Centralized error handler | Consistency and less duplicated logic                   |
| No secret logging         | Prevent logs from becoming a credential leak            |
| Backend authorization     | Frontend restrictions are not security                  |
| Prisma migrations         | Versioned and reproducible schema changes               |
| Simple terminal logging   | Appropriate observability for assessment scope          |
| No refresh rotation       | Explicit scope decision; documented future improvement  |

---

# Decision-Making Principle

The implementation follows a general principle:

> **Use the simplest design that provides the required security and correctness, while explicitly documenting the trade-offs and future production improvements.**

This avoids both extremes:

```text
Under-engineering
       |
       v
Weak security / poor maintainability
```

and:

```text
Over-engineering
       |
       v
Unnecessary complexity for the project scope
```

The goal is a system that is secure, understandable, testable, and maintainable while still being appropriate for the size and requirements of the assessment.



# 3. Authentication Strategy

The application uses two JWTs:

## Access Token

The access token:

* Has a short lifetime.
* Is used for normal authenticated API requests.
* Is stored in an `HttpOnly` cookie.
* Is not accessible through JavaScript.
* Is verified by authentication middleware.

## Refresh Token

The refresh token:

* Has a longer lifetime.
* Is used only by the refresh endpoint.
* Is stored in an `HttpOnly` cookie.
* Is restricted to the refresh endpoint using the cookie `Path`.
* Has a corresponding refresh-session record in the database.

The frontend never reads either token.

---

# 4. Authentication Flow

## Login

```text
User
 |
 | email + password
 v
Backend
 |
 | Validate request
 v
Find user
 |
 | bcrypt.compare()
 v
Generate JWTs
 |
 +----> accessToken cookie
 |
 +----> refreshToken cookie
 |
 v
Return user information
```

The frontend stores the returned user information in React state.

It does **not** store JWTs in `localStorage` or `sessionStorage`.

---

## Normal Protected Request

```text
Frontend
   |
   | API request
   v
Browser automatically sends accessToken
   |
   v
Authentication Middleware
   |
   +---- valid ------> Controller
   |
   +---- expired ----> 401 TOKEN_EXPIRED
   |
   +---- missing ----> 401 TOKEN_NOT_FOUND
```

If the access token is expired or missing, the frontend API wrapper calls:

```text
POST /auth/refresh
```

The browser automatically sends the refresh cookie.

If the refresh token is valid, the backend creates a new access token and sets it as a cookie.

The original request is then retried.

---

# 5. JWT Storage Decision

## Decision

Access and refresh JWTs are stored in **HttpOnly cookies** rather than browser storage such as `localStorage`.

## Advantages

HttpOnly cookies cannot normally be accessed through frontend JavaScript.

This reduces the ability of malicious JavaScript to directly steal authentication tokens during many XSS scenarios.

The browser also automatically handles cookie transmission.

## Risks and Trade-offs

Cookie-based authentication requires careful configuration:

* CORS must be configured correctly.
* Cookie attributes must be configured correctly.
* CSRF must be considered.
* `SameSite`, `Secure`, `HttpOnly`, and `Path` must be configured correctly.
* Cross-origin frontend/backend deployments require careful configuration.

The application uses:

```text
HttpOnly
SameSite=Strict
Secure=true in production
```

The refresh cookie is restricted to the refresh endpoint path.

---

# 6. Password Security

Passwords are never stored as plaintext.

The application uses **bcrypt** for password hashing.

## Why bcrypt?

bcrypt is specifically designed for password hashing and is intentionally slower than general-purpose hashing algorithms.

Algorithms such as:

* MD5
* SHA-1
* SHA-256

are fast hashing algorithms and are not suitable as the primary password hashing mechanism.

A password hashing algorithm should make large-scale password guessing computationally expensive.

## Cost Factor

bcrypt uses a configurable cost factor.

A higher cost increases the computational work required for every password hash.

This improves resistance against brute-force attacks but also increases CPU usage and login/registration latency.

Therefore, the cost factor should be selected as a balance between:

```text
Security
   +
Server Performance
   +
Acceptable User Latency
```

The selected value should be benchmarked on the deployment environment.

---

# 7. Validation Strategy

Validation exists independently on both frontend and backend.

## Frontend Validation

Frontend validation provides:

* Immediate feedback
* Better user experience
* Fewer unnecessary API requests
* Better form handling

## Backend Validation

Backend validation is mandatory because the frontend cannot be trusted.

A malicious client can bypass the React application and directly call the API.

Therefore, the backend independently validates important incoming data using Zod.

```text
Frontend Validation
        |
        v
Better User Experience

Backend Validation
        |
        v
Actual Security Boundary
```

Frontend validation is therefore treated as a UX feature, not as a security mechanism.

---

# 8. API Response Structure

Successful responses follow a consistent structure:

```json
{
  "success": true,
  "message": "user fetched",
  "data": {}
}
```

Errors follow:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Validation errors can additionally contain field-level details:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email"
      }
    ]
  }
}
```

This makes frontend error handling predictable and consistent.

---

# 9. Signin Errors and Account Enumeration

The signin endpoint intentionally avoids revealing whether a particular email address exists.

The API does not return different messages such as:

```text
Email does not exist
```

and:

```text
Incorrect password
```

Instead, it uses a generic authentication failure such as:

```text
Invalid credentials
```

## Why?

Different responses can allow an attacker to test many email addresses and determine which accounts exist.

This is known as **account enumeration**.

Using a generic authentication error reduces this information leakage.

---

# 10. Prisma Database Design

Prisma is used as the ORM for PostgreSQL.

The database contains users and refresh-token sessions.

Important User fields include:

```text
id
name
email
passwordHash
role
createdAt
```

The email field is unique:

```prisma
email String @unique
```

Refresh sessions contain information such as:

```text
userId
jti
tokenHash
expiresAt
revokedAt
createdAt
```

---

# 11. Data Minimization in Prisma Queries

Database queries select only the fields required by the operation.

For example, when returning a user profile, there is no reason to return:

```text
passwordHash
```

to the frontend.

This follows the principle of **least data exposure**.

It also reduces:

* Data transfer
* Accidental information leakage
* Memory usage
* Coupling between database models and API responses

---

# 12. Duplicate Email Protection

The Prisma schema defines:

```prisma
email String @unique
```

This creates a database-level uniqueness constraint.

Application-level checks alone are not sufficient because two requests can arrive concurrently.

For example:

```text
Request A ---> Check email ---> Available
Request B ---> Check email ---> Available

Request A ---> Create user
Request B ---> Create user
```

The database constraint guarantees that the duplicate cannot be stored.

Prisma returns:

```text
P2002
```

for a unique constraint violation.

The global error handler converts this into:

```http
409 Conflict
```

with:

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_RESOURCE",
    "message": "A resource with this value already exists"
  }
}
```

---

# 13. Prisma Error Handling

Known Prisma errors are handled explicitly rather than being treated as generic server errors.

| Prisma Code | Meaning                     | HTTP Status |
| ----------- | --------------------------- | ----------: |
| `P2002`     | Unique constraint violation |       `409` |
| `P2025`     | Record not found            |       `404` |

This keeps database implementation details out of normal client responses while still providing correct HTTP semantics.

---

# 14. Global Error Handling

The backend has a centralized Express error handler.

It handles:

* `AppError`
* `ZodError`
* Prisma known errors
* Invalid JWT errors
* Expired JWT errors
* Unexpected errors

The handler first determines:

```text
HTTP Status
Error Code
Message
Optional Validation Details
```

It then logs the internal error and sends a safe response to the client.

Unexpected errors return:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Something went wrong"
  }
}
```

Internal stack traces are not returned to production clients.

---

# 15. Observability and Error Logging

For this assessment, observability is intentionally kept simple.

The project does not implement a large audit or logging platform such as:

* Winston/Pino
* ELK
* Grafana
* Prometheus
* Audit-log database

Instead, backend errors are centrally logged to the server terminal.

The logs contain:

* Timestamp
* HTTP method
* Request path
* HTTP status code
* Application error code
* Error name
* Error message
* Stack trace in development

Example:

```text
{
  timestamp: "2026-09-21T11:27:49.174Z",
  method: "POST",
  path: "/api/v1/auth/register",
  statusCode: 409,
  code: "DUPLICATE_RESOURCE",
  error: "PrismaClientKnownRequestError"
}
```

This provides sufficient observability for the scope of the assessment without introducing unnecessary infrastructure.

---

# 16. Sensitive Data and Logging

Sensitive authentication information is never intentionally logged.

The following should not appear in logs:

* Passwords
* Password hashes
* Access tokens
* Refresh tokens
* Refresh-token hashes
* JWT secrets
* Database credentials
* Authentication cookies

Development stack traces may be logged for debugging, while production responses remain generic.

---

# 17. CORS

The frontend and backend are separate applications, so CORS is configured explicitly.

Conceptually:

```js
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
})
```

The application does not use wildcard CORS with credentialed requests.

This configuration:

```js
origin: "*",
credentials: true
```

should not be used for authenticated cookie-based requests.

The frontend API client uses:

```text
withCredentials: true
```

so authentication cookies can be sent with API requests.

---

# 18. Security Headers

Security headers are enabled using Helmet.

```js
app.use(helmet());
```

This provides commonly recommended HTTP security headers and reduces the need to manually configure every security header.

---

# 19. Secrets and Environment Variables

Secrets are not hardcoded into source code.

Typical environment variables include:

```text
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
FRONTEND_URL
NODE_ENV
VITE_API_URL
```

JWT signing secrets are especially sensitive because they are used to sign and verify authentication tokens.

Environment files containing secrets should not be committed to source control.

Production deployments should use secure secret/environment-variable management.

---

# 20. Role-Based Authorization

The application supports two roles:

```text
USER
ADMIN
```

Authentication answers:

> Who is this user?

Authorization answers:

> Is this user allowed to perform this operation?

Example:

```text
USER
 |
 +---- Profile       Allowed
 |
 +---- Admin Users   Forbidden


ADMIN
 |
 +---- Profile       Allowed
 |
 +---- Admin Users   Allowed
```

Authorization is enforced by the backend.

Frontend UI restrictions are not treated as a security mechanism because users can directly call backend APIs.

---

# 21. Refresh Token Sessions

Refresh tokens are associated with server-side refresh sessions.

The session contains information such as:

```text
userId
jti
tokenHash
expiresAt
revokedAt
createdAt
```

The refresh endpoint validates:

1. Refresh token exists.
2. JWT signature is valid.
3. Required JWT claims exist.
4. JTI exists.
5. Refresh session exists.
6. Session is not revoked.
7. Session has not expired.
8. Session belongs to the same user.

Only after these checks is a new access token generated.

---

# 22. Refresh Token Rotation

**Refresh-token rotation is NOT implemented in this assessment version.**

The current implementation validates the existing refresh session and generates a new access token.

It does not claim to rotate the refresh token on every refresh.

A future production implementation could use:

```text
Refresh Token A
       |
       v
Validate A
       |
       v
Revoke A
       |
       v
Create Refresh Token B
       |
       v
Store B
       |
       v
Send B to Browser
```

This could also support refresh-token reuse detection.

This is documented as a future production improvement rather than an implemented feature.

---

# 23. Logout

Logout is handled by the backend.

The backend:

1. Identifies the refresh session.
2. Revokes the refresh session.
3. Clears authentication cookies.

The frontend then clears the user from React state.

Therefore, logout is not simply a frontend operation such as:

```js
setUser(null);
```

The server-side refresh session is also invalidated.

---

# 24. Password Change and JWT Revocation

Access JWTs are stateless.

Therefore, changing a password does not automatically invalidate an already-issued access token.

A practical strategy is:

```text
Password Change
       |
       +---- Revoke Refresh Sessions
       |
       +---- Existing Access Tokens Expire
```

Because access tokens are short-lived, the period during which an old token remains usable is limited.

For immediate access-token revocation, a production implementation could introduce:

* Token versioning
* Server-side token revocation
* Another centralized session invalidation mechanism

---

# 25. Prisma Migration Strategy

Database schema changes are managed through Prisma migrations.

Development:

```bash
npx prisma migrate dev
```

Production:

```bash
npx prisma migrate deploy
```

`prisma db push` is not used as the production schema-versioning strategy.

Production schema changes should follow:

```text
Modify Schema
      |
      v
Create Migration
      |
      v
Review Migration
      |
      v
Test Migration
      |
      v
Deploy Migration
      |
      v
Deploy Application
```

For major production changes, additional considerations include:

* Database backups
* Data migrations
* Backward compatibility
* Rollback/recovery strategy
* Deployment ordering

---

# 26. Evaluation Questions

## Q1. Why did you choose your JWT storage strategy and what are its risks?

### Answer

I chose HttpOnly cookies for access and refresh tokens because frontend JavaScript cannot directly read HttpOnly cookies.

This reduces direct exposure of authentication tokens to JavaScript and therefore reduces the impact of many XSS token-theft scenarios.

The trade-off is that cookie-based authentication requires careful CORS, cookie, and CSRF configuration.

The application uses:

```text
HttpOnly
SameSite=Strict
Secure in production
```

The refresh cookie is also restricted to the refresh endpoint path.

---

## Q2. What does your signin error response reveal and why did you choose that wording?

### Answer

The signin endpoint uses a generic authentication failure such as:

```text
Invalid credentials
```

It does not intentionally reveal whether an email exists.

For example, it does not distinguish between:

```text
Email does not exist
```

and:

```text
Incorrect password
```

This reduces account enumeration because attackers cannot easily determine which email addresses are registered.

---

## Q3. What happens if your JWT secret is leaked?

### Answer

A leaked JWT signing secret is a serious security issue.

If the access-token secret is compromised, an attacker may be able to create forged access tokens that the backend considers valid.

If the refresh-token secret is compromised, an attacker may potentially create valid refresh tokens with longer lifetimes.

The response should be:

1. Rotate the compromised secret.
2. Revoke affected refresh sessions.
3. Force re-authentication where necessary.
4. Investigate how the secret was exposed.
5. Ensure the new secret is stored securely.
6. Ensure secrets are not committed to source control.

Short-lived access tokens reduce the useful lifetime of compromised access tokens but do not make a leaked signing secret harmless.

---

## Q4. How does your Prisma schema prevent duplicate emails?

### Answer

The Prisma schema defines:

```prisma
email String @unique
```

This creates a database-level unique constraint.

This is more reliable than only checking whether an email exists before insertion because concurrent requests could otherwise pass the application-level check.

PostgreSQL prevents the duplicate and Prisma returns `P2002`.

The API converts this into:

```http
409 Conflict
```

with a safe `DUPLICATE_RESOURCE` response.

---

## Q5. What is your migration strategy if the User model changes in production?

### Answer

Schema changes are versioned through Prisma migrations.

The migration is generated, reviewed, tested, and then applied in production using:

```bash
npx prisma migrate deploy
```

I would not use `prisma db push` as the production schema-versioning strategy because migrations provide a versioned history of database changes.

For major changes, backups, data migration, compatibility, and rollback/recovery planning should also be considered.

---

## Q6. Which endpoint is most vulnerable to abuse and how did you address it?

### Answer

The **signin endpoint** is one of the most abuse-prone endpoints because attackers can repeatedly attempt credentials.

The current implementation addresses the baseline risks through:

* Backend validation
* bcrypt password hashing
* Generic authentication errors
* No intentional account enumeration
* Short-lived access tokens
* HttpOnly cookies

For a production deployment, I would additionally add:

* Rate limiting
* Progressive delays
* Authentication abuse monitoring

These are production improvements rather than features claimed as implemented in this assessment.

---

## Q7. How would you revoke a JWT issued before a password change?

### Answer

Access JWTs are stateless, so changing a password does not automatically invalidate an already-issued access token.

A practical approach is:

```text
Password Changed
       |
       v
Revoke Refresh Sessions
       |
       v
Old Access Token Eventually Expires
```

For immediate revocation, a token-version mechanism could be introduced.

For example:

```text
User tokenVersion = 5
JWT tokenVersion  = 5
```

After changing the password:

```text
User tokenVersion = 6
```

The old JWT containing version `5` would then fail validation.

---

## Q8. What would you change first if this were going to production tomorrow?

### Answer

The first production improvements would be:

### 1. Authentication Rate Limiting

Add rate limiting and progressive delays to signin and other sensitive authentication endpoints.

### 2. Refresh Token Rotation

Implement refresh-token rotation and reuse detection.

The current assessment version does **not** implement this.

### 3. Automated Testing

Add:

* Unit tests
* Integration tests
* Authentication flow tests
* Authorization tests
* Database tests
* End-to-end tests

and execute them automatically through CI.

### 4. Production Monitoring

Move beyond terminal-only error logging and introduce structured centralized logging, monitoring, and alerting.

### 5. Secret Management

Use production-grade secret storage and rotation procedures.

### 6. Database Recovery

Configure backups and regularly test database restoration.

### 7. Final Security Review

Perform a final review of:

* CSRF
* CORS
* Cookie configuration
* Authentication flows
* Authorization
* Rate limiting
* Dependency vulnerabilities

---

# 27. HTTP Status Code Strategy

| Situation                          |                 Status Code |
| ---------------------------------- | --------------------------: |
| Successful request                 |                    `200 OK` |
| Resource created                   |               `201 Created` |
| Invalid request / validation error |           `400 Bad Request` |
| Authentication failure             |          `401 Unauthorized` |
| Authenticated but forbidden        |             `403 Forbidden` |
| Resource not found                 |             `404 Not Found` |
| Duplicate resource                 |              `409 Conflict` |
| Unexpected server error            | `500 Internal Server Error` |

---

# 28. Authentication Error Codes

Examples include:

```text
TOKEN_NOT_FOUND
TOKEN_EXPIRED
INVALID_TOKEN

REFRESH_TOKEN_NOT_FOUND
REFRESH_TOKEN_EXPIRED
INVALID_REFRESH_TOKEN
INVALID_REFRESH_SESSION
REFRESH_TOKEN_REVOKED
REFRESH_SESSION_EXPIRED
```

The frontend can distinguish authentication situations using error codes instead of parsing human-readable messages.

For example:

```text
401 + TOKEN_EXPIRED
```

can trigger the refresh flow.

Whereas:

```text
401 + INVALID_TOKEN
```

should not blindly trigger a refresh.

---

# 29. Frontend Authentication State

The frontend stores only authenticated user information in React state.

It does not store:

```text
accessToken
refreshToken
JWT secret
```

The main authentication state is:

```text
user
loading
```

On application startup:

```text
React Starts
     |
     v
Check Current User
     |
     +---- Authenticated ---> setUser(user)
     |
     +---- Access Expired --> Refresh --> Retry
     |
     +---- Invalid Session -> setUser(null)
```

This allows authentication to survive page refreshes without storing JWTs in JavaScript-accessible browser storage.

---

# 30. API Request Wrapper

The frontend uses a centralized API request wrapper.

Its responsibilities are:

* Send API requests.
* Include credentials.
* Detect recoverable authentication errors.
* Refresh an expired/missing access token.
* Retry the original request.
* Return the backend success/error response.

The wrapper refreshes only for recoverable errors such as:

```text
TOKEN_EXPIRED
TOKEN_NOT_FOUND
```

It does not blindly refresh every `401`.

A shared refresh promise prevents multiple simultaneous requests from creating a refresh-request storm.

```text
Request A ----\
Request B -----+----> One Refresh Request
Request C ----/
                    |
                    v
               Retry Requests
```

---

# 31. Security Principles

The project follows these principles:

* Never trust frontend validation.
* Never store plaintext passwords.
* Use bcrypt for password hashing.
* Never return password hashes to clients.
* Store JWTs in HttpOnly cookies.
* Keep access tokens short-lived.
* Validate refresh sessions server-side.
* Use database constraints for important invariants.
* Handle Prisma errors explicitly.
* Use consistent API response structures.
* Do not expose internal server errors.
* Do not hardcode secrets.
* Enforce authorization on the backend.
* Select only required database fields.
* Avoid sensitive information in logs.

---

# 32. Weak Implementations Avoided

## Plaintext Passwords

```text
password = "mypassword123"
```

**Problem:** A database compromise immediately exposes user passwords.

---

## Fast Hashing Algorithms for Passwords

Using MD5 or SHA-256 directly for password storage makes large-scale password guessing easier because these algorithms are designed to be fast.

bcrypt is used instead.

---

## Returning the Entire Prisma User Object

Returning the complete database model can accidentally expose:

```text
passwordHash
internal fields
```

Only required fields should be returned.

---

## Relying Only on Frontend Validation

A malicious client can bypass React completely.

Backend validation is therefore mandatory.

---

## Storing JWTs in localStorage

Tokens stored in localStorage are accessible to JavaScript.

HttpOnly cookies were selected to prevent direct JavaScript access to authentication tokens.

---

## Revealing Whether an Email Exists

Different signin messages can enable account enumeration.

The application therefore uses generic authentication failures.

---

## Hardcoded Secrets

JWT secrets and database credentials should never be hardcoded into application source code.

---

## Using `db push` as the Production Migration Strategy

Production schema changes should be versioned through Prisma migrations.

---

# 33. Production Improvements

The current implementation focuses on the assessment requirements while avoiding unnecessary complexity.

For a real production deployment, additional improvements would include:

* Refresh-token rotation
* Refresh-token reuse detection
* Authentication rate limiting
* Progressive login delays
* Automated testing
* CI/CD security checks
* Centralized structured logging
* Application monitoring
* Alerting
* Database backups
* Disaster recovery testing
* Secret rotation
* Dependency vulnerability scanning
* More extensive CSRF protection depending on deployment architecture

These are documented as future improvements and are not represented as implemented features.

---

# 34. Assessment Completion Checklist

## Security

* [x] bcrypt password hashing
* [x] Backend validation
* [x] Frontend validation
* [x] Generic signin authentication errors
* [x] HttpOnly JWT cookies
* [x] Short-lived access tokens
* [x] Refresh-session validation
* [x] Backend role authorization
* [x] No unnecessary sensitive fields returned
* [x] Environment-based secrets

## API

* [x] Consistent success responses
* [x] Consistent error responses
* [x] Appropriate HTTP status codes
* [x] Explicit Prisma error handling
* [x] Authentication middleware
* [x] Authorization middleware

## Database

* [x] PostgreSQL
* [x] Prisma ORM
* [x] Unique email constraint
* [x] Refresh-token sessions
* [x] Selected fields in queries
* [x] Prisma migrations

## Frontend

* [x] React + TypeScript
* [x] AuthContext
* [x] Protected authentication flow
* [x] Centralized API request wrapper
* [x] Automatic access-token refresh
* [x] Profile management
* [x] Password change
* [x] Logout
* [x] Role-based UI handling

## Observability

* [x] Centralized error handler
* [x] Server-side error logging
* [x] Request context in error logs
* [x] HTTP status in error logs
* [x] Error code in error logs
* [x] Development stack traces
* [x] No intentional logging of passwords/tokens

## Future Production Improvements

* [ ] Refresh-token rotation
* [ ] Refresh-token reuse detection
* [ ] Authentication rate limiting
* [ ] Progressive login delays
* [ ] Automated test suite / CI
* [ ] Production monitoring
* [ ] Centralized structured logging
* [ ] Secret rotation infrastructure
* [ ] Database backup/recovery procedures

---

# 35. Final Summary

This project focuses on implementing a secure and maintainable authentication system rather than simply making the login functionality work.

The overall architecture is:

```text
React + TypeScript
        |
        | Frontend Validation
        v
API Request Wrapper
        |
        | HttpOnly Cookies
        v
Express Backend
        |
        +---- Backend Validation
        |
        +---- Authentication
        |
        +---- Authorization
        |
        +---- Controllers
        |
        +---- Global Error Handler
        |
        v
Prisma ORM
        |
        v
PostgreSQL
```

The main security decisions are:

* bcrypt for password hashing
* Independent backend validation
* HttpOnly JWT cookies
* Short-lived access tokens
* Server-side refresh sessions
* Backend role enforcement
* Database-level unique email constraint
* Explicit Prisma error handling
* Consistent API error responses
* Centralized backend error logging
* No sensitive authentication data in logs
* Environment-based secrets
* Prisma migrations for database changes

**Refresh-token rotation is intentionally not implemented in this assessment version and is documented as a future production improvement.**

The implementation balances security, maintainability, and reasonable scope while addressing the major authentication, API, database, frontend, architecture, and observability requirements of the assessment.
