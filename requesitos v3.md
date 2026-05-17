# Advocatos — Requisitos e Funcionalidades
 
**Aplicação de Contabilidade para Advogados**
Versão 1.0 · Maio 2026
 
---
 
## 1. Stack técnica
 
| Componente | Tecnologia | Notas |
|---|---|---|
| Frontend | Svelte + Vite | Interface de utilizador |
| Desktop runtime | Tauri v2 (Rust) | Windows e macOS |
| Base de dados | SQLite | Ficheiro local, sem servidor |
| Monitorização de ficheiros | tauri-plugin-fs (watch API) | Cross-platform nativo |
| Plataformas alvo | Windows 10+ e macOS 12+ | Builds separados por SO |
 
> **Nota sobre o SQLite:** sendo uma base de dados de ficheiro único, a aplicação é totalmente standalone. Todos os dados são guardados num ficheiro `.db` local. Para backup, basta copiar o ficheiro. Este modelo simplifica significativamente a instalação e distribuição da aplicação.
 
---
 
## 2. Visão geral da aplicação
 
A Advocatos é uma aplicação desktop para advogados que monitoriza automaticamente o tempo de abertura de ficheiros de clientes e calcula o valor a faturar com base em regras de preço definidas pelo utilizador. Toda a análise ocorre dentro da própria aplicação, sem exportação de documentos.
 
O utilizador define uma pasta raiz que contém os ficheiros dos seus clientes. A aplicação deteta, em tempo real, quando cada ficheiro é aberto e fechado, registando a duração de cada sessão de trabalho. Com base no nome do ficheiro e nas regras configuradas, o sistema calcula automaticamente o valor correspondente.
 
---
 
## 3. Estrutura de navegação
 
A aplicação organiza-se numa barra lateral de navegação permanente, com dois grupos funcionais e um acesso às definições no rodapé da barra.
 
### 3.1 Grupo Principal
 
- Dashboard
- Clientes
- Monitorização
### 3.2 Grupo Faturação
 
- Regras de preço
- Cobranças
- Análise
### 3.3 Acesso global (rodapé da barra lateral)
 
- Definições
A barra de topo, presente em todos os ecrãs, disponibiliza um único controlo global: o botão de configuração da pasta raiz.
 
---
 
## 4. Ecrã: Dashboard
 
Ecrã inicial da aplicação. Apresenta uma visão geral permanente do estado atual da atividade — sem filtro de período, refletindo sempre os dados acumulados até ao momento.
 
### 4.1 Métricas de resumo
 
Quatro indicadores em destaque no topo do ecrã, ordenados por prioridade:
 
- **Total por cobrar** — valor acumulado de todo o trabalho ainda não marcado como cobrado, desde sempre (métrica principal)
- **Ficheiros em curso** — número de ficheiros atualmente abertos com sessão ativa
- **Total cobrado este mês** — valor já marcado como cobrado no mês civil atual
- **Horas trabalhadas este mês** — tempo total registado no mês civil atual
### 4.2 Atividade recente
 
Lista das sessões de trabalho mais recentes, com as seguintes colunas por entrada:
 
- Nome do ficheiro
- Cliente associado (detetado pela estrutura de pastas)
- Duração da sessão
- Valor calculado para a sessão
- Estado de cobrança (por cobrar / cobrado)
- Estado da sessão (aberto ou fechado)
Os ficheiros com sessão ativa são sinalizados como estando em curso. Os ficheiros por cobrar são destacados para chamar a atenção do utilizador.
 
---
 
## 5. Ecrã: Clientes
 
Lista de todos os clientes detetados automaticamente a partir da estrutura de subpastas dentro da pasta raiz. Cada subpasta de primeiro nível é interpretada como um cliente.
 
### 5.1 Lista de clientes
 
- Campo de pesquisa por nome de cliente
- Cada entrada mostra: nome do cliente, número total de ficheiros registados, valor total acumulado, e valor por cobrar em destaque
- Ao selecionar um cliente, abre o ecrã de detalhe do cliente
### 5.2 Detalhe do cliente
 
Ecrã de detalhe (acedido ao clicar num cliente) com:
 
- Lista de todos os ficheiros do cliente
- Histórico de sessões por ficheiro (data, hora de início, hora de fim, duração, valor)
- Totais agregados por ficheiro e totais gerais do cliente
- Tipo de documento detetado para cada ficheiro (com base nas regras de preço)
- Indicação por ficheiro de se o valor já foi cobrado ou ainda está por cobrar
- Possibilidade de corrigir o número de horas de qualquer sessão (ver secção 6.4)
---
 
## 6. Ecrã: Monitorização
 
