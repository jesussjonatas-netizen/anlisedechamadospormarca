# Análise de Chamados por Marca

Prompt para o Lovable — Dashboard "Auditoria de Devoluções"

Copie e cole o texto abaixo no Lovable.

Crie um dashboard web chamado "Auditoria de Devoluções", para a Rede Ancora, que consome dados da planilha "Auditoria - BR (HD)", aba "SOLICITAÇÕES" (conectar via Google Sheets API ou upload/import de planilha, com atualização automática dos dados).

1. Identidade visual

Fundo geral em azul marinho escuro (#0D1B3E aproximadamente), com cards e painéis em um tom levemente mais claro de azul marinho (#12234F), bordas sutis em azul mais claro.

Cabeçalhos de seções (faixas) em azul um pouco mais vivo (#16295C), texto branco em caixa alta e negrito.

Logo circular vermelho (placeholder "Rede Ancora") no canto superior esquerdo.

Cor de destaque/ação principal: vermelho (#E30613), usado no item de menu ativo e botões primários.

Cores de status (usar em todos os gráficos, badges e tabelas, sempre as mesmas):

Pago → azul (#3B6FE0)

Reprovado → vermelho (#E63946)

Aprovado → verde (#2ECC71)

Aguardando pagamento → laranja (#F5A623)

Revisão necessária → roxo (#9B59B6)

Tipografia sem serifa, títulos em negrito, números grandes e destacados nos cards de KPI.

Layout responsivo, mas com prioridade para desktop/telão (uso interno de gestão).

2. Estrutura da tela

Cabeçalho

Título "AUDITORIA DE DEVOLUÇÕES" e subtítulo "REDE ANCORA".

Filtros rápidos no canto superior direito: Ano (dropdown, valores extraídos da planilha) e Período (dropdown: Todos, ou intervalo customizado via ícone de calendário).

Menu lateral esquerdo

Itens de navegação: Visão Geral (ativo, com destaque vermelho) e Detalhamento de Chamados.

Bloco FILTROS, com dropdowns (multi-seleção quando fizer sentido), populados dinamicamente a partir dos valores únicos da aba "SOLICITAÇÕES":

CD

Região

Conferente de Expedição

Modalidade

Tipo

Status

Cliente

Causa Raiz

Data de entrada (intervalo de datas)

Botão "Limpar Filtros" ao final, que reseta todos os filtros para "Todos".

Importante — comportamento dos filtros: todos os filtros (cabeçalho + laterais) devem ser interdependentes: ao selecionar um valor em qualquer filtro, os demais filtros devem recalcular e mostrar apenas as opções ainda disponíveis dentro do subconjunto de dados já filtrado, e todos os cards, gráficos e tabelas da tela devem ser atualizados em tempo real, refletindo o cruzamento de todos os filtros ativos simultaneamente (comportamento de dashboard interativo tipo BI, semelhante a Power BI/Looker).

Seção "Auditoria de Chamados" (cards de KPI, topo da área principal)

Sete cards lado a lado, cada um com ícone, título e valor grande:

Total de Chamados Analisados — contagem total de linhas filtradas

Valor Total Analisado — soma do campo Valor, formatado em R$

Reprovado — contagem + % sobre o total filtrado

Aprovado — contagem + % sobre o total filtrado

Pago — contagem + % sobre o total filtrado

Aguardando Pagamento — contagem + % sobre o total filtrado

Revisão Necessária — contagem + % sobre o total filtrado

Cada card usa a cor de status correspondente na borda/ícone.

Gráfico "Distribuição por Status"

Gráfico de rosca (donut chart) mostrando a proporção de chamados por Status, com legenda lateral (Pago, Reprovado, Aprovado, Aguardando pagamento, Revisão necessária) e percentuais sobre as fatias.

Cores conforme padrão de status definido acima.

Gráfico "Valor por Status"

Gráfico de barras horizontais mostrando a soma do Valor por Status (Pago, Reprovado, Aguardando pagamento, Revisão necessária, Aprovado), com o valor em R$ ao lado de cada barra.

Tabela "Aprovados por CD"

Colunas: CD | Qnt. Cham. | Valor | %

Uma linha por CD (Centro de Distribuição), somente considerando os chamados com status Aprovado, dentro do filtro atual.

Linha final "Total Geral" com soma de todas as colunas.

Tabela "Detalhamento de Chamados"

Colunas: Id Portal | NFD | Cliente | Região | CD | NF | Valor | Modalidade | Tipo | Causa Raiz | OBS Reprovação/Aprovação

Lista todos os registros que atendem aos filtros ativos, com paginação ou rolagem.

Ordenação clicável por coluna.

3. Exportação para Excel

Adicionar um botão "Baixar Excel" (ícone de download), visível no topo do dashboard.

Ao clicar, deve gerar e baixar um arquivo .xlsx contendo exatamente os dados filtrados no momento do clique (respeitando todos os filtros ativos), não a base completa.

O arquivo exportado deve manter os mesmos nomes de colunas da tabela "Detalhamento de Chamados".

4. Rodapé

Canto inferior esquerdo: nota discreta (fonte pequena, cor cinza-azulada) com o texto: "Fonte: Sistema HD - Rede Ancora | Dados extraídos do B2B. Valores exibidos sem impostos, podendo apresentar variações."

Canto inferior direito: "Última atualização: [data/hora]", com um ícone de refresh, exibindo automaticamente a data/hora em que os dados foram sincronizados pela última vez a partir da planilha (não fixo, deve atualizar conforme nova sincronização).

5. Regras gerais

Todos os números e percentuais devem ser calculados dinamicamente a partir dos dados da planilha, nunca fixos/mockados.

Manter consistência de cores de status em todos os componentes (cards, gráfico de rosca, gráfico de barras, badges de tabela).

Estado vazio: se um filtro resultar em nenhum dado, exibir mensagem amigável ao invés de tela em branco.

Performance: carregar os dados uma vez e aplicar os filtros no client-side (ou via query eficiente), para que a interação entre filtros seja instantânea.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://anlisedechamadospormarca.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b10af800-6843-4ea6-a71c-c4b00f6e4e62).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
