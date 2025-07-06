const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { allQuery, getQuery, runQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

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
 * POST /api/orders
 * Criar novo pedido
 */
router.post('/', [
  body('buyerData').isObject().withMessage('Dados do comprador são obrigatórios'),
  body('buyerData.name').notEmpty().withMessage('Nome é obrigatório'),
  body('buyerData.email').isEmail().withMessage('Email válido é obrigatório'),
  body('buyerData.phone').notEmpty().withMessage('Telefone é obrigatório'),
  body('buyerData.document').notEmpty().withMessage('Documento é obrigatório'),
  body('items').isArray({ min: 1 }).withMessage('Pelo menos um item é obrigatório'),
  body('items.*.eventId').notEmpty().withMessage('ID do evento é obrigatório'),
  body('items.*.ticketType').notEmpty().withMessage('Tipo de ingresso é obrigatório'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser pelo menos 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Preço unitário deve ser válido'),
  body('paymentMethod').isIn(['pix', 'cartao_credito', 'cartao_debito', 'boleto']).withMessage('Método de pagamento inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const { buyerData, items, paymentMethod } = req.body;

    // Validar se todos os eventos existem
    for (const item of items) {
      const event = await getQuery(
        'SELECT id, name, venue, prices FROM events WHERE id = ? AND is_active = 1',
        [item.eventId]
      );

      if (!event) {
        return res.status(404).json({
          error: 'Evento não encontrado',
          message: `Evento ${item.eventId} não existe ou não está ativo`
        });
      }

      // Verificar se o preço está correto
      const prices = JSON.parse(event.prices || '{}');
      if (prices[item.ticketType] !== item.unitPrice) {
        return res.status(400).json({
          error: 'Preço inválido',
          message: `Preço do ingresso ${item.ticketType} não confere`
        });
      }
    }

    // Calcular totais
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const fees = Math.round(subtotal * 0.05 * 100) / 100; // 5% de taxa
    const total = subtotal + fees;

    const orderId = uuidv4();

    // Criar pedido
    await runQuery(`
      INSERT INTO orders (
        id, buyer_data, items, subtotal, fees, total, 
        payment_method, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId,
      JSON.stringify(buyerData),
      JSON.stringify(items),
      subtotal,
      fees,
      total,
      paymentMethod,
      'pending'
    ]);

    // Criar itens do pedido
    for (const item of items) {
      const itemId = uuidv4();
      await runQuery(`
        INSERT INTO order_items (
          id, order_id, event_id, ticket_type, quantity, 
          unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        itemId,
        orderId,
        item.eventId,
        item.ticketType,
        item.quantity,
        item.unitPrice,
        item.unitPrice * item.quantity
      ]);
    }

    // Buscar o pedido criado
    const newOrder = await getQuery(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    const formattedOrder = {
      ...newOrder,
      buyer_data: JSON.parse(newOrder.buyer_data),
      items: JSON.parse(newOrder.items)
    };

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: formattedOrder
    });

  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar o pedido'
    });
  }
});

/**
 * GET /api/orders/:id
 * Obter detalhes de um pedido específico
 */
router.get('/:id', [
  param('id').notEmpty().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await getQuery(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (!order) {
      return res.status(404).json({
        error: 'Pedido não encontrado',
        message: 'O pedido solicitado não existe'
      });
    }

    // Buscar itens do pedido
    const orderItems = await allQuery(
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    );

    // Buscar detalhes dos eventos
    const itemsWithEventDetails = await Promise.all(
      orderItems.map(async (item) => {
        const event = await getQuery(
          'SELECT name, venue, date FROM events WHERE id = ?',
          [item.event_id]
        );
        return {
          ...item,
          eventName: event?.name || 'Evento não encontrado',
          eventVenue: event?.venue || '',
          eventDate: event?.date || ''
        };
      })
    );

    const formattedOrder = {
      ...order,
      buyer_data: JSON.parse(order.buyer_data),
      items: JSON.parse(order.items),
      orderItems: itemsWithEventDetails
    };

    res.json({
      success: true,
      data: formattedOrder
    });

  } catch (error) {
    console.error('❌ Erro ao buscar pedido:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar o pedido'
    });
  }
});

/**
 * GET /api/orders
 * Listar pedidos (admin ou filtrado por email)
 */
router.get('/', [
  query('email').optional().isEmail(),
  query('status').optional().isIn(['pending', 'paid', 'cancelled', 'expired']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('sortBy').optional().isIn(['created_at', 'total', 'status']),
  query('sortOrder').optional().isIn(['ASC', 'DESC'])
], handleValidationErrors, async (req, res) => {
  try {
    const {
      email,
      status,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (email) {
      query += ' AND JSON_EXTRACT(buyer_data, "$.email") = ?';
      params.push(email);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const orders = await allQuery(query, params);

    const formattedOrders = orders.map(order => ({
      ...order,
      buyer_data: JSON.parse(order.buyer_data),
      items: JSON.parse(order.items)
    }));

    res.json({
      success: true,
      data: formattedOrders
    });

  } catch (error) {
    console.error('❌ Erro ao buscar pedidos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar os pedidos'
    });
  }
});

/**
 * PUT /api/orders/:id/status
 * Atualizar status do pedido
 */
router.put('/:id/status', [
  param('id').notEmpty().isString(),
  body('status').isIn(['pending', 'paid', 'cancelled', 'expired']).withMessage('Status inválido'),
  body('transactionId').optional().isString(),
  body('paymentIntentId').optional().isString(),
  body('stripeSessionId').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId, paymentIntentId, stripeSessionId } = req.body;

    // Verificar se o pedido existe
    const order = await getQuery(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (!order) {
      return res.status(404).json({
        error: 'Pedido não encontrado',
        message: 'O pedido solicitado não existe'
      });
    }

    // Preparar campos de atualização
    const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const updateValues = [status];

    if (transactionId) {
      updateFields.push('transaction_id = ?');
      updateValues.push(transactionId);
    }

    if (paymentIntentId) {
      updateFields.push('payment_intent_id = ?');
      updateValues.push(paymentIntentId);
    }

    if (stripeSessionId) {
      updateFields.push('stripe_session_id = ?');
      updateValues.push(stripeSessionId);
    }

    if (status === 'paid') {
      updateFields.push('confirmed_at = CURRENT_TIMESTAMP');
    }

    updateValues.push(id);

    await runQuery(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Buscar o pedido atualizado
    const updatedOrder = await getQuery(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    const formattedOrder = {
      ...updatedOrder,
      buyer_data: JSON.parse(updatedOrder.buyer_data),
      items: JSON.parse(updatedOrder.items)
    };

    res.json({
      success: true,
      message: 'Status do pedido atualizado com sucesso',
      data: formattedOrder
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar status do pedido:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar o status do pedido'
    });
  }
});

/**
 * DELETE /api/orders/:id
 * Cancelar pedido
 */
router.delete('/:id', [
  param('id').notEmpty().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o pedido existe
    const order = await getQuery(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (!order) {
      return res.status(404).json({
        error: 'Pedido não encontrado',
        message: 'O pedido solicitado não existe'
      });
    }

    // Verificar se o pedido pode ser cancelado
    if (order.status === 'paid') {
      return res.status(400).json({
        error: 'Pedido não pode ser cancelado',
        message: 'Pedidos pagos não podem ser cancelados'
      });
    }

    // Atualizar status para cancelado
    await runQuery(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelled', id]
    );

    res.json({
      success: true,
      message: 'Pedido cancelado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao cancelar pedido:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível cancelar o pedido'
    });
  }
});

module.exports = router; 