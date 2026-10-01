# VERSÃO — continuidade da Etapa 12

## Instrumentação do funil ChatGPT Ads — 30/09/2026

Branch: `feat/funil-chatgpt-ads`. Issue rastreável: #7 — Instrumentar funil da landing para campanha ChatGPT Ads.

Objetivo: medir o caminho anúncio → landing → CTA → início do cadastro → cadastro confirmado, preservando UTMs da campanha `chatgpt / paid / professores_redacao` e sem alterar o Supabase compartilhado.

Implementado:
- `funnel-analytics.js`: atribuição UTM em `localStorage` por até 30 dias; eventos `landing_view`, `click_signup`, `signup_started` e `signup_complete`; integração com Vercel Web Analytics; envio adicional sanitizado para `/api/funnel-event`.
- `api/funnel-event.js`: endpoint serverless POST com allowlist de eventos/campos e log `[VERSAO_FUNNEL]`; payload não lê nem registra nome, e-mail, senha ou token.
- `landing.html`: carrega o módulo sem alterar o conteúdo aprovado; CTAs de cadastro recebem UTMs preservadas e geram `click_signup`.
- `index.html`: carrega o módulo antes do fluxo `?cadastro=1`, para não perder a atribuição ao redirecionar para o cadastro.
- `cadastro-professor.html`: registra `signup_started` no primeiro uso do formulário e inclui as UTMs no `redirect_to` da confirmação por e-mail.
- `confirmacao-professor.html`: registra `signup_complete` apenas após token válido, sessão criada e e-mail confirmado.
- `tests/funnel-analytics.cjs`: invariantes dos quatro eventos, UTM, endpoint e ausência de leitura de e-mail/senha no payload.

Segurança/limites:
- Nenhuma alteração de schema, Edge Function, permissões ou dados administrativos do Supabase `huccxcpwoydwuisrmboc`.
- Nenhuma alteração ou promoção para produção.
- O endpoint sanitizado foi criado para permitir acompanhamento posterior via logs da Vercel mesmo quando a API de Web Analytics não estiver exposta pelo conector do chat.

Validação:
- Diff contra `main`: branch 8 commits à frente, zero atrás; `landing.html` e `index.html` receberam somente a inclusão do script de analytics; cadastro e confirmação tiveram mudanças mínimas.
- Deployment de teste `dpl_H2KFv8ag9CgQr13E6aVPo1jjKiw2`, projeto autorizado `prj_7mEBS5QDaBWrG4hjnBKelNkU90OY`, estado READY, commit `1bb4318e1735f5fbe4ef04262cfceebd2683d77e`.
- Landing com UTMs respondeu HTTP 200 no deployment final e contém o carregamento de `funnel-analytics.js`.
- Limitação de homologação: o preview está protegido pela Vercel Authentication; leituras automatizadas diretas de assets/endpoint retornam o gate 302. Portanto, a ingestão real dos eventos no navegador e o POST do endpoint ainda precisam de homologação em ambiente acessível. Não declarar o funil end-to-end homologado até isso ocorrer.

Próximo passo: após autorização explícita, promover o pacote para o domínio comercial e fazer um teste sintético com UTM para confirmar os quatro eventos antes de ativar a campanha ChatGPT Ads.

## Retomada da auditoria — 27/09/2026

O usuário autorizou a aplicação do pacote de auditoria e solicitou continuidade. A produção atual foi identificada pelo domínio suaversao.vercel.app: projeto prj_5OC7zfjEgapvbrapPjas2lLvvut7, deployment dpl_4BLgbQx2vfJrKxz7TVZzRoceiPQQ, commit 4701bdf. Os IDs de produção congelada abaixo são históricos.

As sete funções do pacote já estavam implantadas ao retomar; seus conteúdos coincidem com o pacote, desconsiderando espaços finais. RPC save_proposal_atomic e expire_proposal_reservations confirmadas, execução restrita ao backend. Frontend recuperado do bundle ffa7fb2a0c75570da5e6f1da4f9775ef1a624448, incorporando 4701bdf. Check, regressões e 27 assets por HTTP aprovados novamente.

Próximo passo autorizado: publicar o frontend compatível e verificar deployment e conteúdo servido. Login autenticado indisponível nesta sessão; não declarar jornadas reais homologadas. Nenhuma IA paga ou publicação de notas deve ser executada automaticamente. Pagamentos, OCR, mobile físico e restauração de backup continuam pendentes para prontidão comercial.

Atualizado em 11/09/2026. Comece por este arquivo e por AGENTS.md.

