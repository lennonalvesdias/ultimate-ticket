import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, TextField } from '../../components';
import { useCart } from '../../contexts/CartContext';
import { useCheckout } from '../../contexts/CheckoutContext';
import { PaymentMethodType, Buyer, PaymentMethod } from '../../types';
import './Checkout.css';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { processPayment, isProcessing } = useCheckout();
  
  const [currentStep, setCurrentStep] = useState<'buyer' | 'payment' | 'processing'>('buyer');
  const [error, setError] = useState<string | null>(null);
  
  // Dados do comprador
  const [buyerData, setBuyerData] = useState({
    name: '',
    email: '',
    phone: '',
    document: ''
  });

  // Método de pagamento fixo em PIX
  const paymentMethod: PaymentMethod = {
    type: PaymentMethodType.PIX
  };

  if (items.length === 0) {
    return (
      <Container>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1>Seu carrinho está vazio</h1>
            <p>Adicione alguns ingressos para continuar.</p>
            <Button onClick={() => navigate('/')}>
              Ver Eventos
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  const handleBuyerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!buyerData.name || !buyerData.email || !buyerData.phone || !buyerData.document) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    if (!buyerData.email.includes('@')) {
      setError('Email inválido');
      return;
    }

    setError(null);
    setCurrentStep('payment');
  };

  const handlePaymentSubmit = async () => {
    try {
      setCurrentStep('processing');
      setError(null);

      const buyer: Buyer = {
        name: buyerData.name,
        email: buyerData.email,
        phone: buyerData.phone,
        document: buyerData.document
      };

      const result = await processPayment(items);
      
      if (result.paymentData?.checkoutUrl) {
        // Redirecionar para o checkout do Stripe
        window.location.href = result.paymentData.checkoutUrl;
      } else {
        // Limpar carrinho e ir para confirmação
        clearCart();
        navigate(`/confirmacao/${result.order.id}`);
      }
    } catch (err: any) {
      console.error('Erro no checkout:', err);
      setError(err.message || 'Erro ao processar pagamento');
      setCurrentStep('payment');
    }
  };

  const subtotal = totalPrice;
  const fees = Math.round(subtotal * 0.05 * 100) / 100; // 5% de taxa
  const total = subtotal + fees;

  return (
    <Container>
      <div className="checkout">
        {/* Resumo do Pedido */}
        <Card>
          <h2>Resumo do Pedido</h2>
          <div className="checkout__items">
            {items.map(item => (
              <div key={item.id} className="checkout__item">
                <div className="checkout__item-info">
                  <h4>{item.eventName}</h4>
                  <p>{item.ticketType} - Quantidade: {item.quantity}</p>
                </div>
                <div className="checkout__item-price">
                  R$ {item.totalPrice.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="checkout__totals">
            <div className="checkout__total-item">
              <span>Subtotal:</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="checkout__total-item">
              <span>Taxa de serviço (5%):</span>
              <span>R$ {fees.toFixed(2)}</span>
            </div>
            <div className="checkout__total-item checkout__total-final">
              <strong>
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </strong>
            </div>
          </div>
        </Card>

        {/* Formulário de Dados do Comprador */}
        {currentStep === 'buyer' && (
          <Card>
            <h2>Dados do Comprador</h2>
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleBuyerSubmit}>
              <div className="form-grid">
                <TextField
                  label="Nome Completo"
                  value={buyerData.name}
                  onChange={(e) => setBuyerData({...buyerData, name: e.target.value})}
                  required
                  fullWidth
                />
                
                <TextField
                  label="Email"
                  type="email"
                  value={buyerData.email}
                  onChange={(e) => setBuyerData({...buyerData, email: e.target.value})}
                  required
                  fullWidth
                />
                
                <TextField
                  label="Telefone"
                  value={buyerData.phone}
                  onChange={(e) => setBuyerData({...buyerData, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                  required
                  fullWidth
                />
                
                <TextField
                  label="CPF"
                  value={buyerData.document}
                  onChange={(e) => setBuyerData({...buyerData, document: e.target.value})}
                  placeholder="000.000.000-00"
                  required
                  fullWidth
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => navigate(-1)}
                >
                  Voltar
                </Button>
                <Button type="submit" variant="primary">
                  Continuar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Método de Pagamento */}
        {currentStep === 'payment' && (
          <Card>
            <h2>Método de Pagamento</h2>
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            
            <div className="payment-method">
              <div className="payment-option selected">
                <div className="payment-option__icon">💳</div>
                <div className="payment-option__info">
                  <h3>PIX</h3>
                  <p>Pagamento instantâneo via PIX</p>
                  <p><strong>Aprovação imediata</strong></p>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <Button 
                variant="secondary" 
                onClick={() => setCurrentStep('buyer')}
              >
                Voltar
              </Button>
              <Button 
                variant="primary" 
                onClick={handlePaymentSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : 'Finalizar Compra'}
              </Button>
            </div>
          </Card>
        )}

        {/* Processando */}
        {currentStep === 'processing' && (
          <Card>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h2>Processando Pagamento...</h2>
              <p>Por favor, aguarde enquanto processamos seu pedido.</p>
              <div className="loading-spinner" style={{ margin: '2rem auto' }}>
                ⏳
              </div>
            </div>
          </Card>
        )}
      </div>
    </Container>
  );
};

export default Checkout; 