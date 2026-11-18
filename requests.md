# cURL examples (local base URL: http://localhost:3000)

Health: `curl http://localhost:3000/health`

List/filter: `curl "http://localhost:3000/api/internships?domain=Technology&search=frontend&page=1&limit=10"`

Read: `curl http://localhost:3000/api/internships/1`

Create:
```bash
curl -X POST http://localhost:3000/api/internships -H "Content-Type: application/json" -d '{"title":"Backend Developer Intern","company":"Example Labs","domain":"Technology","location":"Remote, India","work_mode":"Remote","employment_type":"Part-time","duration_months":3,"stipend_inr":8000,"description":"Build and test API endpoints with an engineering team.","application_url":"https://example.com/apply/backend"}'
```

Partial update:
```bash
curl -X PATCH http://localhost:3000/api/internships/1 -H "Content-Type: application/json" -d '{"stipend_inr":9500}'
```

Delete: `curl -X DELETE http://localhost:3000/api/internships/1`