## Onde está o código

- Repositório: https://github.com/professormavi-boop/versao
- Branch de entrega: main. Aplicação na RAIZ, não em src/ nem em uma subpasta versao/.
- Origem: arquivos físicos de versao-etapa12-direct, recuperados do ZIP enviado pelo usuário nesta conversa.
- Este pacote é uma CANDIDATA de recuperação. Não é uma versão aprovada, nem prova do estado atualmente publicado.
- Os antigos wrappers comprimidos, proxies, payloads e variantes de index não fazem parte desta candidata.
- O repositório contém o frontend. Não contém o código das Edge Functions nem um backup do banco Supabase.

## Ambientes e limites

Produção CONGELADA: https://suaversao.vercel.app
Projeto Vercel proibido para alterações: versao — prj_K9FmNSIgIOPHLm3vez7XlKHKNQtV.

Único projeto Vercel autorizado para os testes desta etapa:
versao-teste-etapa12-consolidada — prj_7mEBS5QDaBWrG4hjnBKelNkU90OY.
Team: team_nzIZpEIAsMCbyitb9oNHdkAz.
Endereço de teste: https://versao-teste-etapa12-consolidada.vercel.app

Supabase compartilhado com produção: huccxcpwoydwuisrmboc (sa-east-1).
NÃO alterar schema, funções, permissões ou dados administrativos.
MUTATIONS_ENABLED=false; PAID_AI_ENABLED=true.
A IA real foi autorizada pelo usuário, somente por clique explícito em Corrigir com IA.
Aprovação/publicação de notas, propostas, gestão, uploads e alteração de senha continuam sem gravação real.
Não executar chamadas pagas só para testar a implantação.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| index.html | Shell estático; referências diretas aos 3 CSS e 7 JS |
| base.e12.css | Identidade e logo oficial incorporada como data URI |
| responsive.e12.css | Layout responsivo |
| enhancements.e12.css | Controles de propostas, gestão e relatório IA |
| core.e12.js | Sessão, perfil, navegação, requests e cache |
| boot.e12.js | Inicialização, login e logout |
| teacher-main.e12.js | Início, propostas e Ao Vivo |
| teacher-correction-shell.e12.js | Fila e botões de correção |
| correction.e12.js | Visualização, rascunho manual, IA e Colar da IA |
| ranking-management.e12.js | Ranking e controles locais de gestão |
| student.e12.js | Área do aluno |
| vercel.json | Configuração estática sem proxy/rewrite para outra build |
| scripts/check.cjs | Verificação de referências, sintaxe conjunta e invariantes |

## Ajustes preparados nesta candidata

- Removido proxy para outra build protegida da Vercel.
- Inclusão do CSS dos controles recuperados; logo original preservada.
- Falha de recuperação da sessão retorna ao login em vez de prender o loader.
- Timeout de requests e somente uma repetição após 401.
- IA: bloqueio de chamadas concorrentes para a mesma redação na aba; reutilização de jobs completed/approved e exibição de processing/queued sem novo disparo.
- Colar da IA importa resultado existente e válido para rascunho local, sem chamar correct nem publicar. Esta implementação copia da API, não importa texto arbitrário da área de transferência.
- Rascunho local separado por usuário. Rascunhos com a chave antiga não são migrados automaticamente.
- Ranking exige is_approved === true na normalização.

## Validação já realizada

`node scripts/check.cjs` passou: 10 referências locais presentes; sintaxe conjunta dos scripts válida; logo incorporada; configuração sem proxy; flags preservadas.
Essa verificação é estática. NÃO equivale a login real, teste visual ou validação de todos os módulos.
Publicado em 11/09/2026: deployment dpl_Bf6nPjboZQ1BXpPsgRkMREhk8U9K, READY, exclusivamente no projeto de teste.
Fonte do frontend: commit ab0a192ee0000922c7799c3e8b9a6e3dec48be72.
Link estável: https://versao-teste-etapa12-consolidada.vercel.app
URL imutável: https://versao-teste-etapa12-consolidada-pk43maune-professormavi-6775.vercel.app
HTML, 3 CSS e 7 JS conferidos no link estável: HTTP 200 e conteúdo idêntico ao pacote local.
Validação visual/login real pendente: agent-browser falhou ao iniciar o daemon, inclusive com --debug. Não declarar navegação ou login aprovados.
Não houve alteração de produção nem chamada paga de IA nesta recuperação.

## Atualização — Propostas e Gestão (11/09/2026)

