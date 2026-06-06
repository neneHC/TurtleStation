/* ==========================================================================
   APP.JS - LÓGICA E INTERATIVIDADE DO FRONTEND (ESTILO STEAM DECK)
   ========================================================================== */

// Estado da Aplicação
const state = {
  games: [],
  settings: { emulators: [], directories: [] },
  activeTab: 'all',
  searchQuery: '',
  focusedGameIndex: -1,
  selectedGame: null,
  isScanning: false,
  isPlaying: false,
  activeSelect: null,
  keyboardActive: false,
  keyboardTargetInput: null,
  keyboardRow: 0,
  keyboardCol: 0,
  keyboardShift: false
};

const KEYBOARD_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '_'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '/', '.', '-'],
  ['SHIFT', 'SPACE', 'BACKSPACE', 'CONCLUIR']
];

// Cores Curadas de Gradientes para Capas Fallback
const PREMIUM_GRADIENTS = [
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  'linear-gradient(135deg, #7b2cbf 0%, #240046 100%)',
  'linear-gradient(135deg, #d90429 0%, #2b2d42 100%)',
  'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
  'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
  'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)'
];

// Seleção de Elementos DOM
const dom = {
  gamesGrid: document.getElementById('games-grid'),
  emptyState: document.getElementById('empty-state'),
  searchInput: document.getElementById('search-input'),
  clock: document.getElementById('system-clock'),
  navTabs: document.querySelectorAll('.nav-tab'),
  navL1: document.getElementById('nav-l1'),
  navR1: document.getElementById('nav-r1'),
  btnSettingsToggle: document.getElementById('btn-settings-toggle'),
  btnStatus: document.getElementById('btn-status'),
  
  // Modais
  modalSettings: document.getElementById('modal-settings'),
  modalGameDetails: document.getElementById('modal-game-details'),
  modalEditForm: document.getElementById('modal-edit-form'),
  modalAddEmulator: document.getElementById('modal-add-emulator'),
  modalAddDirectory: document.getElementById('modal-add-directory'),
  
  // Fechar Modais
  settingsClose: document.getElementById('settings-close'),
  detailsClose: document.getElementById('details-close'),
  formClose: document.getElementById('form-close'),
  emuClose: document.getElementById('emu-close'),
  dirClose: document.getElementById('dir-close'),
  
  // Formulários
  gameForm: document.getElementById('game-form'),
  emuForm: document.getElementById('emu-form'),
  dirForm: document.getElementById('dir-form'),
  
  // Botões do Modal de Configurações
  sidebarTabs: document.querySelectorAll('.sidebar-tab'),
  settingsSections: document.querySelectorAll('.settings-section'),
  emulatorsContainer: document.getElementById('emulators-list-container'),
  directoriesContainer: document.getElementById('directories-list-container'),
  btnAddEmulator: document.getElementById('btn-add-emulator'),
  btnAddDirectory: document.getElementById('btn-add-directory'),
  btnTriggerScan: document.getElementById('btn-trigger-scan'),
  scanBtnText: document.getElementById('scan-btn-text'),
  
  // Botões de Modal de Detalhes
  detailsPosterImg: document.getElementById('details-poster-img'),
  detailsPosterFallback: document.getElementById('details-poster-fallback'),
  detailsFallbackTitle: document.getElementById('details-fallback-title'),
  detailsGlow: document.getElementById('details-glow'),
  detailsSystemBadge: document.getElementById('details-system-badge'),
  detailsTitle: document.getElementById('details-title'),
  detailsEmulatorValue: document.getElementById('details-emulator-value'),
  detailsPathValue: document.getElementById('details-path-value'),
  detailsArgsRow: document.getElementById('details-args-row'),
  detailsArgsValue: document.getElementById('details-args-value'),
  detailsDateValue: document.getElementById('details-date-value'),
  btnPlayGame: document.getElementById('btn-play-game'),
  btnToggleFavoriteDetails: document.getElementById('btn-toggle-favorite-details'),
  detailsFavText: document.getElementById('details-fav-text'),
  btnEditGameDetails: document.getElementById('btn-edit-game-details'),
  btnDeleteGame: document.getElementById('btn-delete-game'),
  
  // Ações Estado Vazio
  emptyBtnSettings: document.getElementById('empty-btn-settings'),
  emptyBtnManual: document.getElementById('empty-btn-manual'),
  btnSteamMenu: document.getElementById('btn-steam-menu'),
  
  // Mapeamento Formulário Jogo
  formGameId: document.getElementById('form-game-id'),
  formName: document.getElementById('form-name'),
  formRomPath: document.getElementById('form-rom-path'),
  formEmulator: document.getElementById('form-emulator'),
  formSystem: document.getElementById('form-system'),
  formCover: document.getElementById('form-cover'),
  formArgs: document.getElementById('form-args'),
  btnSubmitForm: document.getElementById('btn-submit-form'),
  formModalTitle: document.getElementById('form-modal-title')
};

// ==========================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initEventListeners();
  loadData();
  setupKeyboardNavigation();
  initGamepadSupport();

  // Aciona o Teclado Virtual ao focar campos de texto
  document.addEventListener('focusin', (e) => {
    if (e.target && e.target.tagName === 'INPUT' && (e.target.type === 'text' || e.target.type === 'password')) {
      showVirtualKeyboard(e.target);
    }
  });

  // Limpa o estado de edição do select ao perder foco
  document.addEventListener('focusout', (e) => {
    if (e.target && e.target.tagName === 'SELECT') {
      e.target.classList.remove('select-editing');
      if (state.activeSelect === e.target) {
        state.activeSelect = null;
      }
    }
  });
});

// Relógio em Tempo Real
function initClock() {
  function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Hora '0' vira '12'
    dom.clock.textContent = `${hours}:${minutes} ${ampm}`;
  }
  updateTime();
  setInterval(updateTime, 60000); // atualiza a cada minuto
}

// Carregar Configurações e Lista de Jogos
async function loadData() {
  await fetchSettings();
  await fetchGames();
}

// Chamar a API de Jogos
async function fetchGames() {
  try {
    const response = await fetch('/api/games');
    if (okResponse(response)) {
      state.games = await response.json();
      updateBadges();
      renderGamesGrid();
    }
  } catch (err) {
    console.error('Falha ao carregar jogos da API:', err);
  }
}

// Chamar a API de Configurações
async function fetchSettings() {
  try {
    const response = await fetch('/api/settings');
    if (okResponse(response)) {
      state.settings = await response.json();
      populateDropdowns();
      renderSettingsLists();
      applyGeneralSettings();
    }
  } catch (err) {
    console.error('Falha ao carregar configurações da API:', err);
  }
}

// Helper para validar response
function okResponse(res) {
  return res && res.ok;
}

// Atualiza contadores numéricos das abas
function updateBadges() {
  renderTabs();
}

// A função getFilteredGames foi consolidada abaixo.

// Popula campos Select de Emulador com as opções registradas
function populateDropdowns() {
  const emulators = state.settings.emulators || [];
  
  // Dropdown no formulário de jogo
  dom.formEmulator.innerHTML = '<option value="">Nenhum (Lançamento direto de PC)</option>';
  emulators.forEach(e => {
    dom.formEmulator.innerHTML += `<option value="${e.id}">${e.name}</option>`;
  });
  
  // Dropdown no formulário de diretório
  const dirEmuSelect = document.getElementById('dir-emulator');
  if (dirEmuSelect) {
    dirEmuSelect.innerHTML = '';
    emulators.forEach(e => {
      dirEmuSelect.innerHTML += `<option value="${e.id}">${e.name}</option>`;
    });
  }
}

// ==========================================================================
// RENDERIZAÇÃO DA INTERFACE
// ==========================================================================

// Retorna a lista de jogos filtrada conforme a aba ativa e a pesquisa
function getFilteredGames() {
  let filtered = [...state.games];
  
  // 1. Filtrar por Aba
  if (state.activeTab === 'favorites') {
    filtered = filtered.filter(g => g.favorite);
  } else if (state.activeTab !== 'all') {
    // Aba de emulador
    filtered = filtered.filter(g => g.emulatorId === state.activeTab);
  }
  
  // 2. Filtrar por Pesquisa
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(g => g.name.toLowerCase().includes(q));
  }
  
  return filtered;
}

