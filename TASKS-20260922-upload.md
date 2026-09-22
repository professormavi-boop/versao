# Upload do aluno — correção resiliente (22/09/2026)

Branch: `fix/student-upload-reconcile-20260922`

Diagnóstico observado em produção, sem alterar backend:
- a interface exibiu “Não foi possível conectar ao servidor” durante o envio;
- o banco registrou a redação e o arquivo, com status `awaiting_approval`;
- portanto há um falso negativo no cliente quando a resposta de rede falha depois de o servidor já ter concluído a operação.

Evidência do caso reportado:
- aluna: Giovanna Mara Canil Michelin;
- rodada 1: “Distância entre direito e realidade no acesso à documentação civil por pessoas em situação de rua no Brasil”;
- arquivo PDF salvo com 111.522 bytes;
- status no banco: `awaiting_approval` às 17:53:58 (horário de Brasília).

## Tarefas

- [x] Tornar o envio por arquivo resiliente a resposta perdida após gravação.
- [x] Após falha de upload/finalização, consultar o estado da proposta antes de exibir erro.
- [x] Se houver arquivo salvo e ainda não finalizado, repetir somente a finalização.
- [x] Se o estado já estiver finalizado, tratar como sucesso e não pedir novo upload.
- [x] Manter backend, schema e permissões inalterados.
- [ ] Rodar `node scripts/check.cjs` e checagem sintática do módulo — pendente porque o conector não monta o branch no ambiente local; não considerar validação funcional concluída por esse motivo.
- [x] Publicar apenas em ambiente/preview de teste; não promover produção.
- [x] Registrar limitações, commit e link de teste.

## Implementação

Commit de código: `33dae3f43b50e9ecad3e3597fd799b009dbeeae7`.

O cliente agora registra o estado anterior da redação antes do upload. Se houver falha ambígua de rede depois do envio, ele consulta novamente o estado no servidor. Só considera sucesso quando detecta mudança real do arquivo ou mudança de status. Se o arquivo foi gravado mas a finalização não foi confirmada, repete apenas a finalização. Isso evita tanto o falso erro quanto a confirmação indevida de um arquivo antigo.

## Preview de teste

Deployment: `dpl_F5UBXfCgzZr9Rpdsq2uCjPxu7p4W` — READY.
Projeto isolado: `versao-teste-etapa12-consolidada`.
Branch: `fix/student-upload-reconcile-20260922`.

URL do preview: `https://versao-teste-etapa12-consolidada-git-e41364-professormavi-6775.vercel.app`

Produção não foi promovida. O projeto de produção recebeu somente preview da branch (`target: null`), sem alteração do alias de produção.
