require('dotenv').config();
const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const prisma = new PrismaClient();
const app = express();

// Webhook de Stripe - Requiere parseo raw para validar firma de seguridad
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Error en firma Webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const rollCount = parseInt(session.metadata.rollCount || '1', 10);

    try {
      await processRollPayment(userId, rollCount, session.id);
    } catch (err) {
      console.error(`Error al procesar tirada en BD: ${err.message}`);
    }
  }

  res.json({ received: true });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lógica de cálculo y asignación de ítems en BD
async function processRollPayment(userId, count, paymentIntentId) {
  const DEMO_POOL = [
    { name: 'Poción Vida', rarity: 'C' },
    { name: 'Escudo Titán', rarity: 'R' },
    { name: 'Espada Rúnica', rarity: 'SR' },
    { name: 'Dragón Carmesí', rarity: 'SSR' }
  ];

  await prisma.$transaction(async (tx) => {
    let user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) return;

    let currentPity = user.pityCounter;
    const newItems = [];

    for (let i = 0; i < count; i++) {
      currentPity++;
      let selectedRarity = 'C';

      if (currentPity >= 30) {
        selectedRarity = 'SSR';
        currentPity = 0;
      } else {
        const rand = Math.random() * 100;
        if (rand > 97) {
          selectedRarity = 'SSR';
          currentPity = 0;
        } else if (rand > 85) {
          selectedRarity = 'SR';
        } else if (rand > 60) {
          selectedRarity = 'R';
        }
      }

      const itemTemplate = DEMO_POOL.find(item => item.rarity === selectedRarity);
      newItems.push({
        userId: user.id,
        name: itemTemplate.name,
        rarity: itemTemplate.rarity
      });
    }

    await tx.inventoryItem.createMany({ data: newItems });
    await tx.user.update({
      where: { id: userId },
      data: { pityCounter: currentPity }
    });
  });
}

// Checkout Session Stripe API
app.post('/api/create-checkout-session', async (req, res) => {
  const { userId, count } = req.body;
  const isMulti = count === 10;
  const unitAmount = isMulti ? 4499 : 499;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: isMulti ? 'Tirada x10 Gacha' : 'Tirada x1 Gacha',
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: { userId, rollCount: count },
      success_url: `${req.headers.origin}/?status=success`,
      cancel_url: `${req.headers.origin}/?status=cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT}`));