// Renderiza a Grid de Jogos
function renderGamesGrid() {
  const filtered = getFilteredGames();
  dom.gamesGrid.innerHTML = '';
  
  if (filtered.length === 0) {
    dom.emptyState.classList.remove('hidden');
    dom.gamesGrid.classList.add('hidden');
    state.focusedGameIndex = -1;
    return;
  }
  
  dom.emptyState.classList.add('hidden');
  dom.gamesGrid.classList.remove('hidden');
  
  // Se nada está focado, foca o primeiro por padrão
  if (state.focusedGameIndex === -1 || state.focusedGameIndex >= filtered.length) {
    state.focusedGameIndex = 0;
  }
  
  filtered.forEach((game, index) => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.setAttribute('data-id', game.id);
    card.setAttribute('data-index', index);
    
    // Marca focado se for o índice focado atual
    if (index === state.focusedGameIndex) {
      card.classList.add('focused');
    }
    
    // Badge de Favorito
    let favBadge = '';
    if (game.favorite) {
      favBadge = `
        <div class="card-fav-badge">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </div>`;
    }
    
    // Tag de console / sistema no rodapé da capa
    let systemTag = '';
    if (game.systemName) {
      // Simplifica o nome para caber na tag
      let displaySystem = game.systemName.replace("Nintendo - ", "").replace("Sony - ", "").replace("Sega - ", "");
      systemTag = `<div class="card-system-tag">${displaySystem.toUpperCase()}</div>`;
    }
    
    // Capa do Jogo (Scraped Image ou Fallback Gradiente)
    let cardContent = '';
    if (game.coverPath) {
      cardContent = `
        <div class="card-image-wrapper">
          <img src="${game.coverPath}" alt="${game.name}" loading="lazy">
        </div>`;
    } else {
      // Gera um gradiente com base no hash do id para estabilidade visual
      const hash = game.id.charCodeAt(0) + game.id.charCodeAt(game.id.length - 1);
      const gradient = PREMIUM_GRADIENTS[hash % PREMIUM_GRADIENTS.length];
      cardContent = `
        <div class="card-fallback" style="background: ${gradient}">
          <svg class="fallback-icon" viewBox="0 0 24 24" width="28" height="28">
            <path fill="currentColor" d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
          <div class="fallback-title">${game.name}</div>
        </div>`;
    }
    
    card.innerHTML = `${favBadge}${systemTag}${cardContent}`;
    
    // Click Event
    card.addEventListener('click', () => {
      state.focusedGameIndex = index;
      selectCard(index);
      openGameDetails(game);
    });

    // Hover Event (Sincroniza mouse com teclado sem dar scroll no hover)
    card.addEventListener('mouseenter', () => {
      state.focusedGameIndex = index;
      selectCard(index, false);
    });
    
    dom.gamesGrid.appendChild(card);
  });
}

// Renderiza listas configuradas nas abas de Configurações
function renderSettingsLists() {
  // 1. Emuladores
  dom.emulatorsContainer.innerHTML = '';
  const emulators = state.settings.emulators || [];
  if (emulators.length === 0) {
    dom.emulatorsContainer.innerHTML = '<p class="section-desc">Nenhum emulador configurado.</p>';
  } else {
    emulators.forEach(e => {
      const item = document.createElement('div');
      item.className = 'config-item';
      item.innerHTML = `
        <div class="config-info">
          <h5>${e.name}</h5>
          <p>CMD: ${e.path} | ARGS: ${e.arguments}</p>
        </div>
        <div class="config-actions">
          <button class="item-edit-btn" data-type="emu" data-id="${e.id}" title="Editar Emulador">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button class="item-delete-btn" data-type="emu" data-id="${e.id}" title="Excluir Emulador">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      `;
      dom.emulatorsContainer.appendChild(item);
    });
  }

  // 2. Diretórios
  dom.directoriesContainer.innerHTML = '';
  const dirs = state.settings.directories || [];
  if (dirs.length === 0) {
    dom.directoriesContainer.innerHTML = '<p class="section-desc">Nenhum diretório de ROMs mapeado.</p>';
  } else {
    dirs.forEach((d, idx) => {
      const emuName = state.settings.emulators.find(e => e.id === d.emulatorId)?.name || 'Desconhecido';
      const item = document.createElement('div');
      item.className = 'config-item';
      item.innerHTML = `
        <div class="config-info">
          <h5>${d.path}</h5>
          <p>Emulador: ${emuName} | Extensões: ${d.extensions.join(', ')} | Sistema: ${d.systemName || 'MAME'}</p>
        </div>
        <div class="config-actions">
          <button class="item-delete-btn" data-type="dir" data-index="${idx}" title="Excluir Pasta">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      `;
      dom.directoriesContainer.appendChild(item);
    });
  }

  // Hook para botões de exclusão nas listas
  document.querySelectorAll('.item-delete-btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const target = ev.currentTarget;
      const type = target.getAttribute('data-type');
      if (type === 'emu') {
        const id = target.getAttribute('data-id');
        state.settings.emulators = state.settings.emulators.filter(e => e.id !== id);
      } else if (type === 'dir') {
        const index = parseInt(target.getAttribute('data-index'), 10);
        state.settings.directories.splice(index, 1);
      }
      saveSettings(state.settings);
    });
  });

  // Hook para botões de edição nas listas
  document.querySelectorAll('.item-edit-btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const target = ev.currentTarget;
      const type = target.getAttribute('data-type');
      if (type === 'emu') {
        const id = target.getAttribute('data-id');
        openEditEmulatorForm(id);
      }
    });
  });

  populateGeneralSettingsInputs();
}

// Salva configurações na API
async function saveSettings(newSettings) {
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    if (okResponse(response)) {
      state.settings = newSettings;
      populateDropdowns();
      renderSettingsLists();
      updateBadges();
    }
  } catch (err) {
    console.error('Falha ao salvar configurações na API:', err);
  }
}

// Mapeia e foca visualmente em um card específico na grid
function selectCard(index, scroll = true) {
  const cards = dom.gamesGrid.querySelectorAll('.game-card');
  cards.forEach(card => card.classList.remove('focused'));
  
  if (index >= 0 && index < cards.length) {
    const selectedCard = cards[index];
    selectedCard.classList.add('focused');
    if (scroll) {
      selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// ==========================================================================
// MODAIS E DIÁLOGOS (MODALS FLOW)
// ==========================================================================

function getActiveModal() {
  const modals = [
    dom.modalAddEmulator,
    dom.modalAddDirectory,
    dom.modalEditForm,
    dom.modalSettings,
    dom.modalGameDetails
  ];
  return modals.find(m => m && !m.classList.contains('hidden'));
}

function closeActiveModal(activeModal) {
  if (activeModal === dom.modalAddEmulator) closeModal(dom.modalAddEmulator);
  else if (activeModal === dom.modalAddDirectory) closeModal(dom.modalAddDirectory);
  else if (activeModal === dom.modalEditForm) closeModal(dom.modalEditForm);
  else if (activeModal === dom.modalSettings) closeModal(dom.modalSettings);
  else if (activeModal === dom.modalGameDetails) closeModal(dom.modalGameDetails);
}

function getVisibleFocusableElements(container) {
  const elements = Array.from(container.querySelectorAll(
    'button, input, select, textarea, [tabindex="0"]'
  ));
  return elements.filter(el => {
    if (el.disabled || el.tabIndex === -1) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (el.closest('.hidden')) return false;
    return el.offsetWidth > 0 || el.offsetHeight > 0;
  });
}

function openModal(modal) {
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  
  setTimeout(() => {
    if (modal === dom.modalGameDetails) {
      dom.btnPlayGame.focus();
    } else {
      const focusables = getVisibleFocusableElements(modal);
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    }
  }, 50);
}

function closeModal(modal) {
  modal.classList.add('hidden');
  modal.style.display = 'none';
  
  // Restabelece o foco na grid quando fechamos qualquer modal
  if (state.focusedGameIndex >= 0) {
    selectCard(state.focusedGameIndex);
  }
}

// Abre o Modal de Detalhes do Jogo
function openGameDetails(game) {
  state.selectedGame = game;
  
  dom.detailsTitle.textContent = game.name;
  dom.detailsSystemBadge.textContent = game.systemName.replace("Nintendo - ", "").replace("Sony - ", "").replace("Sega - ", "").toUpperCase();
  
  const emuName = state.settings.emulators.find(e => e.id === game.emulatorId)?.name || 'Lançamento Direto (Não Steam)';
  dom.detailsEmulatorValue.textContent = emuName;
  dom.detailsPathValue.textContent = game.romPath;
  
  // Argumentos do emulador ou customizados
  if (game.customArguments) {
    dom.detailsArgsRow.classList.remove('hidden');
    dom.detailsArgsValue.textContent = game.customArguments;
  } else {
    const emu = state.settings.emulators.find(e => e.id === game.emulatorId);
    if (emu && emu.arguments) {
      dom.detailsArgsRow.classList.remove('hidden');
      dom.detailsArgsValue.textContent = emu.arguments;
    } else {
      dom.detailsArgsRow.classList.add('hidden');
    }
  }
  
  // Data adicionado
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  dom.detailsDateValue.textContent = new Date(game.addedAt).toLocaleDateString('pt-BR', dateOptions);
  
  // Configura a capa do modal
  if (game.coverPath) {
    dom.detailsPosterImg.src = game.coverPath;
    dom.detailsPosterImg.classList.remove('hidden');
    dom.detailsPosterFallback.classList.add('hidden');
    
    // Efeito de Glow Premium com base na capa desfocada
    dom.detailsGlow.style.backgroundImage = `url(${game.coverPath})`;
  } else {
    dom.detailsPosterImg.classList.add('hidden');
    dom.detailsPosterFallback.classList.remove('hidden');
    dom.detailsFallbackTitle.textContent = game.name;
    
    // Gera gradiente para o glow
    const hash = game.id.charCodeAt(0) + game.id.charCodeAt(game.id.length - 1);
    const gradient = PREMIUM_GRADIENTS[hash % PREMIUM_GRADIENTS.length];
    dom.detailsGlow.style.background = gradient;
  }
  
  // Favorito
  updateDetailsFavButton(game.favorite);
  
  openModal(dom.modalGameDetails);
}

// Atualiza o estado visual do botão favoritar no modal de detalhes
function updateDetailsFavButton(isFavorite) {
  if (isFavorite) {
    dom.btnToggleFavoriteDetails.classList.add('active');
    dom.detailsFavText.textContent = 'Favoritado';
  } else {
    dom.btnToggleFavoriteDetails.classList.remove('active');
    dom.detailsFavText.textContent = 'Favoritar';
  }
}

// Lançamento do Jogo (Play)
async function launchGame(gameId) {
  try {
    const game = state.games.find(g => g.id === gameId);
    const gameName = game ? game.name : 'Jogo';

    // Feedback visual instantâneo
    dom.btnPlayGame.style.background = '#ffd54f';
    dom.btnPlayGame.querySelector('span').textContent = 'INICIANDO...';
    
    const response = await fetch('/api/games/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId })
    });
    
    const res = await response.json();
    if (res.success) {
      console.log(`Jogo lançado com sucesso: ${res.message}`);
      
      state.isPlaying = true;
      showPlayingOverlay(gameName);
      
      dom.btnPlayGame.style.background = 'var(--accent-green)';
      dom.btnPlayGame.querySelector('span').textContent = 'JOGAR';
      closeModal(dom.modalGameDetails);
      
      startGameStatusPolling();
    } else {
      alert(`Erro: ${res.error}`);
      dom.btnPlayGame.style.background = 'var(--accent-green)';
      dom.btnPlayGame.querySelector('span').textContent = 'JOGAR';
    }
  } catch (err) {
    console.error('Falha de conexão com a API de lançamento:', err);
    dom.btnPlayGame.style.background = 'var(--accent-green)';
    dom.btnPlayGame.querySelector('span').textContent = 'JOGAR';
  }
}

// Alterna Favorito na API
async function toggleFavorite(gameId) {
  try {
    const response = await fetch('/api/games/toggle-favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId })
    });
    const res = await response.json();
    if (res.success) {
      // Atualiza estado local
      const gameIdx = state.games.findIndex(g => g.id === gameId);
      if (gameIdx !== -1) {
        state.games[gameIdx].favorite = res.favorite;
        updateDetailsFavButton(res.favorite);
        updateBadges();
        renderGamesGrid();
      }
    }
  } catch (err) {
    console.error('Falha ao alternar favorito:', err);
  }
}

// Exclui jogo da biblioteca
async function deleteGame(gameId) {
  if (!confirm('Deseja realmente remover este jogo da sua biblioteca de frontends?')) return;
  
  try {
    const response = await fetch('/api/games/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId })
    });
    const res = await response.json();
    if (res.success) {
      closeModal(dom.modalGameDetails);
      state.games = state.games.filter(g => g.id !== gameId);
      updateBadges();
      renderGamesGrid();
    }
  } catch (err) {
    console.error('Erro ao deletar jogo:', err);
  }
}