Publicado: commit de código 8c1c0fc1eb3179372c84f901e69ae04396a1c4e0; deployment dpl_9KRi1FC41QKpgS75wfnu53t2smiS, READY no projeto de teste. Link estável atualizado: https://versao-teste-etapa12-consolidada.vercel.app. Os 11 arquivos de interface foram conferidos após publicação: HTTP 200 e conteúdo idêntico. Validação visual e uso real pelo usuário continuam pendentes.

- Propostas: editor no topo com foco/rolagem; erros de leitura visíveis e opção de tentar novamente; edição local preservada ao reabrir e navegar.
- Propostas: inserir, editar, ocultar/reexibir e excluir na simulação; busca e filtros; selecionar todas as turmas; edição de múltiplos textos motivadores preservados.
- Gestão: editor no topo, listas em largura completa responsiva, busca e filtro ativo/oculto; removido corte silencioso de 150 alunos; cache local por instituição durante navegação.
- Gestão: renomear turma atualiza nomes locais dos alunos; excluir turma com alunos vinculados é bloqueado; ocultar permanece disponível.
- Verificação estática passou. Teste DOM via servidor HTTP com API simulada passou para os controles, reabertura, persistência na navegação, busca de 160 alunos e proteção de vínculos, sem escrita de API.
- Teste DOM não comprova layout visual nem contrato real das APIs; validar com usuário após publicação. Gravações continuam desativadas.

## Próxima execução — checklist rastreável

- [ ] Conferir HEAD e ler AGENTS.md; criar branch de trabalho a partir desta main.
- [ ] Servir via HTTP e validar desktop/mobile, CSS e logo no navegador.
- [ ] Validar login, refresh, falha de sessão e logout; usar conta autorizada, nunca inventar credenciais ou burlar autenticação.
- [ ] Validar Propostas, Gestão, Ao Vivo, Ranking e área do aluno; preservar bloqueio de gravações.
- [ ] Validar Colar da IA com correção existente e proteção contra cobrança duplicada.
- [ ] Confirmar o contrato real da ai-correction-api por leitura; não modificar o backend compartilhado.
- [x] Conferir vínculo do projeto de TESTE e publicar o pacote completo, sem loader/proxy/arquivos parciais.
- [ ] Conferir HTML + todos os CSS/JS no endereço servido, console e fluxos. HTTP 200 sozinho não valida uma interface.
- [ ] Registrar commit, deployment, testes e pendências aqui; enviar link ao usuário.
- [ ] Aguardar aprovação do usuário para concluir Etapa 12. Etapa 13 ainda não iniciada.

## Comandos mínimos

```bash
git clone https://github.com/professormavi-boop/versao.git
cd versao
git switch -c etapa12-validacao
node scripts/check.cjs
python3 -m http.server 8123 --bind 127.0.0.1
```

Não é necessário npm install para servir ou verificar este frontend.
Não presuma que .vercel/project.json foi versionado: ele está no .gitignore.
Antes de qualquer deploy, vincule explicitamente o projeto de teste e confira projectId/orgId; pare se houver divergência.
Não conectar o repositório automaticamente ao projeto versao de produção.

## Economia de contexto

Leia este resumo e somente o módulo ligado à pendência. Use rg com nomes de função antes de ler arquivos inteiros. Não busque novamente o ZIP, o Drive ou chats anteriores para localizar estes arquivos. Não imprima CSS/base64 da logo ou todos os scripts no chat. Agrupe verificações independentes. Ao terminar, atualize este arquivo e faça commit para evitar perda de continuidade.

## Atualização — Scanner de redação do aluno (22/09/2026)

Branch de teste: `camera-scanner-aluno`.
Issue rastreável: #1 — Scanner de redação no envio do aluno.

- Removida da experiência nova a caixa “Conferi e a redação está completa e legível”; o botão de envio fica disponível após a prévia.
- `student-scanner.e12.js` sobrescreve apenas a captura/confirmação do módulo `student-upload.e12.js`; o endpoint e o contrato de upload não foram alterados.
- Câmera usa `getUserMedia` com preferência pela câmera traseira; há fallback para `capture=environment` quando o navegador não suporta a API ou a permissão falha.
- Scanner faz detecção simples de bordas no navegador, recorte automático da área detectada (ou recorte A4 central como fallback) e leve ajuste de contraste/brilho/saturação antes de criar o JPEG.
- Botão Flash aparece apenas quando `MediaStreamTrack.getCapabilities().torch` é suportado pelo aparelho/navegador.
- Sintaxe de `student-scanner.e12.js` validada com `node --check` (exit 0).
- Preview Vercel criado automaticamente no projeto autorizado `versao-teste-etapa12-consolidada`; deployment `dpl_HCnnRBuiwoV2k4CJQ6iUTNuqH43g` ficou READY para o commit `2b22e80cd11bd1e0c6f525a26fb266fc5a0ff2c2`.
- Produção não foi promovida nem alterada.
- Pendente: validação física no celular da câmera, detecção de bordas, disponibilidade do flash e envio real a partir da foto processada. O preview está protegido pela Vercel e deve ser aberto pelo link compartilhável do deployment.

