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

## Importação Excel, IA e início — 01/10/2026
Branch feat/importacao-excel-ia, base 391d92b. Produção não alterada.
- [x] Diagnosticar tentativa real: 30 alunos gravados, 29 com separador e matrícula incorporados ao nome; detector usava apenas a primeira linha.
- [ ] Ler Excel/CSV com prévia, mapeamento explícito e validação antes da gravação.
- [ ] Fornecer modelo Excel opcional e destacar importação na home inicial.
- [ ] Preparar reconhecimento de colunas com IA em endpoint separado, sem gravação de alunos pela IA.
- [ ] Testar incidente reproduzido, arquivos, duplicidades, navegação e falhas.
- [ ] Preparar reparação restrita dos nomes afetados; requer aprovação para executar.
- [ ] Registrar revisão e pedir aprovação antes da publicação (AGENTS 12–14).
Backend novo será mantido no pacote privado, fora da origem pública. Sem alterações de autenticação/domínios. Implantação da IA depende de função, controle de uso e validação separados. Rollback: reverter frontend e desativar nova função.

12h08: usuário aprovou mockup desktop/mobile, separação visual do menu e implementação com IA paga pelo saldo do professor. Regra apresentada: 1 crédito por organização de lista, reuso idempotente e estorno de falhas; cadastro manual gratuito. Preparar novo teacher-import-api e SQL privado (matrícula, análises, reserva/estorno, importação transacional). Frontend: reader/worker, wizard, home, CSS, menu, créditos, modelo e testes. Não publicar/alterar banco antes da validação e nova autorização conforme AGENTS 12–14.

### Implementação preparada — 01/10/2026
- [x] Visual aprovado na home sem alunos; demais professores mantêm painel de trabalho; separador antes de Conta e créditos.
- [x] Excel XLSX/XLS em worker, CSV e colagem; modelo XLSX com aba de instruções e sem alunos fictícios para importar por engano.
- [x] Prévia, associação de colunas, edição de células, agrupamento por escola/turma; uma aba por vez, até 500 alunos e 20 grupos.
- [x] Três passos: lista → destinos → revisão; revisão em páginas de dez; cadastro manual gratuito; IA por ação explícita com preço de 1 crédito.
- [x] Backend privado preparado: matrícula separada, importação em transação, permissões, resultados reaproveitados, reserva/estorno e recuperação de análise interrompida.
- [x] Testes npm (HTTP/DOM), Postgres isolado (PGlite), handler TypeScript com OpenAI simulado e Chromium desktop/mobile com arquivos XLSX/XLS reais aprovados.
- [x] Pacote separado para reparar os 29 nomes, preservando IDs/vínculos. Não executado.
- [ ] Ativar backend em produção após aprovação, homologar IA/créditos/bônus reais, publicar frontend.

Limitações: fontes privadas em `importacao-privada`, fora deste repositório público. Não publicar só o frontend: wizard depende de teacher-import-api/database.sql. Não houve teste OpenAI pago, migração, importação real ou débito em conta de cliente. Capturas reais feitas com dados fictícios e API simulada. CLI agent-browser indisponível; verificação visual concluída via Chromium/Playwright. `npm run check` mantém falha preexistente por proibir rewrites da landing; roteamento não alterado. Cadastro em múltiplas abas exige selecionar uma aba por vez; PDF/foto fora do escopo. Repetição de matrícula dentro do mesmo lote é bloqueada, sem fusão silenciosa. Rollback: frontend 391d92b e desativação da nova função, mantendo dados e ledger para auditoria.

Registro histórico anterior à implementação, às 11h57: apresentar proposta de melhoria do processo além da leitura. Proposta: primeiro acesso centrado em preparar turma; lista → escola/turma → revisão; matrícula preservada separadamente; revisão assistida de colunas e duplicidades; conclusão leva à primeira proposta. Naquele checkpoint apenas o leitor experimental e a biblioteca SheetJS 0.20.3 estavam guardados; a implementação posterior está descrita acima. Sem execução da reparação dos 29 registros. Produção e banco intactos.

