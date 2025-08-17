
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

  async getDetailedLeads(maxDaysBack: number = 365): Promise<any[]> {
    try {
      const leads = await this.getLeads(250);
      const contacts = await this.getContacts(250);
      
      // Filter leads by date (up to maxDaysBack days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxDaysBack);
      const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);
      
      const filteredLeads = leads.filter(lead => 
        lead.created_at >= cutoffTimestamp
      );
      
      // Create a map of contact IDs to contact info
      const contactMap = new Map();
      contacts.forEach(contact => {
        contactMap.set(contact.id, contact);
      });

      return filteredLeads.map(lead => {
        // Try to find the corresponding contact
        let contact = contactMap.get(lead.id);
        
        // If no direct match, try to find by lead's embedded contact data
        if (!contact && lead._embedded?.contacts?.[0]) {
          contact = lead._embedded.contacts[0];
        }

        // Extract email from different possible sources
        let email = '';
        if (contact?.custom_fields_values) {
          const emailField = contact.custom_fields_values.find(field => 
            field.field_code === 'EMAIL' || field.field_name === 'Email'
          );
          email = emailField?.values?.[0]?.value || '';
        }

        // Extract phone from different possible sources
        let phone = '';
        if (contact?.custom_fields_values) {
          const phoneField = contact.custom_fields_values.find(field => 
            field.field_code === 'PHONE' || field.field_name === 'Telefone'
          );
          phone = phoneField?.values?.[0]?.value || '';
        }

        // Extract custom fields
        const customFields = contact?.custom_fields_values?.map(field => ({
          name: field.field_name || field.field_code,
          value: field.values?.[0]?.value || '',
          code: field.field_code
        })).filter(field => 
          field.code !== 'EMAIL' && field.code !== 'PHONE' && field.value
        ) || [];

        return {
          id: lead.id.toString(),
          name: lead.name || contact?.name || 'Lead sem nome',
          email: email,
          phone: phone,
          source: 'Kommo CRM',
          status: this.getLeadStatus(lead.status_id),
          value: lead.price || 0,
          createdAt: new Date(lead.created_at * 1000).toISOString(),
          lastActivity: lead.updated_at ? `Atualizado em ${new Date(lead.updated_at * 1000).toLocaleDateString('pt-BR')}` : '',
          pipelineId: lead.pipeline_id,
          responsibleUserId: lead.responsible_user_id,
          customFields: customFields
        };
      });
    } catch (error) {
      console.error('Error getting detailed leads from Kommo:', error);
      return [];
    }
  }

  async getDetailedSales(): Promise<any[]> {
    try {
      const leads = await this.getLeads(250);
      const contacts = await this.getContacts(250);
      
      // Create a map of contact IDs to contact info
      const contactMap = new Map();
      contacts.forEach(contact => {
        contactMap.set(contact.id, contact);
      });

      // Filter only closed/won leads
      const wonLeads = leads.filter(lead => 
        lead.closed_at && (lead.status_id === 142 || lead.status_id === 143)
      );

      return wonLeads.map(lead => {
        const contact = contactMap.get(lead.id) || {};
        return {
          id: lead.id.toString(),
          customerName: lead.name || contact.name || 'Cliente sem nome',
          customerEmail: contact.custom_fields_values?.find(field => field.field_code === 'EMAIL')?.values?.[0]?.value || '',
          product: 'Produto/Serviço', // Kommo doesn't have specific product info
          value: lead.price || 0,
          status: 'completed',
          paymentMethod: 'not_specified',
          source: 'Kommo CRM',
          createdAt: new Date(lead.created_at * 1000).toISOString(),
          completedAt: lead.closed_at ? new Date(lead.closed_at * 1000).toISOString() : undefined
        };
      });
    } catch (error) {
      console.error('Error getting detailed sales from Kommo:', error);
      return [];
    }
  }

  private getLeadStatus(statusId: number): string {
    // Common Kommo status IDs mapping
    switch (statusId) {
      case 28617499: // New
      case 28617502: // First contact
        return 'new';
      case 28617505: // Negotiation
      case 28617508: // Preparing proposal
        return 'contacted';
      case 28617511: // Decision making
        return 'qualified';
      case 142: // Won
      case 143: // Won
        return 'converted';
      case 144: // Lost
        return 'lost';
      default:
        return 'new';
    }
  }

  isConfigured(): boolean {
    return !!(this.accessToken && this.subdomain);
  }
}
