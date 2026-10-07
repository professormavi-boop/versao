import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
export async function handleProfileName(req:Request,deps={createClient,env:(key:string)=>Deno.env.get(key)}){
 if(req.method!=='POST')return json({error:'Método não permitido.'},405);
 const auth=req.headers.get('Authorization')||'';
 if(!auth.startsWith('Bearer '))return json({error:'Entre novamente.'},401);
 try{
  const admin=deps.createClient(deps.env('SUPABASE_URL')!,deps.env('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await admin.auth.getUser(auth.slice(7));
  if(error||!data.user)return json({error:'Sessão inválida. Entre novamente.'},401);
  const raw=await req.text();if(raw.length>3000)return json({error:'Dados inválidos.'},413);
  let body;try{body=JSON.parse(raw);}catch{return json({error:'Dados inválidos.'},400);}
  const name=typeof body.full_name==='string'?body.full_name.trim().replace(/\s+/g,' '):'';
  if(body.action!=='update_name'||name.length<2||name.length>160||/[\u0000-\u001f\u007f<>]/.test(name))return json({error:'Informe um nome entre 2 e 160 caracteres, sem marcações.'},400);
  const result=await admin.from('profiles').update({full_name:name}).eq('id',data.user.id).eq('role','teacher').eq('approval_status','approved').select('id,full_name').maybeSingle();
  if(result.error)return json({error:'Não foi possível salvar o nome. Tente novamente.'},503);
  if(!result.data)return json({error:'Acesso exclusivo do professor aprovado.'},403);
  return json({ok:true,profile:result.data});
 }catch{return json({error:'Não foi possível salvar o nome. Tente novamente.'},503);}
}