### Revisão salva e prévia — 01/10/2026 15h49 UTC
- [x] Preservar código revisável na branch remota e pacote privado separado.
- [x] Registrar testes e prévia, sem promover produção.
- [ ] Obter aprovação específica para ativar backend, homologar IA/créditos/bônus reais e publicar o frontend.

Commit funcional: f29725c5188d0947711f05529abfaffc74e9b5ab (árvore idêntica ao commit local validado 2ac86e4). PR em rascunho: https://github.com/professormavi-boop/versao/pull/14 . Prévia automática READY, projeto isolado prj_7mEBS5QDaBWrG4hjnBKelNkU90OY, deployment dpl_8tKo3EjkerZWm3Vn7tYPXvDFbxEU, target preview: https://versao-teste-etapa12-consolidada-ptg6d89n3-professormavi-6775.vercel.app . A consulta dos assets pelo conector retornou a proteção Vercel Authentication; não foi declarada validação funcional remota. Proteção preservada. Capturas desktop/mobile e testes funcionais concluídos em HTTP local com APIs simuladas. Pacote privado versao-importacao-backend-revisao.zip e capturas preservados fora do repositório público. Backend ainda não ativado, portanto a prévia não executa a nova importação real. Aprovação também necessária, separadamente, para executar repair-29-names.sql.


### Ativação autorizada — 01/10/2026 12h55 BRT
Usuário autorizou ativar backend, homologar e publicar após testes.
- [x] Conferir main 391d92b e criar restore/antes-importacao-ia-20261001. Produção anterior dpl_AwLVHCGgNNtQ6SMcfBf1b81Zu4Ds.
- [ ] Aplicar database.sql e publicar teacher-import-api com JWT obrigatório.
- [ ] Homologar IA, cobrança única/estorno, transação, bônus e destinos da importação.
- [ ] Publicar PR14 e verificar produção.
- [ ] Atualizar evidências, pacote privado e rollback.
Arquivos adicionais de ativação: CONTINUIDADE.md e relatório/testes privados; código preparado permanece no PR14. Impacto autorizado: coluna students.registration, índice, tabela protegida de análises e três RPCs service_role; nova Edge Function usa segredos existentes. Auth, domínio, CAPTCHA e demais APIs preservados. Reparação dos 29 nomes antigos continua separada.

Adaptação necessária: Supabase recusou nova Edge Function por limite do plano. Preservar serviço de escolas e acrescentar ações prefixadas import_status/import_review/import_commit/import_organize no teacher-organization-api. Arquivos frontend adicionais ajustados: core.e12.js, teacher-import.e12.js, tests/schools-import.cjs; backend privado: teacher-organization-api/index.ts, organization.ts (cópia do handler anterior), import-assistant.ts (handler já validado), teste do roteador e README. Sem alteração do plano, gastos máximos, Auth ou regras existentes; testar regressão de ações antigas antes do deploy.

### Backend ativado — 01/10/2026 13h10 BRT
- [x] Migration teacher_import_excel_ai aplicada; coluna/índice, tabela RLS e três RPCs service_role ativos.
- [x] Limite de Edge Functions resolvido incorporando ações import_* ao teacher-organization-api v5, mantendo as sete ações anteriores e JWT obrigatório. Backup da v3 no pacote privado. Não houve upgrade de plano.
- [x] npm test, handler IA simulado, roteador e Postgres isolado passaram. index.html também atualizado apenas para invalidar cache dos dois scripts adaptados.
- [x] Banco real: cinco alunos, matrículas com zeros, rubrica ENEM, leitura no fluxo antigo, bônus único, reserva/reuso/estorno e rollback de lote inválido passaram como service_role. Toda a massa de teste foi desfeita; saldo e cadastros da conta de teste preservados.
- [x] HTTP OPTIONS 200 e ausência de sessão 401 conferidos. Erro de callback Deno encontrado na v4 e corrigido na v5 antes de publicar a interface.
- [ ] Chamada real OpenAI e jornada autenticada: navegador indisponível por proteção de documento contendo credenciais nativas. Não contornar nem pedir senha no chat.
- [ ] Após homologação real, publicar PR14. A autorização já foi dada; não pedir novamente para esta mesma mudança.
Banco/serviço ativos, frontend continua na produção anterior. Nenhum crédito de cliente consumido e nenhum cadastro fictício permanente. Advisors sem nova exposição pública; tabela de análises sem políticas é intencional, acessível apenas a service_role. Reparação dos 29 nomes NÃO executada.

