import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
export async function handleIndependent(req:Request,deps={createClient,env:(k:string)=>Deno.env.get(k)}){
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method==='OPTIONS')return reply({});if(req.method!=='POST')return reply({error:'Método não permitido.'},405);
 try{
  const auth=req.headers.get('Authorization')||'';if(!auth.startsWith('Bearer '))return reply({error:'Entre novamente.'},401);
  const admin=deps.createClient(deps.env('SUPABASE_URL')!,deps.env('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const identity=await admin.auth.getUser(auth.slice(7));if(identity.error||!identity.data.user)return reply({error:'Sessão inválida.'},401);
  const raw=await req.text();if(raw.length>3000)return reply({error:'Dados inválidos.'},413);const body=JSON.parse(raw);
  if(body.action!=='student_complete'||body.accept_terms!==true||body.legal_version!=='2026-09-28'||typeof body.full_name!=='string'||body.full_name.trim().length<2||body.full_name.length>160)return reply({error:'Confira seu nome e aceite os termos.'},400);
  const r=await admin.rpc('complete_independent_student',{p_actor:identity.data.user.id,p_name:body.full_name,p_accept:true,p_legal_version:body.legal_version});
  if(r.error)return reply({error:['42501','P0001'].includes(r.error.code)?r.error.message:'Não foi possível concluir o cadastro.'},400);
  return reply(r.data);
 }catch{return reply({error:'Não foi possível concluir o cadastro. Tente novamente.'},503);}
}
