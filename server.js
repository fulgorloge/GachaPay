  const sampleRewards = [
    { name: 'Wallpaper Exclusivo 4K', rarity: 'C', label: 'Común (C)', color: 'text-slate-400' },
    { name: 'Pack de Stickers Privados', rarity: 'R', label: 'Raro (R)', color: 'text-blue-400' },
    { name: 'Clip de Video Inédito HD', rarity: 'SR', label: 'Super Raro (SR)', color: 'text-purple-400' },
    { name: '¡Acceso VIP Total al Canal!', rarity: 'SSR', label: 'Ultra Raro (SSR)', color: 'text-amber-400' }
  ];

  function scrollToCreator() {
    document.getElementById('creatorSection').scrollIntoView({ behavior: 'smooth' });
  }

  function getWeightedReward() {
    const rand = Math.random() * 100;
    let targetRarity = 'C';
    if (rand > 96) targetRarity = 'SSR';
    else if (rand > 82) targetRarity = 'SR';
    else if (rand > 55) targetRarity = 'R';

    let pool = sampleRewards.filter(r => r.rarity === targetRarity);
    if (pool.length === 0) pool = sampleRewards;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function initGame(type) {
    document.querySelectorAll('.game-card').forEach(el => el.classList.remove('border-amber-500', 'bg-slate-800', 'shadow-lg', 'shadow-amber-500/10'));
    event.currentTarget.classList.add('border-amber-500', 'bg-slate-800', 'shadow-lg', 'shadow-amber-500/10');

    const container = document.getElementById('gameContainer');
    const title = document.getElementById('gameTitle');

    if (type === 'ROULETTE') {
      title.innerText = 'Ruleta de Neón';
      container.innerHTML = `
        <div class="flex flex-col items-center gap-4">
          <div class="relative flex items-center justify-center">
            <div class="absolute -top-3 text-amber-400 text-xl z-10 drop-shadow">▼</div>
            <div id="rouletteWheel" class="w-28 h-28 rounded-full border-4 border-amber-500 flex items-center justify-center text-4xl bg-slate-900 shadow-2xl shadow-amber-500/30 transition-all">🎡</div>
          </div>
          <p id="rouletteText" class="text-xs text-slate-300">Gira la ruleta y prueba tu suerte</p>
          <button onclick="playRoulette()" id="rBtn" class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95">Girar Ruleta</button>
        </div>
      `;
    } else if (type === 'CHEST') {
      title.innerText = 'Cofre del Tesoro Arcano';
      container.innerHTML = `
        <div class="flex flex-col items-center gap-4">
          <div id="chestBox" onclick="playChest()" class="text-6xl cursor-pointer hover:scale-110 transition anim-chest select-none">🎁</div>
          <p id="chestText" class="text-xs text-slate-300">Toca el cofre para forzar su apertura</p>
        </div>
      `;
    } else if (type === 'SCRATCH') {
      title.innerText = 'Raspa y Gana de Lujo';
      container.innerHTML = `
        <div class="flex flex-col items-center gap-4">
          <div id="scratchCard" onclick="playScratch()" class="w-52 h-20 bg-slate-900 hover:bg-slate-800 border-2 border-dashed border-amber-500/70 rounded-xl flex items-center justify-center cursor-pointer transition shadow-inner">
            <span id="scratchText" class="text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse">¡Toca para Raspar!</span>
          </div>
        </div>
      `;
    } else if (type === 'SLOTS') {
      title.innerText = 'Tragamonedas Clásico';
      container.innerHTML = `
        <div class="flex flex-col items-center gap-4">
          <div class="flex gap-3 text-3xl bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <span id="s1" class="transition-transform">💎</span>
            <span id="s2" class="transition-transform">⭐</span>
            <span id="s3" class="transition-transform">🔥</span>
          </div>
          <p id="slotsText" class="text-xs text-slate-300">Consigue 3 símbolos iguales</p>
          <button onclick="playSlots()" id="slotsBtn" class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95">Girar Slots</button>
        </div>
      `;
    } else if (type === 'CRYSTAL') {
      title.innerText = 'Esfera de Cristal Adivinatoria';
      container.innerHTML = `
        <div class="flex flex-col items-center gap-4">
          <div onclick="playCrystal()" class="text-6xl cursor-pointer hover:scale-110 transition anim-chest select-none">🔮</div>
          <p id="crystalText" class="text-xs text-slate-300">Interactúa con la esfera para invocar tu premio</p>
        </div>
      `;
    } else if (type === 'LOTTO') {
      title.innerText = 'Lotería de Píxeles';
      container.innerHTML = `
        <div class="flex flex-col items-center gap-3">
          <p class="text-xs text-slate-300">Elige un bloque misterioso:</p>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="playLotto(0, this)" class="lotto-btn p-3 bg-slate-950 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500 rounded-xl text-lg font-bold transition">?</button>
            <button onclick="playLotto(1, this)" class="lotto-btn p-3 bg-slate-950 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500 rounded-xl text-lg font-bold transition">?</button>
            <button onclick="playLotto(2, this)" class="lotto-btn p-3 bg-slate-950 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500 rounded-xl text-lg font-bold transition">?</button>
          </div>
          <p id="lottoText" class="text-[11px] text-amber-400 mt-1 h-4"></p>
        </div>
      `;
    } else if (type === 'RPS') {
      title.innerText = 'Piedra Papel o Tijera Épico';
      container.innerHTML = `
        <div class="flex flex-col items-center gap-3">
          <p class="text-xs text-slate-300">Elige tu arma:</p>
          <div class="flex gap-3">
            <button onclick="playRPS('🪨')" class="p-3 bg-slate-950 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500 rounded-xl text-2xl transition">🪨</button>
            <button onclick="playRPS('📄')" class="p-3 bg-slate-950 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500 rounded-xl text-2xl transition">📄</button>
            <button onclick="playRPS('✂️')" class="p-3 bg-slate-950 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500 rounded-xl text-2xl transition">✂️</button>
          </div>
          <p id="rpsText" class="text-xs text-amber-400 mt-1">¡Gana automáticamente una recompensa!</p>
        </div>
      `;
    } else if (type === 'PLINKO') {
      title.innerText = 'Plinko de la Suerte';
      container.innerHTML = `
        <div class="flex flex-col items-center gap-3">
          <div class="flex justify-between w-48 text-[11px] text-slate-400 border-b border-slate-800 pb-1">
            <span>🎯 2x</span><span class="text-amber-400 font-bold">🎯 5x</span><span>🎯 2x</span>
          </div>
          <button onclick="playPlinko()" id="pBtn" class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20">Soltar Esfera</button>
          <p id="plinkoText" class="text-xs text-slate-300">Suelta la ficha para definir multiplicador</p>
        </div>
      `;
    } else if (type === 'TOWER') {
      title.innerText = 'Torre de Cartas';
      container.innerHTML = `
        <div class="flex flex-col items-center gap-3">
          <div class="flex gap-2">
            <div onclick="playTower(0, this)" class="w-12 h-16 bg-slate-950 hover:bg-slate-900 border border-amber-500/50 rounded-xl flex items-center justify-center text-xl cursor-pointer hover:scale-105 transition shadow-lg">🎴</div>
            <div onclick="playTower(1, this)" class="w-12 h-16 bg-slate-950 hover:bg-slate-900 border border-amber-500/50 rounded-xl flex items-center justify-center text-xl cursor-pointer hover:scale-105 transition shadow-lg">🎴</div>
            <div onclick="playTower(2, this)" class="w-12 h-16 bg-slate-950 hover:bg-slate-900 border border-amber-500/50 rounded-xl flex items-center justify-center text-xl cursor-pointer hover:scale-105 transition shadow-lg">🎴</div>
          </div>
          <p id="towerText" class="text-xs text-slate-300">Selecciona una carta de la torre misteriosa</p>
        </div>
      `;
    } else if (type === 'COIN') {
      title.innerText = 'Lanza-Monedas Cuántico';
      container.innerHTML = `
        <div class="flex flex-col items-center gap-4">
          <div id="coinObj" class="text-5xl select-none">🪙</div>
          <p id="coinText" class="text-xs text-slate-300">Lanza la moneda al aire</p>
          <button onclick="playCoin()" id="cBtn" class="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95">Lanzar Moneda</button>
        </div>
      `;
    }
  }

  // --- EJECUCIÓN CON FEEDBACK VISUAL Y RAREZAS ---
  function renderRewardResult(elementId, won) {
    const el = document.getElementById(elementId);
    let rarityClass = 'rarity-c';
    if (won.rarity === 'SSR') rarityClass = 'rarity-ssr';
    else if (won.rarity === 'SR') rarityClass = 'rarity-sr';
    else if (won.rarity === 'R') rarityClass = 'rarity-r';

    el.className = `p-3 rounded-xl border text-center transition anim-reward ${rarityClass}`;
    el.innerHTML = `
      <span class="text-[10px] uppercase font-bold tracking-widest ${won.color}">${won.label}</span>
      <h5 class="text-xs font-black text-white mt-0.5">${won.name}</h5>
    `;
  }

  function playRoulette() {
    const wheel = document.getElementById('rouletteWheel');
    const text = document.getElementById('rouletteText');
    const btn = document.getElementById('rBtn');
    btn.disabled = true;
    wheel.classList.add('anim-roulette');
    text.innerText = 'Girando con energía...';
    
    setTimeout(() => {
      const won = getWeightedReward();
      wheel.classList.remove('anim-roulette');
      text.id = 'rouletteResult';
      renderRewardResult('rouletteResult', won);
      btn.disabled = false;
      btn.innerText = '¡Tirar de Nuevo!';
    }, 2500);
  }

  function playChest() {
    const chest = document.getElementById('chestBox');
    const container = chest.parentElement;
    chest.classList.add('anim-shake');
    
    setTimeout(() => {
      const won = getWeightedReward();
      container.innerHTML = `
        <div class="text-5xl mb-1 anim-reward">✨📦✨</div>
        <div id="chestResult" class="w-full"></div>
      `;
      renderRewardResult('chestResult', won);
    }, 400);
  }

  function playScratch() {
    const card = document.getElementById('scratchCard');
    const won = getWeightedReward();
    let rarityClass = 'rarity-c';
    if (won.rarity === 'SSR') rarityClass = 'rarity-ssr';
    else if (won.rarity === 'SR') rarityClass = 'rarity-sr';
    else if (won.rarity === 'R') rarityClass = 'rarity-r';

    card.className = `w-52 p-3 rounded-xl text-center border transition anim-reward ${rarityClass}`;
    card.innerHTML = `
      <span class="text-[9px] uppercase font-bold tracking-wider ${won.color}">${won.label}</span>
      <strong class="text-white block text-xs mt-0.5">${won.name}</strong>
    `;
  }

  function playSlots() {
    const s1 = document.getElementById('s1');
    const s2 = document.getElementById('s2');
    const s3 = document.getElementById('s3');
    const text = document.getElementById('slotsText');
    const btn = document.getElementById('slotsBtn');
    btn.disabled = true;

    let counter = 0;
    const emojis = ['💎', '⭐', '🔥', '🎁', '⚡'];
    const interval = setInterval(() => {
      s1.innerText = emojis[Math.floor(Math.random() * emojis.length)];
      s2.innerText = emojis[Math.floor(Math.random() * emojis.length)];
      s3.innerText = emojis[Math.floor(Math.random() * emojis.length)];
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        const won = getWeightedReward();
        s1.innerText = '🎁'; s2.innerText = '🎁'; s3.innerText = '🎁';
        text.id = 'slotsResult';
        renderRewardResult('slotsResult', won);
        btn.disabled = false;
        btn.innerText = '¡Girar de Nuevo!';
      }
    }, 80);
  }

  function playCrystal() {
    const text = document.getElementById('crystalText');
    const container = text.parentElement;
    const won = getWeightedReward();
    container.innerHTML = `
      <div class="text-5xl animate-bounce">🔮</div>
      <div id="crystalResult" class="w-full"></div>
    `;
    renderRewardResult('crystalResult', won);
  }

  function playLotto(index, btnElement) {
    const text = document.getElementById('lottoText');
    const won = getWeightedReward();
    document.querySelectorAll('.lotto-btn').forEach(b => {
      b.disabled = true;
      b.classList.add('opacity-50');
    });
    btnElement.classList.add('border-amber-500', 'bg-amber-500/10');
    text.id = 'lottoResult';
    renderRewardResult('lottoResult', won);
  }

  function playRPS(userChoice) {
    const choices = ['🪨', '📄', '✂️'];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    const text = document.getElementById('rpsText');
    const container = text.parentElement;
    const won = getWeightedReward();
    
    container.innerHTML = `
      <div class="text-xs text-slate-400">Tú: <span class="text-white">${userChoice}</span> vs Bot: <span class="text-white">${botChoice}</span></div>
      <div id="rpsResult" class="w-full mt-1"></div>
    `;
    renderRewardResult('rpsResult', won);
  }

  function playPlinko() {
    const text = document.getElementById('plinkoText');
    const btn = document.getElementById('pBtn');
    btn.disabled = true;
    text.innerText = 'La ficha va rebotando...';
    
    setTimeout(() => {
      const won = getWeightedReward();
      text.id = 'plinkoResult';
      renderRewardResult('plinkoResult', won);
      btn.innerText = '¡Soltar Otra!';
      btn.disabled = false;
    }, 1000);
  }

  function playTower(idx, cardElement) {
    const won = getWeightedReward();
    const parent = cardElement.parentElement.parentElement;
    parent.innerHTML = `<div id="towerResult" class="w-full"></div>`;
    renderRewardResult('towerResult', won);
  }

  function playCoin() {
    const coin = document.getElementById('coinObj');
    const text = document.getElementById('coinText');
    const btn = document.getElementById('cBtn');
    btn.disabled = true;
    coin.classList.add('anim-coin');
    text.innerText = 'Girando en el aire...';
    
    setTimeout(() => {
      const won = getWeightedReward();
      coin.classList.remove('anim-coin');
      coin.innerText = '✨🪙✨';
      text.id = 'coinResult';
      renderRewardResult('coinResult', won);
      btn.disabled = false;
      btn.innerText = '¡Lanzar de Nuevo!';
    }, 1500);
  }
