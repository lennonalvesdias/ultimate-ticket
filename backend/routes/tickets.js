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
 * GET /api/tickets
 * Listar todos os ingressos (admin)
 */
router.get('/', [
  query('event_id').optional().isString(),
  query('type').optional().isString(),
  query('available').optional().isBoolean(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const {
      event_id,
      type,
      available,
      limit = 20,
      offset = 0
    } = req.query;

    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];

    if (event_id) {
      query += ' AND event_id = ?';
      params.push(event_id);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (available !== undefined) {
      query += ' AND is_available = ?';
      params.push(available ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const tickets = await allQuery(query, params);

    // Converter campos JSON e boolean
    const formattedTickets = tickets.map(ticket => ({
      ...ticket,
      benefits: JSON.parse(ticket.benefits || '[]'),
      is_available: Boolean(ticket.is_available)
    }));

    res.json({
      success: true,
      data: formattedTickets
    });

  } catch (error) {
    console.error('❌ Erro ao buscar ingressos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar os ingressos'
    });
  }
});

/**
 * GET /api/tickets/:id
 * Obter detalhes de um ingresso específico
 */
router.get('/:id', [
  param('id').notEmpty().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await getQuery(
      'SELECT * FROM tickets WHERE id = ?',
      [id]
    );

    if (!ticket) {
      return res.status(404).json({
        error: 'Ingresso não encontrado',
        message: 'O ingresso solicitado não existe'
      });
    }

    // Converter campos JSON e boolean
    const formattedTicket = {
      ...ticket,
      benefits: JSON.parse(ticket.benefits || '[]'),
      is_available: Boolean(ticket.is_available)
    };

    res.json({
      success: true,
      data: formattedTicket
    });

  } catch (error) {
    console.error('❌ Erro ao buscar ingresso:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar o ingresso'
    });
  }
});

/**
 * POST /api/tickets
 * Criar novo tipo de ingresso (admin)
 */
router.post('/', [
  body('event_id').notEmpty().isString(),
  body('type').notEmpty().isString(),
  body('price').isFloat({ min: 0 }),
  body('quantity').isInt({ min: 0 }),
  body('description').optional().isString(),
  body('benefits').optional().isArray(),
  body('max_quantity_per_person').optional().isInt({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
  try {
    const {
      event_id,
      type,
      price,
      quantity,
      description,
      benefits = [],
      max_quantity_per_person = 10
    } = req.body;

    // Verificar se o evento existe
    const event = await getQuery(
      'SELECT id FROM events WHERE id = ? AND is_active = 1',
      [event_id]
    );

    if (!event) {
      return res.status(404).json({
        error: 'Evento não encontrado',
        message: 'O evento especificado não existe ou não está ativo'
      });
    }

    // Verificar se já existe ingresso deste tipo para o evento
    const existingTicket = await getQuery(
      'SELECT id FROM tickets WHERE event_id = ? AND type = ?',
      [event_id, type]
    );

    if (existingTicket) {
      return res.status(409).json({
        error: 'Ingresso já existe',
        message: `Já existe um ingresso do tipo "${type}" para este evento`
      });
    }

    const ticketId = uuidv4();
    
    await runQuery(`
      INSERT INTO tickets (
        id, event_id, type, price, quantity, description, 
        benefits, max_quantity_per_person
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      ticketId,
      event_id,
      type,
      price,
      quantity,
      description,
      JSON.stringify(benefits),
      max_quantity_per_person
    ]);

    // Buscar o ingresso criado
    const newTicket = await getQuery(
      'SELECT * FROM tickets WHERE id = ?',
      [ticketId]
    );

    const formattedTicket = {
      ...newTicket,
      benefits: JSON.parse(newTicket.benefits || '[]'),
      is_available: Boolean(newTicket.is_available)
    };

    res.status(201).json({
      success: true,
      message: 'Ingresso criado com sucesso',
      data: formattedTicket
    });

  } catch (error) {
    console.error('❌ Erro ao criar ingresso:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar o ingresso'
    });
  }
});

/**
 * PUT /api/tickets/:id
 * Atualizar ingresso (admin)
 */
router.put('/:id', [
  param('id').notEmpty().isString(),
  body('price').optional().isFloat({ min: 0 }),
  body('quantity').optional().isInt({ min: 0 }),
  body('description').optional().isString(),
  body('benefits').optional().isArray(),
  body('is_available').optional().isBoolean(),
  body('max_quantity_per_person').optional().isInt({ min: 1, max: 50 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar se o ingresso existe
    const ticket = await getQuery(
      'SELECT * FROM tickets WHERE id = ?',
      [id]
    );

    if (!ticket) {
      return res.status(404).json({
        error: 'Ingresso não encontrado',
        message: 'O ingresso solicitado não existe'
      });
    }

    // Construir query de atualização dinamicamente
    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        if (key === 'benefits') {
          updateFields.push('benefits = ?');
          updateValues.push(JSON.stringify(updates[key]));
        } else if (key === 'is_available') {
          updateFields.push('is_available = ?');
          updateValues.push(updates[key] ? 1 : 0);
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(updates[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Nenhum campo para atualizar',
        message: 'Pelo menos um campo deve ser fornecido para atualização'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    await runQuery(
      `UPDATE tickets SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Buscar o ingresso atualizado
    const updatedTicket = await getQuery(
      'SELECT * FROM tickets WHERE id = ?',
      [id]
    );

    const formattedTicket = {
      ...updatedTicket,
      benefits: JSON.parse(updatedTicket.benefits || '[]'),
      is_available: Boolean(updatedTicket.is_available)
    };

    res.json({
      success: true,
      message: 'Ingresso atualizado com sucesso',
      data: formattedTicket
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar ingresso:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar o ingresso'
    });
  }
});

/**
 * DELETE /api/tickets/:id
 * Remover ingresso (admin)
 */
router.delete('/:id', [
  param('id').notEmpty().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o ingresso existe
    const ticket = await getQuery(
      'SELECT * FROM tickets WHERE id = ?',
      [id]
    );

    if (!ticket) {
      return res.status(404).json({
        error: 'Ingresso não encontrado',
        message: 'O ingresso solicitado não existe'
      });
    }

    await runQuery('DELETE FROM tickets WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Ingresso removido com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao remover ingresso:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível remover o ingresso'
    });
  }
});

module.exports = router; 