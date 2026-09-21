'use strict';
(function(){
  function streamline(root=document){
    root.querySelectorAll?.('[data-deviation-reason]').forEach(input=>{
      const field=input.closest('.field');
      if(field)field.hidden=true;
    });
    root.querySelectorAll?.('[data-review-confirmed]').forEach(input=>{
      const label=input.closest('label');
      if(label)label.hidden=true;
    });
  }

  function prepareApproval(button){
    const box=button.closest('.box');
    if(!box)return;

    const confirmation=box.querySelector('[data-review-confirmed]');
    if(confirmation)confirmation.checked=true;

    const note=box.querySelector('[data-review-note]');
    if(note&&!note.value.trim())note.value='Revisão geral confirmada pelo professor.';

    box.querySelectorAll('[data-deviation-discard]').forEach((discard,index)=>{
      if(!discard.checked)return;
      const reason=box.querySelector(`[data-deviation-reason="${index}"]`);
      if(reason&&!reason.value.trim())reason.value='Descartado na revisão geral.';
    });
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-approve-ai]');
    if(button)prepareApproval(button);
  },true);

  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType===1)streamline(node);
      }
    }
  });

  if(document.documentElement){
    streamline(document);
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
