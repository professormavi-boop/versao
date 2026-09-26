'use strict';
(function(){
  const MENU_ID='versaoCustomSelectMenu';
  const STYLE_ID='versaoCustomSelectStyle';
  let activeSelect=null;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .versao-select-menu{position:fixed;z-index:10020;background:#fff;border:1px solid #e3d8d5;border-radius:14px;box-shadow:0 18px 48px rgba(32,41,54,.18);padding:6px;max-height:min(360px,60vh);overflow:auto;overscroll-behavior:contain;min-width:180px}
      .versao-select-option{width:100%;border:0;background:transparent;color:#202936;text-align:left;padding:12px 14px;border-radius:10px;font:inherit;line-height:1.3;cursor:pointer;display:block}
      .versao-select-option:hover,.versao-select-option:focus-visible{background:#fff4f2;outline:0}
      .versao-select-option[aria-selected="true"]{background:#fbe8e5;color:#8b1c1c;font-weight:800}
      .versao-select-option:disabled{opacity:.45;cursor:not-allowed}
      .versao-select-group{padding:9px 14px 5px;color:#667085;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.02em}
      @media(max-width:760px){.versao-select-menu{left:12px!important;right:12px!important;width:auto!important;max-width:none!important;max-height:48vh;border-radius:16px}.versao-select-option{padding:14px 15px;font-size:16px}}
    `;
    document.head.appendChild(style);
  }

  function closeMenu({focus=false}={}){
    const menu=document.getElementById(MENU_ID);
    if(menu)menu.remove();
    const previous=activeSelect;
    activeSelect=null;
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
    const estimated=Math.min(menu.scrollHeight||320,360);
    const below=viewportH-rect.bottom-gap;
    const above=rect.top-gap;
    menu.style.top=(below>=Math.min(estimated,220)||below>=above?rect.bottom+gap:Math.max(8,rect.top-estimated-gap))+'px';
  }

  function choose(select,option){
    if(option.disabled)return;
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
    ensureStyle();
    if(activeSelect===select&&document.getElementById(MENU_ID)){closeMenu({focus:true});return}
    closeMenu();
    activeSelect=select;
    const menu=document.createElement('div');
    menu.id=MENU_ID;
    menu.className='versao-select-menu';
    menu.setAttribute('role','listbox');
    menu.setAttribute('aria-label',select.getAttribute('aria-label')||select.closest('label')?.querySelector('small,strong')?.textContent?.trim()||'Selecionar opção');
    selectableOptions(select).forEach(row=>{
      if(row.group){
        const group=document.createElement('div');
        group.className='versao-select-group';
        group.textContent=row.label;
        menu.appendChild(group);
        return;
      }
      const option=row.option;
      const button=document.createElement('button');
      button.type='button';
      button.className='versao-select-option';
      button.setAttribute('role','option');
      button.setAttribute('aria-selected',String(option.value===select.value));
      button.disabled=option.disabled;
      button.textContent=option.textContent||option.label||option.value;
      button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();choose(select,option)});
      menu.appendChild(button);
    });
    document.body.appendChild(menu);
    positionMenu(menu,select);
    const selected=menu.querySelector('[aria-selected="true"]');
    (selected||menu.querySelector('.versao-select-option:not(:disabled)'))?.focus?.({preventScroll:true});
  }

  function getSelect(target){
    const select=target instanceof Element?target.closest('select:not([multiple])'):null;
    if(select?.id==='pvAxis')return null;
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
    if(event.key==='Escape'&&activeSelect){event.preventDefault();closeMenu({focus:true})}
  },true);

  window.addEventListener('resize',()=>closeMenu(),{passive:true});
  window.addEventListener('scroll',()=>closeMenu(),{passive:true,capture:true});
  window.__VERSAO_UI_RULES__=Object.freeze({...window.__VERSAO_UI_RULES__,nativeSelectPicker:false,selects:'versaoCustomSelect'});
})();