Prévia funcional preparada: commit 210d24391db81f21f60202423fe72a4acf8a5efe, deployment dpl_34RgXcxKqhaDKPwVQYeqYTSqxYLm READY no projeto isolado. URL https://versao-teste-etapa12-consolidada-q9c4uawa4-professormavi-6775.vercel.app . Link temporário de compartilhamento entregue ao usuário. Pacote privado atualizado: versao-importacao-backend-ativado.zip, incluindo fonte implantada v5, SQL de teste real e rollback v3. Nova interface ainda não promovida; aguarda teste real autenticado de IA.


### Importação homologada e Google autorizado — 01/10/2026
- [x] Usuário testou alias: 30 alunos, três turmas de dez, IA concluída em ~3,1 s, um débito; saldo final 4 (3 iniciais -1 IA +2 marco de alunos).
- [x] Banco e contrato proposal-beta-api v19: escola própria e três turmas ativas, proprietário correto; editor renderiza e seleciona as três turmas. Sem publicar proposta de teste.
- [x] PR14 publicado: main 3787efb22a8ecaf77ac17c25f62dfdf05fe4e8c9; produção dpl_7CEsbwvG6tG5uLsWCLbUV6Qni2sQ READY, HTML público 200 com assistente novo. Autorização anterior de ativação continua válida.
- [x] Usuário autorizou publicar também a mudança Google às 13h45 BRT após explicação do fluxo.
- [x] Google atualmente desativado em /auth/v1/settings. Não há Client ID/secret configurados acessíveis nesta sessão.
- [x] Preparar branch feat/google-login: PKCE S256, retorno limpo antes de analytics, botão condicional ao provedor, sessão atual, professor novo confirma nome/termos, existentes preservados.
- [x] Migration google_teacher_signup aplicada; teacher-organization-api v6 com JWT ativo, sete ações antigas e quatro import_* preservadas. OPTIONS real 200. Fonte privada fora do GitHub.
- [ ] Publicar frontend revisado; ativação efetiva Google depende de OAuth Client Google + provedor no Supabase.
Arquivos: index.html, cadastro-professor.html, boot.e12.js, core.e12.js, google-auth.e12.js/.css, .vercelignore, package.json, tests/google-auth.cjs, tests/google-boot.cjs e este registro. Backend privado em google-privado: handler google-signup.ts, roteador atualizado preservando organização/importação, google-signup.sql, testes/rollback/README. Impacto: tabela RLS service-only de aceite e função restrita a service_role para consultar identidade Google verificada e concluir perfil pendente. Função definer com search_path vazio porque service_role não acessa auth.users diretamente; nenhuma permissão ampla concedida. Sem alteração de senha, e-mail confirmado, CAPTCHA, bônus, domínio ou variáveis Vercel. Rollback frontend 3787efb e roteador v5; manter registros de aceite e perfis já criados. Desativar provedor Google se necessário.

Validação Google: npm test aprovado, incluindo cadastro direto, PKCE/cancelamento/expiração/storage e boot de contas existentes/pendentes, e-mail+CAPTCHA, PIN e recuperação. Chromium HTTP desktop/mobile com API simulada sem overflow/erros de página. PGlite e handler/roteador aprovados. Banco real como service_role: perfil pendente → professor aprovado, aceite obrigatório, 3 créditos únicos e repetição sem alteração de nome; dados fictícios integralmente desfeitos. Consulta real confirmou RPC executável só por service_role, definer com search_path vazio e tabela RLS sem acesso anon/authenticated. Login Google real ainda não testável porque external.google=false: falta cliente OAuth Google, segredo no Supabase e redirect permitido https://app.versaoprofessor.com/index.html?google_callback=1. Não declarar Google ativo até usuário configurar e testar.


