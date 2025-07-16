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
//   attack_type?: string | null;
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
//   attack_type?: string | null;
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



// src/types.ts

// (User interface unchanged)
export interface User {
  id: string;
  email: string;
  name: string;
}


// 1. ORIGINAL SOURCE DATABASE TABLES (BASED ON YOUR LATEST PROVIDED SCHEMAS)

// Schema for all_traffic_data (This is now the SINGLE source for full packet data)
export interface AllTrafficDataDbRow {
  id: number;
  created_at: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  flow_duration: number;
  label: number;
  attack_type: string;
  prob: number;
  tot_fwd_pkts: number;
  tot_bwd_pkts: number;
  totlen_fwd_pkts: number;
  totlen_bwd_pkts: number;
  fwd_pkt_len_max: number;
  fwd_pkt_len_min: number;
  fwd_pkt_len_mean: number;
  fwd_pkt_len_std: number;
  bwd_pkt_len_max: number;
  bwd_pkt_len_min: number;
  bwd_pkt_len_mean: number;
  bwd_pkt_len_std: number;
  flow_byts_s: number;
  flow_pkts_s: number;
  flow_iat_mean: number;
  flow_iat_std: number;
  flow_iat_max: number;
  flow_iat_min: number;
  fwd_iat_tot: number;
  fwd_iat_mean: number;
  fwd_iat_std: number;
  fwd_iat_max: number;
  fwd_iat_min: number;
  bwd_iat_tot: number;
  bwd_iat_mean: number;
  bwd_iat_std: number;
  bwd_iat_max: number;
  bwd_iat_min: number;
  fwd_psh_flags: number;
  bwd_psh_flags: number;
  fwd_urg_flags: number;
  bwd_urg_flags: number;
  fwd_header_len: number;
  bwd_header_len: number;
  fwd_pkts_s: number;
  bwd_pkts_s: number;
  pkt_len_min: number;
  pkt_len_max: number;
  pkt_len_mean: number;
  pkt_len_std: number;
  pkt_len_var: number;
  fin_flag_cnt: number;
  syn_flag_cnt: number;
  rst_flag_cnt: number;
  psh_flag_cnt: number;
  ack_flag_cnt: number;
  urg_flag_cnt: number;
  cwr_flag_cnt: number;
  ece_flag_cnt: number;
  down_up_ratio: number;
  pkt_size_avg: number;
  fwd_seg_size_avg: number;
  bwd_seg_size_avg: number;
  fwd_byts_b_avg: number;
  fwd_pkts_b_avg: number;
  fwd_blk_rate_avg: number;
  bwd_byts_b_avg: number;
  bwd_pkts_b_avg: number;
  bwd_blk_rate_avg: number;
  subflow_fwd_pkts: number;
  subflow_fwd_byts: number;
  subflow_bwd_pkts: number;
  subflow_bwd_byts: number;
  fwd_init_win_bytes: number;
  bwd_init_win_bytes: number;
  fwd_act_data_pkts: number;
  fwd_seg_size_min: number;
  active_mean: number;
  active_std: number;
  active_max: number;
  active_min: number;
  idle_mean: number;
  idle_std: number;
  idle_max: number;
  idle_min: number;
  hour: number;
  day: number;
  weekday: number;
}

// Union type for any of the original data rows that will be fetched by the backend
// Now exclusively AllTrafficDataDbRow for this flow
export type OriginalDbRow = AllTrafficDataDbRow;


// 2. TARGET FLAGGED DATABASE TABLES (MATCHING YOUR PROVIDED SCHEMAS)
export interface FlaggedAptTargetDbRow {
  id: number;
  src_port: number;
  dst_port: number;
  protocol: string;
  flow_duration: number;
  tot_fwd_pkts: number;
  tot_bwd_pkts: number;
  totlen_fwd_pkts: number;
  totlen_bwd_pkts: number;
  fwd_pkt_len_max: number;
  fwd_pkt_len_min: number;
  fwd_pkt_len_mean: number;
  fwd_pkt_len_std: number;
  bwd_pkt_len_max: number;
  bwd_pkt_len_min: number;
  bwd_pkt_len_mean: number;
  bwd_pkt_len_std: number;
  flow_byts_s: number;
  flow_pkts_s: number;
  flow_iat_mean: number;
  flow_iat_std: number;
  flow_iat_max: number;
  flow_iat_min: number;
  fwd_iat_tot: number;
  fwd_iat_mean: number;
  fwd_iat_std: number;
  fwd_iat_max: number;
  fwd_iat_min: number;
  bwd_iat_tot: number;
  bwd_iat_mean: number;
  bwd_iat_std: number;
  bwd_iat_max: number;
  bwd_iat_min: number;
  fwd_psh_flags: number;
  bwd_psh_flags: number;
  fwd_urg_flags: number;
  bwd_urg_flags: number;
  fwd_header_len: number;
  bwd_header_len: number;
  fwd_pkts_s: number;
  bwd_pkts_s: number;
  pkt_len_min: number;
  pkt_len_max: number;
  pkt_len_mean: number;
  pkt_len_std: number;
  pkt_len_var: number;
  fin_flag_cnt: number;
  syn_flag_cnt: number;
  rst_flag_cnt: number;
  psh_flag_cnt: number;
  ack_flag_cnt: number;
  urg_flag_cnt: number;
  cwr_flag_cnt: number;
  ece_flag_cnt: number;
  down_up_ratio: number;
  pkt_size_avg: number;
  fwd_seg_size_avg: number;
  bwd_seg_size_avg: number;
  fwd_byts_b_avg: number;
  fwd_pkts_b_avg: number;
  fwd_blk_rate_avg: number;
  bwd_byts_b_avg: number;
  bwd_pkts_b_avg: number;
  bwd_blk_rate_avg: number;
  subflow_fwd_pkts: number;
  subflow_fwd_byts: number;
  subflow_bwd_pkts: number;
  subflow_bwd_byts: number;
  fwd_init_win_bytes: number;
  bwd_init_win_bytes: number;
  fwd_act_data_pkts: number;
  fwd_seg_size_min: number;
  active_mean: number;
  active_std: number;
  active_max: number;
  active_min: number;
  idle_mean: number;
  idle_std: number;
  idle_max: number;
  idle_min: number;
  hour: number;
  Label: number; // Old Label (number)
  New_Label: number; // New Label (string)
  src_ip: string;
  dst_ip: string;
}

