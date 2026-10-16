import {handleIndependent} from './writing-independent.ts';
import { handleLive } from './live.ts';
import { handleProfileName } from './profile-name.ts';
import { handleLegacy } from './organization.ts';
import { handle as handleImport } from './import-assistant.ts';
import { handleGoogle } from './google-signup.ts';
const actions=new Set(['import_status','import_review','import_commit','import_organize']);
export async function route(req:Request,deps={legacy:handleLegacy,assisted:handleImport,google:handleGoogle,profileName:handleProfileName,live:handleLive,independent:handleIndependent}){
 if(req.method==='POST'){
  if(req.headers.get('Content-Type')?.startsWith('multipart/form-data')){const form=await req.clone().formData();if(form.get('action')==='live_upload')return deps.live(req);}
  let body:any;
  try{const raw=await req.clone().text();if(raw.length<=250000)body=JSON.parse(raw);}catch{}
  if(typeof body?.action==='string'&&['live_manage','live_activities','live_activity','writing_guidance','writing_catalog','writing_activities','writing_activity_save','writing_activity_get','writing_join','writing_detail','writing_revision','writing_comment','live_writing_list','live_writing_get','live_writing_save','live_transcribe','live_confirm_text','live_status','live_create','live_theme','live_start','live_get','live_history','live_review','live_share','live_shares','live_revoke'].includes(body.action))return deps.live(req);
  if(body?.action==='student_complete')return deps.independent(req);
  if(body?.action==='update_name')return deps.profileName(req);
  if(body?.action==='google_complete')return deps.google(req);
  if(body&&actions.has(body.action)){
   return deps.assisted(new Request(req.url,{method:'POST',headers:req.headers,body:JSON.stringify({...body,action:body.action.slice(7)})}));
  }
 }
 return deps.legacy(req);
}
Deno.serve((req:Request)=>route(req));


