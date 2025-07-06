// Enums para tipagem
export enum EventCategory {
  CORRIDA = 'corrida',
  DRIFT = 'drift',
  RALLY = 'rally',
  KARTING = 'karting',
  FORMULA = 'formula',
  MOTOCROSS = 'motocross',
  OUTROS = 'outros'
}

export enum TicketType {
  PISTA = 'pista',
  ARQUIBANCADA = 'arquibancada',
  CAMAROTE = 'camarote',
  VIP = 'vip',
  PADDOCK = 'paddock'
}

export enum PaymentMethodType {
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  PIX = 'pix',
  BOLETO = 'boleto'
}

export enum OrderStatus {
  PENDENTE = 'pendente',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  CANCELADO = 'cancelado'
}

// Interfaces principais
export interface Event {
  id: string;
  name: string;
  description: string;
  category: EventCategory;
  date: Date;
  endDate?: Date;
  venue: string;
  address: string;
  city: string;
  state: string;
  imageUrl: string;
  bannerUrl?: string;
  organizer: string;
  capacity: number;
  availableTickets: number;
  ticketTypes: TicketType[];
  prices: Record<TicketType, number>;
  isActive: boolean;
  featured: boolean;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface Ticket {
  id: string;
  eventId: string;
  type: TicketType;
  price: number;
  quantity: number;
  description: string;
  benefits: string[];
  isAvailable: boolean;
  maxQuantityPerPerson: number;
}

export interface CartItem {
  id: string;
  eventId: string;
  eventName: string;
  ticketType: TicketType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  eventDate: Date;
  eventVenue: string;
  eventImageUrl: string;
}

export interface Buyer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  document: string; // CPF/CNPJ
  dateOfBirth?: Date;
  address?: Address;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface PaymentMethod {
  type: PaymentMethodType;
  cardNumber?: string;
  cardName?: string;
  expiryDate?: string;
  cvv?: string;
  installments?: number;
  pixCode?: string;
  boletoCode?: string;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  buyer: Buyer;
  items: CartItem[];
  metadata?: Record<string, any>;
}

export interface Order {
  id: string;
  buyerId: string;
  items: CartItem[];
  subtotal: number;
  fees: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethodType;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  qrCode?: string;
  boletoUrl?: string;
  transactionId?: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
  isDigital: boolean;
}

// Interfaces para contextos
export interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, 'id' | 'totalPrice'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

export interface CheckoutContextType {
  buyer: Buyer | null;
  paymentMethod: PaymentMethod | null;
  shippingOption: ShippingOption | null;
  currentStep: number;
  isProcessing: boolean;
  setBuyer: (buyer: Buyer) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setShippingOption: (option: ShippingOption) => void;
  setCurrentStep: (step: number) => void;
  processPayment: (cartItems: any[]) => Promise<{order: any, paymentData?: any}>;
}

// Interfaces para formulários
export interface BuyerFormData {
  name: string;
  email: string;
  phone: string;
  document: string;
  dateOfBirth?: string;
}

export interface PaymentFormData {
  type: PaymentMethodType;
  cardNumber?: string;
  cardName?: string;
  expiryDate?: string;
  cvv?: string;
  installments?: number;
}

// Interfaces para API
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errors?: string[];
}

export interface EventFilters {
  category?: EventCategory;
  city?: string;
  state?: string;
  dateFrom?: Date;
  dateTo?: Date;
  priceFrom?: number;
  priceTo?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 