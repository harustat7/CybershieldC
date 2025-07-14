// // src/utils/protocolMapping.ts

// // IP Protocol Numbers mapping
// const IP_PROTOCOL_NUMBERS: { [key: number]: string } = {
//   1: 'ICMP',
//   6: 'TCP',
//   17: 'UDP',
//   47: 'GRE', // Generic Routing Encapsulation
//   50: 'ESP', // Encapsulating Security Payload
//   51: 'AH',  // Authentication Header
//   88: 'EIGRP', // Enhanced Interior Gateway Routing Protocol
//   89: 'OSPF', // Open Shortest Path First
//   // Add more IP layer protocols if needed
//   // Comprehensive list: https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml
// };

// // Common Application Protocols and their standard ports
// // Prioritize destination port for service identification, but also check source port.
// const APP_PROTOCOL_PORTS: { [port: number]: { tcp?: string; udp?: string; common?: string } } = {
//   // TCP-based services
//   20: { tcp: 'FTP-Data' }, // FTP Data
//   21: { tcp: 'FTP' },      // FTP Control
//   22: { tcp: 'SSH' },
//   23: { tcp: 'Telnet' },
//   25: { tcp: 'SMTP' },
//   80: { tcp: 'HTTP' },
//   110: { tcp: 'POP3' },
//   143: { tcp: 'IMAP' },
//   389: { tcp: 'LDAP' },
//   443: { tcp: 'HTTPS' },
//   465: { tcp: 'SMTPS' },  // SMTP over SSL/TLS
//   587: { tcp: 'SMTP' },   // SMTP Submission
//   636: { tcp: 'LDAPS' },  // LDAP over SSL/TLS
//   993: { tcp: 'IMAPS' },  // IMAP over SSL/TLS
//   995: { tcp: 'POP3S' },  // POP3 over SSL/TLS
//   1433: { tcp: 'MSSQL' },  // Microsoft SQL Server
//   3389: { tcp: 'RDP' },    // Remote Desktop Protocol

//   // UDP-based services
//   53: { udp: 'DNS' },
//   67: { udp: 'DHCP' },   // DHCP Server
//   68: { udp: 'DHCP' },   // DHCP Client
//   69: { udp: 'TFTP' },   // Trivial File Transfer Protocol
//   123: { udp: 'NTP' },
//   161: { udp: 'SNMP' },   // SNMP Agent
//   162: { udp: 'SNMP' },   // SNMP Trap
//   1900: { udp: 'SSDP' }, // Simple Service Discovery Protocol
//   1434: { udp: 'MSSQL-Monitor' }, // Microsoft SQL Server Monitor
// };

// export const getProtocolName = (
//   protocol: number | string | undefined | null,
//   srcPort: number | undefined | null,
//   dstPort: number | undefined | null
// ): string => {
//   // Handle undefined or null input for 'protocol' by returning 'N/A'
//   // This explicitly catches cases where no meaningful protocol value is present.
//   if (protocol === undefined || protocol === null) {
//     return 'N/A'; // Return "N/A" for genuinely missing or null protocol data
//   }

//   // If protocol is already a string (e.g., from backend classification like "ICMP")
//   if (typeof protocol === 'string') {
//     const upperProtocol = protocol.toUpperCase();
//     // If it's explicitly "TCP" or "UDP" (case-insensitive), try to infer application protocol from ports
//     if (upperProtocol === 'TCP' || upperProtocol === 'UDP') {
//       const portsToCheck = [dstPort, srcPort].filter(p => p !== undefined && p !== null);
//       for (const port of portsToCheck) {
//         if (port && APP_PROTOCOL_PORTS[port]) {
//           if (upperProtocol === 'TCP' && APP_PROTOCOL_PORTS[port].tcp) {
//             return APP_PROTOCOL_PORTS[port].tcp as string;
//           }
//           if (upperProtocol === 'UDP' && APP_PROTOCOL_PORTS[port].udp) {
//             return APP_PROTOCOL_PORTS[port].udp as string;
//           }
//         }
//       }
//       // If no specific application protocol found, return "TCP" or "UDP"
//       return upperProtocol;
//     }
//     // For other string protocols (e.g., "ICMP" if backend already provides this), return as is
//     return protocol;
//   }

//   // If protocol is a number (IP protocol number)
//   const protoNum = Number(protocol); // Try to convert to number
  
//   // If conversion results in NaN (e.g., if 'protocol' was "abc" or a weird type after checks above)
//   if (isNaN(protoNum)) {
//     return 'N/A'; // Return "N/A" for non-numeric, unmappable values
//   }

//   // If it's TCP (6) or UDP (17), try to infer application protocol from ports
//   if (protoNum === 6 || protoNum === 17) {
//     const portsToCheck = [dstPort, srcPort].filter(p => p !== undefined && p !== null);
//     for (const port of portsToCheck) {
//       if (port && APP_PROTOCOL_PORTS[port]) {
//         if (protoNum === 6 && APP_PROTOCOL_PORTS[port].tcp) {
//           return APP_PROTOCOL_PORTS[port].tcp as string;
//         }
//         if (protoNum === 17 && APP_PROTOCOL_PORTS[port].udp) {
//           return APP_PROTOCOL_PORTS[port].udp as string;
//         }
//       }
//     }
//     // If no specific application protocol found, return "TCP" or "UDP" based on IP protocol number
//     // This is where 'IP_PROTOCOL_NUMBERS[protoNum]' would be used
//     return IP_PROTOCOL_NUMBERS[protoNum] || `Unknown (${protoNum})`;
//   }

