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

## Ativação controlada autorizada — 01/10/2026 18h43 BRT
Usuário: Faça isso + Autorizo após plano de ativação controlada do Supabase compartilhado. Escopo: schema/RPCs/bucket privado, teacher-organization-api e credit-checkout-api; flags inicialmente falsas, liberar para testes após validação. Não implica merge main/publicação frontend produtivo.
- [x] Conferir backend atual: funções teacher-organization-api v7 e credit-checkout-api v7; live_essays/claim_student_trial ausentes.
- [ ] Aplicar SQL na ordem student-trial → live → student-sales.
- [ ] Publicar funções preservando JWT e módulos legados; validar permissões e estrutura.
- [ ] Liberar testes controlados e conferir preview atual.
- [ ] Registrar resultado, limitações e rollback.
Arquivos locais: CONTINUIDADE.md, docs/checklist-implantacao-ao-vivo.md e registro privado de ativação. Impacto DB: live_essays/files/jobs/shares com RLS, RPCs service-only/token público, bucket live-private, trial único, constraints dos pedidos e três flags. Auth/domínios/variáveis/webhook sem alteração. Vercel somente preview. Risco: erro de runtime/integração; retorno por flags desligadas e fontes originais v7, preservando histórico/ledger. Sem teste pago automático.

### Resultado da ativação autorizada
Autorização explícita recebida às 18h43 BRT.
Aplicadas: live_student_base_trial, live_corrections_private_workspace, student_base_four_credits_ten_reais.
Funções: teacher-organization-api v8 e credit-checkout-api v8, ambas verify_jwt=true. Originais v7 conferidos byte a byte com arquivos original/ antes de publicar.
Flags teacher_live/student_live/student_credit_sales habilitadas. Preço 250 centavos/correção, student_4 com4 créditos/1000 centavos.
Verificação real: quatro tabelas RLS; anon sem SELECT e authenticated sem INSERT; bucket privado15MB; RPCs start/trial negadas a authenticated; read_live_share público com token inválido retorna null. Chamadas sem login aos dois endpoints HTTP401. Cadastro independente complete_student_signup ausente.
Nenhuma IA paga, compra, conta ou crédito criado durante a instalação. Jornada autenticada/pagamento real ainda pendentes.
Frontend atual no Git: cbc4db662e71f8a984a0cc73b3932e36f1b92383, PR18. Vercel consulta mostra apenas preview b101820 (professor); deploy_to_vercel retornou UNAVAILABLE. Não homologar a prévia antiga como versão conjunta. Produção frontend não publicada.
Rollback: desativar flags e, se necessário, restaurar funções originais v7. NÃO apagar tabelas ou ledger; preservar histórico/saldos.

## Atividades opcionais no Ao Vivo professor — 01/10/2026
- [x] Implementar atividade com nome opcional e tema imutável confirmado, exclusiva do professor.
- [x] Próxima redação reutiliza somente atividade/tema; limpa aluno, escola, texto, arquivo e IDs.
- [x] Histórico com acesso por atividade; nota ENEM/C1–C5 sem pontuação extra.
- [x] Testar isolamento, idempotência, snapshot e fluxo aluno preservado.
- [x] Preservar fontes públicas/privadas e atualizar checklist; migração adicional NÃO aplicada.
Arquivos: teacher-live.e12.js, core.e12.js, index.html, testes teacher-live/student-live e novo teacher-live-activities.cjs, package.json, docs/checklist-implantacao-ao-vivo.md, CONTINUIDADE.md; privados live-activities.sql, prepared/live.ts/index.ts, testes/README. Database produtivo nenhum impacto nesta preparação. Vercel bloqueou tentativa de preview d091c6a por api-deployments-free-per-day (>100), pede24h. Não repetir publicação agora. Backend base v8 ativo, atividades novas pendentes. Risco de herdar identificação/arquivo e misturar temas mitigado com reset/temas imutáveis/posse. Sem novas env/Auth/pagamentos/domínios. Rollback usa frontend/backend v8 sem apagar dados.

Validação: npm run check/npm test PASS (43 assets HTTP); testes privados live SQL/handler PASS com atividades: exclusivo professor, posse, nome opcional, idempotência, tema fixo e snapshot anterior preservado. Testes UI verificam reset de nome/escola/texto/arquivo/IDs, tema herdado, revisão antes de próxima redação, confirmação de crédito nova e histórico filtrado. Sem homologação visual real nem IA paga. Backend de atividades ainda NÃO aplicado. Fontes novas em branch feat/ao-vivo-preview, pacote privado versao-ao-vivo-atividades-preparado.zip; rollback específico v8 incluído.

## Atividades ativadas — 01/10/2026 21h50 BRT
Autorização específica do usuário após diagnóstico de frontend novo com backend v8.
- [x] Aplicada migration teacher_live_activities (live-activities.sql preparado e testado).
- [x] teacher-organization-api v9 ACTIVE, verify_jwt=true; index.ts/live.ts atualizados, demais módulos preservados da v8. Fontes publicadas conferidas byte a byte.
- [x] RLS ativa; anon sem SELECT, authenticated sem INSERT/EXECUTE; RPC attach somente service_role.
- [x] Testes SQL, handler e UI de atividades PASS antes da instalação.
- [ ] Homologação autenticada pelo professor após atualização; nenhuma IA paga ou crédito consumido nesta ativação.
Endereço fixo criado na Vercel: https://teste.versaoprofessor.com/ → projeto isolado/Preview/feat/ao-vivo-preview. Tela abre HTTPS; login não validado pelo agente.
Rollback: fontes rollback-v8 para função; preservar tabelas, atividades, redações e ledger. Frontend oficial não publicado.

## Recuperação de conteúdo e limite de inválidos — 01/10/2026
- [x] Trocar foto/arquivo/texto nas etapas tema/resumo e após falha; novo UUID/requests, mantendo nome/escola/atividade e histórico anterior. Tema inferido livre descartado.
- [x] Botão Verificar tema com inteligência.
- [x] Backend privado preparado: triagem curta gpt-4.1-mini, cache,3 inválidos/24h por perfil, exclusão mútua/pausa técnica; RLS/RPC service-only; validação antes do débito.
- [x] npm check/test,43 assets HTTP, SQL/handler e preflight isolados PASS.
- [ ] Ativar live-input-validation.sql e live-input.ts/live.ts no Supabase compartilhado após autorização específica; homologar fotos/texto reais. Nenhuma chamada paga.
Arquivos UI: teacher-live.e12.js/index.html/package.json/tests/live-replace-input.cjs/docs. Privados: live.ts/live-input.ts/SQL/testes/rollback-v9. Sem mudança Auth/preços/notas. Custo da triagem não é zero. Rollback preserva dados.

## Proteção de entrada ATIVADA — 01/10/2026 22h06 BRT
Usuário autorizou explicitamente a migração e publicação após plano.
- [x] live_input_validation_and_invalid_limit aplicada.
- [x] teacher-organization-api v10 ACTIVE, JWT preservado; live.ts atualizado/live-input.ts adicionado; outros módulos preservados v9. Conteúdo conferido byte a byte.
- [x] RLS ativa, anon sem SELECT, authenticated sem INSERT/claim, service_role com claim e sem execução do start antigo.
- [ ] Homologação com redação real: nenhum teste pago executado.
Modelo preflight gpt-4.1-mini, inválidos3/janela24h, cache por redação, pausa técnica1min. Pacote preparado contém fontes e rollback; agora aplicado.

## Correção da cota de temas — preparada
- [x] Confirmado bloqueio antigo em start_live_job_before_input_check.
- [x] live-theme-reuse.sql substitui limite global3/24h por cache de tema concluído por redação. Mantém wrapper de validação, saldo e ledger.
- [x] Teste SQL com5 redações diferentes, cache de mesma redação, propriedade e cobrança/refund PASS.
- [ ] Aplicar SQL no Supabase compartilhado após autorização específica. Rollback em rollback-theme-quota.sql. Sem mudança de frontend/função Edge.

## Cota de temas corrigida — ATIVADA 01/10/2026 22h16 BRT
Autorização: "Autorizo, para teste não precisa pedir". Preferência persistente: executar alterações restritas a teste sem reconfirmação; banco compartilhado é produção.
Migration live_theme_reuse_without_daily_account_quota aplicada. Removida cota antiga de3 temas/24h, cache por redação concluída. Verificação real de definição confirma remoção, reutilização e manutenção do wrapper e limite3 inválidos; service_role continua sem acesso direto à função interna. Nenhuma IA paga ou alteração de saldo.

## Loader do Ao Vivo — preview
- [x] Anel animado e mensagem ao iniciar verificação/correção, inclusive triagem.
- [x] Removido Atualizar andamento; polling automático resiliente a falhas de consulta sem novo start/cobrança.
Arquivos: teacher-live.e12.js/.css,index.html,tests/live-loader.cjs e continuidade. Database nenhum impacto. Rollback por frontend anterior. Testes de professor/aluno/atividades/troca de conteúdo e sintaxe PASS.

## Resultado revisado organizado — preview
- [x] Conferido registro da correção de futebol feminino:640 pontos, revisão22h25 BRT, um único débito de1 crédito. Repetir salvar atualizava a mesma revisão.
- [x] Estado salvo sem botão Salvar; edição explícita, salvar apenas com mudanças e confirmação nova. Compartilhar/próxima redação destacados; outras ações recolhidas. Competências recolhíveis após salvar.
Arquivos teacher-live.e12.js/.css,index.html,teste atividades. Database nenhum impacto. Testes professor/aluno/atividade e confirmação sem repetição PASS; publicação somente preview.

## Listas do Ao Vivo e gerenciamento — em execução
- [x] Padronizar histórico, atividades e versões: tabela responsiva/cartões, hierarquia e ações separadas.
- [x] Preparar edição de identificação/nome e exclusão lógica com confirmação inline.
- [ ] Validar posse, processamento, links e ledger em testes isolados; publicar CSS no preview.
- [ ] Backend compartilhado: ativação pendente de autorização específica após preparação.
Arquivos públicos: teacher-live.e12.js/.css,index.html,tests/live-management.cjs,package.json,CONTINUIDADE.md. Privados: prepared/live.ts/index.ts, migration de gerenciamento, testes e rollback-v10. Database real: nenhum impacto na preparação. Migração proposta adiciona deleted_at a live_essays/live_activities e RPC service-only; exclusão de redação revoga links e preserva jobs/ledger/arquivos; atividade removida preserva redações. Tema corrigido permanece imutável. Sem alterações Auth/env/domínios/preços. Risco: ocultação indevida ou concorrência; mitigação por posse e bloqueios. Rollback: fontes v10 e frontend anterior, preservar dados.

Validação: testes UI professor/aluno/atividade/loader/troca/gerenciamento PASS; check e43 assets HTTP PASS. Chromium local com dados simulados em320/390/768/1200px sem overflow ou pageerror; capturas inspecionadas. SQL isolado PASS para posse, grants, nomes, imutabilidade, bloqueio durante análise, exclusão idempotente, links revogados e ledger preservado. Fontes rollback-v10 conferidas com função ativa. Capability management mantém botões ocultos até ativação autorizada; backend ainda não publicado. Deploy somente preview teste.versaoprofessor.com. Sem homologação autenticada/IA paga.

## Menu do Ao Vivo igual a Propostas — 01/10/2026
- [x] Reutilizar cores, bordas e destaque vermelho das abas aprovadas.
- [x] Validar opção ativa em nova redação, histórico e atividades; encaminhar publicação somente preview.
Arquivos: teacher-live.e12.js/.css,index.html,tests/live-management.cjs,CONTINUIDADE.md. Database nenhum impacto. Sem alterações de backend/Auth/env/domínios. Risco visual mobile, validar largura320–1200px. Rollback frontend258a5ff. Edição/exclusão continuam aguardando autorização do backend.

Testes de menu/gerenciamento e atividades PASS;43 assets/sintaxe PASS;Chromium via HTTP320/390/768/1200px sem overflow/pageerror e imagem mobile inspecionada. Destino https://teste.versaoprofessor.com/.

Publicação do menu bloqueada pela Vercel: status do commit96c894d20cfec1c6a86eb22ccb908921d6c007c6 em versao-teste-etapa12-consolidada=failure/build-rate-limit. Não repetir deploy automaticamente. Frontend local385d0a9 e remoto96c894d preservados; teste continua em258a5ff (listas novas, menu anterior). Nenhuma alteração no backend. Aguardar liberação ou solicitação de nova tentativa; sem monitoramento.

## Ramificação e padrão visual permanente — 01/10/2026
- [x] Ao Vivo lateral: Nova redação, Atividades (professor), Histórico.
- [x] Nomes internos curtos e rotas diretas para os filhos.
- [x] Registrar Propostas como referência permanente no código/documentação e verificar navegação.
Arquivos core.e12.js,teacher-live.e12.js/.css,index.html,AGENTS.md,docs/padrao-interface.md,CONTINUIDADE.md. Database nenhum impacto; sem Auth/env/domínios. Risco: rota interna/seleção incorreta; teste de navegação e listas. Rollback commit96c894d. Publicação produtiva combinada para amanhã, não executar agora. Backend editar/excluir permanece preparado.

Validação: check, navegação/rotas diretas professor e aluno, listas e atividades PASS. Propostas registrada em docs/padrao-interface.md e AGENTS regra15. Nova ramificação preparada para amanhã02/10/2026, sem publicação produtiva ou nova migração. Arquivos de teste atualizados: tests/navigation-modules.cjs e tests/live-management.cjs.

