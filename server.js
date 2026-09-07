import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Webhook de Stripe
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Error en firma Webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  res.json({ received: true });
});

// Crear Perfil de Creador Anónimo y elegir juego
app.post('/api/creators', async (req, res) => {
  try {
    const { name, slug, gameType } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Nombre y slug son requeridos.' });
    }
    const creator = await prisma.creator.create({
      data: { name, slug, gameType: gameType || 'ROULETTE' }
    });
    res.json(creator);
  } catch (error) {
    res.status(400).json({ error: 'El slug ya existe o los datos son inválidos.' });
  }
});

// Obtener datos del Creador por slug
app.get('/api/creators/:slug', async (req, res) => {
  try {
    const creator = await prisma.creator.findUnique({
      where: { slug: req.params.slug },
      include: { rewards: true }
    });
    if (!creator) return res.status(404).json({ error: 'Creador no encontrado' });
    res.json(creator);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar Premio Multimedia (Foto, Video, Archivo)
app.post('/api/creators/:id/rewards', async (req, res) => {
  try {
    const { name, rarity, mediaUrl, mediaType } = req.body;
    const reward = await prisma.reward.create({
      data: {
        creatorId: req.params.id,
        name,
        rarity,
        mediaUrl,
        mediaType: mediaType || 'MEDIA'
      }
    });
    res.json(reward);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Procesar tirada de juego según los premios del creador
app.post('/api/play/:creatorId', async (req, res) => {
  try {
    const { creatorId } = req.params;
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: { rewards: true }
    });

    if (!creator || creator.rewards.length === 0) {
      return res.status(400).json({ error: 'Este creador aún no ha configurado premios.' });
    }

    const rand = Math.random() * 100;
    let targetRarity = 'C';
    if (rand > 97) targetRarity = 'SSR';
    else if (rand > 85) targetRarity = 'SR';
    else if (rand > 60) targetRarity = 'R';

    let pool = creator.rewards.filter(r => r.rarity === targetRarity);
    if (pool.length === 0) pool = creator.rewards;

    const selectedReward = pool[Math.floor(Math.random() * pool.length)];

    res.json({ success: true, reward: selectedReward });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT}`));