// Abre o formulário para edição ou cadastro de jogo manual
function openManualGameForm(game = null) {
  if (game) {
    // Modo Edição
    dom.formModalTitle.textContent = 'Editar Detalhes do Jogo';
    dom.formGameId.value = game.id;
    dom.formName.value = game.name;
    dom.formRomPath.value = game.romPath;
    dom.formEmulator.value = game.emulatorId || '';
    dom.formSystem.value = game.systemName || '';
    dom.formCover.value = game.coverPath || '';
    dom.formArgs.value = game.customArguments || '';
  } else {
    // Modo Novo
    dom.formModalTitle.textContent = 'Adicionar Jogo Manualmente';
    dom.formGameId.value = '';
    dom.gameForm.reset();
  }
  
  openModal(dom.modalEditForm);
}

// Abre o formulário de emulador para edição
function openEditEmulatorForm(emuId) {
  const emu = state.settings.emulators.find(e => e.id === emuId);
  if (!emu) return;

  document.getElementById('emu-modal-title').textContent = 'Editar Emulador';
  document.getElementById('emu-id').value = emu.id;
  document.getElementById('emu-name').value = emu.name;
  document.getElementById('emu-path').value = emu.path;
  document.getElementById('emu-args').value = emu.arguments;

  openModal(dom.modalAddEmulator);
}

// Envia o formulário de jogo manual/edição
async function submitGameForm(event) {
  event.preventDefault();
  
  const payload = {
    gameId: dom.formGameId.value,
    name: dom.formName.value,
    romPath: dom.formRomPath.value,
    emulatorId: dom.formEmulator.value || null,
    systemName: dom.formSystem.value || "Não Steam",
    coverUrl: dom.formCover.value || null,
    customArguments: dom.formArgs.value || null
  };
  
  const isEditing = payload.gameId !== '';
  const url = isEditing ? '/api/games/edit' : '/api/games/add-manual';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const res = await response.json();
    if (res.success) {
      closeModal(dom.modalEditForm);
      if (isEditing) {
        closeModal(dom.modalGameDetails);
      }
      await loadData(); // recarrega lista e recria grid
    } else {
      alert(`Falha ao salvar jogo: ${res.error}`);
    }
  } catch (err) {
    console.error('Erro na submissão do formulário do jogo:', err);
  }
}

// Varrer Diretórios para Identificar ROMs
async function triggerDirectoryScan() {
  if (state.isScanning) return;
  
  state.isScanning = true;
  dom.btnTriggerScan.classList.add('loading');
  dom.scanBtnText.textContent = 'Varrendo arquivos ROM e Capas...';
  
  try {
    const response = await fetch('/api/games/scan', { method: 'POST' });
    const res = await response.json();
    
    if (res.success) {
      alert(res.message);
      await loadData();
    } else {
      alert(`Erro no Scan: ${res.error}`);
    }
  } catch (err) {
    console.error('Erro ao varrer diretórios:', err);
  } finally {
    state.isScanning = false;
    dom.btnTriggerScan.classList.remove('loading');
    dom.scanBtnText.textContent = 'Varrer Diretórios & Baixar Capas';
  }
}

// ==========================================================================
// EVENT LISTENERS DO MOUSE E COMPONENTES
// ==========================================================================

