'use strict';

// VERSÃO — captura nativa de foto para redações.
// Ao tocar em "Tirar foto", abre a câmera do próprio aparelho por meio do
// input file com capture="environment". A imagem original retornada pelo
// celular é enviada sem canvas, recorte, filtro ou recompressão no navegador.
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
    input.accept=camera?'image/*':STUDENT_UPLOAD_ACCEPT;
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
    const mime=studentUploadMime(file);
    const dialog=document.createElement('dialog');
    dialog.className='app-confirm student-photo-confirm';

    let objectUrl='';
    const preview=String(mime||'').startsWith('image/')
      ?(()=>{
          objectUrl=URL.createObjectURL(file);
          return `<img src="${objectUrl}" alt="Prévia da redação" style="display:block;max-width:100%;max-height:58vh;margin:0 auto 12px;object-fit:contain;border-radius:10px">`;
        })()
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
        // Envia exatamente o arquivo devolvido pela câmera nativa.
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

  window.chooseStudentFile=function(roundId,camera=false){
    if(!roundId||S?.profile?.role!=='student')return;
    nativePicker(roundId,camera);
  };
})();
