const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const app = express();
const PORT = 3000;

// Configurações de caminhos de arquivos
const DATA_DIR = process.env.TURTLESTATION_DATA_DIR || path.join(__dirname, 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const COVERS_DIR = path.join(DATA_DIR, 'covers');

// Dicionário de Mapeamento MAME ROM -> Título Completo para Scraper
const MAME_MAP = {
  "pacman": "Pac-Man",
  "puckman": "Pac-Man",
  "mspacman": "Ms. Pac-Man",
  "mslug": "Metal Slug - Super Vehicle-001",
  "mslug2": "Metal Slug 2 - Super Vehicle-001/II",
  "mslug3": "Metal Slug 3",
  "mslug4": "Metal Slug 4",
  "mslug5": "Metal Slug 5",
  "mslugx": "Metal Slug X - Super Vehicle-001",
  "sf2": "Street Fighter II - The World Warrior",
  "sf2ce": "Street Fighter II' - Champion Edition",
  "sf2hf": "Street Fighter II' - Turbo: Hyper Fighting",
  "ssf2": "Super Street Fighter II - The New Challengers",
  "ssf2t": "Super Street Fighter II Turbo",
  "kof94": "The King of Fighters '94",
  "kof95": "The King of Fighters '95",
  "kof96": "The King of Fighters '96",
  "kof97": "The King of Fighters '97",
  "kof98": "The King of Fighters '98 - The Slugfest",
  "kof99": "The King of Fighters '99 - Millennium Battle",
  "kof2000": "The King of Fighters 2000",
  "kof2002": "The King of Fighters 2002 - Challenge to Ultimate Battle",
  "captcomm": "Captain Commando",
  "dino": "Cadillacs and Dinosaurs",
  "punisher": "The Punisher",
  "simpsons": "The Simpsons",
  "tmnt": "Teenage Mutant Ninja Turtles",
  "tmnt2": "Teenage Mutant Ninja Turtles - Turtles in Time",
  "xmen": "X-Men",
  "avsp": "Alien vs. Predator",
  "mario": "Mario Bros.",
  "dkong": "Donkey Kong",
  "dkongjr": "Donkey Kong Junior",
  "dkong3": "Donkey Kong 3",
  "galaga": "Galaga",
  "galaxian": "Galaxian",
  "digdug": "Dig Dug",
  "bubble": "Bubble Bobble",
  "contra": "Contra",
  "1942": "1942",
  "1943": "1943 - The Battle of Midway",
  "outrun": "Out Run",
  "shinobi": "Shinobi",
  "goldnaxe": "Golden Axe",
  "alterad": "Altered Beast",
  "finalfight": "Final Fight",
  "ffight": "Final Fight",
  "ghouls": "Ghouls'n Ghosts",
  "ghosts": "Ghosts'n Goblins",
  "gng": "Ghosts'n Goblins",
  "commando": "Commando",
  "snowbros": "Snow Bros. - Nick & Tom",
  "tumblep": "Tumble Pop",
  "pang": "Pang",
  "spang": "Super Pang",
  "tekken": "Tekken",
  "tekken2": "Tekken 2",
  "tekken3": "Tekken 3",
  "mk": "Mortal Kombat",
  "mk2": "Mortal Kombat II",
  "umk3": "Ultimate Mortal Kombat 3",
  "wjammers": "Windjammers",
  "rygar": "Rygar",
  "strider": "Strider",
  "paperboy": "Paperboy",
  "joust": "Joust",
  "defender": "Defender",
  "asteroids": "Asteroids",
  "centiped": "Centipede",
  "tempest": "Tempest",
  "gauntlet": "Gauntlet",
  "tetris": "Tetris",
  "rampage": "Rampage",
  "qbert": "Q*bert"
};

// Middleware
app.use(cors());
app.use(express.json());

// Garante que as pastas necessárias existem
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR);

// Serve arquivos estáticos do frontend e as capas baixadas
app.use(express.static(path.join(__dirname, 'public')));
app.use('/covers', express.static(COVERS_DIR));

// Função auxiliar para carregar arquivos JSON com segurança
function loadJSON(filePath, defaultData = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Erro ao carregar ${filePath}:`, err);
  }
  return defaultData;
}

// Função auxiliar para salvar JSON
function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Erro ao salvar ${filePath}:`, err);
    return false;
  }
}

