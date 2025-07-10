export interface User {
  id: string;
  email: string;
  name: string;
}

export interface NetworkPacket {
  id: string;
  timestamp: string;
  sourceIP: string;
  destinationIP: string;
  protocol: string;
  packetSize: number;
  flags: string;
  port: number;
  status: 'normal' | 'suspicious' | 'malicious';
  country: string;
  action: 'Allow' | 'Deny';
  userFlagged?: {
    attackType: string;
    flaggedAt: string;
    confidence?: number;
  };
}

export interface AttackDetection {
  id: string;
  type: string;
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  timestamp: string;
  description: string;
  affectedSystems: number;
  userFlagged?: {
    attackType: string;
    flaggedAt: string;
  };
}

export interface AttackHistoryItem {
  id: string;
  attackType: string;
  timestamp: string;
  affectedHost: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Blocked' | 'Monitored' | 'Investigating';
  sourceIP: string;
  userFlagged?: {
    attackType: string;
    flaggedAt: string;
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  sourceIP: string;
  destinationIP: string;
  trafficType: string;
  port: number;
  action: 'Allow' | 'Deny' | 'Monitor';
  details: string;
  confidence?: number;
  userFlagged?: {
    attackType: string;
    flaggedAt: string;
    confidence?: number;
  };
}

export interface FlagRequest {
  packetId: string;
  attackType: string;
  originalPrediction?: string;
  confidence?: number;
  timestamp: string;
  sourceIP: string;
  destinationIP: string;
  protocol: string;
  port: number;
}

export type AuthMode = 'login' | 'signup';

export const ATTACK_TYPES = {
  APT: [
    'APT - Pivoting',
    'APT - LateralMovement',
    'APT - Reconnaissance',
    'APT - DataExfiltration',
    'APT - InitialCompromise'
  ],
  DDOS: [
    'DDoS - DrDoS_DNS',
    'DDoS - DrDoS_LDAP',
    'DDoS - DrDoS_MSSQL',
    'DDoS - DrDoS_NetBIOS',
    'DDoS - DrDoS_NTP',
    'DDoS - DrDoS_SSDP',
    'DDoS - Syn',
    'DDoS - DrDoS_UDP',
    'DDoS - UDP-lag'
  ],
  OTHER: [
    'Normal Traffic'
  ]
} as const;