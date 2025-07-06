const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { getQuery, runQuery } = require('../config/database');
const { 
  createPixPayment, 
  getPaymentStatus, 
  cancelPayment, 
  processWebhook 
} = require('../config/stripe');

const router = express.Router();

// Middleware para validação de erros
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array()
    });
  }
  next();
};

/**
 * POST /api/payments/pix
 * Criar pagamento PIX via Stripe
 */
router.post('/pix', [
  body('orderId').notEmpty().withMessage('ID do pedido é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Buscar o pedido
    const order = await getQuery(
      'SELECT * FROM orders WHERE id = ? AND status = ?',
      [orderId, 'pending']
    );

    if (!order) {
      return res.status(404).json({
        error: 'Pedido não encontrado',
        message: 'Pedido não existe ou não está pendente'
      });
    }

    // Verificar se já existe pagamento em andamento
    if (order.stripe_session_id) {
      return res.status(400).json({
        error: 'Pagamento já iniciado',
        message: 'Já existe um pagamento em andamento para este pedido'
      });
    }

    const buyerData = JSON.parse(order.buyer_data);
    const items = JSON.parse(order.items);

    // Buscar detalhes dos eventos para os itens
    const itemsWithEventDetails = await Promise.all(
      items.map(async (item) => {
        const event = await getQuery(
          'SELECT name, venue FROM events WHERE id = ?',
          [item.eventId]
        );
        return {
          ...item,
          eventName: event?.name || 'Evento',
          eventVenue: event?.venue || ''
        };
      })
    );

    // Criar pagamento PIX no Stripe
    const paymentData = {
      orderId: order.id,
      amount: order.total,
      currency: 'brl',
      buyerData,
      items: itemsWithEventDetails
    };

    const pixPayment = await createPixPayment(paymentData);

    // Atualizar pedido com informações do Stripe
    await runQuery(
      'UPDATE orders SET stripe_session_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [pixPayment.sessionId, orderId]
    );

    res.json({
      success: true,
      message: 'Pagamento PIX criado com sucesso',
      data: {
        orderId: order.id,
        sessionId: pixPayment.sessionId,
        checkoutUrl: pixPayment.url,
        qrCode: pixPayment.pixCode,
        expiresAt: pixPayment.expiresAt,
        amount: order.total
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar pagamento PIX:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar o pagamento PIX'
    });
  }
});

/**
 * GET /api/payments/status/:sessionId
 * Verificar status do pagamento
 */
router.get('/status/:sessionId', [
  param('sessionId').notEmpty().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Buscar pedido pelo sessionId
    const order = await getQuery(
      'SELECT * FROM orders WHERE stripe_session_id = ?',
      [sessionId]
    );

    if (!order) {
      return res.status(404).json({
        error: 'Pedido não encontrado',
        message: 'Pedido não encontrado para esta sessão'
      });
    }

    // Verificar status no Stripe
    const paymentStatus = await getPaymentStatus(sessionId);

    // Atualizar status do pedido se necessário
    let newStatus = order.status;
    if (paymentStatus.status === 'paid' && order.status !== 'paid') {
      newStatus = 'paid';
      await runQuery(
        'UPDATE orders SET status = ?, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStatus, order.id]
      );
    } else if (paymentStatus.status === 'unpaid' && order.status === 'pending') {
      // Verificar se expirou (30 minutos)
      const createdAt = new Date(order.created_at);
      const now = new Date();
      const diffMinutes = (now - createdAt) / (1000 * 60);
      
      if (diffMinutes > 30) {
        newStatus = 'expired';
        await runQuery(
          'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['expired', order.id]
        );
      }
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        sessionId: sessionId,
        status: newStatus,
        paymentStatus: paymentStatus.status,
        amountTotal: paymentStatus.amountTotal,
        amountReceived: paymentStatus.amountReceived,
        currency: paymentStatus.currency,
        customerEmail: paymentStatus.customerEmail
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status do pagamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível verificar o status do pagamento'
    });
  }
});

/**
 * POST /api/payments/cancel/:sessionId
 * Cancelar pagamento
 */
router.post('/cancel/:sessionId', [
  param('sessionId').notEmpty().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Buscar pedido pelo sessionId
    const order = await getQuery(
      'SELECT * FROM orders WHERE stripe_session_id = ?',
      [sessionId]
    );

    if (!order) {
      return res.status(404).json({
        error: 'Pedido não encontrado',
        message: 'Pedido não encontrado para esta sessão'
      });
    }

    // Verificar se o pedido pode ser cancelado
    if (order.status === 'paid') {
      return res.status(400).json({
        error: 'Pagamento não pode ser cancelado',
        message: 'Pagamentos já confirmados não podem ser cancelados'
      });
    }

    // Cancelar no Stripe
    await cancelPayment(sessionId);

    // Atualizar status do pedido
    await runQuery(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelled', order.id]
    );

    res.json({
      success: true,
      message: 'Pagamento cancelado com sucesso',
      data: {
        orderId: order.id,
        sessionId: sessionId,
        status: 'cancelled'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao cancelar pagamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível cancelar o pagamento'
    });
  }
});

/**
 * POST /api/payments/webhook
 * Webhook do Stripe para confirmação de pagamentos
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({
        error: 'Assinatura ausente',
        message: 'Stripe-Signature header é obrigatório'
      });
    }

    // Processar webhook
    const event = processWebhook(req.body, signature);

    console.log('📧 Webhook recebido:', event.type);

    // Processar eventos relevantes
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object);
        break;
      
      default:
        console.log(`⚠️ Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(400).json({
      error: 'Erro no webhook',
      message: error.message
    });
  }
});

// Handlers dos webhooks
async function handleCheckoutCompleted(session) {
  try {
    const orderId = session.client_reference_id;
    
    if (orderId) {
      await runQuery(
        'UPDATE orders SET status = ?, payment_intent_id = ?, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['paid', session.payment_intent, orderId]
      );
      
      console.log(`✅ Pedido ${orderId} marcado como pago`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar checkout.session.completed:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (orderId) {
      await runQuery(
        'UPDATE orders SET status = ?, transaction_id = ?, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['paid', paymentIntent.id, orderId]
      );
      
      console.log(`✅ Pagamento ${paymentIntent.id} confirmado para pedido ${orderId}`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar payment_intent.succeeded:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    
    if (orderId) {
      await runQuery(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['cancelled', orderId]
      );
      
      console.log(`❌ Pagamento falhou para pedido ${orderId}`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar payment_intent.payment_failed:', error);
  }
}

async function handleCheckoutExpired(session) {
  try {
    const orderId = session.client_reference_id;
    
    if (orderId) {
      await runQuery(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['expired', orderId]
      );
      
      console.log(`⏰ Sessão expirada para pedido ${orderId}`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar checkout.session.expired:', error);
  }
}

module.exports = router; 