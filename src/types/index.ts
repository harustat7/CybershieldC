export interface User {
  id: string;
  email: string;
  name: string;
}


export interface NetworkPacket {
  id: number;
  time: string | null; // time without time zone, can be null
  sourceIP: string; // src_ip
  destinationIP: string; // dest_ip
  protocol: string;
  srcPort: number;
  dstPort: number;
  flowDuration: number;
  label?: string | null;
  status: string; // derived from label
  userFlagged?: {
    attackType: string;
    flaggedAt: string;
    confidence?: number;
     
  };
  attack_type?: string | null;
}


export interface AttackDetection {
  id: string;
  type: string;
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  timestamp: string;
  description: string;
  affectedSystems: number;
  prediction:string;
  userFlagged?: {
    attackType: string;
    flaggedAt: string;
  };
}


export interface SupabasePacket {
  id: number;
  time: string | null;
  src_ip: string;
  dest_ip: string;
  protocol: string;
  src_port: number;
  dst_port: number;
  flow_duration: number;
  label?: string | null;
  attack_type?: string | null;
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
    'Pivoting',
    'LateralMovement',
    'Reconnaissance',
    'DataExfiltration',
    'InitialCompromise'
  ],
  DDOS: [
    'DNS',
    'MSSQL',
    'NTP',
    'SSDP',
    'Syn'
  ],
  OTHER: [
    'Normal'
  ]
} as const;

// export interface User {
//   id: string;
//   email: string;
//   name: string;
// }

// export interface NetworkPacket {
//   id: number;
//   time: string | null; // time without time zone, can be null
//   sourceIP: string; // src_ip
//   destinationIP: string; // dest_ip
//   protocol: string;
//   srcPort: number;
//   dstPort: number;
//   flowDuration: number;
//   label?: string | null;
//   status: string; // derived from label
//   userFlagged?: {
//     attackType: string;
//     flaggedAt: string;
//     confidence?: number;
//   };
// }

// export interface AttackDetection {
//   id: string;
//   type: string;
//   threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
//   confidence: number;
//   timestamp: string;
//   description: string;
//   affectedSystems: number;
//   prediction:string;
//   userFlagged?: {
//     attackType: string;
//     flaggedAt: string;
//   };
// }

// export interface SupabasePacket {
//   id: number;
//   time: string | null;
//   src_ip: string;
//   dest_ip: string;
//   protocol: string;
//   src_port: number;
//   dst_port: number;
//   flow_duration: number;
//   label?: string | null;
// }

// export interface AttackHistoryItem {
//   id: string;
//   attackType: string;
//   timestamp: string;
//   affectedHost: string;
//   severity: 'Low' | 'Medium' | 'High' | 'Critical';
//   status: 'Blocked' | 'Monitored' | 'Investigating';
//   sourceIP: string;
//   userFlagged?: {
//     attackType: string;
//     flaggedAt: string;
//   };
// }

// export interface LogEntry {
//   id: string;
//   timestamp: string;
//   sourceIP: string;
//   destinationIP: string;
//   trafficType: string;
//   port: number;
//   action: 'Allow' | 'Deny' | 'Monitor';
//   details: string;
//   confidence?: number;
//   userFlagged?: {
//     attackType: string;
//     flaggedAt: string;
//     confidence?: number;
//   };
// }

// export interface FlagRequest {
//   packetId: string;
//   attackType: string;
//   originalPrediction?: string;
//   confidence?: number;
//   timestamp: string;
//   sourceIP: string;
//   destinationIP: string;
//   protocol: string;
//   port: number;
// }

// export type AuthMode = 'login' | 'signup';

// export const ATTACK_TYPES = {
//   APT: [
//     'Pivoting',
//     'LateralMovement',
//     'Reconnaissance',
//     'DataExfiltration',
//     'InitialCompromise'
//   ],
//   DDOS: [
//     'DNS',
//     'MSSQL',
//     'NTP',
//     'SSDP',
//     'Syn'
//   ],
//   OTHER: [
//     'Normal'
//   ]
// } as const;