function initEventListeners() {
  // Controle de Pesquisa em tempo real
  dom.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    state.focusedGameIndex = -1;
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
    renderGamesGrid();
  });
  
  // Abas superiores de Status (TODOS, FAVORITOS, etc)
  dom.navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      dom.navTabs.forEach(t => t.classList.remove('active'));
      const activeTabBtn = e.currentTarget;
      activeTabBtn.classList.add('active');
      state.activeTab = activeTabBtn.getAttribute('data-tab');
      state.focusedGameIndex = -1;
      const mainContent = document.querySelector('.main-content');
      if (mainContent) mainContent.scrollTop = 0;
      renderGamesGrid();
    });
  });
  
  // Abas de R1 / L1 virtuais por clique
  dom.navL1.addEventListener('click', navigateTabsLeft);
  dom.navR1.addEventListener('click', navigateTabsRight);
  
  // Configurações - Toggle e Close
  dom.btnSettingsToggle.addEventListener('click', () => {
    renderSettingsLists();
    openModal(dom.modalSettings);
  });
  
  dom.settingsClose.addEventListener('click', () => closeModal(dom.modalSettings));
  dom.detailsClose.addEventListener('click', () => closeModal(dom.modalGameDetails));
  dom.formClose.addEventListener('click', () => closeModal(dom.modalEditForm));
  dom.emuClose.addEventListener('click', () => closeModal(dom.modalAddEmulator));
  dom.dirClose.addEventListener('click', () => closeModal(dom.modalAddDirectory));
  
  // Botões de Adicionar e Formulários nos Modais
  dom.btnAddEmulator.addEventListener('click', () => {
    document.getElementById('emu-modal-title').textContent = 'Adicionar Novo Emulador';
    document.getElementById('emu-id').value = '';
    dom.emuForm.reset();
    openModal(dom.modalAddEmulator);
  });
  dom.btnAddDirectory.addEventListener('click', () => {
    if (state.settings.emulators.length === 0) {
      alert('Por favor, cadastre ao menos um emulador antes de associar a um diretório.');
      return;
    }
    openModal(dom.modalAddDirectory);
  });
  
  // Submissão dos Formulários
  dom.gameForm.addEventListener('submit', submitGameForm);
  
  dom.emuForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emuIdVal = document.getElementById('emu-id').value;
    const emuName = document.getElementById('emu-name').value;
    const emuPath = document.getElementById('emu-path').value;
    const emuArgs = document.getElementById('emu-args').value;

    if (emuIdVal) {
      // Modo Edição
      const idx = state.settings.emulators.findIndex(x => x.id === emuIdVal);
      if (idx !== -1) {
        state.settings.emulators[idx].name = emuName;
        state.settings.emulators[idx].path = emuPath;
        state.settings.emulators[idx].arguments = emuArgs;
      }
    } else {
      // Modo Novo
      const newEmu = {
        id: 'emu_' + Date.now(),
        name: emuName,
        path: emuPath,
        arguments: emuArgs
      };
      state.settings.emulators.push(newEmu);
    }
    
    await saveSettings(state.settings);
    dom.emuForm.reset();
    closeModal(dom.modalAddEmulator);
  });
  
  dom.dirForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const extensionsText = document.getElementById('dir-extensions').value;
    const extensions = extensionsText.split(',').map(ext => ext.trim().toLowerCase());
    
    const newDir = {
      path: document.getElementById('dir-path').value,
      emulatorId: document.getElementById('dir-emulator').value,
      extensions: extensions,
      systemName: document.getElementById('dir-system-name').value
    };
    
    state.settings.directories.push(newDir);
    await saveSettings(state.settings);
    dom.dirForm.reset();
    closeModal(dom.modalAddDirectory);
  });
  
  // Cancelar Formulários
  document.getElementById('btn-cancel-form').addEventListener('click', () => closeModal(dom.modalEditForm));
  document.getElementById('btn-cancel-emu').addEventListener('click', () => closeModal(dom.modalAddEmulator));
  document.getElementById('btn-cancel-dir').addEventListener('click', () => closeModal(dom.modalAddDirectory));
  
  // Botões Modal Detalhes do Jogo
  dom.btnPlayGame.addEventListener('click', () => {
    if (state.selectedGame) launchGame(state.selectedGame.id);
  });
  
  dom.btnToggleFavoriteDetails.addEventListener('click', () => {
    if (state.selectedGame) toggleFavorite(state.selectedGame.id);
  });
  
  dom.btnEditGameDetails.addEventListener('click', () => {
    if (state.selectedGame) openManualGameForm(state.selectedGame);
  });
  
  dom.btnDeleteGame.addEventListener('click', () => {
    if (state.selectedGame) deleteGame(state.selectedGame.id);
  });
  
  // Função auxiliar para trocar e ativar abas de configurações
  function activateSettingsTab(tabBtn, focusContent = false) {
    if (tabBtn.id === 'btn-system-exit') return; // O botão de Sair tem comportamento próprio de clique

    dom.sidebarTabs.forEach(t => t.classList.remove('active'));
    tabBtn.classList.add('active');
    
    const targetSectionId = 'section-' + tabBtn.getAttribute('data-settings-tab');
    dom.settingsSections.forEach(section => {
      if (section.id === targetSectionId) {
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
    });

    if (focusContent) {
      setTimeout(() => {
        const activeSection = document.getElementById(targetSectionId);
        if (activeSection) {
          const contentFocusables = getVisibleFocusableElements(activeSection);
          if (contentFocusables.length > 0) {
            contentFocusables[0].focus();
          }
        }
      }, 50);
    }
  }

  // Sidebar de Configurações (Troca de abas internas)
  dom.sidebarTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      if (tab.id === 'btn-system-exit') return;
      activateSettingsTab(e.currentTarget, true);
    });
    
    tab.addEventListener('focus', (e) => {
      if (tab.id === 'btn-system-exit') return;
      activateSettingsTab(e.currentTarget, false);
    });
  });
  
  // Gatilho do Scan
  dom.btnTriggerScan.addEventListener('click', triggerDirectoryScan);
  
  // Ações do Estado Vazio
  dom.emptyBtnSettings.addEventListener('click', () => {
    renderSettingsLists();
    openModal(dom.modalSettings);
  });
  dom.emptyBtnManual.addEventListener('click', () => openManualGameForm(null));
  
  // Click no Botão Virtual Steam abre o menu principal/config
  dom.btnSteamMenu.addEventListener('click', () => {
    renderSettingsLists();
    openModal(dom.modalSettings);
  });

  // Botão Sair do App
  const btnExit = document.getElementById('btn-system-exit');
  if (btnExit) {
    btnExit.addEventListener('click', async () => {
      if (confirm('Deseja realmente fechar o TurtleStation?')) {
        try {
          await fetch('/api/system/exit', { method: 'POST' });
          if (window.close) window.close();
        } catch (err) {
          console.error('Erro ao solicitar encerramento:', err);
        }
      }
    });
  }

  initGeneralSettingsHandlers();
}

// Funções Auxiliares para Nivelar Abas (L1 e R1)
function navigateTabsLeft() {
  const tabs = Array.from(document.querySelectorAll('.nav-tab'));
  const currentIdx = tabs.findIndex(t => t.classList.contains('active'));
  if (currentIdx === -1) return;
  const nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
  tabs[nextIdx].click();
}

function navigateTabsRight() {
  const tabs = Array.from(document.querySelectorAll('.nav-tab'));
  const currentIdx = tabs.findIndex(t => t.classList.contains('active'));
  if (currentIdx === -1) return;
  const nextIdx = (currentIdx + 1) % tabs.length;
  tabs[nextIdx].click();
}

// ==========================================================================
// SISTEMA DE NAVEGAÇÃO DE CONSOLE (TECLADO / GAMEPAD MAPPER)
// ==========================================================================

function handleNavigationAction(key, event = null) {
  if (state.isPlaying) return;

  if (state.keyboardActive) {
    handleVirtualKeyboardNavigation(key, event);
    return;
  }

  // Interceptador para elementos <select> (menu dropdown)
  const activeEl = document.activeElement;
  if (activeEl && activeEl.tagName === 'SELECT') {
    if (state.activeSelect === null) {
      if (key === 'Enter') {
        if (event) event.preventDefault();
        state.activeSelect = activeEl;
        activeEl.classList.add('select-editing');
        triggerGamepadVibration(40, 0.5);
        return;
      }
      if (key === 'ArrowUp' || key === 'ArrowDown') {
        if (event) event.preventDefault();
        // Permite que o fluxo continue para movimentar o foco do modal sem alterar o valor do select
      }
    } else {
      if (key === 'Enter' || key === 'Escape' || key === 'Backspace' || key === 'b' || key === 'B') {
        if (event) event.preventDefault();
        activeEl.classList.remove('select-editing');
        state.activeSelect = null;
        triggerGamepadVibration(40, 0.5);
        return;
      }
      if (key === 'ArrowUp') {
        if (event) event.preventDefault();
        activeEl.selectedIndex = Math.max(0, activeEl.selectedIndex - 1);
        activeEl.dispatchEvent(new Event('change'));
        triggerGamepadVibration(15, 0.3);
        return;
      }
      if (key === 'ArrowDown') {
        if (event) event.preventDefault();
        activeEl.selectedIndex = Math.min(activeEl.options.length - 1, activeEl.selectedIndex + 1);
        activeEl.dispatchEvent(new Event('change'));
        triggerGamepadVibration(15, 0.3);
        return;
      }
      if (event) event.preventDefault();
      return;
    }
  }

  // 1. Caso algum input de texto esteja ativo, ignorar atalhos globais de navegação
  const isInputFocused = document.activeElement && (
    document.activeElement.tagName === 'INPUT' || 
    document.activeElement.tagName === 'TEXTAREA' ||
    (document.activeElement.tagName === 'SELECT' && state.activeSelect !== null)
  );
  
  if (isInputFocused) {
    if (key === 'Escape' || key === 'Enter') {
      if (event) event.preventDefault();
      document.activeElement.blur();
      if (state.focusedGameIndex === -1 && getFilteredGames().length > 0) {
        state.focusedGameIndex = 0;
        selectCard(0);
      }
    }
    return;
  }

  const activeModal = getActiveModal();
  const isModalOpen = !!activeModal;

  // Tratamento de Esc universal para fechar qualquer modal ativo
  if (key === 'Escape' && isModalOpen) {
    if (event) event.preventDefault();
    closeActiveModal(activeModal);
    return;
  }

  // 2. Se algum modal estiver aberto, a navegação de setas do grid é interrompida
  if (isModalOpen) {
    handleModalNavigation(activeModal, key, event);
    return;
  }

  // 3. Caso contrário, navega na grid principal
  handleGridNavigation(key, event);
}