## Manuscritas e nome do professor — 01/10/2026
Base: d7be522; branch feat/manuscritas-nome-professor.
- [x] Inspecionar contratos atuais e preservar fontes privadas fora da origem pública.
- [x] Campo handwritten_only na proposta e ocultação inline de opções incompatíveis no aluno, sem modal novo.
- [x] Alterar nome do próprio professor, com sessão e perfil aprovado, sem mudar Auth/Google.
- [x] Padronizar CSS dos campos; testar UI, handlers e migração em ambiente isolado.
- [x] Preservar pacote privado e branch; apresentar resultado antes de produção.
Impacto preparado: rounds.handwritten_only boolean default false; duas RPCs de salvamento; proposal-beta-api, student-proposals-cycle-api, student-submit-v2-api, student-submission-cycle-api; ação update_name no teacher-organization-api. Sem mudança em RLS/credenciais/domínios/Google. Backend não ativado. Originais guardados para rollback.

- [x] Corrigir openEssay para PDF/texto convertido, mantendo exibição inline e fallback; testar imagem/PDF/arquivo ausente/erro. Arquivos: correction.e12.js, enhancements.e12.css, index.html, tests/essay-viewer.cjs, package.json. Database nenhum impacto nesta correção.

Validação: npm test completo PASS, incluindo testes HTTP/DOM de proposta, perfil e visualizador; handlers privados e SQL PGlite PASS. Navegador real indisponível (Chromium bloqueado por política de rede); não afirmar homologação visual/autenticada. Backend preparado, NÃO ativado. Publicação requer autorização específica após revisão. Rollback: restaurar frontend anterior e funções/RPCs de original/ no pacote privado; manter coluna nova inerte para preservar dados.

Revisão preservada: PR16 https://github.com/professormavi-boop/versao/pull/16 ; código validado no commit 51817e3c326e0a6b2f8da1cdba033bc16e5c9a43, árvore remota conferida com a local. Pacote privado versao-manuscritas-backend.zip salvo. Preview automático encontrado corresponde apenas ao primeiro commit documental, portanto NÃO serve para testar este conjunto; usar PR16 para revisão. Produção e backend seguem intactos nesta etapa.

### Ativação autorizada — 01/10/2026 15h21 BRT
- [x] Usuário autorizou ativar backend e publicar PR16 após apresentação dos resultados.
- [x] Restore restore/antes-manuscritas-20261001 no main d7be522. Boot público confere com esta base; branch separada google-direct-access não está publicada e não será incorporada nesta mudança.
- [ ] Aplicar migration e publicar cinco funções preservando JWT e módulos existentes.
- [ ] Validar coluna/RPCs/serviços e publicar PR16; conferir domínio e assets.
- [ ] Registrar publicação e atualizar pacote privado.
Arquivos de ativação: CONTINUIDADE.md e pacote privado. Sem mudança adicional no escopo previamente apresentado. Rollback frontend d7be522 e fontes/RPCs original/; manter coluna inerte e dados já gravados.
- [x] Migration proposal_handwritten_only aplicada. Coluna boolean NOT NULL default false; 11 propostas existentes continuam livres. Duas RPCs atualizadas preservando acesso somente postgres/service_role.
- [x] Funções ativas com JWT: proposal-beta-api v20, student-proposals-cycle-api v5, student-submit-v2-api v7, student-submission-cycle-api v8, teacher-organization-api v7. Fontes anteriores conferidas antes da substituição; módulos Google/importação preservados.
- [x] HTTP OPTIONS 200 e POST sem sessão 401 em todas as cinco funções. Testes funcionais simulados anteriores PASS; jornada autenticada visual permanece pendente.

## Limpeza de código substituído — 01/10/2026
- [x] Remover implementações sobrescritas de renderTeacherAccount/renderDemoProposals em teacher-main e renderStudentHome/renderStudentProposals/studentProposalClick em student.
- [x] Retirar entradas inexistentes landing.e12.css e landing-mockup-versao.webp de .vercelignore; atualizar cache dos módulos alterados em index.html.
- [x] Conferir bindings das rotas atuais e testar HTTP/regressões; preservar commit e PR.
Database nenhum impacto; sem backend/deploy/domínios/segredos. Rollback por reversão do commit. Não remover CSS compartilhado, funções chamadas por wrappers nem telas administrativas ativas. Publicação anterior de manuscritas continua bloqueada por build-rate-limit Vercel; esta limpeza ainda não autorizada para produção.

