# Ativação da construção guiada completa — 08/10/2026

## Resultado preparado

Editor autoral com planejamento separado, quatro etapas, autosave com conflito de versões, histórico, comparação entre versões, orientações contextuais e comentários docentes. Atividades por turma validam professor responsável, matrícula ativa, organização e etapas liberadas. Redações independentes permanecem privadas. Correção parcial pode considerar, por escolha explícita, outros parágrafos como contexto sem avaliá-los. Completa continua padrão; cada correção custa 1 crédito, sem nota ENEM na parcial.

O tutor usa gpt-4.1-mini, saída estruturada, evidência literal, perguntas curtas, tarefa de revisão e segunda verificação de autoria antes de mostrar a resposta. Solicitações têm recibo idempotente, versão exata, limite diário e telemetria. A configuração de homologação é 12 orientações por aluno em janela de 24 horas, sem débito de crédito; pacote/preço comercial permanecem indefinidos. Os testes simulam o provedor: resistência do modelo e qualidade pedagógica ainda exigem homologação real.

Aluno independente usa identidade autenticada e e-mail confirmado; aceite legal e marcador privado não aprovam automaticamente a conta. A aprovação administrativa existente permanece obrigatória. Conta independente aprovada pode usar editor, Ao Vivo, histórico e carteira, sem turma fictícia. Login por PIN da turma continua preservado.

## Mudança concreta no backend compartilhado

1. Reconferir API ativa `teacher-organization-api` (baseline esperada 19), `credit-checkout-api` (baseline esperada 8), schema, flags e ausência de trabalhos em processamento. Se houver divergência, reconciliar antes de implantar. Guardar fontes ativas integrais para rollback. `baseline-v17.json` é somente referência histórica de código e não substitui backup da API19.
2. Aplicar somente `backend/writing/supabase/migrations/20261008022620_guided_writing_complete.sql`. As migrations anteriores de parcial/câmera já foram aplicadas; não reaplicá-las.
3. Gerar o pacote com `node scripts/prepare-partial-backend.cjs /tmp/versao-guided-complete`; publicar seus 18 módulos na `teacher-organization-api`, mantendo verificação JWT. Publicar separadamente `backend/writing/prepared/credit-checkout-api.ts` na função de mesmo nome, mantendo JWT.
4. Relê-las e conferir igualdade das fontes, grants/RLS, gatilhos e funções. Ativar `writing_guided` mantendo `tutor_limit:12`, `billing_mode:test_quota` e `package_price:null`; ativar `student_independent`. Não ampliar outras flags.
5. Publicar a árvore validada somente na branch `feat/ao-vivo-preview`, projeto Vercel de teste `prj_7mEBS5QDaBWrG4hjnBKelNkU90OY`, e conferir READY/alias `https://teste.versaoprofessor.com/`. Não promover main nem o projeto/domínio de produção.

Impacto SQL: novas tabelas `writing_activities`, `writing_revisions`, `writing_guidance`, `writing_comments`, `student_independent_accounts`; coluna `activity_id` em `live_writing_drafts`; `writing_context` em `live_essays`; `context_snapshot` em `live_jobs`. Há snapshot inicial dos rascunhos existentes. Novos gatilhos validam atividade/etapas, versões e contexto imutável; RPCs resolvem acesso, atividades, versões, comentários, reserva/finalização de orientação e cadastro independente. `private.ensure_student_trial` mantém o crédito inicial existente e acrescenta a elegibilidade de independente aprovado, sem duplicar lançamento.

Tabelas novas têm RLS e acesso direto revogado de anon/authenticated; RPCs de backend são restritas a service_role. Não muda senhas, CAPTCHA, PIN, provedores OAuth, variáveis, DNS, Storage, preços, saldos ou resultados de correções existentes. A elegibilidade futura do crédito inicial de independente muda conforme descrito acima.

Arquivos frontend: `writing-editor.e12.js`, `writing-classroom.e12.js`, `writing-independent.e12.js`, `teacher-live.e12.js`, `boot.e12.js`, `core.e12.js`, `student-signup.e12.js`, `index.html`, `cadastro-aluno.html` e `.vercelignore`. Reutilizam os componentes/CSS aprovados; não há novo CSS ou redesenho. Backend preparado: `index.ts`, `live.ts`, `partial.ts`, `writing-tutor.ts`, `writing-independent.ts`, `credit-checkout-api.ts` e script de preparação. Testes e documentação constam no mesmo commit.

## Validação e riscos

`npm test` completo passou antes do fechamento; SQL real da migration foi executado em PGlite com dados sintéticos. Cobertura: proprietário, professor responsável, matrícula/organização, etapas bloqueadas, rascunho independente privado, snapshots, conflitos, recibos repetidos, comentários, aprovação independente, evidência inválida, resposta pronta rejeitada e custo instrumentado. JSDOM verifica editor, histórico, seletor e acompanhamento. `npm run check` valida assets/sintaxe e ausência de proxy/secrets. Não equivale a login real, inspeção visual em celular, checkout real ou avaliação com IA real.

Risco principal: o Supabase é compartilhado com produção. As flags são globais e alterações de funções/gatilhos podem afetar clientes antigos; os novos caminhos são aditivos e condicionais, mas exigem autorização específica conforme AGENTS12–14. O frontend de produção permanece intacto. Homologar depois da ativação professor, aluno da turma e independente, isolamento entre contas/turmas, perda de matrícula, duas abas, retomada, orientação, correção com contexto, cobrança/estorno e celular. Utilizar sessão autenticada segura e autorização existente para chamadas pagas; não usar credenciais do chat para impersonação.

## Rollback

Desativar `writing_guided` e `student_independent`; retornar frontend de teste ao commit `bba3f07b7ec6273e29c0fa2f97b1527f74d101d1`; restaurar as fontes integrais de API19 e credit-checkout-api8 previamente conferidas. Preservar tabelas, versões, comentários, contexto e resultados criados. Não dropar colunas/tabelas nem reverter saldos. Novos usuários independentes ficam sem esse acesso com a flag desligada; revisão administrativa pode ser necessária. Se a baseline divergir, usar as versões efetivamente capturadas, nunca presumir esses números.

Nenhuma etapa de escrita remota deste plano foi executada nesta entrega. A autorização para construir não substitui a autorização específica para modificar o backend compartilhado.
