# CivicFix

Full-stack civic issue reporting platform with a React/Vite frontend, Express API, and MongoDB persistence.

## Run locally

1. Install Node.js 18+ and start MongoDB (MongoDB Compass can connect to the same local instance).
2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and `JWT_SECRET`.
3. Run `npm install` in the root, then `npm run install:all`.
4. Run `npm run dev` from the root. The client is at `http://localhost:5173` and the API at `http://localhost:5051`.

The client has a demo fallback with sample reports when the API/database is unavailable, so the interface can still be reviewed. Real account, report, status, comments, search, filtering, and deletion data are handled through the API once MongoDB is connected.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/reports`, `GET /api/reports/stats`
- `POST /api/reports`, `PATCH /api/reports/:id`, `DELETE /api/reports/:id`
- `POST /api/reports/:id/comments` for admins
