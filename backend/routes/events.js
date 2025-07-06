const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { allQuery, getQuery } = require('../config/database');

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
 * GET /api/events
 * Listar todos os eventos com filtros opcionais
 */
router.get('/', [
  query('category').optional().isString(),
  query('city').optional().isString(),
  query('state').optional().isString(),
  query('search').optional().isString(),
  query('featured').optional().isBoolean(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('sortBy').optional().isIn(['date', 'name', 'price', 'created_at']),
  query('sortOrder').optional().isIn(['ASC', 'DESC'])
], handleValidationErrors, async (req, res) => {
  try {
    const {
      category,
      city,
      state,
      search,
      featured,
      limit = 20,
      offset = 0,
      sortBy = 'date',
      sortOrder = 'ASC'
    } = req.query;

    let query = 'SELECT * FROM events WHERE is_active = 1';
    const params = [];

    // Aplicar filtros
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (city) {
      query += ' AND LOWER(city) LIKE LOWER(?)';
      params.push(`%${city}%`);
    }

    if (state) {
      query += ' AND LOWER(state) LIKE LOWER(?)';
      params.push(`%${state}%`);
    }

    if (search) {
      query += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(venue) LIKE LOWER(?))';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (featured !== undefined) {
      query += ' AND featured = ?';
      params.push(featured ? 1 : 0);
    }

    // Ordenação
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Paginação
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const events = await allQuery(query, params);

    // Converter campos JSON de volta para objetos
    const formattedEvents = events.map(event => ({
      ...event,
      ticket_types: JSON.parse(event.ticket_types || '[]'),
      prices: JSON.parse(event.prices || '{}'),
      tags: JSON.parse(event.tags || '[]'),
      metadata: JSON.parse(event.metadata || '{}'),
      is_active: Boolean(event.is_active),
      featured: Boolean(event.featured),
      date: new Date(event.date).toISOString(),
      end_date: event.end_date ? new Date(event.end_date).toISOString() : null
    }));

    // Contar total para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM events WHERE is_active = 1';
    const countParams = [];
    
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    if (city) {
      countQuery += ' AND LOWER(city) LIKE LOWER(?)';
      countParams.push(`%${city}%`);
    }

    if (state) {
      countQuery += ' AND LOWER(state) LIKE LOWER(?)';
      countParams.push(`%${state}%`);
    }

    if (search) {
      countQuery += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(venue) LIKE LOWER(?))';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (featured !== undefined) {
      countQuery += ' AND featured = ?';
      countParams.push(featured ? 1 : 0);
    }

    const countResult = await getQuery(countQuery, countParams);
    const total = countResult.total;

    res.json({
      success: true,
      data: formattedEvents,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar eventos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar os eventos'
    });
  }
});

/**
 * GET /api/events/:id
 * Obter detalhes de um evento específico
 */
router.get('/:id', [
  param('id').notEmpty().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await getQuery(
      'SELECT * FROM events WHERE id = ? AND is_active = 1',
      [id]
    );

    if (!event) {
      return res.status(404).json({
        error: 'Evento não encontrado',
        message: 'O evento solicitado não existe ou não está ativo'
      });
    }

    // Converter campos JSON de volta para objetos
    const formattedEvent = {
      ...event,
      ticket_types: JSON.parse(event.ticket_types || '[]'),
      prices: JSON.parse(event.prices || '{}'),
      tags: JSON.parse(event.tags || '[]'),
      metadata: JSON.parse(event.metadata || '{}'),
      is_active: Boolean(event.is_active),
      featured: Boolean(event.featured),
      date: new Date(event.date).toISOString(),
      end_date: event.end_date ? new Date(event.end_date).toISOString() : null
    };

    res.json({
      success: true,
      data: formattedEvent
    });

  } catch (error) {
    console.error('❌ Erro ao buscar evento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar o evento'
    });
  }
});

/**
 * GET /api/events/:id/tickets
 * Obter tipos de ingressos disponíveis para um evento
 */
router.get('/:id/tickets', [
  param('id').notEmpty().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o evento existe
    const event = await getQuery(
      'SELECT ticket_types, prices FROM events WHERE id = ? AND is_active = 1',
      [id]
    );

    if (!event) {
      return res.status(404).json({
        error: 'Evento não encontrado',
        message: 'O evento solicitado não existe ou não está ativo'
      });
    }

    const ticketTypes = JSON.parse(event.ticket_types || '[]');
    const prices = JSON.parse(event.prices || '{}');

    // Criar array de ingressos disponíveis
    const availableTickets = ticketTypes
      .filter(type => prices[type] && prices[type] > 0)
      .map(type => ({
        type,
        price: prices[type],
        available: true,
        description: getTicketDescription(type),
        benefits: getTicketBenefits(type)
      }));

    res.json({
      success: true,
      data: {
        eventId: id,
        tickets: availableTickets
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar ingressos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar os ingressos'
    });
  }
});

// Funções auxiliares
const getTicketDescription = (type) => {
  const descriptions = {
    pista: 'Acesso geral à área da pista',
    arquibancada: 'Assentos numerados na arquibancada',
    camarote: 'Acesso ao camarote com serviços premium',
    vip: 'Experiência VIP completa com todos os benefícios',
    paddock: 'Acesso exclusivo ao paddock dos pilotos'
  };
  return descriptions[type] || 'Ingresso para o evento';
};

const getTicketBenefits = (type) => {
  const benefits = {
    pista: ['Acesso à pista', 'Vista geral do evento'],
    arquibancada: ['Assento numerado', 'Vista privilegiada', 'Cobertura'],
    camarote: ['Buffet incluído', 'Bar premium', 'Ar condicionado', 'Vista VIP'],
    vip: ['Acesso total', 'Meet & greet', 'Buffet gourmet', 'Brindes exclusivos'],
    paddock: ['Acesso ao paddock', 'Proximidade com pilotos', 'Bastidores', 'Experiência única']
  };
  return benefits[type] || ['Acesso ao evento'];
};

module.exports = router; 