# Upload do aluno — correção resiliente (22/09/2026)

Branch: `fix/student-upload-reconcile-20260922`

Diagnóstico observado em produção, sem alterar backend:
- a interface exibiu “Não foi possível conectar ao servidor” durante o envio;
- o banco registrou a redação e o arquivo, com status `awaiting_approval`;
- portanto há um falso negativo no cliente quando a resposta de rede falha depois de o servidor já ter concluído a operação.

## Tarefas

- [ ] Tornar o envio por arquivo resiliente a resposta perdida após gravação.
- [ ] Após falha de upload/finalização, consultar o estado da proposta antes de exibir erro.
- [ ] Se houver arquivo salvo e ainda não finalizado, repetir somente a finalização.
- [ ] Se o estado já estiver finalizado, tratar como sucesso e não pedir novo upload.
- [ ] Manter backend, schema e permissões inalterados.
- [ ] Rodar `node scripts/check.cjs` e checagem sintática do módulo.
- [ ] Publicar apenas em ambiente/preview de teste; não promover produção.
- [ ] Registrar limitações, commit e link de teste.
