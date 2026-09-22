'use strict';

// VERSÃO — scanner de redação no navegador.
// Substitui somente a experiência de captura/confirmação do student-upload.e12.js.
// Não cria handlers de navegação adicionais e não altera o backend de upload.
(function(){
  const MAX_OUTPUT_WIDTH=1800;
  const ANALYSIS_WIDTH=240;
  const A4_RATIO=210/297;

  function scannerError(message){
    if(typeof studentUploadError==='function')studentUploadError(message);
    else if(typeof window.actionAlert==='function')window.actionAlert(message,'Atenção');
    else if(typeof toast==='function')toast(message);
  }

  function nativePicker(roundId,camera=false){
    if(!roundId||S?.profile?.role!=='student')return;
    const input=document.createElement('input');
    input.type='file';input.hidden=true;
    input.accept=camera?'image/jpeg,image/png,image/webp':STUDENT_UPLOAD_ACCEPT;
    if(camera)input.setAttribute('capture','environment');
    document.body.appendChild(input);
    const cleanup=()=>input.remove();
    input.onchange=()=>{
      const file=input.files?.[0];
      if(!file){cleanup();return}
      const mime=studentUploadMime(file);
      if(!mime||file.size>STUDENT_UPLOAD_MAX){cleanup();scannerError(`Arquivos aceitos: ${STUDENT_UPLOAD_ACCEPTED}. Máximo de 15 MB.`);return}
      window.showStudentFileConfirm(roundId,file,cleanup,camera);
    };
    input.click();
  }

  // Remove a antiga confirmação/certificado de legibilidade.
  window.showStudentFileConfirm=function(roundId,file,cleanup=()=>{},camera=false){
    const mime=studentUploadMime(file),dialog=document.createElement('dialog');
    dialog.className='app-confirm student-photo-confirm';
    let objectUrl='';
    const preview=String(mime||'').startsWith('image/')
      ?(()=>{objectUrl=URL.createObjectURL(file);return `<img src="${objectUrl}" alt="Prévia da redação" style="display:block;max-width:100%;max-height:52vh;margin:0 auto 12px;object-fit:contain;border-radius:10px">`})()
      :`<div class="safe-note"><b>PDF selecionado:</b> ${esc(file.name)}</div>`;
    const size=studentUploadSizeLabel(file.size);
    dialog.innerHTML=`<h2>Conferir ${camera?'foto':'arquivo'}</h2>${preview}<p><b>${esc(file.name||'Redação')}</b><br>${esc(size)}</p><div class="item-actions"><button type="button" class="btn soft-btn" data-scanner-change>Escolher outro</button><button type="button" class="btn primary" data-scanner-send>Enviar para correção</button></div>`;
    document.body.appendChild(dialog);
    const finish=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);try{dialog.close()}catch{}dialog.remove();cleanup()};
    dialog.oncancel=event=>{event.preventDefault();finish()};
    dialog.querySelector('[data-scanner-change]').onclick=()=>{finish();setTimeout(()=>window.chooseStudentFile(roundId,camera),0)};
    const send=dialog.querySelector('[data-scanner-send]');
    send.onclick=async()=>{
      if(send.disabled)return;
      send.disabled=true;send.textContent='Enviando...';
      try{
        await studentSubmitFile(roundId,file);
        S.cache={};S.student=null;finish();await navigate('student-essays');studentUploadSuccess();
      }catch(error){
        send.disabled=false;send.textContent='Tentar novamente';scannerError(error?.message||'Falha no envio.');
      }
    };
    dialog.showModal();
  };

  function strongestIndex(scores,start,end){
    let best=start,bestValue=-1;
    for(let i=start;i<end;i++){if(scores[i]>bestValue){best=i;bestValue=scores[i]}}
    return {index:best,value:bestValue};
  }

  function detectDocument(video,canvas,ctx){
    if(!video.videoWidth||!video.videoHeight)return null;
    const w=ANALYSIS_WIDTH,h=Math.max(120,Math.round(w*video.videoHeight/video.videoWidth));
    canvas.width=w;canvas.height=h;
    ctx.drawImage(video,0,0,w,h);
    const data=ctx.getImageData(0,0,w,h).data;
    const gray=new Uint8Array(w*h);
    for(let i=0,p=0;i<data.length;i+=4,p++)gray[p]=(data[i]*77+data[i+1]*150+data[i+2]*29)>>8;
    const cols=new Float32Array(w),rows=new Float32Array(h);
    let total=0,count=0;
    for(let y=1;y<h-1;y+=2){
      for(let x=1;x<w-1;x+=2){
        const p=y*w+x;
        const gx=Math.abs(gray[p+1]-gray[p-1]);
        const gy=Math.abs(gray[p+w]-gray[p-w]);
        const g=gx+gy;
        cols[x]+=g;rows[y]+=g;total+=g;count++;
      }
    }
    const avg=count?total/count:0;
    const left=strongestIndex(cols,Math.floor(w*.04),Math.floor(w*.46));
    const right=strongestIndex(cols,Math.floor(w*.54),Math.floor(w*.96));
    const top=strongestIndex(rows,Math.floor(h*.04),Math.floor(h*.46));
    const bottom=strongestIndex(rows,Math.floor(h*.54),Math.floor(h*.96));
    const width=right.index-left.index,height=bottom.index-top.index;
    if(width<w*.42||height<h*.42)return null;
    const normalizedEdge=((left.value+right.value)/(h/2)+(top.value+bottom.value)/(w/2))/4;
    const confidence=avg?normalizedEdge/avg:0;
    if(!Number.isFinite(confidence)||confidence<1.12)return null;
    return {x:left.index/w,y:top.index/h,w:width/w,h:height/h,confidence:Math.min(2,confidence)};
  }

  function defaultCrop(video){
    const vw=video.videoWidth,vh=video.videoHeight;
    let cropH=vh*.88,cropW=cropH*A4_RATIO;
    if(cropW>vw*.92){cropW=vw*.92;cropH=cropW/A4_RATIO}
    return {x:(vw-cropW)/2,y:(vh-cropH)/2,w:cropW,h:cropH};
  }

  function detectedCrop(video,bounds){
    if(!bounds)return defaultCrop(video);
    const pad=.025;
    const x=Math.max(0,(bounds.x-pad)*video.videoWidth);
    const y=Math.max(0,(bounds.y-pad)*video.videoHeight);
    const right=Math.min(video.videoWidth,(bounds.x+bounds.w+pad)*video.videoWidth);
    const bottom=Math.min(video.videoHeight,(bounds.y+bounds.h+pad)*video.videoHeight);
    if(right-x<video.videoWidth*.35||bottom-y<video.videoHeight*.35)return defaultCrop(video);
    return {x,y,w:right-x,h:bottom-y};
  }

  async function captureScan(video,bounds){
    const crop=detectedCrop(video,bounds);
    const scale=Math.min(1,MAX_OUTPUT_WIDTH/crop.w);
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(crop.w*scale));
    canvas.height=Math.max(1,Math.round(crop.h*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.filter='contrast(1.16) brightness(1.04) saturate(.88)';
    ctx.drawImage(video,crop.x,crop.y,crop.w,crop.h,0,0,canvas.width,canvas.height);
    ctx.filter='none';
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));
    if(!blob)throw Error('Não foi possível processar a foto.');
    return new File([blob],`redacao-digitalizada-${Date.now()}.jpg`,{type:'image/jpeg',lastModified:Date.now()});
  }

  async function openScanner(roundId){
    if(!navigator.mediaDevices?.getUserMedia||!window.isSecureContext){nativePicker(roundId,true);return}
    const mobile=window.matchMedia?.('(max-width:760px)').matches===true;
    const dialog=document.createElement('dialog');
    dialog.className='app-confirm student-photo-confirm student-scanner-dialog';
    dialog.style.cssText=mobile
      ?'position:fixed;inset:0;margin:0;width:100vw;max-width:none;height:100dvh;max-height:none;border:0;border-radius:0;padding:0;overflow:hidden;background:#111;color:#fff;'
      :'width:min(96vw,720px);max-width:720px;padding:14px;overflow:hidden;';
    const topStyle=mobile
      ?'padding:calc(10px + env(safe-area-inset-top)) 14px 8px;background:rgba(17,17,17,.98);color:#fff;'
      :'padding:0;';
    const stageStyle=mobile
      ?'position:relative;min-height:0;background:#000;overflow:hidden;display:grid;place-items:center;'
      :'position:relative;background:#111;border-radius:14px;overflow:hidden;min-height:52vh;display:grid;place-items:center;';
    const videoStyle=mobile
      ?'display:block;width:100%;height:100%;min-height:0;object-fit:cover;background:#000;'
      :'width:100%;height:62vh;max-height:650px;object-fit:cover;background:#111;';
    const guideStyle=mobile
      ?'position:absolute;left:50%;top:50%;width:min(82vw,430px);height:auto;aspect-ratio:210/297;transform:translate(-50%,-50%);border:3px solid rgba(255,255,255,.92);border-radius:10px;box-shadow:0 0 0 9999px rgba(0,0,0,.24);pointer-events:none;max-height:88%;'
      :'position:absolute;inset:7% 9%;border:3px solid rgba(255,255,255,.92);border-radius:12px;box-shadow:0 0 0 9999px rgba(0,0,0,.22);pointer-events:none;';
    const controlsStyle=mobile
      ?'display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:rgba(17,17,17,.98);margin:0;'
      :'margin-top:12px;justify-content:center;';
    const buttonStyle=mobile?'min-height:48px;margin:0;padding:0 12px;':'';
    dialog.innerHTML=`<div data-scan-shell style="${mobile?'height:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:#111;':'display:block;'}"><div data-scan-head style="${topStyle}"><h2 style="margin:0 0 ${mobile?'2':'8'}px;font-size:${mobile?'20':'inherit'}px;line-height:1.2">Fotografar redação</h2><p class="muted" style="margin:0;color:${mobile?'rgba(255,255,255,.78)':'inherit'};font-size:${mobile?'12':'inherit'}px;line-height:1.35">Centralize a folha. O VERSÃO detecta as bordas, recorta a área útil e melhora o contraste.</p></div><div data-scan-stage style="${stageStyle}"><video data-scan-video autoplay playsinline muted style="${videoStyle}"></video><div data-scan-guide style="${guideStyle}"></div><div data-scan-status style="position:absolute;left:50%;bottom:${mobile?'12':'14'}px;transform:translateX(-50%);max-width:88%;overflow:hidden;text-overflow:ellipsis;background:rgba(0,0,0,.7);color:#fff;padding:7px 11px;border-radius:999px;font-size:12px;white-space:nowrap">Procurando a folha…</div></div><div class="item-actions" data-scan-controls style="${controlsStyle}"><button type="button" class="btn soft-btn" data-scan-cancel style="${buttonStyle}${mobile?'background:#fff;color:#8B1C1C;border-color:#fff;':''}">Cancelar</button><button type="button" class="btn soft-btn" data-scan-torch hidden style="${buttonStyle}${mobile?'background:#292929;color:#fff;border-color:#555;':''}">Flash</button><button type="button" class="btn primary" data-scan-capture style="${buttonStyle}">Fotografar</button></div></div>`;
    document.body.appendChild(dialog);
    const video=dialog.querySelector('[data-scan-video]'),status=dialog.querySelector('[data-scan-status]'),guide=dialog.querySelector('[data-scan-guide]'),torchBtn=dialog.querySelector('[data-scan-torch]'),captureBtn=dialog.querySelector('[data-scan-capture]');
    let stream=null,track=null,torch=false,closed=false,latest=null,stable=null,stableFrames=0,raf=0,lastAnalysis=0;
    const analysisCanvas=document.createElement('canvas'),analysisCtx=analysisCanvas.getContext('2d',{willReadFrequently:true});
    const previousOverflow=document.body.style.overflow;
    const syncViewport=()=>{
      if(!mobile)return;
      const viewportHeight=Math.round(window.visualViewport?.height||window.innerHeight||document.documentElement.clientHeight);
      if(viewportHeight>0)dialog.style.height=`${viewportHeight}px`;
    };
    const stop=()=>{
      closed=true;
      if(raf)cancelAnimationFrame(raf);
      if(stream)stream.getTracks().forEach(t=>t.stop());
      if(mobile){window.visualViewport?.removeEventListener('resize',syncViewport);window.removeEventListener('orientationchange',syncViewport);document.body.style.overflow=previousOverflow}
      try{dialog.close()}catch{}
      dialog.remove();
    };
    dialog.oncancel=event=>{event.preventDefault();stop()};
    dialog.querySelector('[data-scan-cancel]').onclick=stop;
    if(mobile){document.body.style.overflow='hidden';syncViewport();window.visualViewport?.addEventListener('resize',syncViewport);window.addEventListener('orientationchange',syncViewport)}
    dialog.showModal();
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:2560}}});
      if(closed){stream.getTracks().forEach(t=>t.stop());return}
      video.srcObject=stream;await video.play();syncViewport();
      track=stream.getVideoTracks()[0];
      const caps=track.getCapabilities?.()||{};
      if(caps.torch){
        torchBtn.hidden=false;
        torchBtn.onclick=async()=>{
          try{torch=!torch;await track.applyConstraints({advanced:[{torch}]});torchBtn.textContent=torch?'Desligar flash':'Flash'}catch{torch=false;torchBtn.hidden=true}
        };
      }
      const analyze=time=>{
        if(closed)return;
        if(time-lastAnalysis>260&&video.readyState>=2){
          lastAnalysis=time;
          let found=null;try{found=detectDocument(video,analysisCanvas,analysisCtx)}catch{}
          if(found){
            if(stable&&Math.abs(found.x-stable.x)<.035&&Math.abs(found.y-stable.y)<.035&&Math.abs(found.w-stable.w)<.05&&Math.abs(found.h-stable.h)<.05)stableFrames++;else stableFrames=0;
            stable=found;latest=found;
            const ready=stableFrames>=2;
            status.textContent=ready?'Folha detectada — pode fotografar':'Ajustando enquadramento…';
            guide.style.borderColor=ready?'#8ee6b5':'rgba(255,255,255,.92)';
          }else{
            stableFrames=0;stable=null;latest=null;status.textContent='Centralize a folha na moldura';guide.style.borderColor='rgba(255,255,255,.92)';
          }
        }
        raf=requestAnimationFrame(analyze);
      };
      raf=requestAnimationFrame(analyze);
      captureBtn.onclick=async()=>{
        if(captureBtn.disabled)return;
        captureBtn.disabled=true;captureBtn.textContent='Processando…';
        try{
          const file=await captureScan(video,latest);
          stop();
          window.showStudentFileConfirm(roundId,file,()=>{},true);
        }catch(error){captureBtn.disabled=false;captureBtn.textContent='Fotografar';scannerError(error?.message||'Não foi possível fotografar a redação.')}
      };
    }catch(error){
      stop();
      nativePicker(roundId,true);
    }
  }

  // O handler já existente em student-upload.e12.js chama esta função global.
  window.chooseStudentFile=function(roundId,camera=false){
    if(!roundId||S?.profile?.role!=='student')return;
    if(camera){openScanner(roundId);return}
    nativePicker(roundId,false);
  };
})();
