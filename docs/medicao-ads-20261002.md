# Medição de cadastro — candidata em teste, 02/10/2026

Base: c49ea23e6835db4224bf3a860e603aa9d28ad725.
Branch de trabalho: fix/ads-cadastro-atribuicao-20261002.

## Escopo aprovado
- [x] Aplicar textos e quatro contextos docentes nos dois anúncios existentes.
- [x] Preservar orçamento total de R$ 100, datas 03–04/10, imagens, destinos e lance.
- [x] Preservar atribuição nos redirecionamentos Google sem mudar PKCE.
- [x] Unificar envio de cadastro por e-mail e Google, sem dependência no login.
- [x] Distinguir conversão aceita, ausência de chave, falha e teste.
- [x] Não emitir eventos reais a partir de preview/testes.
- [x] Testes de regressão isolados, sem gravações no Supabase.
- [ ] Publicar apenas branch/preview; produção NÃO autorizada.

Database: nenhum impacto (sem migrations, RLS, Auth settings, dados, RPCs, triggers, Storage ou Edge Functions). A candidata usa apenas consultas autenticadas de verificação no endpoint server-side; nesta sessão, todas simuladas.

Arquivos runtime previstos: funnel-analytics.js, google-auth.e12.js, cadastro-professor.html, api/openai-conversion.js. Sem novo arquivo runtime, sem alterações em core, boot, CSS ou lista de scripts do login.

Risco principal: perder atribuição durante o OAuth ou interferir na finalização do cadastro. Mitigação: lista estrita de campos, PKCE preservado, telemetria independente e tolerante a falhas, nenhuma dependência nova no boot.

Rollback: descartar a branch de teste. Uma eventual publicação exigirá nova autorização, teste autenticado e verificação das credenciais server-side; esta entrega não promove nem reconfigura produção.

## Resultado local

25 testes aprovados; 0 falhas. Comando: `node --test tests/ads-measurement.cjs`.
Os testes usam Node 22, contexto JavaScript isolado, DOM simulado, rede simulada e servidor HTTP local. Nenhum acesso a Google/Supabase/Ads real foi executado pelos testes. Não equivale a login autenticado em navegador real nem a recebimento confirmado no Ads Manager. A suíte histórica completa com jsdom não foi executada: dependência indisponível e rede do container sem resolução DNS externa.

### Alterações implementadas na candidata
- Preservação das UTMs e `oppref` na passagem do domínio comercial para o aplicativo e durante PKCE, sem mudar o callback autorizado ou o algoritmo PKCE.
- Parâmetros arbitrários, códigos OAuth, tokens e e-mails não são propagados como atribuição.
- Atribuição parcial da mesma campanha não perde a referência; troca de campanha/identificador abandona a referência antiga.
- Uma função de envio compartilhada por cadastro com senha e Google, com deduplicação em voo e confirmação de aceitação antes de marcar sucesso.
- Cadastro por Google de usuário existente não é contado como cadastro novo; cadastro incompleto usa o evento existente após a conclusão. Não há alteração no boot.
- Endpoint verifica a sessão autenticada e lê somente id, papel e aprovação do perfil. Aceita somente perfil teacher aprovado e conta criada nas últimas 24h. Isso é verificação do perfil no aplicativo, não comprovação da profissão da pessoa.
- A chave da API de conversões permanece somente no servidor. Nenhuma nova coleta de e-mail, nome, telefone ou correspondência avançada foi adicionada.
- O envio é limitado a cadastros com referência de clique real; cadastro orgânico não recebe referência inventada.
- Preview, host não produtivo e `versao_test=1` não disparam eventos reais nesta instrumentação. O endpoint protege previews mesmo quando tenham variáveis de ambiente copiadas.
- Ausência de credenciais retorna erro de configuração; rejeição/timeout retorna falha, não sucesso silencioso.
- HTML visual, logo, CSS, formulário, validações de senha, CAPTCHA, chamadas de criação de conta, core e boot preservados. Não há novo arquivo JavaScript em tempo de carregamento.

### Limitações que permanecem antes de produção
- Credenciais OPENAI_ADS_PIXEL_ID e OPENAI_ADS_CONVERSIONS_API_KEY existentes não foram lidas nem alteradas e não tiveram validade comprovada.
- Falta homologação com autenticação real autorizada (senha e Google) e envio de validação sem contabilização de lead. O teste local de API usa respostas simuladas.
- Falhas de transporte permitem repetição explícita com o mesmo ID. Não foi adicionado serviço de fila persistente nem tarefa em segundo plano.
- A janela defensiva de 24h não conta conclusão de cadastro antigo como nova aquisição.
- A página legada de confirmação de e-mail não foi modificada; seu Pixel preexistente não foi habilitado nem homologado aqui. O fluxo atual de cadastro é direto.
- O status accepted significa aceitação HTTP da API, não atribuição confirmada nem lead qualificado por profissão.
- A campanha de fim de semana não recebeu alteração de status, orçamento, lance, destino ou datas. Textos revisados podem passar por nova análise de anúncio.

## Evidências e limites de publicação

Arquivos modificados: `funnel-analytics.js`, `google-auth.e12.js`, `cadastro-professor.html`, `api/openai-conversion.js`.
Arquivos novos, sem carregamento no aplicativo: `tests/ads-measurement.cjs` e este documento.
A `.vercelignore` da base já inclui os quatro arquivos runtime (inclusive `api/**`). Nenhuma alteração da allowlist foi necessária.
Rollback desta candidata: descartar a branch/preview. Não executar rollback em produção porque ela não foi alterada por esta tarefa.
Antes de publicar, comparar novamente com a main atual, testar a integração autorizada e solicitar autorização explícita do usuário. Não fazer merge automático.

Referência técnica consultada em 02/10/2026: https://developers.openai.com/ads/conversions-api (evento registration_completed, envio server-side, deduplicação por ID e validate_only).
