# Checklist de execução — Ao Vivo e aluno independente

Atualizado em 01/10/2026. Ordem definida por Marcus: Ao Vivo primeiro, aluno avulso depois, venda de créditos para alunos da base em seguida.

Marcação significa conclusão somente do item descrito. Prévia, código preparado e publicação são etapas distintas. Nenhuma das novas funcionalidades abaixo está ativa em produção.

## 1. Ao Vivo do professor — prioridade atual

- [x] Aprovar fluxo em três etapas: redação, tema e correção.
- [x] Criar prévia com câmera, arquivo e texto colado.
- [x] Incluir nome do aluno e escola opcionais na prévia, sem cadastro obrigatório.
- [x] Corrigir CSS da prévia para quebra de nomes longos de arquivo.
- [x] Implementar e testar normalização de caixa/espaços e sugestões de escola com escolha explícita; catálogo demonstrativo.
- [x] Documentar C2 por tema informado ou recorte inferido confirmado, sem alegar conhecer a proposta original.
- [x] Inspecionar esquema existente e preparar rascunho SQL separado para redações, arquivos e análises avulsas.
- [x] Preparar schema, RLS, escola opcional e compartilhamento; testes SQL isolados aprovados, sem ativação.
- [x] Preparar handlers de upload e validação de foto, PDF, DOCX e texto; assinaturas/tamanho testados, homologação real pendente.
- [x] Implementar conexão com identificação de tema e protocolo existente; chamadas ao provedor testadas com simulação, sem IA paga.
- [x] Implementar e testar isoladamente reserva de 1 crédito, idempotência, consumo e estorno em falhas.
- [x] Implementar consulta retomável e reconciliação ao abrir redação; provedor processa em background, sem worker novo.
- [x] Integrar em código nova rota e destaque com câmera na inicial, inclusive para professor sem turma.
- [x] Renomear entrada vinculada para Receber redações; regressões existentes aprovadas.
- [x] Conectar sugestões de escola ao catálogo autorizado e aos nomes recentes do professor na interface.
- [x] Implementar resultado, revisão e histórico com paginação e seleção de versões; persistência testada isoladamente.
- [x] Implementar compartilhamento no resultado/histórico: WhatsApp, copiar link e opções do celular; sem envio automático.
- [x] Implementar página compartilhada, snapshot revisado, expiração e revogação; testes SQL de acesso aprovados.
- [ ] Validar mobile real, arquivos longos, acessibilidade e fluxo completo.

## 2. Ao Vivo do aluno — avulso e da base

- [x] Definir disponibilidade para ambos os acessos: aluno avulso e aluno da base via PIN.
- [x] Definir entrega de IA sem revisão docente, histórico particular e compartilhamento pelo aluno.
- [x] Preparar interface do Ao Vivo aluno, com entrada na inicial/menu e notas somente leitura.
- [x] Implementar propriedade por usuário no backend e testar bloqueio de acesso cruzado.
- [x] Reutilizar no código o motor de câmera/arquivos/texto/tema/C2 para ambos os perfis; serviços reais ainda não ativados.
- [x] Exigir confirmação de 1 crédito no Ao Vivo aluno; teste de interface aprovado.
- [x] Preparar persistência por owner_id, independente de turma; SQL isolado aprovado.
- [x] Preparar compartilhamento do resultado IA pelo aluno, sem revisão docente e sem novo débito.
- [ ] Testar com aluno avulso e aluno por PIN, sem alterar propostas, notas ou relatórios escolares.

## 3. Cadastro do aluno avulso — sem professor

- [x] Definir acesso independente: Google ou e-mail/senha; sem professor, turma ou escola obrigatórios.
- [x] Preparar página/script de cadastro e callback Google específico para aluno.
- [x] Preparar função de cadastro com proteção contra conversão de perfil existente.
- [x] Preparar e testar isoladamente crédito único, preservação de vínculos e bloqueio de chamadas não autorizadas.
- [x] Retirar exigência de confirmação de e-mail do SQL/UI do aluno; testes atualizados, sem ativação.
- [x] Conferir Auth em leitura: mailer_autoconfirm=true e signup/Google/email habilitados; não alterar configuração global. Teste real de cadastro segue pendente.
- [x] Preparar painel de conta independente identificado pelo aceite servidor, sem consulta obrigatória à matrícula.
- [x] Preparar e testar degustação única por conta, inclusive sem email confirmado; ledger existente reaproveitado.
- [x] Preparar correção avulsa com confirmação explícita do consumo pelo aluno.
- [x] Implementar resultado do aluno com identificação IA e sem controles de edição de nota.
- [x] Preparar histórico e compartilhamento particulares; testes SQL/DOM aprovados.
- [ ] Testar cadastro → degustação → correção → histórico → compartilhamento.