## Publicação autorizada — 02/10/2026 06h33 BRT
Usuário: Bora subir, após preparação e plano anteriores. Ativada migration live_item_management e teacher-organization-api v11 ACTIVE/JWTtrue. Fontes conferidas byte a byte; anon/authenticated sem execute manage_live_item, service_role permitido, RLS ativa. Nenhum dado de usuário excluído/alterado na instalação, nenhum crédito consumido.
PR18 mesclada em main: e2d8a09b2660a8760fc7346192cdca077f73c086. Deploy produção dpl_8uZxXnESoMiYsLEnrkw1kPHD1Kbu READY, URL versao-producao-garps94fi-professormavi-6775.vercel.app. Vercel sinaliza alias_in_use para versaoprofessor.com; UI de Domains confirma app.versaoprofessor.com Production/Valid Configuration. Navegador no domínio oficial mostrou scripts core.e12.js e teacher-live.e12.js com20261001-navtree1, confirmando frontend novo servido. Login com Google aparece. Não houve login autenticado pelo agente; CAPTCHA no navegador remoto não homologado (logs Cloudflare).
Validação pré-publicação: npm check/npm test completos PASS, SQL gestão e handlers PASS. Aluno independente segue suspenso. Rollback frontend anterior dpl_jK7NPoc43yrYQib2mZLohAnfzMaG; manter backend novo para preservar ocultação dos registros. Pacote privado versao-gerenciamento-ao-vivo-preparado.zip agora ATIVADO. Publicação oficial https://app.versaoprofessor.com/.

## Devolutiva Ao Vivo sem JSON — 02/10/2026
- [x] Substituir JSON bruto por desvios, C5 e repertórios legíveis em professor/aluno.
- [ ] Verificar escape de conteúdo, ausência de dados e regressões; preparar preview.
Arquivos teacher-live.e12.js/.css,index.html,tests/live-evidence.cjs,package.json,CONTINUIDADE.md. Database nenhum impacto. Não recalcular análise nem cobrar crédito. Risco visual, teste de renderização. Rollback frontend anterior. Produção requer publicação específica após validação.

Validação local: live-evidence, teacher-live, student-live, HTTP smoke e check43 assets PASS. Sem nova análise ou débito. Preview pendente; produção ainda não alterada por esta correção.

Correção preservada em commit local2cd29f4/remotoe4a1beff04377a5c1146380aab3803a690da3b1e, PR19. Preview READY dpl_DgJ52ZYQhxdxtbYBeWoNDFDoDF5Z: https://versao-teste-etapa12-consolidada-fawrhscdp-professormavi-6775.vercel.app/. Sem homologação autenticada no preview. Produção aguarda autorização específica; testes locais e HTTP PASS. Nenhuma chamada de IA ou alteração de crédito.

## Publicação das evidências — 02/10/2026
Usuário autorizou: Publique. PR19 mesclada, main c49ea23e6835db4224bf3a860e603aa9d28ad725. Vercel dpl_9kfCniBaok7bvgqXS6tZSaiSdFyb production READY. Domínio https://app.versaoprofessor.com/ retornou HTTP200 e assets20261002-evidence1; JS servido contém liveEvidenceHtml/Trecho original. Sem validação autenticada ou nova chamada de IA. Nenhuma mudança de banco/créditos. Alias www.versaoprofessor.com segue conflito preexistente; domínio app confirmado com versão nova. Rollback dpl_8uZxXnESoMiYsLEnrkw1kPHD1Kbu.

## Reparo autorizado dos 29 nomes — 02/10/2026
Usuário solicitou explicitamente: Corrija os nomes, após identificação da pendência. Conferência real confirmou 30 alunos no lote, 29 nomes com sufixo ponto e vírgula + matrícula de oito dígitos; registration nulo. Aplicado UPDATE transacional restrito à organização e criador do lote, com bloqueio das linhas e assertion de exatamente 29 alterações. Separados full_name e registration; atualizado updated_at. IDs e demais colunas preservados, sem triggers na tabela, sem alteração de vínculos/redações/créditos. Verificação após COMMIT: 30 alunos, zero nomes com ponto e vírgula, 29 matrículas separadas. O nome já correto não foi alterado; sua matrícula ausente não foi inferida. Sem deploy, migration, Auth ou Edge Function. Reversão possível pela concatenação exata nome + ';' + matrícula nos mesmos 29 registros, com guarda de valores e autorização se necessária. Recuperação do ZIP histórico indisponível por erro de rede do helper; reparo baseado na leitura direta dos registros atuais. Não afirmar execução do arquivo histórico.

## Desativação do lote fictício — 02/10/2026
- [x] Usuário confirmou Remover após proposta de desativação reversível da escola teste, turma 1a e 30 alunos fictícios.
- [x] Revalidar posse, quantidade e ausência de redações/projetos/propostas/acessos PIN; transação abortaria se divergentes.
- [x] Desativados organizations d7a82b92-619d-45a5-baae-681f13998fcd, classes 4fa7d07c-02fd-4443-99cb-2fcc116b9d74, 30 students e 30 enrollments desse lote. Escola registra deactivated_at/deactivated_by. Nenhum DELETE.
- [x] Verificação após COMMIT: escola e turma inativas, 30 alunos e 30 vínculos inativos. Turma desativada antes dos vínculos para trigger de onboarding retornar sem movimentar créditos. Sem alteração de Auth, funções, RLS, schema, arquivos enviados ou deploy. Ao Vivo fora do escopo.
Rollback: reativar somente esses registros, limpar marcações de desativação da escola; reativar vínculos enquanto turma ainda inativa, para evitar efeito do trigger de bônus, e turma por último. Requer solicitação do usuário. Verificação no banco; interface autenticada não testada. URL https://app.versaoprofessor.com/.

## Superadmin: contas, custos, acessos e pagamentos — 02/10/2026
- [x] Usuário autorizou remover quatro contas de teste; perfis exatos por e-mail foram ocultados e recusados, sem apagar ledger, carteiras, alunos ou cobranças. Irani teve o nome corrigido. Ocultas deixam de compor contagens e alertas de saldo; gastos continuam no financeiro.
- [x] Relatório inclui propostas, correções (inclusive jobs sem usage), Ao Vivo (triagem/tema/correção), importação, falhas e quantidades. Custo conhecido e lacunas separados; médias indisponíveis se custo incompleto. Estimativa por tokens usa tarifas configuradas para modelo correspondente e tarifas documentadas para gpt-4.1-mini/gpt-5.5. Propostas antigas sem cache/tools detalhados são parciais. Triagens históricas sem modelo não recebem preço inventado.
- [x] PTAX venda automática BCB, data/fonte exibidas; consulta real retornou5.22380 em02/10/2026 13:03. Sem fallback fictício; ausência do BCB mantém USD disponível. Conversão gerencial atual, sem impostos/spread.
- [x] Migração platform_authenticated_session_counts aplicada; nova tabela RLS sem acesso anon/authenticated. Trigger auth.sessions INSERT registra novas sessões, não renovações; erro no registro não bloqueia login. Contagem inicia02/10/2026 14:12 BRT; sem reconstrução histórica. Teste SQL isolado passou; grants/RLS/trigger verificados no banco.
- [x] admin-base-api v12 ACTIVE/JWT true: relatório de custos e sessões; listagem com último login real. Originais v11 e fontes novas em pacote privado, fora do repositório público.
- [x] Pagamentos aprovados discriminados por comprador, e-mail, pacote, valor, data, origem professor/aluno e transação Mercado Pago. Meio PIX/cartão e campanha não existem no histórico e não são inferidos.
- [x] Nomes em caixa uniforme formatados no superadmin, preservando nomes mistos; datas de login com hora/minuto Brasília. Quantidades de acesso por conta na visão geral.
- [x] npm test completo PASS (HTTP com permissão de rede local), npm check PASS; testes backend de custos/falhas/ocultos/câmbio e SQL de sessões PASS. Sem chamadas pagas ou pagamento real. Interface autenticada ainda não homologada.
- [ ] Publicar interface e conferir assets. Arquivos: ranking-management.e12.js, enhancements.e12.css, index.html, package.json, tests/admin-costs.cjs, CONTINUIDADE.md. Privados: index.ts/platform-report.ts, access-events.sql, testes e originais. Sem alteração de cobrança, modelos de correção ou preços comerciais.
Rollback: frontend anterior e admin-base-api v11; manter registros financeiros e de acesso. Desativar trigger de sessões se necessário, sem apagar eventos; reativação de contas somente por solicitação. Limitação: custos históricos sem telemetria completa não equivalem à fatura OpenAI.

Prévia funcional READY: dpl_FkC5uT92ckpLvHaz5KeUSEc9Gi9S, commit remoto2cda6e613151ff375a271a5aab9e71fd0b15bc95, árvore01a03baa648f27a3c7eb80afb811f70f0979bb57 idêntica à local. URL https://versao-teste-etapa12-consolidada-7sqzql5z1-professormavi-6775.vercel.app/. Backend v12 conferido byte a byte; pacote privado preservado como versao-superadmin-backend.zip (libfile_0198ca110ac88191b509ea6ca1532227). Frontend produtivo ainda não promovido. Usuário pediu também imagem de uma inicial mais funcional: proposta visual gerada com dados ilustrativos, não aplicada ao código. Próximo passo: autorização específica de publicação frontend conforme AGENTS12–14; não confundir mockup com interface implementada.

### Complementos solicitados durante revisão visual
Usuário pediu saldo do billing em Pendências (não aprovações), tabela de falhas por tipo/local, receita30dias e total. Sem integração confiável para saldo disponível: exibir indisponível e link oficial, não estimar saldo por consumo. Tabela agrupa serviço/etapa/tipo/quantidade/custo, causa somente conforme evidência. Backend v13 ativo com grupos de falhas. Receita acumulada preparada por pagamentos BRL aprovados, independente do filtro do período; testes com pagamento antigo, recente e pendente passaram. Ajustes de layout final ainda são mockup, não interface homologada. Arquivos adicionais: mesmos módulos e testes de custos; sem nova migração além da contagem de sessões. Publicação frontend de produção continua pendente.

### 02/10 — Dashboard aprovado e filtro de acessos
Autorização explícita do usuário após mockup: “excelente, pode atualizar o superadmin”; complemento: filtro Alunos/Professores. Dashboard implementado com cinco indicadores, pendências, falhas, pagamentos e acessos. Filtro Todos/Alunos/Professores em resumo e relatório, recalcula quantidade no período. Backend admin-base-api v15 ACTIVE/JWT acrescenta role nos acessos e total de contas aprovadas; sem nova migration, alteração de autenticação, domínio ou variável. Testes completos npm test, npm run check e teste privado backend PASS. Login real de superadmin não testado; HTTP e testes simulados não equivalem a login real. Saldo OpenAI não conectado; acessos somente desde início do rastreamento. Publicar branch de preview e, após READY, main no projeto versao-producao, conforme autorização atual. Rollback frontend c49ea23 e backend originais privados preservados.

Publicação concluída: commit remoto cdcad9f99ee80ea7f7858b3a4fe4e326eff5b2f7, árvore 654889dbd8f2fe2f426b6672b191e6b50962feb1 idêntica ao código local 8a8cd09. Preview READY dpl_672wukti1i47R8D7o5M9CBb41igN; produção READY dpl_CaCwfsN8dYTQUJMMvuDUZcYovLC5. https://app.versaoprofessor.com/ conferido: index, core, ranking-management e enhancements HTTP200 com SHA256 idêntico ao local. Conflito antigo dos aliases raiz/www continua informado pela Vercel; app oficial está atualizado. Backend privado v15 e originais preservados no pacote versão2. Validação visual automática não executada: agent-browser ausente e Playwright sem binário de Chromium; teste de DOM/HTTP passou, não reivindicar login autenticado ou inspeção visual real.

### 02/10 — Medição integral de tentativas (em execução)
Usuário autorizou implementar medição incluindo falhas, corrigir BRL e remover cartão receita30dias. Plano: [ ] ledger privado por chamada iniciado antes de IA; [ ] tokens/cache/ferramentas/status/erro e tarifa congelada; [ ] câmbio PTAX persistido com fallback datado; [ ] integrar quatro fluxos e relatório sem duplicação; [ ] testes simulados sucesso/falhas/polling/permissões; [ ] publicar e verificar. Arquivos frontend ranking-management, enhancements, index, tests/admin-costs e continuidade; privados módulos de teacher-organization, proposal-beta, ai-correction-beta, admin-base, novo ai-metering/cost-fx, migration e testes. Sem IA paga nos testes. Rollback fontes originais preservadas; ledger não apagar.
Ajuste do usuário: tabela de custos por tipo na inicial; falhas somente no menu. Causa BRL confirmada: BCB rejeita $orderby=dataHoraCotacao+desc; encode %20 resolve. PTAX venda5,2238, 02/10/2026 13:03:16, confirmada por consulta oficial e salva. Migration ai_attempt_metering_and_ptax_cache aplicada: ledger + cache com RLS e sem grants a clientes. Scheduler existente passa a consultar tentativas pendentes, GET sem geração paga. Backend ativo admin16, teacher-organization12, proposal21, ai-correction27, worker10; trabalhador mantém autenticação por segredo verificado via RPC. Testes completos frontend, TS27 arquivos, ledger (timeout/falha com tokens/sem dados/fail-closed/poll idempotente/cotação fallback), relatório e permissões PASS. Aviso INFO RLS sem policy é intencional: tabelas só service_role. Pacote privado contém originais para rollback. UI aguardando publicação.
Também instrumentada a manutenção autenticada maintenance-c2c3-rerun, que pode fazer chamada paga quando expressamente acionada. Sem executar manutenção nesta entrega. A aferição inclui essa despesa em Correções, etapa Recalibração, sem duplicar a operação concluída. Falhas da validação da manutenção registradas no ledger. APIs legadas fora do frontend ativo não foram reativadas nem alteradas.

Medição publicada: versões finais admin17, teacher-organization13, proposal22, ai-correction28, worker11, maintenance-c2c3-rerun6; fontes conferidas byte a byte. Commit remoto f5c7a206e265501f26ca420dd86406fe640e897b; árvore e68bb10618cfcc23c69b557a9bc382d2c2b00d1e idêntica ao código local. Preview READY dpl_B6vSTaeTrxDB8opmKKzLk43wKeJM. Main avançada com autorização da tarefa. App oficial index/JS/CSS HTTP200 SHA256 idênticos. Pacote privado salvo versão3 com migration, módulos e testes. Ainda nenhum evento real novo na aferição ao verificar; sem chamada paga executada, embora usuário tenha autorizado se necessária às15h08. Testes simulados não são validação de chamada paga real ou login autenticado. Usos antigos com lacunas permanecem parciais; novas falhas sem uso retornado permanecem desconhecidas. Tela inicial: custo/tentativas/conclusões/média em BRL; retirada receita30dias e falhas; detalhamento de falhas mantido no menu.

