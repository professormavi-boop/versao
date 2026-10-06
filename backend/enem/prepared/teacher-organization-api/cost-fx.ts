export async function costExchangeRate(admin:any,fetcher:any=fetch,now=new Date()){
 const cached=await admin.from('ai_exchange_rates').select('*').order('quoted_at',{ascending:false}).limit(1).maybeSingle();
 const previous=cached.data;
 const result=(r:any,cache:boolean)=>({available:true,rate:Number(r.rate),date:r.quoted_at,source:r.source,cached:cache,stale:+now-Date.parse(r.fetched_at)>86400000});
 if(previous&&+now-Date.parse(previous.fetched_at)<3600000)return result(previous,true);
 try{
  const date=(d:Date)=>`${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}-${d.getUTCFullYear()}`;
  const query=new URLSearchParams({'@dataInicial':`'${date(new Date(+now-10*86400000))}'`,'@dataFinalCotacao':`'${date(now)}'`,'$top':'1','$orderby':'dataHoraCotacao desc','$format':'json','$select':'cotacaoVenda,dataHoraCotacao'});
  const response=await fetcher('https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?'+query.toString().replaceAll('+','%20'),{signal:AbortSignal.timeout(4000)});
  if(!response.ok)throw Error('FX');const v=(await response.json()).value?.[0];if(!Number.isFinite(Number(v?.cotacaoVenda))||Number(v.cotacaoVenda)<=0||!v.dataHoraCotacao)throw Error('FX');
  const row={quoted_at:String(v.dataHoraCotacao),rate:Number(v.cotacaoVenda),source:'Banco Central · PTAX venda',fetched_at:now.toISOString()};
  const saved=await admin.from('ai_exchange_rates').upsert(row,{onConflict:'quoted_at'});if(saved.error)console.error('FX_CACHE_WRITE_FAILED');
  return result(row,false);
 }catch{if(previous)return {...result(previous,true),source:previous.source+' · última cotação salva',stale:true};return {available:false,rate:null,date:null,source:'Cotação indisponível',stale:true};}
}
