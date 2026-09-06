// Cargar SDK de Stripe en tu HTML: <script src="https://js.stripe.com/v3/"></script>
const stripe = Stripe('TU_STRIPE_PUBLIC_KEY');

async function checkoutAndRoll(gachaId, quantity, userId) {
  // 1. Solicitar PaymentIntent al backend
  const res = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, gachaId, quantity })
  });

  const { clientSecret } = await res.json();

  // 2. Procesar pago con la pasarela de Stripe
  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement, // Componente Stripe Card Element
      billing_details: { email: 'usuario@ejemplo.com' }
    }
  });

  if (result.error) {
    alert('Error en el pago: ' + result.error.message);
  } else if (result.paymentIntent.status === 'succeeded') {
    // 3. Obtener el resultado actualizado directamente del servidor
    setTimeout(async () => {
      await fetchInventory(userId);
      alert('¡Pago completado! Revisa tu inventario.');
    }, 1500);
  }
}
