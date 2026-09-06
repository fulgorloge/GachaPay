import express from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// WEBHOOK DE STRIPE (IMPORTANTE: Debe ir ANTES de express.json() para conservar el body raw)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { userId, gachaId, itemId } = paymentIntent.metadata;

    try {
      // Registrar en el inventario del usuario tras confirmación de pago real
      if (userId && itemId) {
        await prisma.userItem.create({
          data: {
            userId,
            itemId
          }
        });
      }
    } catch (err) {
      console.error('Error al registrar inventario en Webhook:', err);
    }
  }

  res.json({ received: true });
});

// Middlewares estándar
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Función auxiliar para seleccionar ítem según dropWeight
function selectRandomItem(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.dropWeight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    if (random < item.dropWeight) return item;
    random -= item.dropWeight;
  }
  return items[0];
}

// 1. ONBOARDING STRIPE CONNECT PARA CREADORES
app.post('/api/creators/connect', async (req, res) => {
  try {
    const { email } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({ data: { email } });
    }

    if (!user.stripeConnectAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      user = await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectAccountId: account.id },
      });
    }

    const domain = process.env.DOMAIN || `http://localhost:${process.env.PORT || 3000}`;

    const accountLink = await stripe.accountLinks.create({
      account: user.stripeConnectAccountId,
      refresh_url: `${domain}/?status=failed`,
      return_url: `${domain}/?status=success`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. TIRADA GACHA SECURE (Realiza el cobro con comisión y registra el Pull)
app.post('/api/gacha/pull', async (req, res) => {
  try {
    const { gachaId, userId } = req.body;

    const gacha = await prisma.gacha.findUnique({
      where: { id: gachaId },
      include: { creator: true, items: true },
    });

    if (!gacha || gacha.items.length === 0) {
      return res.status(404).json({ error: 'Gacha no encontrado o sin ítems configurados.' });
    }

    if (!gacha.creator.stripeConnectAccountId) {
      return res.status(400).json({ error: 'El creador aún no ha conectado su cuenta bancaria de Stripe.' });
    }

    const wonItem = selectRandomItem(gacha.items);
    const feePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10') / 100;
    const platformFee = Math.round(gacha.priceInCents * feePercentage);

    // Crear PaymentIntent vinculando la transferencia al Creador y la comisión de la plataforma
    const paymentIntent = await stripe.paymentIntents.create({
      amount: gacha.priceInCents,
      currency: 'usd',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: gacha.creator.stripeConnectAccountId,
      },
      metadata: {
        gachaId: gacha.id,
        itemId: wonItem.id,
        userId: userId || ''
      }
    });

    // Guardar registro de la tirada en la base de datos
    await prisma.pull.create({
      data: {
        userId: userId || gacha.creatorId, // Asigna al usuario o fallback al creador
        gachaId: gacha.id,
        itemId: wonItem.id,
        paymentIntentId: paymentIntent.id,
        amountPaid: gacha.priceInCents,
        platformFee: platformFee,
      },
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret, 
      wonItem 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. OBTENER INVENTARIO DEL USUARIO
app.get('/api/inventory/:userId', async (req, res) => {
  try {
    const userItems = await prisma.userItem.findMany({
      where: { userId: req.params.userId },
      include: { item: true },
      orderBy: { obtainedAt: 'desc' }
    });
    res.json(userItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback SPA (Static files)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor de GachaPay escuchando en el puerto ${PORT}`));
