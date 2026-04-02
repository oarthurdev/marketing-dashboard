export interface HubSpotContact {
  id: string;
  properties: {
    firstname: string;
    lastname: string;
    email: string;
    createdate: string;
    lifecyclestage: string;
  };
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount: string;
    dealstage: string;
    createdate: string;
    closedate?: string;
  };
}

export class HubSpotService {
  private apiKey: string;
  private baseUrl = 'https://api.hubapi.com';

  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_ACCESS_TOKEN || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getContacts(limit = 100): Promise<HubSpotContact[]> {
    if (!this.apiKey) {
      throw new Error('HubSpot API key not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/contacts?limit=${limit}&properties=firstname,lastname,email,createdate,lifecyclestage`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching HubSpot contacts:', error);
      throw error;
    }
  }

  async getDeals(limit = 100): Promise<HubSpotDeal[]> {
    if (!this.apiKey) {
      throw new Error('HubSpot API key not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/deals?limit=${limit}&properties=dealname,amount,dealstage,createdate,closedate`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching HubSpot deals:', error);
      throw error;
    }
  }

  async getLeadsToday(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      const contacts = await this.getContacts();
      
      const leadsToday = contacts.filter(contact => {
        const createDate = new Date(contact.properties.createdate);
        return createDate.getTime() >= todayTimestamp;
      });

      return leadsToday.length;
    } catch (error) {
      console.error('Error getting today\'s leads from HubSpot:', error);
      return 0;
    }
  }

  async getRevenueToday(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      const deals = await this.getDeals();
      
      const dealsToday = deals.filter(deal => {
        if (!deal.properties.closedate) return false;
        const closeDate = new Date(deal.properties.closedate);
        return closeDate.getTime() >= todayTimestamp && deal.properties.dealstage === 'closedwon';
      });

      const revenue = dealsToday.reduce((total, deal) => {
        const amount = parseFloat(deal.properties.amount) || 0;
        return total + amount;
      }, 0);

      return revenue;
    } catch (error) {
      console.error('Error getting today\'s revenue from HubSpot:', error);
      return 0;
    }
  }
}
