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

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

    const accountLink = await stripe.accountLinks.create({
      account: user.stripeConnectAccountId,
      refresh_url: `${process.env.DOMAIN}/?status=failed`,
      return_url: `${process.env.DOMAIN}/?status=success`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function selectRandomItem(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.dropWeight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    if (random < item.dropWeight) return item;
    random -= item.dropWeight;
  }
  return items[0];
}

app.post('/api/gacha/pull', async (req, res) => {
  try {
    const { gachaId } = req.body;

    const gacha = await prisma.gacha.findUnique({
      where: { id: gachaId },
      include: { creator: true, items: true },
    });

    if (!gacha || !gacha.creator.stripeConnectAccountId) {
      return res.status(400).json({ error: 'Gacha no disponible o cuenta desvinculada.' });
    }

    const feePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10') / 100;
    const platformFee = Math.round(gacha.priceInCents * feePercentage);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: gacha.priceInCents,
      currency: 'usd',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: gacha.creator.stripeConnectAccountId,
      },
    });

    const wonItem = selectRandomItem(gacha.items);

    await prisma.pull.create({
      data: {
        gachaId: gacha.id,
        itemId: wonItem.id,
        paymentIntentId: paymentIntent.id,
        amountPaid: gacha.priceInCents,
        platformFee: platformFee,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret, wonItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