## Atualização — correções da auditoria (26/09/2026)

Branch: `fix/auditoria-comercial`, baseada em `bc21335f76decc49c34a98f8293ca40eef574e85`.

- Nota oficial unificada entre resumo e detalhamento; relatório não mistura feedback de análise anterior.
- Campo de desvios ausente é informado como indisponível; uma lista vazia confirmada permanece distinta.
- Relatório essencial do aluno consolidado no módulo, sem redefinição inline no index.
- Proposta com erro de leitura não abre para edição. IDs distintos não são agrupados pelo texto.
- Salvamento envia todos os destinatários em uma operação, com request_id reaproveitado no retry; depende do pacote privado de backend.
- Ordem alfabética dos alunos aplicada antes de renderizar; removido observer corretivo.
- Removidos 14 assets sem referência no aplicativo/configuração atual; recuperáveis pelo histórico Git.
- `npm run check` corrigido para querystrings; `npm test` cobre regressões da auditoria e assets/relatório via HTTP com DOM simulado.
- Produção e banco compartilhado não alterados. Backend preparado e testado em pacote privado; não versionar fontes privadas nesta origem pública.
- Validação: check, regressões de interface e HTTP passaram. Testes locais de backend/SQL passaram. Não equivale a validação visual mobile, OCR, pagamento real ou login da versão modificada.
- Não publicar somente este frontend: aplicar/homologar backend correspondente antes.
- Link público de teste desta branch ainda não criado; testes HTTP locais são reprodutíveis por `npm test`.

- Integração posterior: branch atualizada sobre `4701bdf` (patch de nota oficial recebido durante a tarefa). O wrapper `correction-consistency-fix.e12.js` foi consolidado nos módulos e removido: sua mesclagem com a análise antiga não deve prevalecer sobre o contrato oficial. Base de revisão para o pacote final: `4701bdf`.

## Padronização de controles — 27/09/2026

Solicitada pelo usuário após a publicação 152e9eb. Campos e seletores compartilham bordas, tipografia, foco, estados desabilitados e altura mínima; botões de ação têm alvo mínimo de 44px. Logo e navegação preservados. Removida a exceção de pvAxis; menu compartilhado contempla opções ocultas/grupos desabilitados, teclado e rolagem interna. Teste select-controls.cjs e regressões existentes aprovados. CSS mobile usa fonte 16px e menu limitado à tela; validação física Android/iOS ainda não realizada. Nenhuma alteração de backend ou pagamentos. Publicação autorizada na mesma sessão, destino suaversao.vercel.app.

## Ícones de atalho — 27/09/2026

Solicitação: usar a logo existente como favicon e ícone de tela inicial.
- [x] Extrair a logo existente sem redesenhar; gerar formatos necessários.
- [x] Declarar favicon, apple-touch-icon e manifest; incluir no pacote de deploy.
- [x] Verificar arquivos e entrega HTTP; registrar commit e limitações.

Validação: npm run check, npm test e HTTP dos seis novos arquivos passaram; dimensões PNG e manifest conferidos. Logo original incorporada de 128px reaproveitada, sem redesenho. Commit desta seção registra a implementação. Publicação em suaversao.vercel.app conforme autorização anterior mantida na sessão; projeto prj_5OC7zfjEgapvbrapPjas2lLvvut7 confirmado. Pendente: instalação física Android/iOS; atalhos existentes podem exigir recriação por cache.

## Pós-envio do aluno — 27/09/2026
- [x] Destacar envio confirmado e redação mais recente.
- [x] Recolher histórico e exigir abertura explícita da correção.
- [x] Validar regressões e publicação autorizada.

Testes: npm run check, npm test (assets HTTP e regressões) e DOM com redação nova pendente + antiga aprovada passaram. Confirmação persistente após envio; histórico recolhido; notas somente em Ver correção. Sem alteração de notas/backend. Validação física mobile pendente. Commit desta seção contém o ajuste; destino suaversao.vercel.app.

