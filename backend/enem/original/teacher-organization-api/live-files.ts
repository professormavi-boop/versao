// Validate signatures and bounded DOCX directory without decompressing untrusted data.
export function validateLiveFile(name:string,bytes:Uint8Array){
 if(!bytes.length||bytes.length>15728640)throw Error('Use um arquivo de até 15 MB.');
 const ext=name.toLowerCase().split('.').pop();
 const text=(offset:number,length:number)=>new TextDecoder().decode(bytes.subarray(offset,offset+length));
 if(['jpg','jpeg'].includes(ext||'')&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(ext==='png'&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b))return 'image/png';
 if(ext==='webp'&&text(0,4)==='RIFF'&&text(8,4)==='WEBP')return 'image/webp';
 if(ext==='pdf'&&text(0,5)==='%PDF-')return 'application/pdf';
 if(ext==='docx'){
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
  if(end<0)throw Error('Documento Word inválido.');
  const count=view.getUint16(end+10,true),size=view.getUint32(end+12,true),offset=view.getUint32(end+16,true);
  if(view.getUint16(end+4,true)!==0||view.getUint16(end+6,true)!==0||count>1000||!count||offset+size>end)throw Error('Documento Word fora dos limites.');
  let cursor=offset,total=0;const names=new Set<string>();
  for(let i=0;i<count;i++){
   if(cursor+46>offset+size||view.getUint32(cursor,true)!==0x02014b50)throw Error('Documento Word inválido.');
   const uncompressed=view.getUint32(cursor+24,true),length=view.getUint16(cursor+28,true),extra=view.getUint16(cursor+30,true),comment=view.getUint16(cursor+32,true);
   if(cursor+46+length+extra+comment>offset+size)throw Error('Documento Word inválido.');
   const entry=text(cursor+46,length),local=view.getUint32(cursor+42,true),compressed=view.getUint32(cursor+20,true);total+=uncompressed;
   if(local+30>offset||view.getUint32(local,true)!==0x04034b50)throw Error('Documento Word inválido.');
   const localName=view.getUint16(local+26,true),localExtra=view.getUint16(local+28,true);
   if(local+30+localName+localExtra+compressed>offset||text(local+30,localName)!==entry)throw Error('Documento Word inválido.');
   if((view.getUint16(cursor+8,true)&1)||total>20971520||/vbaProject|\.\.\//i.test(entry)||names.has(entry))throw Error('Use um DOCX sem macros, senha ou conteúdo excessivo.');
   names.add(entry);cursor+=46+length+extra+comment;
  }
  if(!names.has('[Content_Types].xml')||!names.has('word/document.xml'))throw Error('O arquivo não é um documento DOCX.');
  return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
 }
 throw Error('Use JPG, PNG, WEBP, PDF ou DOCX válidos.');
}