function handleModalNavigation(activeModal, key, event) {
  // 1. Navegação customizada para o modal de Configurações (composto por Sidebar e Painel de Conteúdo)
  if (activeModal === dom.modalSettings) {
    const sidebarItems = Array.from(dom.modalSettings.querySelectorAll('.settings-sidebar .sidebar-tab'));
    const activeSection = dom.modalSettings.querySelector('.settings-section:not(.hidden)');
    const contentItems = activeSection ? getVisibleFocusableElements(activeSection) : [];
    
    const currentActive = document.activeElement;
    const isInSidebar = sidebarItems.includes(currentActive);
    const isInContent = contentItems.includes(currentActive);
    
    if (isInSidebar) {
      const idx = sidebarItems.indexOf(currentActive);
      if (key === 'ArrowDown') {
        if (event) event.preventDefault();
        const nextIdx = (idx + 1) % sidebarItems.length;
        sidebarItems[nextIdx].focus();
        triggerGamepadVibration(10, 0.2);
        return;
      } else if (key === 'ArrowUp') {
        if (event) event.preventDefault();
        const prevIdx = (idx - 1 + sidebarItems.length) % sidebarItems.length;
        sidebarItems[prevIdx].focus();
        triggerGamepadVibration(10, 0.2);
        return;
      } else if (key === 'ArrowRight') {
        if (event) event.preventDefault();
        if (contentItems.length > 0) {
          contentItems[0].focus();
          triggerGamepadVibration(10, 0.25);
        }
        return;
      } else if (key === 'Enter') {
        if (event) event.preventDefault();
        currentActive.click();
        triggerGamepadVibration(20, 0.35);
        return;
      } else if (key === 'Backspace' || key === 'b' || key === 'B') {
        if (event) event.preventDefault();
        closeActiveModal(activeModal);
        return;
      }
    } else if (isInContent) {
      const idx = contentItems.indexOf(currentActive);
      if (key === 'ArrowDown' || key === 'ArrowRight') {
        if (event) event.preventDefault();
        const nextIdx = (idx + 1) % contentItems.length;
        contentItems[nextIdx].focus();
        triggerGamepadVibration(10, 0.2);
        return;
      } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
        if (event) event.preventDefault();
        if (key === 'ArrowLeft' && idx === 0) {
          const activeTab = dom.modalSettings.querySelector('.sidebar-tab.active');
          if (activeTab) {
            activeTab.focus();
            triggerGamepadVibration(10, 0.25);
          }
        } else {
          const prevIdx = (idx - 1 + contentItems.length) % contentItems.length;
          contentItems[prevIdx].focus();
          triggerGamepadVibration(10, 0.2);
        }
        return;
      } else if (key === 'Backspace' || key === 'b' || key === 'B') {
        if (event) event.preventDefault();
        // Retorna o foco para a aba ativa na barra lateral
        const activeTab = dom.modalSettings.querySelector('.sidebar-tab.active');
        if (activeTab) {
          activeTab.focus();
          triggerGamepadVibration(15, 0.3);
        }
        return;
      }
    } else {
      if (event) event.preventDefault();
      const activeTab = dom.modalSettings.querySelector('.sidebar-tab.active') || sidebarItems[0];
      if (activeTab) activeTab.focus();
      return;
    }
  }

  const focusables = getVisibleFocusableElements(activeModal);
  if (focusables.length === 0) return;

  const currentActive = document.activeElement;
  const currentIndex = focusables.indexOf(currentActive);

  // Atalhos específicos para o modal de detalhes do jogo
  if (activeModal === dom.modalGameDetails) {
    if (key === 'f' || key === 'F') {
      if (event) event.preventDefault();
      dom.btnToggleFavoriteDetails.click();
      return;
    }
    if (key === 'e' || key === 'E') {
      if (event) event.preventDefault();
      dom.btnEditGameDetails.click();
      return;
    }
    if (key === 'Backspace' || key === 'b' || key === 'B') {
      if (event) event.preventDefault();
      closeModal(dom.modalGameDetails);
      return;
    }
  }

  // Navegação linear universal dentro de modais usando Setas / D-Pad
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    if (event) event.preventDefault();
    const nextIndex = (currentIndex + 1) % focusables.length;
    focusables[nextIndex].focus();
  } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
    if (event) event.preventDefault();
    const prevIndex = (currentIndex - 1 + focusables.length) % focusables.length;
    focusables[prevIndex].focus();
  } else if (key === 'Enter') {
    if (event) event.preventDefault();
    if (currentIndex !== -1) {
      focusables[currentIndex].click();
    } else {
      focusables[0].focus();
    }
  } else if (key === 'Backspace' || key === 'b' || key === 'B') {
    if (event) event.preventDefault();
    closeActiveModal(activeModal);
  }
}

function handleGridNavigation(key, event) {
  const filtered = getFilteredGames();
  
  // Apenas as teclas de movimentação/interação da grid devem retornar se estiver vazia
  const gridKeys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Enter', 'f', 'F'];
  if (gridKeys.includes(key) && filtered.length === 0) return;

  // Calcula colunas dinamicamente com base nas posições dos elementos renderizados (muito mais robusto)
  let cols = 4;
  const cards = dom.gamesGrid.querySelectorAll('.game-card');
  if (cards.length > 0) {
    const firstTop = cards[0].offsetTop;
    let count = 0;
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].offsetTop === firstTop) {
        count++;
      } else {
        break;
      }
    }
    cols = count;
    if (cols <= 0) cols = 1;
  }

  switch (key) {
    case 'ArrowRight':
      if (event) event.preventDefault();
      if (state.focusedGameIndex === -1) {
        state.focusedGameIndex = 0;
      } else {
        state.focusedGameIndex = (state.focusedGameIndex + 1) % filtered.length;
      }
      selectCard(state.focusedGameIndex);
      break;

    case 'ArrowLeft':
      if (event) event.preventDefault();
      if (state.focusedGameIndex === -1) {
        state.focusedGameIndex = filtered.length - 1;
      } else {
        state.focusedGameIndex = (state.focusedGameIndex - 1 + filtered.length) % filtered.length;
      }
      selectCard(state.focusedGameIndex);
      break;

    case 'ArrowDown':
      if (event) event.preventDefault();
      if (state.focusedGameIndex === -1) {
        state.focusedGameIndex = 0;
      } else {
        const nextIdx = state.focusedGameIndex + cols;
        if (nextIdx < filtered.length) {
          state.focusedGameIndex = nextIdx;
        }
      }
      selectCard(state.focusedGameIndex);
      break;

    case 'ArrowUp':
      if (event) event.preventDefault();
      if (state.focusedGameIndex === -1) {
        state.focusedGameIndex = 0;
      } else {
        const prevIdx = state.focusedGameIndex - cols;
        if (prevIdx >= 0) {
          state.focusedGameIndex = prevIdx;
        }
      }
      selectCard(state.focusedGameIndex);
      break;

    case 'Enter':
      if (event) event.preventDefault();
      if (state.focusedGameIndex >= 0 && state.focusedGameIndex < filtered.length) {
        openGameDetails(filtered[state.focusedGameIndex]);
      }
      break;

    case 'PageUp':
    case 'q':
    case 'Q':
      if (event) event.preventDefault();
      navigateTabsLeft();
      break;

    case 'PageDown':
    case 'e':
    case 'E':
      if (event) event.preventDefault();
      navigateTabsRight();
      break;

    case 'Tab':
      if (event) event.preventDefault();
      if (dom.modalSettings.classList.contains('hidden')) {
        renderSettingsLists();
        openModal(dom.modalSettings);
      } else {
        closeModal(dom.modalSettings);
      }
      break;

    case 'f':
    case 'F':
      if (event) event.preventDefault();
      if (state.focusedGameIndex >= 0 && state.focusedGameIndex < filtered.length) {
        toggleFavorite(filtered[state.focusedGameIndex].id);
      }
      break;

    case '/':
      if (event) event.preventDefault();
      dom.searchInput.focus();
      dom.searchInput.select();
      break;
  }
}

function setupKeyboardNavigation() {
  window.addEventListener('keydown', (e) => {
    handleNavigationAction(e.key, e);
  });
}

// ==========================================================================
// SUPORTE A CONTROLE / JOYSTICK (GAMEPAD API)
// ==========================================================================

// ==========================================================================
// SUPORTE A CONTROLE / JOYSTICK (GAMEPAD API)
// ==========================================================================

const gamepadState = {
  inputs: {},
  pollingActive: false
};

function initGamepadSupport() {
  window.addEventListener('gamepadconnected', (e) => {
    console.log(`Gamepad conectado: ${e.gamepad.id}`);
    startGamepadPolling();
  });

  window.addEventListener('gamepaddisconnected', (e) => {
    console.log(`Gamepad desconectado: ${e.gamepad.id}`);
    if (navigator.getGamepads().filter(Boolean).length === 0) {
      stopGamepadPolling();
    }
  });

  // Autohide cursor do mouse quando o controle for usado
  let mouseMoveTimeout;
  window.addEventListener('mousemove', () => {
    document.body.classList.remove('hide-cursor');
    clearTimeout(mouseMoveTimeout);
    mouseMoveTimeout = setTimeout(() => {
      // Opcional: auto-ocultar após inatividade
    }, 5000);
  });

  // Verifica se já existe controle conectado ao inicializar
  if (navigator.getGamepads && navigator.getGamepads().filter(Boolean).length > 0) {
    startGamepadPolling();
  }
}

function hideMouseCursor() {
  document.body.classList.add('hide-cursor');
}

function triggerGamepadVibration(duration = 50, weakMagnitude = 1.0, strongMagnitude = 0.0) {
  if (!navigator.getGamepads) return;
  const gamepads = navigator.getGamepads();
  const gp = Array.from(gamepads).find(Boolean);
  if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) {
    gp.vibrationActuator.playEffect("dual-rumble", {
      startDelay: 0,
      duration: duration,
      weakMagnitude: weakMagnitude,
      strongMagnitude: strongMagnitude
    }).catch(err => {});
  }
}