Escopo adicional: scripts/check.cjs atualizado para aceitar exclusivamente as duas rewrites locais existentes da landing; testes/http-smoke.cjs valida os bindings atuais após carregamento HTTP e DOMContentLoaded. Sem mudar vercel.json.

Validação concluída: npm run check, npm test e git diff --check PASS; 40 assets HTTP e bindings das telas atuais conferidos. Sem homologação visual autenticada. Nenhuma alteração em produção nesta limpeza.

### Revisão ampliada do projeto publicado
- [x] Remover shell de correção substituído e suas referências; exportar explicitamente o renderizador atual.
- [x] Remover aiQueueStatus/aiNotice, liveFill e seletores/confirmação de upload substituídos; manter os wrappers que chamam implementações-base.
- [x] Consolidar filtro de manuscritas na câmera ativa e testar com scripts na ordem real.
- [x] Revisar assets/CSS/APIs/worker; preservar dependências dinâmicas e compatibilidade de registros históricos.
- [x] Rodar verificações e atualizar PR17. Database nenhum impacto; sem escrita em produção, backend ou configuração de domínio.

Escopo adicional core.e12.js: remover showOnly, safeMessage e generationScreen sem chamadas. Revisados todos os scripts estáticos, CSS, páginas, manifest, assets, APIs Vercel e worker. CSS compartilhado/dinâmico, relatórios históricos, endpoints públicos e SheetJS preservados; ausência de chamada frontend não comprova endpoint obsoleto. Teste HTTP ampliado cobre bindings de correção/Ao Vivo e seletor real de manuscritas.

Revisão ampliada validada: npm run check / npm test / git diff --check PASS. 39 assets HTTP; correção, Ao Vivo e seletor manuscritas conferidos com módulos atuais carregados. PR17 reúne a limpeza; produção não alterada e validação visual autenticada pendente.

## Correção de navegação com módulo ausente
- [x] Resolver somente o handler da rota selecionada; não avaliar todas as funções ao abrir qualquer tela.
- [x] Mensagem amigável e recarga explícita para módulo ausente; testar falha isolada e recuperação.
Arquivos: core.e12.js, index.html, tests/navigation-modules.cjs, package.json e este registro. Database nenhum impacto; sem mudança de domínios/Auth/backend. Rollback por reversão.

Teste de regressão reproduz módulo ausente, confirma outras rotas acessíveis, recuperação após disponibilização do módulo e retry comum preservado. npm run check / npm test / git diff --check PASS. Incluído no PR17, ainda não publicado.

## Novo Ao Vivo — prévia de interface e arquitetura
- [x] Criar prévia independente da inicial e envio avulso com câmera, arquivo e texto.
- [x] Demonstrar tema informado/sugerido, confirmação do recorte C2 e aluno opcional.
- [x] Documentar armazenamento direto por professor com base no esquema real, sem migrations.
- [x] Testar navegação/validação e preservar branch/PR. Sem deploy produtivo, IA ou cobrança real.
Arquivos: previews/ao-vivo.html, previews/ao-vivo.css, previews/ao-vivo.js, docs/ao-vivo-arquitetura.md e CONTINUIDADE.md. Database nenhum impacto. Rollback: remover prévia; produção intacta.

Validação: JS syntax/diff PASS; assets HTTP PASS; fluxo DOM de texto, confirmação do tema, retorno preservando campos e ausência de chamada API/cobrança PASS. Prévia móvel responsiva preparada, sem navegador real disponível para homologação visual. Artefato HTML independente para revisão. Armazenamento recomendado separado: submissions atual exige projeto/aluno e reserva exige submission_id. Nenhuma migração/gravação de dados.

