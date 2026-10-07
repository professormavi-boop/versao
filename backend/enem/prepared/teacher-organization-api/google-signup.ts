import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
export async function handleGoogle(req:Request,deps={createClient,env:(key:string)=>Deno.env.get(key)}){
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(req.method!=='POST')return json({error:'Método não permitido.'},405);
 const auth=req.headers.get('Authorization')||'';
 if(!auth.startsWith('Bearer '))return json({error:'Entre novamente para continuar.'},401);
 try{
  const admin=deps.createClient(deps.env('SUPABASE_URL')!,deps.env('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await admin.auth.getUser(auth.slice(7));
  if(error||!data.user)return json({error:'Sessão inválida. Entre novamente.'},401);
  const raw=await req.text();if(raw.length>3000)return json({error:'Dados inválidos.'},413);
  let body;try{body=JSON.parse(raw);}catch{return json({error:'Dados inválidos.'},400);}
  if(body.action!=='google_complete'||body.accept_terms!==true||body.legal_version!=='2026-09-28'||typeof body.full_name!=='string'||body.full_name.trim().length<2||body.full_name.length>160)return json({error:'Confira seu nome e aceite os termos atuais.'},400);
  const result=await admin.rpc('complete_google_teacher_signup',{p_actor:data.user.id,p_name:body.full_name,p_legal_version:body.legal_version,p_accept:true});
  if(result.error)return json({error:['42501','P0001'].includes(result.error.code)?result.error.message:'Não foi possível concluir o cadastro. Tente novamente.'},result.error.code==='42501'?403:400);
  return json(result.data);
 }catch{return json({error:'Não foi possível concluir o cadastro. Tente novamente.'},503);}
}


