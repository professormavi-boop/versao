# Padrão permanente de interface VERSÃO

Referência aprovada em01/10/2026: tela Propostas após os ajustes. Fonte visual: proposal-approved-v3.css. Aplicar em novas telas e revisões; preservar comportamentos já homologados.

## Menus
Menu lateral: agrupar funcionalidades relacionadas com summary/details e filhos claros. Ao Vivo: Nova redação, Atividades e Histórico; aluno possui entradas separadas Corrigir e Escrita guiada, com ícones de traço; Temas, Redações e Evolução mantêm nomes curtos. Dentro de Corrigir: Enviar, Histórico e Créditos. Aprovação Marcus08/10.
Menu interno: abas em um único contêiner claro #fffafa, borda #e8d9d6, raio16px, padding4px e gap4px. Botões com raio12px, altura mínima54px e peso800. Selecionado vermelho #8b1c1c, texto branco e sombra discreta; inativo fundo transparente/texto vermelho. Usar aria-current e foco visível. Nomes curtos: Atividades e Histórico, sem Minhas ou Ao vivo repetidos. Implementação em teacher-live.e12.css/.js e core.e12.js.

## Exibição
Propostas é o padrão: cartões brancos arredondados, título destacado, informações secundárias com contraste discreto, etiquetas de classificação/status e ações separadas ao final. Não transformar títulos e parágrafos inteiros em botões. Separar nome, tema, escola, data e ações. Campos em largura disponível, rótulos acima; espaçamento consistente. Listas/tabelas devem adaptar-se ao celular sem rolagem horizontal.

## Ações e estados
Ação principal em vermelho; secundárias claras com borda suave. Edição explícita após salvar. Salvar só com alterações; impedir repetição enquanto processa. Excluir com confirmação inline e consequência clara. Mensagens junto ao contexto. Durante IA, loader e atualização automática. Checks grandes e claramente visíveis. Nunca controles nativos alert/confirm/prompt/select na interface principal.

## Reutilização
Consultar este arquivo e os seletores aprovados antes de alterar CSS. Corrigir o componente existente, sem sobreposições sucessivas ou handlers duplicados. Validar seleção das abas, foco, nomes longos e larguras320/390/768/1200px quando o layout mudar. Novas propostas de design dependem de solicitação do usuário.
