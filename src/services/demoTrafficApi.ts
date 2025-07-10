const DEMO_API_BASE_URL = 'http://localhost:3002/api';

export interface DemoTrafficConfig {
  webhookUrl?: string;
}

export interface DemoTrafficStatus {
  running: boolean;
  webhook_url: string | null;
}

export interface DemoTrafficResponse {
  success: boolean;
  message: string;
  status?: string | DemoTrafficStatus;
  webhook_url?: string;
}

export class DemoTrafficApi {
  static async startDemoTraffic(config: DemoTrafficConfig = {}): Promise<DemoTrafficResponse> {
    try {
      const response = await fetch(`${DEMO_API_BASE_URL}/demo-traffic/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook_url: config.webhookUrl || 'http://localhost:5678/webhook/cybershield-packets'
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

  static async stopDemoTraffic(): Promise<DemoTrafficResponse> {
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

  static async getDemoTrafficStatus(): Promise<DemoTrafficStatus> {
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

      return data.status as DemoTrafficStatus;
    } catch (error) {
      console.error('Error getting demo traffic status:', error);
      // Return default status on error
      return {
        running: false,
        webhook_url: null
      };
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