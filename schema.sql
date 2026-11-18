PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS internships (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 3 AND 120),
 company TEXT NOT NULL CHECK(length(trim(company)) BETWEEN 2 AND 100),
 domain TEXT NOT NULL CHECK(domain IN ('Technology','Design','Marketing','Business')),
 location TEXT NOT NULL CHECK(length(trim(location)) BETWEEN 2 AND 120),
 work_mode TEXT NOT NULL CHECK(work_mode IN ('Remote','Hybrid','On-site')),
 employment_type TEXT NOT NULL CHECK(employment_type IN ('Full-time','Part-time')),
 duration_months INTEGER NOT NULL CHECK(duration_months BETWEEN 1 AND 24),
 stipend_inr INTEGER NOT NULL CHECK(stipend_inr >= 0),
 description TEXT NOT NULL CHECK(length(trim(description)) BETWEEN 10 AND 2000),
 application_url TEXT NOT NULL CHECK(application_url LIKE 'https://%'),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_internships_domain ON internships(domain);