function startGamepadPolling() {
  if (gamepadState.pollingActive) return;
  gamepadState.pollingActive = true;
  requestAnimationFrame(pollGamepadLoop);
}

function stopGamepadPolling() {
  gamepadState.pollingActive = false;
}

function pollGamepadLoop() {
  if (!gamepadState.pollingActive) return;
  pollGamepad();
  requestAnimationFrame(pollGamepadLoop);
}

function processGamepadInput(action, isPressed, allowRepeat = true) {
  const now = Date.now();
  if (!gamepadState.inputs[action]) {
    gamepadState.inputs[action] = { pressed: false, lastTriggered: 0, status: 'released' };
  }
  
  const stateItem = gamepadState.inputs[action];
  
  if (isPressed) {
    hideMouseCursor();
    if (stateItem.status === 'released') {
      stateItem.status = 'pressed';
      stateItem.lastTriggered = now;
      handleNavigationAction(action);
      triggerGamepadVibration(35, 0.4);
    } else if (allowRepeat) {
      if (stateItem.status === 'pressed') {
        if (now - stateItem.lastTriggered >= 400) {
          stateItem.status = 'repeating';
          stateItem.lastTriggered = now;
          handleNavigationAction(action);
          triggerGamepadVibration(15, 0.25);
        }
      } else if (stateItem.status === 'repeating') {
        if (now - stateItem.lastTriggered >= 80) {
          stateItem.lastTriggered = now;
          handleNavigationAction(action);
          triggerGamepadVibration(8, 0.15);
        }
      }
    }
  } else {
    stateItem.status = 'released';
  }
}

function pollGamepad() {
  if (state.isPlaying) return;
  if (!navigator.getGamepads) return;
  const gamepads = navigator.getGamepads();
  const gp = Array.from(gamepads).find(Boolean);
  if (!gp) return;

  // 1. Ações de Botões (Sem repetição contínua para evitar cliques indesejados)
  processGamepadInput('Enter', gp.buttons[0]?.pressed, false);      // A (Xbox) / Cross (PlayStation)
  processGamepadInput('Escape', gp.buttons[1]?.pressed, false);     // B (Xbox) / Circle (PlayStation)
  processGamepadInput('/', gp.buttons[2]?.pressed, false);          // X (Xbox) / Square (PlayStation)
  processGamepadInput('f', gp.buttons[3]?.pressed, false);          // Y (Xbox) / Triangle (PlayStation)
  processGamepadInput('Tab', gp.buttons[8]?.pressed, false);        // Select/Back (Button 8)

  // 2. Abas L1 e R1 (Permite repetição rápida se segurado para navegar entre emuladores rapidamente)
  processGamepadInput('PageUp', gp.buttons[4]?.pressed, true);      // L1
  processGamepadInput('PageDown', gp.buttons[5]?.pressed, true);    // R1

  // 3. Direcionais (D-Pad + Analógico Esquerdo com zona morta)
  const deadzone = 0.5;
  const isUp = gp.buttons[12]?.pressed || gp.axes[1] < -deadzone;
  const isDown = gp.buttons[13]?.pressed || gp.axes[1] > deadzone;
  const isLeft = gp.buttons[14]?.pressed || gp.axes[0] < -deadzone;
  const isRight = gp.buttons[15]?.pressed || gp.axes[0] > deadzone;

  processGamepadInput('ArrowUp', isUp, true);
  processGamepadInput('ArrowDown', isDown, true);
  processGamepadInput('ArrowLeft', isLeft, true);
  processGamepadInput('ArrowRight', isRight, true);
}

// ==========================================================================
// FUNÇÕES AUXILIARES ADICIONADAS PARA CONFIGURAÇÃO GERAL, ABAS E IDIOMA
// ==========================================================================

function getFlagSVG(lang) {
  if (lang === 'en') {
    return `<svg viewBox="0 0 190 100" width="22" height="22" style="border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); vertical-align: middle;">
      <rect width="190" height="100" fill="#B22234"/>
      <rect y="7.69" width="190" height="7.69" fill="#FFFFFF"/>
      <rect y="23.08" width="190" height="7.69" fill="#FFFFFF"/>
      <rect y="38.46" width="190" height="7.69" fill="#FFFFFF"/>
      <rect y="53.85" width="190" height="7.69" fill="#FFFFFF"/>
      <rect y="69.23" width="190" height="7.69" fill="#FFFFFF"/>
      <rect y="84.62" width="190" height="7.69" fill="#FFFFFF"/>
      <rect width="76" height="53.85" fill="#3C3B6E"/>
      <circle cx="12" cy="8" r="1.5" fill="#FFFFFF"/>
      <circle cx="24" cy="8" r="1.5" fill="#FFFFFF"/>
      <circle cx="36" cy="8" r="1.5" fill="#FFFFFF"/>
      <circle cx="48" cy="8" r="1.5" fill="#FFFFFF"/>
      <circle cx="60" cy="8" r="1.5" fill="#FFFFFF"/>
      <circle cx="18" cy="18" r="1.5" fill="#FFFFFF"/>
      <circle cx="30" cy="18" r="1.5" fill="#FFFFFF"/>
      <circle cx="42" cy="18" r="1.5" fill="#FFFFFF"/>
      <circle cx="54" cy="18" r="1.5" fill="#FFFFFF"/>
      <circle cx="12" cy="28" r="1.5" fill="#FFFFFF"/>
      <circle cx="24" cy="28" r="1.5" fill="#FFFFFF"/>
      <circle cx="36" cy="28" r="1.5" fill="#FFFFFF"/>
      <circle cx="48" cy="28" r="1.5" fill="#FFFFFF"/>
      <circle cx="60" cy="28" r="1.5" fill="#FFFFFF"/>
      <circle cx="18" cy="38" r="1.5" fill="#FFFFFF"/>
      <circle cx="30" cy="38" r="1.5" fill="#FFFFFF"/>
      <circle cx="42" cy="38" r="1.5" fill="#FFFFFF"/>
      <circle cx="54" cy="38" r="1.5" fill="#FFFFFF"/>
    </svg>`;
  } else if (lang === 'es') {
    return `<svg viewBox="0 0 750 500" width="22" height="22" style="border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); vertical-align: middle;">
      <rect width="750" height="500" fill="#C1272D"/>
      <rect y="125" width="750" height="250" fill="#FECB00"/>
    </svg>`;
  } else {
    return `<svg viewBox="0 0 720 504" width="22" height="22" style="border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); vertical-align: middle;">
      <rect width="720" height="504" fill="#009c3b"/>
      <polygon points="360,60 636,252 360,444 84,252" fill="#ffdf00"/>
      <circle cx="360" cy="252" r="102" fill="#002776"/>
    </svg>`;
  }
}

function applyGeneralSettings() {
  const lang = state.settings.language || 'pt';
  if (dom.btnStatus) {
    dom.btnStatus.innerHTML = getFlagSVG(lang);
  }

  const btnStyle = state.settings.buttonStyle || 'xbox';
  document.body.className = document.body.className.replace(/\bbtn-style-\S+/g, '');
  document.body.classList.add('btn-style-' + btnStyle);

  const btnX = document.querySelector('.btn-x');
  const btnY = document.querySelector('.btn-y');
  const btnA = document.querySelector('.btn-a');
  const btnB = document.querySelector('.btn-b');

  if (btnStyle === 'playstation') {
    if (btnX) btnX.textContent = '□';
    if (btnY) btnY.textContent = '△';
    if (btnA) btnA.textContent = '✕';
    if (btnB) btnB.textContent = '◯';
  } else if (btnStyle === 'teclado') {
    if (btnX) btnX.textContent = '/';
    if (btnY) btnY.textContent = 'F';
    if (btnA) btnA.textContent = 'Enter';
    if (btnB) btnB.textContent = 'Esc';
  } else {
    if (btnX) btnX.textContent = 'X';
    if (btnY) btnY.textContent = 'Y';
    if (btnA) btnA.textContent = 'A';
    if (btnB) btnB.textContent = 'B';
  }

  const avatarUrl = state.settings.avatarUrl || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';
  const avatarImg = document.getElementById('user-avatar-img');
  if (avatarImg) {
    avatarImg.src = avatarUrl;
  }
}

