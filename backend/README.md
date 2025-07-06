# Ultimate Ticket Backend

Backend da plataforma Ultimate Ticket - Sistema de venda de ingressos para eventos esportivos.

## 📋 Requisitos

- Node.js 16.x ou superior
- NPM 8.x ou superior
- Conta no Stripe para pagamentos

## 🚀 Instalação

1. **Navegue até o diretório do backend:**
   ```bash
   cd backend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```env
   # Configuração básica
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # Stripe (obrigatório)
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. **Inicie o servidor:**
   ```bash
   # Desenvolvimento
   npm run dev

   # Produção
   npm start
   ```

## 🗃️ Banco de Dados

O backend usa SQLite para simplicidade. O banco é criado automaticamente na primeira execução.

### Tabelas Principais:
- `events` - Eventos esportivos
- `orders` - Pedidos de compra
- `order_items` - Itens dos pedidos
- `buyers` - Dados dos compradores
- `tickets` - Tipos de ingressos (opcional)

## 🔧 API Endpoints

### Eventos
- `GET /api/events` - Listar eventos
- `GET /api/events/:id` - Detalhes do evento
- `GET /api/events/:id/tickets` - Ingressos disponíveis

### Pedidos
- `POST /api/orders` - Criar pedido
- `GET /api/orders/:id` - Detalhes do pedido
- `PUT /api/orders/:id/status` - Atualizar status

### Pagamentos
- `POST /api/payments/pix` - Criar pagamento PIX
- `GET /api/payments/status/:sessionId` - Status do pagamento
- `POST /api/payments/webhook` - Webhook do Stripe

## 💳 Integração Stripe PIX

### Configuração
1. Crie uma conta no Stripe
2. Ative o PIX no dashboard do Stripe
3. Configure as chaves de API no `.env`
4. Configure o webhook endpoint

### Fluxo de Pagamento
1. Cliente cria pedido via `POST /api/orders`
2. Sistema cria sessão PIX via `POST /api/payments/pix`
3. Cliente é redirecionado para checkout do Stripe
4. Stripe processa pagamento PIX
5. Webhook confirma pagamento
6. Status do pedido é atualizado

## 🔒 Segurança

### Implementações de Segurança:
- Helmet para headers de segurança
- CORS configurado
- Rate limiting (100 req/15min)
- Validação de entrada com express-validator
- Sanitização de dados

### Variáveis Sensíveis:
- `STRIPE_SECRET_KEY` - Chave secreta do Stripe
- `STRIPE_WEBHOOK_SECRET` - Segredo do webhook
- `JWT_SECRET` - Segredo JWT (futuro)

## 📊 Monitoramento

### Health Check
```bash
GET /health
```

### Logs
Os logs são exibidos no console em desenvolvimento.

## 🛠️ Desenvolvimento

### Comandos Disponíveis:
```bash
npm start        # Inicia servidor
npm run dev      # Inicia com nodemon
npm test         # Executa testes
```

### Estrutura de Pastas:
```
backend/
├── config/          # Configurações
│   ├── database.js  # Setup do SQLite
│   └── stripe.js    # Configuração Stripe
├── routes/          # Rotas da API
│   ├── events.js    # Endpoints de eventos
│   ├── orders.js    # Endpoints de pedidos
│   ├── payments.js  # Endpoints de pagamento
│   └── tickets.js   # Endpoints de ingressos
├── database/        # Banco SQLite
├── server.js        # Servidor principal
└── package.json     # Dependências
```

## 🔄 Webhook do Stripe

Configure o webhook no Stripe Dashboard:
- URL: `https://seu-dominio.com/api/payments/webhook`
- Eventos: `checkout.session.completed`, `payment_intent.succeeded`

## 📝 Exemplo de Uso

### Criar Pedido
```javascript
const order = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    buyerData: {
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
      document: '12345678901'
    },
    items: [{
      eventId: '1',
      ticketType: 'pista',
      quantity: 2,
      unitPrice: 120.00
    }],
    paymentMethod: 'pix'
  })
});
```

### Criar Pagamento PIX
```javascript
const payment = await fetch('/api/payments/pix', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'order-uuid'
  })
});
```

## 🐛 Troubleshooting

### Erros Comuns:
- `STRIPE_SECRET_KEY é obrigatória` - Configure as variáveis de ambiente
- `Erro ao conectar com banco` - Verifique permissões da pasta database
- `Webhook error` - Verifique o segredo do webhook

### Logs de Debug:
```bash
NODE_ENV=development npm run dev
```

## 📄 Licença

MIT License - Veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas e suporte, entre em contato através do email: suporte@ultimateticket.com 