## Implementação Ao Vivo aprovada visualmente — 01/10/2026
- [ ] Corrigir quebra do nome de arquivo no mobile da prévia e da interface integrada.
- [ ] Integrar Ao Vivo e entrada inicial para professor sem turmas; renomear fluxo vinculado para Receber redações.
- [ ] Preparar pacote privado: tabelas/RLS, upload, tema, análise/reconciliação, revisão e carteira idempotente.
- [ ] Testar permissões, formatos, cobrança e fluxo; apresentar resultado antes de ativar produção.
Arquivos: teacher-live.e12.js/.css, core.e12.js, teacher-home.e12.js, teacher-main.e12.js, index.html, .vercelignore, testes e docs; privado migration.sql/live.ts/roteador preservado/protocolo e evidências. Sem alteração produtiva ainda; migrations preparadas, não executadas. Rollback desativa nova entrada preservando histórico e ledger.

### Compartilhamento e identificação opcionais — 01/10/2026
- [x] Incluir escola opcional junto ao nome, preservando ambos ao navegar.
- [x] Especificar compartilhamento posterior pelo histórico, após revisão, sem exigir cadastro.
- [x] Validar sintaxe e persistência dos campos na prévia.
Escopo desta atualização: previews/ao-vivo.js, previews/ao-vivo.css, docs/ao-vivo-arquitetura.md e CONTINUIDADE.md. Database nenhum impacto nesta prévia. Integração e publicação continuam pendentes.

Validação desta atualização: node --check, git diff --check e fluxo DOM com aluno/escola preservados ao avançar/voltar PASS. Quebra de arquivo longo preparada em CSS; sem homologação visual real. Compartilhamento documentado, ainda não conectado.

### Normalização de escola autorizada
- [x] Criar utilitário de correspondência exata e sugestões sem substituição silenciosa.
- [x] Integrar sugestões acessíveis na prévia; catálogo ilustrativo explicitamente identificado.
- [x] Testar nomes equivalentes, erros, ambiguidade e isolamento do catálogo recebido.
Arquivos: school-name.e12.js, tests/school-name.cjs, previews/ao-vivo.html/.js, docs/ao-vivo-arquitetura.md, CONTINUIDADE.md. Database nenhum impacto. Sem deploy.

Validação: testes de normalização e DOM PASS (maresta preservado até escolha explícita, Marista selecionado); sintaxe e diff PASS. Módulo reutilizável e prévia preparados, sem conexão ao catálogo real. Integração completa Ao Vivo/backend/compartilhamento segue pendente.

## Aluno independente autorizado — 01/10/2026
- [ ] Cadastro próprio Google/e-mail sem escola/turma/professor.
- [ ] Degustação única de 1 crédito por perfil de aluno confirmado; preservar perfis existentes.
- [ ] Correção particular, histórico e compartilhamento próprios.
- [ ] Checkout por correção; preço do crédito de aluno ainda não definido pelo usuário.
- [ ] Testes isolados, preservação e autorização específica antes de ativação produtiva.
Arquivos da etapa de cadastro: cadastro-aluno.html, student-signup.e12.js, google-auth.e12.js, testes/student-signup.cjs, .vercelignore, docs/ao-vivo-arquitetura.md, CONTINUIDADE.md; privado student-signup.sql/student-signup.ts/router e testes. Impacto preparado: RPC service-only, tabela de aceite com RLS e ledger existente. Sem domínio/env novo. Google usa callback na própria página de cadastro; não converter papel de conta existente. Rollback remove entrada e desativa nova função, preservando saldo e histórico.

## Ordem consolidada em 01/10/2026 17h55 BRT
Checklist oficial: docs/checklist-implantacao-ao-vivo.md. Prioridade 1 Ao Vivo professor; 2 aluno independente; 3 créditos para avulsos e alunos da base via PIN. Cadastro sem confirmação de e-mail, decisão posterior aos testes: o rascunho SQL/UI ainda exige confirmação e precisa ser atualizado antes da ativação. Não declarar integração concluída. Cadastro, degustação e handler têm testes isolados iniciais; Ao Vivo permanece prévia + rascunho SQL, sem handlers reais de correção/histórico/share. Preço de venda do crédito de aluno não definido.
- [x] Conferir arquivos atuais e criar checklist com evidência por etapa.
- [ ] Concluir backend Ao Vivo e interface integrada antes de avançar a publicação.
Esta atualização documental não modifica database, Auth, Storage, funções ou produção.