function initGeneralSettingsHandlers() {
  const langSelect = document.getElementById('pref-language');
  const styleSelect = document.getElementById('pref-button-style');
  const avatarUrlInput = document.getElementById('pref-avatar-url');
  const avatarFileInput = document.getElementById('pref-avatar-file');

  if (langSelect) {
    langSelect.addEventListener('change', async (e) => {
      state.settings.language = e.target.value;
      applyGeneralSettings();
      await saveSettings(state.settings);
    });
  }

  if (styleSelect) {
    styleSelect.addEventListener('change', async (e) => {
      state.settings.buttonStyle = e.target.value;
      applyGeneralSettings();
      await saveSettings(state.settings);
    });
  }

  if (avatarUrlInput) {
    avatarUrlInput.addEventListener('change', async (e) => {
      state.settings.avatarUrl = e.target.value;
      applyGeneralSettings();
      await saveSettings(state.settings);
    });
  }

  if (avatarFileInput) {
    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          state.settings.avatarUrl = event.target.result;
          if (avatarUrlInput) avatarUrlInput.value = state.settings.avatarUrl;
          applyGeneralSettings();
          await saveSettings(state.settings);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  document.querySelectorAll('.preset-avatar-opt').forEach(img => {
    img.addEventListener('click', async (e) => {
      state.settings.avatarUrl = e.target.src;
      if (avatarUrlInput) avatarUrlInput.value = state.settings.avatarUrl;
      applyGeneralSettings();
      await saveSettings(state.settings);
      
      document.querySelectorAll('.preset-avatar-opt').forEach(opt => opt.style.borderColor = 'transparent');
      e.target.style.borderColor = 'var(--accent-blue)';
    });
  });

  const ssUserInput = document.getElementById('pref-ss-user');
  const ssPassInput = document.getElementById('pref-ss-pass');

  if (ssUserInput) {
    ssUserInput.addEventListener('change', async (e) => {
      state.settings.screenscraperUser = e.target.value;
      await saveSettings(state.settings);
    });
  }

  if (ssPassInput) {
    ssPassInput.addEventListener('change', async (e) => {
      state.settings.screenscraperPass = e.target.value;
      await saveSettings(state.settings);
    });
  }
}

function populateGeneralSettingsInputs() {
  const langSelect = document.getElementById('pref-language');
  const styleSelect = document.getElementById('pref-button-style');
  const avatarUrlInput = document.getElementById('pref-avatar-url');
  
  if (langSelect) langSelect.value = state.settings.language || 'pt';
  if (styleSelect) styleSelect.value = state.settings.buttonStyle || 'xbox';
  if (avatarUrlInput) avatarUrlInput.value = state.settings.avatarUrl || '';
  
  document.querySelectorAll('.preset-avatar-opt').forEach(opt => {
    if (opt.src === state.settings.avatarUrl) {
      opt.style.borderColor = 'var(--accent-blue)';
    } else {
      opt.style.borderColor = 'transparent';
    }
  });

  const ssUserInput = document.getElementById('pref-ss-user');
  const ssPassInput = document.getElementById('pref-ss-pass');
  if (ssUserInput) ssUserInput.value = state.settings.screenscraperUser || '';
  if (ssPassInput) ssPassInput.value = state.settings.screenscraperPass || '';
}

function renderTabs() {
  const wrapper = document.querySelector('.tabs-wrapper');
  if (!wrapper) return;
  wrapper.innerHTML = '';

  const allTab = document.createElement('button');
  allTab.className = `nav-tab ${state.activeTab === 'all' ? 'active' : ''}`;
  allTab.setAttribute('data-tab', 'all');
  const allCount = state.games.length;
  allTab.innerHTML = `TODOS OS JOGOS <span class="badge" id="count-all">${allCount}</span>`;
  wrapper.appendChild(allTab);

  const favTab = document.createElement('button');
  favTab.className = `nav-tab ${state.activeTab === 'favorites' ? 'active' : ''}`;
  favTab.setAttribute('data-tab', 'favorites');
  const favCount = state.games.filter(g => g.favorite).length;
  favTab.innerHTML = `FAVORITOS <span class="badge" id="count-favorites">${favCount}</span>`;
  wrapper.appendChild(favTab);

  const emulators = state.settings.emulators || [];
  emulators.forEach(emu => {
    const emuTab = document.createElement('button');
    emuTab.className = `nav-tab ${state.activeTab === emu.id ? 'active' : ''}`;
    emuTab.setAttribute('data-tab', emu.id);
    const emuCount = state.games.filter(g => g.emulatorId === emu.id).length;
    emuTab.innerHTML = `${emu.name.toUpperCase()} <span class="badge">${emuCount}</span>`;
    wrapper.appendChild(emuTab);
  });

  const newTabs = wrapper.querySelectorAll('.nav-tab');
  newTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      newTabs.forEach(t => t.classList.remove('active'));
      const activeTabBtn = e.currentTarget;
      activeTabBtn.classList.add('active');
      state.activeTab = activeTabBtn.getAttribute('data-tab');
      state.focusedGameIndex = -1;
      const mainContent = document.querySelector('.main-content');
      if (mainContent) mainContent.scrollTop = 0;
      renderGamesGrid();
      scrollToActiveTab(activeTabBtn);
    });
  });

  const activeTabExists = ['all', 'favorites'].includes(state.activeTab) || emulators.some(e => e.id === state.activeTab);
  if (!activeTabExists) {
    state.activeTab = 'all';
    const firstTab = wrapper.querySelector('.nav-tab');
    if (firstTab) firstTab.classList.add('active');
    renderGamesGrid();
  } else {
    const activeBtn = wrapper.querySelector(`.nav-tab[data-tab="${state.activeTab}"]`);
    if (activeBtn) scrollToActiveTab(activeBtn);
  }
}

function scrollToActiveTab(activeTabBtn) {
  const wrapper = document.querySelector('.tabs-wrapper');
  if (!wrapper || !activeTabBtn) return;
  const tabs = Array.from(wrapper.querySelectorAll('.nav-tab'));
  const activeIndex = tabs.indexOf(activeTabBtn);
  if (activeIndex === -1) return;
  
  const tabWidth = 160;
  const gap = 8;
  const itemWidth = tabWidth + gap;
  
  const currentScrollLeft = wrapper.scrollLeft;
  const leftIndex = Math.round(currentScrollLeft / itemWidth);
  
  let targetScrollLeft = currentScrollLeft;
  
  if (activeIndex < leftIndex) {
    targetScrollLeft = activeIndex * itemWidth;
  } else if (activeIndex >= leftIndex + 4) {
    targetScrollLeft = (activeIndex - 3) * itemWidth;
  }
  
  wrapper.scrollTo({
    left: targetScrollLeft,
    behavior: 'smooth'
  });
}

let gameStatusPollInterval = null;

