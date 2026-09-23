export default async function handler(req,res){
  try{
    const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN||'';
    if(!token)return res.status(503).json({ok:false,code:'NO_GATEWAY_AUTH'});
    const r=await fetch('https://ai-gateway.vercel.sh/v1/credits',{headers:{Authorization:`Bearer ${token}`}});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)return res.status(r.status).json({ok:false,code:'GATEWAY_UNAVAILABLE',status:r.status});
    const balance=Number(data.balance||0);
    return res.status(200).json({ok:balance>0,available:balance>0});
  }catch(error){
    return res.status(500).json({ok:false,code:'HEALTH_FAILED'});
  }
}