Ecrã de controlo em tempo real da monitorização de ficheiros.
 
### 6.1 Estado da monitorização
 
Indicador de estado no topo do ecrã com:
 
- Estado atual: a monitorizar / pausado / erro
- Caminho da pasta raiz que está a ser vigiada
- Botão para pausar ou retomar a monitorização
### 6.2 Tabela de ficheiros
 
Lista de todos os ficheiros com atividade registada, com as seguintes colunas:
 
- Nome do ficheiro
- Cliente (subpasta de origem)
- Tipo de documento detetado e regra de preço aplicada
- Duração da sessão atual (contador em direto, para ficheiros abertos)
- Tempo total acumulado no dia
- Estado (aberto ou fechado)
### 6.3 Comportamento da monitorização
 
A monitorização funciona em segundo plano e não interfere com o trabalho do utilizador. O sistema deteta a abertura e fecho de ficheiros através do File System Watcher nativo do sistema operativo:
 
- No macOS: usa FSEvents (API nativa da Apple)
- No Windows: usa ReadDirectoryChangesW (API nativa da Microsoft)
- Ambos os mecanismos são abstraídos pelo tauri-plugin-fs, sem necessidade de código específico por plataforma
O sistema inclui deteção de inatividade: se um ficheiro estiver aberto mas sem atividade detetada durante um período configurável, o contador é automaticamente pausado. Este limiar é configurável em Definições.
 
> **Nota técnica:** o File System Watcher deteta eventos de acesso a ficheiros (abertura, modificação, fecho). A medição do tempo de trabalho é calculada pela aplicação com base nesses eventos, e não é uma funcionalidade nativa do sistema de ficheiros.
 
### 6.4 Correção manual de horas
 
O advogado pode corrigir o tempo registado em qualquer sessão, diretamente na tabela de ficheiros (ecrã de Monitorização) ou no histórico de sessões do detalhe de cliente (ecrã de Clientes).
 
**Acesso à correção:**
- Na tabela de ficheiros, cada linha tem um botão de edição que abre o painel de correção
- No detalhe do cliente, cada sessão no histórico tem igualmente um botão de edição
**O que é possível corrigir:**
- Hora de início da sessão
- Hora de fim da sessão
- Duração total da sessão diretamente (em horas e minutos), sem necessidade de ajustar início e fim
Se o utilizador alterar a duração diretamente, a hora de fim é recalculada automaticamente a partir da hora de início. Se alterar a hora de início ou fim, a duração é recalculada. Os três campos estão sincronizados.
 
**Efeitos da correção:**
- O valor calculado para a sessão é atualizado imediatamente com base na nova duração e na regra de preço aplicada
- O total do ficheiro e o total por cobrar do cliente são recalculados em cascata
- A correção fica registada na base de dados com a data e hora em que foi feita, preservando também os valores originais para auditoria
A correção de horas é distinta do ajuste de valores disponível no ecrã de Cobranças: aqui altera-se o tempo efetivamente registado, ali ajusta-se o valor a cobrar sem modificar o registo de tempo.
 
---
 
## 7. Ecrã: Regras de preço
 
Ecrã de configuração das regras que determinam como cada ficheiro é valorizado. O utilizador define palavras-chave que são comparadas com o nome dos ficheiros detetados.
 
### 7.1 Lista de regras
 
Cada regra é composta por:
 
- **Palavra-chave** — texto a pesquisar no nome do ficheiro (exemplo: `procuracao`, `contrato`, `parecer`)
- **Tipo de valorização** — por hora ou valor fixo
- **Valor** — montante por hora (€/h) ou valor fixo (€)
Ações disponíveis por regra: editar e eliminar.
 
### 7.2 Tarifa padrão
 
Regra especial que se aplica a todos os ficheiros que não correspondam a nenhuma das palavras-chave definidas. Pode ser configurada como valor por hora ou valor fixo. Garante que nenhum ficheiro fica sem valorização.
 
### 7.3 Lógica de correspondência
 
- A comparação é feita sobre o nome do ficheiro, sem distinção entre maiúsculas e minúsculas
- Se um ficheiro corresponder a mais do que uma regra, aplica-se a regra com maior prioridade (a ordem na lista determina a prioridade)
- O utilizador pode reordenar as regras para controlar a prioridade
- Ficheiros sem correspondência são valorizados pela tarifa padrão
### 7.4 Adicionar nova regra
 
Botão no fundo da lista que abre um formulário para criação de uma nova regra, com os campos: palavra-chave, tipo de valorização e valor.
 
---
 
## 8. Ecrã: Cobranças
 