## Ao Vivo — captura e lista (27/09/2026)
- [x] Remover checkbox e liberar envio após imagem válida.
- [x] Manter avisos de qualidade sem bloqueio silencioso; ordenar nomes pt-BR.
- [x] Validar e publicar conforme autorização da sessão.

Validação: check e testes HTTP/regressão passaram; DOM confirma ausência de checkbox, envio habilitado com aviso e arquivo inválido bloqueado. Ordenação pt-BR aplicada antes das opções em ambos os preenchimentos. Câmera física mobile ainda depende de reteste no aparelho. Nenhum backend ou nota alterado.

## Paginação de filas — 27/09/2026
- [x] Buscar correções em lotes de 10 no servidor.
- [x] Preservar filtros globais e permissões; carregar mais sem duplicar.
- [x] Validar comportamento e publicar.

Fila de Correções: nova ação queue_page busca páginas de 10 no banco; filtros de status varrem lotes limitados, sem carregar todos os relatórios. Backend live-correction-beta-api v6 ativo, JWT mantido. Testes com 37 registros: paginação, status, busca vazia e permissão aprovados. Check e regressões HTTP aprovados. Revisão aberta é preservada ao carregar mais. Paginação não aplicada ao painel inicial nem ao histórico do aluno nesta alteração. Sem benchmark de grande volume ou login visual novo.


## Acesso imediato — 30/09/2026
Solicitação explícita do usuário: remover confirmação obrigatória de e-mail em produção.
- [x] Conferir cadastro e funções de créditos atuais.
- [x] Preparar texto e sessão de acesso imediato no cadastro, preservando validações.
- [ ] Desativar confirmação de e-mail nas configurações do Supabase Auth. Conector não expõe configuração; depende de acesso ao painel.
- [ ] Validar cadastro e login reais, bônus único e publicar frontend.
Não publicar este frontend antes de desativar a confirmação. Bônus atual: 3 iniciais, +2 e +5 por marcos; não alterar nesta tarefa.

Validação local: 6 cenários simulados (sucesso com sessão, senhas diferentes, termos ausentes, conta duplicada, resposta sem sessão e armazenamento indisponível); teste de analytics atualizado para conversão no cadastro. O check geral existente falha por proibir roteamento já presente na main; não alterado nesta tarefa.
Nova orientação: incluir somente CAPTCHA como proteção adicional, sem confirmação por e-mail. Precisa de chaves reais do provedor e habilitação no Supabase. CAPTCHA global também deve ser integrado ao login/recuperação antes de habilitar para evitar bloqueios. Não ativado nem publicado.

## Turnstile e recuperação — 30/09/2026
- [x] Chave pública fornecida pelo usuário integrada ao componente compartilhado de CAPTCHA.
- [x] Token enviado a signup, login por senha e recuperação; PIN do aluno e refresh preservados.
- [x] Reenvio de recuperação após 60 segundos; confirmação não é oferecida, conforme correção explícita do usuário.
- [x] Cadastro direto: 7 cenários simulados e analytics aprovados; sintaxe dos módulos aprovada.
- [ ] Inserir Secret Key diretamente no painel, selecionar Turnstile e ativar proteção em conjunto com publicação.
- [ ] Desativar confirmação obrigatória e testar cadastro real sem envio de e-mail.
Nenhuma chave secreta armazenada no frontend. Produção ainda não alterada.

Pré-publicação: npm test passou (regressões de notas/propostas, 33 assets HTTP, seletores e analytics); token CAPTCHA conferido contra contrato oficial auth-js. Allowlist Vercel inclui captcha.e12.js. PIN utiliza generateLink + verifyOtp, sem login por senha.

## Publicação concluída — 30/09/2026 23h10
Commit público f2ed0ef35ec1fa24ce765f6ce2a99c5729e6f58e; deployment dpl_3gKxaWUMtKerfZJErct7j7wzGWdG READY. Assets novos confirmados via HTTP em app.versaoprofessor.com. Vercel retornou aviso alias_in_use para www; domínio do app serve versão nova.
Supabase: Turnstile salvo com chave inserida manualmente pelo usuário, sem ler ou armazenar o segredo. Confirm email desativado; API pública settings confirma mailer_autoconfirm=true e disable_signup=false. Signup, login por senha e recover sem token retornam 400 captcha_failed. Cadastro publicado inspecionado visualmente: widget Cloudflare renderiza Confirme que é humano. Não foi realizado cadastro real nem envio real de recuperação nesta execução; testes funcionais são simulados. Google não habilitado nesta tarefa.

