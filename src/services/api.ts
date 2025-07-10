import { FlagRequest } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export class ApiService {
  static async flagPacket(flagData: FlagRequest): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/flag-packet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flagData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Packet flagged successfully:', result);
    } catch (error) {
      console.error('Error flagging packet:', error);
      // In a real app, you might want to show a user notification here
      throw error;
    }
  }

  static async updatePacketFlag(packetId: string, flagData: Omit<FlagRequest, 'packetId'>): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/flag-packet/${packetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flagData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Packet flag updated successfully:', result);
    } catch (error) {
      console.error('Error updating packet flag:', error);
      throw error;
    }
  }
}