// Read-only summaries. Every query is scoped to the authenticated owner.
export function listSearch(value:any){return String(value||'').normalize('NFC').replace(/[^\p{L}\p{N}\s-]/gu,' ').trim().replace(/\s+/g,' ').slice(0,100);}
export function jobSummary(essay:any,jobs:any[]){
 const ordered=[...jobs].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))||String(b.id).localeCompare(String(a.id)));
 const latest=ordered.find(j=>j.purpose==='correction')||ordered[0];
 if(!latest)return {state:essay.theme?'ready':'draft',score:null,job_id:null};
 if(['processing','queued','in_progress'].includes(latest.status))return {state:'processing',score:null,job_id:latest.id};
 if(latest.status==='failed')return {state:'failed',score:null,job_id:latest.id};
 if(latest.status==='completed'&&latest.purpose==='correction'){
  const reviewed=latest.reviewed===true||latest.review_score!==null&&latest.review_score!==undefined;
  const score=reviewed?latest.review_score:latest.score;
  return {state:reviewed?'reviewed':'review',score:typeof score==='number'?score:null,job_id:latest.id};
 }
 return {state:essay.theme?'ready':'draft',score:null,job_id:latest.id};
}
async function pages(makeQuery:()=>any){const rows:any[]=[];for(let offset=0;;offset+=500){const r=await makeQuery().range(offset,offset+499);if(r.error)throw r.error;rows.push(...(r.data||[]));if((r.data||[]).length<500)return rows;}}
export async function essaySummaries(admin:any,actor:string,essays:any[]){
 const jobs:any[]=[];
 for(let i=0;i<essays.length;i+=100){const ids=essays.slice(i,i+100).map(e=>e.id);jobs.push(...await pages(()=>admin.from('live_jobs').select('id,essay_id,purpose,status,created_at,score:result->total_score,review_score:review->total_score,reviewed:review->reviewed_by_teacher').eq('owner_id',actor).in('essay_id',ids).order('created_at',{ascending:false}).order('id')));}
 const grouped=new Map<string,any[]>();for(const j of jobs){if(!grouped.has(j.essay_id))grouped.set(j.essay_id,[]);grouped.get(j.essay_id)!.push(j);}
 return essays.map(e=>({...e,summary:jobSummary(e,grouped.get(e.id)||[])}));
}
export async function activitySummaries(admin:any,actor:string,activities:any[]){
 if(!activities.length)return [];
 const essays=await pages(()=>admin.from('live_essays').select('id,activity_id,theme').eq('owner_id',actor).is('deleted_at',null).in('activity_id',activities.map(a=>a.id)).order('id'));
 const summarized=await essaySummaries(admin,actor,essays);
 return activities.map(a=>{const rows=summarized.filter(e=>e.activity_id===a.id);return {...a,essay_count:rows.length,pending_review_count:rows.filter(e=>e.summary.state==='review').length};});
}