// Limpa nome do jogo para fins de exibição e busca
function cleanGameName(fileName) {
  // Remove extensões comuns, parênteses e colchetes
  let cleaned = fileName.replace(/\.[^/.]+$/, ""); // remove extension
  cleaned = cleaned.replace(/\(.*?\)/g, ""); // remove (USA), (Japan), etc
  cleaned = cleaned.replace(/\[.*?\]/g, ""); // remove [!], [a1], etc
  cleaned = cleaned.replace(/\s+/g, " ").trim(); // remove espaços duplicados
  return cleaned;
}

// Função para buscar e baixar capa
async function downloadCover(game) {
  const gameId = game.id;
  const systemName = game.systemName;
  const romName = game.romName;
  const cleanName = game.name;
  const romPath = game.romPath;
  const romFilename = path.basename(romPath);

  const targetPath = path.join(COVERS_DIR, `${gameId}.png`);

  // Se já tem capa salva localmente, não faz nada
  if (fs.existsSync(targetPath)) {
    return `/covers/${gameId}.png`;
  }

  // 1. Tentar Screenscraper API v2 se credenciais estiverem salvas
  const settings = loadJSON(SETTINGS_FILE, { emulators: [], directories: [] });
  const ssid = settings.screenscraperUser || '';
  const sspassword = settings.screenscraperPass || '';

  if (ssid && sspassword) {
    try {
      console.log(`[Screenscraper] Buscando capa para ROM: ${romFilename}...`);
      const softname = 'recalboxfront';
      const devid = 'recalboxfront';
      const devpassword = 'recalboxfront';
      
      const ssUrl = `https://api.screenscraper.fr/api2/jeuInfos.php?devid=${devid}&devpassword=${devpassword}&softname=${softname}&output=json&romnom=${encodeURIComponent(romFilename)}&ssid=${encodeURIComponent(ssid)}&sspassword=${encodeURIComponent(sspassword)}`;
      
      const response = await fetch(ssUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.response && data.response.jeu && data.response.jeu.medias) {
          const mediaList = data.response.jeu.medias;
          // Procuramos por box2d (capa 2D), depois box3d, depois screenshot
          let media = mediaList.find(m => m.type === 'box2d');
          if (!media) media = mediaList.find(m => m.type === 'box3d');
          if (!media) media = mediaList.find(m => m.type === 'ss');

          if (media && media.url) {
            console.log(`[Screenscraper] Encontrada imagem no Screenscraper: ${media.url}`);
            const imageResponse = await fetch(media.url);
            if (imageResponse.ok) {
              const buffer = await imageResponse.arrayBuffer();
              fs.writeFileSync(targetPath, Buffer.from(buffer));
              console.log(`Capa baixada com sucesso (Screenscraper) para o jogo: ${cleanName}`);
              return `/covers/${gameId}.png`;
            }
          }
        }
      } else {
        console.warn(`[Screenscraper] API retornou status: ${response.status} para ${romFilename}`);
      }
    } catch (err) {
      console.error(`[Screenscraper] Erro ao buscar capa para ${cleanName}:`, err.message);
    }
  } else {
    console.warn(`[Screenscraper] Usuário/Senha do Screenscraper não configurados. Pulando busca...`);
  }

  // 2. Fallback: Tentar Libretro Thumbnails
  let systemFolder = systemName;
  let queryTitle = romName;

  if (systemName === 'MAME' || systemName.toLowerCase().includes('arcade')) {
    systemFolder = 'MAME';
    // Verifica se temos no dicionário
    const cleanLower = romName.toLowerCase().replace(/\.[^/.]+$/, "");
    if (MAME_MAP[cleanLower]) {
      queryTitle = MAME_MAP[cleanLower];
    } else {
      queryTitle = cleanName; // fallback
    }
  }

  if (systemFolder) {
    // Ex: https://thumbnails.libretro.com/Nintendo - Super Nintendo Entertainment System/Named_Boxarts/Super Mario World (USA).png
    const encodedSystem = encodeURIComponent(systemFolder);
    const encodedTitle = encodeURIComponent(queryTitle);
    const libretroUrl = `https://thumbnails.libretro.com/${encodedSystem}/Named_Boxarts/${encodedTitle}.png`;

    try {
      console.log(`Tentando Libretro Thumbnails: ${libretroUrl}`);
      const response = await fetch(libretroUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(targetPath, Buffer.from(buffer));
        console.log(`Capa baixada com sucesso (Libretro) para o jogo: ${cleanName}`);
        return `/covers/${gameId}.png`;
      }
    } catch (err) {
      console.error(`Erro ao conectar com Libretro para ${cleanName}:`, err.message);
    }
  }

  // 3. Fallback: Tentar Steam Store API
  try {
    const steamSearchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(cleanName)}&l=english&cc=US`;
    console.log(`Tentando Steam API para ${cleanName}: ${steamSearchUrl}`);
    const searchResponse = await fetch(steamSearchUrl);
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.total > 0 && searchData.items && searchData.items.length > 0) {
        const appid = searchData.items[0].id;
        // Pega a imagem da biblioteca vertical de alta qualidade
        const steamImageUrl = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/library_600x900_2x.jpg`;
        console.log(`Tentando baixar da Steam: ${steamImageUrl}`);
        const imageResponse = await fetch(steamImageUrl);
        if (imageResponse.ok) {
          const buffer = await imageResponse.arrayBuffer();
          fs.writeFileSync(targetPath, Buffer.from(buffer));
          console.log(`Capa baixada com sucesso (Steam) para o jogo: ${cleanName}`);
          return `/covers/${gameId}.png`;
        }
      }
    }
  } catch (err) {
    console.error(`Erro ao conectar com Steam API para ${cleanName}:`, err.message);
  }

  console.log(`Nenhuma capa encontrada para ${cleanName}. Usará fallback gradiente no frontend.`);
  return null;
}

