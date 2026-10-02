'use strict';
(function(root){
  const clean=value=>String(value??'').normalize('NFC').trim().replace(/\s+/gu,' ');
  const key=value=>clean(value).toLocaleLowerCase('pt-BR');
  function distance(a,b){
    let row=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){
      const next=[i];
      for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));
      row=next;
    }
    return row[b.length];
  }
  function match(value,catalog=[]){
    const label=clean(value),query=key(label);
    if(!query)return {label:'',exact:null,suggestions:[]};
    const names=[...new Map(catalog.map(clean).filter(Boolean).map(n=>[key(n),n])).values()];
    const exact=names.find(n=>key(n)===query)||null;
    if(exact)return {label:exact,exact,suggestions:[]};
    const suggestions=names.map(name=>({name,k:key(name)})).map(x=>({...x,d:distance(query,x.k)}))
      .filter(x=>x.k.startsWith(query)||(query.length>=4&&x.d<=Math.min(2,Math.floor(query.length/4))))
      .sort((a,b)=>a.d-b.d||a.name.localeCompare(b.name,'pt-BR')).slice(0,4).map(x=>x.name);
    return {label,exact:null,suggestions};
  }
  const api={clean,key,match};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.SchoolNames=api;
})(globalThis);
