# Internship Board API

Beginner-friendly REST API for predictable internship CRUD operations, built with Node.js, Express, and SQLite.

## Setup
Requirements: Node.js 20+ and npm.
```bash
npm install
npm run seed
npm start
```
API base URL: `http://localhost:3000`. Run tests with `npm test`.

## Endpoints
| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | `/health` | Health check | 200 |
| GET | `/api/internships` | List/search/filter/paginate | 200 |
| GET | `/api/internships/:id` | Read one | 200 |
| POST | `/api/internships` | Create | 201 |
| PATCH | `/api/internships/:id` | Partial update | 200 |
| DELETE | `/api/internships/:id` | Delete | 200 |

List query parameters: `domain` (Technology, Design, Marketing, Business), `search` (title/company/description), `page` (default 1), `limit` (default 10, max 50).

## Data contract
All create fields are required. `title` string 3–120 chars; `company` 2–100; `domain` one of the four domains; `location` 2–120; `work_mode` Remote/Hybrid/On-site; `employment_type` Full-time/Part-time; `duration_months` integer 1–24; `stipend_inr` non-negative integer; `description` 10–2000 chars; `application_url` valid HTTPS URL. PATCH accepts one or more of these fields. Unknown fields are rejected.

## Response contract
Collection: `{"success":true,"data":[],"meta":{"page":1,"limit":10,"total":0,"total_pages":0}}`
Single record: `{"success":true,"data":{"id":1,...}}`
Error: `{"success":false,"error":{"code":"NOT_FOUND","message":"Internship 999 was not found."}}`

## Status codes
200 success; 201 created (also sends Location header); 400 malformed JSON/invalid ID/query/unknown fields/empty update; 404 missing record or route; 422 validation failure with field details; 500 unexpected server error (internal details hidden).

## Project files
- `src/server.js`: routes, validation, error handling
- `src/seed.js`: idempotent seed runner
- `src/server.test.js`: automated API tests
- `data/schema.sql`: SQLite schema/index
- `data/seed.json`: fictional sample records
- `examples/requests.md`: cURL examples

## Deployment
Use a Node.js host with persistent disk storage. Set `DB_PATH` to a persistent disk path; the host's `PORT` is used automatically. On Render: Web Service, Build Command `npm install`, Start Command `npm start`; attach persistent disk mounted at `/var/data`, and set `DB_PATH=/var/data/internships.db`.

**Demo data note:** Seed records and example.com application URLs are fictional placeholders. Replace them with verified listings before production use.