### Checklist ampliado: Ao Vivo do aluno
- [x] Incluir etapa própria de Ao Vivo aluno, atendendo avulso e base via PIN.
- [x] Separar cadastro independente de acesso à ferramenta e venda de créditos.
Arquivos desta atualização: docs/checklist-implantacao-ao-vivo.md e CONTINUIDADE.md. Database nenhum impacto; atualização documental, sem produção. Ordem: professor → Ao Vivo aluno → cadastro avulso → créditos → homologação/publicação.

### Execução etapa 1 — backend Ao Vivo
- [ ] Preparar handlers privados de criação, início, consulta e histórico, reaproveitando protocolo.
- [ ] Testar débito/estorno, concorrência lógica, posse da redação e preservação de análises anteriores.
- [ ] Conectar revisão/compartilhamento e frontend após concluir base.
Arquivos privados: migration.sql, prepared/live.ts, prepared/live-ai.ts, prepared/index.ts e testes; público somente checklist/continuidade. Migração não aplicada, IA paga não executada.

### Avanço concreto do Ao Vivo — implementação local, não ativada
- [x] Preparar handler de texto/upload, tema, início, consulta e histórico com protocolo atual.
- [x] Preparar revisão e compartilhamento por token aleatório, snapshot, expiração de 7 dias e revogação.
- [x] Integrar rota teacher-live, card câmera na inicial sem exigir turma e rótulo Receber redações.
- [x] Testar SQL isolado: posse, confirmação de tema, débito único, estorno único, erro tardio, quota de tema, snapshot e link expirado/revogado.
- [x] Testar fluxo DOM: tema/crédito/revisão obrigatórios antes da etapa seguinte; compartilhamento/revogação.
- [x] Regressões existentes PASS após adaptar teste do onboarding (home oferece Ao Vivo, sem redirecionamento obrigatório à importação). 41 assets HTTP.
- [ ] Testar handlers com provedor simulado, validadores de upload e perda de resposta; concluir sugestões de escola com catálogo real.
- [ ] Homologar visual/autenticado e processamento real antes de considerar pronto.
Limites: fila reconcilia ao consultar a redação; worker independente ainda não integrado. Histórico mostra primeiras 20 redações na UI; paginação e acesso a versões anteriores pendentes. DOCX é encaminhado como input_file, sem extração local. Documentação oficial OpenAI consultada: https://developers.openai.com/api/docs/guides/file-inputs. Código privado não ativado e nenhuma chamada paga.

Atualização subsequente: handlers simulados PASS (auth/papel/posse, confirmação, reuso sem segunda chamada, id provedor, falha/estorno); validadores de assinatura/tamanho PASS. Histórico ganhou paginação e escolha das últimas 20 versões; painel gerencia/revoga links anteriores. Sugestões da escola usam catálogo autorizado e nomes recentes. npm run check e npm test completo PASS, 42 assets HTTP. Cadastro aluno ainda é rascunho anterior à retirada da confirmação: não publicar esse fluxo até atualização.

Checkpoint remoto professor: b10182076100df51151097e8666bf62b75f4844f, PR18. Backend etapa1 privado: libfile_3dee01fca538819193ac3c8ea0269172 (versao-ao-vivo-backend-etapa1.zip); esse pacote substitui o anterior porque remove student_complete do roteador desta etapa. Projeto teste READY dpl_6EKmMS3rFrarzWKURjMb9N29TX7q; produção build-rate-limit. Sem ativação Supabase. Teste real depende de autorização específica para migração/roteador em banco compartilhado.

