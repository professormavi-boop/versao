# Construção guiada e correção por etapas

Plano iniciado em 07/10/2026. Base: main@81a3aaec05a53bcae6fb01800aa7c80fc0957a16.
Branch de desenvolvimento: feat/construcao-guiada. Este documento registra escopo aprovado e entregas; não implica execução automática em datas futuras.

## Cronograma por entregas

| Ordem | Entrega | Critério de conclusão | Dependência |
| --- | --- | --- | --- |
| 1 | Núcleo pedagógico e contratos | Etapas, critérios, prompt tutor e testes locais | Base atual confirmada |
| 2 | Correção completa ou por etapas | Seleção nos fluxos professor/Ao Vivo/aluno; API e devolutiva parciais; completa como padrão | Backend isolado ou autorização específica para backend compartilhado |
| 3 | Editor guiado | Planejamento, escrita livre/guiada, quatro etapas, prévia completa, reescrita e salvamento com retomada | Persistência autenticada e permissões |
| 4 | IA tutora | Orientações contextuais, perguntas e tarefa de revisão; sem texto pronto; limite de uso visível | Contrato servidor, instrumentação e avaliações de comportamento |
| 5 | Escola e aluno independente | Atividade por escola/turma/aluno, liberação de etapas, acompanhamento docente e uso independente sem escola obrigatória | ACL/RLS e vínculos verificados no servidor |
| 6 | Homologação e oferta comercial | Jornadas completas, celular, isolamento de usuários, custos e pacote definidos | Entregas anteriores e validação dos custos |

São blocos sequenciais de trabalho, não uma previsão em dias. Datas de entrega devem ser estimadas após validar o backend e a persistência. A primeira entrega começa agora. A conclusão comercial depende de homologação, não apenas da publicação da interface.

## Regras aprovadas

- Correção completa selecionada por padrão; somente escolha explícita ativa correção parcial.
- Etapas: introdução, desenvolvimento 1, desenvolvimento 2 e conclusão.
- Correção completa mantém C1–C5; correção parcial não recebe nota ENEM nem soma de competências.
- Devolutiva parcial contém critérios da etapa, evidências do trecho, ponto forte, ponto a melhorar, desvios e próximo passo.
- Contexto ausente é declarado; não inferir tese que não foi enviada. Não penalizar partes fora do escopo.
- Tutor explica, pergunta e orienta; não gera parágrafo, tese, argumento, intervenção ou reescrita prontos, mesmo se solicitado.
- A máscara causa–consequência é um apoio opcional, não uma estrutura obrigatória. Segunda intervenção opcional.
- Escola/turma opcionais no Ao Vivo e para aluno independente. Atividade escolar deve validar vínculos no servidor, nunca somente nos campos enviados pelo navegador.
- Salvar, editar, visualizar e retomar não chamam IA nem debitam créditos. Pacote e preço são propostas ainda não definidos.
- Nenhum checklist individual obrigatório. Liberação de etapas pelo professor é uma configuração da atividade, distinta de aprovação da IA.
- A redação completa é analisada novamente; avaliações parciais nunca geram nota final por soma.
- Respeitar atividade somente manuscrita: planejamento pode ser guiado; entrega final segue a regra da proposta e não libera upload Word/cópia.

## Persistência proposta para revisão técnica

Uma redação mantém proprietário, contexto de acesso, tema, atividade opcional, versão e quatro etapas. Planejamento, parágrafo, versões e orientações ficam relacionados à etapa. Registro de orientação referencia a revisão exata do texto; editar depois torna a orientação anterior histórica. Requisições repetidas usam chave idempotente; salvamento detecta conflito entre abas/dispositivos e nunca sobrescreve silenciosamente.

Salvar deve distinguir “salvando”, “salvo” e “falha ao salvar”. Qualquer recuperação local precisa ser isolada por usuário e redação, com tratamento de logout/dispositivo compartilhado. Professores acessam somente trabalhos de atividades sob sua responsabilidade; escola não dá acesso a redações independentes. O servidor resolve a identidade e os vínculos.

