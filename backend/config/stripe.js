const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY é obrigatória nas variáveis de ambiente');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

/**
 * Criar sessão de checkout do Stripe para PIX
 */
const createPixPayment = async (orderData) => {
  try {
    const { orderId, amount, currency = 'brl', buyerData, items } = orderData;

    // Converter valores para centavos (Stripe trabalha com centavos)
    const amountInCents = Math.round(amount * 100);

    // Criar line items para o Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: `${item.eventName} - ${item.ticketType}`,
          description: `Ingresso ${item.ticketType} para ${item.eventName}`,
          metadata: {
            eventId: item.eventId,
            ticketType: item.ticketType,
            venue: item.eventVenue
          }
        },
        unit_amount: Math.round(item.unitPrice * 100)
      },
      quantity: item.quantity
    }));

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['pix'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/confirmacao/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout?canceled=true`,
      customer_email: buyerData.email,
      client_reference_id: orderId,
      metadata: {
        orderId,
        buyerName: buyerData.name,
        buyerDocument: buyerData.document,
        buyerPhone: buyerData.phone
      },
      payment_intent_data: {
        metadata: {
          orderId,
          buyerEmail: buyerData.email
        }
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutos para expirar
      locale: 'pt-BR'
    });

    return {
      sessionId: session.id,
      url: session.url,
      pixCode: session.payment_intent?.payment_method_options?.pix?.qr_code,
      expiresAt: new Date(session.expires_at * 1000).toISOString()
    };

  } catch (error) {
    console.error('❌ Erro ao criar pagamento PIX:', error);
    throw new Error(`Erro ao processar pagamento: ${error.message}`);
  }
};

/**
 * Verificar status do pagamento
 */
const getPaymentStatus = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    let paymentIntent = null;
    if (session.payment_intent) {
      paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
    }

    return {
      sessionId: session.id,
      status: session.payment_status,
      paymentStatus: paymentIntent?.status,
      amountReceived: paymentIntent?.amount_received || 0,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_email,
      clientReferenceId: session.client_reference_id,
      metadata: session.metadata
    };

  } catch (error) {
    console.error('❌ Erro ao verificar status do pagamento:', error);
    throw new Error(`Erro ao verificar pagamento: ${error.message}`);
  }
};

/**
 * Cancelar pagamento
 */
const cancelPayment = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.cancel(session.payment_intent);
      return {
        success: true,
        status: paymentIntent.status
      };
    }

    return {
      success: true,
      message: 'Sessão cancelada'
    };

  } catch (error) {
    console.error('❌ Erro ao cancelar pagamento:', error);
    throw new Error(`Erro ao cancelar pagamento: ${error.message}`);
  }
};

/**
 * Processar webhook do Stripe
 */
const processWebhook = (rawBody, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    return event;
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    throw new Error(`Webhook error: ${error.message}`);
  }
};

/**
 * Obter detalhes do QR Code PIX
 */
const getPixQrCode = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.payment_method_options?.pix?.qr_code) {
      return {
        qrCode: paymentIntent.payment_method_options.pix.qr_code,
        expiresAt: paymentIntent.payment_method_options.pix.expires_at
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Erro ao obter QR Code PIX:', error);
    throw new Error(`Erro ao obter QR Code: ${error.message}`);
  }
};

module.exports = {
  stripe,
  createPixPayment,
  getPaymentStatus,
  cancelPayment,
  processWebhook,
  getPixQrCode
}; 