## Etapa 2 — Ao Vivo também para aluno, autorizado em 18h19
Usuário pediu prosseguir às partes independentes e testar tudo junto. Isso NÃO foi interpretado como autorização para aplicar migration/ativar backend compartilhado agora.
- [ ] Generalizar propriedade de redações avulsas por usuário, preservando isolamento do fluxo escolar.
- [ ] Entrega aluno sem edição de notas/revisão docente; compartilhamento com identificação de IA.
- [ ] Entrada no painel/menu do aluno e degustação única sem exigir confirmação de email/PIN.
- [ ] Testes cruzados e checkpoint privado/público.
Arquivos: teacher-live.e12.js, live-share.e12.js, core.e12.js, student-home-v2.e12.js, testes/docs; privado migration.sql, student-signup.sql, live.ts e testes. Database real: nenhum impacto; desenho preparado generaliza teacher_live_* para live_* e teacher_id para owner_id antes de qualquer ativação.

### Cadastro direto e compra de aluno — preparação
Auth settings conferido somente leitura: mailer_autoconfirm=true, disable_signup=false, Google/email habilitados. Não mudar Auth global. SQL de degustação/cadastro não exige confirmação; UI remove exigência.
Arquivos adicionais: cadastro-aluno.html, student-signup.e12.js, index.html, student-credits.e12.js e testes; privado student-sales.sql/credit-checkout-api.ts. Preço de aluno configurável e venda desativada por padrão até definição do usuário. Preservar regras de pacotes do professor, webhook e ledger existentes; nenhuma cobrança real.

### Resultado preparado de aluno e créditos
- [x] Ao Vivo aluno avulso/PIN com notas somente leitura, resultado IA explícito, compartilhamento sem revisão docente.
- [x] Dados avulsos genericamente live_* por owner_id; esquema antigo teacher_live_* nunca foi aplicado, não usar pacote etapa1 junto com novo.
- [x] Cadastro SQL/UI sem confirmação; Auth atual mailer_autoconfirm=true conferido em leitura.
- [x] Carteira/checkout aluno student_1 preparado; preço configurável, flag desativada, sem preço comercial definido.
- [x] Testes SQL/handlers/UI e npm run check/npm test PASS (44 assets HTTP).
- [ ] Homologação real conjunta, pagamento/webhook real, decisão de preço e ativação produtiva específica.
Pacote backend deve aplicar student-signup.sql antes de migration.sql e student-sales.sql. Preservar JWT do teacher-organization-api, compartilhar via RPC read_live_share token, bucket privado live-private. Checkout separado credit-checkout-api; webhook não alterado (funções atuais verificam valor/id/ledger e idempotência). Nenhum backend ativo ou compra real.

## Ajuste solicitado: aluno avulso em standby e preço — 01/10/2026
- [x] Suspender entrada e rota do cadastro independente, preservando rascunhos.
- [x] Restringir liberação atual aos alunos da base, autenticados pelo fluxo existente/PIN.
- [x] Fixar R$2,50 por correção e compra inicial de 4 créditos por R$10,00 no servidor/SQL/UI.
- [x] Testar limites de compra, identidade institucional, degustação única e regressões.
- [x] Preservar branch e pacote privado; não ativar backend/produção.
Arquivos públicos: index.html, .vercelignore, student-credits.e12.js, docs/checklist-implantacao-ao-vivo.md, CONTINUIDADE.md. Privados: prepared/index.ts, live.ts, credit-checkout-api.ts, student-sales.sql, novo student-trial.sql, README.md, testes de checkout/handler/trial/preço. Database real: nenhum impacto; SQL preparado altera constraints de pedidos e flag comercial, separa degustação de cadastro. Sem novas variáveis/domínios/Auth/webhook. Risco: regressão de elegibilidade/preço, mitigada por testes isolados. Rollback: branch anterior e flags desativadas; preservar ledger.

Validação desta entrega: npm run check e npm test PASS (43 assets HTTP), test-live-sql/test-live-handler/test-student-checkout/test-student-base PASS. Serviços simulados e SQL isolado; sem login/compra real. Backend privado preservado: versao-ao-vivo-base-preco-250.zip, libfile_03a6788de69c819191ff7a7f2b4543f1; substitui pacote anterior. Aplicar apenas student-trial.sql → migration.sql → student-sales.sql, nunca student-signup.sql nesta entrega. Frontend preservado na branch feat/ao-vivo-preview/PR18; nenhum deploy novo homologado.
