
export interface ShopifyOrder {
  id: number;
  order_number: string;
  total_price: string;
  financial_status: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  orders_count: number;
  total_spent: string;
}

export class ShopifyService {
  private apiKey: string;
  private password: string;
  private shopDomain: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.SHOPIFY_API_KEY || '';
    this.password = process.env.SHOPIFY_PASSWORD || '';
    this.shopDomain = process.env.SHOPIFY_SHOP_DOMAIN || '';
    this.baseUrl = `https://${this.apiKey}:${this.password}@${this.shopDomain}.myshopify.com/admin/api/2023-10`;
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.password && this.shopDomain);
  }

  private async makeRequest(endpoint: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Shopify API credentials not configured');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getOrders(limit = 100): Promise<ShopifyOrder[]> {
    try {
      const data = await this.makeRequest(`/orders.json?limit=${limit}&status=any`);
      return data.orders || [];
    } catch (error) {
      console.error('Error fetching Shopify orders:', error);
      throw error;
    }
  }

  async getCustomers(limit = 100): Promise<ShopifyCustomer[]> {
    try {
      const data = await this.makeRequest(`/customers.json?limit=${limit}`);
      return data.customers || [];
    } catch (error) {
      console.error('Error fetching Shopify customers:', error);
      throw error;
    }
  }

  async getTodayRevenue(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const orders = await this.getOrders();
      
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getTime() >= today.getTime() && order.financial_status === 'paid';
      });

      const revenue = todayOrders.reduce((total, order) => {
        return total + parseFloat(order.total_price);
      }, 0);

      return revenue;
    } catch (error) {
      console.error('Error getting today\'s revenue from Shopify:', error);
      return 0;
    }
  }

  async getTodayOrders(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const orders = await this.getOrders();
      
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getTime() >= today.getTime();
      });

      return todayOrders.length;
    } catch (error) {
      console.error('Error getting today\'s orders from Shopify:', error);
      return 0;
    }
  }
}

export interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  financial_status: string;
  fulfillment_status?: string;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  total_spent: string;
}

export class ShopifyService {
  private shopDomain: string;
  private accessToken: string;
  private baseUrl: string;

  constructor() {
    this.shopDomain = process.env.SHOPIFY_SHOP_DOMAIN || '';
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN || '';
    this.baseUrl = `https://${this.shopDomain}.myshopify.com/admin/api/2024-01`;
  }

  async getOrders(limit = 250, status = 'any'): Promise<ShopifyOrder[]> {
    if (!this.shopDomain || !this.accessToken) {
      throw new Error('Shopify credentials not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/orders.json?limit=${limit}&status=${status}&fields=id,name,created_at,updated_at,total_price,subtotal_price,financial_status,fulfillment_status,customer,line_items`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      console.error('Error fetching Shopify orders:', error);
      throw error;
    }
  }

  async getCustomers(limit = 250): Promise<ShopifyCustomer[]> {
    if (!this.shopDomain || !this.accessToken) {
      throw new Error('Shopify credentials not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/customers.json?limit=${limit}&fields=id,email,created_at,updated_at,first_name,last_name,orders_count,total_spent`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.customers || [];
    } catch (error) {
      console.error('Error fetching Shopify customers:', error);
      throw error;
    }
  }

  async getTodayRevenue(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const orders = await this.getOrders();
      
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getTime() >= today.getTime() && order.financial_status === 'paid';
      });

      const revenue = todayOrders.reduce((total, order) => {
        return total + parseFloat(order.total_price);
      }, 0);

      return revenue;
    } catch (error) {
      console.error('Error getting today\'s revenue from Shopify:', error);
      return 0;
    }
  }

  async getTodayOrders(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const orders = await this.getOrders();
      
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getTime() >= today.getTime();
      });

      return todayOrders.length;
    } catch (error) {
      console.error('Error getting today\'s orders from Shopify:', error);
      return 0;
    }
  }
}
