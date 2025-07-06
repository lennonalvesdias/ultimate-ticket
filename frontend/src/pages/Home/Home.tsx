import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Container, Card, Button, TextField } from '../../components';
import { categoryLabels } from '../../data/mockData';
import { EventFilters } from '../../types';
import { apiService, Event } from '../../services/api';
import './Home.css';

const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<EventFilters>({
    search: '',
    category: undefined,
    city: '',
    state: ''
  });

  const [sortBy, setSortBy] = useState<'date' | 'name' | 'price'>('date');

  // Carregar eventos da API
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar todos os eventos
        const allEventsResponse = await apiService.getEvents({
          limit: 50,
          sortBy: 'date',
          sortOrder: 'ASC'
        });

        // Carregar eventos em destaque
        const featuredEventsResponse = await apiService.getEvents({
          featured: true,
          limit: 6,
          sortBy: 'date',
          sortOrder: 'ASC'
        });

        setEvents(allEventsResponse.data);
        setFeaturedEvents(featuredEventsResponse.data);
      } catch (err) {
        console.error('Erro ao carregar eventos:', err);
        setError('Erro ao carregar eventos. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    let filtered = events.filter(event => {
      const matchesSearch = !filters.search || 
        event.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.venue.toLowerCase().includes(filters.search.toLowerCase());

      const matchesCategory = !filters.category || event.category === filters.category;
      const matchesCity = !filters.city || event.city.toLowerCase().includes(filters.city.toLowerCase());
      const matchesState = !filters.state || event.state.toLowerCase().includes(filters.state.toLowerCase());

      return matchesSearch && matchesCategory && matchesCity && matchesState && event.is_active;
    });

    // Ordenar eventos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          const priceA = Math.min(...Object.values(a.prices).filter(p => p > 0));
          const priceB = Math.min(...Object.values(b.prices).filter(p => p > 0));
          return priceA - priceB;
        case 'date':
        default:
          return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });

    return filtered;
  }, [events, filters, sortBy]);

  const handleFilterChange = (key: keyof EventFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: undefined,
      city: '',
      state: ''
    });
  };

  if (loading) {
    return (
      <div className="home">
        <Container>
          <div className="home__loading">
            <Card>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Carregando eventos...</p>
              </div>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <Container>
          <div className="home__error">
            <Card>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Tentar Novamente
                </Button>
              </div>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="home">
      <Container>
        {/* Header */}
        <div className="home__header">
          <h1>Encontre os Melhores Eventos Esportivos</h1>
          <p>Ingressos para corridas, drift, rally e muito mais!</p>
        </div>

        {/* Eventos em Destaque */}
        {featuredEvents.length > 0 && (
          <section className="home__featured">
            <h2>Eventos em Destaque</h2>
            <div className="home__featured-grid">
              {featuredEvents.map(event => (
                <EventCard key={event.id} event={event} featured />
              ))}
            </div>
          </section>
        )}

        {/* Filtros */}
        <section className="home__filters">
          <Card>
            <h3>Filtrar Eventos</h3>
            <div className="home__filters-grid">
              <TextField
                placeholder="Buscar eventos..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                fullWidth
              />
              
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select
                  className="form-control"
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  aria-label="Filtrar por categoria"
                >
                  <option value="">Todas as categorias</option>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <TextField
                placeholder="Cidade"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                fullWidth
              />

              <TextField
                placeholder="Estado"
                value={filters.state || ''}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                fullWidth
              />

              <div className="form-group">
                <label className="form-label">Ordenar por</label>
                <select
                  className="form-control"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'price')}
                  aria-label="Ordenar eventos por"
                >
                  <option value="date">Data</option>
                  <option value="name">Nome</option>
                  <option value="price">Preço</option>
                </select>
              </div>

              <Button
                variant="ghost"
                onClick={clearFilters}
                fullWidth
              >
                Limpar Filtros
              </Button>
            </div>
          </Card>
        </section>

        {/* Lista de Eventos */}
        <section className="home__events">
          <div className="home__events-header">
            <h2>Todos os Eventos</h2>
            <span className="home__events-count">
              {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} encontrado{filteredEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <Card>
              <div className="home__no-events">
                <p>Nenhum evento encontrado com os filtros aplicados.</p>
                <Button onClick={clearFilters}>Limpar Filtros</Button>
              </div>
            </Card>
          ) : (
            <div className="home__events-grid">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </Container>
    </div>
  );
};

// Componente do Card de Evento
interface EventCardProps {
  event: Event;
  featured?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, featured = false }) => {
  const minPrice = Math.min(...Object.values(event.prices).filter(p => p > 0));
  const maxPrice = Math.max(...Object.values(event.prices).filter(p => p > 0));

  return (
    <Card className={`event-card ${featured ? 'event-card--featured' : ''}`} hover>
      <div className="event-card__image">
        <img src={event.image_url} alt={event.name} />
        <div className="event-card__category">
          {categoryLabels[event.category as keyof typeof categoryLabels]}
        </div>
      </div>
      
      <div className="event-card__content">
        <h3 className="event-card__title">{event.name}</h3>
        <p className="event-card__description">{event.description}</p>
        
        <div className="event-card__details">
          <div className="event-card__date">
            📅 {format(new Date(event.date), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
          <div className="event-card__venue">
            📍 {event.venue} - {event.city}/{event.state}
          </div>
        </div>

        <div className="event-card__footer">
          <div className="event-card__price">
            {minPrice === maxPrice ? (
              <span>A partir de R$ {minPrice.toFixed(2)}</span>
            ) : (
              <span>R$ {minPrice.toFixed(2)} - R$ {maxPrice.toFixed(2)}</span>
            )}
          </div>
          
          <Link to={`/evento/${event.id}`}>
            <Button variant="primary">
              Ver Ingressos
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default Home; 