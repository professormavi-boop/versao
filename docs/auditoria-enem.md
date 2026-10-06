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
- A interface normal e Ao Vivo usam o mesmo núcleo, com teste de equivalência das três cópias. As confirmações do Ao Vivo só são restauradas como revisadas quando vieram da nova política; confirmações históricas automáticas não são reaproveitadas silenciosamente. Textos editados e descartes históricos explícitos são preservados ao reabrir.
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


## Segunda revisão e rota de homologação — 06/10/2026

Consultas exclusivamente de leitura, sem push, deploy, chamadas pagas, login ou escrita remota. O `git fetch` trouxe somente o commit já publicado de preview para inspeção local, sem mudar a branch de trabalho.

### Vínculos confirmados

| Camada | Teste | Produção |
|---|---|---|
| Domínio | https://teste.versaoprofessor.com | https://app.versaoprofessor.com |
| Projeto Vercel | `prj_7mEBS5QDaBWrG4hjnBKelNkU90OY` — versao-teste-etapa12-consolidada | `prj_5OC7zfjEgapvbrapPjas2lLvvut7` — versao-producao |
| Deployment atual | `dpl_6GNTiy533KRMvjNmw8BpKcCgTmU7`, READY, target null (preview) | `dpl_E5aE4EbNhqLfougynxcwA4D6oiA5`, READY, target production |
| Branch | `feat/ao-vivo-preview` | `main` |
| Commit | `8681844d7d31a5ee495c1a50297eab825d5521d2` | `9e328e691ddb4773b281cbfbfcbcfb25cf5e65b0` |
| Backend no código desse commit | `https://huccxcpwoydwuisrmboc.supabase.co` | O mesmo |

A consulta específica de domínios confirmou `teste.versaoprofessor.com` verificado e vinculado à branch de preview nesse projeto. A proteção SSO informada pelo projeto é `all_except_custom_domains`: o domínio customizado não deve ser considerado protegido por SSO da Vercel. Auth da aplicação continua necessário, mas não foi homologado nesta etapa.

Os dois commits têm a mesma árvore Git `458c876e73e15cc6f28b09818ba40982f1584250`. O `core.e12.js` tem SHA-256 `db9a40866bfca0082a90a7c12245514249afefe7230a441ae29e8b35ba7b4e9c` em ambos. Esse código fixa o mesmo BASE Supabase, mesma configuração pública de cliente e mesmas rotas: correção normal `ai-correction-beta-api`; Ao Vivo `teacher-organization-api`. A listagem remota confirmou funções ACTIVE/JWT: normal v28, Ao Vivo v14; APIs auxiliares `official-correction-beta-api` v5 e `live-correction-beta-api` v6.

A listagem Supabase retornou Versao e outro produto, Adapte. Não há projeto de homologação do Versão identificado nessa conta; `list_branches` de Versao retornou vazio. Adapte não deve ser reutilizado. **Existe isolamento do frontend, não do backend.** Auth, tabelas, Storage, créditos, jobs, RPCs e Edge Functions do código de preview apontam ao ambiente compartilhado. As flags de frontend não são uma barreira de isolamento: a allowlist permite ações como `correct`, `approve`, `live_start`, `live_review` e `live_share`.

Limite da evidência: GET do HTML e do core em ambos os domínios foi bloqueado pelo proxy do executor (`Tunnel connection failed: 403 Forbidden`). Esse acesso foi interrompido, sem usar URL alternativa para contornar o bloqueio. O vínculo está confirmado pela Vercel e a configuração pelo código exato do commit declarado pelo deployment; não se afirma comparação byte a byte dos assets efetivamente servidos nesta etapa.

### Revisão do diff e preservação histórica

A revisão encontrou uma regressão local em `liveDeviationReviews`: filtrar toda a auditoria antiga para eliminar confirmações implícitas também descartava sugestões/regras editadas e decisões históricas de descarte ao preencher o editor. Corrigido localmente: carregar textos, razões e descartes de todas as versões, mas aceitar confirmação prévia somente da nova política. A decisão histórica `confirmed` volta a `pending`; não se publica nem grava ao abrir.

Acrescentadas verificações sintéticas aos testes existentes para esse caso e para uma revisão histórica com nota 920: tentativa de gerar novo link sem nova política retorna bloqueio; reaprovação incompleta também retorna bloqueio; o objeto histórico permanece byte a byte igual e não ocorre RPC de escrita. A regressão existente de exibição oficial confirmou nota 880 em vez da análise preliminar 840, sem vazamento de feedback antigo. Esses testes e a inspeção de fluxo sustentam que **bloqueio não apaga nem recalcula notas já aprovadas**. Não equivalem a prova sobre todo dado legado possível ou a teste em banco real.

Resultado: **29 scripts de teste passaram — 25 existentes e 4 novos ENEM**, com múltiplas asserções internas; esse número não é uma contagem de 29 cenários individuais. A suíte completa foi reexecutada após a correção histórica. `npm run check`, typecheck dos dois núcleos de qualidade e `git diff --check` também passaram. Logs locais: `/tmp/enem-independent-review-final.log`; prova inicial de histórico em `/tmp/enem-history-handler-review.cjs`, posteriormente incorporada à suíte versionada.