### 02/10 — Propostas2créditos e apresentação do Ao Vivo ao aluno (em execução)
Usuário solicitou propostas2créditos e apresentação mais vendedora na inicial/créditos do aluno, retirando mensagem de crédito recebido. Plano: [ ] nova reserva2, legado1 preservado; [ ] endpoint exige confirmação2 para impedir cobrança divergente em tela antiga; [ ] textos de professores consistentes; [ ] hero e pacotes com benefícios do Ao Vivo; [ ] testes SQL débito/estorno/repetição; [ ] publicar e conferir. Backend privado proposal-price-private com originais, migration e API. Sem mudança do preço Ao Vivo, saldos existentes ou benefício de acesso; sem IA paga para testar cobrança.
Validação: SQL local PASS débito2/sucesso/estorno2/retry sem duplicação/legado1/saldo insuficiente; API simulada PASS confirmação antiga bloqueia antes da reserva e informa custo2. npm test completo e check PASS; testes da oferta aluno validam preço derivado dos pacotes, ações e remoção da degustação. API proposal-beta-api v23 ACTIVE/JWT e migration proposal_generation_two_credits aplicadas. Constraint units admite1e2; default2; finish continua devolvendo units da reserva. Ao Vivo segue1. Rollback privado reserva antiga+default1, preservando unidades2 já reservadas. Não foram feitas compras ou gerações pagas. Conteúdo comercial em inicial/créditos do aluno, mantendo informação de estimativa por IA. Sem promessa de nota ou tempo. Frontend em publicação.
Publicação conferida: commit remoto f6110f176542177c24986e3b9dbfb5dbb2069f35, árvore9fdc6e09d5263b15b35b26ecd87acd3bd57ed1a2 igual à local bbdd42f. Preview dpl_6zRgq8MEi5Dw4RMJqdRHRffWy9Z4; produção dpl_D3mMeGa6XFA6FEQVgVgjRyzwvGqN. Domínio app: sete assets alterados HTTP200 e SHA256 idênticos (index, student-home, student-credits, teacher-proposals, teacher-live CSS, teacher-home, teacher-credits). API23 fonte conferida byte a byte; banco confirma débito2/default2/check1ou2. Pacote privado preservado versão4. Sem teste de compra real, IA paga ou login real; testes DOM/HTTP/SQL/API simulada passaram. Conteúdo de cadastro-aluno fora da inicial/créditos não foi alterado nesta entrega.

### 02/10 — Ao Vivo professor e loader3etapas
Pedido: aproximar apresentação professor/aluno e reaproveitar loader da correção antiga com tempo decorrido. Plano: [x] card inicial orientado a benefícios; [x] nota e competências legíveis com revisão do professor preservada; [x] loader Recebida/Analisando/Devolutiva pronta; [x] contador1s com origem preservada entre polls e recuperação da data do job; [x] encerrar contador ao trocar tela/concluir; [ ] validar/publicar. Arquivos teacher-live JS/CSS, index, tests/live-loader, continuidade. Database: nenhum impacto; sem alteração de endpoints, créditos, modelos, Vercel config, autenticação ou domínio. Estados do loader derivados do servidor, não de tempo estimado; após4min aviso de demora. Rollback frontend f6110f176542177c24986e3b9dbfb5dbb2069f35. Testes pontuais loader (não resetar tempo, um timer, falha de rede, conclusão), aluno, professor e gestão PASS.
Validação completa npm test, npm run check e git diff --check PASS. Sem chamadas pagas. Teste de DOM cobre retorno de rede, avanço de estados, contador persistente e encerramento na conclusão; não equivale a login real ou teste visual em aparelho físico. Preparar branch e publicar no app oficial conforme solicitação atual de aplicar os dois ajustes.
Commit remoto649d31b820a9f54887c75aec9b15ac0a7193c5b3; árvore0911333cc0bcbf0bdd9af2758ee30b0c67c58425 igual ao commit local7d099c9. Preview READY dpl_13mnJ6pPiBwgCC19nvpVDSvaBvKE, index confirmado com versão20261002-live-progress1. Main atualizada para este commit. Testes completos PASS; nenhuma mudança de backend. Produção em conferência final.
Conferência final: produção dpl_HgsVY9rs2h7Qn2QEPFDg6BL3WMAR; app oficial entrega index, teacher-live JS e CSS HTTP200/SHA256 idênticos ao pacote. Link https://app.versaoprofessor.com/. Loader compartilhado professor/aluno; revisão docente preservada. Sem declarar encerramento global da fase ou login real homologado.

### 02/10 — Menu aprovado e revisão de desvios Ao Vivo
Plano: [ ] Escola/Conta expansíveis, ícones e Créditos e consumo destacado, logo original preservada; [ ] editar regra/sugestão e ignorar/restaurar desvios com índices originais e auditoria; [ ] testar reabertura/cancelamento/falha e navegação; [ ] preview. Arquivos core.e12.js, teacher-live.e12.js/.css, index.html, tests/live-deviation-review.cjs, tests/navigation-modules.cjs, package.json, CONTINUIDADE.md. Database: nenhum impacto estrutural; live_review existente já aceita deviation_reviews/review_note (API13 conferida). Sem migração, configuração, autenticação, domínio, integração ou cobrança nova. Risco: restabelecer descartes ao reabrir; teste de persistência por índice original. Rollback frontend649d31b. Preparar preview antes de publicação.
Validação: npm test completo, npm run check e git diff --check PASS. API13 vigente aceita e persiste decisões por índice original em review_audit; nenhuma mudança backend. Testes DOM simulam editar/ignorar/restaurar, reabrir sem perder descarte, cancelar, falha de rede, regra obrigatória, escape HTML e nenhuma geração paga. Logo original preservada, rotas escolares e Receber redações mantidas. Sem login real ou homologação visual em aparelho físico. Preview em preparação; produção não alterada nesta tarefa.
Preview publicado: remoto2b28d2a0e199ea83da36174836ea26eb9218e0f1, árvore d9d6eb7b4a27205c9ccb2293a76c73a3b5e9f02a idêntica à local86f52a6. Deployment dpl_ASmjpsg7kZuX2eVbw9xbtiTo4APR. https://versao-teste-etapa12-consolidada-rldy4pxop-professormavi-6775.vercel.app/ HTTP200, index com assets20261002-nav-review1. Produção não publicada; solicitar autorização após esta validação conforme AGENTS12–14. Sem alterações de backend ou chamadas pagas.

### 02/10 — Correção do destino de testes
Usuário corrigiu o destino: teste.versaoprofessor.com, não URL temporária Vercel (CAPTCHA impede login). Plano: [x] registrar regra no AGENTS; [ ] atualizar feat/ao-vivo-preview com menu/revisão já testados; [ ] verificar domínio fixo e assets. Domínio fixo identificado em dpl_HY2Xx3H7P35sNtEhMbwDwxRutqjL, commit258a5ff, branch feat/ao-vivo-preview. Database nenhum impacto, sem Auth/CAPTCHA/env/DNS ou produção alterados. Rollback: branch descendente restaurando árvore anterior.
Concluído: branch oficial de teste feat/ao-vivo-preview atualizada para4ddb883f3060a9d84af588ede3182548fab36962. Deployment dpl_CCPqABetwPpEbUGA4hiYm93qqgn9 READY; Vercel confirma alias teste.versaoprofessor.com nesse deployment; HTTP200 no domínio fixo com assets20261002-nav-review1. Regra permanente AGENTS16 versionada remotamente. Login real não executado. Produção main não alterada.

### 02/10 — Propostas inéditas em relação ao Enem (preparado)
Usuário solicitou excluir qualquer proposta já publicada/usada pelo Enem, antiga ou recente. Plano: [x] conferir API23; [x] orientação em ambas etapas de geração; [x] gate independente com pesquisa oficial e comparação semântica; [x] bloquear conflito/incerteza/falta de fontes; [x] teste de estorno2 e custos; [ ] ativação do backend compartilhado após autorização. Privados proposal-originality-private/prepared/index.ts e novo proposal-originality.ts; demais módulos atuais preservados, rollback completo v23. Database nenhum impacto estrutural, usa reserva/estorno/ledger existentes. Verificação adicional instrumentada etapa originality, sem regeneração automática. Testes simulados PASS, nenhuma IA paga. Limitação explícita: verificador por modelo/pesquisa reduz risco, não oferece garantia absoluta; sem catálogo oficial exaustivo versionado. Resultados/replays anteriores não alterados. Não publicado nem em teste nem produção porque Edge Function é compartilhada. Pacote privado será preservado.
Pacote preparado preservado: versao-propostas-originalidade-preparado.zip, libfile_9cf6548612ac81919a373621ca825ee4. Não ativado; aguardando autorização de publicação no backend compartilhado conforme AGENTS12–14. Testes do contrato e fluxo de estorno passaram; nenhum teste pago real.

### Ativação autorizada — 02/10 19h39 BRT
Usuário: Pode ativar. API23 conferida contra originais, sem divergência. Testes originality e API/estorno novamente PASS. Publicada proposal-beta-api v24 ACTIVE, verify_jwt=true;4 módulos obtidos após deploy e conferidos com os preparados. Proteção vigente para novas gerações em teste e produção (backend compartilhado). Nenhuma migration, dado preexistente, frontend, preço ou domínio alterado. Sem chamada paga real; verificação de publicação e testes simulados, não homologação end-to-end de geração real. Rollback v23 preservado no pacote libfile_9cf6548612ac81919a373621ca825ee4. O pacote com sufixo preparado é o artefato de implantação agora ativado. Menu/desvios permanecem somente no domínio de teste, não promovidos por esta autorização.

### 02/10 20h13 — Menu aprovado nos dois perfis e diagnóstico das propostas
Usuário autorizou aplicar menu em professores e alunos. Plano: [x] manter menu professor aprovado; [x] aluno mesmos ícones/grupos, somente rotas próprias, Conta/Minha conta e Créditos e consumo destacado; [ ] testes; [ ] teste oficial; [ ] produção somente menu (não promover edição de desvios). Arquivos core, teacher-live CSS, index, tests/navigation-modules e continuidade; database nenhum impacto. Sem backend/Auth/env/domínios. Rollback árvore main649d31b.
Propostas: duas tentativas Saúde 23:07:29 e23:09:04 UTC falharam exclusivamente em originality após35s. research/format concluídos. Ambas reservas refunded units2 (total4 devolvidos). Custos conhecidos R$3,5236672758, verificação interrompida unknown. Usuário rejeitou mudança e pediu rever processo. Não republicar sem revisão; projeto recomendado: catálogo oficial versionado atualizado fora da geração, bloqueio determinístico e comparação semântica curta, evitando web search histórica a cada proposta. API24 permanece ativa até decisão de substituição/rollback; não afirmar que foi desativada. Necessário teste real de latência antes de nova ativação.

## 06/10 — Auditoria ENEM em branch, sem publicação
Plano rastreável: [x] validar/remover evidência incerta e duplicada; [x] exigir decisões e reavaliação fundamentada; [x] integrar correção normal/Ao Vivo; [x] testar cinco regressões, faixas e repetição/interrupção; [x] registrar implantação/rollback.
Base limpa 9e328e6; funções lidas: ai-correction-beta-api v28 e teacher-organization-api v14. Originais e preparados em backend/enem, excluídos do upload estático. Database: nenhum impacto aplicado; sem migration, alteração histórica, IA paga ou deploy. Relatório Library resolvido, mas materialização falhou no download; implementação parte do resumo autorizado.

Validação: npm test completo PASS (inclui HTTP dos 44 assets e quatro suítes novas); npm run check PASS; TypeScript 5.9.3 --noEmit dos dois módulos de qualidade PASS; sintaxe dos 19 módulos preparados PASS; git diff --check PASS. Casos sintéticos cobrem as cinco regressões, incerteza/deduplicação/faixas/soma, revisão/publicação, falha/repetição e paridade normal/Ao Vivo. Sem scripts próprios de lint/build; sem typecheck integral Deno ou login/IA real. Log local /tmp/enem-validation.log. Documento docs/auditoria-enem.md contém plano de implantação/rollback e limitações, incluindo download Library indisponível e encaminhamento docente de redações do aluno.
Contrato de banco preservado: quality_version enem-evidence-2026-09-20; nova política enem-review-2026-10-06 em campos JSON existentes. ACLs lidas: anon/authenticated sem EXECUTE nas quatro RPCs relevantes. Telemetria futura inclui tipos de inputs, hashes de instruções/schema e versões, sem conteúdo/URLs. Pacotes originais v28/v14 e hashes preservados em backend/enem; nenhum dado histórico alterado. Sem push/PR/deploy para evitar publicação automática antes da confirmação do projeto isolado. Sem link remoto de teste nesta entrega.

Commit de implementação e testes: `50afb01` na branch local `fix/enem-evidence-review`. Produção permanece intocada; publicação pendente de decisão após revisão.


## 06/10 — Segunda revisão e confirmação da homologação (sem escrita remota)
Plano: [x] ler vínculo Vercel do domínio fixo; [x] conferir backend pelo commit publicado; [x] verificar projetos/branches Supabase; [x] segunda revisão do diff e preservação histórica; [x] corrigir editor legado localmente e testar; [x] registrar autorizações faltantes em docs/auditoria-enem.md.
Vercel teste confirmado: prj_7mEBS5QDaBWrG4hjnBKelNkU90OY, dpl_6GNTiy533KRMvjNmw8BpKcCgTmU7 READY, feat/ao-vivo-preview@8681844. Produção atual: prj_5OC7zfjEgapvbrapPjas2lLvvut7, dpl_E5aE4EbNhqLfougynxcwA4D6oiA5 READY, main@9e328e6. As árvores Git são iguais e apontam ao mesmo Supabase huccxcpwoydwuisrmboc. Não há branch Supabase nem projeto de homologação Versão identificado. HTTP de assets bloqueado pelo proxy403, sem contorno; metadados/commits são a evidência disponível.
Encontrado e corrigido localmente: ao reabrir auditoria legada, textos e descartes eram removidos do editor junto com confirmações implícitas. Agora preserva textos/razões/descartes; confirmações antigas seguem pendentes. Testes de histórico confirmam nota920 intacta e zero RPCs de escrita após bloqueios; relatório oficial880 prevalece sobre preliminar840. Suite29 scripts (25 existentes+4 ENEM), check e typecheck dos núcleos PASS. Database: nenhum impacto aplicado. Nenhum push/deploy/IA paga. Próximo passo recomendado: autorizar backend separado com schema sem dados e frontend Preview apontado exclusivamente a ele; depois autorizar até5 jobs sintéticos com teto monetário explícito e gravações somente isoladas. Detalhes e limitações no documento.

