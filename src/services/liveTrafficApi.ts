const LIVE_API_BASE_URL = 'http://localhost:3002/api';

export interface LiveTrafficConfig {
  webhookUrl?: string;
  interface?: string;
  batchSize?: number;
}

export interface LiveTrafficStatus {
  running: boolean;
  interface: string | null;
  webhook_url: string | null;
  packet_count: number;
  batch_size: number;
  flows_count: number;
  uptime: number;
}

export interface LiveTrafficResponse {
  success: boolean;
  message: string;
  status?: string | LiveTrafficStatus;
  webhook_url?: string;
  interface?: string;
  batch_size?: number;
  upload_type?: string;
}

export interface NetworkInterface {
  name: string;
  friendly_name: string;
  ip_address?: string;
  is_up: boolean;
}

export interface NetworkInterfacesResponse {
  success: boolean;
  interfaces: string[];
  friendly_names: { [key: string]: string };
  default: string;
  detailed_interfaces?: NetworkInterface[];
  message?: string;
}

export class LiveTrafficApi {
  static async startLiveTraffic(config: LiveTrafficConfig = {}): Promise<LiveTrafficResponse> {
    try {
      const response = await fetch(`${LIVE_API_BASE_URL}/live-traffic/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook_url: config.webhookUrl || 'https://metasage-ai.app.n8n.cloud/webhook/79975fb8-b60c-4261-a447-77ab1df4d99c',
          interface: config.interface || 'Wi-Fi',
          batch_size: config.batchSize || 100
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error starting live traffic:', error);
      throw error;
    }
  }

  static async stopLiveTraffic(): Promise<LiveTrafficResponse> {
    try {
      const response = await fetch(`${LIVE_API_BASE_URL}/live-traffic/stop`, {
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
      console.error('Error stopping live traffic:', error);
      throw error;
    }
  }

  static async getLiveTrafficStatus(): Promise<LiveTrafficStatus> {
    try {
      const response = await fetch(`${LIVE_API_BASE_URL}/live-traffic/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data.status as LiveTrafficStatus;
    } catch (error) {
      console.error('Error getting live traffic status:', error);
      // Return default status on error
      return {
        running: false,
        interface: null,
        webhook_url: null,
        packet_count: 0,
        batch_size: 100,
        flows_count: 0,
        uptime: 0
      };
    }
  }

  static async getNetworkInterfaces(): Promise<NetworkInterfacesResponse> {
    try {
      const response = await fetch(`${LIVE_API_BASE_URL}/live-traffic/interfaces`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Return fallback interfaces if API call fails
        return {
          success: false,
          interfaces: ['Wi-Fi', 'Ethernet'],
          friendly_names: {
            'Wi-Fi': 'Wi-Fi',
            'Ethernet': 'Ethernet'
          },
          default: 'Wi-Fi',
          message: data.message || 'Failed to get network interfaces'
        };
      }

      return data;
    } catch (error) {
      console.error('Error getting network interfaces:', error);
      // Return fallback interfaces on error
      return {
        success: false,
        interfaces: ['Wi-Fi', 'Ethernet'],
        friendly_names: {
          'Wi-Fi': 'Wi-Fi',
          'Ethernet': 'Ethernet'
        },
        default: 'Wi-Fi',
        message: 'Failed to connect to API'
      };
    }
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${LIVE_API_BASE_URL}/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('Live Traffic API health check failed:', error);
      return false;
    }
  }
}