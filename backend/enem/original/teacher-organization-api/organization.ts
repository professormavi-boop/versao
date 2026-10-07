import { createClient } from 'npm:@supabase/supabase-js@2.57.4'
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json; charset=utf-8'}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers})
export async function handleLegacy(req:Request){
 if(req.method==='OPTIONS')return new Response('ok',{headers})
 if(req.method!=='POST')return json({error:'Método não permitido.'},405)
 try{
  const auth=req.headers.get('Authorization')||''
  if(!auth.startsWith('Bearer '))return json({error:'Entre novamente para continuar.'},401)
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error}=await admin.auth.getUser(auth.slice(7))
  if(error||!user)return json({error:'Sessão inválida. Entre novamente.'},401)
  const raw=await req.text()
  if(raw.length>250000)return json({error:'Arquivo grande demais para um lote. Divida em até 500 alunos por envio.'},413)
  let body;try{body=JSON.parse(raw)}catch{return json({error:'Dados inválidos.'},400)}
  const {data,error:rpcError}=await admin.rpc('teacher_organization_api',{actor:user.id,body})
  if(rpcError){
   const safe=rpcError.code==='P0001'||rpcError.code==='42501'
   return json({error:safe?rpcError.message:'Não foi possível salvar. Confira os dados e tente novamente.'},rpcError.code==='42501'?403:400)
  }
  return json(data)
 }catch{return json({error:'Não foi possível concluir a operação. Tente novamente.'},500)}
}



