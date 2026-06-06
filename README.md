# 🐢 TurtleStation

**TurtleStation** é um launcher e painel de jogos premium para Linux com visual e usabilidade inspirados na interface de console do **Steam Deck**. O projeto utiliza um servidor local Node.js + Express para gerenciar emuladores (como RetroArch, MAME, Dolphin, etc.), varrer diretórios de ROMs, obter capas via API do ScreenScraper.fr e lançar os jogos nativamente com suporte total a joysticks.

---

## ✨ Funcionalidades Principais

* **🎮 Navegação Completa via Joystick (Gamepad API)**:
  * Suporte a D-Pad e Analógico esquerdo com repetição inteligente de movimentos ao segurar (*hold-to-repeat*).
  * Resposta tátil com vibração háptica (*vibrationActuator*) nos botões e ao navegar pelos menus.
  * Ocultação inteligente do ponteiro do mouse ao usar o controle.
* **⚙️ Painel de Configurações Aperfeiçoado**:
  * Divisão de zonas (*Sidebar* e *Painel de Conteúdo*) permitindo alternar de abas mantendo o foco, e ir para o painel de opções ao pressionar o botão de seleção.
  * Retorno simplificado para a barra lateral pressionando o botão de voltar (**B / Backspace**) ou movendo para a esquerda no início do painel.
* **🔒 Dropdowns Bloqueados contra Alterações Acidentais**:
  * Elementos `<select>` são travados por padrão durante a navegação normal.
  * É necessário pressionar o botão de seleção (**A / Enter**) para editar o valor usando as setas Up/Down, confirmando com um novo clique.
* **⌨️ Teclado Virtual Integrado (OSK)**:
  * Exibido automaticamente no estilo *glassmorphism* ao focar campos de texto e senhas.
  * Totalmente navegável via joystick para configurar caminhos, usuário e senha sem precisar de teclado físico.
* **🖼️ Media Scraper Integrado**:
  * Varredura automática de pastas de ROMs com identificação automática e download de capas diretamente da API do **ScreenScraper.fr** usando as credenciais do usuário.
* **🚪 Encerramento de Processo e AppImage**:
  * Fechamento completo do servidor e da interface frontend ao clicar em "Sair do App".

---

## 🛠️ Stack Tecnológica

* **Backend**: Node.js + Express
* **Frontend**: HTML5, Vanilla CSS (com variáveis personalizadas e Glassmorphism), Vanilla JavaScript (com mapeamento direto do Gamepad)
* **Empacotamento**: `pkg` (para gerar o binário unificado), `electron-builder` e `appimagetool` (para gerar o pacote portátil `.AppImage`).

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
Certifique-se de possuir o **Node.js** instalado na sua distribuição Linux (Recomendado v18 ou v20).

### Inicialização em Modo Desenvolvimento
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor local backend:
   ```bash
   npm start
   ```
3. Acesse o painel pelo navegador em `http://localhost:3000`.

### Executando via Electron (Modo App Nativo)
Caso queira rodar o TurtleStation em modo janela nativa sem depender do navegador tradicional:
```bash
npm run electron
```

---

## 📦 Como Gerar a AppImage Portátil

O TurtleStation pode ser empacotado em um arquivo unificado `.AppImage` autoexecutável de aproximadamente ~19MB (sem o peso do Electron).

1. Compile o binário do backend do Node.js:
   ```bash
   npx pkg . -t node18-linux-x64 -o turtlestation-game-frontend
   ```
2. Execute o script de empacotamento:
   ```bash
   ./package.sh
   ```
3. O executável portátil `TurtleStation-x86_64.AppImage` será gerado na raiz do projeto.

---

## 🎮 Mapeamento de Controles Padrão

O mapeamento de botões do joystick de Xbox/PlayStation foi planejado para maximizar a ergonomia de navegação:

| Botão do Joystick (Xbox / PS) | Tecla Mapeada | Ação Executada |
| :--- | :---: | :--- |
| **A / Cross** | `Enter` | Selecionar / Clicar / Ativar Edição de Dropdowns e Teclas |
| **B / Circle** | `Escape` / `Backspace` | Voltar / Fechar Teclado / Retornar à Sidebar / Fechar Modais |
| **X / Square** | `/` | Inserir Espaço no Teclado Virtual |
| **Y / Triangle** | `f` / `F` | Apagar caractere no Teclado Virtual (Backspace ⌫) |
| **D-Pad / Analógico** | Setas direcionais | Navegar pelo Grid de Jogos, Teclado Virtual e Menus |
| **L1 / R1** | `PageUp` / `PageDown` | Navegar rapidamente pelas abas de emuladores na tela principal |
