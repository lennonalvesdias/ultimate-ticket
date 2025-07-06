import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button } from '../../components';
import { apiService } from '../../services/api';

interface OrderData {
  id: string;
  buyer_data: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    eventId: string;
    ticketType: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
  status: string;
  created_at: string;
}

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('unknown');

  useEffect(() => {
    if (!orderId) {
      setError('ID do pedido não encontrado');
      setLoading(false);
      return;
    }

    const loadOrderData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar dados do pedido
        const orderResponse = await apiService.getOrder(orderId);
        setOrder(orderResponse.data!);

        // Se há session_id, verificar status do pagamento
        const sessionId = searchParams.get('session_id');
        if (sessionId) {
          try {
            const paymentResponse = await apiService.getPaymentStatus(sessionId);
            setPaymentStatus(paymentResponse.data!.status);
          } catch (paymentError) {
            console.error('Erro ao verificar status do pagamento:', paymentError);
            setPaymentStatus('error');
          }
        } else {
          // Usar status do pedido
          setPaymentStatus(orderResponse.data!.status);
        }

      } catch (err) {
        console.error('Erro ao carregar pedido:', err);
        setError('Erro ao carregar dados do pedido. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId, searchParams]);

  if (loading) {
    return (
      <Container>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Carregando confirmação...</h2>
            <p>Por favor, aguarde enquanto verificamos seu pedido.</p>
          </div>
        </Card>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Erro ao carregar pedido</h2>
            <p style={{ color: 'red', marginBottom: '1rem' }}>
              {error || 'Pedido não encontrado'}
            </p>
            <Button onClick={() => navigate('/')}>
              Voltar ao Início
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'paid':
        return {
          title: '🎉 Pagamento Confirmado!',
          message: 'Seu pagamento foi processado com sucesso. Você receberá os ingressos por email.',
          color: 'green'
        };
      case 'pending':
        return {
          title: '⏳ Pagamento Pendente',
          message: 'Seu pagamento está sendo processado. Você será notificado quando for confirmado.',
          color: 'orange'
        };
      case 'cancelled':
        return {
          title: '❌ Pagamento Cancelado',
          message: 'O pagamento foi cancelado. Você pode tentar novamente se desejar.',
          color: 'red'
        };
      case 'expired':
        return {
          title: '⏰ Pagamento Expirado',
          message: 'O prazo para pagamento expirou. Você pode fazer um novo pedido.',
          color: 'red'
        };
      default:
        return {
          title: '📋 Pedido Criado',
          message: 'Seu pedido foi criado. Verifique o status do pagamento.',
          color: 'blue'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <Container>
      <div className="order-confirmation">
        <Card>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ color: statusInfo.color }}>
              {statusInfo.title}
            </h1>
            <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
              {statusInfo.message}
            </p>
            <p style={{ color: '#666' }}>
              Pedido #{order.id}
            </p>
          </div>
        </Card>

        <Card>
          <h2>Detalhes do Pedido</h2>
          
          <div className="order-details">
            <div className="order-section">
              <h3>Dados do Comprador</h3>
              <p><strong>Nome:</strong> {order.buyer_data.name}</p>
              <p><strong>Email:</strong> {order.buyer_data.email}</p>
              <p><strong>Telefone:</strong> {order.buyer_data.phone}</p>
            </div>

            <div className="order-section">
              <h3>Ingressos</h3>
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="order-item__info">
                      <p><strong>{item.ticketType}</strong></p>
                      <p>Quantidade: {item.quantity}</p>
                    </div>
                    <div className="order-item__price">
                      R$ {(item.unitPrice * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-section">
              <div className="order-total">
                <h3>Total: R$ {order.total.toFixed(2)}</h3>
              </div>
            </div>

            <div className="order-section">
              <p style={{ fontSize: '0.875rem', color: '#666' }}>
                Pedido criado em: {new Date(order.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ textAlign: 'center' }}>
            <h3>Próximos Passos</h3>
            {paymentStatus === 'paid' ? (
              <div>
                <p>✅ Seus ingressos serão enviados para {order.buyer_data.email}</p>
                <p>✅ Você receberá uma confirmação por email</p>
                <p>✅ Apresente os ingressos no dia do evento</p>
              </div>
            ) : (
              <div>
                <p>📧 Acompanhe o status do seu pedido pelo email {order.buyer_data.email}</p>
                <p>💳 Complete o pagamento se ainda não foi processado</p>
                <p>❓ Entre em contato conosco em caso de dúvidas</p>
              </div>
            )}
            
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Button onClick={() => navigate('/')}>
                Voltar ao Início
              </Button>
              {paymentStatus === 'cancelled' || paymentStatus === 'expired' ? (
                <Button variant="primary" onClick={() => navigate('/checkout')}>
                  Fazer Novo Pedido
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default OrderConfirmation; 