Ecrã dedicado à gestão de cobranças. Permite ao utilizador selecionar quais os ficheiros ou clientes a marcar como cobrados, ajustar os valores a cobrar, consultar um resumo do valor final, e fazer o reset do contador de valor por cobrar.
 
### 8.1 Seleção de itens a cobrar
 
O ecrã divide-se em dois modos de seleção, alternados por duas abas no topo:
 
**Aba "Por ficheiro"**
- Lista todos os ficheiros com valor por cobrar, agrupados por cliente
- Cada linha mostra: nome do ficheiro, cliente, horas acumuladas (não cobradas), valor base calculado, ajuste aplicado, e valor final
- O utilizador seleciona individualmente os ficheiros que pretende marcar como cobrados, através de caixas de seleção
- Existe um botão "Selecionar todos" por grupo de cliente e um "Selecionar tudo" global
**Aba "Por cliente"**
- Lista todos os clientes com valor por cobrar
- Cada linha mostra: nome do cliente, número de ficheiros por cobrar, valor base total, ajuste aplicado, e valor final
- Ao selecionar um cliente, todos os seus ficheiros por cobrar ficam selecionados automaticamente
- É possível expandir cada cliente para ver e desselecionar ficheiros individuais
### 8.2 Ajuste de valores
 
O utilizador pode ajustar o valor a cobrar em três níveis de granularidade, de forma independente e combinável:
 
**Nível de ficheiro individual**
- Disponível na aba "Por ficheiro", acessível através de um botão de edição em cada linha
- O ajuste aplica-se apenas a esse ficheiro e não afeta os restantes
**Nível de cliente**
- Disponível em ambas as abas, acessível através de um botão de ajuste no cabeçalho de cada grupo de cliente
- O ajuste aplica-se a todos os ficheiros selecionados desse cliente
- Se existir também um ajuste por ficheiro, os dois ajustes acumulam-se
**Nível global (valor final total)**
- Disponível no painel de resumo
- O ajuste aplica-se ao total da cobrança, independentemente dos ajustes individuais já aplicados
**Tipos de ajuste disponíveis (em todos os níveis):**
 
- **Valor fixo** — adicionar ou subtrair um montante fixo em euros (exemplo: +50€ ou −30€)
- **Valor por hora** — alterar a tarifa horária efetiva para esse âmbito, acrescentando ou reduzindo um valor por hora em relação à tarifa base (exemplo: +10€/h ou −10€/h); o novo valor é recalculado com base nas horas acumuladas
- **Percentagem** — aplicar um aumento ou desconto percentual sobre o valor base (exemplo: +15% ou −15%)
Cada ajuste é apresentado de forma explícita na interface, mostrando sempre o valor base, o ajuste aplicado (com sinal e tipo), e o valor final resultante. Os ajustes são apenas para efeitos desta cobrança e não alteram as regras de preço definidas na secção Regras de preço.
 
### 8.3 Resumo da cobrança
 
Painel fixo na parte inferior ou lateral do ecrã, atualizado em tempo real conforme a seleção e os ajustes:
 
- Lista dos clientes incluídos na seleção atual, com o valor base, ajuste aplicado, e valor final de cada um
- Total global da cobrança: valor base total, ajustes totais, e valor final a cobrar em destaque
- Número total de ficheiros incluídos
- Botão de ajuste global do valor final (ver secção 8.2)
### 8.4 Confirmar cobrança
 
Botão "Marcar como cobrado" que, após confirmação pelo utilizador (diálogo de confirmação com o valor final visível), executa as seguintes ações:
 
- Marca todos os ficheiros selecionados como cobrados na base de dados
- Regista a data e hora da cobrança, o valor base, os ajustes aplicados, e o valor final efetivamente cobrado
- Remove os ficheiros cobrados do contador "Total por cobrar" visível no Dashboard
- Reposiciona o utilizador no Dashboard após a confirmação
O histórico de cobranças passadas, incluindo os ajustes aplicados, é consultável no ecrã de Análise. A operação é irreversível via UI (pode ser corrigida diretamente na base de dados em caso de erro).
 
### 8.5 Estado de cobrança nos ficheiros
 
Cada ficheiro tem um estado de cobrança persistente:
 
- **Por cobrar** — trabalho registado que ainda não foi incluído numa cobrança
- **Cobrado** — trabalho já marcado como cobrado, com data de cobrança e valor final associados
Novo trabalho registado num ficheiro já cobrado cria automaticamente novo valor no estado "por cobrar", sem afetar o histórico anterior.
 
---
 
## 9. Ecrã: Análise
 
Ecrã de consulta e análise dos dados de faturação. Toda a análise é feita dentro da aplicação, sem exportação de ficheiros externos.
 
