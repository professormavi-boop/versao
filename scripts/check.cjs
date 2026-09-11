const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const refs=[...html.matchAll(/(?:href|src)="(\/[^"#]+)"/g)].map(m=>m[1].slice(1));
for(const f of refs)assert(fs.existsSync(path.join(root,f)),`Arquivo ausente: ${f}`);
const scripts=refs.filter(f=>f.endsWith('.js'));new vm.Script(scripts.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n'));
const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));assert(!config.routes&&!config.rewrites&&!config.redirects,'Roteamento intermediário não permitido');
const code=scripts.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');assert(!/MutationObserver|DecompressionStream|document\.write|sb_secret_|service_role/.test(code));assert(code.includes('MUTATIONS_ENABLED=false,PAID_AI_ENABLED=true'));
assert(fs.readFileSync(path.join(root,'base.e12.css'),'utf8').includes('data:image/'));
console.log(`${refs.length} arquivos referenciados presentes; scripts válidos juntos; logo incorporada; sem proxy; gravações administrativas bloqueadas.`);
