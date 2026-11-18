const fs=require('node:fs'); const path=require('node:path'); const Database=require('better-sqlite3');
const db=new Database(process.env.DB_PATH||path.join(__dirname,'..','data','internships.db'));
db.exec(fs.readFileSync(path.join(__dirname,'..','data','schema.sql'),'utf8'));
const records=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','seed.json'),'utf8'));
const count=db.prepare('SELECT COUNT(*) AS n FROM internships').get().n;
if(count){console.log('Database already has records; seed skipped.');}
else {const insert=db.prepare(`INSERT INTO internships (title,company,domain,location,work_mode,employment_type,duration_months,stipend_inr,description,application_url) VALUES (@title,@company,@domain,@location,@work_mode,@employment_type,@duration_months,@stipend_inr,@description,@application_url)`);
const tx=db.transaction(rows=>rows.forEach(row=>insert.run(row))); tx(records); console.log(`Inserted ${records.length} sample records.`);}
db.close();
