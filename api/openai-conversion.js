'use strict';

const crypto=require('crypto');
const BASE='https://huccxcpwoydwuisrmboc.supabase.co';
const PUBLIC_KEY='sb_publishable_KzojVBVP3GvVbSgO_w0mUA_-s8r7VdR';
const HOSTS=new Set(['versaoprofessor.com','www.versaoprofessor.com','app.versaoprofessor.com']);
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clean=(value,max)=>typeof value==='string'?value.replace(/[\r\n\t]/g,'').trim().slice(0,max):'';

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  const reply=(code,status,reason)=>res.status(code).json({status,...(reason?{reason}:{})});
  if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(405,'failed','method');}
  const host=clean(req.headers?.host,255).toLowerCase();
  // Preview/test deployments can never send real conversions, even with copied environment keys.
  if(process.env.VERCEL_ENV!=='production'||!HOSTS.has(host))return reply(200,'skipped','test_or_preview');
  const origin=req.headers?.origin;
  if(origin&&origin!=='https://'+host)return reply(403,'failed','origin');
  let body=req.body;
  try{
    if(Buffer.byteLength(typeof body==='string'?body:JSON.stringify(body)||'')>4096)return reply(413,'failed','payload_size');
    if(typeof body==='string')body=JSON.parse(body);
  }catch(_error){return reply(400,'failed','payload');}
  if(!body||typeof body!=='object'||Array.isArray(body))return reply(400,'failed','payload');
  if(body.test===true)return reply(200,'skipped','test_or_preview');
  const profileId=clean(body.profile_id,64),oppref=clean(body.oppref,512);
  if(!UUID_RE.test(profileId))return reply(400,'failed','profile');
  if(!oppref)return reply(200,'skipped','no_ad_reference');
  const auth=typeof req.headers?.authorization==='string'?req.headers.authorization:'';
  if(!/^Bearer [A-Za-z0-9._-]+$/.test(auth)||auth.length>8192)return reply(401,'failed','session_required');
  const pixelId=clean(process.env.OPENAI_ADS_PIXEL_ID,256),apiKey=clean(process.env.OPENAI_ADS_CONVERSIONS_API_KEY,2048);
  if(!pixelId||!apiKey)return reply(503,'failed','conversion_not_configured');
  try{
    // Read only, using the caller's own session. No service-role credentials or database writes.
    const headers={apikey:PUBLIC_KEY,Authorization:auth};
    const identity=await fetch(BASE+'/auth/v1/user',{headers,signal:AbortSignal.timeout(8000)});
    if(!identity.ok)return reply(identity.status>=500?503:401,'failed','session_verification');
    const user=await identity.json();
    if(user.id!==profileId)return reply(403,'failed','session_mismatch');
    const createdAt=Date.parse(user.created_at),age=Date.now()-createdAt;
    // An existing account signing in is not a new registration. Allow 24h for first completion/retry.
    if(!Number.isFinite(age)||age< -30000||age>86400000)return reply(200,'skipped','not_new_registration');
    const profileResponse=await fetch(BASE+'/rest/v1/profiles?id=eq.'+encodeURIComponent(profileId)+'&select=id,role,approval_status',{headers,signal:AbortSignal.timeout(8000)});
    if(!profileResponse.ok)return reply(503,'failed','profile_verification');
    const profiles=await profileResponse.json(),profile=Array.isArray(profiles)?profiles[0]:null;
    if(profile?.id!==profileId||profile.role!=='teacher'||profile.approval_status!=='approved')return reply(200,'skipped','teacher_registration_incomplete');
    const eventHash=crypto.createHash('sha256').update('versao:registration_completed:'+profileId).digest('hex');
    const event={
      id:'versao_registration_'+eventHash,type:'registration_completed',timestamp_ms:createdAt,oppref,
      source_url:'https://'+host+(body.page==='google'?'/index.html':'/cadastro-professor.html'),
      action_source:'web',data:{type:'customer_action'}
    };
    const response=await fetch('https://bzr.openai.com/v1/events?pid='+encodeURIComponent(pixelId),{
      method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
      body:JSON.stringify({validate_only:false,events:[event]}),signal:AbortSignal.timeout(8000)
    });
    if(!response.ok){console.error('[OPENAI_CONVERSION_ERROR]',response.status);return reply(502,'failed','upstream_rejected');}
    console.info('[OPENAI_CONVERSION_ACCEPTED]');
    return reply(200,'accepted');
  }catch(_error){console.error('[OPENAI_CONVERSION_ERROR]','request_failed');return reply(502,'failed','request_failed');}
};
