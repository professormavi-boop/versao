'use strict';
importScripts('/vendor/xlsx.full.min.js?v=0.20.3');
self.onmessage = event => {
 try {
  const workbook = XLSX.read(event.data, {type: 'array', dense: true, sheetRows: 522, cellFormula: false, cellHTML: false, cellStyles: false});
  if (workbook.SheetNames.length > 40) throw Error('Envie uma planilha com até 40 abas.');
  const sheets = workbook.SheetNames.map(name => {
   const sheet = workbook.Sheets[name];
   const range = XLSX.utils.decode_range(sheet['!fullref'] || sheet['!ref'] || 'A1');
   if (range.e.c >= 40 || range.e.r >= 522) return {name, error: 'Esta aba ultrapassa 522 linhas ou 40 colunas. Divida a lista em lotes de até 500 alunos.'};
   const rows = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: '', raw: false, blankrows: true});
   return {name, rows};
  });
  self.postMessage({sheets});
 } catch (error) { self.postMessage({error: error.message === 'File is password-protected' ? 'Remova a senha de proteção da planilha e tente novamente.' : error.message || 'Arquivo inválido. Salve como Excel e tente novamente.'}); }
};
