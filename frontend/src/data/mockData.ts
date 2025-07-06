import { Event, EventCategory, TicketType } from '../types';

export const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Campeonato Brasileiro de Drift 2024',
    description: 'A maior competição de drift do Brasil com os melhores pilotos nacionais e internacionais. Prepare-se para uma experiência única com muita adrenalina, queima de pneus e manobras incríveis.',
    category: EventCategory.DRIFT,
    date: new Date('2024-03-15T19:00:00'),
    endDate: new Date('2024-03-17T22:00:00'),
    venue: 'Autódromo de Interlagos',
    address: 'Av. Senador Teotônio Vilela, 261',
    city: 'São Paulo',
    state: 'SP',
    imageUrl: '/images/drift-championship.jpg',
    bannerUrl: '/images/drift-banner.jpg',
    organizer: 'Confederação Brasileira de Drift',
    capacity: 15000,
    availableTickets: 8500,
    ticketTypes: [TicketType.PISTA, TicketType.ARQUIBANCADA, TicketType.CAMAROTE, TicketType.PADDOCK],
    prices: {
      [TicketType.PISTA]: 120,
      [TicketType.ARQUIBANCADA]: 180,
      [TicketType.CAMAROTE]: 450,
      [TicketType.VIP]: 0,
      [TicketType.PADDOCK]: 800
    },
    isActive: true,
    featured: true,
    tags: ['drift', 'motorsport', 'adrenalina', 'interlagos'],
    metadata: {
      duration: '3 dias',
      ageRestriction: '16+',
      parking: true,
      food: true
    }
  },
  {
    id: '2',
    name: 'Grande Prêmio de Fórmula 1 - Brasil',
    description: 'O mais tradicional evento de Fórmula 1 do Brasil. Venha presenciar a velocidade extrema dos carros mais rápidos do mundo no icônico Autódromo de Interlagos.',
    category: EventCategory.FORMULA,
    date: new Date('2024-04-20T14:00:00'),
    endDate: new Date('2024-04-22T16:00:00'),
    venue: 'Autódromo de Interlagos',
    address: 'Av. Senador Teotônio Vilela, 261',
    city: 'São Paulo',
    state: 'SP',
    imageUrl: '/images/f1-brazil.jpg',
    bannerUrl: '/images/f1-banner.jpg',
    organizer: 'Fórmula 1 Brasil',
    capacity: 60000,
    availableTickets: 25000,
    ticketTypes: [TicketType.PISTA, TicketType.ARQUIBANCADA, TicketType.CAMAROTE, TicketType.VIP],
    prices: {
      [TicketType.PISTA]: 350,
      [TicketType.ARQUIBANCADA]: 600,
      [TicketType.CAMAROTE]: 1200,
      [TicketType.VIP]: 2500,
      [TicketType.PADDOCK]: 0
    },
    isActive: true,
    featured: true,
    tags: ['formula1', 'f1', 'velocidade', 'interlagos'],
    metadata: {
      duration: '3 dias',
      ageRestriction: 'Livre',
      parking: true,
      food: true
    }
  },
  {
    id: '3',
    name: 'Rally dos Sertões 2024',
    description: 'A maior prova de rally raid da América Latina. Acompanhe de perto a largada e chegada dos competidores nesta épica aventura pelo interior do Brasil.',
    category: EventCategory.RALLY,
    date: new Date('2024-05-10T08:00:00'),
    endDate: new Date('2024-05-18T18:00:00'),
    venue: 'Parque de Exposições de Goiânia',
    address: 'Rodovia GO-462, Km 5',
    city: 'Goiânia',
    state: 'GO',
    imageUrl: '/images/rally-sertoes.jpg',
    bannerUrl: '/images/rally-banner.jpg',
    organizer: 'Rally dos Sertões',
    capacity: 5000,
    availableTickets: 3200,
    ticketTypes: [TicketType.PISTA, TicketType.ARQUIBANCADA, TicketType.CAMAROTE],
    prices: {
      [TicketType.PISTA]: 80,
      [TicketType.ARQUIBANCADA]: 150,
      [TicketType.CAMAROTE]: 350,
      [TicketType.VIP]: 0,
      [TicketType.PADDOCK]: 0
    },
    isActive: true,
    featured: false,
    tags: ['rally', 'aventura', 'off-road', 'sertoes'],
    metadata: {
      duration: '8 dias',
      ageRestriction: 'Livre',
      parking: true,
      food: true
    }
  },
  {
    id: '4',
    name: 'Campeonato Paulista de Kart 2024',
    description: 'Competição de kart com as categorias iniciante, júnior e sênior. Venha acompanhar os futuros campeões do automobilismo brasileiro em ação.',
    category: EventCategory.KARTING,
    date: new Date('2024-06-05T09:00:00'),
    endDate: new Date('2024-06-05T17:00:00'),
    venue: 'Kartódromo Ayrton Senna',
    address: 'Rua Enzo Ferrari, 100',
    city: 'São Paulo',
    state: 'SP',
    imageUrl: '/images/karting-championship.jpg',
    bannerUrl: '/images/karting-banner.jpg',
    organizer: 'Federação Paulista de Kart',
    capacity: 2000,
    availableTickets: 1500,
    ticketTypes: [TicketType.ARQUIBANCADA, TicketType.CAMAROTE],
    prices: {
      [TicketType.PISTA]: 0,
      [TicketType.ARQUIBANCADA]: 50,
      [TicketType.CAMAROTE]: 120,
      [TicketType.VIP]: 0,
      [TicketType.PADDOCK]: 0
    },
    isActive: true,
    featured: false,
    tags: ['karting', 'competição', 'jovens', 'automobilismo'],
    metadata: {
      duration: '1 dia',
      ageRestriction: 'Livre',
      parking: true,
      food: true
    }
  },
  {
    id: '5',
    name: 'Motocross Nacional - Etapa São Paulo',
    description: 'Etapa paulista do campeonato nacional de motocross. Saltos incríveis, velocidade e muita terra voando nesta competição emocionante.',
    category: EventCategory.MOTOCROSS,
    date: new Date('2024-07-12T10:00:00'),
    endDate: new Date('2024-07-14T16:00:00'),
    venue: 'Pista de Motocross Ibiúna',
    address: 'Estrada do Motocross, Km 12',
    city: 'Ibiúna',
    state: 'SP',
    imageUrl: '/images/motocross-sp.jpg',
    bannerUrl: '/images/motocross-banner.jpg',
    organizer: 'Confederação Brasileira de Motocross',
    capacity: 8000,
    availableTickets: 6500,
    ticketTypes: [TicketType.PISTA, TicketType.ARQUIBANCADA, TicketType.CAMAROTE],
    prices: {
      [TicketType.PISTA]: 90,
      [TicketType.ARQUIBANCADA]: 140,
      [TicketType.CAMAROTE]: 280,
      [TicketType.VIP]: 0,
      [TicketType.PADDOCK]: 0
    },
    isActive: true,
    featured: false,
    tags: ['motocross', 'saltos', 'velocidade', 'terra'],
    metadata: {
      duration: '3 dias',
      ageRestriction: '12+',
      parking: true,
      food: true
    }
  },
  {
    id: '6',
    name: 'Corrida de Rua Night Run SP',
    description: 'Corrida noturna pelas ruas de São Paulo com percursos de 5km e 10km. Evento beneficente em prol de instituições de caridade.',
    category: EventCategory.CORRIDA,
    date: new Date('2024-08-25T19:00:00'),
    endDate: new Date('2024-08-25T23:00:00'),
    venue: 'Parque Ibirapuera',
    address: 'Av. Paulista, 1578',
    city: 'São Paulo',
    state: 'SP',
    imageUrl: '/images/night-run-sp.jpg',
    bannerUrl: '/images/running-banner.jpg',
    organizer: 'Associação Paulista de Corrida',
    capacity: 12000,
    availableTickets: 9500,
    ticketTypes: [TicketType.PISTA, TicketType.VIP],
    prices: {
      [TicketType.PISTA]: 45,
      [TicketType.ARQUIBANCADA]: 0,
      [TicketType.CAMAROTE]: 0,
      [TicketType.VIP]: 120,
      [TicketType.PADDOCK]: 0
    },
    isActive: true,
    featured: true,
    tags: ['corrida', 'noturna', 'beneficente', 'saude'],
    metadata: {
      duration: '4 horas',
      ageRestriction: '16+',
      parking: true,
      food: true
    }
  }
];

export const categoryLabels = {
  [EventCategory.CORRIDA]: 'Corrida',
  [EventCategory.DRIFT]: 'Drift',
  [EventCategory.RALLY]: 'Rally',
  [EventCategory.KARTING]: 'Karting',
  [EventCategory.FORMULA]: 'Fórmula',
  [EventCategory.MOTOCROSS]: 'Motocross',
  [EventCategory.OUTROS]: 'Outros'
};

export const ticketTypeLabels = {
  [TicketType.PISTA]: 'Pista',
  [TicketType.ARQUIBANCADA]: 'Arquibancada',
  [TicketType.CAMAROTE]: 'Camarote',
  [TicketType.VIP]: 'VIP',
  [TicketType.PADDOCK]: 'Paddock'
}; 