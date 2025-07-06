// API Service para conectar com o backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? '/api'  // Em produção, usa a URL relativa já que o backend serve o frontend
    : 'http://localhost:3001/api');

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error('Erro na API:', error);
      throw error;
    }
  }

  // Eventos
  async getEvents(params?: {
    category?: string;
    city?: string;
    state?: string;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PaginatedResponse<Event>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/events${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request<Event[]>(endpoint) as Promise<PaginatedResponse<Event>>;
  }

  async getEvent(id: string): Promise<ApiResponse<Event>> {
    return this.request<Event>(`/events/${id}`);
  }

  async getEventTickets(eventId: string): Promise<ApiResponse<{
    eventId: string;
    tickets: Array<{
      type: string;
      price: number;
      available: boolean;
      description: string;
      benefits: string[];
    }>;
  }>> {
    return this.request(`/events/${eventId}/tickets`);
  }

  // Pedidos
  async createOrder(orderData: {
    buyerData: {
      name: string;
      email: string;
      phone: string;
      document: string;
      dateOfBirth?: string;
      address?: string;
    };
    items: Array<{
      eventId: string;
      ticketType: string;
      quantity: number;
      unitPrice: number;
    }>;
    paymentMethod: string;
  }): Promise<ApiResponse<Order>> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/orders/${id}`);
  }

  async getOrders(params?: {
    email?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Order>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request<Order[]>(endpoint) as Promise<PaginatedResponse<Order>>;
  }

  // Pagamentos
  async createPixPayment(orderId: string): Promise<ApiResponse<{
    orderId: string;
    sessionId: string;
    checkoutUrl: string;
    qrCode?: string;
    expiresAt: string;
    amount: number;
  }>> {
    return this.request('/payments/pix', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  }

  async getPaymentStatus(sessionId: string): Promise<ApiResponse<{
    orderId: string;
    sessionId: string;
    status: string;
    paymentStatus: string;
    amountTotal: number;
    amountReceived: number;
    currency: string;
    customerEmail: string;
  }>> {
    return this.request(`/payments/status/${sessionId}`);
  }

  async cancelPayment(sessionId: string): Promise<ApiResponse<{
    orderId: string;
    sessionId: string;
    status: string;
  }>> {
    return this.request(`/payments/cancel/${sessionId}`, {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    uptime: number;
  }>> {
    return this.request('/health');
  }
}

// Interfaces TypeScript para as respostas da API
interface Event {
  id: string;
  name: string;
  description: string;
  category: string;
  date: string;
  end_date?: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  image_url?: string;
  banner_url?: string;
  organizer: string;
  capacity: number;
  available_tickets: number;
  ticket_types: string[];
  prices: Record<string, number>;
  is_active: boolean;
  featured: boolean;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  buyer_data: {
    name: string;
    email: string;
    phone: string;
    document: string;
    dateOfBirth?: string;
    address?: string;
  };
  items: Array<{
    eventId: string;
    ticketType: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  fees: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  payment_method: string;
  payment_intent_id?: string;
  stripe_session_id?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
}

// Instância singleton do serviço de API
export const apiService = new ApiService();
export type { Event, Order, ApiResponse, PaginatedResponse }; 