Não foram criadas tabelas, migrations, RLS, RPCs, Edge Functions nem dados. O schema final depende da leitura do backend ativo. O Supabase de teste é compartilhado com produção: modificações exigem plano concreto e autorização específica ou ambiente isolado.

## Primeira entrega

Lista rastreável antes da alteração:
- [x] Confirmar repositório e commit publicados.
- [x] Ler AGENTS, continuidade e padrão visual.
- [x] Criar cronograma e critérios de aceite.
- [x] Criar núcleo puro de etapas, contratos e prompt tutor.
- [x] Testar padrão completo, rejeição de etapa inválida, contexto e contrato sem nota.
- [ ] Integrar núcleo às telas e ao backend (entrega 2).

Arquivos: writing-stages.e12.js, tests/writing-stages.cjs, docs/construcao-guiada.md e CONTINUIDADE.md. Não há inclusão no index nem mudança em módulos ativos nesta entrega. O prompt ainda não foi avaliado com IA real; instruções não garantem sozinhas que o modelo respeite autoria. A entrega 4 exige avaliações adversariais e política de resposta no servidor.

## Validação e publicação

Executar node tests/writing-stages.cjs, npm run check e git diff --check. Como nenhum módulo ativo foi alterado, não afirmar que UI, login, autosave, IA ou cobrança estão funcionando. Integração futura deve testar HTTP/assets/console e os três perfis, com dados sintéticos. Homologação oficial: https://teste.versaoprofessor.com/ no projeto isolado, branch feat/ao-vivo-preview. Produção somente após revisão e autorização da mudança concreta.

Rollback da primeira entrega: reverter o commit aditivo; não há migração ou dado a restaurar. Nenhum deploy, variável, domínio, autenticação ou integração foi modificado.

## Segunda entrega em desenvolvimento

Interface preparada na branch de desenvolvimento:
- Seleção padrão completa e quatro etapas no Ao Vivo compartilhado entre professor e aluno.
- Entrada opcional “Escolher etapa da redação” na fila docente, mantendo o botão de correção completa.
- Critérios e aviso formativo por etapa, sem apagar o texto ao alternar.
- Renderer parcial estrito: critérios, evidência, ponto forte, melhoria, desvios, próximo passo e limites de contexto; não mostra C1–C5 nem total, mesmo que o payload contenha esses campos.
- Bloqueio explícito antes de qualquer upload ou envio parcial para os endpoints atuais. Backend parcial, revisão/publicação e histórico parcial ainda não foram implementados. A devolutiva parcial foi validada apenas com fixtures sintéticas.
- Mesmos componentes visuais, CSS e identidade aprovados. Nenhum CSS ou menu foi redesenhado. Pedido de Marcus em 07/10: manter layout padrão aprovado.

Ainda não concluído: contrato persistente de etapa no servidor, correção parcial real, revisão docente parcial, compartilhamento, entrega do aluno escolar, editor guiado e tutoria real. Não habilitar a opção em produção enquanto esses fluxos não estiverem prontos. Próxima implementação precisa de backend isolado ou autorização específica após apresentação de arquivos/funções/tabelas e rollback; o backend compartilhado não foi alterado.

## Ajuste aprovado em 07/10 às 16h32

Marcus definiu seletor suspenso com Redação completa como padrão e 1 crédito para cada correção, inclusive parcial. O seletor reutiliza custom-selects.e12.js e seus estilos; não abre picker nativo. Orientações do tutor permanecem fora dessa regra de preço: pacote de construção guiada ainda não definido. Mudança de seleção não consome crédito.

Contrato de backend preparado em backend/writing/partial-correction.cjs, sem publicação: schema por etapa, mensagens de análise, validação de evidências literais e custo fixo definido no servidor. Rejeita notas e critérios incompletos/duplicados. Não é endpoint: falta integrar autenticação, autorização, persistência, reserva/estorno atômicos, idempotência, execução de IA, revisão e compartilhamento. Testes sintéticos não comprovam comportamento de modelo real.
