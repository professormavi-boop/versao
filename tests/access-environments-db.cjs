const {PGlite}=require('@electric-sql/pglite'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite(),id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE SCHEMA private;
 CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid,created_at timestamptz DEFAULT now(),not_after timestamptz);
 CREATE TABLE platform_access_events(session_id uuid PRIMARY KEY,profile_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
 ALTER TABLE platform_access_events ENABLE ROW LEVEL SECURITY;
 CREATE TABLE system_feature_flags(feature_key text PRIMARY KEY,config jsonb);
 INSERT INTO system_feature_flags VALUES('platform_access_tracking','{"started_at":"2026-10-02T17:12:42.589471+00:00","metric":"new_authenticated_sessions"}');
 CREATE FUNCTION private.record_platform_session() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 INSERT INTO public.platform_access_events(session_id,profile_id,created_at) VALUES(NEW.id,NEW.user_id,coalesce(NEW.created_at,now())) ON CONFLICT(session_id) DO NOTHING;
 RETURN NEW; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'platform_access_event_not_recorded'; RETURN NEW; END $$;
 CREATE TRIGGER platform_session_created AFTER INSERT ON auth.sessions FOR EACH ROW EXECUTE FUNCTION private.record_platform_session();
 GRANT USAGE ON SCHEMA public TO service_role,anon,authenticated;`);
 await db.query("INSERT INTO auth.sessions VALUES($1,$2,now()-interval '1 day',null)",[id(1),id(100)]);
 const before=(await db.query('SELECT * FROM platform_access_events')).rows;
 await db.exec(fs.readFileSync('backend/admin/access-environments.sql','utf8'));
 assert.deepEqual((await db.query('SELECT * FROM platform_access_events')).rows,before);
 for(let n=2;n<=8;n++)await db.query('INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)',[id(n),id(100)]);
 const invoke=async(n,actor=100,origin='https://app.versaoprofessor.com')=>{
  await db.exec('SET ROLE service_role');try{return (await db.query('SELECT attribute_platform_access($1,$2,$3) AS ok',[id(actor),id(n),origin])).rows[0].ok;}finally{await db.exec('RESET ROLE')}
 };
 assert.equal(await invoke(1),false,'historical event must never be attributed');
 assert.equal(await invoke(2),true);assert.equal(await invoke(2,100,'https://teste.versaoprofessor.com'),false,'first observation immutable');
 assert.equal(await invoke(3,100,'https://teste.versaoprofessor.com'),true);
 assert.equal(await invoke(4,999),false,'actor mismatch');
 assert.equal(await invoke(4,100,'https://app.versaoprofessor.com.evil.test'),false);
 assert.equal(await invoke(4,100,'http://app.versaoprofessor.com'),false);
 assert.equal(await invoke(4,100,null),false);
 await db.query('DELETE FROM auth.sessions WHERE id=$1',[id(5)]);assert.equal(await invoke(5),false,'revoked session');
 await db.query("UPDATE auth.sessions SET not_after=now()-interval '1 second' WHERE id=$1",[id(6)]);assert.equal(await invoke(6),false,'expired session');
 await db.query("UPDATE auth.sessions SET created_at=now()-interval '6 minutes' WHERE id=$1",[id(7)]);assert.equal(await invoke(7),false,'late observation');
 await db.query("UPDATE auth.sessions SET created_at=now()+interval '1 minute' WHERE id=$1",[id(8)]);assert.equal(await invoke(8),false,'future session');
 assert.equal((await db.query('SELECT count(*)::int n FROM platform_access_events')).rows[0].n,8,'original events retained');
 assert.equal((await db.query('SELECT count(*)::int n FROM platform_access_environments')).rows[0].n,2);
 for(const role of ['anon','authenticated']){await db.exec('SET ROLE '+role);await assert.rejects(db.query('SELECT attribute_platform_access($1,$2,$3)',[id(100),id(4),'https://app.versaoprofessor.com']),/permission denied/);await assert.rejects(db.query('SELECT * FROM platform_access_environments'),/permission denied/);await db.exec('RESET ROLE')}
 await db.exec('SET ROLE service_role');await assert.rejects(db.query('DELETE FROM platform_access_environments'),/permission denied/);await db.exec('RESET ROLE');
 await db.exec(fs.readFileSync('backend/admin/rollback/access-environments.sql','utf8'));await assert.rejects(invoke(4),/permission denied/);
 assert.equal((await db.query('SELECT count(*)::int n FROM platform_access_environments')).rows[0].n,2,'rollback preserves evidence');
 await db.close();console.log('PASS access SQL: real trigger, legacy preservation, identity, expiry, origin, deduplication, immutable attribution, ACL/RLS and rollback');
})().catch(e=>{console.error(e);process.exitCode=1});
