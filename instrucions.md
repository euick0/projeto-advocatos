# Advocatos — Requisitos e Funcionalidades

**Aplicação de Contabilidade para Advogados**
Versão 1.0 · Maio 2026

---

## 1. Stack técnica

| Componente                 | Tecnologia                  | Notas                        |
| -------------------------- | --------------------------- | ---------------------------- |
| Frontend                   | Svelte + Vite               | Interface de utilizador      |
| Desktop runtime            | Tauri v2 (Rust)             | Windows e macOS              |
| Base de dados              | SQLite                      | Ficheiro local, sem servidor |
| Monitorização de ficheiros | tauri-plugin-fs (watch API) | Cross-platform nativo        |
| Plataformas alvo           | Windows 10+ e macOS 12+     | Builds separados por SO      |

> **Nota sobre o SQLite:** sendo uma base de dados de ficheiro único, a aplicação é totalmente standalone. Todos os dados são guardados num ficheiro `.db` local. Para backup, basta copiar o ficheiro. Este modelo simplifica significativamente a instalação e distribuição da aplicação.

---

## 2. Visão geral da aplicação

A LexTimer é uma aplicação desktop para advogados que monitoriza automaticamente o tempo de abertura de ficheiros de clientes e calcula o valor a faturar com base em regras de preço definidas pelo utilizador. Toda a análise ocorre dentro da própria aplicação, sem exportação de documentos.

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
- Análise

### 3.3 Acesso global (rodapé da barra lateral)

- Definições

A barra de topo, presente em todos os ecrãs, disponibiliza dois controlos globais: o seletor de período temporal (usado nos ecrãs de análise e dashboard) e o botão de configuração da pasta raiz.

---

## 4. Ecrã: Dashboard

Ecrã inicial da aplicação. Apresenta uma visão geral do período selecionado e da atividade em curso.

### 4.1 Métricas de resumo

Quatro indicadores em destaque no topo do ecrã:

- Total de horas trabalhadas no período
- Valor total a faturar no período
- Número de ficheiros atualmente abertos (sessões ativas)
- Valor médio por hora no período

### 4.2 Atividade recente

Lista das sessões de trabalho mais recentes, com as seguintes colunas por entrada:

- Nome do ficheiro
- Cliente associado (detetado pela estrutura de pastas)
- Duração da sessão
- Valor calculado para a sessão
- Estado (aberto ou fechado)

Os ficheiros com sessão ativa são sinalizados visualmente como estando em curso. Os ficheiros fechados mostram o valor calculado.

---

## 5. Ecrã: Clientes

Lista de todos os clientes detetados automaticamente a partir da estrutura de subpastas dentro da pasta raiz. Cada subpasta de primeiro nível é interpretada como um cliente.

### 5.1 Lista de clientes

- Campo de pesquisa por nome de cliente
- Cada entrada mostra: nome do cliente, número total de ficheiros registados, e valor total acumulado no período
- Ao selecionar um cliente, abre o ecrã de detalhe do cliente

### 5.2 Detalhe do cliente

Ecrã de detalhe (acedido ao clicar num cliente) com:

- Lista de todos os ficheiros do cliente
- Histórico de sessões por ficheiro (data, hora de início, hora de fim, duração, valor)
- Totais agregados por ficheiro e totais gerais do cliente no período
- Tipo de documento detetado para cada ficheiro (com base nas regras de preço)

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

## 8. Ecrã: Análise

Ecrã de consulta e análise dos dados de faturação. Toda a análise é feita dentro da aplicação, sem exportação de ficheiros externos.

### 8.1 Filtro de período

Seletor de período no topo do ecrã com as opções:

- Esta semana
- Este mês
- Últimos 3 meses
- Período personalizado (data de início e data de fim)

### 8.2 Gráfico de resumo

Gráfico de barras com o valor faturado por semana dentro do período selecionado. Permite identificar visualmente os períodos de maior atividade.

### 8.3 Tabela de análise por cliente

