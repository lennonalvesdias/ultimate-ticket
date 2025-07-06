import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CartItem, CartContextType } from '../types';

// Actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id' | 'totalPrice'> }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

// State
interface CartState {
  items: CartItem[];
}

// Initial state
const initialState: CartState = {
  items: []
};

// Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const newItem: CartItem = {
        ...action.payload,
        id: Date.now().toString(),
        totalPrice: action.payload.unitPrice * action.payload.quantity
      };
      
      // Verificar se o item já existe no carrinho
      const existingItemIndex = state.items.findIndex(
        item => item.eventId === newItem.eventId && item.ticketType === newItem.ticketType
      );
      
      if (existingItemIndex >= 0) {
        // Atualizar quantidade do item existente
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
          totalPrice: updatedItems[existingItemIndex].unitPrice * 
                     (updatedItems[existingItemIndex].quantity + newItem.quantity)
        };
        return { ...state, items: updatedItems };
      } else {
        // Adicionar novo item
        return { ...state, items: [...state.items, newItem] };
      }
    }
    
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id)
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== id)
        };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id
            ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
            : item
        )
      };
    }
    
    case 'CLEAR_CART': {
      return { ...state, items: [] };
    }
    
    default:
      return state;
  }
};

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  // Computed values
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Actions
  const addItem = (item: Omit<CartItem, 'id' | 'totalPrice'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };
  
  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const contextValue: CartContextType = {
    items: state.items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };
  
  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Hook
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}; 