const DEMO_API_BASE_URL = 'http://localhost:3002/api';

export interface UpdatedDemoTrafficConfig {
  webhookUrl?: string;
}

export interface UpdatedDemoTrafficStatus {
  running: boolean;
  webhook_url: string | null;
  csv_file?: string;
  upload_type?: string;
}

export interface UpdatedDemoTrafficResponse {
  success: boolean;
  message: string;
  status?: string | UpdatedDemoTrafficStatus;
  webhook_url?: string;
  upload_type?: string;
  csv_file?: string;
  output?: string;
}

export class UpdatedDemoTrafficApi {
  static async startDemoTraffic(config: UpdatedDemoTrafficConfig = {}): Promise<UpdatedDemoTrafficResponse> {
    try {
      const response = await fetch(`${DEMO_API_BASE_URL}/demo-traffic/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook_url: config.webhookUrl || 'https://metasage-ai.app.n8n.cloud/webhook-test/79975fb8-b60c-4261-a447-77ab1df4d99c'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error starting demo traffic:', error);
      throw error;
    }
  }

  static async stopDemoTraffic(): Promise<UpdatedDemoTrafficResponse> {
    try {
      const response = await fetch(`${DEMO_API_BASE_URL}/demo-traffic/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error stopping demo traffic:', error);
      throw error;
    }
  }

  static async getDemoTrafficStatus(): Promise<UpdatedDemoTrafficStatus> {
    try {
      const response = await fetch(`${DEMO_API_BASE_URL}/demo-traffic/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data.status as UpdatedDemoTrafficStatus;
    } catch (error) {
      console.error('Error getting demo traffic status:', error);
      // Return default status on error
      return {
        running: false,
        webhook_url: null
      };
    }
  }

  static async sendCSVOnce(config: UpdatedDemoTrafficConfig = {}): Promise<UpdatedDemoTrafficResponse> {
    try {
      const response = await fetch(`${DEMO_API_BASE_URL}/demo-traffic/send-once`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook_url: config.webhookUrl || 'https://metasage-ai.app.n8n.cloud/webhook-test/79975fb8-b60c-4261-a447-77ab1df4d99c'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error sending CSV file:', error);
      throw error;
    }
  }

  static async generateTraffic(): Promise<UpdatedDemoTrafficResponse> {
    try {
      const response = await fetch(`${DEMO_API_BASE_URL}/generate-traffic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error generating traffic:', error);
      throw error;
    }
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${DEMO_API_BASE_URL}/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('Demo Traffic API health check failed:', error);
      return false;
    }
  }
}