export interface FlagTrafficDosTargetDbRow {
  id: number;
  tot_fwd_pkts: number;
  tot_bwd_pkts: number;
  fin_flag_cnt: number;
  syn_flag_cnt: number;
  flow_iat_std: number;
  flow_iat_max: number;
  rst_flag_cnt: number;
  ack_flag_cnt: number;
  totlen_fwd_pkts: number;
  totlen_bwd_pkts: number;
  fwd_pkt_len_max: number;
  fwd_pkt_len_min: number;
  fwd_pkt_len_mean: number;
  fwd_pkt_len_std: number;
  bwd_pkt_len_max: number;
  bwd_pkt_len_min: number;
  bwd_pkt_len_mean: number;
  bwd_pkt_len_std: number;
  pkt_len_min: number;
  pkt_len_max: number;
  pkt_len_std: number;
  pkt_len_var: number;
  fwd_seg_size_avg: number;
  down_up_ratio: number;
  bwd_seg_size_avg: number;
  fwd_header_len: number;
  bwd_header_len: number;
  flow_duration: number;
  flow_iat_mean: number;
  flow_iat_min: number;
  bwd_iat_tot: number;
  bwd_iat_mean: number;
  bwd_iat_min: number;
  flow_byts_s: number;
  flow_pkts_s: number;
  fwd_pkts_s: number;
  bwd_pkts_s: number;
  protocol: string;
  label: number; // Old Label (number)
  new_label: number; // New Label (string)
  fwd_iat_tot: number;
  fwd_iat_mean: number;
  fwd_iat_std: number;
  fwd_iat_max: number;
  fwd_iat_min: number;
  bwd_iat_std: number;
  bwd_iat_max: number;
  pkt_len_mean: number;
  pkt_size_avg: number;
  subflow_fwd_byts: number;
  subflow_bwd_byts: number;
  fwd_act_data_pkts: number;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  created_at: string; // Flagging event time
}


// 3. CommonDataDbRow: Represents a row exactly as it exists in your 'common_data' DB table.
export interface CommonDataDbRow {
  id: number;
  // created_at: string; // The ACTUAL network event timestamp
  src_ip: string;
  dest_ip: string; // common_data uses dest_ip
  protocol: string;
  src_port: number;
  dst_port: number; // common_data uses dst_port
  flow_duration: number;
  label: number; // Original ML numerical label
  attack_type: string; // Original broad type
  time: string; // common_data has 'time' column which is the same as created_at
  all_traffic_data_id: number; // NEW: Foreign key to all_traffic_data.id
}


// 4. NetworkPacket (Frontend-facing UI type - UNCHANGED structure)
export interface NetworkPacket {
  id: number;
  time: string | null;
  sourceIP: string;
  destinationIP: string;
  protocol: string;
  srcPort: number;
  dstPort: number;
  flowDuration: number;
  label?: string | null;
  attack_type?: string | null;
  status: string;
  userFlagged?: {
    userattackType: string;
    flaggedAt: string;
    confidence?: number;
  };
}


// 5. FlagRequest (Data sent from frontend to backend - UNCHANGED structure)
export interface FlagRequest {
  packetId: string;
  userattackType: number;

  originalLabel: string | null;
  originalAttackType: string | null;

  timestamp: string | null;
  flowDuration: number;
  sourceIP: string;
  destinationIP: string;
  protocol: string;
  srcPort: number;
  dstPort: number;
}