// Recursivamente lê um diretório e retorna caminhos absolutos de arquivos
function scanDirectory(dirPath, extensions) {
  let results = [];
  if (!fs.existsSync(dirPath)) return results;

  try {
    const list = fs.readdirSync(dirPath);
    list.forEach((file) => {
      const filePath = path.join(dirPath, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(scanDirectory(filePath, extensions));
        } else {
          const ext = path.extname(file).toLowerCase().replace('.', '');
          if (extensions.includes(ext)) {
            results.push(filePath);
          }
        }
      } catch (err) {
        console.warn(`Erro ao obter status do arquivo ${filePath}:`, err.message);
      }
    });
  } catch (err) {
    console.error(`Erro ao ler o diretório ${dirPath}:`, err.message);
  }

  return results;
}

// ================= ROTAS DE CONFIGURAÇÕES =================

app.get('/api/settings', (req, res) => {
  const settings = loadJSON(SETTINGS_FILE, { emulators: [], directories: [] });
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const newSettings = req.body;
  if (saveJSON(SETTINGS_FILE, newSettings)) {
    res.json({ success: true, settings: newSettings });
  } else {
    res.status(500).json({ error: 'Não foi possível salvar as configurações.' });
  }
});

// ================= ROTAS DE JOGOS =================

app.get('/api/games', (req, res) => {
  const games = loadJSON(GAMES_FILE, []);
  res.json(games);
});

