# Student Peer Feedback System

## 1) File tree

This repository contains a full-stack MERN app with a Node/Express API in the server folder and a Vite + React frontend in the client folder.

- .gitignore — ignores dependency folders, environment files, and build artifacts.
- PROJECT_NOTES.md — project-level documentation, architecture notes, and common failure guidance.
- server/.env — local environment values used by the API; includes the MongoDB and JWT secrets required at runtime.
- server/.env.example — example environment file with placeholder values for safe setup.
- server/package.json — backend package manifest and scripts for development and production.
- server/src/app.js — Express app setup, CORS, JSON parsing, route mounting, and centralized error handlers.
- server/src/server.js — boots the Express app and connects MongoDB on startup.
- server/src/config/db.js — opens the MongoDB connection and logs the database host once connected.
- server/src/config/env.js — loads environment values from the .env file.
- server/src/models/User.js — user model with name, email, password, department, year, and role.
- server/src/models/Feedback.js — feedback model with category, rating, comment, anonymity flag, and indexes.
- server/src/middleware/asyncHandler.js — wraps async route handlers so errors are passed to Express error middleware.
- server/src/middleware/authMiddleware.js — validates the JWT and attaches the authenticated user to the request object.
- server/src/middleware/errorHandler.js — centralizes 404 and error responses.
- server/src/controllers/authController.js — register, login, and me endpoints.
- server/src/controllers/userController.js — searchable student list endpoint.
- server/src/controllers/feedbackController.js — create feedback, received dashboard, and given dashboard logic.
- server/src/routes/authRoutes.js — auth endpoints and validation rules.
- server/src/routes/userRoutes.js — student search endpoint.
- server/src/routes/feedbackRoutes.js — create and dashboard feedback routes.
- client/package.json — frontend package manifest and Vite scripts.
- client/vite.config.js — Vite config with the /api proxy to localhost:5000.
- client/index.html — HTML entry point.
- client/src/main.jsx — app bootstrap and provider wiring.
- client/src/App.jsx — top-level route tree and protected-page logic.
- client/src/index.css — full styling for the entire application without any UI library.
- client/src/api/axios.js — Axios instance configured with the base URL and auth token interceptor.
- client/src/context/AuthContext.jsx — stores user state, token persistence, and session restore logic.
- client/src/components/ProtectedRoute.jsx — blocks guests from private pages.
- client/src/components/Navbar.jsx — top navigation with Students, My Feedback, and Logout.
- client/src/pages/AuthPage.jsx — combined login/register form.
- client/src/pages/StudentsPage.jsx — searchable student list and inline feedback form.
- client/src/pages/DashboardPage.jsx — received/given feedback tabs, averages, and category summary.

## 2) API endpoints

### Authentication

- POST /api/auth/register
  - Auth required: No
  - Request body:
    - name: string
    - email: string
    - password: string, minimum 6 characters
    - department: string
    - year: integer, 1-8
  - Response shape:
    - token: JWT string
    - user: { _id, name, email, department, year, role }
  - Errors:
    - 400 for validation or duplicate email
    - 500 for unexpected server errors

- POST /api/auth/login
  - Auth required: No
  - Request body:
    - email: string
    - password: string
  - Response shape:
    - token: JWT string
    - user: { _id, name, email, department, year, role }
  - Errors:
    - 400 for validation issues
    - 401 for invalid credentials

- GET /api/auth/me
  - Auth required: Yes
  - Request body: none
  - Response shape:
    - user: { _id, name, email, department, year, role }
  - Errors:
    - 401 if token is missing or invalid

### Students

- GET /api/users?search=
  - Auth required: Yes
  - Request body: none
  - Response shape:
    - users: [{ _id, name, department, year }]
  - Errors:
    - 401 if not authenticated
    - 500 if database fails

### Feedback

- POST /api/feedback
  - Auth required: Yes
  - Request body:
    - to: string (recipient user id)
    - category: one of teamwork, communication, technical, helpfulness
    - rating: integer 1-5
    - comment: string, required, max 500 chars
    - anonymous: boolean
  - Response shape:
    - feedback: created feedback document
  - Errors:
    - 400 for validation or self-feedback
    - 404 if recipient is missing
    - 429 if same sender/category/recipient was used within the last 30 days
    - 401 if token is invalid

- GET /api/feedback/received
  - Auth required: Yes
  - Request body: none
  - Response shape:
    - feedback: [{ ...feedback fields, from: user or null }]
    - overallAverage: number
    - feedbackCount: number
    - categoryAverage: { teamwork: { average: number, count: number }, ... }
  - Errors:
    - 401 if not authenticated

- GET /api/feedback/given
  - Auth required: Yes
  - Request body: none
  - Response shape:
    - feedback: [{ ...feedback fields, to: user object }]
  - Errors:
    - 401 if not authenticated

### Health

- GET /api/health
  - Auth required: No
  - Request body: none
  - Response shape:
    - { status: 'ok', message: 'Server is healthy' }
  - Errors:
    - none for the happy path

## 3) Data models and indexes

### User

Fields:
- name: String, required
- email: String, required, unique, lowercase, trimmed
- password: String, required, minimum 6, select: false
- department: String, required
- year: Number, required, 1-8
- role: String, enum [student, admin], default student
- createdAt: Date
- updatedAt: Date

Indexes:
- default unique index on email

### Feedback

Fields:
- from: ObjectId reference to User, required
- to: ObjectId reference to User, required
- category: String enum [teamwork, communication, technical, helpfulness], required
- rating: Number 1-5, required
- comment: String, required, max 500
- anonymous: Boolean, default false
- createdAt: Date
- updatedAt: Date

