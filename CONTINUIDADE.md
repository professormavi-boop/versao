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
Não foi concluída a validação em navegador nem uma nova implantação nesta conversa.
A tentativa anterior de ferramenta de deploy foi rejeitada na validação de argumentos; não há deployment novo confirmado por ela.
Não houve alteração de produção nem chamada paga de IA nesta recuperação.

## Próxima execução — checklist rastreável

- [ ] Conferir HEAD e ler AGENTS.md; criar branch de trabalho a partir desta main.
- [ ] Servir via HTTP e validar desktop/mobile, CSS e logo no navegador.
- [ ] Validar login, refresh, falha de sessão e logout; usar conta autorizada, nunca inventar credenciais ou burlar autenticação.
- [ ] Validar Propostas, Gestão, Ao Vivo, Ranking e área do aluno; preservar bloqueio de gravações.
- [ ] Validar Colar da IA com correção existente e proteção contra cobrança duplicada.
- [ ] Confirmar o contrato real da ai-correction-api por leitura; não modificar o backend compartilhado.
- [ ] Conferir vínculo do projeto de TESTE e publicar o pacote completo, sem loader/proxy/arquivos parciais.
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
