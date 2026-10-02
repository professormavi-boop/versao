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

16. AMBIENTE OFICIAL DE TESTES: https://teste.versaoprofessor.com/ no projeto prj_7mEBS5QDaBWrG4hjnBKelNkU90OY, ambiente Preview, branch feat/ao-vivo-preview. Publicar testes nessa branch e conferir o domínio fixo após READY. URLs temporárias *.vercel.app não servem para homologação de login: o CAPTCHA depende do domínio autorizado. Não entregar URL temporária como ambiente de teste ao usuário. Produção: https://app.versaoprofessor.com/, projeto separado.
