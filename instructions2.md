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

A barra de topo, presente em todos os ecrãs, disponibiliza dois controlos globais: o seletor de período temporal (usado nos ecrãs de análise e dashboard) e o botão de configuração da pasta raiz.

---

## 4. Ecrã: Dashboard

Ecrã inicial da aplicação. Apresenta uma visão geral do período selecionado e da atividade em curso.

### 4.1 Métricas de resumo

Quatro indicadores em destaque no topo do ecrã, ordenados por prioridade:

- **Total por cobrar** — valor acumulado de todo o trabalho ainda não marcado como cobrado (métrica principal)
- **Ficheiros em curso** — número de ficheiros atualmente abertos com sessão ativa
- **Total cobrado este mês** — valor já marcado como cobrado no mês atual
- **Horas trabalhadas este mês** — tempo total registado no mês atual

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
- Cada entrada mostra: nome do cliente, número total de ficheiros registados, valor total acumulado no período, e valor por cobrar em destaque
- Ao selecionar um cliente, abre o ecrã de detalhe do cliente

### 5.2 Detalhe do cliente

Ecrã de detalhe (acedido ao clicar num cliente) com:

- Lista de todos os ficheiros do cliente
- Histórico de sessões por ficheiro (data, hora de início, hora de fim, duração, valor)
- Totais agregados por ficheiro e totais gerais do cliente no período
- Tipo de documento detetado para cada ficheiro (com base nas regras de preço)
- Indicação por ficheiro de se o valor já foi cobrado ou ainda está por cobrar

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

Ecrã dedicado à gestão de cobranças. Permite ao utilizador selecionar quais os ficheiros ou clientes a marcar como cobrados, consultar um resumo do valor em causa, e fazer o reset do contador de valor por cobrar.

### 8.1 Seleção de itens a cobrar

O ecrã divide-se em dois modos de seleção, alternados por duas abas no topo:

**Aba "Por ficheiro"**
- Lista todos os ficheiros com valor por cobrar, agrupados por cliente
- Cada linha mostra: nome do ficheiro, cliente, horas acumuladas (não cobradas), e valor correspondente
- O utilizador seleciona individualmente os ficheiros que pretende marcar como cobrados, através de caixas de seleção
- Existe um botão "Selecionar todos" por grupo de cliente e um "Selecionar tudo" global

**Aba "Por cliente"**
- Lista todos os clientes com valor por cobrar
- Cada linha mostra: nome do cliente, número de ficheiros por cobrar, e valor total por cobrar
- Ao selecionar um cliente, todos os seus ficheiros por cobrar ficam selecionados automaticamente
- É possível expandir cada cliente para ver e desselecionar ficheiros individuais

### 8.2 Resumo da cobrança

Painel fixo na parte inferior ou lateral do ecrã, atualizado em tempo real conforme a seleção:

- Lista dos clientes incluídos na seleção atual, com o valor correspondente a cada um
- Total global da cobrança selecionada
- Número total de ficheiros incluídos

### 8.3 Confirmar cobrança

Botão "Marcar como cobrado" que, após confirmação pelo utilizador (diálogo de confirmação), executa as seguintes ações:

- Marca todos os ficheiros selecionados como cobrados na base de dados
- Regista a data e hora da cobrança
- Remove os ficheiros cobrados do contador "Total por cobrar" visível no Dashboard
- Reposiciona o utilizador no Dashboard após a confirmação

O histórico de cobranças passadas é consultável no ecrã de Análise. A operação é irreversível via UI (pode ser corrigida diretamente na base de dados em caso de erro).

### 8.4 Estado de cobrança nos ficheiros

Cada ficheiro tem um estado de cobrança persistente:

- **Por cobrar** — trabalho registado que ainda não foi incluído numa cobrança
- **Cobrado** — trabalho já marcado como cobrado, com data de cobrança associada

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