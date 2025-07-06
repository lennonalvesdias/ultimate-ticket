# Deploy no Railway

## Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no Railway:

```bash
# Environment
NODE_ENV=production
PORT=3001

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app-name.railway.app

# Database (SQLite path)
DB_PATH=./database.sqlite
```

## Comandos de Deploy

### 1. Instalar dependências
```bash
npm run install:all
```

### 2. Build do frontend
```bash
npm run build:frontend
```

### 3. Iniciar o servidor (Railway)
```bash
npm start
```

## Estrutura do Projeto

```
ultimate-ticket/
├── frontend/          # React app
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── build/         # Build do React (gerado)
├── backend/           # Express server
│   ├── routes/
│   ├── config/
│   ├── server.js
│   └── package.json
├── package.json       # Root package.json
├── railway.json       # Railway config
└── Procfile          # Railway start command
```

## Configuração no Railway

1. Conecte o repositório no Railway
2. Configure as variáveis de ambiente
3. O Railway automaticamente detectará e rodará `npm start`
4. A aplicação estará disponível na URL fornecida pelo Railway

## Desenvolvimento Local

### Rodar ambos os serviços
```bash
npm run dev
```

### Rodar apenas o backend
```bash
npm run dev:backend
```

### Rodar apenas o frontend
```bash
npm run dev:frontend
``` 