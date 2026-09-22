'use strict';

// VERSÃO — câmera simples para envio de redação.
// Mantém a captura em tela cheia, sem detecção de bordas, recorte automático
// ou correção de perspectiva. O backend de upload permanece inalterado.
(function(){
  function cameraError(message){
    if(typeof studentUploadError==='function')studentUploadError(message);
    else if(typeof window.actionAlert==='function')window.actionAlert(message,'Atenção');
    else if(typeof toast==='function')toast(message);
  }

  function nativePicker(roundId,camera=false){
    if(!roundId||S?.profile?.role!=='student')return;
    const input=document.createElement('input');
    input.type='file';
    input.hidden=true;
    input.accept=camera?'image/jpeg,image/png,image/webp':STUDENT_UPLOAD_ACCEPT;
    if(camera)input.setAttribute('capture','environment');
    document.body.appendChild(input);
    const cleanup=()=>input.remove();
    input.onchange=()=>{
      const file=input.files?.[0];
      if(!file){cleanup();return}
      const mime=studentUploadMime(file);
      if(!mime||file.size>STUDENT_UPLOAD_MAX){
        cleanup();
        cameraError(`Arquivos aceitos: ${STUDENT_UPLOAD_ACCEPTED}. Máximo de 15 MB.`);
        return;
      }
      window.showStudentFileConfirm(roundId,file,cleanup,camera);
    };
    input.click();
  }

  window.showStudentFileConfirm=function(roundId,file,cleanup=()=>{},camera=false){
    const mime=studentUploadMime(file),dialog=document.createElement('dialog');
    dialog.className='app-confirm student-photo-confirm';
    let objectUrl='';
    const preview=String(mime||'').startsWith('image/')
      ?(()=>{objectUrl=URL.createObjectURL(file);return `<img src="${objectUrl}" alt="Prévia da redação" style="display:block;max-width:100%;max-height:58vh;margin:0 auto 12px;object-fit:contain;border-radius:10px">`})()
      :`<div class="safe-note"><b>PDF selecionado:</b> ${esc(file.name)}</div>`;
    const size=studentUploadSizeLabel(file.size);
    dialog.innerHTML=`<h2>Conferir ${camera?'foto':'arquivo'}</h2>${preview}<p><b>${esc(file.name||'Redação')}</b><br>${esc(size)}</p><div class="item-actions"><button type="button" class="btn soft-btn" data-camera-change>${camera?'Refazer':'Escolher outro'}</button><button type="button" class="btn primary" data-camera-send>Enviar para correção</button></div>`;
    document.body.appendChild(dialog);
    const finish=()=>{
      if(objectUrl)URL.revokeObjectURL(objectUrl);
      try{dialog.close()}catch{}
      dialog.remove();
      cleanup();
    };
    dialog.oncancel=event=>{event.preventDefault();finish()};
    dialog.querySelector('[data-camera-change]').onclick=()=>{
      finish();
      setTimeout(()=>window.chooseStudentFile(roundId,camera),0);
    };
    const send=dialog.querySelector('[data-camera-send]');
    send.onclick=async()=>{
      if(send.disabled)return;
      send.disabled=true;
      send.textContent='Enviando...';
      try{
        await studentSubmitFile(roundId,file);
        S.cache={};
        S.student=null;
        finish();
        await navigate('student-essays');
        studentUploadSuccess();
      }catch(error){
        send.disabled=false;
        send.textContent='Tentar novamente';
        cameraError(error?.message||'Falha no envio.');
      }
    };
    dialog.showModal();
  };

  async function captureFullFrame(track,video){
    let blob=null;
    if(typeof window.ImageCapture==='function'&&track){
      try{
        const imageCapture=new ImageCapture(track);
        blob=await imageCapture.takePhoto();
      }catch{}
    }
    if(!blob){
      if(!video.videoWidth||!video.videoHeight)throw Error('A câmera ainda não está pronta. Tente novamente.');
      const canvas=document.createElement('canvas');
      const maxSide=2800;
      const scale=Math.min(1,maxSide/Math.max(video.videoWidth,video.videoHeight));
      canvas.width=Math.max(1,Math.round(video.videoWidth*scale));
      canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
      const ctx=canvas.getContext('2d',{alpha:false});
      ctx.drawImage(video,0,0,video.videoWidth,video.videoHeight,0,0,canvas.width,canvas.height);
      blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.96));
    }
    if(!blob)throw Error('Não foi possível capturar a foto.');
    const type=blob.type||'image/jpeg';
    const extension=type.includes('png')?'png':type.includes('webp')?'webp':'jpg';
    return new File([blob],`redacao-${Date.now()}.${extension}`,{type,lastModified:Date.now()});
  }

  async function openFullCamera(roundId){
    if(!navigator.mediaDevices?.getUserMedia||!window.isSecureContext){
      nativePicker(roundId,true);
      return;
    }

    const mobile=window.matchMedia?.('(max-width:760px)').matches===true;
    const dialog=document.createElement('dialog');
    dialog.className='app-confirm student-photo-confirm student-camera-dialog';
    dialog.style.cssText=mobile
      ?'position:fixed;inset:0;margin:0;width:100vw;max-width:none;height:100dvh;max-height:none;border:0;border-radius:0;padding:0;overflow:hidden;background:#000;color:#fff;'
      :'width:min(96vw,760px);max-width:760px;padding:14px;overflow:hidden;background:#111;color:#fff;';

    const shellStyle=mobile
      ?'height:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:#000;'
      :'display:grid;grid-template-rows:auto minmax(420px,68vh) auto;gap:10px;';
    const headStyle=mobile
      ?'padding:calc(10px + env(safe-area-inset-top)) 14px 8px;background:#111;'
      :'padding:0 2px;';
    const stageStyle=mobile
      ?'position:relative;min-height:0;overflow:hidden;background:#000;display:grid;place-items:center;'
      :'position:relative;overflow:hidden;background:#000;border-radius:14px;display:grid;place-items:center;';
    const videoStyle='display:block;width:100%;height:100%;min-height:0;object-fit:contain;background:#000;';
    const controlsStyle=mobile
      ?'display:flex;gap:10px;justify-content:center;align-items:center;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:#111;margin:0;'
      :'display:flex;gap:10px;justify-content:center;align-items:center;margin-top:2px;';
    const buttonStyle=mobile?'min-height:50px;margin:0;padding:0 18px;':'';

    dialog.innerHTML=`<div data-camera-shell style="${shellStyle}"><div data-camera-head style="${headStyle}"><h2 style="margin:0 0 2px;font-size:${mobile?'20':'24'}px;line-height:1.2">Fotografar redação</h2><p style="margin:0;color:rgba(255,255,255,.78);font-size:12px;line-height:1.35">Enquadre toda a folha antes de fotografar.</p></div><div data-camera-stage style="${stageStyle}"><video data-camera-video autoplay playsinline muted style="${videoStyle}"></video><div data-camera-guide style="position:absolute;left:8%;right:8%;top:7%;bottom:7%;border:2px solid rgba(255,255,255,.82);border-radius:10px;pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,.08)"></div></div><div data-camera-controls style="${controlsStyle}"><button type="button" class="btn soft-btn" data-camera-cancel style="${buttonStyle}${mobile?'background:#fff;color:#8B1C1C;border-color:#fff;':''}">Cancelar</button><button type="button" class="btn soft-btn" data-camera-torch hidden style="${buttonStyle}${mobile?'background:#292929;color:#fff;border-color:#555;':''}">Flash</button><button type="button" class="btn primary" data-camera-capture style="${buttonStyle}">Fotografar</button></div></div>`;
    document.body.appendChild(dialog);

    const video=dialog.querySelector('[data-camera-video]');
    const torchBtn=dialog.querySelector('[data-camera-torch]');
    const captureBtn=dialog.querySelector('[data-camera-capture]');
    let stream=null,track=null,torch=false,closed=false;
    const previousOverflow=document.body.style.overflow;

    const syncViewport=()=>{
      if(!mobile)return;
      const viewportHeight=Math.round(window.visualViewport?.height||window.innerHeight||document.documentElement.clientHeight);
      if(viewportHeight>0)dialog.style.height=`${viewportHeight}px`;
    };

    const stop=()=>{
      closed=true;
      if(stream)stream.getTracks().forEach(t=>t.stop());
      if(mobile){
        window.visualViewport?.removeEventListener('resize',syncViewport);
        window.removeEventListener('orientationchange',syncViewport);
        document.body.style.overflow=previousOverflow;
      }
      try{dialog.close()}catch{}
      dialog.remove();
    };

    dialog.oncancel=event=>{event.preventDefault();stop()};
    dialog.querySelector('[data-camera-cancel]').onclick=stop;
    if(mobile){
      document.body.style.overflow='hidden';
      syncViewport();
      window.visualViewport?.addEventListener('resize',syncViewport);
      window.addEventListener('orientationchange',syncViewport);
    }
    dialog.showModal();

    try{
      stream=await navigator.mediaDevices.getUserMedia({
        audio:false,
        video:{
          facingMode:{ideal:'environment'},
          width:{ideal:2560},
          height:{ideal:1920}
        }
      });
      if(closed){stream.getTracks().forEach(t=>t.stop());return}
      video.srcObject=stream;
      await video.play();
      syncViewport();
      track=stream.getVideoTracks()[0];
      const caps=track.getCapabilities?.()||{};
      if(caps.torch){
        torchBtn.hidden=false;
        torchBtn.onclick=async()=>{
          try{
            torch=!torch;
            await track.applyConstraints({advanced:[{torch}]});
            torchBtn.textContent=torch?'Desligar flash':'Flash';
          }catch{
            torch=false;
            torchBtn.hidden=true;
          }
        };
      }

      captureBtn.onclick=async()=>{
        if(captureBtn.disabled)return;
        captureBtn.disabled=true;
        captureBtn.textContent='Capturando...';
        try{
          const file=await captureFullFrame(track,video);
          stop();
          window.showStudentFileConfirm(roundId,file,()=>{},true);
        }catch(error){
          captureBtn.disabled=false;
          captureBtn.textContent='Fotografar';
          cameraError(error?.message||'Não foi possível fotografar a redação.');
        }
      };
    }catch{
      stop();
      nativePicker(roundId,true);
    }
  }

  window.chooseStudentFile=function(roundId,camera=false){
    if(!roundId||S?.profile?.role!=='student')return;
    if(camera){
      openFullCamera(roundId);
      return;
    }
    nativePicker(roundId,false);
  };
})();