## 4. Créditos para alunos avulsos e alunos da base

- [x] Inspecionar carteira e checkout existentes: carteira por perfil já existe; checkout atual aceita somente professores.
- [x] Definir preservação do acesso escolar por código de turma e PIN.
- [ ] Definir preço em reais e pacotes de aluno. A regra de consumo já está definida: 1 crédito por correção; preço de venda ainda não aprovado.
- [x] Preparar checkout e constraints para student_1; valor em configuração servidor, venda desativada e sem preço padrão.
- [ ] Validar webhook de pagamento, valor, comprador, idempotência e liberação de saldo.
- [x] Preparar tela Meus créditos e catálogo por papel para aluno avulso/PIN; preço/pagamento real pendentes.
- [x] Testar SQL de degustação sem e-mail confirmado, preservando nome/vínculo institucional.
- [ ] Garantir que redação enviada à turma siga o fluxo escolar existente e não debite a carteira particular do aluno.
- [ ] Manter histórico particular separado dos relatórios escolares; compartilhar somente por ação do aluno.
- [ ] Não unir automaticamente contas por nome ou e-mail; vinculação futura exige fluxo específico.
- [ ] Testar compra, pagamento pendente/recusado, webhook repetido, saldo insuficiente e falha com estorno.

## 5. Validação e publicação

- [ ] Executar regressões de professor, aluno com PIN, propostas e correção escolar.
- [ ] Validar isolamento entre dois professores e dois alunos e links compartilhados inválidos/revogados.
- [ ] Revisar textos de termos/privacidade conforme cadastro independente, pagamento e compartilhamento.
- [ ] Preservar frontend no Git e backend privado, com fontes anteriores para rollback.
- [ ] Homologar em ambiente isolado e apresentar link de teste válido.
- [x] Verificar deploy do commit b101820: teste READY (dpl_6EKmMS3rFrarzWKURjMb9N29TX7q); projeto de produção ainda falhou por build-rate-limit. Página devolutiva.html retornou HTTP 200; acesso aos demais assets pelo conector oscilou com proteção Vercel. Isso não valida login nem backend.
- [ ] Apresentar resultado, plano de ativação e rollback e obter autorização produtiva específica, conforme AGENTS.md.
- [ ] Aplicar migrações/funções aprovadas, publicar e conferir domínio e jornada completa.

## Critério de conclusão

Não marcar implantação concluída com base apenas em HTML, testes simulados ou HTTP 200. Exige persistência real, controle de créditos, acesso correto por perfil, compartilhamento e validação da versão publicada. Backend e interface do professor preparados e testados com serviços simulados/SQL isolado. Homologação real e ativação ainda pendentes; aluno e venda de créditos não concluídos.

Próxima fronteira de autorização: a execução real requer aplicar o schema e publicar o roteador/funções no Supabase compartilhado. Etapa1 privada salva em versao-ao-vivo-backend-etapa1.zip. Router desta etapa NÃO inclui cadastro aluno, que ainda está em rascunho. Sem ativação até autorização específica conforme AGENTS.md.

## Checkpoint aluno e créditos — preparação conjunta
Frontend e backend compartilhados foram generalizados ANTES de qualquer migração: live_essays/live_files/live_jobs/live_shares usam owner_id. O pacote privado novo SUBSTITUI o da etapa1; não aplicar os dois. Ordem SQL: student-signup.sql → migration.sql → student-sales.sql. Flags teacher_live, student_live e student_credit_sales ficam desativadas.

Validação: npm run check/npm test PASS (44 assets HTTP); SQL de posse/créditos/share e handler simulado PASS; checkout simulado preserva pacotes professor, rejeita pacote de outro perfil, usa valor servidor e bloqueia venda sem preço. Nenhum pagamento real, processamento pago ou ativação de backend. Falta preço em reais e homologação conjunta antes da publicação.
