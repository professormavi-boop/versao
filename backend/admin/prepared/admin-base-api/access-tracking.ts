// Called only AFTER auth.getUser has verified this exact bearer token.
// Origin is browser telemetry, never an authorization or deployment attestation.
export async function attributeAccess(admin:any,userId:string,token:string,origin:string|null){
 const origins=['https://app.versaoprofessor.com','https://suaversao.vercel.app','https://teste.versaoprofessor.com'];
 if(!origin||!origins.includes(origin))return {ok:true,attributed:false};
 let claims:any;try{const part=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');claims=JSON.parse(atob(part));}catch{return {ok:true,attributed:false};}
 if(claims.sub!==userId||!/^\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b$/i.test(claims.session_id||''))return {ok:true,attributed:false};
 const {data,error}=await admin.rpc('attribute_platform_access',{p_actor:userId,p_session:claims.session_id,p_origin:origin});
 if(error)throw Error('Não foi possível identificar o ambiente do acesso.');
 return {ok:true,attributed:data===true};
}
