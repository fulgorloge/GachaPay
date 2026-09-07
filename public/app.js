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
let currentFilter = 'ALL';

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'roll') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

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
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.warn('Audio no soportado o bloqueado');
  }
}

const DEMO_POOL = [
  { name: 'Poción Vida', rarity: 'C' },
  { name: 'Escudo Titán', rarity: 'R' },
  { name: 'Espada Rúnica', rarity: 'SR' },
  { name: 'Dragón Carmesí', rarity: 'SSR' }
];

function evaluateSingleRoll() {
  pityCounter++;
  let selectedRarity = 'C';

  if (pityCounter >= 30) {
    selectedRarity = 'SSR';
    pityCounter = 0;
  } else {
    const rand = Math.random() * 100;
    if (rand > 97) {
      selectedRarity = 'SSR';
      pityCounter = 0;
    } else if (rand > 85) {
      selectedRarity = 'SR';
    } else if (rand > 60) {
      selectedRarity = 'R';
    }
  }

  return DEMO_POOL.find(i => i.rarity === selectedRarity);
}

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

  setTimeout(() => {
    const pulledItems = [];
    
    for (let i = 0; i < count; i++) {
      const item = evaluateSingleRoll();
      pulledItems.push(item);
      localInventory.push(item);
    }

    const rarityOrder = { 'SSR': 4, 'SR': 3, 'R': 2, 'C': 1 };
    const bestReward = pulledItems.reduce((prev, curr) => 
      rarityOrder[curr.rarity] > rarityOrder[prev.rarity] ? curr : prev
    );

    const config = ITEMS_CONFIG[bestReward.rarity];

    boxIcon.className = "text-5xl mb-3";
    boxText.innerText = "Presiona para tirar";

    rewardTitle.innerText = count > 1 ? `${bestReward.name} (+${count - 1} más)` : bestReward.name;
    rarityBadge.innerText = bestReward.rarity;
    rarityBadge.className = `px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest mb-3 ${config.badgeColor}`;
    cardBack.className = `absolute inset-0 w-full h-full bg-slate-950 border-2 rounded-2xl flex flex-col items-center justify-center backface-hidden rotate-y-180 p-4 transition-all ${config.glow}`;

    cardInner.classList.add('rotate-y-180');
    playSound(pulledItems.some(i => i.rarity === 'SSR') ? 'SSR' : 'reveal');

    renderInventory(currentFilter);
    document.getElementById('pityText').innerText = `${pityCounter}/30`;

    setTimeout(() => { isRolling = false; }, 600);
  }, 1000);
}

function renderInventory(filter = 'ALL') {
  currentFilter = filter;
  const inventory = document.getElementById('inventory');
  const invCount = document.getElementById('invCount');

  const filtered = currentFilter === 'ALL' 
    ? localInventory 
    : localInventory.filter(i => i.rarity === currentFilter);

  invCount.innerText = localInventory.length;

  if (filtered.length === 0) {
    inventory.innerHTML = '<p class="text-xs text-slate-500 italic w-full">No hay ítems en esta categoría.</p>';
    return;
  }

  inventory.innerHTML = filtered.slice().reverse().map(item => {
    const config = ITEMS_CONFIG[item.rarity] || ITEMS_CONFIG['C'];
    return `
      <span class="px-2.5 py-1 text-xs rounded-lg border font-medium ${config.badgeColor} shadow-sm">
        ${item.name} (${item.rarity})
      </span>
    `;
  }).join('');
}

function filterInventory(rarity) {
  renderInventory(rarity);
}