Indexes:
- { to: 1, createdAt: -1 }
- { from: 1, to: 1, category: 1, createdAt: -1 }

## 4) Request flows (plain English)

### Register flow
1. User opens the auth page and switches to Register.
2. The form sends a POST request to /api/auth/register with name, email, password, department, and year.
3. The server validates each field with express-validator.
4. If the email already exists, the server rejects the request with a 400.
5. The password is hashed with bcrypt.
6. The user is saved to MongoDB.
7. The server creates a JWT with a 7-day expiration and returns it in the API response.
8. The client stores the token in localStorage and sets the authenticated user in AuthContext.

### Login flow
1. User submits email and password to POST /api/auth/login.
2. The API finds the user by email and compares the password hash with bcrypt.
3. If valid, a JWT is created and returned.
4. The client saves the token and loads the user into state.
5. Later requests include the token as Authorization: Bearer <token> via the Axios request interceptor.

### Token check on a protected route
1. A request hits a protected endpoint.
2. The server reads the Authorization header and extracts the Bearer token.
3. The JWT is verified using JWT_SECRET.
4. The user ID is read from the token and the database is queried.
5. If the user is found, req.user is attached and the route continues.
6. If the token is missing or invalid, the server responds with 401.

### Giving feedback validation order
1. The client sends { to, category, rating, comment, anonymous } to POST /api/feedback.
2. The server validates that to is a valid Mongo ObjectId.
3. It validates category is one of the four allowed values.
4. It validates rating is an integer between 1 and 5.
5. It validates comment is non-empty and no longer than 500 characters.
6. It rejects feedback to self with a 400.
7. It checks if the recipient exists; otherwise 404.
8. It checks whether the same sender already gave the same category to the same recipient in the last 30 days; if so, 429.
9. It stores the feedback record.
10. It returns the created feedback object.

### Loading the received dashboard and anonymity enforcement
1. The client requests GET /api/feedback/received.
2. The backend loads all feedback where to matches the current user.
3. It populates the sender and recipient profiles for the dashboard.
4. Before responding, it converts any anonymous feedback to from: null, even if a sender object was fetched earlier.
5. The dashboard returns overall average, total count, and category averages from MongoDB aggregation.
6. The frontend renders the sender as "Anonymous" when from is null.

## 5) How the frontend works

### AuthContext session restore
- On app launch, AuthContext reads studentFeedbackToken from localStorage.
- If there is no token, the app stays signed out.
- If a token exists, it requests GET /api/auth/me.
- If the token is valid, the user object is stored in React state.
- If the token fails, it is removed from localStorage and the user is signed out.

### Axios interceptor
- The Axios instance is created with a baseURL of /api.
- The request interceptor reads the token from localStorage.
- If it exists, it adds Authorization: Bearer <token> to the outgoing request.
- This applies to every call to protected endpoints.

### Vite proxy
- The Vite dev server is configured in client/vite.config.js.
- Any request starting with /api is forwarded to http://localhost:5000.
- This keeps the browser-facing app on the Vite default port 5173 while the backend runs on 5000.

## 6) Common problems

### MongoDB connection errors
- Symptom: The server logs "MongoDB connection error" or fails to start.
- Cause: Invalid MongoDB URI, wrong username/password, expired Atlas credentials, or IP access restrictions in Atlas.
- Where to look: server/src/config/db.js and the MongoDB Atlas network access settings.
- Fix: Verify the cluster is reachable from the machine and that the IP is whitelisted; do not change the provided connection string unless the Atlas account itself has been reset.

### 401 on every request
- Symptom: Protected routes reject every call returning 401.
- Cause: Missing or expired JWT, invalid Authorization header format, or stale token in localStorage.
- Where to look: server/src/middleware/authMiddleware.js and client/src/api/axios.js.
- Fix: Ensure the client sends Authorization: Bearer <token> and clear localStorage if the token is stale.

### CORS or proxy errors
- Symptom: Frontend requests fail with CORS or network errors even though the backend is running.
- Cause: Missing CORS configuration on the API or the Vite proxy is not forwarding /api requests.
- Where to look: server/src/app.js and client/vite.config.js.
- Fix: Confirm the backend has cors() enabled, and that the browser is calling the Vite dev server at port 5173.

### 429 on feedback
- Symptom: A valid feedback submission fails with a 429.
- Cause: The same sender already submitted the same category to the same recipient within the last 30 days.
- Where to look: server/src/controllers/feedbackController.js.
- Fix: Wait 30 days or choose a different category or recipient.

### Blank page after login
- Symptom: The app loads but the route never renders content.
- Cause: Protected route loops, AuthContext has not restored the session, or the app is not mounting the Router correctly.
- Where to look: client/src/App.jsx, client/src/main.jsx, and client/src/context/AuthContext.jsx.
- Fix: Check the browser console for API 401 errors and confirm the root route is wrapped with BrowserRouter and AuthProvider.

## Start instructions

1. In one terminal, start the backend:
   - cd server
   - npm install
   - npm run dev
2. In another terminal, start the frontend:
   - cd client
   - npm install
   - npm run dev
3. Open the frontend at http://localhost:5173.

> In a clean local environment with port 5000 available, the backend logs should show "MongoDB connected" and "Server running on port 5000".
> In this workspace, a persistent VS Code helper process was previously holding port 5000, which caused EADDRINUSE. The app code itself is correct, but the port conflict must be cleared before the backend can bind cleanly.