Limitações materiais ainda abertas:

- Backend isolado inexistente; a versão preparada ainda não executou em Deno/Supabase real nem contra as RPCs reais em sandbox. Não há dump completo do schema no checkout.
- Não foram executados login real, CAPTCHA, OAuth, teste visual/mobile, upload real de imagem/PDF, geração/cobrança/estorno real, prova de manifesto durante polling/reconciliação real ou entrega de link externo. Os testes de handlers substituem banco e transporte por mocks; o provedor não é chamado.
- Não há scripts próprios de lint/build nem typecheck integral das funções. O check sintático/estático e o typecheck limitado não devem ser apresentados como esses testes.
- As regras C2/C3/C5 e cautela com grafias históricas estão no prompt; testes de contrato não provam obediência semântica do modelo. O DOCX permanece indisponível para cotejo.
- Revisões anteriores podem ser consultadas; novos links exigem política atual. Aluno sem revisão docente e com pendências fica bloqueado, e não existe fluxo de transferência dessa redação ao professor. Esse efeito de produto precisa ser homologado, sem remover o bloqueio silenciosamente.
- A resolução de pendências aceita fundamentação humana textual; o programa não comprova sua veracidade. Resultados anteriores sem manifesto não passam a ter proveniência retroativa.

### Próximo passo proposto e autorizações específicas faltantes

A proposta é **preparar backend de homologação separado antes de publicar o frontend novo**. O deployment de teste atual pode servir de referência visual, mas não de sandbox de dados. Não recomendo ativar as novas funções em `huccxcpwoydwuisrmboc` para viabilizar um teste.

1. Autorizar criação de um **novo projeto Supabase exclusivo**, nome proposto `versao-homologacao-enem`, com limite de gasto de infraestrutura definido pelo usuário. Seu ID/URL só serão conhecidos após criação. Autorizar exportação apenas do schema necessário (tabelas, funções, RLS e grants), sem linhas, usuários, redações, arquivos ou saldos da produção. Conferir dependências de Auth/Storage e RPCs; nenhum clone de dados de alunos. Não usar Adapte.
2. Autorizar implantação nesse backend das duas funções preparadas e das dependências necessárias ao fluxo normal/Ao Vivo; criar somente perfis, escola/turma/proposta e saldos **sintéticos**, sem vínculos comerciais. Configurar segredos exclusivos de teste por canal seguro, sem imprimir nem copiar credenciais de produção. Login/CAPTCHA e eventual OAuth precisam ser configurados para o domínio de teste no ambiente isolado; qualquer ajuste em configuração compartilhada requer autorização separada.
3. Autorizar ajuste do frontend de homologação para o novo BASE/configuração pública, com verificação que impeça fallback ao Supabase de produção. O BASE atual é literal no JavaScript: mudar somente variáveis Vercel não troca o backend. Autorizar deploy **Preview apenas** no projeto `prj_7mEBS5QDaBWrG4hjnBKelNkU90OY` e no domínio `teste.versaoprofessor.com`. Preferir deployment explicitamente direcionado; não fazer push até confirmar que integrações Git não dispararão outro projeto. Main e app.versaoprofessor.com permanecem intactos.
4. Autorizar execução real de **até cinco correções sintéticas**, com tema fornecido para evitar geração adicional: normal com imagem e PDF; Ao Vivo com texto, imagem e PDF. Definir também teto monetário total, incluindo chamadas auxiliares de pesquisa do provedor; cinco jobs não equivalem a preço fixo. Usar textos inventados, sem dados pessoais, contas de teste e créditos sintéticos. Sem retry/regeneração automática. Autorizar explicitamente as gravações de revisão/aprovação e geração/revogação de links **somente no backend novo**, verificando bloqueios, totais, versões, preservação da nota anterior, manifesto, polling e recuperação.
5. Após evidência desses testes, decidir separadamente qualquer publicação no backend compartilhado ou em produção. Essas autorizações ainda não existem para esta mudança; não serão inferidas de autorização de homologação.

Esta etapa não criou projeto, deployment, branch remota, PR, usuário ou registro. A única escrita foi local em código de correção da regressão, testes e documentação.


## Autorização de produção recebida — 06/10/2026

Marcus autorizou expressamente a implantação deste pacote em produção após a apresentação dos resultados. A restrição anterior de somente entrega local está superada exclusivamente para o código pertinente. A autorização não cobre alterar Auth/credenciais nem cobrar reprocessamentos sem teto confirmado. Reprocessamento posterior das duas submissões exatas aguardará identificação do auditor e aprovação do gasto.

Preparação final: main9e328e6 e originais das funções v28/v14 reconferidos byte a byte; acrescentada exigência de `review_policy_version` no corpo de revisão, para que a implantação backend→frontend bloqueie abas antigas até atualização. Nenhuma mudança de schema/RPC/credencial. A versão de contrato do banco permanece a mesma. Rollback completo mantido. Smoke remoto preferirá metadados/fontes e requisições sem autenticação ou sem operação de escrita; não haverá geração paga de teste.
