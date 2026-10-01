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
- [ ] Concluir e testar schema, RLS e permissões; incluir escola opcional e compartilhamento no modelo final.
- [ ] Implementar handlers de upload e validação de foto, PDF, DOCX e texto.
- [ ] Conectar identificação real do tema e correção ao protocolo existente.
- [ ] Implementar reserva de 1 crédito, idempotência, consumo e estorno em falhas.
- [ ] Implementar processamento retomável e recuperação após sair da tela.
- [ ] Integrar nova rota e destaque com câmera na inicial, inclusive para professor sem turma.
- [ ] Renomear a entrada vinculada a turmas para Receber redações, mantendo seu funcionamento.
- [ ] Conectar sugestões de escola ao catálogo e histórico exclusivos do professor.
- [ ] Implementar resultado, revisão pelo professor e histórico persistente.
- [ ] Implementar compartilhamento no resultado e no histórico: WhatsApp, copiar link e opções do celular.
- [ ] Implementar página da devolutiva compartilhada, expiração, revogação e proteção contra acesso ao histórico/arquivos privados.
- [ ] Validar mobile real, arquivos longos, acessibilidade e fluxo completo.

## 2. Ao Vivo do aluno — avulso e da base

- [x] Definir disponibilidade para ambos os acessos: aluno avulso e aluno da base via PIN.
- [x] Definir entrega de IA sem revisão docente, histórico particular e compartilhamento pelo aluno.
- [ ] Adaptar a interface do Ao Vivo para aluno, com entrada na inicial e no menu.
- [ ] Autorizar no backend somente as redações particulares pertencentes ao aluno autenticado.
- [ ] Conectar câmera, arquivos, texto, tema e recorte C2 ao mesmo motor de correção.
- [ ] Exibir consumo de 1 crédito e obter confirmação antes de iniciar cada análise.
- [ ] Persistir resultado e histórico independente de turma ou professor.
- [ ] Permitir compartilhar a qualquer momento pelo histórico, sem nova cobrança de correção.
- [ ] Testar com aluno avulso e aluno por PIN, sem alterar propostas, notas ou relatórios escolares.

## 3. Cadastro do aluno avulso — sem professor

- [x] Definir acesso independente: Google ou e-mail/senha; sem professor, turma ou escola obrigatórios.
- [x] Preparar página/script de cadastro e callback Google específico para aluno.
- [x] Preparar função de cadastro com proteção contra conversão de perfil existente.
- [x] Preparar e testar isoladamente crédito único, preservação de vínculos e bloqueio de chamadas não autorizadas.
- [ ] Atualizar implementação e testes para a decisão posterior: sem confirmação de e-mail e sem aprovação manual. O rascunho atual ainda exige confirmação; não ativar nesse estado.
- [ ] Verificar configuração real do Auth e validar acesso direto sem enfraquecer permissões dos demais perfis.
- [ ] Preparar painel independente que não dependa de matrícula/turma.
- [ ] Integrar 1 crédito de degustação por conta, sem reposição ao consumir, repetir login ou completar cadastro novamente.
- [ ] Reaproveitar correção avulsa e informar 1 crédito antes da confirmação.
- [ ] Entregar resultado de IA sem revisão docente, com identificação explícita dessa condição.
- [ ] Salvar histórico particular e permitir compartilhamento pelo próprio aluno.
- [ ] Testar cadastro → degustação → correção → histórico → compartilhamento.

## 4. Créditos para alunos avulsos e alunos da base

- [x] Inspecionar carteira e checkout existentes: carteira por perfil já existe; checkout atual aceita somente professores.
- [x] Definir preservação do acesso escolar por código de turma e PIN.
- [ ] Definir preço em reais e pacotes de aluno. A regra de consumo já está definida: 1 crédito por correção; preço de venda ainda não aprovado.
- [ ] Ampliar checkout, catálogo de pacotes e restrições do banco para aluno.
- [ ] Validar webhook de pagamento, valor, comprador, idempotência e liberação de saldo.
- [ ] Disponibilizar carteira/compra e correção particular também ao aluno que entra por PIN.
- [ ] Validar degustação para aluno da base sem exigir e-mail pessoal confirmado.
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
- [ ] Verificar novamente disponibilidade de deploy: a última tentativa registrada estava bloqueada por limite da Vercel; estado atual não verificado neste checklist.
- [ ] Apresentar resultado, plano de ativação e rollback e obter autorização produtiva específica, conforme AGENTS.md.
- [ ] Aplicar migrações/funções aprovadas, publicar e conferir domínio e jornada completa.

## Critério de conclusão

Não marcar implantação concluída com base apenas em HTML, testes simulados ou HTTP 200. Exige persistência real, controle de créditos, acesso correto por perfil, compartilhamento e validação da versão publicada. O passo em andamento é concluir o backend e a integração do Ao Vivo do professor.
