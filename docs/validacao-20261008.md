# Validação VERSÃO — 08/10/2026

Parecer: não promover ainda a versão completa para produção. Interface publicada e regressões aprovadas; três ajustes de backend preparados, mas não aplicados. Cadastro independente permanece desativado. Publicação em produção não autorizada nesta tarefa.

## Versões verificadas

- Site oficial: https://teste.versaoprofessor.com/.
- Preview ativo: dcd05eefd50295348062e833901f6058e0b30aee; árvore8db3ddc2a2e61299a3a75b627876cabf73aed403; deploymentdpl_91mDh6a29x6EBSsdsybDBUKdCTyG READY, projeto isoladoprj_7mEBS5QDaBWrG4hjnBKelNkU90OY.
- Backend real: teacher-organization-api21 ACTIVE, verify_jwttrue,18fontes relidas.
- Produção frontend preservada. Nenhuma escrita remota, implantação de função, mudança de configuração, chamada paga à IA ou cobrança foi executada nesta validação.

## Evidência e limites

| Área | Resultado | Evidência |
|---|---|---|
| Regressões gerais | Aprovadas em simulação | npm test completo: acessos/CAPTCHA/Google, professor/aluno, propostas/manuscritas, correções/revisão/compartilhamento, créditos, importação, etapas, tutor e SQL local |
| Escrita guiada | Aprovada em simulação | Tema→escrita→planejamento→Tutor; texto/planejamento preservados; seletor próprio; foco nos pedidos; histórico e versões; envio duplicado/falhas e autoria |
| Evolução | Aprovada em simulação | tests/student-evolution.cjs: tema/eixo, notas, eixo ausente e falha de propostas |
| Assets | Aprovados | check51assets e HTTPsmoke51; assets oficiais index/editor/css/home/evolução/cadastro HTTP200 |
| Browser real | Parcial | Chrome abriu tela Entrar e scripts; sem erro de aplicação na amostra de console, erro de extensão separado; nenhum login autenticado efetuado |
| Retomada/banco | Permissão confirmada | service_role possui USAGE no schema private; SQLlocal de isolamento/matrícula/versionamento aprovado |
| Custos tutor | Confirmados no banco |31chamadas/18pedidos, todas com custo known; USD0.054248 e BRL0.27154527632 pela cotação salva; valores em reais estimados, conciliar fatura |
| Tutor real | Pendência |10pedidos completed e8failed históricos; últimos4completed, mas falha de repertório por evidência foi registrada e ajuste candidato não está ativo |
| Cadastro e-mail | Desativado | student_independentfalse; cadastro-aluno.html data-registration-enabledfalse; bloqueio antes Auth evita contas órfãs |

Os testes de modelo usam respostas simuladas. Não comprovam qualidade pedagógica, latência ou resposta real do provedor. Login, sessão autenticada, nova orientação real e envio real ao professor ainda precisam de homologação após ativação. Não equiparar HTTP200 a login validado.

## Bloqueios preparados

1. Correção por partes restrita ao professor: menu do aluno escondia o recurso, mas código ativo21 aceitava live_start parcial. Reprodução com fonte exata21/deps simuladas retornou200 quando teste exigia403. Candidato bloqueia live_create/live_upload/live_start/live_transcribe do aluno antes de gravação/IA; mantém professor e leitura/compartilhamento de legado. Tests partial-live-api passaram com guarda e fluxo docente.
2. Tema institucional→professor: frontend ativo encaminha correção própria. Candidato preserva proposal_id no rascunho, usa ID para títulos iguais, respeita Tema livre explícito, faz envio paste pela API existente, valida disponibilidade e manuscrito, preserva texto em erro e impede envio repetido. Backend de envio mantém assertTarget/matrícula. Tests writing-institution passaram integrado à interface atual.
3. Repertório do tutor: schema exige evidence vazio para busca ou texto vazio, evitando atribuir fonte/tema ao texto do estudante. Mantém validação de evidência literal nas análises, fontes HTTPS confirmadas e auditoria de autoria. Tests writing-tutor com provedor simulado passaram. Falha anterior não autoriza alegar qual conteúdo exato foi retornado pelo modelo.

## Candidato concreto e publicação

Worktree /workspace/scratch/c41070c55b81/versao-validacao, branchfeat/validacao-integrada: interface atual + vínculo institucional + guarda servidor. Tests writing-institution, writing-complete-ui, proposal-guided-writing, partial-live-api, writing-tutor, check e HTTPsmoke passaram após integração; diffcheck limpo.

EdgeFunction candidata:18fontes reais21, substituir somente live.ts e writing-tutor.ts. Sem mudança de tabelas/migrations/RLS/Auth/Storage/configurações/modelo/limites de tokens/créditos/domínios/variáveis. Alteração de função é compartilhada com produção e exige autorização específica depois deste plano. Frontend candidato será publicado somente no Preview oficial após ativação, sem promover main/produção.

Rollback: restaurar18fontes reais21 com JWTtrue e retornar Preview ao dcd05eefd50295348062e833901f6058e0b30aee. Preservar dados/rascunhos; não apagar envios. Revalidar versão atual imediatamente antes do deploy para evitar sobrepor alterações concorrentes.

Cadastro independente constitui autorização separada para flag e formulário. Não ativar implicitamente junto às três correções. Depois dos ajustes, homologar sessão aluno/professor, repertório real e envio institucional antes de apresentar plano final de produção.


## Atualização após autorização — 08/10 16h06BRT
Marcus autorizou especificamente as três correções compartilhadas e o frontend de testes. teacher-organization-api22 ACTIVE/JWTtrue publicada;18arquivos relidos iguais ao candidato, somentelive.ts/writing-tutor.ts modificados sobre21. Ponto de restauração embackend/writing/rollback/teacher-organization-api-v21.json. Sem alteraçãocadastroflag/tabelas/RLS/Auth/dados/env/créditos. Frontendintegrado empublicação. A conclusão anterior descreve o estado da auditoria antes da autorização; trêscorreções agoraativas, mas homologaçãoautenticada/IAreal/envio ainda pendentes antesfrontendprodução.

Frontend integrado conferido no domínio oficial: f0fdda737fc9769f6abdae6a1c34e4be97538daf, deploymentdpl_26NNsnYTwsWsejgpDgrYaZPPNa89 READY/Preview, alias https://teste.versaoprofessor.com/. Assets HTTP200 e marcadores novos relidos. Correções ativas; testes simulados pertinentes aprovados; sessão/IA/envio reais ainda não executados pelo agente. Cadastro permanece bloqueado e frontend produção preservado.
