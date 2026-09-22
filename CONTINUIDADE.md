# VERSÃO — continuidade da Etapa 12

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
