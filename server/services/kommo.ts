
export interface KommoContact {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  responsible_user_id: number;
  created_by: number;
  created_at: number;
  updated_at: number;
  custom_fields_values?: any[];
}

export interface KommoLead {
  id: number;
  name: string;
  price: number;
  responsible_user_id: number;
  group_id: number;
  status_id: number;
  pipeline_id: number;
  created_by: number;
  created_at: number;
  updated_at: number;
  closed_at?: number;
}

export interface KommoTask {
  id: number;
  text: string;
  complete_till: number;
  entity_id: number;
  entity_type: string;
  is_completed: boolean;
  task_type_id: number;
  created_at: number;
  updated_at: number;
}

export class KommoService {
  private accessToken: string;
  private subdomain: string;
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.KOMMO_ACCESS_TOKEN || '';
    this.subdomain = process.env.KOMMO_SUBDOMAIN || '';
    this.baseUrl = `https://${this.subdomain}.kommo.com/api/v4`;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken || !this.subdomain) {
      throw new Error('Kommo API credentials not configured');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Kommo API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getContacts(limit = 100): Promise<KommoContact[]> {
    try {
      const response = await this.makeRequest(`/contacts?limit=${limit}`);
      return response._embedded?.contacts || [];
    } catch (error) {
      console.error('Error fetching Kommo contacts:', error);
      throw error;
    }
  }

  async getLeads(limit = 100): Promise<KommoLead[]> {
    try {
      const response = await this.makeRequest(`/leads?limit=${limit}`);
      return response._embedded?.leads || [];
    } catch (error) {
      console.error('Error fetching Kommo leads:', error);
      throw error;
    }
  }

  async getTasks(limit = 100): Promise<KommoTask[]> {
    try {
      const response = await this.makeRequest(`/tasks?limit=${limit}`);
      return response._embedded?.tasks || [];
    } catch (error) {
      console.error('Error fetching Kommo tasks:', error);
      throw error;
    }
  }

  async getLeadsToday(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Math.floor(today.getTime() / 1000);

      const leads = await this.getLeads();
      
      const leadsToday = leads.filter(lead => {
        return lead.created_at >= todayTimestamp;
      });

      return leadsToday.length;
    } catch (error) {
      console.error('Error getting today\'s leads from Kommo:', error);
      return 0;
    }
  }

  async getRevenueToday(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Math.floor(today.getTime() / 1000);

      const leads = await this.getLeads();
      
      // Status ID 142 is typically "closed won" in Kommo, but this may vary by account
      const wonLeadsToday = leads.filter(lead => {
        return lead.closed_at && lead.closed_at >= todayTimestamp && 
               (lead.status_id === 142 || lead.status_id === 143); // Common won status IDs
      });

      const revenue = wonLeadsToday.reduce((total, lead) => {
        return total + (lead.price || 0);
      }, 0);

      return revenue;
    } catch (error) {
      console.error('Error getting today\'s revenue from Kommo:', error);
      return 0;
    }
  }

  async getContactsCount(): Promise<number> {
    try {
      const contacts = await this.getContacts();
      return contacts.length;
    } catch (error) {
      console.error('Error getting contacts count from Kommo:', error);
      return 0;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/account');
      return true;
    } catch (error) {
      console.error('Kommo connection test failed:', error);
      return false;
    }
  }
}
