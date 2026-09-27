'use strict';
(function(){
  const MENU_ID='versaoCustomSelectMenu';
  let activeSelect=null;
  let searchText="", searchAt=0;

  function closeMenu({focus=false}={}){
    const menu=document.getElementById(MENU_ID);
    if(menu)menu.remove();
    const previous=activeSelect;
    activeSelect=null;
    previous?.setAttribute("aria-expanded","false");
    if(focus)previous?.focus?.({preventScroll:true});
  }

  function selectableOptions(select){
    const rows=[];
    [...select.children].forEach(node=>{
      if(node.tagName==='OPTGROUP'){
        rows.push({group:true,label:node.label||''});
        [...node.children].forEach(option=>rows.push({option}));
      }else if(node.tagName==='OPTION')rows.push({option:node});
    });
    if(select.id==='lvStudent'){
      const first=rows.filter(row=>row.option&&!row.option.value);
      const students=rows.filter(row=>row.option&&row.option.value).sort((a,b)=>String(a.option.textContent||a.option.label||'').localeCompare(String(b.option.textContent||b.option.label||''),'pt-BR',{sensitivity:'base'}));
      return [...first,...students];
    }
    return rows;
  }

  function positionMenu(menu,select){
    const rect=select.getBoundingClientRect();
    const viewportW=document.documentElement.clientWidth;
    const viewportH=document.documentElement.clientHeight;
    const gap=6;
    const width=Math.max(rect.width,180);
    const left=Math.min(Math.max(8,rect.left),Math.max(8,viewportW-width-8));
    menu.style.width=width+'px';
    menu.style.left=left+'px';
    menu.style.maxWidth=Math.max(180,viewportW-16)+'px';
    const below=Math.max(0,viewportH-rect.bottom-gap-8);
    const above=Math.max(0,rect.top-gap-8);
    const useBelow=below>=Math.min(menu.scrollHeight,220)||below>=above;
    const height=Math.min(menu.scrollHeight,360,viewportH*.6,useBelow?below:above);
    menu.style.maxHeight=Math.max(44,height)+'px';
    menu.style.top=Math.max(8,useBelow?rect.bottom+gap:rect.top-height-gap)+'px';
  }

  function choose(select,option){
    if(option.disabled||option.parentElement?.disabled)return;
    const changed=select.value!==option.value;
    select.value=option.value;
    if(changed){
      select.dispatchEvent(new Event('input',{bubbles:true}));
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
    closeMenu({focus:true});
  }

  function openMenu(select){
    if(!select||select.disabled||select.multiple||Number(select.size)>1)return;
    if(activeSelect===select&&document.getElementById(MENU_ID)){closeMenu({focus:true});return}
    closeMenu();
    activeSelect=select;
    select.setAttribute("aria-expanded","true");
    select.setAttribute("aria-controls",MENU_ID);
    select.setAttribute("aria-haspopup","listbox");
    const menu=document.createElement('div');
    menu.id=MENU_ID;
    menu.className='versao-select-menu';
    menu.setAttribute('role','listbox');
    menu.setAttribute('aria-label',select.getAttribute('aria-label')||select.labels?.[0]?.textContent?.replace(select.textContent,'').trim()||'Selecionar opção');
    selectableOptions(select).forEach(row=>{
      if(row.group){
        const group=document.createElement('div');
        group.className='versao-select-group';
        group.textContent=row.label;
        menu.appendChild(group);
        return;
      }
      const option=row.option;
      if(option.hidden)return;
      const button=document.createElement('button');
      button.type='button';
      button.className='versao-select-option';
      button.setAttribute('role','option');
      button.setAttribute('aria-selected',String(option.value===select.value));
      button.disabled=option.disabled||Boolean(option.parentElement?.disabled);
      button.textContent=option.textContent||option.label||option.value;
      button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();choose(select,option)});
      menu.appendChild(button);
    });
    document.body.appendChild(menu);
    positionMenu(menu,select);
    const selected=menu.querySelector('[aria-selected="true"]');
    (selected&&!selected.disabled?selected:menu.querySelector('.versao-select-option:not(:disabled)'))?.focus?.({preventScroll:true});
  }

  function getSelect(target){
    const select=target instanceof Element?target.closest('select:not([multiple])'):null;
    return select;
  }

  document.addEventListener('pointerdown',event=>{
    const select=getSelect(event.target);
    if(!select||select.disabled||Number(select.size)>1)return;
    event.preventDefault();
    event.stopPropagation();
    openMenu(select);
  },true);

  document.addEventListener('click',event=>{
    const select=getSelect(event.target);
    if(select&&!select.disabled&&Number(select.size)<=1){
      event.preventDefault();
      event.stopPropagation();
      if(activeSelect!==select)openMenu(select);
      return;
    }
    const menu=document.getElementById(MENU_ID);
    if(menu&&event.target instanceof Node&&!menu.contains(event.target))closeMenu();
  },true);

  document.addEventListener('keydown',event=>{
    const select=getSelect(event.target);
    if(select&&!select.disabled&&['Enter',' ','ArrowDown'].includes(event.key)){
      event.preventDefault();
      openMenu(select);
      return;
    }
    const menu=document.getElementById(MENU_ID);
    if(!activeSelect||!menu)return;
    if(event.key==='Escape'){event.preventDefault();closeMenu({focus:true});return}
    if(event.key==='Tab'){closeMenu({focus:true});return}
    const options=[...menu.querySelectorAll('.versao-select-option:not(:disabled)')];
    if(!options.length)return;
    const index=options.indexOf(document.activeElement);
    let next=-1;
    if(event.key==='ArrowDown')next=(index+1)%options.length;
    if(event.key==='ArrowUp')next=(index-1+options.length)%options.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=options.length-1;
    if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&event.key!==' '){
      searchText=Date.now()-searchAt>700?event.key:searchText+event.key;searchAt=Date.now();
      next=options.findIndex(o=>o.textContent.trim().toLocaleLowerCase('pt-BR').startsWith(searchText.toLocaleLowerCase('pt-BR')));
    }
    if(next>=0){event.preventDefault();options[next].focus({preventScroll:true});options[next].scrollIntoView?.({block:'nearest'});}

  },true);

  window.addEventListener('resize',()=>closeMenu(),{passive:true});
  window.addEventListener('scroll',event=>{const menu=document.getElementById(MENU_ID);if(menu&&event.target instanceof Node&&menu.contains(event.target))return;closeMenu()},{passive:true,capture:true});
  window.__VERSAO_UI_RULES__=Object.freeze({...window.__VERSAO_UI_RULES__,nativeSelectPicker:false,selects:'versaoCustomSelect'});
})();
