const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/ultimate_ticket.db');

// Criar diretório do banco se não existir
const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar com o banco de dados:', err.message);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
  }
});

// Função para executar queries com Promise
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Função para buscar dados
const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Função para buscar múltiplos dados
const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Inicializar tabelas
const initializeDatabase = async () => {
  try {
    // Tabela de eventos
    await runQuery(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        end_date TEXT,
        venue TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        image_url TEXT,
        banner_url TEXT,
        organizer TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        available_tickets INTEGER NOT NULL,
        ticket_types TEXT NOT NULL,
        prices TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        featured INTEGER DEFAULT 0,
        tags TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de ingressos
    await runQuery(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        type TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        description TEXT,
        benefits TEXT,
        is_available INTEGER DEFAULT 1,
        max_quantity_per_person INTEGER DEFAULT 10,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id)
      )
    `);

    // Tabela de pedidos
    await runQuery(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        buyer_id TEXT,
        buyer_data TEXT NOT NULL,
        items TEXT NOT NULL,
        subtotal REAL NOT NULL,
        fees REAL DEFAULT 0,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT NOT NULL,
        payment_intent_id TEXT,
        stripe_session_id TEXT,
        qr_code TEXT,
        boleto_url TEXT,
        transaction_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TEXT
      )
    `);

    // Tabela de itens do pedido
    await runQuery(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        ticket_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (event_id) REFERENCES events (id)
      )
    `);

    // Tabela de compradores
    await runQuery(`
      CREATE TABLE IF NOT EXISTS buyers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        document TEXT NOT NULL,
        date_of_birth TEXT,
        address TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabelas do banco de dados inicializadas com sucesso');
    
    // Inserir dados de exemplo se não existirem
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
};

// Inserir dados de exemplo
const insertSampleData = async () => {
  try {
    // Verificar se já existem eventos
    const existingEvents = await allQuery('SELECT COUNT(*) as count FROM events');
    
    if (existingEvents[0].count === 0) {
      console.log('📦 Inserindo dados de exemplo...');
      
      const sampleEvents = [
        {
          id: '1',
          name: 'Campeonato Brasileiro de Drift 2024',
          description: 'A maior competição de drift do Brasil com os melhores pilotos nacionais e internacionais. Prepare-se para uma experiência única com muita adrenalina, queima de pneus e manobras incríveis.',
          category: 'drift',
          date: '2024-03-15T19:00:00',
          end_date: '2024-03-17T22:00:00',
          venue: 'Autódromo de Interlagos',
          address: 'Av. Senador Teotônio Vilela, 261',
          city: 'São Paulo',
          state: 'SP',
          image_url: '/images/drift-championship.jpg',
          banner_url: '/images/drift-banner.jpg',
          organizer: 'Confederação Brasileira de Drift',
          capacity: 15000,
          available_tickets: 8500,
          ticket_types: JSON.stringify(['pista', 'arquibancada', 'camarote', 'paddock']),
          prices: JSON.stringify({
            pista: 120,
            arquibancada: 180,
            camarote: 450,
            vip: 0,
            paddock: 800
          }),
          is_active: 1,
          featured: 1,
          tags: JSON.stringify(['drift', 'motorsport', 'adrenalina', 'interlagos']),
          metadata: JSON.stringify({
            duration: '3 dias',
            ageRestriction: '16+',
            parking: true,
            food: true
          })
        },
        {
          id: '2',
          name: 'Grande Prêmio de Fórmula 1 - Brasil',
          description: 'O mais tradicional evento de Fórmula 1 do Brasil. Venha presenciar a velocidade extrema dos carros mais rápidos do mundo no icônico Autódromo de Interlagos.',
          category: 'formula',
          date: '2024-04-20T14:00:00',
          end_date: '2024-04-22T16:00:00',
          venue: 'Autódromo de Interlagos',
          address: 'Av. Senador Teotônio Vilela, 261',
          city: 'São Paulo',
          state: 'SP',
          image_url: '/images/f1-brazil.jpg',
          banner_url: '/images/f1-banner.jpg',
          organizer: 'Fórmula 1 Brasil',
          capacity: 60000,
          available_tickets: 25000,
          ticket_types: JSON.stringify(['pista', 'arquibancada', 'camarote', 'vip']),
          prices: JSON.stringify({
            pista: 350,
            arquibancada: 600,
            camarote: 1200,
            vip: 2500,
            paddock: 0
          }),
          is_active: 1,
          featured: 1,
          tags: JSON.stringify(['formula1', 'f1', 'velocidade', 'interlagos']),
          metadata: JSON.stringify({
            duration: '3 dias',
            ageRestriction: 'Livre',
            parking: true,
            food: true
          })
        }
      ];

      for (const event of sampleEvents) {
        await runQuery(`
          INSERT INTO events (
            id, name, description, category, date, end_date, venue, address, 
            city, state, image_url, banner_url, organizer, capacity, 
            available_tickets, ticket_types, prices, is_active, featured, 
            tags, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          event.id, event.name, event.description, event.category, event.date,
          event.end_date, event.venue, event.address, event.city, event.state,
          event.image_url, event.banner_url, event.organizer, event.capacity,
          event.available_tickets, event.ticket_types, event.prices,
          event.is_active, event.featured, event.tags, event.metadata
        ]);
      }

      console.log('✅ Dados de exemplo inseridos com sucesso');
    }
  } catch (error) {
    console.error('❌ Erro ao inserir dados de exemplo:', error);
  }
};

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery,
  initializeDatabase
}; 