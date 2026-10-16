'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const destination=process.argv[2];
if(!destination||!path.isAbsolute(destination))throw Error('Informe diretório absoluto de saída para o pacote privado.');
const source=path.resolve('backend/enem/prepared/teacher-organization-api');
if(path.resolve(destination).startsWith(path.resolve('.')))throw Error('Use uma pasta temporária fora do repositório.');
fs.mkdirSync(destination,{recursive:true});
const hashes={};
for(const file of fs.readdirSync(source)){
 const original=fs.readFileSync(path.join(source,file));hashes[file]=crypto.createHash('sha256').update(original).digest('hex');
 fs.writeFileSync(path.join(destination,file),fs.existsSync('backend/writing/prepared/'+file)?fs.readFileSync('backend/writing/prepared/'+file):original);
}
for(const name of ['partial.ts','live-transcription.ts','writing-tutor.ts','writing-independent.ts'])fs.copyFileSync('backend/writing/prepared/'+name,path.join(destination,name));
fs.writeFileSync(path.join(destination,'baseline-v17.json'),JSON.stringify(hashes,null,2));
console.log('Pacote privado preparado, 18 módulos; baseline v17 preservada no commit-base. Nenhum deploy.');
