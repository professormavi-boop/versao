# Ao Vivo — proposta de implementação

Status: prévia de interface, sem backend ativo. Nenhuma migration executada.

## Experiência
Ao Vivo é a ferramenta avulsa do professor: foto, imagem, PDF, DOCX ou texto colado; nome opcional; tema fornecido ou sugerido pela IA e confirmado; correção, revisão e histórico. A ferramenta vinculada passa a se chamar Receber redações, mantendo rota/vínculos atuais. O destaque Ao Vivo precisa estar disponível também na primeira entrada, antes de cadastrar escola/alunos. Hoje a inicial encaminha contas sem alunos à importação: na integração real, trocar esse encaminhamento por uma escolha entre Ao Vivo e organizar turmas, sem esconder o onboarding existente.

A prévia é independente e não altera index.html nem navegação publicada. Não simula processamento como se fosse real: sugestão de tema é explicitamente exemplo; correção permanece desativada. Formato Word inicial: DOCX, não DOC com macros nem qualquer arquivo arbitrário. Limite proposto 15 MB; limite definitivo de páginas/tamanho extraído deve ser aprovado antes do backend.

## Evidência do banco atual
Consulta somente de metadados, em 01/10/2026: submissions exige project_id e student_id; arquivos vinculam submission_id; ai_correction_jobs admite submission_id nulo, mas isso não prova que handlers aceitem ausência; correction_credit_reservations exige submission_id. Portanto não basta liberar os selects ou inserir um job sem vínculo. Não alterar esses requisitos para a primeira versão, pois relatórios e permissões atuais dependem deles.

## Modelo recomendado
Tabelas separadas, com nomes provisórios:

| Entidade | Conteúdo e relações |
|---|---|
| teacher_live_essays | id, teacher_id → profiles, student_label opcional, source_kind, título opcional, status, created_at, updated_at. Sem escola/turma/aluno obrigatório. |
| teacher_live_files | id, essay_id, storage_path, MIME validado, tamanho, hash, número de página, tipo original/normalizado. Caminho privado por professor e redação. |
| teacher_live_theme_versions | id, essay_id, tema/enunciado original quando fornecido, sugestão, recorte confirmado, origem informada/inferida, confirmed_by, confirmed_at. Alteração cria versão. |
| teacher_live_jobs | id, essay_id, theme_version_id, request_id único, status, resultado, erro, tempos, protocolo/modelo. Resultado anterior preservado ao refazer. |
| teacher_live_reviews | essay_id, job_id, versão da revisão, notas e comentários finais, reviewed_by/at. Separar resultado preliminar da revisão do professor. |
| teacher_live_credit_reservations | request_id único, teacher_id, job_id, units, status reservado/consumido/estornado, timestamps. Integrar ao saldo existente via transação; não criar uma segunda carteira. |

Começar separado reduz risco nas turmas; reaproveitar funções de cálculo/prompt, não presumir compatibilidade de endpoints atuais. Antes de migration: revisar FKs, índices, triggers, permissões e RPCs de débito existentes. Não criar escolas/alunos falsos. Futuro vínculo com aluno cadastrado será explícito, validado por propriedade e sem duplicar cobrança.

## Arquivos, segurança e retenção
Bucket privado, URLs assinadas curtas após autorização; arquivo nunca público. RLS por teacher_id = auth.uid() e verificação do papel/aprovação no backend. Filhos autorizados via proprietário da redação. SELECT/INSERT/UPDATE/DELETE com condições específicas; não permitir trocar proprietário. Professor não pode escrever resultado de IA/status/cobrança diretamente; serviços autenticados validam ação e posse. Nunca confiar em teacher_id recebido do navegador ou em user_metadata como autorização.

Validar assinatura/MIME, extensão e tamanho no servidor. DOCX: extrair texto sem executar macros, com limite de descompactação e tempo; PDF: contagem de páginas, conteúdo extraível e OCR quando necessário. Preservar original; texto colado vira artefato privado normalizado. Limitar imagens, tamanho de texto e páginas antes da IA. Não armazenar binários no Postgres. Retenção e exclusão precisam de política: remover arquivo e conteúdo quando solicitado, mantendo somente o registro financeiro mínimo necessário conforme política aprovada.

## Tema e C2
Tema informado: avaliar em relação ao enunciado fornecido. Tema inferido: salvar a sugestão e o recorte confirmado, com aviso permanente de que não permite aferir atendimento à proposta original. Inferir do texto não comprova ausência de fuga ao tema. Sugestão é editável e exige confirmação antes da correção. Mudança de tema depois de corrigir gera nova versão e exige nova confirmação; nunca alterar silenciosamente o parâmetro de uma correção já feita.

## Processamento e créditos
Rascunho → arquivo validado → identificação do tema (se solicitada) → confirmação → reserva de crédito → fila → processamento → pronto para revisão → revisado. Falhas transitórias e cancelamentos tratados explicitamente. UI pode sair e retomar pelo id.

request_id idempotente e trava por redação/versão impedem débito duplo; consumo/estorno via RPC transacional, não por lógica do navegador. Confirmar saldo antes de iniciar. Identificação do tema também custa IA: definir orçamento e política (incluída na correção ou debitada separadamente), informar antes de chamar e limitar tentativas. A prévia não anuncia preço. Reprocessamento preserva análise anterior e requer confirmação de custo. Não prometer resultado instantâneo; mostrar estados reais e tempo decorrido.

## Integração e validação antes de ativar
1. Revisar serviços atuais de correção/carteira e capacidade de Edge Functions; decidir endpoint próprio ou ação dedicada preservando contratos existentes.
2. Implementar migrations e handlers em ambiente isolado com massa fictícia; validar dois professores sem acesso cruzado e ausência de leitura anônima.
3. Testar foto/PDF/DOCX/texto, arquivo inválido/oversized, tema e revisão, idempotência, falha/estorno, navegação durante processamento e exclusão.
4. Integrar inicial/menu: Ao Vivo com câmera; Receber redações conserva ferramenta atual. Novo professor acessa Ao Vivo sem escola; histórico separado.
5. Homologar mobile/desktop real. Pedir autorização de ativação produtiva depois do resultado concreto.

Rollback: desabilitar entrada Ao Vivo e restaurar rótulo/fluxo anterior; preservar novas redações privadas e ledger para consulta/recuperação. Não apagar dados nem desfazer créditos por rollback de interface.
