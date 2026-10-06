# Auditoria ENEM — implementação preparada em 06/10/2026

Branch local: `fix/enem-evidence-review`. Base limpa: `9e328e691ddb4773b281cbfbfcbcfb25cf5e65b0`.
Estado remoto consultado somente por leitura: `ai-correction-beta-api` v28 e `teacher-organization-api` v14. A leitura de ACL confirmou `EXECUTE=false` para `anon` e `authenticated` nas quatro RPCs de conclusão/aprovação/revisão/compartilhamento; clientes não podem chamar diretamente essas funções. Nenhuma função, credencial, nota, link existente ou configuração remota foi alterada.

## Evidência e escopo

O relatório `Validacao_criterios_ENEM_VERSAO.docx`, Library `libfile_88abea36fee88191bd07d79da635619b`, foi resolvido pela skill Library e preparado para materialização em `/workspace/audit-reference`. O helper atual falhou com `download failed`; a verificação local confirmou ausência de bytes legíveis. Não foi substituído por URL inventada ou cópia de outro executor. A implementação utiliza o resumo integral autorizado na delegação; cotejo com o DOCX continua pendente.

Não houve reprocessamento pago, dados pessoais em fixtures, amostragem de redações reais ou tentativa de inferir rigor global por médias pequenas. A publicação da cartilha 2026, informada na auditoria, não foi tratada como consulta integral de seu conteúdo. Não se alega conformidade integral nem mudança normativa C5 em 2026.

## Mudanças

- Evidência incerta (`[?]` e marcadores de ilegibilidade), ausente ou sem trecho literal é removida dos desvios; nenhuma remoção recalcula a nota. O resultado registra motivos por índice, invalida a sustentação de C1 e exige revisão qualitativa de faixa, diagnóstico e sintaxe. Não há desconto por erro nem nota derivada da contagem.
- Duplicatas são identificadas pelo intervalo literal no texto normalizado (NFC/espaços). Descrições equivalentes de localização e contextos de tamanhos diferentes não criam ocorrências distintas. Trechos repetidos sem contexto suficiente são ambíguos e vão para revisão; não se escolhe uma ocorrência arbitrariamente.
- Confirmação não é o padrão. Toda ocorrência exige decisão explícita; índices duplicados, ausentes ou fora do conjunto original são rejeitados. O servidor também valida: não basta `review_confirmed=true`.
- Todas as pendências essenciais exigem resolução textual vinculada à pendência exata. A fundamentação é uma declaração humana, não uma verificação automática da verdade da resposta. Descartes, mudança de C1 e análises legadas sem auditoria desta política exigem reavaliação de C1, mesmo para manter a nota. O diagnóstico revisado substitui o anterior na publicação.
- A interface normal e Ao Vivo usam o mesmo núcleo, com teste de equivalência das três cópias. As decisões do Ao Vivo só são restauradas como revisadas quando vieram da nova política; confirmações históricas automáticas não são reaproveitadas silenciosamente.
- C2/C3 permanecem qualitativos: legitimidade, pertinência e produtividade contextual; projeto e desenvolvimento. As instruções não proíbem autores/repertórios por lista fixa e evitam dupla penalização automática. Títulos, nomes e grafias históricas exigem cautela documental. C5 admite detalhamento de agente, ação, meio ou efeito/finalidade.
- Novos links do Ao Vivo de professor exigem revisão com a nova política. Para aluno, análises legadas sem auditoria atual, com desvios ou pendências essenciais não podem gerar novos links antes de revisão docente; estimativas atuais sem essas pendências preservam compartilhamento. A interface exibe a mensagem retornada pela API. **O fluxo atual não transfere uma redação do aluno para professor; encaminhamento desse caso continua uma limitação do produto.** Links já emitidos não são revogados.
- A auditoria de revisão não inclui relógio variável no payload canônico, preservando a idempotência da RPC de aprovação após falha/repetição. Datas reais de aprovação/revisão continuam sendo responsabilidade das RPCs existentes.

## Persistência e transporte

Database: nenhum impacto aplicado. Sem migrations, schema, RLS, grants, Auth, Storage, triggers ou RPCs alterados. O pacote preparado acrescenta apenas campos em JSONs já existentes para **novas** análises/revisões. Não modifica históricos em lote.

A consulta das definições de `finish_correction_evidence` e `approve_essay_beta_atomic` revelou exigência literal de `quality_version='enem-evidence-2026-09-20'`. Esse contrato foi preservado. A política nova usa `enem-review-2026-10-06` em `evidence_audit.version` e `review_audit.policy_version`, sem fingir que o contrato de banco foi migrado.

