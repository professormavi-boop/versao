import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json; charset=utf-8'}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors})
const PACKAGES={
 teacher_test_1:{credits:1,amount_cents:300,label:'1 correção',plan:'Teste',unit_price_cents:300,featured:false},
 teacher_25:{credits:25,amount_cents:4500,label:'25 correções',plan:'Entrada',unit_price_cents:180,featured:false},
 teacher_100:{credits:100,amount_cents:14000,label:'100 correções',plan:'Professor',unit_price_cents:140,featured:true},
 teacher_300:{credits:300,amount_cents:39000,label:'300 correções',plan:'Intensivo',unit_price_cents:130,featured:false}
} as const

export async function handleCredit(req:Request,deps={createClient,fetch,env:(key:string)=>Deno.env.get(key)}){
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
 try{
  const base=deps.env('SUPABASE_URL')!,anon=deps.env('SUPABASE_ANON_KEY')!,service=deps.env('SUPABASE_SERVICE_ROLE_KEY')!,mp=deps.env('MERCADOPAGO_ACCESS_TOKEN')!
  const auth=req.headers.get('Authorization')||''
  if(!base||!anon||!service)return json({error:'Configuração do servidor incompleta.'},500)
  if(!auth.startsWith('Bearer '))return json({error:'Autenticação obrigatória.'},401)
  const userClient=deps.createClient(base,anon,{global:{headers:{Authorization:auth}}}),admin=deps.createClient(base,service)
  const {data:{user}}=await userClient.auth.getUser(auth.slice(7));if(!user)return json({error:'Sessão inválida.'},401)
  const {data:profile}=await admin.from('profiles').select('id,role,approval_status,email,admin_hidden,organization_id').eq('id',user.id).maybeSingle()
  if(!profile||profile.admin_hidden||profile.approval_status!=='approved'||!['teacher','student'].includes(profile.role))return json({error:'Compra disponível somente para contas aprovadas.'},403)
  if(profile.role==='student'){
   const {data:student,error:studentError}=await admin.from('students').select('auth_user_id,organization_id').eq('auth_user_id',user.id).maybeSingle();
   if(studentError)throw studentError;
   const {data:independentFlag}=await admin.from('system_feature_flags').select('is_enabled').eq('feature_key','student_independent').maybeSingle();
   const {data:independentAccount}=await admin.from('student_independent_accounts').select('profile_id').eq('profile_id',user.id).maybeSingle();
   const independent=!profile.organization_id&&independentFlag?.is_enabled===true&&!!independentAccount;
   if(!independent&&(!student||student.auth_user_id!==user.id||!profile.organization_id||student.organization_id!==profile.organization_id))return json({error:'Compra disponível neste momento para alunos da base.'},403);
  }
  const body=await req.json().catch(()=>({})),action=String(body.action||'packages')
  let packages:any=PACKAGES;
  if(profile.role==='student'){
   const {data:flag,error:flagError}=await admin.from('system_feature_flags').select('is_enabled,config').eq('feature_key','student_credit_sales').maybeSingle();
   if(flagError)throw flagError;
   const cents=Number(flag?.config?.unit_price_cents);
   const enabled=flag?.is_enabled===true&&cents===250&&flag.config.minimum_purchase_cents===1000&&flag.config.credits_per_purchase===4;
   packages=enabled?{student_4:{credits:4,amount_cents:1000,label:'4 correções',plan:'Aluno',unit_price_cents:cents,featured:false}}:{};
   if(action==='checkout'&&!enabled)return json({error:'A compra de créditos ainda não está disponível.'},409);
  }
  const {data:wallet}=await admin.from('correction_credit_wallets').select('balance').eq('profile_id',profile.id).maybeSingle()
  if(action==='packages')return json({balance:wallet?.balance||0,freemium:profile.role==='student'?1:3,packages:Object.entries(packages).map(([code,p]:[string,any])=>({code,...p,amount_brl:(p.amount_cents/100).toFixed(2),unit_brl:(p.unit_price_cents/100).toFixed(2),badge:p.featured?'Mais escolhido':null}))})
  if(action!=='checkout')return json({error:'Ação inválida.'},400)
  if(!mp)return json({error:'Mercado Pago ainda não está configurado.'},503)
  const code=String(body.package_code||'') as string,p=Object.hasOwn(packages,code)?packages[code]:null;if(!p)return json({error:'Pacote inválido.'},400)
  const {data:order,error:oErr}=await admin.from('correction_payment_orders').insert({profile_id:profile.id,package_code:code,credits:p.credits,amount_cents:p.amount_cents,status:'created'}).select('id').single();if(oErr)throw oErr
  const webhook=`${base}/functions/v1/credit-payment-webhook`
  const preference={items:[{id:code,title:`VERSÃO — ${p.plan} · ${p.label}`,description:`R$ ${(p.unit_price_cents/100).toFixed(2).replace('.',',')} por correção`,quantity:1,currency_id:'BRL',unit_price:p.amount_cents/100}],external_reference:order.id,notification_url:webhook,back_urls:{success:'https://app.versaoprofessor.com/?payment=success',pending:'https://app.versaoprofessor.com/?payment=pending',failure:'https://app.versaoprofessor.com/?payment=failure'},auto_return:'approved',metadata:{order_id:order.id,profile_id:profile.id,credits:p.credits,unit_price_cents:p.unit_price_cents}}
  const response=await deps.fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',headers:{Authorization:`Bearer ${mp}`,'Content-Type':'application/json','X-Idempotency-Key':order.id},body:JSON.stringify(preference)})
  const data=await response.json();if(!response.ok){await admin.from('correction_payment_orders').update({status:'rejected'}).eq('id',order.id);throw Error(data?.message||'Mercado Pago recusou a criação do checkout.')}
  await admin.from('correction_payment_orders').update({status:'pending',mp_preference_id:data.id,updated_at:new Date().toISOString()}).eq('id',order.id).eq('status','created')
  return json({ok:true,order_id:order.id,checkout_url:data.init_point||data.sandbox_init_point})
 }catch(e){return json({error:e instanceof Error?e.message:'Não foi possível iniciar o pagamento.'},500)}
}
Deno.serve(req=>handleCredit(req));

