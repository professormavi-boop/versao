'use strict';
const {PGlite}=require('@electric-sql/pglite'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema private;create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz,banned_until timestamptz);
 create table profiles(id uuid primary key,role text,approval_status text,admin_hidden boolean default false,organization_id uuid,requested_role text,full_name text,email text,updated_at timestamptz);
 create table organizations(id uuid primary key,name text,is_active boolean default true);
 create table academic_years(id uuid primary key,organization_id uuid);
 create table classes(id uuid primary key,name text,academic_year_id uuid,owner_teacher_id uuid,is_active boolean default true);
 create table teacher_organizations(organization_id uuid,teacher_id uuid);
 create table students(id uuid primary key,auth_user_id uuid,full_name text,organization_id uuid,is_active boolean default true);
 create table enrollments(id uuid primary key,student_id uuid,class_id uuid,is_active boolean default true);
 create table live_writing_drafts(id uuid primary key,owner_id uuid references profiles(id),theme text not null default '',content jsonb default '{}',version integer default 1,created_at timestamptz default now(),updated_at timestamptz default now());
 create table live_essays(id uuid primary key,owner_id uuid,correction_scope text);create table live_jobs(id uuid primary key,owner_id uuid,essay_id uuid);
 create table system_feature_flags(feature_key text primary key,is_enabled boolean,config jsonb);
 create table correction_credit_wallets(profile_id uuid,balance integer);
 create table correction_credit_ledger(profile_id uuid,event_type text);
 create function private.credit_wallet_add(uuid,integer,text,text,jsonb) returns integer language sql as 'select 1';`);
 const path=fs.readdirSync('backend/writing/supabase/migrations').find(p=>p.endsWith('_guided_writing_complete.sql'));
 await db.exec(fs.readFileSync('backend/writing/supabase/migrations/'+path,'utf8'));
 const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,teacher=id(1),otherTeacher=id(2),student=id(3),outsider=id(4),org=id(5),year=id(6),klass=id(7),activity=id(8);
 for(const [u,role]of [[teacher,'teacher'],[otherTeacher,'teacher'],[student,'student'],[outsider,'student']])await db.query("insert into profiles(id,role,approval_status,organization_id) values($1,$2,'approved',$3)",[u,role,org]);
 await db.query("insert into organizations(id,name) values($1,'Escola')",[org]);await db.query('insert into academic_years values($1,$2)',[year,org]);await db.query("insert into classes(id,name,academic_year_id,owner_teacher_id) values($1,'Turma', $2,$3)",[klass,year,teacher]);await db.query('insert into teacher_organizations values($1,$2)',[org,teacher]);
 await db.query("insert into students(id,auth_user_id,full_name,organization_id) values($1,$2,'Aluno',$3)",[id(9),student,org]);await db.query('insert into enrollments(id,student_id,class_id) values($1,$2,$3)',[id(10),id(9),klass]);
 const dispatch=async(actor,body)=>(await db.query('select writing_dispatch($1,$2) as v',[actor,body])).rows[0].v;
 let a=(await dispatch(teacher,{action:'writing_activity_save',id:activity,class_id:klass,name:'Aula de introdução',theme:'Desafios da leitura no Brasil',stages:['introduction'],version:0})).activity;
 await assert.rejects(dispatch(otherTeacher,{action:'writing_activity_get',id:activity}));await assert.rejects(dispatch(outsider,{action:'writing_join',id:activity}));
 const joined=await dispatch(student,{action:'writing_join',id:activity}),draft=joined.draft;
 assert.equal((await dispatch(student,{action:'writing_join',id:activity})).draft.id,draft.id,'Join is idempotent');
 assert.equal((await dispatch(teacher,{action:'writing_activity_get',id:activity})).students.length,1);
 const content=structuredClone(draft.content);content.stages.development1.text='Não autorizado';
 await assert.rejects(db.query('update live_writing_drafts set content=$1,version=version+1 where id=$2',[content,draft.id]),/etapa.*liberada/);
 content.stages.development1.text='';content.stages.introduction.text='Texto do aluno';await db.query('update live_writing_drafts set content=$1,version=version+1 where id=$2',[content,draft.id]);
 const details=await dispatch(teacher,{action:'writing_detail',id:draft.id});assert.equal(details.revisions.length,2);await assert.rejects(dispatch(otherTeacher,{action:'writing_detail',id:draft.id}));
 await assert.rejects(dispatch(teacher,{action:'writing_activity_save',id:activity,class_id:klass,name:a.name,theme:'Outro tema para trocar',stages:['introduction'],is_active:true,version:a.version}),/tema já iniciado/);
 a=(await dispatch(teacher,{action:'writing_activity_save',id:activity,class_id:klass,name:a.name,theme:a.theme,stages:['introduction','development1'],is_active:true,version:a.version})).activity;
 await db.exec("update system_feature_flags set is_enabled=true where feature_key='writing_guided'");
 const claim=async(actor,request=id(12),stage='introduction',version=2)=>(await db.query('select claim_writing_guidance($1,$2,$3,$4,$5,$6) as v',[actor,draft.id,version,stage,request,'Como começo?'])).rows[0].v;
 const g=await claim(student);assert(g.claimed);assert.equal((await claim(student)).claimed,false);await assert.rejects(claim(student,id(30)),/Aguarde/);await assert.rejects(claim(teacher));await assert.rejects(claim(student,id(13),'conclusion'));
 await db.query('select finish_writing_guidance($1,$2,$3,null)',[student,id(12),{objective:'Planeje',questions:['Qual problema?'],task:'Escolha um recorte.',context_note:'',evidence:''}]);assert.equal((await claim(student)).guidance.status,'completed');
 // Free testing has no daily commercial quota; every call remains a receipt.
 for(let i=31;i<47;i++){assert((await claim(student,id(i))).claimed);await db.query('select finish_writing_guidance($1,$2,$3,null)',[student,id(i),{objective:'Planeje',questions:['Qual problema?'],task:'Revise.',context_note:'',evidence:''}]);}
 assert.equal((await db.query('select count(*)::int as n from writing_guidance where owner_id=$1',[student])).rows[0].n,17);
 await dispatch(teacher,{action:'writing_comment',id:draft.id,version:2,stage:'introduction',comment:'Delimite o problema.',request_id:id(15)});assert.equal((await dispatch(student,{action:'writing_detail',id:draft.id})).comments.length,1);
 await assert.rejects(dispatch(student,{action:'writing_comment',id:draft.id,version:2,stage:'introduction',comment:'Forjado',request_id:id(16)}));
 // Private drafts are never visible to a teacher, even from the same school.
 await db.query('insert into live_writing_drafts(id,owner_id) values($1,$2)',[id(17),student]);await assert.rejects(dispatch(teacher,{action:'writing_detail',id:id(17)}));
 await db.exec('update enrollments set is_active=false');await assert.rejects(dispatch(teacher,{action:'writing_detail',id:draft.id}));
 const grants=(await db.query("select has_table_privilege('authenticated','writing_guidance','select') as exposed,has_function_privilege('anon','writing_dispatch(uuid,jsonb)','execute') as callable")).rows[0];assert.equal(grants.exposed,false);assert.equal(grants.callable,false);
 // Independent registration cannot convert a teacher, nor bypass approval.
 await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'independent@example.test',now())",[id(20)]);await db.query("insert into profiles(id,role,requested_role,approval_status) values($1,'pending','student','pending')",[id(20)]);
 await assert.rejects(db.query("select complete_independent_student($1,'Aluno independente',true,'2026-09-28')",[id(20)]));await db.exec(fs.readFileSync('backend/writing/enable-student-signup.sql','utf8'));
 const completed=(await db.query("select complete_independent_student($1,'Aluno independente',true,'2026-09-28') as v",[id(20)])).rows[0].v;assert.equal(completed.pending,true);assert.equal((await db.query('select approval_status from profiles where id=$1',[id(20)])).rows[0].approval_status,'pending');
 await db.query("insert into live_essays(id,owner_id,correction_scope,writing_context) values($1,$2,'development1',$3)",[id(25),student,{introduction:'Minha tese'}]);await db.query('insert into live_jobs(id,owner_id,essay_id) values($1,$2,$3)',[id(26),student,id(25)]);assert.equal((await db.query('select context_snapshot from live_jobs where id=$1',[id(26)])).rows[0].context_snapshot.introduction,'Minha tese');await assert.rejects(db.query('update live_jobs set context_snapshot=$1 where id=$2',[{},id(26)]));
 // Match the production invoker role; running only as postgres missed this error.
 await db.exec('grant usage on schema public to service_role;grant select on profiles,live_writing_drafts,classes,academic_years,teacher_organizations,enrollments,students to service_role;alter role service_role bypassrls;set role service_role');
 await assert.rejects(db.query('select writing_access($1,$2)',[student,id(17)]),/permission denied for schema private/);
 await db.exec('reset role');await db.exec(fs.readFileSync('backend/writing/private-schema-access.sql','utf8'));
 assert.equal((await db.query("select has_schema_privilege('service_role','private','usage') as allowed,has_schema_privilege('anon','private','usage') as anon,has_schema_privilege('authenticated','private','usage') as client")).rows[0].allowed,true);
 await db.exec('set role service_role');assert.equal((await db.query('select writing_access($1,$2) as v',[student,id(17)])).rows[0].v.draft.owner_id,student);
 await assert.rejects(db.query('select writing_access($1,$2)',[outsider,id(17)]),/Produção não encontrada/);await db.exec('reset role');
 const after=(await db.query("select has_schema_privilege('anon','private','usage') as anon,has_schema_privilege('authenticated','private','usage') as client")).rows[0];assert.equal(after.anon,false);assert.equal(after.client,false);
 await db.close();console.log('PASS guided SQL: class membership, teacher ownership, locked stages, versions, private drafts, tutor idempotency, comments, revoked enrollment and independent approval.');
})().catch(e=>{console.error(e);process.exitCode=1});