Commit da segunda revisão e correção histórica: `aedbae9`, branch local `fix/enem-evidence-review`. Sem deployment novo; os deployments listados são apenas os consultados.

## 06/10 — Publicação ENEM autorizada por Marcus
Autorização recebida após apresentação do plano: “Faça a implementação em produção com segurança. Depois disso, refaça as últimas correções das alunas com esse novo script na produção”. Abrange código em produção; não credenciais/Auth, nem gasto de reprocessamento sem teto confirmado.
Plano: [ ] conferir base remota e funções; [ ] bloquear clientes antigos na revisão; [ ] testar commit exato e preservar rollback; [ ] implantar funções JWT normal/Ao Vivo; [ ] publicar frontend no projeto real de produção; [ ] verificar versões/fontes/artefatos sem IA paga; [ ] identificar submissões somente com IDs exatos do auditor e informar custo antes de executar.
Estado conferido: main9e328e6 e funções v28/v14 byte a byte iguais aos originais. Sem concorrência detectada. Database: sem migração ou alteração histórica; mudanças somente nos pacotes de funções e frontend. Ordem backend→frontend, clientes antigos devem atualizar. Rollback frontend9e328e6/dpl_E5aE4EbNhqLfougynxcwA4D6oiA5 e pacotes originais v28/v14 preservados. Reprocessamento posterior exige novas versões, sem publicar notas/enviar devolutivas.
Checkpoint: APIs normal29/Ao Vivo15 ACTIVE/JWT e19 arquivos conferidos byte a byte. Main d5f7f40 publicado; deployment dpl_7wUnejiAtYETM2Cmj18YNKpAsp5a READY e app resolve para ele. Vercel retornou alias_in_use para versaoprofessor.com herdado de vercel.json. Plano complementar: [ ] remover somente alias explícito da landing, preservando domínios já cadastrados (app e suaversao); [ ] revalidar e redeploy. Sem DNS/Auth/credenciais. OPTIONS das funções bloqueado pelo proxy403; sem contorno e sem chamadas pagas.

Resultado da publicação autorizada: main304437741179c51dc8945a4b01a4aa184c60bdf2; deployment dpl_7ttXvat8wfN4kyRm8Chejo4VY22L READY/production, app.versaoprofessor.com confirmado pela Vercel, aliasError null. API normal29 e Ao Vivo15 ACTIVE/JWT;19 arquivos ativos iguais aos preparados. Suite29 scripts/check PASS no commit final; typecheck núcleos/sintaxe19/manifesto PASS. Sem escrita de notas, migração, Auth/credenciais ou IA paga. OPTIONS remoto bloqueado proxy403, sem contorno; frontend confirmado por metadata/commit/aliases, não HTTP direto. Rollback originals28/14 e deployment anterior preservados. Alias explícito da landing removido de vercel.json para resolver conflito, sem mudança de DNS/domínios cadastrados.
Alvos de reprocessamento reconferidos por IDs exatos recebidos do auditor;1 crédito cada,2 no total. Fluxo correto force/previous_job_id cria novos jobs e preserva nota aprovada. Aguardando teto de gasto e confirmação do pai antes de qualquer chamada; não usar repair nem outra conta. Dados das alunas não foram copiados para fixtures ou documentos versionados. Documento docs/auditoria-enem.md atualizado com publicação, limitações e preparação. Registro final local não publicado para evitar deployment redundante de documentação.


## 07/10 — Recuperar acompanhamento sem nova cobrança
Plano: [x] ação visível no aviso inconclusivo; [x] recuperação somente leitura e fila respeitando pendência local; [x] testes DOM de falha/timeout/transporte/reabertura/clique repetido; [x] regressões e check; [ ] revisão antes da publicação. Branch fix/correction-recovery. Arquivos correction.e12.js, correction-redesign.e12.js, tests/correction-recovery.cjs, package.json, index.html (versões dos dois scripts para evitar cache antigo) e este registro. Database: nenhum impacto; sem backend, credenciais, notas ou IA paga. Risco: distinguir leitura de retry pago, coberto por contagem de chamadas. Produção não alterada. Rollback: reverter somente o commit deste patch de interface; backend ENEM permanece igual.

Validação: npm test (30 scripts, incluindo normal/Ao Vivo/ENEM) PASS; nova suíte DOM com componentes reais e transporte/relógio simulados PASS; HTTP44assets, npm run check e diff --check PASS. Após ajuste de textos/cache, suíte específica/HTTP/check novamente PASS. Log /tmp/correction-recovery-tests.log. Sem homologação autenticada nem simulação de rede móvel real. Nenhum push/deploy/IA paga. Publicação depende de nova confirmação após revisão deste diff. Acompanhamento usa somente action:get; retry pago continua separado e depende de confirmação explícita.

## 07/10 — Recuperação publicada com autorização específica
Marcus confirmou “Pode publicar” após apresentação do patch e dos testes. Plano concluído: [x] main remoto3044377 sem concorrência; [x] npm test30scripts/check/diff-check no commita45f5e9; [x] push fast-forward autorizado; [x] deployment e domínio conferidos.
Main remoto a45f5e9ff858a3351d1bb5c7647de3dfe5821778. Produção prj_5OC7zfjEgapvbrapPjas2lLvvut7: dpl_4pKsYW9Cu2Fb2JcK44Z8QV52PstB READY, alias app.versaoprofessor.com aponta ao commit exato, aliasError null. Scripts correction.e12.js e correction-redesign.e12.js referenciados com v=20261007-recovery; HTTP44assets e sintaxe validados localmente. HTTP externo indisponível neste executor por falha de resolução DNS; bytes servidos e login real não homologados. Log /tmp/recovery-release-tests.log. Sem notas, créditos, backend, credenciais ou chamadas pagas alterados. Rollback específico: reverter a45f5e9 e publicar via Git; deployment anterior dpl_7ttXvat8wfN4kyRm8Chejo4VY22L/3044377 preservado. Registro final apenas local para evitar deployment redundante de documentação.

## 07/10 — Clareza da revisão (implementação autorizada, sem deploy)
Plano: [x] separar IA/revisão humana; [x] campos C1 condicionais conforme gate existente; [x] preservar rascunho por usuário/job na sessão; [x] referências/data/versão/C5/limitação visual; [x] DOM normal/Ao Vivo/legacy e QA completo. Arquivos enem-review.e12.js, correction.e12.js, teacher-live.e12.js, index.html, tests/review-clarity.cjs, package.json e CONTINUIDADE.md. Database: nenhum impacto. Backend, notas, cobrança e critérios preservados. Risco: esconder exigência real; comparar condições com gate. Sem publicação até confirmação específica. Rollback: reverter somente este patch frontend.

Validação: npm test31scripts PASS, check44assets/sintaxe e diff-check PASS. Chromium real com dados sintéticos nos viewports320/390/768/1200: campos condicionais, texto preservado e ausência de overflow horizontal PASS; captura320 inspecionada. Testes cobrem normal/Ao Vivo, descarte/nota, legado/flags ausentes, isolamento por usuário e job, reabertura, resolução digitada, gates de publicação e cancelamento explícito. Rascunho apenas em memória da sessão da página (não sobrevive ao reload/fechamento); cancelar edição Ao Vivo descarta rascunho, salvar limpa. Sem login autenticado/IA paga. Logs /tmp/review-clarity-final.log; capturas /tmp/review-clarity-{320,390,768,1200}.png. Nenhum push/deploy. Publicação só após confirmação específica do patch.

### 07/10 — Manter desvios por padrão, publicação autorizada
Plano: [ ] retirar confirmações individuais em correção tradicional e Ao Vivo; [ ] preservar descartes, edições e aprovação final; [ ] regressões de revisão; [ ] publicar e conferir assets. Arquivos correction.e12.js, teacher-live.e12.js, index.html, tests/enem-review-ui.cjs, tests/live-deviation-review.cjs, CONTINUIDADE.md. Database nenhum impacto; sem backend, IA, cobrança, Auth, env ou domínio. Risco de perder descarte mitigado por testes. Base/rollback main598aa6acf01f39782e8b32d895e5d61a107a0d5b.
Validação: npm test completo (inclui revisão normal/Ao Vivo e handlers ENEM), npm run check e diff PASS. Nenhuma chamada paga, redação real aprovada ou alteração backend. Confirmação global preservada; decisões retained enviadas como confirmed somente na aprovação docente. Descartes e reavaliação C1 preservados. Publicação autorizada explicitamente nesta solicitação; conferência de assets não equivale a login real.
Publicação concluída: main4f94897bbda78e960469d69c77bd318488caf2ce, árvoredd80d87ef50572ccd543c034d90bd0cf9ebcf02a igual à local; produção dpl_D4chz7hghD355imESUgF8LQrocQ3 READY em https://app.versaoprofessor.com/.

### 07/10 — Hotfix do bloqueio de pendências por item
Usuário reenviou erro “Resolva cada pendência essencial antes de publicar”. Escopo da publicação autorizada anterior: respostas individuais às observações opcionais; aprovação final obrigatória. Plano [ ] paridade browser/API; [ ] auditoria sem resoluções inventadas; [ ] testes normal/Ao Vivo; [ ] deploy APIs e frontend. Arquivos enem-review.e12.js, action-alerts.e12.js, index.html, backend/enem/prepared/{ai-correction-beta-api,teacher-organization-api}/correction-quality.ts, tests/enem-quality.cjs, tests/enem-review-ui.cjs, tests/enem-live-api.cjs, tests/enem-normal-api.cjs, CONTINUIDADE.md. Sem SQL/migração/nota existente/IA paga/alteração financeira. RPCs verificadas não exigem requirement_resolutions. Rollback funções29/15 e frontend4f94897. Preservar reavaliação C1 quando descarte/mudança de faixa/evidência removida, sem alargar o escopo do erro mostrado.
Validação completa npm test/check/diff PASS. Cenários DOM e handlers reais simulados: publicar com notas individuais vazias, auditoria preserva observações sem resoluções fictícias, ausência de aprovação final bloqueada, descarte/reavaliação C1 preservados. APIs ai-correction-beta30 e teacher-organization16 ACTIVE/JWT, fontes conferidas. Sem chamadas pagas/publicação de redação real. Frontend em publicação.
Publicação final: main76b90b0c5791732f3488c493b419d6dd62306c98, árvorebf9f97f61a62e2f2eb88747495653ad9071cfeb3 idêntica à local. Produção dpl_53fTjPZPyhE3ocTSPgzT9xKj33ZA READY. Domínio https://app.versaoprofessor.com/. Sem homologação de login pelo agente; teste do bloqueio com payloads sintéticos e fontes implantadas conferidas.

### 07/10 — Reavaliação C1 opcional no fluxo aprovado
Usuário reportou bloqueio residual Reavalie a faixa/diagnóstico/sintaxe. Correção complementar da mesma publicação autorizada. Plano [ ] tornar campos C1 opcionais no browser/duas APIs; [ ] preservar diagnóstico quando vazio e auditoria sem revisão inventada; [ ] testes sem justificativa (nota mantida/alterada/descarte/legado); [ ] publicar/conferir. Arquivos enem-review/index frontend, quality nas duas APIs, index.ts normal/live.ts, testes pertinentes e continuidade. Sem migration/IA/cobrança/Auth. Rollback APIs30/16 e frontend76b90b0.
Testes npm test/check/diff PASS. Cenários sem justificativa (legado/evidência removida/descarte/nota alterada), notas parciais sem apagar diagnóstico, confirmação final obrigatória. APIs publicadas ai-correction31 e teacher-organization17. Sem IA paga ou aprovação de redação real.

## 07/10 — Início da construção guiada e correção por etapas
Usuário aprovou cronograma e início para professor/Ao Vivo, aluno escolar e independente. Base main81a3aae. Branch feat/construcao-guiada. Plano detalhado em docs/construcao-guiada.md, seis entregas sequenciais. Primeira entrega aditiva: writing-stages.e12.js (contratos, critérios e mensagens do tutor) e tests/writing-stages.cjs; não carregado pelo index nem conectado ao backend. Correção completa permanece padrão; parcial sem nota ENEM; tutor orienta sem resposta pronta. Database: nenhum impacto; sem API, schema, RLS, Auth, cobrança ou chamada paga. Testar contratos/check/diff antes do commit. Limitações: nenhuma tela, persistência, IA real ou integração entregue ainda. Próximo: integrar correção parcial com endpoint próprio, sem encaminhar trechos ao corretor completo; Supabase compartilhado exige autorização específica antes de alterações. Não publicar produção. Rollback: reverter commit aditivo. Link de código após push; não há novo link funcional de teste nesta entrega.
Validação inicial concluída: node tests/writing-stages.cjs PASS; npm run check PASS (44 referências); git diff --check PASS; HTTP local do novo módulo PASS, bytes iguais. Teste de mensagem comprova separação de instruções/dados, não resistência de IA real a prompt injection. Sem UI/login/autosave homologados. Commit desta entrada contém a primeira entrega; hash consultável no histórico Git.

