# Correção parcial: pacote preparado para revisão

Estado: implementação preparada e testada localmente. NÃO aplicada ao Supabase. Frontend condicionado a `live_status.partial_correction === true`; com backend atual permanece bloqueado.

## Escopo desta entrega

Ao Vivo professor e aluno escolar já admitido pelo backend: texto digitado/colado de 80 a 16.000 caracteres, tema original informado (10 a 1.000 caracteres), quatro etapas. Um crédito confirmado por tentativa; nenhuma chamada ao corretor completo para análise parcial. Resultado por critérios/evidências, sem nota. Professor pode editar critérios, evidências, orientações e desvios, ignorar desvios e confirmar uma única revisão. Aluno recebe análise sem revisão docente. Compartilhamento com revogação e validade existentes.

Não entrega ainda: foto/arquivo parcial com transcrição, correção parcial na fila de propostas, contexto de outras etapas, editor guiado/autosave/tutor, matrícula independente ou vínculos novos escola/turma. A fila normal permanece bloqueada para parcial. Nenhuma promessa de homologação com IA real.

## Alterações concretas para ativar

1. Confirmar novamente paridade dos 14 módulos ativos da `teacher-organization-api` com a baseline em `backend/enem/prepared/teacher-organization-api` (conferida v17 em 07/10). Montar pacote via `node scripts/prepare-partial-backend.cjs /tmp/versao-partial-package`; trocar somente `live.ts` e adicionar `partial.ts`. Manter `verify_jwt=true` e os demais módulos.
2. Aplicar `backend/writing/supabase/migrations/20261007195224_live_partial_scope.sql`: adicionar `correction_scope` em `live_essays` e `live_jobs`, ambos completos por padrão; `input_snapshot` em `live_jobs`; função privada/gatilhos para validar e congelar escopo e trecho. RLS e grants das tabelas existentes preservados. Nenhuma nota ou saldo histórico reprocessado. DDL tem locks breves nas duas tabelas; verificar concorrência antes de aplicar.
3. Publicar a função com feature flag ainda desligada/ausente. As correções completas mantêm o fluxo existente. RPCs `start_live_job`, `finish_live_job`, `review_live_job`, `share_live_job` e carteira não são substituídas.
4. Conferir frontend preparado no domínio oficial `https://teste.versaoprofessor.com/`, inclusive `devolutiva.html`. A produção frontend não é promovida.
5. Habilitar `system_feature_flags.feature_key=live_partial_correction`. Esta flag habilita somente a capacidade nova, não altera as flags teacher_live/student_live. Como o backend é compartilhado, a alteração ocorre no banco produtivo; requer autorização específica após este plano. Preservar backend apto a ler parciais após desligamento.
6. Homologar com conta autorizada, conteúdo sintético e confirmação explícita de 1 crédito por teste real. Não efetuar testes pagos automaticamente. Validar notas completas existentes e história parcial, revisão, link e revogação.

Sem variáveis, segredo, provedor, domínio, DNS, Auth, Storage ou configuração de pagamento novos. Não cadastrar usuários nem publicar redações automaticamente. O modelo de IA permanece o configurado no serviço, com telemetria existente. Para a parcial, sem pesquisa web: não promete checagem factual externa de repertório.

## Riscos e retorno

- Código em função compartilhada também atende produção; regressão da correção completa é o principal risco. Testes do handler completo executados também contra o preparado.
- Migration aditiva e gatilhos afetam novas escritas. As RPCs atuais continuam responsáveis por lock, reserva e estorno. Teste SQL local usa definições reais dessas RPCs e carteira sintética, não prova isolamento/concurrency em Supabase remoto.
- Falha de rede após envio ao provedor segue o comportamento do fluxo atual: tentativa falha e crédito devolvido; eventual custo do provedor continua registrado pela instrumentação existente. Não há promessa de execução exatamente uma vez no provedor.
- Retorno normal: desligar somente `live_partial_correction`, bloqueando novos envios; manter schema e novo leitor para terminar jobs e preservar leitura/revisão das parciais já criadas. Não remover colunas nem resultados. Antes da primeira parcial, pode restaurar integralmente os módulos v17 do commit-base.
- Se o frontend precisar de reversão, manter os leitores de devolutiva parcial para os links já emitidos.

## Verificação já feita

Contratos e evidências literais; handler real preparado com provedor simulado; falha devolvendo crédito; aprovação única e edição docente; aluno sem edição; DOM do início ao link/revogação; SQL em PGlite com snapshot imutável, proprietário, reserva de1, repetição sem novo débito e estorno único; regressões da correção completa. Nenhum dado pessoal usado como fixture. Falta IA real, dispositivo móvel e teste autenticado remoto.
