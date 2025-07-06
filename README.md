# 🎫 Ultimate Ticket

**Ultimate Ticket** é uma plataforma full-stack de e-commerce especializada na venda de ingressos para eventos esportivos como corridas, drift, rally, karting, fórmula 1, motocross e outros esportes motorizados.

## ✨ Características

- 🏁 **Eventos Esportivos**: Especializados em eventos de motorsport
- 🎯 **Filtros Avançados**: Busca por categoria, local, data e preço
- 🛒 **Carrinho de Compras**: Gerenciamento completo do carrinho
- 💳 **Pagamentos PIX**: Integração real com Stripe para pagamentos PIX
- 📱 **Responsivo**: Design adaptável para todos os dispositivos
- 🎨 **Design Moderno**: Interface limpa e intuitiva
- 🗄️ **Backend Completo**: API REST com banco de dados SQLite
- 🔒 **Segurança**: Rate limiting, CORS, validação de dados

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática
- **React Router** - Navegação entre páginas
- **Context API** - Gerenciamento de estado global
- **CSS3** - Estilização moderna
- **Date-fns** - Manipulação de datas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **SQLite** - Banco de dados
- **Stripe** - Processamento de pagamentos PIX
- **JWT** - Autenticação
- **Helmet** - Segurança HTTP

## 📦 Instalação

### 🔧 Desenvolvimento Local

1. **Clone o repositório**:
```bash
git clone <url-do-repositorio>
cd ultimate-ticket
```

2. **Instale todas as dependências**:
```bash
npm run install:all
```

3. **Configure variáveis de ambiente**:
```bash
# Backend (.env em backend/)
NODE_ENV=development
PORT=3001
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
FRONTEND_URL=http://localhost:3000

# Frontend (.env em frontend/)
REACT_APP_API_URL=http://localhost:3001/api
```

4. **Execute ambos os serviços**:
```bash
npm run dev
```

5. **Acesse no navegador**:
```
Frontend: http://localhost:3000
Backend: http://localhost:3001
```

### 🚀 Deploy no Railway

1. **Conecte seu repositório ao Railway**
2. **Configure as variáveis de ambiente** (veja DEPLOY.md)
3. **Deploy automático** - Railway detectará e executará automaticamente

Veja o arquivo `DEPLOY.md` para instruções detalhadas.

## 🏗️ Estrutura do Projeto

```
ultimate-ticket/
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── TextField/
│   │   │   ├── Alert/
│   │   │   ├── Container/
│   │   │   └── Navbar/
│   │   ├── contexts/       # Contextos React
│   │   │   ├── CartContext.tsx
│   │   │   └── CheckoutContext.tsx
│   │   ├── services/       # Serviços de API
│   │   │   └── api.ts
│   │   ├── pages/          # Páginas da aplicação
│   │   │   ├── Home/
│   │   │   ├── EventDetails/
│   │   │   ├── Checkout/
│   │   │   └── OrderConfirmation/
│   │   ├── types/          # Interfaces TypeScript
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── build/              # Build do React (produção)
├── backend/                # Express Backend
│   ├── routes/             # Rotas da API
│   │   ├── events.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   └── tickets.js
│   ├── config/             # Configurações
│   │   ├── database.js
│   │   └── stripe.js
│   ├── server.js           # Servidor principal
│   ├── package.json
│   └── database.sqlite     # Banco de dados SQLite
├── package.json            # Root package.json
├── railway.json            # Configuração Railway
├── Procfile               # Railway start command
├── DEPLOY.md              # Instruções de deploy
└── README.md
```

## 🎮 Funcionalidades

### 🏠 Página Inicial
- Exibição de eventos em destaque
- Filtros por categoria, localização e busca textual
- Ordenação por data, nome ou preço
- Cards de eventos com informações detalhadas

### 🎫 Detalhes do Evento
- Informações completas do evento
- Diferentes tipos de ingressos disponíveis
- Preços e benefícios de cada categoria
- Seleção de quantidade e adição ao carrinho

### 🛒 Carrinho de Compras
- Visualização de itens selecionados
- Alteração de quantidades
- Remoção de itens
- Cálculo automático do total

### 💳 Checkout
- Dados do comprador
- Seleção do método de pagamento
- Processamento do pedido
- Confirmação da compra

## 🎯 Categorias de Eventos

- **🏁 Corrida** - Corridas de rua e pista
- **🚗 Drift** - Competições de drift
- **🏔️ Rally** - Rallys e rally raids
- **🏎️ Karting** - Competições de kart
- **🏆 Fórmula** - Fórmula 1, Fórmula E, etc.
- **🏍️ Motocross** - Eventos de motocross
- **➕ Outros** - Demais modalidades

## 🎫 Tipos de Ingressos

- **🏟️ Pista** - Acesso geral à pista
- **🪑 Arquibancada** - Assentos em arquibancada
- **🏢 Camarote** - Acesso a camarotes
- **⭐ VIP** - Experiência VIP completa
- **🔧 Paddock** - Acesso ao paddock

## 💰 Métodos de Pagamento

- **💳 Cartão de Crédito** - Parcelamento disponível
- **💳 Cartão de Débito** - Pagamento à vista
- **📱 PIX** - Pagamento instantâneo
- **📄 Boleto** - Pagamento via boleto bancário

## 🎨 Sistema de Design

O projeto utiliza um sistema de design próprio com:
- **Componentes reutilizáveis** (Button, Card, TextField, Alert, Container)
- **Paleta de cores consistente**
- **Tipografia hierárquica**
- **Espaçamentos padronizados**
- **Design responsivo**

## 🚀 Scripts Disponíveis

### Scripts do Root (Monorepo)
```bash
# Desenvolvimento - Roda frontend e backend simultaneamente
npm run dev

# Instalar dependências de todos os projetos
npm run install:all

# Build completo (frontend + backend)
npm run build

# Produção (apenas backend - serve frontend buildado)
npm start
```

### Scripts do Frontend
```bash
cd frontend

# Desenvolvimento
npm start

# Build para produção
npm run build

# Testes
npm test
```

### Scripts do Backend
```bash
cd backend

# Desenvolvimento
npm run dev

# Produção
npm start

# Testes
npm test
```

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- 📱 Dispositivos móveis (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1200px+)
- 🖥️ Monitores grandes (1400px+)

## ✅ Funcionalidades Implementadas

- [x] **Integração com gateway de pagamento real** - Stripe PIX
- [x] **API backend completa** - Express + SQLite
- [x] **Sistema de pagamentos PIX** - QR Code e webhooks
- [x] **Banco de dados** - SQLite com estrutura completa
- [x] **Validação de dados** - Middleware de validação
- [x] **Segurança** - Rate limiting, CORS, Helmet
- [x] **Deploy pronto** - Configuração para Railway

## 🔮 Próximas Funcionalidades

- [ ] Sistema de autenticação de usuários
- [ ] Histórico de compras
- [ ] Notificações em tempo real
- [ ] Avaliações e comentários
- [ ] Programa de fidelidade
- [ ] Painel administrativo
- [ ] Múltiplos métodos de pagamento (cartão, boleto)
- [ ] Sistema de cupons e promoções

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades
- Melhorar a documentação
- Enviar pull requests

## 📞 Contato

Para dúvidas ou sugestões, entre em contato através do repositório GitHub.

---

**Ultimate Ticket** - Sua porta de entrada para os melhores eventos esportivos! 🏁🎫 