`request_manifest` registra versão de política/contrato, modelo, SHA-256 das instruções e do schema e tipos/ordem dos inputs (texto, imagem, arquivo; detalhe de imagem). Ele é derivado do payload efetivamente montado, preservado após o reconhecimento do provedor e na conclusão. Não registra redação, nomes, URLs assinadas, tokens ou conteúdo dos arquivos. Não é hash do arquivo nem prova de leitura visual pelo modelo; falha entre envio e reconhecimento ainda pode impedir seu registro. Não há backfill nem manifesto confiável para entradas históricas. A rota de imagem/PDF foi preservada.

`backend/enem/manifest.json` registra versões remotas e hashes SHA-256 dos arquivos originais/preparados para comparação antes de eventual implantação. `backend/` permanece fora do upload estático pela allowlist `.vercelignore`; somente `enem-review.e12.js` foi acrescentado à lista pública.

## Verificação

- `npm test`: suíte existente completa, HTTP/DOM e quatro novas suítes ENEM.
- `npm run check`: sintaxe conjunta do frontend, assets, logo, configuração e bloqueios existentes.
- `npm run test:enem`: cinco regressões da auditoria; faixas 0/40/80/120/160/200, valores inválidos e soma; incerteza; deduplicação; revisões legadas; repetição/interrupção; privacidade do manifesto; equivalência da normalização normal/Ao Vivo; publicação/revisão nos handlers reais com transporte/banco simulados; UI normal e Ao Vivo, cancelamento, edição/restauração e falha de rede.
- Typecheck dos dois módulos `correction-quality.ts`: TypeScript 5.9.3, `--noEmit --target es2022 --module esnext`. Cache temporário em `/tmp/enem-npm-cache`, sem dependência adicionada ao projeto.
- `node --check`: todos os 19 módulos TypeScript preparados; `git diff --check`.
- O projeto é estático, sem scripts `lint`, `typecheck` ou `build` próprios; `buildCommand:null`. `check` é a verificação existente. Não se alega lint completo, build compilado ou typecheck integral do runtime Deno. Os testes dos handlers usam o stripping TypeScript de Node 24, com aviso experimental esperado.

Não foram homologados login real, layout em aparelho físico, comportamento do modelo com cobrança, banco real de homologação ou deployment. HTTP 200 e mocks não equivalem a esses testes. A ausência do DOCX impede garantir cobertura de recomendações que não constavam do resumo.

## Implantação proposta — não executada

1. Conferir novamente HEAD remoto e hashes das funções vigentes contra `backend/enem/original`; reconciliar divergências sem sobrescrever trabalho concorrente. Cotejar o DOCX quando disponível.
2. Homologar as duas funções preparadas em backend isolado, especialmente JSONs das RPCs, geração/conclusão e persistência do manifesto. Não usar o Supabase compartilhado como ambiente de teste de escrita. Verificar grants das RPCs e impossibilidade de chamada direta por cliente; a barreira preparada está nas Edge Functions.
3. Apresentar e obter autorização específica para ativar as funções no backend compartilhado. Ativação do backend afeta produção mesmo com frontend de preview. Coordenar frontend e backend: frontend antigo passará a receber bloqueios da nova política; frontend novo sozinho não oferece as garantias no servidor antigo.
4. Depois de autorizado, publicar frontend exclusivamente no projeto isolado `prj_7mEBS5QDaBWrG4hjnBKelNkU90OY`, branch oficial `feat/ao-vivo-preview`, e homologar no domínio `https://teste.versaoprofessor.com/`. Não alterar main, domínios, variáveis ou credenciais. Aprovação adicional é necessária antes de produção.
5. Conferir o novo asset público, o bloqueio dos fontes de backend e o manifesto de uma análise sintética explicitamente autorizada. Não iniciar cobrança automaticamente.

Nenhum push/PR/deploy foi executado. O push pode disparar deployments por integração Git; o vínculo ao projeto isolado precisa ser confirmado antes dessa ação. A entrega é local e commitada para revisão.

## Rollback proposto

Reverter somente os commits desta branch no frontend e restaurar o conjunto original completo da API normal v28 e da API Ao Vivo v14, após autorização da operação remota. Os originais estão em `backend/enem/original`, com hashes no manifesto. Não apagar revisões, recibos, notas ou campos JSON já gravados; os campos adicionais são ignoráveis pelo contrato antigo. Não há migração a desfazer. A restauração também remove os novos bloqueios: avaliar suspensão de novas aprovações/compartilhamentos durante uma regressão, em vez de restaurar silenciosamente o comportamento inseguro. Não modificar links ou notas anteriores como parte do rollback.
