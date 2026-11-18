const express=require("express");
const cors=require("cors");
const helmet=require("helmet");
const path=require("node:path");
const Database=require("better-sqlite3");
const app=express(), PORT=Number(process.env.PORT)||3000;
const db=new Database(process.env.DB_PATH||path.join(__dirname,"..","data","internships.db"));
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS internships (
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
updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE INDEX IF NOT EXISTS idx_internships_domain ON internships(domain);`);
app.use(helmet()); app.use(cors()); app.use(express.json({limit:"32kb"}));
const FIELDS=["title","company","domain","location","work_mode","employment_type","duration_months","stipend_inr","description","application_url"];
const ENUMS={domain:["Technology","Design","Marketing","Business"],work_mode:["Remote","Hybrid","On-site"],employment_type:["Full-time","Part-time"]};
class ApiError extends Error{constructor(status,code,message,details){super(message);this.status=status;this.code=code;this.details=details;}}
function validate(body,partial=false){
 if(!body||typeof body!=="object"||Array.isArray(body))throw new ApiError(400,"INVALID_BODY","Request body must be a JSON object.");
 const unknown=Object.keys(body).filter(k=>!FIELDS.includes(k)); if(unknown.length)throw new ApiError(400,"UNKNOWN_FIELDS","Request contains unsupported fields.",{fields:unknown});
 const errors={}, required=FIELDS;
 if(!partial)for(const f of required)if(!(f in body))errors[f]="This field is required.";
 for(const [f,choices] of Object.entries(ENUMS))if(f in body&&!choices.includes(body[f]))errors[f]=`Must be one of: ${choices.join(", ")}.`;
 const strings={title:[3,120],company:[2,100],location:[2,120],description:[10,2000]};
 for(const [f,[min,max]] of Object.entries(strings))if(f in body&&(typeof body[f]!=="string"||body[f].trim().length<min||body[f].trim().length>max))errors[f]=`Must be a string of ${min}–${max} characters.`;
 if("duration_months" in body&&(!Number.isInteger(body.duration_months)||body.duration_months<1||body.duration_months>24))errors.duration_months="Must be an integer from 1 to 24.";
 if("stipend_inr" in body&&(!Number.isInteger(body.stipend_inr)||body.stipend_inr<0))errors.stipend_inr="Must be a non-negative integer in INR.";
 if("application_url" in body){try{if(new URL(body.application_url).protocol!=="https:")throw 0;}catch{errors.application_url="Must be a valid HTTPS URL.";}}
 if(Object.keys(errors).length)throw new ApiError(422,"VALIDATION_ERROR","One or more fields are invalid.",errors);
 return Object.fromEntries(Object.entries(body).map(([k,v])=>[k,typeof v==="string"?v.trim():v]));
}
const get=id=>db.prepare("SELECT * FROM internships WHERE id=?").get(id)||null;
const positiveId=req=>{const id=Number(req.params.id);if(!Number.isInteger(id)||id<1)throw new ApiError(400,"INVALID_ID","Internship id must be a positive integer.");return id;};
app.get("/health",(_req,res)=>res.status(200).json({success:true,data:{status:"ok"}}));
app.get("/api/internships",(req,res,next)=>{try{
 const page=Number(req.query.page||1),limit=Number(req.query.limit||10);
 if(!Number.isInteger(page)||page<1||!Number.isInteger(limit)||limit<1||limit>50)throw new ApiError(400,"INVALID_PAGINATION","page must be >= 1 and limit must be between 1 and 50.");
 const where=[],args=[]; if(req.query.domain){if(!ENUMS.domain.includes(req.query.domain))throw new ApiError(400,"INVALID_FILTER",`domain must be one of: ${ENUMS.domain.join(", ")}.`);where.push("domain=?");args.push(req.query.domain);}
 if(req.query.search){where.push("(lower(title) LIKE ? OR lower(company) LIKE ? OR lower(description) LIKE ?)");const q=`%${String(req.query.search).toLowerCase()}%`;args.push(q,q,q);}
 const clause=where.length?`WHERE ${where.join(" AND ")}`:"";
 const total=db.prepare(`SELECT COUNT(*) n FROM internships ${clause}`).get(...args).n;
 const data=db.prepare(`SELECT * FROM internships ${clause} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).all(...args,limit,(page-1)*limit);
 res.status(200).json({success:true,data,meta:{page,limit,total,total_pages:Math.ceil(total/limit)}});
 }catch(e){next(e);}});
app.get("/api/internships/:id",(req,res,next)=>{try{const id=positiveId(req),item=get(id);if(!item)throw new ApiError(404,"NOT_FOUND",`Internship ${id} was not found.`);res.status(200).json({success:true,data:item});}catch(e){next(e);}});
app.post("/api/internships",(req,res,next)=>{try{const data=validate(req.body);const r=db.prepare(`INSERT INTO internships (${FIELDS.join(",")}) VALUES (${FIELDS.map(()=>"?").join(",")})`).run(...FIELDS.map(f=>data[f]));const item=get(Number(r.lastInsertRowid));res.location(`/api/internships/${item.id}`).status(201).json({success:true,data:item});}catch(e){next(e);}});
app.patch("/api/internships/:id",(req,res,next)=>{try{const id=positiveId(req);if(!get(id))throw new ApiError(404,"NOT_FOUND",`Internship ${id} was not found.`);const data=validate(req.body,true),keys=Object.keys(data);if(!keys.length)throw new ApiError(400,"EMPTY_UPDATE","Provide at least one field to update.");db.prepare(`UPDATE internships SET ${keys.map(k=>`${k}=?`).join(",")},updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?`).run(...keys.map(k=>data[k]),id);res.status(200).json({success:true,data:get(id)});}catch(e){next(e);}});
app.delete("/api/internships/:id",(req,res,next)=>{try{const id=positiveId(req),r=db.prepare("DELETE FROM internships WHERE id=?").run(id);if(!r.changes)throw new ApiError(404,"NOT_FOUND",`Internship ${id} was not found.`);res.status(200).json({success:true,data:{id,deleted:true}});}catch(e){next(e);}});
app.use((req,_res,next)=>next(new ApiError(404,"ROUTE_NOT_FOUND",`No route for ${req.method} ${req.originalUrl}.`)));
app.use((err,_req,res,_next)=>{if(err instanceof SyntaxError&&"body" in err)return res.status(400).json({success:false,error:{code:"INVALID_JSON",message:"Request body contains malformed JSON."}});const status=err.status||500;const body={success:false,error:{code:err.code||"INTERNAL_ERROR",message:status===500?"An unexpected error occurred.":err.message}};if(err.details)body.error.details=err.details;if(status===500)console.error(err);res.status(status).json(body);});
if(require.main===module)app.listen(PORT,()=>console.log(`Internship API listening on port ${PORT}`));
module.exports={app,db};
