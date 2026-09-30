'use strict';

const crypto=require('crypto');

const SOURCE_URL='https://app.versaoprofessor.com/confirmacao-professor.html';
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value,max){
  if(value===undefined||value===null)return '';
  return String(value).replace(/[\r\n\t]/g,'').trim().slice(0,max);
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

  const profileId=clean(body.profile_id,64);
  const oppref=clean(body.oppref,512);
  if(!UUID_RE.test(profileId)||!oppref)return res.status(204).end();

  const pixelId=clean(process.env.OPENAI_ADS_PIXEL_ID,256);
  const apiKey=clean(process.env.OPENAI_ADS_CONVERSIONS_API_KEY,2048);
  if(!pixelId||!apiKey)return res.status(204).end();

  const eventHash=crypto.createHash('sha256')
    .update('versao:registration_completed:'+profileId)
    .digest('hex');

  const event={
    id:'versao_registration_'+eventHash,
    type:'registration_completed',
    timestamp_ms:Date.now(),
    oppref,
    source_url:SOURCE_URL,
    action_source:'web',
    data:{type:'customer_action'}
  };

  try{
    const response=await fetch('https://bzr.openai.com/v1/events?pid='+encodeURIComponent(pixelId),{
      method:'POST',
      headers:{
        Authorization:'Bearer '+apiKey,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({validate_only:false,events:[event]}),
      signal:AbortSignal.timeout(8000)
    });
    if(!response.ok)console.error('[OPENAI_CONVERSION_ERROR]',response.status);
  }catch(error){
    console.error('[OPENAI_CONVERSION_ERROR]',error?.name||'request_failed');
  }

  return res.status(204).end();
};