## 07/10 — Interface de correção por etapas iniciada
Autorização: “Pode iniciar”, após primeira entrega enviada à branch feat/construcao-guiada (commit remoto dec74cd, árvore igual à local ac66193). Plano rastreável: [ ] seletor completo/etapas no Ao Vivo professor/aluno; [ ] entrada opcional na fila docente; [ ] renderer parcial sem notas; [ ] bloquear partial antes de upload/crédito/API completa; [ ] testes DOM/HTTP/regressão; [ ] preservar branch. Arquivos anunciados: writing-stages-ui.e12.js, teacher-live.e12.js, correction.e12.js, correction-redesign.e12.js, index.html, .vercelignore, tests/writing-stages-ui.cjs, package.json, docs/construcao-guiada.md, CONTINUIDADE.md. Database: nenhum impacto. Sem alteração em backend compartilhado, Auth, variáveis, domínio, cobrança ou integração. Backend atual não suporta contrato parcial; esta entrega prepara interface e bloqueia envio parcial com aviso explícito. Sem publicação produção; rollback por reversão do commit. Sem promessa de editor guiado/persistência nesta fase.
Teste inicial da interface: npm test completo PASS, incluindo nova suíte writing-stages e HTTP de46assets; npm run check e git diff --check PASS. Novos testes cobrem teacher/student, preservação do texto, zero chamadas após seleção parcial, retorno ao fluxo completo, fila, escape HTML e rejeição de resultado parcial incompleto. Backend/IA/dados reais não executados. Usuário reforçou manter layout padrão aprovado; componentes check-row/field/tl-card existentes reutilizados sem novo CSS/menu. Chromium em preparação para validar visualmente larguras320/390/768/1200 antes de concluir.
Limitação visual: Chromium não está instalado neste executor; tentativa de instalação retornou arquivo de download inválido/truncado. Portanto, não declarar inspeção visual nem ausência de overflow em navegador real. DOM, HTTP e regressões passaram; homologação visual fica pendente. Nenhum layout/CSS aprovado foi alterado.

## 07/10 — Interface publicada no domínio oficial de teste
Solicitação: continuar e fornecer aplicação testável, reforçada pelo usuário para usar teste.versaoprofessor.com. Plano: [x] conferir branch/domínio; [x] preservar histórico de teste e integrar árvore validada; [x] confirmar READY/alias; [x] conferir carregamento dos módulos no navegador. Branch de teste8681844 tinha árvore idêntica à base main9e328e6; nenhum conteúdo exclusivo foi removido. Merge remoto f943e42954fcf5789bb960398603d5a13261a83c, pais8681844 e21cd0f6, árvore e6fea3273ff61f210d0ace1b68dc8bb749c3e8f7 (mesma da entrega testada).
Deployment dpl_AN64cpsnvp7wo4tJT1U2X9YqqtaN READY/Preview, projeto prj_7mEBS5QDaBWrG4hjnBKelNkU90OY, alias confirmado https://teste.versaoprofessor.com/. Navegador abriu login e confirmou scripts writing-stages e writing-stages-ui v20261007-stages no DOM após reload. Sem sessão autenticada; CAPTCHA teve erros do provedor no navegador remoto; não declarar login/fluxos autenticados homologados. Etapas parciais continuam bloqueadas (não cobram), pois backend não está implementado. Produção, banco e funções intocados. Listagem Supabase confirmou somente Versao produtivo e Adapte: sem ambiente de backend Versão isolado. Rollback preview: novo commit descendente restaurando árvore8681844; não tocar main nem backend.

## 07/10 — Seletor aprovado e custo parcial de1crédito
Pedido explícito: select, completa por padrão, parcial também1crédito; continuar. Plano [x] reutilizar seletor customizado; [x] texto1crédito em todos os escopos; [x] contrato backend isolado com custo fixo servidor; [x] testes de seleção/custos/evidências; [ ] publicar somente interface em teste. Arquivos writing-stages-ui.e12.js, index.html, tests/writing-stages-ui.cjs, backend/writing/partial-correction.cjs, tests/partial-correction.cjs, package.json, docs/construcao-guiada.md, CONTINUIDADE.md. Database nenhum impacto; não alteradas funções/schema/Auth/RLS/Storage/RPC/env/domínios. Risco selector mitigado por testes do menu real customizado, preservação de texto e fallback completa. Contrato não é endpoint ativo e não realiza débitos.
Validação: test:stages/check/diff PASS; regressões select-controls, teacher-live, student-live e HTTP46assets PASS. Layout/CSS/menu existente preservado, sem inspeção visual autenticada nesta sessão. Nenhuma IA paga ou cobrança real. Rollback da interface por reversão deste commit; backend preparado permanece excluído do upload estático. Produção intocada. Próximo: reserva persistente e backend compatível, sem ativação automática no Supabase compartilhado.

## 07/10 — Rótulo e orientação acompanham a etapa
Pedido: nome do campo conforme select; continuar construção. Plano [x] atualizar rótulo/orientação sem recriar textarea; [x] preservar texto e perfil professor/aluno; [ ] testes e publicação preview. Arquivos teacher-live.e12.js, index.html, tests/writing-stages-ui.cjs e CONTINUIDADE.md. Database: nenhum impacto. Sem CSS/Auth/env/domínios/integrações/backend alterados. Rollback: reverter este commit. Base remota0fe8809371acdce6406ddf06f6ae907625fd67c5, deployment anterior dpl_FP856VdSSDvzdJE88v44NHuA22iv READY e alias teste.versaoprofessor.com conferidos. Correção parcial continua bloqueada até backend; não confundir preparação com serviço ativo.
Validação: test:stages/check/teacher-live/student-live/HTTP46assets/diff PASS. Rótulos das quatro etapas e retorno à completa conferidos nos dois perfis, preservando texto. Sem teste autenticado ou IA/cobrança real. Backend compartilhado não alterado.

## 07/10 — Integração parcial preparada, ainda sem ativação
Plano: [ ] schema com escopo imutável e snapshot; [ ] handler parcial separado da rubrica completa; [ ] revisão/compartilhamento; [ ] frontend por capacidade do servidor; [ ] testes de contrato, handler e SQL local; [ ] plano concreto de ativação/rollback. Arquivos backend/writing/prepared/live.ts e partial.ts; migration gerada pela CLI em backend/writing/supabase/migrations; testes tests/partial-live-api.cjs e tests/partial-live-db.cjs; frontend teacher-live.e12.js, writing-stages-ui.e12.js, live-share.e12.js, devolutiva.html, index.html; documentação docs/construcao-guiada.md, package.json, CONTINUIDADE.md. Database ativo: nenhum impacto, apenas leitura de schema/RPC. Preparação adiciona correction_scope em live_essays/live_jobs e input_snapshot em live_jobs, com gatilho imutável; sem tabelas/ACL/Auth/Storage novos. Reutiliza reserva1/estorno1 atômicos atuais. Primeira integração parcial somente texto80–16000, tema informado, não OCR. Backend compartilhado NÃO implantar sem apresentação final do plano e autorização específica AGENTS12–14. Layout preservado; rollback frontend e feature flag off mantendo dados parciais legíveis.
Validação preparada: test:stages e npm test completo PASS; schema/migration executados em PGlite local com RPCs reais e carteira sintética; snapshots/isolamento/reserva1/repetição/estorno único/terminal preservado PASS. Handler completo testado contra o preparado PASS. Módulos ativos14 da API17 conferidos iguais à baseline; nenhuma gravação remota. Adicionados também scripts/prepare-partial-backend.cjs, tests/fixtures/live-credit-rpcs.sql, docs/ativacao-correcao-parcial.md, devDependency PGlite0.3.14 e lockfile; tests/enem-live-api aceita caminho alternativo. Frontend teste por capacidade, backend ainda desligado. Sem IA real ou homologação autenticada. Publicação frontend em preview e preservação Git pendentes; ativação exige AGENTS12–14 após plano concreto.

Publicação frontend preparada concluída: remoto1d0018fa281f05dc6e7d43ef46ee58eac08fb510, árvore92b806910b84b96e578516fa5f8bd4b9ef71d5cb igual à local7f0ee4c. Preview dpl_Fz6RCYPp9TQQyVeUY5f7CiQiNKAK READY com alias https://teste.versaoprofessor.com/. Pacote15módulos sintaxe TS PASS. Backend v17 inalterado; capability ausente mantém envio parcial bloqueado. Próximo: apresentar docs/ativacao-correcao-parcial.md e obter autorização específica para migration/função/flag no Supabase compartilhado. Sem migração remota nem IA real. Registro final local para evitar deploy redundante.

## 07/10 17h02 BRT — Ativação parcial autorizada
Marcus: “autorizo”, após plano explícito de migration, função compartilhada e flag. Plano [x] baseline17/14módulos reconferida; [x] testes stages incluindo SQL local e handler completo PASS; [x] zero jobs processing; [ ] migration aditiva; [ ] API18 JWT; [ ] readback fontes/schema; [ ] flag; [ ] registro final. Não promover main/frontend produção, executar IA paga ou alterar registros existentes. Rollback: flag off preservando leitor e histórico, conforme docs/ativacao-correcao-parcial.md.
Ativação concluída: migration live_partial_scope aplicada; teacher-organization-api18 ACTIVE/JWT e15arquivos iguais ao pacote aprovado. Colunas correction_scope(default complete) nas duas tabelas, input_snapshot em jobs, dois gatilhos enabled, RLS mantido; função privada anon/authenticated sem EXECUTE. Flag live_partial_correction=true/config text,versionpartial-correction-v1,credit_units1 gravada e relida. Supabase compartilhado alterado conforme autorização; frontend produção/main não alterado. Sem crédito real, nota ou chamada paga executada. Testes: stages/SQL local/regressão handler completo PASS. Avisos advisors fora desta mudança documentados, sem ampliar escopo de ACL/Auth. Teste oficial https://teste.versaoprofessor.com/ permanece frontend1d0018f READY. Sem login ou IA real homologados. Rollback flag off preserva leitor/schema/jobs.

## 07/10 — Remover restrição de tema IA na parcial (preparado)
Usuário reportou mensagem explícita; causa: API18 e trigger bloqueiam purpose theme para parciais. Plano [ ] permitir job theme sem débito, com snapshot; [ ] manter inferência como hipótese e confirmação obrigatória; [ ] reexibir botão; [ ] testes API/SQL/DOM; [ ] preservar pacote e solicitar ativação compartilhada conforme AGENTS12–14. Arquivos live.ts preparado, nova migration partial_theme_inference, teacher-live/index, tests/partial-live-api,partial-live-db,writing-stages-ui e este registro. Database: nenhuma alteração aplicada agora; futura troca da função de trigger private.live_partial_snapshot, sem colunas/dados/ACL novos. Sem Auth/env/domínio/preço. Rollback API18 e trigger anterior; manter snapshots e resultados existentes.
Validação: test:stages completo PASS (inclui tema parcial via handler e SQL sem débito/repetição), check/diff e teacher-live/student-live PASS. Sem IA real ou escrita remota. Ajuste ainda não ativo; publicação requer migration de substituição do trigger + API atualizada + frontend teste, mantendo main intacto.

## 07/10 18h18 — Câmera, links20dias e editor guiado
Usuário autorizou IA/créditos para testes, pediu20dias e próxima etapa após proposta do fluxo câmera. Plano [ ] transcrição revisável por etapa com cache e concorrência; [ ] liberar tema IA preparado; [ ] novos links20dias, antigos preservados; [ ] editor guiado com rascunhos privados/versão; [ ] testes e implantação backend + frontend teste. Arquivos live.ts/index.ts/live-transcription.ts preparados, migration partial_camera_links, teacher-live/index/writing-stages-ui, novo writing-editor.e12.js e testes, package scripts/lockfile, docs e continuidade. Database: nova live_transcriptions, live_writing_drafts e RPCs restritas service_role, RLS ativo; alterar trigger de snapshot para permitir primeiro texto conferido e default live_shares20dias; sem saldos, notas, links antigos, Auth, Storage, DNS ou variáveis alterados. Modelo de leitura4.1mini/telemetria existente; nenhum débito pela transcrição. Layout existente; rollback capability off mantendo leitores e rascunhos. Editor baseado em Mascara_redacao_Enem_editavel.docx lida nesta sessão; sem exemplos prontos gerados por IA.
Implementação local concluída: câmera/arquivo via live_transcribe/live_confirm_text, transcrição privada e snapshot confirmado imutável; sugestões de tema parciais aceitas; editor writing-editor.e12.js com autosave privado versionado, planejamento fora da prévia e handoff para Ao Vivo. Leituras não debitam crédito; metering separado partial_transcription. RPCs novas somente service_role, RLS nas duas tabelas,30leituras/dia e3tentativas/arquivo. Salvar não chama IA. Novos links20dias, anteriores intactos. Testes específicos DOM/OCR/SQL/editor PASS; regressão completa em andamento. IA autorizada para teste pelo usuário, mas exige sessão própria para executar teste real sem impersonação; nenhuma chamada real feita ainda.
Validação final câmera/editor: npm test completo PASS; tests/partial-live-api,writing-stages-ui,writing-editor,SQLPGlite e check/diff PASS após ajustes;47assets HTTP e16módulos sintaxeTS. API18/15arquivos ativos reconferidos contra baseline, zero jobs processing. Próximo aplicar migration câmera/20dias/editor que já incorpora inferência tema (migration tema isolada não precisa rodar separadamente); publicar API19/JWT, ativar config camera/writing_editor, publicar frontend só teste. Usuário solicitou câmera e prazo20dias e autorizou IA/testes e continuidade após o fluxo proposto; não promover frontend main. Riscos/arquivos/schema apresentados antes das alterações.
Backend câmera/editor ativado: migration partial_camera_links_writing aplicada (inclui tema parcial); API19 ACTIVE/JWT e16arquivos iguais ao pacote. Default live_shares=20days; RLS nas novas tabelas, anon/authenticated sem acesso direto ou EXECUTE das RPCs. Config live_partial_correction camera:true,writing_editor:true,input:text-or-file relida. Advisors: novas tabelas somente INFO RLS sem policy, intencional pelo acesso exclusivo via backend. Frontend produção/main preservado. Testes reais com IA ainda dependem de sessão autorizada disponível; não executar via impersonação. Frontend teste em publicação.

Publicação teste concluída: commit remoto34e0f123338ddf33298520640258793ef944d0d7, deployment dpl_F2LnweTpT5XqgtBQ8GDJVvcNxqLn READY/Preview, alias teste.versaoprofessor.com confirmado. Navegador confirmou index com writing-editor20261007-editor e teacher-live20261007-camera. Sem sessão autenticada; solicitação segura browserAuth interrompida pelo usuário, não repetir sem nova solicitação. Teste real IA/câmera e consumo real de crédito não executados; testes automatizados passaram. Editor inicial publicado; tutor IA instrucional, vínculo por escola e acesso independente ainda pendentes. Registro local para evitar publicação redundante de documentação.


