'use strict';
(function(){
 const cache=new Map();
 let timer=null,sequence=0;
 const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt-BR');
 const statusOf=proposal=>proposal?.status==='closed'?'Oculta':proposal?.is_visible_to_students?'Publicada':'Rascunho';
 async function detail(id){
  if(cache.has(id))return cache.get(id);
  const promise=window.edge(window.API.proposal,{action:'get',round_id:id}).catch(()=>null);
  cache.set(id,promise);return promise;
 }
 function signature(data){
  const p=data?.proposal||{};
  const motivators=(data?.motivators||[]).map(m=>[norm(m.title),norm(m.body),norm(m.source_label),norm(m.source_url)].join('|')).join('||');
  return JSON.stringify([norm(p.theme),norm(p.thematic_axis),norm(p.proposal_command),norm(p.understand_prompt),motivators,statusOf(p)]);
 }
 function reset(list){
  list.querySelectorAll('[data-logical-hidden="1"]').forEach(item=>{item.hidden=false;item.removeAttribute('aria-hidden');delete item.dataset.logicalHidden});
  list.querySelectorAll('[data-logical-proposal-ids]').forEach(item=>{delete item.dataset.logicalProposalIds;delete item.dataset.logicalStatus;item.querySelector('.proposal-logical-orgs')?.remove()});
 }
 function updateCount(primary,group){
  const classes=new Set();
  group.forEach(entry=>(entry.data?.targets||[]).forEach(t=>{const id=t?.class_id||t?.id;if(id)classes.add(id)}));
  const total=classes.size||group.reduce((sum,entry)=>{
   const text=entry.item.querySelector('.class-count')?.textContent||entry.item.querySelector('.item-meta')?.textContent||'';
   return sum+(Number((/(\d+)\s*turma/i.exec(text)||[])[1])||0);
  },0);
  const countNode=primary.querySelector('.class-count');
  if(countNode)countNode.textContent=`${total} turma${total===1?'':'s'}`;
  const status=primary.querySelector('.proposal-card-status');
  if(status&&group.length>1&&!status.querySelector('.proposal-logical-orgs')){
   const dot=document.createElement('span');dot.textContent='·';dot.className='proposal-logical-orgs';
   const label=document.createElement('span');label.className='proposal-logical-orgs';label.textContent=`${group.length} instituições`;
   status.append(dot,label);
  }
 }
 async function apply(){
  const list=document.getElementById('proposalV2List');
  if(!list||!window.API?.proposal||typeof window.edge!=='function')return;
  const token=++sequence;reset(list);
  const items=[...list.querySelectorAll('.list-item[data-proposal-id]')];
  if(items.length<2)return;
  const entries=(await Promise.all(items.map(async item=>({item,id:item.dataset.proposalId,data:await detail(item.dataset.proposalId)})))).filter(x=>x.data);
  if(token!==sequence||!list.isConnected)return;
  const groups=new Map();
  entries.forEach(entry=>{const key=signature(entry.data);if(!key)return;const arr=groups.get(key)||[];arr.push(entry);groups.set(key,arr)});
  groups.forEach(group=>{
   if(group.length<2)return;
   const primary=group[0].item,ids=group.map(x=>x.id);
   primary.dataset.logicalProposalIds=JSON.stringify(ids);
   primary.dataset.logicalStatus=statusOf(group[0].data?.proposal);
   group.slice(1).forEach(({item})=>{item.hidden=true;item.setAttribute('aria-hidden','true');item.dataset.logicalHidden='1'});
   updateCount(primary,group);
  });
 }
 function schedule(delay=140){clearTimeout(timer);timer=setTimeout(apply,delay)}
 document.addEventListener('click',async event=>{
  const button=event.target.closest?.('[data-hide],[data-delete]');
  if(!button)return;
  const card=button.closest('.list-item[data-logical-proposal-ids]');
  if(!card)return;
  let ids=[];try{ids=JSON.parse(card.dataset.logicalProposalIds||'[]')}catch{}
  if(ids.length<2)return;
  event.preventDefault();event.stopImmediatePropagation();
  const deleting=button.hasAttribute('data-delete');
  if(deleting){
   const ok=await appConfirm(`Excluir esta proposta das ${ids.length} instituições? Propostas com redações vinculadas não podem ser excluídas.`);
   if(!ok)return;
  }
  button.disabled=true;
  try{
   if(deleting){
    const results=await Promise.allSettled(ids.map(id=>edge(API.proposal,{action:'delete',round_id:id})));
    const failed=results.filter(r=>r.status==='rejected');
    if(failed.length)toast(failed[0].reason?.message||'Não foi possível excluir a proposta em todas as instituições.');
   }else{
    const next=card.dataset.logicalStatus==='Oculta'?'published':'closed';
    await Promise.all(ids.map(id=>edge(API.proposal,{action:'update_status',round_id:id,status:next})));
   }
   cache.clear();await navigate('proposals');
  }catch(error){toast(error.message||'Não foi possível atualizar a proposta.');cache.clear();await navigate('proposals')}
 },true);
 const view=document.getElementById('view');
 if(view)new MutationObserver(()=>schedule()).observe(view,{subtree:true,childList:true});
 document.addEventListener('input',event=>{if(event.target?.id==='proposalSearch')schedule(20)},true);
 document.addEventListener('change',event=>{if(event.target?.id==='proposalFilter')schedule(20)},true);
 document.addEventListener('DOMContentLoaded',()=>schedule(250),{once:true});
 schedule(250);
})();
