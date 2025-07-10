import { NetworkPacket, AttackDetection, AttackHistoryItem, LogEntry } from '../types';

const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'SSH', 'FTP'];
const ports = [80, 443, 22, 21, 25, 53, 110, 993, 995, 8080, 3389];
const flags = ['SYN', 'ACK', 'FIN', 'RST', 'PSH', 'URG', 'SYN-ACK', 'FIN-ACK'];
const countries = ['US', 'CN', 'RU', 'DE', 'GB', 'FR', 'JP', 'BR', 'IN', 'CA'];

export const generateMockPacket = (): NetworkPacket => {
  const isAnomaly = Math.random() < 0.1;
  const isSuspicious = Math.random() < 0.05;
  const status = isSuspicious ? 'malicious' : isAnomaly ? 'suspicious' : 'normal';
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toLocaleTimeString(),
    sourceIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    destinationIP: `192.168.1.${Math.floor(Math.random() * 255)}`,
    protocol: protocols[Math.floor(Math.random() * protocols.length)],
    packetSize: Math.floor(Math.random() * 1500) + 64,
    flags: flags[Math.floor(Math.random() * flags.length)],
    port: ports[Math.floor(Math.random() * ports.length)],
    status,
    country: countries[Math.floor(Math.random() * countries.length)],
    action: status === 'malicious' ? 'Deny' : 'Allow'
  };
};

export const generateMockPackets = (count: number): NetworkPacket[] => {
  return Array.from({ length: count }, () => generateMockPacket());
};

const attackTypes = [
  'APT - Pivoting', 'APT - LateralMovement', 'APT - Reconnaissance', 'APT - DataExfiltration', 'APT - InitialCompromise',
  'DDoS - DrDoS_DNS', 'DDoS - DrDoS_LDAP', 'DDoS - DrDoS_MSSQL', 'DDoS - DrDoS_NetBIOS', 'DDoS - DrDoS_NTP',
  'DDoS - DrDoS_SSDP', 'DDoS - Syn', 'DDoS - DrDoS_UDP', 'DDoS - UDP-lag', 'Normal Traffic'
];

export const generateMockAttackDetection = (): AttackDetection => {
  const threatLevels: AttackDetection['threatLevel'][] = ['Low', 'Medium', 'High', 'Critical'];
  const weights = [0.4, 0.3, 0.2, 0.1]; // Higher probability for lower threat levels
  
  let randomValue = Math.random();
  let threatLevel: AttackDetection['threatLevel'] = 'Low';
  
  for (let i = 0; i < weights.length; i++) {
    if (randomValue < weights[i]) {
      threatLevel = threatLevels[i];
      break;
    }
    randomValue -= weights[i];
  }
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    type: attackTypes[Math.floor(Math.random() * attackTypes.length)],
    threatLevel,
    confidence: Math.floor(Math.random() * 30) + 70, // 70-99% confidence
    timestamp: new Date().toLocaleTimeString(),
    description: `Detected suspicious activity from multiple sources`,
    affectedSystems: Math.floor(Math.random() * 5) + 1
  };
};

export const generateMockAttackHistory = (): AttackHistoryItem[] => {
  const severities: AttackHistoryItem['severity'][] = ['Low', 'Medium', 'High', 'Critical'];
  const statuses: AttackHistoryItem['status'][] = ['Blocked', 'Monitored', 'Investigating'];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: Math.random().toString(36).substr(2, 9),
    attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString(),
    affectedHost: `server-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}.local`,
    severity: severities[Math.floor(Math.random() * severities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    sourceIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
  }));
};

const trafficTypes = ['HTTP', 'HTTPS', 'SSH', 'FTP', 'DNS', 'SMTP', 'Malicious'];
const logPorts = [80, 443, 22, 21, 53, 25, 110, 993, 995, 8080, 3389, 1433, 3306];

export const generateMockLogs = (count: number): LogEntry[] => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  return Array.from({ length: count }, () => {
    const timestamp = new Date(oneDayAgo.getTime() + Math.random() * 24 * 60 * 60 * 1000);
    const trafficType = trafficTypes[Math.floor(Math.random() * trafficTypes.length)];
    const isMalicious = trafficType === 'Malicious' || Math.random() < 0.1;
    const action = isMalicious ? (Math.random() < 0.8 ? 'Deny' : 'Monitor') : 'Allow';
    
    const sourceIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const destinationIP = `192.168.1.${Math.floor(Math.random() * 255)}`;
    const port = logPorts[Math.floor(Math.random() * logPorts.length)];
    
    let details = '';
    if (isMalicious) {
      const maliciousDetails = [
        'Suspicious payload detected',
        'Multiple failed authentication attempts',
        'Port scanning activity',
        'Malware signature match',
        'Unusual traffic pattern',
        'Blacklisted IP address',
        'SQL injection attempt',
        'Cross-site scripting detected'
      ];
      details = maliciousDetails[Math.floor(Math.random() * maliciousDetails.length)];
    } else {
      const normalDetails = [
        'Normal web traffic',
        'File transfer completed',
        'Database query executed',
        'Email transmission',
        'DNS resolution',
        'Secure connection established',
        'User authentication successful',
        'API request processed'
      ];
      details = normalDetails[Math.floor(Math.random() * normalDetails.length)];
    }
    
    // Add confidence score for some entries
    const confidence = Math.random() < 0.7 ? Math.floor(Math.random() * 40) + 60 : undefined;
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: timestamp.toISOString(),
      sourceIP,
      destinationIP,
      trafficType,
      port,
      action,
      details,
      confidence
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};