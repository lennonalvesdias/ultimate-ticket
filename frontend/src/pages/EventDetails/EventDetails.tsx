import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Container, Card, Button } from '../../components';
import { apiService, Event } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { categoryLabels } from '../../data/mockData';
import './EventDetails.css';

interface TicketOption {
  type: string;
  price: number;
  available: boolean;
  description: string;
  benefits: string[];
}

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<TicketOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!id) return;

    const loadEventData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar dados do evento
        const eventResponse = await apiService.getEvent(id);
        setEvent(eventResponse.data!);

        // Carregar ingressos disponíveis
        const ticketsResponse = await apiService.getEventTickets(id);
        setTickets(ticketsResponse.data!.tickets);

      } catch (err) {
        console.error('Erro ao carregar evento:', err);
        setError('Erro ao carregar dados do evento. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [id]);

  const handleTicketQuantityChange = (ticketType: string, quantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketType]: Math.max(0, quantity)
    }));
  };

  const handleAddToCart = () => {
    if (!event) return;

    const itemsToAdd = Object.entries(selectedTickets)
      .filter(([_, quantity]) => quantity > 0)
      .map(([ticketType, quantity]) => {
        const ticket = tickets.find(t => t.type === ticketType);
        return {
          id: `${event.id}-${ticketType}`,
          eventId: event.id,
          eventName: event.name,
          eventDate: new Date(event.date),
          eventVenue: event.venue,
          eventImageUrl: event.image_url || '',
          ticketType: ticketType as any,
          quantity,
          unitPrice: ticket!.price,
          totalPrice: ticket!.price * quantity
        };
      });

    if (itemsToAdd.length === 0) {
      alert('Selecione pelo menos um ingresso');
      return;
    }

    itemsToAdd.forEach(item => addItem(item));
    navigate('/checkout');
  };

  if (loading) {
    return (
      <Container>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Carregando detalhes do evento...</p>
          </div>
        </Card>
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1>Evento não encontrado</h1>
            <p style={{ color: 'red', marginBottom: '1rem' }}>
              {error || 'O evento que você está procurando não existe.'}
            </p>
            <Button onClick={() => navigate('/')}>
              Voltar ao Início
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  const totalSelected = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Object.entries(selectedTickets)
    .reduce((sum, [ticketType, quantity]) => {
      const ticket = tickets.find(t => t.type === ticketType);
      return sum + (ticket ? ticket.price * quantity : 0);
    }, 0);

  return (
    <Container>
      <div className="event-details">
        {/* Header do Evento */}
        <Card>
          <div className="event-details__header">
            <div className="event-details__image">
              {event.image_url && (
                <img src={event.image_url} alt={event.name} />
              )}
            </div>
            <div className="event-details__info">
              <h1>{event.name}</h1>
              <div className="event-details__category">
                {categoryLabels[event.category as keyof typeof categoryLabels]}
              </div>
              <div className="event-details__date">
                📅 {format(new Date(event.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
              <div className="event-details__venue">
                📍 {event.venue} - {event.city}/{event.state}
              </div>
              <div className="event-details__organizer">
                🏢 {event.organizer}
              </div>
            </div>
          </div>
        </Card>

        {/* Descrição */}
        <Card>
          <h2>Sobre o Evento</h2>
          <p>{event.description}</p>
          
          {event.tags && event.tags.length > 0 && (
            <div className="event-details__tags">
              <strong>Tags:</strong> {event.tags.join(', ')}
            </div>
          )}
        </Card>

        {/* Seleção de Ingressos */}
        <Card>
          <h2>Ingressos Disponíveis</h2>
          
          {tickets.length === 0 ? (
            <p>Nenhum ingresso disponível no momento.</p>
          ) : (
            <div className="event-details__tickets">
              {tickets.map(ticket => (
                <div key={ticket.type} className="ticket-option">
                  <div className="ticket-option__info">
                    <h3 className="ticket-option__type">
                      {ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1)}
                    </h3>
                    <p className="ticket-option__description">{ticket.description}</p>
                    <div className="ticket-option__benefits">
                      <strong>Benefícios:</strong>
                      <ul>
                        {ticket.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="ticket-option__purchase">
                    <div className="ticket-option__price">
                      R$ {ticket.price.toFixed(2)}
                    </div>
                    
                    {ticket.available ? (
                      <div className="ticket-option__quantity">
                        <button 
                          onClick={() => handleTicketQuantityChange(ticket.type, (selectedTickets[ticket.type] || 0) - 1)}
                          disabled={!selectedTickets[ticket.type]}
                        >
                          -
                        </button>
                        <span>{selectedTickets[ticket.type] || 0}</span>
                        <button 
                          onClick={() => handleTicketQuantityChange(ticket.type, (selectedTickets[ticket.type] || 0) + 1)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <div className="ticket-option__unavailable">
                        Indisponível
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Resumo da Compra */}
        {totalSelected > 0 && (
          <Card>
            <h2>Resumo da Compra</h2>
            <div className="purchase-summary">
              <div className="purchase-summary__items">
                {Object.entries(selectedTickets)
                  .filter(([_, quantity]) => quantity > 0)
                  .map(([ticketType, quantity]) => {
                    const ticket = tickets.find(t => t.type === ticketType);
                    return (
                      <div key={ticketType} className="purchase-summary__item">
                        <span>{ticketType} (x{quantity})</span>
                        <span>R$ {(ticket!.price * quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
              </div>
              <div className="purchase-summary__total">
                <strong>Total: R$ {totalPrice.toFixed(2)}</strong>
              </div>
              <Button 
                variant="primary" 
                onClick={handleAddToCart}
                fullWidth
                style={{ marginTop: '1rem' }}
              >
                Adicionar ao Carrinho ({totalSelected} {totalSelected === 1 ? 'ingresso' : 'ingressos'})
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Container>
  );
};

export default EventDetails; 