function startGameStatusPolling() {
  if (gameStatusPollInterval) clearInterval(gameStatusPollInterval);
  
  gameStatusPollInterval = setInterval(async () => {
    try {
      const response = await fetch('/api/games/status');
      const data = await response.json();
      if (!data.running) {
        stopGameStatusPolling();
        state.isPlaying = false;
        hidePlayingOverlay();
        
        // Sincroniza o foco visual após voltar do jogo
        if (state.focusedGameIndex >= 0) {
          selectCard(state.focusedGameIndex);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar status do jogo:', err);
    }
  }, 1000);
}

function stopGameStatusPolling() {
  if (gameStatusPollInterval) {
    clearInterval(gameStatusPollInterval);
    gameStatusPollInterval = null;
  }
}

function showPlayingOverlay(gameName) {
  let overlay = document.getElementById('playing-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'playing-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(10, 14, 22, 0.96)';
    overlay.style.backdropFilter = 'blur(10px)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.flexDirection = 'column';
    overlay.style.color = '#ffffff';
    overlay.style.fontFamily = 'var(--font-family)';
    overlay.className = 'hidden';
    
    overlay.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--accent-blue, #1b82e6); box-shadow: 0 0 30px rgba(27,130,230,0.5); margin: 0 auto 24px auto; display: flex; align-items: center; justify-content: center; animation: pulse-glow 2s infinite;">
          <svg viewBox="0 0 24 24" width="40" height="40" style="color: #ffffff;">
            <path fill="currentColor" d="M21.58 16.09l-1.09-7.66C20.21 6.29 18.42 5 16.27 5H7.73C5.58 5 3.79 6.29 3.51 8.43l-1.09 7.66C2.18 17.82 3.5 19 5 19c.8 0 1.54-.42 1.86-1.14L9.12 13h5.76l2.26 4.86c.32.72 1.06 1.14 1.86 1.14 1.5 0 2.82-1.18 2.58-2.91zM9.5 10c-.83 0-1.5-.67-1.5-1.5S8.67 7 9.5 7s1.5.67 1.5 1.5S10.33 10 9.5 10zm6 0c-.83 0-1.5-.67-1.5-1.5S14.67 7 15.5 7s1.5.67 1.5 1.5S16.33 10 15.5 10z"/>
          </svg>
        </div>
        <h2 id="playing-game-title" style="font-size: 26px; font-weight: 700; margin: 0 0 10px 0; letter-spacing: 0.5px;">Jogando...</h2>
        <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 0 0 6px 0;">O painel do TurtleStation está suspenso temporariamente.</p>
        <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">O controle e o teclado estão direcionados para o jogo.</p>
      </div>
    `;
    
    if (!document.getElementById('playing-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'playing-pulse-style';
      style.textContent = `
        @keyframes pulse-glow {
          0% { transform: scale(1); box-shadow: 0 0 20px rgba(27,130,230,0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(27,130,230,0.8); }
          100% { transform: scale(1); box-shadow: 0 0 20px rgba(27,130,230,0.4); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(overlay);
  }
  
  const titleEl = overlay.querySelector('#playing-game-title');
  if (titleEl) titleEl.textContent = `Jogando ${gameName}`;
  
  overlay.classList.remove('hidden');
  overlay.style.display = 'flex';
}

function hidePlayingOverlay() {
  const overlay = document.getElementById('playing-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
  }
}

// ==========================================================================
// TECLADO VIRTUAL ON-SCREEN KEYBOARD (OSK)
// ==========================================================================

function showVirtualKeyboard(targetInput) {
  let keyboard = document.getElementById('virtual-keyboard');
  if (!keyboard) {
    keyboard = document.createElement('div');
    keyboard.id = 'virtual-keyboard';
    
    // Injeta os estilos CSS do teclado se não existirem
    if (!document.getElementById('virtual-keyboard-style')) {
      const style = document.createElement('style');
      style.id = 'virtual-keyboard-style';
      style.textContent = `
        #virtual-keyboard {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100vw;
          height: 280px;
          background: rgba(14, 18, 26, 0.96);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 15px;
          box-sizing: border-box;
        }
        .keyboard-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          width: 100%;
          max-width: 900px;
          justify-content: center;
        }
        .keyboard-key {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border-radius: 6px;
          padding: 10px;
          font-family: var(--font-family);
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          flex: 1;
          min-width: 40px;
          text-align: center;
          transition: all 0.12s ease;
          user-select: none;
        }
        .keyboard-key.key-focused {
          background: var(--accent-blue, #1b82e6);
          border-color: #54a0ff;
          box-shadow: 0 0 15px rgba(27, 130, 230, 0.6);
          transform: scale(1.05);
        }
        .keyboard-key.key-special {
          background: rgba(255, 255, 255, 0.1);
          flex: 2;
        }
        .keyboard-key.key-done {
          background: var(--accent-green, #38ef7d);
          color: #0e121a;
          font-weight: 700;
          flex: 2;
        }
        .keyboard-key.key-done.key-focused {
          background: #55efc4;
          box-shadow: 0 0 15px rgba(56, 239, 125, 0.7);
        }
        select.select-editing {
          border-color: var(--accent-green) !important;
          box-shadow: 0 0 0 2px rgba(56, 239, 125, 0.4), 0 0 14px rgba(56, 239, 125, 0.3) !important;
          background-color: rgba(255, 255, 255, 0.15) !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(keyboard);
  }
  
  keyboard.style.display = 'flex';
  state.keyboardActive = true;
  state.keyboardTargetInput = targetInput;
  state.keyboardRow = 0;
  state.keyboardCol = 0;
  state.keyboardShift = false;
  
  renderVirtualKeyboardKeys();
}

function hideVirtualKeyboard() {
  const keyboard = document.getElementById('virtual-keyboard');
  if (keyboard) {
    keyboard.style.display = 'none';
  }
  state.keyboardActive = false;
  if (state.keyboardTargetInput) {
    state.keyboardTargetInput.blur();
    state.keyboardTargetInput = null;
  }
}

function renderVirtualKeyboardKeys() {
  const keyboard = document.getElementById('virtual-keyboard');
  if (!keyboard) return;
  
  keyboard.querySelectorAll('.keyboard-row').forEach(r => r.remove());
  
  const layout = KEYBOARD_LAYOUT;
  
  layout.forEach((row, rIdx) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'keyboard-row';
    
    row.forEach((key, cIdx) => {
      const keyEl = document.createElement('div');
      keyEl.className = 'keyboard-key';
      keyEl.setAttribute('data-key', key);
      
      if (['SHIFT', 'SPACE', 'BACKSPACE'].includes(key)) {
        keyEl.classList.add('key-special');
      } else if (key === 'CONCLUIR') {
        keyEl.classList.add('key-done');
      }
      
      let displayText = key;
      if (key === 'SHIFT') displayText = '⇧';
      else if (key === 'SPACE') displayText = 'ESPAÇO';
      else if (key === 'BACKSPACE') displayText = '⌫';
      else if (key === 'CONCLUIR') displayText = 'PRONTO';
      else {
        displayText = state.keyboardShift ? key.toUpperCase() : key.toLowerCase();
      }
      
      keyEl.textContent = displayText;
      
      keyEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        processVirtualKeyValue(key);
      });
      
      rowEl.appendChild(keyEl);
    });
    
    keyboard.appendChild(rowEl);
  });
  
  updateKeyboardKeyFocus();
}

function updateKeyboardKeyFocus() {
  const keyboard = document.getElementById('virtual-keyboard');
  if (!keyboard) return;
  
  keyboard.querySelectorAll('.keyboard-key').forEach(k => k.classList.remove('key-focused'));
  
  const rowEl = keyboard.querySelectorAll('.keyboard-row')[state.keyboardRow];
  if (rowEl) {
    const keyEl = rowEl.querySelectorAll('.keyboard-key')[state.keyboardCol];
    if (keyEl) {
      keyEl.classList.add('key-focused');
    }
  }
}

function handleVirtualKeyboardNavigation(key, event) {
  const isPhysicalPrintableKey = event && key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey;
  if (isPhysicalPrintableKey) {
    return;
  }

  if (event) event.preventDefault();
  
  const layout = KEYBOARD_LAYOUT;
  const rowCount = layout.length;
  
  if (key === 'ArrowLeft') {
    const colCount = layout[state.keyboardRow].length;
    state.keyboardCol = (state.keyboardCol - 1 + colCount) % colCount;
    updateKeyboardKeyFocus();
    triggerGamepadVibration(10, 0.2);
  } else if (key === 'ArrowRight') {
    const colCount = layout[state.keyboardRow].length;
    state.keyboardCol = (state.keyboardCol + 1) % colCount;
    updateKeyboardKeyFocus();
    triggerGamepadVibration(10, 0.2);
  } else if (key === 'ArrowUp') {
    state.keyboardRow = (state.keyboardRow - 1 + rowCount) % rowCount;
    const colCount = layout[state.keyboardRow].length;
    state.keyboardCol = Math.min(state.keyboardCol, colCount - 1);
    updateKeyboardKeyFocus();
    triggerGamepadVibration(10, 0.2);
  } else if (key === 'ArrowDown') {
    state.keyboardRow = (state.keyboardRow + 1) % rowCount;
    const colCount = layout[state.keyboardRow].length;
    state.keyboardCol = Math.min(state.keyboardCol, colCount - 1);
    updateKeyboardKeyFocus();
    triggerGamepadVibration(10, 0.2);
  } else if (key === 'Enter') {
    clickFocusedVirtualKey();
  } else if (key === 'Escape') {
    hideVirtualKeyboard();
  } else if (key === 'Backspace' || key === 'f' || key === 'F') {
    triggerVirtualBackspace();
  } else if (key === '/') {
    triggerVirtualSpace();
  }
}

function clickFocusedVirtualKey() {
  const keyboard = document.getElementById('virtual-keyboard');
  if (!keyboard) return;
  
  const rowEl = keyboard.querySelectorAll('.keyboard-row')[state.keyboardRow];
  if (rowEl) {
    const keyEl = rowEl.querySelectorAll('.keyboard-key')[state.keyboardCol];
    if (keyEl) {
      const keyValue = keyEl.getAttribute('data-key');
      processVirtualKeyValue(keyValue);
    }
  }
}

function processVirtualKeyValue(val) {
  if (!state.keyboardTargetInput) return;
  
  const input = state.keyboardTargetInput;
  triggerGamepadVibration(25, 0.4);

  if (val === 'SHIFT') {
    state.keyboardShift = !state.keyboardShift;
    renderVirtualKeyboardKeys();
  } else if (val === 'SPACE') {
    triggerVirtualSpace();
  } else if (val === 'BACKSPACE') {
    triggerVirtualBackspace();
  } else if (val === 'CONCLUIR') {
    hideVirtualKeyboard();
  } else {
    const char = state.keyboardShift ? val.toUpperCase() : val.toLowerCase();
    
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    input.value = text.substring(0, start) + char + text.substring(end);
    
    input.selectionStart = input.selectionEnd = start + 1;
    
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function triggerVirtualSpace() {
  if (!state.keyboardTargetInput) return;
  const input = state.keyboardTargetInput;
  triggerGamepadVibration(20, 0.3);

  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;
  input.value = text.substring(0, start) + ' ' + text.substring(end);
  input.selectionStart = input.selectionEnd = start + 1;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function triggerVirtualBackspace() {
  if (!state.keyboardTargetInput) return;
  const input = state.keyboardTargetInput;
  triggerGamepadVibration(20, 0.35);

  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;
  
  if (start > 0 || start !== end) {
    if (start === end) {
      input.value = text.substring(0, start - 1) + text.substring(end);
      input.selectionStart = input.selectionEnd = start - 1;
    } else {
      input.value = text.substring(0, start) + text.substring(end);
      input.selectionStart = input.selectionEnd = start;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