### 9.1 Filtro de período
 
Seletor de período no topo do ecrã com as opções:
 
- Esta semana
- Este mês
- Últimos 3 meses
- Período personalizado (data de início e data de fim)
### 9.2 Gráfico de resumo
 
Gráfico de barras com o valor faturado por semana dentro do período selecionado. Permite identificar visualmente os períodos de maior atividade.
 
### 9.3 Tabela de análise por cliente
 
Tabela com uma linha por cliente, com as seguintes colunas:
 
- Nome do cliente
- Total de horas no período
- Tipo de documento mais frequente
- Valor cobrado no período
- Valor por cobrar no período
A tabela inclui uma linha de totais gerais no fundo. Os dados são filtrados pelo período selecionado e atualizados em tempo real.
 
### 9.4 Histórico de cobranças
 
Lista de todas as cobranças realizadas, com:
 
- Data da cobrança
- Clientes incluídos
- Valor total cobrado
- Número de ficheiros incluídos
---
 
## 10. Ecrã: Definições
 
Ecrã de configuração geral da aplicação. Agrupa todas as preferências globais.
 
### 10.1 Pasta raiz dos clientes
 
Caminho da pasta principal que contém as subpastas dos clientes. O utilizador pode alterar este caminho através de um seletor de diretório nativo do sistema operativo. Ao alterar a pasta raiz, a monitorização reinicia automaticamente.
 
### 10.2 Limiar de inatividade
 
Duração máxima de inatividade antes de o contador de tempo ser pausado automaticamente para um ficheiro aberto. Configurável em minutos. Valor padrão recomendado: 5 minutos.
 
### 10.3 Moeda
 
Moeda utilizada em todos os cálculos e apresentações de valor na aplicação. Por omissão: EUR (€).
 
### 10.4 Idioma da interface
 
Idioma da interface da aplicação. Opções disponíveis na versão inicial: Português (PT) e Inglês (EN).
 
### 10.5 Base de dados
 
Informações sobre a localização e tamanho da base de dados SQLite. Inclui botão para abrir a pasta de dados e para fazer backup manual da base de dados.
 
---
 
## 11. Regras de negócio transversais
 
### 11.1 Deteção de clientes
 
Cada subpasta direta dentro da pasta raiz é tratada como um cliente distinto. O nome da subpasta é o nome do cliente apresentado na aplicação. Subpastas aninhadas a maior profundidade são tratadas como ficheiros do mesmo cliente.
 
### 11.2 Cálculo do valor
 
Para regras por hora: `valor = (duração em minutos / 60) × tarifa horária`, arredondado a 2 casas decimais. Para regras de valor fixo: o valor é aplicado uma única vez por ficheiro por sessão de trabalho.
 
### 11.3 Sessão de trabalho
 
Uma sessão de trabalho corresponde ao intervalo entre a abertura e o fecho de um ficheiro. Se o mesmo ficheiro for aberto múltiplas vezes no mesmo dia, cada abertura gera uma sessão independente. O total do dia é a soma de todas as sessões.
 
### 11.4 Persistência dos dados
 
Todos os registos de sessões, regras e configurações são guardados na base de dados SQLite. A aplicação não depende de dados em memória entre sessões: ao reabrir a aplicação, todos os históricos são recuperados da base de dados. A base de dados é um ficheiro local (`.db`) armazenado na pasta de dados da aplicação.
 
### 11.5 Segurança e privacidade
 
- Os ficheiros dos clientes nunca são lidos, copiados ou transmitidos — apenas os metadados são registados (nome do ficheiro, caminho, timestamps de abertura e fecho)
- A base de dados fica sob controlo exclusivo do utilizador
- Não existe comunicação de dados para servidores externos
---
 
## 12. Requisitos não funcionais
 
| Requisito | Descrição | Critério de aceitação |
|---|---|---|
| Desempenho | Resposta da interface | Tempo de resposta < 200ms para operações de UI |
| Fiabilidade | Continuidade da monitorização | Sem perda de eventos de ficheiros durante uso normal |
| Compatibilidade | Sistemas operativos | Windows 10+ e macOS 12+ (Intel e Apple Silicon) |
| Usabilidade | Configuração inicial | Operacional em menos de 5 minutos após instalação |
| Manutenção | Base de dados | Suporte a backup manual do ficheiro SQLite |
 
---
 
## 13. Funcionalidades fora de âmbito (versão 1.0)
 
- Exportação de relatórios para PDF ou Excel
- Emissão de faturas
- Autenticação de utilizadores / multi-utilizador
- Sincronização automática de dados entre dispositivos
- Aplicação móvel
- Integração com software de faturação externo
- Envio de relatórios por email