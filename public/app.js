const ITEMS_CONFIG = {
  'C': { badgeColor: 'bg-gray-700 text-gray-200 border-gray-500', glow: 'glow-c border-gray-500' },
  'R': { badgeColor: 'bg-blue-600 text-white border-blue-400', glow: 'glow-r border-blue-500' },
  'SR': { badgeColor: 'bg-purple-600 text-white border-purple-400', glow: 'glow-sr border-purple-500' },
  'SSR': { badgeColor: 'bg-amber-500 text-black border-amber-300 font-black', glow: 'glow-ssr border-amber-400' }
};

let localInventory = [];
let isRolling = false;
let totalSpent = 0;
let pityCounter = 0;

// Sistema de Audio Sintético sin archivos externos
function playSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'roll') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'SSR') {
      [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = freq;
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.4);
        o.start(ctx.currentTime + idx * 0.1);
        o.stop(ctx.currentTime + idx * 0.1 + 0.4);
      });
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.warn('Audio no soportado o bloqueado por el navegador');
  }
}

// Tirada local / Demo interactiva
function rollGacha(count = 1) {
  if (isRolling) return;
  isRolling = true;

  const cost = count === 1 ? 4.99 : 44.99;
  totalSpent += cost;
  document.getElementById('spentDisplay').innerText = `$${totalSpent.toFixed(2)}`;

  playSound('roll');

  const cardInner = document.getElementById('cardInner');
  const cardBack = document.getElementById('cardBack');
  const rewardTitle = document.getElementById('rewardTitle');
  const rarityBadge = document.getElementById('rarityBadge');
  const boxIcon = document.getElementById('boxIcon');
  const boxText = document.getElementById('boxText');

  cardInner.classList.remove('rotate-y-180');
  boxIcon.className = "text-5xl mb-3 animate-spin-custom";
  boxText.innerText = "Abriendo cápsula...";

  const DEMO_POOL = [
    { name: 'Poción Vida', rarity: 'C' },
    { name: 'Escudo Titán', rarity: 'R' },
    { name: 'Espada Rúnica', rarity: 'SR' },
    { name: 'Dragón Carmesí', rarity: 'SSR' }
  ];

  setTimeout(() => {
    pityCounter += count;
    let selectedRarity = 'C';
    
    if (pityCounter >= 30) {
      selectedRarity = 'SSR';
      pityCounter = 0;
    } else {
      const rand = Math.random() * 100;
      if (rand > 97) selectedRarity = 'SSR';
      else if (rand > 85) selectedRarity = 'SR';
      else if (rand > 60) selectedRarity = 'R';
    }

    const reward = DEMO_POOL.find(i => i.rarity === selectedRarity);
    const config = ITEMS_CONFIG[reward.rarity];

    boxIcon.className = "text-5xl mb-3 animate-bounce";
    boxText.innerText = "Presiona para tirar";

    rewardTitle.innerText = count > 1 ? `${reward.name} (+${count - 1} más)` : reward.name;
    rarityBadge.innerText = reward.rarity;
    rarityBadge.className = `px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest mb-3 ${config.badgeColor}`;
    cardBack.className = `absolute inset-0 w-full h-full bg-slate-950 border-2 rounded-xl flex flex-col items-center justify-center backface-hidden rotate-y-180 p-4 transition-all ${config.glow}`;

    cardInner.classList.add('rotate-y-180');
    playSound(reward.rarity === 'SSR' ? 'SSR' : 'reveal');

    for (let i = 0; i < count; i++) {
      localInventory.push(reward);
    }

    renderInventory();
    document.getElementById('pityText').innerText = `${pityCounter}/30 (SSR Garantizado)`;

    setTimeout(() => { isRolling = false; }, 600);
  }, 1000);
}

function renderInventory(filter = 'ALL') {
  const inventory = document.getElementById('inventory');
  const invCount = document.getElementById('invCount');

  const filtered = filter === 'ALL' 
    ? localInventory 
    : localInventory.filter(i => i.rarity === filter);

  invCount.innerText = localInventory.length;

  if (filtered.length === 0) {
    inventory.innerHTML = '<p class="text-xs text-slate-500 italic w-full">No hay ítems en esta categoría.</p>';
    return;
  }

  inventory.innerHTML = filtered.slice().reverse().map(item => {
    const config = ITEMS_CONFIG[item.rarity] || ITEMS_CONFIG['C'];
    return `
      <span class="px-2.5 py-1 text-xs rounded-lg border text-white font-medium ${config.badgeColor} shadow-sm">
        ${item.name} (${item.rarity})
      </span>
    `;
  }).join('');
}

function filterInventory(rarity) {
  renderInventory(rarity);
}

function toggleModal(show) {
  const modal = document.getElementById('ratesModal');
  modal.classList.toggle('hidden', !show);
}

function handleConnect(e) {
  e.preventDefault();
  alert('Conectando con el flujo de onboarding de Stripe Connect...');
}