## Escolas e importação — 30/09/2026
Pedido autorizado: Minhas escolas, Minhas turmas, Meus alunos e Importar alunos como acessos diretos.
- [ ] Adaptar menu e contexto das páginas, mantendo API e IDs existentes.
- [ ] Destacar destino, revisão e resultado da importação.
- [ ] Testar fluxos e publicar sem alterar marca.

Implementado: quatro rotas no menu; nomes atualizados na organização e primeiros passos; atalho de importação no início direciona à área dedicada. Escola/turma por cards e criação inline preservadas. Importação destaca destino, permite colagem do Excel ou CSV, exige revisão antes de gravar, mantém duplicidades e idempotência, mostra resultado e acesso a alunos/PINs. Logo e CSS existentes preservados.
Validação: teste DOM das quatro rotas, importação com API simulada, lista Excel, revisão sem gravação, uma gravação e botão de PINs aprovado; regressões npm test e assets HTTP aprovados. Não executada importação com gravação real de alunos.

## Importação guiada — 01/10/2026
- [x] Revisar main 285e533 e preservar submenu Escolas já implementado em action-alerts.
- [x] Retirar possessivos dos títulos; Escola abre Turmas, turma abre Alunos, importação abre assistente dedicado.
- [x] Implementar três passos: escolher/criar escola e turma; enviar lista; revisar e importar.
- [x] Testar fluxo com múltiplas escolas, criação, duplicidades, retorno e conclusão.
- [ ] Criar preview; aguardar autorização para produção conforme AGENTS 12–14.
Database: nenhum impacto durante implementação; APIs existentes reaproveitadas. Sem mudanças de Auth, RLS, migrations, variáveis ou domínios. CSV e colagem Excel suportados; PDF/foto e reconhecimento com IA propostos, não implementados nem cobrados. Rollback: retornar os arquivos desta branch à base 285e533.

Validação desta branch: npm test passou, incluindo carregamento dos módulos via HTTP, criação de escola/turma, seleção do destino, preservação ao voltar, CSV/Excel, limite de 500, e-mail inválido, duplicidades com escolha obrigatória, bloqueio de todas as linhas ignoradas, clique duplo, retry com mesmo request_id e navegação para alunos/PINs. APIs simuladas; sem gravações de alunos reais. Atalhos da home agora usam as áreas correspondentes. npm run check continua falhando na regra antiga que proíbe rewrites já presentes na base para landing page; sintaxe conjunta e assets passam antes desse ponto. Não alterar roteamento nesta tarefa. Preview e publicação ainda pendentes.

Preview entregue — 01/10/2026: código cb3085386c22b9b7f2bda098e07ed4f63d323f3b na branch feat/importacao-guiada. Deployment dpl_E64wm4JKtmzWHXq4vhU4zYdsCWqa, projeto isolado prj_7mEBS5QDaBWrG4hjnBKelNkU90OY, READY, target preview. URL: https://versao-teste-etapa12-consolidada-n9bmpro77-professormavi-6775.vercel.app . Módulo novo retornou HTTP 200; demais requisições do conector redirecionaram para Vercel Authentication. Link temporário de compartilhamento disponibilizado ao usuário; não remover proteção. Testes funcionais completos executados em HTTP local com APIs simuladas. Validação visual autenticada/mobile e importação real não realizadas. Produção/main não alterados. Publicação exige aprovação do usuário após conferir a prévia, conforme AGENTS 12–14.


## Alterar senha do professor — 01/10/2026
Branch: feat/professor-alterar-senha. Base: 5ab9246.
- [x] Inspecionar menu e contrato Auth existente.
- [x] Adicionar rota própria sem dependência da API de créditos.
- [x] Validar confirmação, comprimento, bloqueio de duplicidade e erros via HTTP.
- [ ] Publicar branch de revisão e informar limites.
Impacto: frontend usa PUT /auth/v1/user com token da própria sessão. Sem API administrativa, migrations, RLS, Edge Functions, variáveis ou domínios. Nenhuma senha real alterada nos testes. Rollback: reverter o commit desta alteração. Produção depende de aprovação após apresentação do resultado.

Usuário autorizou publicação e pediu retirar Turmas/Alunos do menu. action-alerts.e12.js mantém Gerenciar escolas e Importar alunos, preservando rotas internas. npm test passou, incluindo teste novo com API simulada e 34 assets via HTTP. Login/troca de senha real não executados.
