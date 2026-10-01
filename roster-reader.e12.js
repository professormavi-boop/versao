'use strict';
// The same reader is used by the wizard and the legacy single-student form.
const RosterReader = (() => {
 const normalize = value => String(value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
 const email = value => /^\S+@\S+\.\S+$/.test(value) && value.length <= 254;
 const nameHeaders = ['nome', 'nome completo', 'nome do aluno', 'nome aluno', 'aluno', 'alunos', 'estudante', 'nome do estudante', 'full_name', 'name'];
 const emailHeaders = ['email', 'e-mail', 'email do aluno', 'e-mail do aluno'];
 const extraHeaders = {registrationColumn:['matricula','numero de matricula','nº matricula','ra','registro'],schoolColumn:['escola','instituicao','colegio'],classColumn:['turma','classe','sala']};
 function delimited(text, delimiter) {
  const table = []; let row = [], cell = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
   const c = text[i];
   if (c === '"') {
    if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (quoted) { quoted = false; closed = true; }
    else if (!cell && !closed) quoted = true;
    else throw Error('Confira as aspas da lista.');
   } else if (!quoted && (c === delimiter || c === '\n' || c === '\r')) {
    row.push(cell); cell = ''; closed = false;
    if (c !== delimiter) { table.push(row); row = []; if (c === '\r' && text[i + 1] === '\n') i++; }
   } else { if (closed && c.trim()) throw Error('Confira as aspas da lista.'); cell += c; }
  }
  if (quoted) throw Error('Há aspas sem fechamento na lista.');
  row.push(cell); if (row.some(v => v.trim())) table.push(row);
  return table;
 }
 function textTable(value) {
  const text = String(value ?? '').replace(/^\uFEFF/, '');
  if (!text.trim()) throw Error('Envie a planilha ou cole a lista de alunos.');
  if(text.includes('\uFFFD'))throw Error('Não foi possível ler os acentos. Salve o CSV como UTF-8 ou envie o Excel original.');
  if (text.length > 250000) throw Error('Divida a lista em lotes menores (até 250 KB de texto).');
  // Score the entire input: the first line can contain only a name or a title.
  const options = ['\t', ';', ','].map(delimiter => {
   try { const rows = delimited(text, delimiter); return {rows, score: rows.filter(r => r.length > 1).length}; }
   catch { return {rows: null, score: -1}; }
  }).sort((a, b) => b.score - a.score);
  if (!options[0].rows) throw Error('Confira as aspas da lista.');
  const rows = options[0].rows;
  if (rows.length > 1100 || rows.some(r => r.length > 40)) throw Error('Envie até 500 alunos por lote e até 40 colunas.');
  return rows;
 }
 function infer(table) {
  if (!table.length) throw Error('Esta aba está vazia.');
  for (let i = 0; i < Math.min(20, table.length); i++) {
   const header = table[i].map(normalize), nameColumn = header.findIndex(v => nameHeaders.includes(v));
   if (nameColumn >= 0) return {nameColumn, emailColumn: header.findIndex(v => emailHeaders.includes(v)), ...Object.fromEntries(Object.entries(extraHeaders).map(([key,aliases])=>[key,header.findIndex(v=>aliases.includes(v))])), startRow: i + 1, headerRow: i};
  }
  const width = Math.max(...table.map(r => r.length));
  if (width === 1) return {nameColumn: 0, emailColumn: -1, startRow: 0, headerRow: -1};
  const sample = table.filter(r => r.some(v => String(v).trim())).slice(0, 25);
  const emailColumn = Array.from({length: width}, (_, col) => col).find(col => sample.some(r => email(String(r[col] || '').trim())));
  const textColumns = Array.from({length: width}, (_, col) => col).filter(col => col !== emailColumn && sample.filter(r => /[A-Za-zÀ-ÿ]{2}/.test(r[col] || '') && !String(r[col] || '').includes('@')).length >= Math.max(1, sample.length / 2));
  if (textColumns.length !== 1) throw Error('Não foi possível identificar a coluna de nomes. Escolha as colunas ou use Organizar com IA.');
  const numericColumns=Array.from({length:width},(_,col)=>col).filter(col=>col!==textColumns[0]&&col!==emailColumn&&sample.some(r=>String(r[col]||'').trim())&&sample.every(r=>!String(r[col]||'').trim()||/^\d+$/.test(String(r[col]).trim())));
  return {nameColumn: textColumns[0], emailColumn: emailColumn ?? -1, registrationColumn:numericColumns.length===1?numericColumns[0]:-1,schoolColumn:-1,classColumn:-1,startRow: 0, headerRow: -1};
 }
 function map(table, mapping) {
  const {nameColumn, emailColumn, startRow} = mapping;
  const width = Math.max(0, ...table.map(r => r.length));
  if (![nameColumn, emailColumn, startRow].every(Number.isInteger) || nameColumn < 0 || nameColumn >= width || emailColumn < -1 || emailColumn >= width || emailColumn === nameColumn || startRow < 0 || startRow >= table.length) throw Error('Confira as colunas e a primeira linha de alunos.');
  const extra=Object.keys(extraHeaders).map(k=>mapping[k]??-1);
  if(extra.some(c=>!Number.isInteger(c)||c < -1||c>=width)||new Set([nameColumn,emailColumn,...extra].filter(c=>c>=0)).size!==[nameColumn,emailColumn,...extra].filter(c=>c>=0).length)throw Error('Cada coluna deve representar apenas uma informação.');
  const rows = [], singleColumn = width === 1 && emailColumn === -1;
  for (let i = startRow; i < table.length; i++) {
   const r = table[i]; if (!r.some(v => String(v ?? '').trim())) continue;
   const rawName = String(r[nameColumn] ?? '').trim();
   if (/[;\t\r\n]/.test(rawName)) throw Error(`Linha ${i + 1}: o nome contém outras colunas ou quebras de linha. Confira o separador da lista.`);
   const name = rawName.replace(/\s+/g, ' '), mail = emailColumn < 0 ? '' : String(r[emailColumn] ?? '').trim().toLowerCase();
   if (singleColumn && email(name) && rows.length && !rows.at(-1).email) { rows.at(-1).email = name.toLowerCase(); continue; }
   if (name.length < 2 || name.length > 160 || name.includes('@') || !/[A-Za-zÀ-ÿ]/.test(name) || mail && !email(mail)) throw Error(`Confira nome e e-mail na linha ${i + 1}.`);
   if (nameHeaders.includes(normalize(name))) throw Error(`Linha ${i + 1}: parece ser um cabeçalho, não um aluno. Confira a primeira linha de alunos.`);
   const registration=String(r[mapping.registrationColumn]??'').trim(), school=String(r[mapping.schoolColumn]??'').trim(), className=String(r[mapping.classColumn]??'').trim();
   if(registration.length>80||school.length>160||className.length>80)throw Error(`Linha ${i+1}: confira matrícula, escola e turma.`);
   rows.push({name, email: mail,registration,school,className});
  }
  if (!rows.length || rows.length > 500) throw Error('Envie de 1 a 500 alunos por lote. Você pode enviar quantos lotes precisar.');
  return rows;
 }
 function workbookFile(file) {
  if (!/\.(xlsx|xls)$/i.test(file.name)) throw Error('Envie um arquivo Excel (.xlsx ou .xls).');
  if (file.size > 5 * 1024 * 1024) throw Error('Envie uma planilha de até 5 MB.');
  return new Promise((resolve, reject) => {
   const worker = new Worker('/roster-reader.worker.js?v=20261001-excel1');
   const done = (error, result) => { clearTimeout(timer); worker.terminate(); error ? reject(error) : resolve(result); };
   const timer = setTimeout(() => done(Error('A leitura demorou demais. Salve apenas a aba com os alunos e tente novamente.')), 20000);
   worker.onmessage = e => done(e.data.error ? Error(e.data.error) : null, e.data.sheets);
   worker.onerror = () => done(Error('Não foi possível ler o Excel. Tente salvar como .xlsx ou cole as células.'));
   file.arrayBuffer().then(buffer => worker.postMessage(buffer, [buffer])).catch(() => done(Error('Não foi possível abrir o arquivo.')));
  });
 }
 return {textTable, infer, map, workbookFile};
})();
