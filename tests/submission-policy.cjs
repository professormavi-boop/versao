const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const feature=fs.readFileSync(path.join(root,'submission-policy.e12.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert(index.includes('/submission-policy.e12.js?v=20260929-handwritten-v1'),'index.html deve carregar submission-policy.e12.js');
assert(index.indexOf('student-replacement-flow-beta.e12.js')<index.indexOf('submission-policy.e12.js'),'política deve carregar depois do fluxo de reenvio');
assert(feature.includes('Somente manuscrita'),'editor deve oferecer a opção somente manuscrita');
assert(feature.includes('Manuscrita ou digitada'),'editor deve preservar a opção mista');
assert(feature.includes("body?.action==='paste'"),'envio digitado deve ter bloqueio no cliente');
assert(feature.includes("button.remove()"),'botão de colar texto deve ser removido da interface manuscrita');
assert(feature.includes('MANUSCRIPT_MARKER'),'preferência deve ser persistida no proposal_html');
assert(feature.includes("#pvDraft,#pvPreviewDraft,#pvPreviewPublish"),'marcador só deve ser sincronizado antes de salvar/publicar');
assert(!feature.includes("document.addEventListener('click',()=>{\n    syncTeacherMarker()"),'cliques comuns não podem reescrever o editor');
assert(!feature.includes('MutationObserver'),'recurso não deve depender de observer corretivo');
assert(!feature.includes('alert(')&&!feature.includes('confirm(')&&!feature.includes('prompt('),'recurso não deve introduzir diálogos nativos');
console.log('submission-policy: ok');