app.post('/api/games/scan', async (req, res) => {
  const settings = loadJSON(SETTINGS_FILE, { emulators: [], directories: [] });
  let games = loadJSON(GAMES_FILE, []);
  let newGamesCount = 0;

  console.log('Iniciando varredura de diretórios...');

  for (const dir of settings.directories) {
    if (!fs.existsSync(dir.path)) {
      console.warn(`Caminho não encontrado: ${dir.path}`);
      continue;
    }

    const files = scanDirectory(dir.path, dir.extensions);
    console.log(`Encontrados ${files.length} arquivos compatíveis em ${dir.path}`);

    for (const filePath of files) {
      const gameId = Buffer.from(filePath).toString('base64').replace(/=/g, '').replace(/\//g, '_').replace(/\+/g, '-');
      
      // Verifica se já existe
      const exists = games.some(g => g.id === gameId);
      if (!exists) {
        const fileName = path.basename(filePath);
        const name = cleanGameName(fileName);
        const romName = fileName.replace(/\.[^/.]+$/, ""); // Sem extensão

        const newGame = {
          id: gameId,
          name: name,
          romName: romName,
          romPath: filePath,
          emulatorId: dir.emulatorId,
          systemName: dir.systemName || "MAME",
          coverPath: null,
          favorite: false,
          addedAt: new Date().toISOString()
        };

        games.push(newGame);
        newGamesCount++;
      }
    }
  }

  saveJSON(GAMES_FILE, games);

  // Executa scraper em segundo plano para jogos recém adicionados que estão sem capa
  const unscraped = games.filter(g => !g.coverPath);
  console.log(`Iniciando scrape de capas em segundo plano para ${unscraped.length} jogos...`);
  
  // Scrape assíncrono em segundo plano para não travar a resposta HTTP
  (async () => {
    let updated = false;
    for (const game of unscraped) {
      const path = await downloadCover(game);
      if (path) {
        game.coverPath = path;
        updated = true;
      }
      // Delay sutil para não sobrecarregar servidores
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (updated) {
      saveJSON(GAMES_FILE, games);
    }
  })();

  res.json({ success: true, message: `Scan concluído. ${newGamesCount} novos jogos adicionados. Scraper de capas rodando em background.` });
});

// Força o scrape de um único jogo
app.post('/api/games/scrape', async (req, res) => {
  const { gameId } = req.body;
  let games = loadJSON(GAMES_FILE, []);
  const gameIndex = games.findIndex(g => g.id === gameId);

  if (gameIndex === -1) {
    return res.status(404).json({ error: 'Jogo não encontrado.' });
  }

  const coverPath = await downloadCover(games[gameIndex]);
  if (coverPath) {
    games[gameIndex].coverPath = coverPath;
    saveJSON(GAMES_FILE, games);
    res.json({ success: true, coverPath });
  } else {
    res.json({ success: false, message: 'Não foi possível encontrar uma capa.' });
  }
});

// Adiciona jogo manualmente (ex: jogo de PC / Não Steam)
app.post('/api/games/add-manual', (req, res) => {
  const { name, romPath, emulatorId, systemName, coverUrl, customArguments } = req.body;
  let games = loadJSON(GAMES_FILE, []);

  if (!name || !romPath) {
    return res.status(400).json({ error: 'Nome do jogo e caminho da ROM/executável são obrigatórios.' });
  }

  const gameId = 'manual_' + Date.now();
  const newGame = {
    id: gameId,
    name,
    romName: name,
    romPath,
    emulatorId: emulatorId || null,
    systemName: systemName || "Não Steam",
    coverPath: coverUrl || null,
    favorite: false,
    customArguments: customArguments || null,
    addedAt: new Date().toISOString()
  };

  games.push(newGame);
  saveJSON(GAMES_FILE, games);

  // Se passou URL de capa externa, tenta baixar localmente
  if (coverUrl && coverUrl.startsWith('http')) {
    (async () => {
      try {
        const response = await fetch(coverUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const targetPath = path.join(COVERS_DIR, `${gameId}.png`);
          fs.writeFileSync(targetPath, Buffer.from(buffer));
          newGame.coverPath = `/covers/${gameId}.png`;
          saveJSON(GAMES_FILE, games);
        }
      } catch (err) {
        console.error('Erro ao baixar capa manual:', err);
      }
    })();
  }

  res.json({ success: true, game: newGame });
});

// Atualiza detalhes do jogo (editar)
app.post('/api/games/edit', async (req, res) => {
  const { gameId, name, emulatorId, systemName, customArguments, coverUrl } = req.body;
  let games = loadJSON(GAMES_FILE, []);
  const idx = games.findIndex(g => g.id === gameId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Jogo não encontrado.' });
  }

  games[idx].name = name || games[idx].name;
  games[idx].emulatorId = emulatorId !== undefined ? emulatorId : games[idx].emulatorId;
  games[idx].systemName = systemName !== undefined ? systemName : games[idx].systemName;
  games[idx].customArguments = customArguments !== undefined ? customArguments : games[idx].customArguments;

  if (coverUrl) {
    if (coverUrl.startsWith('http')) {
      try {
        const response = await fetch(coverUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const targetPath = path.join(COVERS_DIR, `${gameId}.png`);
          fs.writeFileSync(targetPath, Buffer.from(buffer));
          games[idx].coverPath = `/covers/${gameId}.png`;
        }
      } catch (err) {
        console.error('Erro ao baixar nova capa:', err);
      }
    } else {
      games[idx].coverPath = coverUrl;
    }
  }

  saveJSON(GAMES_FILE, games);
  res.json({ success: true, game: games[idx] });
});

// Deleta um jogo
app.post('/api/games/delete', (req, res) => {
  const { gameId } = req.body;
  let games = loadJSON(GAMES_FILE, []);
  const filtered = games.filter(g => g.id !== gameId);

  if (games.length === filtered.length) {
    return res.status(404).json({ error: 'Jogo não encontrado.' });
  }

  // Opcional: deleta capa local
  const coverFile = path.join(COVERS_DIR, `${gameId}.png`);
  if (fs.existsSync(coverFile)) {
    try {
      fs.unlinkSync(coverFile);
    } catch (err) {
      console.error('Erro ao excluir arquivo de capa:', err);
    }
  }

  saveJSON(GAMES_FILE, filtered);
  res.json({ success: true, message: 'Jogo removido com sucesso.' });
});

// Alterna favorito
app.post('/api/games/toggle-favorite', (req, res) => {
  const { gameId } = req.body;
  let games = loadJSON(GAMES_FILE, []);
  const idx = games.findIndex(g => g.id === gameId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Jogo não encontrado.' });
  }

  games[idx].favorite = !games[idx].favorite;
  saveJSON(GAMES_FILE, games);
  res.json({ success: true, favorite: games[idx].favorite });
});

// ================= LANÇAR EMULADOR / JOGO =================

let activeGameProcess = null;
let isGameRunning = false;

app.get('/api/games/status', (req, res) => {
  res.json({ running: isGameRunning });
});

app.post('/api/games/launch', (req, res) => {
  const { gameId } = req.body;
  const games = loadJSON(GAMES_FILE, []);
  const game = games.find(g => g.id === gameId);

  if (!game) {
    return res.status(404).json({ error: 'Jogo não encontrado.' });
  }

  // Verifica emulador associado
  const settings = loadJSON(SETTINGS_FILE, { emulators: [], directories: [] });
  
  let emulator = null;
  if (game.emulatorId) {
    emulator = settings.emulators.find(e => e.id === game.emulatorId);
  }

  let cmd = '';
  let args = [];

  if (emulator) {
    cmd = emulator.path;
    const argumentString = game.customArguments || emulator.arguments || "{rom_path}";
    
    // Divide os argumentos primeiro (respeitando aspas)
    args = argumentString.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    // Substitui {rom_path} e limpa aspas de cada argumento individualmente
    args = args.map(arg => {
      let replaced = arg.replace("{rom_path}", game.romPath);
      return replaced.replace(/^"|"$/g, '');
    });
  } else {
    // Se não tiver emulador (PC game direto)
    // Assume que a ROM na verdade é o próprio executável ou deve ser rodado via xdg-open/bash
    cmd = game.romPath;
    if (game.customArguments) {
      args = game.customArguments.split(' ');
    }
  }

  console.log(`Lançando comando: ${cmd} com argumentos: ${args.join(' ')}`);

  const logFile = path.join(DATA_DIR, 'emulator.log');
  let logFd = null;
  try {
    fs.writeFileSync(logFile, `=== Lançamento: ${new Date().toLocaleString()} ===\nComando: ${cmd} ${args.join(' ')}\n\n`);
    logFd = fs.openSync(logFile, 'a');
  } catch (err) {
    console.error('Falha ao preparar log do emulador:', err);
  }

  try {
    const stdioOption = logFd ? ['ignore', logFd, logFd] : 'ignore';
    
    // Lança processo totalmente desacoplado do servidor Express
    // Redireciona stdout e stderr para o arquivo de log para depuração
    const child = spawn(cmd, args, {
      detached: true,
      stdio: stdioOption
    });

    isGameRunning = true;
    activeGameProcess = child;

    child.on('exit', (code) => {
      console.log(`Jogo/Emulador finalizado com código: ${code}`);
      isGameRunning = false;
      activeGameProcess = null;
    });

    child.unref();

    // Fecha a referência do file descriptor local (o filho mantém a duplicata)
    if (logFd) {
      fs.closeSync(logFd);
    }

    res.json({ success: true, message: `Lançado com sucesso: ${game.name}` });
  } catch (err) {
    // Garante o fechamento do fd em caso de erro no spawn
    if (logFd) {
      try { fs.closeSync(logFd); } catch(e) {}
    }
    isGameRunning = false;
    activeGameProcess = null;
    console.error('Erro ao lançar executável:', err);
    res.status(500).json({ error: `Falha ao executar o jogo: ${err.message}` });
  }
});

app.post('/api/system/exit', (req, res) => {
  res.json({ success: true });
  console.log('Encerrando o aplicativo TurtleStation...');
  setTimeout(() => {
    process.exit(0);
  }, 500);
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