Tabela com uma linha por cliente, com as seguintes colunas:

- Nome do cliente
- Total de horas no período
- Tipo de documento mais frequente
- Valor total a faturar no período

A tabela inclui uma linha de totais gerais no fundo. Os dados são filtrados pelo período selecionado e atualizados em tempo real.

---

## 9. Ecrã: Definições

Ecrã de configuração geral da aplicação. Agrupa todas as preferências globais.

### 9.1 Pasta raiz dos clientes

Caminho da pasta principal que contém as subpastas dos clientes. O utilizador pode alterar este caminho através de um seletor de diretório nativo do sistema operativo. Ao alterar a pasta raiz, a monitorização reinicia automaticamente.

### 9.2 Limiar de inatividade

Duração máxima de inatividade antes de o contador de tempo ser pausado automaticamente para um ficheiro aberto. Configurável em minutos. Valor padrão recomendado: 5 minutos.

### 9.3 Moeda

Moeda utilizada em todos os cálculos e apresentações de valor na aplicação. Por omissão: EUR (€).

### 9.4 Idioma da interface

Idioma da interface da aplicação. Opções disponíveis na versão inicial: Português (PT) e Inglês (EN).

### 9.5 Base de dados

Informações sobre a localização e tamanho da base de dados SQLite. Inclui botão para abrir a pasta de dados e para fazer backup manual da base de dados.

---

## 10. Regras de negócio transversais

### 10.1 Deteção de clientes

Cada subpasta direta dentro da pasta raiz é tratada como um cliente distinto. O nome da subpasta é o nome do cliente apresentado na aplicação. Subpastas aninhadas a maior profundidade são tratadas como ficheiros do mesmo cliente.

### 10.2 Cálculo do valor

Para regras por hora: `valor = (duração em minutos / 60) × tarifa horária`, arredondado a 2 casas decimais. Para regras de valor fixo: o valor é aplicado uma única vez por ficheiro por sessão de trabalho.

### 10.3 Sessão de trabalho

Uma sessão de trabalho corresponde ao intervalo entre a abertura e o fecho de um ficheiro. Se o mesmo ficheiro for aberto múltiplas vezes no mesmo dia, cada abertura gera uma sessão independente. O total do dia é a soma de todas as sessões.

### 10.4 Persistência dos dados

Todos os registos de sessões, regras e configurações são guardados na base de dados SQLite. A aplicação não depende de dados em memória entre sessões: ao reabrir a aplicação, todos os históricos são recuperados da base de dados. A base de dados é um ficheiro local (`.db`) armazenado na pasta de dados da aplicação.

### 10.5 Segurança e privacidade

- Os ficheiros dos clientes nunca são lidos, copiados ou transmitidos — apenas os metadados são registados (nome do ficheiro, caminho, timestamps de abertura e fecho)
- A base de dados fica sob controlo exclusivo do utilizador
- Não existe comunicação de dados para servidores externos

---

## 11. Requisitos não funcionais

| Requisito       | Descrição                     | Critério de aceitação                                |
| --------------- | ----------------------------- | ---------------------------------------------------- |
| Desempenho      | Resposta da interface         | Tempo de resposta < 200ms para operações de UI       |
| Fiabilidade     | Continuidade da monitorização | Sem perda de eventos de ficheiros durante uso normal |
| Compatibilidade | Sistemas operativos           | Windows 10+ e macOS 12+ (Intel e Apple Silicon)      |
| Usabilidade     | Configuração inicial          | Operacional em menos de 5 minutos após instalação    |
| Manutenção      | Base de dados                 | Suporte a backup manual do ficheiro SQLite           |

---

## 12. Funcionalidades fora de âmbito (versão 1.0)

- Exportação de relatórios para PDF ou Excel
- Emissão de faturas
- Autenticação de utilizadores / multi-utilizador
- Sincronização automática de dados entre dispositivos
- Aplicação móvel
- Integração com software de faturação externo
- Envio de relatórios por email