## 07/10 — Bloqueio local do editor/câmera reportado pelo aluno
Plano [x] localizar erro no request guard; [x] permitir somente live_writing_list/get/save, live_transcribe e live_confirm_text em teacher-organization-api; [ ] testar transporte real e regressões; [ ] publicar preview oficial e homologar aluno via formulário seguro. Arquivos core.e12.js, index.html, tests/writing-editor.cjs, CONTINUIDADE.md. Database: nenhum impacto. Sem Auth/CAPTCHA, saldos, funções ou produção alterados. Erro mostrado como indisponibilidade do servidor era lançado localmente por betaRequestAllowed antes do fetch. Preservar MUTATIONS_ENABLED=false, permissões no backend e desconhecidos bloqueados. Rollback reverter commit frontend. Não registrar PIN/código ou credenciais.
Validação: npm test completo e check PASS, 47 assets por HTTP; teste novo usa request/betaRequestAllowed reais, cinco ações novas chegam ao fetch e ação desconhecida continua bloqueada. Sem teste autenticado ainda.
Publicação preview enviada: commit remoto bba3f07b7ec6273e29c0fa2f97b1527f74d101d1, branch feat/ao-vivo-preview. Formulário seguro aluno interrompido pelo usuário; login e teste real não confirmados. Nunca usar PIN enviado no chat por API inferior. Nenhuma IA real executada nesta entrega.

## 08/10 — Construção completa preparada para teste posterior

Marcus: “Construa tudo e depois nós testaremos”. Plano rastreável: [x] verificar vínculos/schema/contratos ativos; [x] implementar tutor, versões, atividades e ACL; [x] integrar editor, acompanhamento e aluno independente; [x] regressões automáticas; [ ] preservar commit/branch; [ ] ativação compartilhada após autorização específica; [ ] homologação conjunta. A implementação foi priorizada, sem insistir em novo login. Não armazenar credenciais de teste nem utilizá-las por API inferior.

Arquivos: writing-editor/classroom/independent.e12.js, teacher-live.e12.js, core.e12.js, boot.e12.js, student-signup.e12.js, index.html, cadastro-aluno.html, .vercelignore; backend/writing/prepared/{index,live,partial,writing-tutor,writing-independent,credit-checkout-api}.ts; scripts/prepare-partial-backend.cjs; migration20261008022620_guided_writing_complete.sql (gerada com CLI Supabase); tests/writing-complete-db,writing-tutor,writing-complete-ui,writing-editor,partial-live-api.cjs; package.json; docs/construcao-guiada.md e docs/ativacao-construcao-completa.md; este registro. Layout/CSS aprovados preservados.

Impacto preparado, não aplicado: cinco novas tabelas privadas com RLS/grants restritos, activity_id em drafts, contexto imutável em essays/jobs, snapshots/revisões, atividades, comentários, ACL docente/matrícula, reserva idempotente de tutor e cadastro independente. Funções existentes teacher-organization-api19 e credit-checkout-api8 precisam de atualização; helper de crédito inicial preserva idempotência e acrescenta independente aprovado. Não há mudança de CAPTCHA/Auth provider, env, domínio, preços ou saldos existentes. Flags novas inicialmente desligadas. Tutor de homologação:12 orientações/24h, sem crédito debitado; pacote comercial não definido. Tutor não deve produzir texto pronto: contrato/evidências e segundo verificador bloqueiam saídas impróprias, sem garantia de comportamento de modelo real ainda.

Validação: npm test completo PASS (inclui SQL real em PGlite, isolamento, revogação de matrícula, etapas, versões, contexto, recibos, aprovação independente, tutor simulado e UI/JSDOM); check49assets PASS. Corrigida também comparação de contexto para não depender da ordem de chaves JSONB em retries. Nenhuma chamada IA real, checkout real, login autenticado ou inspeção visual foi executada para esta entrega. Backend compartilhado e frontend de produção intactos; preview oficial permanece bba3f07. Plano de ativação/rollback detalhado em docs/ativacao-construcao-completa.md. AGENTS12–14 exige autorização específica porque o Supabase compartilhado pode modificar produção; autorização genérica de construção não libera essa etapa. Código será preservado somente na branch de desenvolvimento até a autorização.


## 08/10 — Menu aluno separado e proposta de apoio à escrita
Autorização específica do usuário para ajustar menu/abas/nomes do aluno. Plano [ ] separar Corrigir e Escrita guiada com rota própria e ícones; [ ] renomear Temas/Redações/Créditos e títulos; [ ] preservar professor; [ ] verificar navegação e HTTP; [ ] publicar apenas frontend menu no teste; [ ] proposta visual com mais apoio, sem implantação desses novos recursos. Arquivos core, teacher-live, writing-editor, writing-independent (somente dev), student-home-v2, student-proposals-v2, student, student-credits, index; testes navigation-modules; docs/padrao-interface e continuidade. Database: nenhum impacto; nenhum Supabase, IA de correção, saldo, backend, Auth, env, domínio ou produção alterado. Risco: rota/atalho quebrado; rollback frontend ao preview bba3f07. Pacote completo de backend continua pendente de autorização.

Validação menu: navegação/JSDOM PASS (rota própria student-writing, ícones, sem grupo Ao Vivo para aluno, professor intacto), editor/save/handoff/conflito PASS, student-live/offer e teacher-live PASS; HTTP47assets PASS no patch isolado; check47/49assets e diff-check PASS. Suíte geral executou as regressões até o editor; fixture antiga sem perfil ajustada e suíte pertinente rerodada PASS. Não homologar login/correção real por esses testes. Patch do preview construído da versão já ativa, sem incluir a nova migration nem ativação da tutoria/cadastro. Imagem proposta gerada e inspecionada, somente para revisão. Recursos adicionais de ajuda ainda não implementados.

Publicação de menu concluída: preview remoto2e4288327cbbe369be19ff66d2451a1ade19c8a3, árvore3ac6103c84c3b7c6f2934d555b9ae2b7095d215d igual ao patch localabf000d. Vercel dpl_Dgm3UjcHFyt9vdNGR6mxbs78z57B READY no projeto isolado, alias https://teste.versaoprofessor.com/ conferido. Fetch do index confirmou cache20261008-student-menu; core servido confirmou rota student-writing e Escrita guiada. Código completo/proposta preservados remotamente f90b07479283dff68e97e39013840e6b8f4e0733 em feat/construcao-guiada. Nenhuma ativação de backend/tutoria nova; imagem conceitual exibida para avaliação. Sem login/correção real homologados pelo agente. Registro final local evita novo deploy só por documentação.


## 08/10 — Implementar apoio da guiada aprovado
Marcus aprovou imagem/proposta com logo correta, tutor e teste gratuito; agora pediu implementação. Plano [ ] painel Objetivo/Perguntas/Repertório/Revisão; [ ] planejamento por etapa e comando do tema; [ ] ações do tutor e fontes rastreáveis; [ ] uso gratuito sem cota diária comercial, exclusão de duplicidade; [ ] testes UI/SQL/API; [ ] preservar código e preparar ativação. Arquivos writing-editor.e12.js/css, novo writing-support.e12.js, backend/writing/prepared/{live,writing-tutor}.ts, migration preparada20261008022620, index/.vercelignore, testes writing-*, docs ativação/proposta/padrão e continuidade. Impacto database preparado: migration completa ainda pendente, reserva de tutor com uma solicitação ativa por aluno; planejamento permanece string JSON no campo plan existente, comando em content; nenhuma nova coluna para esses campos. Config gratuita test_free sem cota diária nem débito, metering de IA e busca; correção1crédito preservada. Backend compartilhado API19 foi lido, writing_guidance não existe/flag ausente; não está ativo. Sem Auth/env/domínio/produção frontend alterados. Riscos: campos legados, confirmação de fontes, autoria e isolamento/versionamento. Rollback anterior de menu2e42883/flags off e fontes API19 conferidas.

Pedido adicional explícito Marcus: acrescentar50créditos ao Aluno Teste VERSÃO. Perfil único aprovado localizado, saldo0. Plano: ler helper credit_wallet_add, usar lançamento auditável e idempotente50, reler carteira/ledger. Database: gravação apenas de saldo+ledger nessa conta autorizada; sem migration, Auth ou preço. Não incluir credenciais nem PIN no registro.

Créditos adicionais concluídos: Aluno Teste VERSÃO saldo0→50, ledger delta50/balance_after50/event adjustment relido. Uma tentativa com event manual_adjustment foi recusada pela constraint e revertida integralmente; corrigido para enum válido adjustment, recibo único. Sem senha/PIN utilizados.
Implementação apoio pronta: layout aprovado, logo original header, planejamento estruturado em string JSON compatível com anotações antigas; command em content; materiais fixos sem IA; tutor ações/contexto/snapshot; busca web_search com fontes anotadas até3links seguros; metering busca/orientação/verificação sem débito. Config test_free sem cota diária, uma orientação pendente por aluno, recibos idempotentes. Migration original ainda não aplicada, ajustada antes da primeira execução. IA real/visualização autenticada ainda não homologadas. npm test completo PASS, SQL17orientações sem limite comercial/concorrência, UIcampos/abas/save/version/duplicidade/autoria/fontes simuladas PASS; check51assets e18módulosTS PASS. Risco de ativação compartilhada permanece; plano atualizado docs/ativacao-construcao-completa.md prevê somente teacherAPI+writingflag, independente continua off/creditAPI inalterada.


## 08/10 11h29 — Ativação guiada autorizada
Marcus: “autorizado”, após plano final migration+teacherAPI+flag+frontend teste. Plano [x] baselineAPI19/16arquivos ecreditAPI8/JWT; [x] zero jobs processing, flagguiada ausente, saldo aluno50; [ ] guardar fontes rollback; [ ] migration; [ ] teacherAPI20/JWT18módulos; [ ] grants/RLS/fontes/flag test_free readback; [ ] frontend branch oficial/READY/alias; [ ] registro. Somente guiada; student_independent permanecefalse e função credit-checkout-api8 não será alterada. Frontend de produção/main preservados. Não consumir créditos nem IA real nesta implantação; usuário homologará depois com sessão segura.

Ativação backend concluída conforme autorização: migration guided_writing_complete aplicada; teacher-organization-api20 ACTIVE/JWT,18fontes iguais ao pacote; baselineAPI19 salva /tmp/versao-guided-rollback-v19 e também reconstruível pela branch anterior. Novas5tabelas RLStrue, anon/authenticated sem SELECT; RPCs sem EXECUTE público e service_role permitido; colunas conferidas. Flagwriting_guided=true/configbilling_mode:test_free,tutor_limit:null,package_price:null/repertoire_search:true; student_independent=false; creditAPI8 preservada. Saldo aluno50. Advisors novas tabelas somente INFO RLS-sem-policy intencional acesso backend exclusivo; avisos anteriores de funções definer/Auth não ampliados neste escopo. Sem IA real ou débito. Frontend teste em publicação.

Ativação final concluída: commit remoto979d9096334b8badf592c0e0e477f5e46d415021, árvorec4431f843e5dc662b999e9691380605069f32e27 igual à local66582a8; branches feat/ao-vivo-preview e feat/construcao-guiada preservadas. Deployment oficial dpl_2Kn58m45eA1PJDTtEwdqiorZfzaR READY/Preview no projeto isolado, alias https://teste.versaoprofessor.com/ conferido. Index/support/editor/css servidos confirmam cache20261008-support, painel e tutor; quatro triggers writing_draft_permissions/revision e writing_context_essay/job enabled. Flag gratuita relida true, tutor_limitnull; zero recibos de orientação criados pelo agente e saldo aluno50. CreditAPI8 relida idêntica, cadastro independentefalse. Sem sessão autenticada/teste real deIA ou celular pelo agente; usuário fará homologação. Nenhum frontend produção/main promovido. Advisors novas tabelas INFO RLSsem-policy intencional; referência https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy. Registro local evita deploy redundante.


## 08/10 — Correção parcial e turma exclusivas do professor
Pedido Marcus: corrigir em partes e atividades da turma restritas ao professor. Plano [ ] ocultar seletor/atalho parcial do aluno e bloquear retomadas parciais pela UI; [ ] manter leitura das devolutivas antigas; [ ] turma somente professor com guarda de entrada; [ ] manter quatro etapas/tutor; [ ] testes e preview oficial. Arquivos writing-editor.e12.js, teacher-live.e12.js, writing-classroom.e12.js, index.html, tests/writing-editor.cjs, tests/writing-stages-ui.cjs, tests/writing-complete-ui.cjs, CONTINUIDADE.md. Database: nenhum impacto; nenhuma migration/RLS/Auth/RPC/function/flag/dado alterado. Restrição desta entrega na experiência frontend. Risco: atalhos legados retomarem parcial, tratado por guardas; leitura anterior preservada. Vercel somente preview oficial, sem env/domínio/integração nova; rollback commit remoto979d909.

Implementado: aluno sem seletor/atalho parcial, preset normalizado completo/contexto vazio, handoff une parágrafos, retomada parcial pendente bloqueada e devolutiva antiga legível sem refazer; atividades ocultas e entrada frontend exige professor. Etapas/tutor e fluxo professor preservados. Check51assets, editor/guiada/etapas (preset e histórico ambos estados), student-live, teacher-live, teacher-live-activities, replacement, navigation e HTTP51assets PASS; diff-check PASS. Sem login/IA real nem mudança backend. Preview oficial em publicação.

Publicação concluída: remoto55fc04c4558ce6b5af63cc54ec133443ddf297e9 nas duas branches de trabalho, árvore4f988c35c1a6db5e7dd77f0dbcffb1482a98e942 igual local8c25c0d. Vercel dpl_D74q2u9NfNjVR7hytxtqVScfDoHG READY/Preview no projeto isolado; domínio https://teste.versaoprofessor.com/ aponta a esse commit. Index e3scripts relidos com versão/guardas corretos. Checklist concluído. Sem banco/produção/IA/créditos alterados; limites: restrição frontend, não nova autorização backend; sessão real será homologada pelo usuário. Registro final local para evitar redeploy apenas documental.