// 6. AllTrafficDataDbRowUnified (Conceptual unified row structure for backend mapping)
// This interface represents the UNION of ALL possible fields from ALL your source tables.
// Since AllTrafficDataDbRow is now the single source, this could be simplified
// but it still conceptually represents the superset of all potential features across the domain.
export interface AllTrafficDataDbRowUnified {
    id: number;
    created_at: string; // Now always present from AllTrafficDataDbRow
    src_ip: string;
    dst_ip: string;
    src_port: number;
    dst_port: number;
    protocol: string;
    flow_duration: number;
    label: number; // Now always present from AllTrafficDataDbRow
    attack_type: string; // Now always present from AllTrafficDataDbRow
    prob: number; // Now always present from AllTrafficDataDbRow

    // These specific "variant" names are now redundant if AllTrafficDataDbRow uses consistent names
    // However, keeping them as optional for a truly "unified" conceptual view across all potential historical data models.
    Label?: number; // Might be needed if consuming old data that used 'Label'
    Prob?: number; // Might be needed if consuming old data that used 'Prob'

    tot_fwd_pkts: number;
    total_fwd_packet?: number; // Historical APT name

    tot_bwd_pkts: number;
    total_bwd_packets?: number; // Historical APT name

    fin_flag_cnt: number;
    syn_flag_cnt: number;
    rst_flag_cnt: number;
    psh_flag_cnt: number;
    ack_flag_cnt: number;
    urg_flag_cnt: number;
    cwr_flag_cnt: number;
    ece_flag_cnt: number;

    totlen_fwd_pkts: number;
    total_length_of_fwd_packet?: number; // Historical APT name

    totlen_bwd_pkts: number;
    total_length_of_bwd_packet?: number; // Historical APT name

    fwd_pkt_len_max: number;
    fwd_pkt_len_min: number;
    fwd_pkt_len_mean: number;
    fwd_pkt_len_std: number;
    bwd_pkt_len_max: number;
    bwd_pkt_len_min: number;
    bwd_pkt_len_mean: number;
    bwd_pkt_len_std: number;

    flow_byts_s: number;
    flow_packets_s: number;
    flow_iat_mean: number;
    flow_iat_std: number;
    flow_iat_max: number;
    flow_iat_min: number;
    fwd_iat_tot: number;
    fwd_iat_mean: number;
    fwd_iat_std: number;
    fwd_iat_max: number;
    fwd_iat_min: number;
    bwd_iat_tot: number;
    bwd_iat_mean: number;
    bwd_iat_std: number;
    bwd_iat_max: number;
    bwd_iat_min: number;

    fwd_psh_flags: number;
    bwd_psh_flags: number;
    fwd_urg_flags: number;
    bwd_urg_flags: number;
    fwd_header_len: number;
    bwd_header_len: number;
    fwd_pkts_s: number;
    bwd_pkts_s: number;
    pkt_len_min: number;
    pkt_len_max: number;
    pkt_len_mean: number;
    pkt_len_std: number;
    pkt_len_var: number;
    down_up_ratio: number;
    pkt_size_avg: number;
    fwd_seg_size_avg: number;
    bwd_seg_size_avg: number;
    fwd_byts_b_avg: number;
    fwd_pkts_b_avg: number;
    fwd_blk_rate_avg: number;
    bwd_byts_b_avg: number;
    bwd_pkts_b_avg: number;
    bwd_blk_rate_avg: number;
    subflow_fwd_pkts: number;
    subflow_fwd_byts: number;
    subflow_bwd_pkts: number;
    subflow_bwd_byts: number;
    fwd_init_win_bytes: number;
    bwd_init_win_bytes: number;
    fwd_act_data_pkts: number;
    fwd_seg_size_min: number;
    active_mean: number;
    active_std: number;
    active_max: number;
    active_min: number;
    idle_mean: number;
    idle_std: number;
    idle_max: number;
    idle_min: number;
    hour: number;
    day: number;
    weekday: number;

    // Remaining fields from AllTrafficDataDbRow Unified are now explicitly non-optional
    // as AllTrafficDataDbRow contains all of them.
}


// 7. AttackDetection (unchanged)
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
    userattackType: string;
    flaggedAt: string;
  };
}

// 8. SupabasePacket (unchanged - from your existing types.ts)
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

// 9. AttackHistoryItem (unchanged)
export interface AttackHistoryItem {
  id: string;
  attackType: string;
  timestamp: string;
  affectedHost: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Blocked' | 'Monitored' | 'Investigating';
  sourceIP: string;
  userFlagged?: {
    userattackType: string;
    flaggedAt: string;
  };
}

// 10. LogEntry (unchanged)
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
    userattackType: string;
    flaggedAt: string;
    confidence?: number;
  };
}

export type AuthMode = 'login' | 'signup';

// 11. ATTACK_TYPES (unchanged)
export const ATTACK_TYPES = {
  APT: [
    'Pivoting', 'Lateral Movement', 'Reconnaissance', 'Data Exfiltration', 'Initial Compromise', 'Normal (APT Context)'
  ],
  DDOS: [
    'DNS', 'MSSQL', 'NTP', 'SSDP', 'Syn', 'Normal (DOS Context)'
  ],
  OTHER: [
    'Normal'
  ]
} as const;