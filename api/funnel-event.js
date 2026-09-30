'use strict';

const ALLOWED_EVENTS=new Set(['landing_view','click_signup','signup_started','signup_complete']);
const SAFE_KEYS=new Set(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','page','cta','path']);

function clean(value,max=160){
  if(value===undefined||value===null)return '';
  return String(value).replace(/[\r\n\t]/g,' ').trim().slice(0,max);
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({ok:false});
  }

  let body=req.body;
  if(typeof body==='string'){
    if(body.length>4096)return res.status(413).json({ok:false});
    try{body=JSON.parse(body)}catch(_error){return res.status(400).json({ok:false})}
  }
  if(!body||typeof body!=='object')return res.status(400).json({ok:false});

  const event=clean(body.event,40);
  if(!ALLOWED_EVENTS.has(event))return res.status(400).json({ok:false});

  const payload={event};
  for(const key of SAFE_KEYS){
    const value=clean(body[key],key==='path'?160:120);
    if(value)payload[key]=value;
  }

  // Não registrar nome, e-mail, senha, token, IP ou user-agent no payload da aplicação.
  console.log('[VERSAO_FUNNEL]',event,JSON.stringify(payload));
  return res.status(204).end();
};