## 08/10 — Erro ao continuar rascunho / private USAGE
Marcus pediu correção. Plano [x] reproduzir leitura service_role no banco em transação read only; [x] baseline service_role USAGEfalse, authenticatedtrue existente, anonfalse; [ ] preparar SQL restrito e teste com role real; [ ] autorização final banco compartilhado AGENTS12/14; [ ] aplicar/readback após autorização. Arquivos backend/writing/private-schema-access.sql, tests/writing-complete-db.cjs, CONTINUIDADE.md. Database: grant USAGEprivate apenas service_role, sem dados/créditos/RLS/Auth/function/exposure alterados. Rollback REVOKE USAGE ON SCHEMA private FROM service_role. Sem Vercel/env/domínio/produção frontend. Consulta writing_access do Aluno Teste reproduziu42501 na expressão private.writing_teacher/writing_member, mesmo sendo dono pois parser resolve funções.

Preparação validada: teste SQL completo PASS reproduziu erro com SET ROLE service_role antes, writing_access privado do dono retorna após grant e outro aluno permanece negado; anon/authenticated sem novos grants. diff-check PASS. SQL pronto, nenhuma alteração remota aplicada. Aguardando autorização final específica por banco compartilhado.

08/10 12h26 BRT: Marcus autorizou após plano específico. Migration guided_writing_private_schema_usage aplicada, somente GRANT USAGEprivate TOservice_role. Readback service_rolefalse→true; anonfalse/authenticatedtrue preexistentes preservados. Mesma consulta real read-only com SET LOCAL ROLEservice_role ao último rascunho do Aluno Teste antes falhava42501, agora retorna response_typeobject. Checklist concluído. Preparação598b4dc preservada; sem dados/créditos/IA/login/frontend/deploy alterados. Teste real de UI pelo usuário; backend validado no papel efetivo, sem expor conteúdo. Rollback declarado permanece válido.


## 08/10 — Falha tutor e orientação separada
Marcus: não funcionou tutor, sugestão à parte da escrita. Plano [ ] adequar prompt às restrições/evidência literal e diagnosticar falha sem texto; [ ] regressão com extrator real do Responses e erros; [ ] painel Orientação da IA separado do formulário/escrita, histórico identificado e retry de recibo failed; [ ] testes e preview; [ ] pedir autorização final Edge Function compartilhada após preparo. Arquivos backend/writing/prepared/writing-tutor.ts, writing-editor.e12.js/css, index.html, tests/writing-tutor.cjs, tests/writing-complete-ui.cjs, CONTINUIDADE.md. Database sem schema/dados/RLS/Auth/créditos novos; Edge Function teacher-organization-api20 será candidata ao21 após autorização. Baseline20 capturada18arquivos. Duas tentativasfailed15h45UTC, meteringguidance200completed sem authorship_check: falha extração/parse/validação antes auditoria, causa exata ainda não persistida. Sem IA real paga acionada pelo agente. Rollback função20 e frontend55fc04c.

Implementação preparada: contrato de tamanho/perguntas/evidência literal no prompt sem enfraquecer validador/auditoria; falhas classificadas e log somente código conhecido+id sem conteúdo; frontend cartão próprio Orientação da IA e citação distinta, nunca insere conteúdo no textarea; recibofailed pode ser tentado de novo explicitamente. Tutor tests com extrator real Responses/evidência inventada/auditoria/idempotência PASS; UI painel separado/texto preservado/retryfailed PASS; editor/check51assets/HTTP51assets/diff-check PASS. Não afirmar causa exata das tentativas antigas nem êxito com IA real: respostas descartadas e log anterior genérico; plano reduz validações evitáveis e torna causa identificável. EdgeFunction20 ainda inalterada, requer aprovação final; frontend em publicação.

Preview painel publicado remoto f72ac19648f267af51738e8648302e65ff17aaa0, árvore0e340a498f154ea9c8010c9c152b4acec9f826a5 igual locale5e203a; dpl_pUFvFe1cCmFXejV7jtRh2MTW1WZv READY/projeto isolado/alias oficial https://teste.versaoprofessor.com/ confirmados, index/editor/css com marcador novo relidos. Somente frontend ativo; function20 preservada. Fontes candidatas21 reconstruir das18fontes reais20 substituindo somente writing-tutor.ts por preparado nesta branch; verify_jwttrue e demais arquivos idênticos. Próximo: autorização final específica atualizarteacherAPI compartilhada. Nenhum teste pago/IA real feito.

08/10 12h57BRT Marcus autorizou após plano/candidato. teacher-organization-api21 ACTIVE/JWTtrue publicada,18arquivos relidos iguais candidato; somente writing-tutor.ts modificado sobre baseline20. Prompt alinhado às restrições, mensagens diagnósticas seguras; validação/autoria preservadas. Frontend oficial f72ac196/painel independente ativo. Sem migrations/dados/créditos/env/domínio/produção frontend alterados. Testes simulados pertinentes passaram anteriormente; nenhum pedido IA real executado pelo agente. Validação autenticada de nova orientação ainda pendente pelo usuário; não declarar erro antigo definitivamente resolvido sem nova resposta. Rollback restaurar18fontes20 capturadas.


## 08/10 — Orientação próxima do trecho
Marcus pediu painel IA mais próximo do trecho. Plano [ ] mover cartão independente imediatamente após cartão de escrita na mesma coluna/ordem mobile; [ ] validar preservação e sequência; [ ] preview oficial. Arquivos writing-editor.e12.js,index.html,tests/writing-complete-ui.cjs,CONTINUIDADE.md. Database: nenhum impacto. Sem CSS/function/IA/env/auth/dados/créditos. Rollback frontendf72ac196.

Implementado cartão independente imediatamente depois da escrita, antes de apoio/tutor na ordem celular; resposta não altera textarea. Regressões UI/editor/check51assets/HTTP51assets/diffcheck PASS. Sem backend. Publicação preview em andamento.


## 08/10 — Inicial: destaque guiada/correção objetiva
Marcus adicionou pedido inicial com guiada destacada/correção mais objetiva durante publicação proximidade. Plano [ ] guiada primeiro/callComeçar; [ ] correção curta com preço/saldo/atribuição preservados; [ ] testar rotas e dois estadoshome; [ ] previewoficial. Arquivos student-home-v2.e12.js,index.html,tests/student-offer.cjs,CONTINUIDADE.md. Database: nenhum impacto; sem backend/auth/env/dados/créditos. Métricas/menu/logo preservados. Rollback versãofrontend0d8441ee.

Home implementada: guiada primeira em destaque comComeçar, correção curta/Enviarredação e1crédito/saldo/atribuiçãoIA; dados/métricas/navpreservados. Testeshomeambosestados/rotas/guiada/correção/saldo50,check51assets,HTTP51assets,diffcheck PASS. Proximidade publicada remotamente0d8441ee5bbcf3fc32daaf4b8a23efa10393cb2a, árvore3190d323e65c0248f5b591f095ef1dc4d81c1111; nova home em publicação no mesmo preview.

Publicação final proximidade+home: remotobfd69c49f1e97aa355e9d04a7d9377f15f7e02de, árvore4afd8c354d6dd6cc935b637b457b2309bffe4636 igual local28b9a91; dpl_Ezng1ojuzAF34TMwJquNBUd9KZ9N READY/Preview projetoisolado comalias https://teste.versaoprofessor.com/. Checklists concluídos, assetsindex/home/editor relidos commarcadores. Guiada antescorreção e orientação apósparágrafo; textos/fluxos/menupreservados. Sem backend/produção/IA real. Layout DOM testado, inspeção celular usuário.


## 08/10 — Método Recurso e inicial aprovada
Marcus aprovou mockup e plano pedagógico. Fontes Drive lidas: Antes de escrever1Qtknj4XvzfP-GI-hXXZOeYTwMYw2IZ5e, Repertório que argumenta1ll2Jjje_-KqZfML3tzN6vbHnzRSmPb-R, Da boaideia1ufJuqJ8lXDgXNcbCi66tYP67GiuJXYRx. Cinco movimentos de D1/D2: ideia-explicação-repertório-consequência-fechamento; interpretaçãotema antes tese; produtividade referência/ideiaextraída/relação/função. Plano [ ] hero aprovado responsivo/correçãocompacta; [ ] planejamento/perguntas/revisão/guiada método; [ ] preservar camposlegados; [ ] tutor solicita método através pergunta existente; [ ] regressões/preview. Arquivos student-home-v2.e12.js,writing-support.e12.js,writing-editor.e12.js/css,index.html,tests/student-offer.cjs,tests/writing-complete-ui.cjs,tests/writing-editor.cjs,CONTINUIDADE.md. Database: nenhum impacto, nenhuma function/grant/schema/env/auth/crédito; plan JSON existente até4000 preservado. Rollbackbfd69c49.


## 08/10 — Acessos estudante PIN/e-mail e cadastro
Marcus rejeitou turma/independente como nomes. Plano [ ] Estudante · PIN / Estudante · E-mail; [ ] CTA Quero criar minha conta no e-mail; [ ] formulário já existente com indicação e bloqueio temporário antes do Auth enquanto flag permanece false; [ ] teste alternância/cadastro bloqueado; [ ] preview; [ ] aprovação específica liberar flag compartilhada após preparo. Arquivos index.html,boot.e12.js,cadastro-aluno.html,student-signup.e12.js,tests/google-boot.cjs,tests/student-signup.cjs,backend/writing/enable-student-signup.sql,CONTINUIDADE.md. Database: nenhum impacto aplicado; SQL candidato altera somente student_independent.is_enabled false→true; futura liberação permite cadastro aluno sem turma sujeito à aprovação existente, não converte professores nem libera automaticamente perfis. Auth/CAPTCHA/Google preservados, sem chamadas de cadastro real. Rollback flagfalse/frontendbfd69c49; Vercel somente teste.

Implementação pronta: hero aprovado/five movements D1D2 e D2 sem repetição, interpretação do tema e repertório referência/ideia/relação/função, tutorpayload existente, campos anteriores preservados/salvos. Login Estudante · PIN/e-mail e CTA Quero criar minha conta; linkcadastro pronto mas flag false relida, formulário bloqueado antes Auth/CAPTCHA/Google para evitar contasórfãs. Candidato enable-student-signup.sql validado em PGlite com RPC real: bloqueia flagfalse, flagtrue cadastra e mantém aprovação pending; não converteprofessor. PASS editor+preservaçãoJSONlegado, UIguiada,home,bootPIN/email/professor/Google,CAPTCHA,recovery,cadastro,SQLguiada,seletorpróprio,check51assets,HTTP51assets,diffcheck. Nenhum login ou cadastro real/IA pago pelo agente. Aguardando publicação preview e autorização final flag compartilhada; arquivos adicionais testes/writing-complete-db.cjs cobrem SQL candidato.

## 08/10 — Evolução identificada por tema/eixo
Marcus prefere tema+eixo no lugar de R1/R2. Plano [ ] usar round.theme e eixo das propostas autorizadas (API dashboard atual não inclui eixo); [ ] layout tema acima barra no desktop/celular; [ ] falha propostas não impede notas, eixoausente explícito; [ ] testes/XSS/HTTP/preview. Arquivos student.e12.js,responsive.e12.css,index.html,tests/student-evolution.cjs,CONTINUIDADE.md. Database: nenhum impacto; apenas APIs existentes de leitura, sem backend. Risco eixo de proposta indisponível/oculta não pode ser inferido: exibir Eixo não informado. Rollback frontendbfd69c49.

Evolução pronta: tema/eixo/data acima barra, notas e competências preservadas; eixo por leitura propostas autorizadas existentes; teste com fonte ausente/falha de API/XSS PASS. Sintaxe51assets/HTTP/diffcheck PASS. Mudanças deste turno preservadas em commits locais; publicação consolidada home/guiada/login/evolução em andamento. Cadastro independente false, nenhuma gravação remota realizada.

Publicação consolidada concluída: remoto1282e3c9174b2586c6f098c0c7c42eeeafe3fe72 nas duas branches, árvoree432173e8a07241920da157bcd5e4b6fe4ba5aad igual localc50c204. Deploymentdpl_8xfsSmF28zUL1K4FY3LXThrKQRAu READY/Preview projetoisolado/alias oficial https://teste.versaoprofessor.com/ confirmado. Assets index/login/evolução/cadastro/support relidos e marcadores corretos. Testes concluídos; nenhuma sessão real/Auth signup/IA paga. student_independent false relida: formulário bloqueia Auth até autorização específica. Plano liberação: executar somente UPDATEflagfalse→true (SQL testado) + frontend data-registration-enabledtrue, publicarpreview/testar; banco compartilhado afeta produção e mantém aprovação pending. Sem env/domain/function/migration/grant novos; futuros cadastros Auth/profile/independentAccount existentes, crédito trial conforme regra atual uma vez; rollbackflagfalse e HTMLbloqueado. AGENTS12 exige autorização nova após plano. Aguardando pergunta final autorização.

## 08/10 — Conectar proposta à escrita guiada
Marcus mostrou resumo proposta e pediu ligação guiada. Plano [ ] botão Escrever com guia no resumo e leitura completa; [ ] handoff tema/comando existente para novo rascunho, consumo uma vez; [ ] não sobrescrever rascunhos nem salvar/usar IA ao abrir; [ ] teste integrado real módulos e retorno entrada sem tema; [ ] HTTP/sintaxe/previewoficial. Arquivos student-proposals-v2.e12.js,writing-editor.e12.js,index.html,tests/proposal-guided-writing.cjs,CONTINUIDADE.md. Database: nenhum impacto (sem schema/Auth/RLS/functions/dados/créditos), utiliza APIs existentes após ação do usuário. Risco tema anterior reaparecer: estado consumido antes render. Sem env/domínio/produção, rollback1282e3c9.

Marcus acrescentou puxar temas disponíveis dentro guiada. Plano [ ] botão Escolher tema aluno em rascunho livre; [ ] lista inline pesquisável tema/eixo via studentProposals(true); [ ] selecionar tema/comando preserva parágrafos/planos, altera através salvamento existente; [ ] atividade professor comtema fixo semseletor; [ ] erros/vazio/retry e teste. Arquivo adicional writing-editor.e12.css, tests/writing-complete-ui.cjs; nenhum backend. Consulta sob sessão/alvo existentes, não mostra temas ocultos.