//   // For other IP protocol numbers (not TCP/UDP), return their name or "Unknown"
//   // This covers protocols like ICMP, GRE, OSPF, etc.
//   return IP_PROTOCOL_NUMBERS[protoNum] || `Unknown (${protoNum})`;
// };

// src/utils/protocolMapping.ts

// IP Protocol Numbers mapping
const IP_PROTOCOL_NUMBERS: { [key: number]: string } = {
  1: 'ICMP',
  6: 'TCP',
  17: 'UDP',
  47: 'GRE', // Generic Routing Encapsulation
  50: 'ESP', // Encapsulating Security Payload
  51: 'AH',  // Authentication Header
  88: 'EIGRP', // Enhanced Interior Gateway Routing Protocol
  89: 'OSPF', // Open Shortest Path First
  // Add more IP layer protocols if needed
  // Comprehensive list: https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml
};

// Common Application Protocols and their standard ports
// Prioritize destination port for service identification, but also check source port.
const APP_PROTOCOL_PORTS: { [port: number]: { tcp?: string; udp?: string; common?: string } } = {
  // TCP-based services
  20: { tcp: 'FTP-Data' }, // FTP Data
  21: { tcp: 'FTP' },      // FTP Control
  22: { tcp: 'SSH' },
  23: { tcp: 'Telnet' },
  25: { tcp: 'SMTP' },
  80: { tcp: 'HTTP' },
  110: { tcp: 'POP3' },
  143: { tcp: 'IMAP' },
  389: { tcp: 'LDAP' },
  443: { tcp: 'HTTPS' },
  465: { tcp: 'SMTPS' },  // SMTP over SSL/TLS
  587: { tcp: 'SMTP' },   // SMTP Submission
  636: { tcp: 'LDAPS' },  // LDAP over SSL/TLS
  993: { tcp: 'IMAPS' },  // IMAP over SSL/TLS
  995: { tcp: 'POP3S' },  // POP3 over SSL/TLS
  1433: { tcp: 'MSSQL' },  // Microsoft SQL Server
  3389: { tcp: 'RDP' },    // Remote Desktop Protocol

  // UDP-based services
  53: { udp: 'DNS' },
  67: { udp: 'DHCP' },   // DHCP Server
  68: { udp: 'DHCP' },   // DHCP Client
  69: { udp: 'TFTP' },   // Trivial File Transfer Protocol
  123: { udp: 'NTP' },
  161: { udp: 'SNMP' },   // SNMP Agent
  162: { udp: 'SNMP' },   // SNMP Trap
  1900: { udp: 'SSDP' }, // Simple Service Discovery Protocol
  1434: { udp: 'MSSQL-Monitor' }, // Microsoft SQL Server Monitor
};

export const getProtocolName = (
  protocol: number | string | undefined | null,
  srcPort: number | undefined | null,
  dstPort: number | undefined | null
): string => {
  // 1. Handle missing or null input for 'protocol'
  if (protocol === undefined || protocol === null) {
    return 'N/A'; // Consistent fallback for genuinely missing data
  }

  let protoValue: number | string = protocol; // Use a working variable for internal processing

  // 2. Attempt to convert string protocols to numbers if they are numeric.
  // This is crucial for handling cases where numbers like "6" or "17" come as strings from the backend.
  if (typeof protoValue === 'string') {
    const parsedNum = Number(protoValue);
    if (!isNaN(parsedNum)) {
      protoValue = parsedNum; // If the string is a valid number (e.g., "6"), convert it to a number (6)
    } else {
      // If it's a non-numeric string (e.g., "ICMP", "HTTP_OVER_TCP_UNKNOWN_PORT"), keep it as a string
      // and normalize its case for potential direct lookup (though our maps use numbers for primary IP protocols).
      protoValue = protoValue.toUpperCase();
    }
  }

  // 3. Now, determine the protocol name based on the processed 'protoValue'
  if (typeof protoValue === 'number') {
    // This branch handles both original numbers AND strings successfully converted to numbers.
    const protoNum = protoValue;

    // If it's TCP (6) or UDP (17), try to infer a more specific application protocol from ports
    if (protoNum === 6 || protoNum === 17) {
      const portsToCheck = [dstPort, srcPort].filter(p => p !== undefined && p !== null);

      for (const port of portsToCheck) {
        if (port && APP_PROTOCOL_PORTS[port]) { // Check if this port has any application mapping
          if (protoNum === 6 && APP_PROTOCOL_PORTS[port].tcp) {
            return APP_PROTOCOL_PORTS[port].tcp as string; // Found a TCP application protocol for this port
          }
          if (protoNum === 17 && APP_PROTOCOL_PORTS[port].udp) {
            return APP_PROTOCOL_PORTS[port].udp as string; // Found a UDP application protocol for this port
          }
        }
      }
      // If no specific application protocol was found via ports, fall back to the transport protocol name (TCP or UDP)
      return IP_PROTOCOL_NUMBERS[protoNum] || `Unknown (${protoNum})`;
    }

    // For other IP protocol numbers (e.g., 1 for ICMP, 47 for GRE, 88 for EIGRP, 89 for OSPF)
    // These do not rely on port numbers for their basic identification.
    return IP_PROTOCOL_NUMBERS[protoNum] || `Unknown (${protoNum})`;

  } else {
    // This branch is only reached if 'protocol' was originally a non-numeric string
    // (e.g., "ICMP" if the backend already provided it as a string, or any other non-numeric string).
    // In such cases, we simply return the string itself.
    // This handles scenarios where the data source might already provide a human-readable string directly.
    return protoValue; // e.g., "ICMP", "UNKNOWN_PROTOCOL_AS_STRING" etc.
  }
};