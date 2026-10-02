# Instruções do projeto VERSÃO

1. Leia CONTINUIDADE.md antes de agir. Use o código e o commit atuais como fonte, não alegações de chats anteriores.
2. Registre uma lista de tarefas rastreável antes de cada alteração. Ao concluir, registre testes, limitações, commit e link de teste.
3. Preserve a produção prj_K9FmNSIgIOPHLm3vez7XlKHKNQtV. Trabalhe somente no projeto isolado prj_7mEBS5QDaBWrG4hjnBKelNkU90OY.
4. Supabase huccxcpwoydwuisrmboc é compartilhado com produção: não alterar backend nem habilitar gravações administrativas.
5. IA paga somente conforme autorização e ação explícita do usuário; nunca aprovação/publicação automática.
6. Preserve logo, CSS e navegação aprovados. Use arquivos estáticos completos. Sem proxies entre deployments, loaders comprimidos, document.write, MutationObserver corretivo ou duplicação de handlers.
7. Teste por servidor HTTP; cheque sintaxe, assets, console e fluxos relevantes. Não declare login validado por HTTP 200 ou por inspeção estática.
8. Não conclua a Etapa 12 nem avance à 13 sem aprovação do usuário. Não promova produção.
9. Economize contexto: leia resumo e módulo pertinente, evite dumps de assets, buscas repetidas e reprocessamento integral do histórico. Não use subagentes sem solicitação.
10. Preserve o trabalho via commits; atualize CONTINUIDADE.md antes de mudar de chat ou ferramenta. O filesystem local não é garantia de transferência entre sessões.
11. Nunca usar controles nativos que abram modais/pickers do navegador ou do sistema operacional na interface principal: `alert`, `confirm`, `prompt` e o picker nativo de `<select>` simples. Mensagens devem usar componentes do VERSÃO; confirmações devem usar `appConfirm` ou controles inline; escolhas devem usar o seletor próprio do VERSÃO; entrada de dados deve ocorrer em campos/formulários da própria interface.
12. REGRA OBRIGATÓRIA DE SEGURANÇA DE PRODUÇÃO: nunca alterar, promover, publicar, fazer merge no `main`, executar deploy de produção ou realizar qualquer gravação/migração no ambiente produtivo sem autorização explícita do usuário dada após a apresentação do plano da mudança. Autorizações antigas, genéricas ou de outra alteração não valem para uma nova publicação. Sempre solicitar nova autorização imediatamente antes de qualquer ação que possa modificar produção.
13. ANÁLISE PRÉVIA OBRIGATÓRIA: antes de alterar qualquer parte do projeto, informar ao usuário, de forma objetiva, (a) o que será alterado, (b) os riscos previstos e possíveis efeitos colaterais, (c) todos os arquivos que serão modificados, criados ou removidos, e (d) o impacto em database/Supabase, incluindo quando aplicável tabelas, dados, migrations, RLS, Auth, Storage, Edge Functions, RPCs, triggers e configurações. Se não houver impacto na database, declarar explicitamente `Database: nenhum impacto`.
14. Para mudanças que possam chegar à produção, informar também o impacto previsto em Vercel/deploy, variáveis de ambiente, domínios, autenticação e integrações externas, além do plano de teste e de rollback. Preparar e validar em branch/preview sempre que possível. Somente após a validação apresentar o resultado ao usuário e pedir autorização explícita para publicar em produção.

15. PADRÃO VISUAL APROVADO: consultar docs/padrao-interface.md antes de criar/alterar telas. Propostas (proposal-approved-v3.css) é a referência de menu e exibição aprovada pelo usuário em01/10/2026. Reutilizar padrões existentes; não inventar novo estilo por módulo.

## Endereços oficiais e CAPTCHA — registro de 02/10/2026

Informações fornecidas explicitamente por Marcus nesta conversa; estes endereços prevalecem sobre links históricos de navegação nos relatos anteriores.

| Finalidade | Endereço |
|---|---|
| Landing page pública | https://versaoprofessor.com |
| Aplicativo de produção | https://app.versaoprofessor.com |
| Cadastro do professor / destino correto dos anúncios | https://app.versaoprofessor.com/cadastro-professor.html |
| Domínio oficial de teste | https://teste.versaoprofessor.com |

- CAPTCHA: Marcus informou que `teste.versaoprofessor.com` já está autorizado. Não tratar esse domínio como pendente de autorização nem trocar/remover chaves ou regras do CAPTCHA por iniciativa própria. Este registro não é uma validação funcional de cadastro ou login.
- Os anúncios e CTAs de aquisição devem apontar para o cadastro de produção COM `app.`; preservar os parâmetros UTM de cada anúncio. Nunca usar `teste.versaoprofessor.com` ou um preview `vercel.app` como destino de campanha paga.
- Usar o domínio oficial de teste para homologação. Antes de afirmar que uma candidata está nesse domínio, verificar qual deployment/commit ele entrega. Registrar um endereço não muda o alias nem publica a candidata.
- Domínio de teste e CAPTCHA autorizado não significam banco isolado: o Supabase compartilhado continua sujeito às restrições acima. Nenhuma gravação de teste ou emissão de conversão real é autorizada por este registro.
- Não fazer merge no `main`, promoção ou troca de alias de produção para registrar estas informações.

### Continuidade desta solicitação

- [x] Registrar os quatro endereços e a autorização de CAPTCHA informada pelo usuário.
- [x] Consultar os dois anúncios da campanha `Versão | Professores de Redação | Conversões 01` antes de tentar a alteração.
- [x] Repetir a tentativa autorizada de trocar somente o destino para o cadastro com `app.`, preservando texto, imagem e UTMs.
- [ ] Concluir a troca de destino no Ads Manager: ainda bloqueada por HTTP 403, com exigência de aprovação da verificação da conta para usar outra URL. O bloqueio ocorreu no primeiro anúncio; não foi contornado nem repetido no segundo.
- [x] Consultar novamente os dois anúncios após o bloqueio: ambos permanecem no cadastro sem `app.`. Não afirmar que o link foi corrigido.

Escopo desta gravação: somente `AGENTS.md`, na branch `fix/ads-cadastro-atribuicao-20261002`. Database: nenhum impacto. Nenhuma alteração de runtime, login, CAPTCHA, variáveis de ambiente, DNS, alias ou configuração de produção. Validação prevista: releitura do arquivo/commit e conferência de que o diff contém apenas documentação. Rollback: reverter somente este registro na branch de teste, sem tocar produção.
