import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Buyer, PaymentMethod, ShippingOption, Order, CheckoutContextType, OrderStatus } from '../types';
import { apiService } from '../services/api';
import { useCart } from './CartContext';

// Actions
type CheckoutAction =
  | { type: 'SET_BUYER'; payload: Buyer }
  | { type: 'SET_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'SET_SHIPPING_OPTION'; payload: ShippingOption }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'RESET_CHECKOUT' };

// State
interface CheckoutState {
  buyer: Buyer | null;
  paymentMethod: PaymentMethod | null;
  shippingOption: ShippingOption | null;
  currentStep: number;
  isProcessing: boolean;
}

// Initial state
const initialState: CheckoutState = {
  buyer: null,
  paymentMethod: null,
  shippingOption: null,
  currentStep: 0,
  isProcessing: false
};

// Reducer
const checkoutReducer = (state: CheckoutState, action: CheckoutAction): CheckoutState => {
  switch (action.type) {
    case 'SET_BUYER':
      return { ...state, buyer: action.payload };
    
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    
    case 'SET_SHIPPING_OPTION':
      return { ...state, shippingOption: action.payload };
    
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    
    case 'RESET_CHECKOUT':
      return initialState;
    
    default:
      return state;
  }
};

// Context
const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

// Provider
interface CheckoutProviderProps {
  children: ReactNode;
}

export const CheckoutProvider: React.FC<CheckoutProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(checkoutReducer, initialState);
  
  // Actions
  const setBuyer = (buyer: Buyer) => {
    dispatch({ type: 'SET_BUYER', payload: buyer });
  };
  
  const setPaymentMethod = (method: PaymentMethod) => {
    dispatch({ type: 'SET_PAYMENT_METHOD', payload: method });
  };
  
  const setShippingOption = (option: ShippingOption) => {
    dispatch({ type: 'SET_SHIPPING_OPTION', payload: option });
  };
  
  const setCurrentStep = (step: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  };
  
  const processPayment = async (cartItems: any[]): Promise<{order: any, paymentData?: any}> => {
    if (!state.buyer || !state.paymentMethod) {
      throw new Error('Dados do comprador ou método de pagamento não definidos');
    }
    
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Carrinho vazio');
    }
    
    dispatch({ type: 'SET_PROCESSING', payload: true });
    
    try {
      // Preparar dados do pedido
      const orderData = {
        buyerData: {
          name: state.buyer.name,
          email: state.buyer.email,
          phone: state.buyer.phone,
          document: state.buyer.document,
          dateOfBirth: state.buyer.dateOfBirth ? state.buyer.dateOfBirth.toISOString().split('T')[0] : undefined,
          address: state.buyer.address ? `${state.buyer.address.street}, ${state.buyer.address.number}, ${state.buyer.address.city}, ${state.buyer.address.state}` : undefined
        },
        items: cartItems.map(item => ({
          eventId: item.eventId,
          ticketType: item.ticketType,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        paymentMethod: String(state.paymentMethod.type).toLowerCase() === 'pix' ? 'pix' : 
                      String(state.paymentMethod.type).toLowerCase() === 'cartao_credito' ? 'cartao_credito' :
                      String(state.paymentMethod.type).toLowerCase() === 'cartao_debito' ? 'cartao_debito' : 'boleto'
      };

      // Criar pedido na API
      const orderResponse = await apiService.createOrder(orderData);
      const order = orderResponse.data!;

      let paymentData = null;

      // Se for PIX, criar sessão de pagamento
      if (String(state.paymentMethod.type).toLowerCase() === 'pix') {
        const pixPaymentResponse = await apiService.createPixPayment(order.id);
        paymentData = pixPaymentResponse.data!;
      }

      return { order, paymentData };
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      throw new Error('Erro ao processar pagamento. Tente novamente.');
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  };
  
  const contextValue: CheckoutContextType = {
    buyer: state.buyer,
    paymentMethod: state.paymentMethod,
    shippingOption: state.shippingOption,
    currentStep: state.currentStep,
    isProcessing: state.isProcessing,
    setBuyer,
    setPaymentMethod,
    setShippingOption,
    setCurrentStep,
    processPayment
  };
  
  return (
    <CheckoutContext.Provider value={contextValue}>
      {children}
    </CheckoutContext.Provider>
  );
};

// Hook
export const useCheckout = (): CheckoutContextType => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout deve ser usado dentro de um CheckoutProvider');
  }
  return context;
}; 