Implementação/testes concluídos: botões resumo+completa handoff única vez tema/comando emnovo rascunho, sem requestsave/IA ao abrir; dentroguiada seletor inline pesquisável temaeixo porpropostas existentes, preserva escrita+planejamento, tema atividadefixo semseletor. PASS integraçãoreal módulos/retorno sempreset/busca/preservação, UIguiada atividade,editor,manuscritas/HTTP,check51assets/HTTPsmoke/diffcheck. Sem cadastroflag liberada/DBprodução/IAreais. Preview em publicação.

Publicação concluída: remoto bd525b566b93fae615606a19893c9e042ae5c1b0 nas duas branches, árvorecfba1ec9c48edf82faf4c997ffffe35eca18a66b igual local4959b4f. Deploymentdpl_8N8m3i6kzR5eiFNCMuCQNHacaQ5R READY/Preview/projeto teste/alias https://teste.versaoprofessor.com/ confirmados. Index/propostas/editor/css relidos com versão20261008-guided-proposal e marcadores novos. Checklist concluído, sem sessãoaluno real/IA paga/cadastroflag/DBprodução. Validação funcional em JSDOM com módulos reais + HTTP, homologação autenticada usuário. Registro final local evita redeploy só documental.

## 08/10 — Tutor sem ideias em proposta cadastrada
Marcus reportou Produção não encontrada após Estou sem ideias. Causa frontend verificável: seed tema/comando emnovo draft mas dirtyfalse, persist() não salva antes writing_guidance/history. Plano [ ] seed dirtytrue sem request imediato; [ ] regressão integrada save antes guidance e versão/id, falhasave impedeIA/preserva campos; [ ] editor/UI/HTTP/sintaxe; [ ] preview. Arquivos writing-editor.e12.js,index.html,tests/proposal-guided-writing.cjs,CONTINUIDADE.md. Database: nenhum impacto estrutural/configuração/remoteaçãoagente, gravação rascunho APIexistente somente aoagir usuário. Sembackend/env/domínio/produção/IApaga. Rollbackbd525b5.

Correção pronta: seed dirtytrue, abre sem save/IA imediatos, primeiro pedido salva novo rascunho e usa versão/id retornados. Regressão reproduz falhasave impedeIA e mantémtema/comando; retry salvo→tutor intentideas/reposta exibida/textopreservado PASS. Editor/UI/check51assets/HTTP/diffcheck PASS. Sem pedidos reais IA/auth/banco peloagente; previewempublicação.

Marcus pediu remover Organização por redundância método atual. Plano [ ] remover seletor/handler e hints causaefeito, manter content.mode anterior intocado; [ ] teste saveslegados preservam mode; [ ] publicação consolidada. Arquivos adicionais tests/writing-editor.cjs. Database: nenhum impacto.

Organização removida da UI e handlers/hints antigos, modelegado mantido noJSON. Teste rascunhocause-effect mantémmode após editar/salvar, seletor ausente PASS; demaisregressões/HTTP/check51assets PASS. Correção tutor comseed salva antesIA preservada.

Publicação concluída tutor+organização: remotob55aeee87247417c85b6b0ad3b377c52fe6dcc8d nasbranches trabalho, árvore2881cc195e915f9283c44b531d8f6f885d5c1989 igual local72d658c. Deploymentdpl_9wLK4VvZrwrmr7WDGFFLTMdbYUz3 READY/Preview/testproject/alias https://teste.versaoprofessor.com/ confirmados. Assetsindex/editor relidos cache20261008-guided-save-simple, seed dirtytrue e weModeausente. Testes simulados pertinentes PASS; IAreal não acionada e homologação autenticada pendente usuário. Sem banco/produção/créditos/env/backendalterados. Registro localfinal.

## 08/10 — Orientação primeiro bloco e seletor tema
Marcus pediu IA primeiro/sempre, explicação do tutor e foco ao pedir orientação; depois seletor no lugar escolhertema. Plano [ ] cartãoIA antes tema/planejamento sempre aberto comdescrição; [ ] pedidos e atalhos tutor chamamguide+scroll/foco acessível, loader/falha também cartão; [ ] seletor usando custom-selects existente, tema+eixo/comando preserva parágrafo; [ ] regressão ordem/foco/atalhos/seleção; [ ] HTTP/preview. Arquivos writing-editor.e12.js/css,index.html,tests/proposal-guided-writing.cjs,tests/writing-complete-ui.cjs,CONTINUIDADE.md. Database: nenhum impacto, apenas APIs já existentes no clique explícito usuário; sem IAreal agente/backend/env/domínio/produção. Risco cliqueatalho agora pedeIA imediatamente: indicar instrução naUI, manter bloqueioduplicidade. Rollbackb55aeee8.

Implementado primeirocartãoIA antes tema/planejamento, texto explica papel/aluno; pedidos via guide central focamheading e scroll com redução movimento respeitada, atalhosintent pedemdireto, sem duplicidade; orientação por etapa sobrevive rerender, erro junto resposta. Selecttema/eixo usa customselect existente, command/textpreservados, fallback/retry. PASS regressão integrada seletorcustomreal→atualização, rascunho savepreIA, falhasave; UIordem/foco/atalhoideas/etapas/autoria/XSS/retry; editor/select/check51assets/HTTP/diffcheck. Sem IAreal/banco peloagente. Previewempublicação.

Publicação concluída: remoto541bc826a534ed43abc18aa785e5a7871b8d8538 nasduasbranches, árvoref7c47a647604e8cc06ccb9672fec1e62b079f773 igual localccab288. Deploymentdpl_HshT42h4YpPwJzGXxqtd2zmjhtZP READY/Preview/testproject/alias https://teste.versaoprofessor.com/ confirmado. Assetsindex/editor/css relidos cache20261008-guidance-first, selector/focus e antigo botão ausente. Checklistconcluído; validado simulação+módulosreais/HTTP, sem login/IAreal e sem banco/produção. Registrofinal local.

## 08/10 — Pedido repertório/dúvida específica
Marcus pediu repertório por campo livre e resposta genérica. Readonlymetadata últimosrecibos17h33/17h32 intentideas/completed semsources confirma rota não pesquisa. Plano [ ] reconhecerpedido explícito repertório/fontes emdúvida, prevalece sobreintentanterior; [ ] promptrepertório sem instrução conflitanteintro; [ ] dúvida digitada priorizada, tema/plano/trecho específicos, sem inventardados; [ ] teste payloadpedidoexato e sourcesexibidas/intenttransition; [ ] check/HTTP/preview. Arquivos writing-support.e12.js,writing-editor.e12.js,index.html,tests/writing-complete-ui.cjs,tests/proposal-guided-writing.cjs,CONTINUIDADE.md. Database: nenhum impacto; search existente acionada sóclique usuário, sembackend/env/créditos/IArealagente. Risco detecção confundir pedidoavaliaçãorepertório: exigirverbos pedido explícito, testeavaliaçãopreserva analyse. Rollback541bc826.

Preparação concluída: intent detecta solicitação repertório/fontes/referências emdúvida explícita sobre fallbackideas/theme; analiserepertório permaneceanalyse. Prompt busca não adicionainterpretaçãointro; dúvida prioritária com pedido específico/contexto e açãoexecutável; defaults pedemtema/plano/trecho concreto sem inventardados/autoria. PASS UIfraseexata→repertoire/semintro/foco/linksfontes (simulados), dúvida específica semcomando genérico, demaisUI/editor/proposta/tutorbackend existente/check51assets/HTTP/diffcheck. Nenhum pedido IAreal, qualidade nova respostamodelo pendentehomologação. Semfunction compartilhada modificada. Previewempublicação.

Publicação concluída repertório/especificidade: remoto34220208abc4df4dfaeb4f2054abf6ce1fae1a4c nasduasbranches, árvoredc65791925932f9ee94e2ac66ccb44077589d321 igual locala71bc5a. Deploymentdpl_GtaEPe8JL4R6K56EdkQddCYbBmpB READY/Preview/testproject/alias https://teste.versaoprofessor.com/ confirmado. Index/support/editor relidos cache20261008-tutor-specific e intent/dúvida priorizada. Nenhuma IAreal acionada/function/db/produção modificada. Qualidade nova resposta real ainda será homologada pelo usuário; validação payload/provider simulado+HTTP concluída.

## 08/10 — Repertório evidence inválida / Orientação do tutor
Marcus mostrou falha trecho fiel ao pedir repertório por dúvida e aprovou nome sem personagem. Readonly recibo617bb70817h51 intentrepertoire failed/Evidênciainválida confirma rota agora correta, falha validação pósbusca. Baseline teacherAPI21 ACTIVE/JWTtrue/18files capturada. Plano [ ] renomear título/histórico frontend; [ ] candidate tutor22 somente writing-tutor.ts evidence schema enumempty para busca e textovazio, prompt específico fonte/pedido; [ ] manter validação literal/auditoria e fontesHTTPSconfirmadas; [ ] regressão semtexto/busca/schema inválido/unsafe/idempotência; [ ] publicar nome preview; [ ] pedir aprovação específica função compartilhada. Arquivos writing-editor.e12.js,index.html,backend/writing/prepared/writing-tutor.ts,tests/writing-tutor.cjs,tests/writing-complete-ui.cjs,CONTINUIDADE.md. Database sem tabelas/dados/migrations/RLS/Auth/créditos, função candidata ainda local; atualização teacherAPI21→22 afeta ambiente compartilhado se aprovada. Sem env/domínio/integração nova/modelo/tokens, frontend sóVercelteste. Rollbackrestaurar18files21/JWTtrue efrontend34220208. Sem IArealagente.

Candidato preparado/testado: schemaevidence enum[''] pararepertoire/textovazio, instruções específicasporintent, busca consideraquestion fornecida; validator/audit/fontesoriginais preservados. Baseline21capturada18files, candidato18files somente writing-tutor.ts diff. Testesmodelosimulados PASS repertoirecomtextoevazio/fontesHTTPS, schemaenumvazio, fonteausente falha seminventar, evidênciainválida seguebloqueadaantesaudit, respostaunsafe bloqueada, idempotência/metring. UI nome Orientação do tutor/histórico sempersonagem PASS; check51assets/HTTP/diffcheck PASS. Nada aplicadoao backend, novaIAreal não acionada. Nomefrontend em publicação, autorização função compartilhadapendente.

Nome publicado: remoto71b3d4b522e6cc177b23dd69c63064329798c4dc nasbranches, árvore6db353d9bcc4e6192964a0081c927bde78a49cdb igual localb06670e. Deploymentdpl_3TA5TDMnNcVMPwP8dmjF4JSEiaQc READY/Preview/testproject/alias https://teste.versaoprofessor.com/ confirmado; index/editor relidos cache20261008-tutor-name e Orientação do tutor/antigotítulo ausente. Somente frontendativo. Candidato function22 localtestado/preservadogit, teacherAPI21 real capturada18files permaneceinalterada; autorização final AGENTS12/14 pendente. Observação: erro conhecido Evidênciainválida identifica categoria validação, conteúdo descartado não permite comprovar qualtexto retornou; schemaenum evita citaçãoinadequada em busca/vazio sem relaxarvalidadores. IArealnova nãoacionada.

## 08/10 — Tema duplicado
Marcus mostrou campoTema + selectTema disponível duplicados. Plano [ ] seletor Tema com Tema livre; [ ] textarea apenaslivre ou atividadeprofessor (semselector); [ ] falhacarregamento mantémediçãolivre; [ ] seleção+trocaetapa preservatexto/plano/comando; [ ] testes/HTTP/preview. Arquivos writing-editor.e12.js,index.html,tests/proposal-guided-writing.cjs,tests/writing-complete-ui.cjs,CONTINUIDADE.md. Database: nenhum impacto. Risco escondertema manualnão presenteemlista: mostrartextarea no fallback; sembackend/env/domínio/produção. Rollback71b3d4b5. Correçãotutor22 seguependentedeautorização específica, não confundir com pedidoUI.

Arquivo adicional writing-editor.e12.css: regra scopedhidden impõe displaynone sobre fieldflex existente; seletor no mesmo blocoTema/botãoEntender, textarea condicionalabaixo sóLivre. TesteCSScomputed confirma campo ausente visualmente para cadastrado.

Temaúnico implementado, livrecondicional, atividadefixa mantém campo único e sem seletor. PASS UI/seleçãocustom/temaoculto CSS/temalivre/parágrafopreservado/atividades/editor/check51assets/HTTP/diffcheck. Nenhum backendalterado/correçãotutor22 aindaaguarda autorização. Publicação previewem andamento.


## 08/10 — Tutor unificado aprovado
Marcus aprovou mockup: Apoio+Tutor+resposta emumcartão, Histórico com Orientações anteriores/Comparar versões e explicações. Plano [ ] consolidar primeirocard sempre; [ ] preservar abas/atalhos/dúvida/foco/resposta/autoria; [ ] histórico recolhido com duas ações e descrição; [ ] testes/HTTP/preview oficial. Arquivos writing-editor.e12.js/css,index.html,tests/writing-complete-ui.cjs,CONTINUIDADE.md. Database: nenhum impacto; sem backend/env/Auth/créditos/IAreal/produção. Worktreeisolada305cd0c mantém candidaturas backend/envioinstitucional1294737 separadas, ainda pendentes. Risco etaparesposta/histórico mitigado snapshots etapa e testes; rollback970945.

Tutorúnico implementado primeirocard: abasapoio+atalhos+dúvida+resposta+histórico no mesmo cartão; Histórico recolhido com ações Orientações anteriores/Comparar versões e descrições; comparação e comments professor preservados. Token histórico impede resposta tardia emetapa/painel errado. PASS UIguiada/foco/resposta/texto/autoria/XSS/histórico separado/compare, propostaeditor/customselect/editorpreservação,check51assets/HTTP51assets/diffcheck. Browser screenshot local indisponível (Chromium não instalado); não alegar inspeção visual real. CSSresponsivo320/390 porgrid2/sem controles nativos. SemIAreal/backend/cadastro/créditos/produção. Previewempublicação.
