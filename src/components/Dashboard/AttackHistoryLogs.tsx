// import React, { useState } from 'react';
// import { History, Search, Filter, Clock, Server, AlertCircle } from 'lucide-react';
// import { useSupabasePackets } from '../../hooks/useSupabasePackets';

// const formatTimeHHMMSS = (dateTimeString: string | null) => {
//   if (!dateTimeString) return 'N/A';
//   // If it's already HH:MM:SS, return as is
//   if (/^\d{2}:\d{2}:\d{2}$/.test(dateTimeString)) return dateTimeString;
  
//   try {
//     // If it's date+time, extract time part without any timezone conversion
//     const d = new Date(dateTimeString);
//     if (!isNaN(d.getTime())) {
//       // Get the time part directly from the original string to avoid timezone conversion
//       const timeMatch = dateTimeString.match(/(\d{2}:\d{2}:\d{2})/);
//       if (timeMatch) {
//         return timeMatch[1];
//       }
//       // Fallback: use UTC time to avoid timezone conversion
//       const utcTime = d.getUTCHours().toString().padStart(2, '0') + ':' +
//                      d.getUTCMinutes().toString().padStart(2, '0') + ':' +
//                      d.getUTCSeconds().toString().padStart(2, '0');
//       return utcTime;
//     }
    
//     // Fallback: try splitting by space or T
//     const parts = dateTimeString.split(/[ T]/);
//     if (parts.length > 1 && /^\d{2}:\d{2}:\d{2}/.test(parts[1])) {
//       return parts[1].slice(0, 8);
//     }
//   } catch (error) {
//     console.warn('Error parsing time:', dateTimeString, error);
//   }
  
//   return dateTimeString;
// };

// const AttackHistoryLogs: React.FC = () => {
//   // Fetch up to 500 packets (adjust as needed)
//   const { packets, loading, error } = useSupabasePackets(500, true);
//   const [searchTerm, setSearchTerm] = useState('');

//   // Filter for last 24 hours
//   const now = new Date();
//   const last24hPackets = packets.filter(p => {
//     if (!packet.time) return false;
//     const packetTime = new Date(`1970-01-01T${packet.time.length === 8 ? packet.time : packet.time.split('.')[0]}`); // fallback for HH:MM:SS
//     return now.getTime() - packetTime.getTime() < 24 * 60 * 60 * 1000;
//   });

//   // Search by label, source, dest, protocol, etc.
//   const filteredPackets = last24hPackets.filter(p => {
//     const search = searchTerm.toLowerCase();
//     return (
//       (packet.label || '').toLowerCase().includes(search) ||
//       packet.sourceIpacket.includes(search) ||
//       packet.destinationIpacket.includes(search) ||
//       packet.protocol.toLowerCase().includes(search)
//     );
//   });

//   return (
//     <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center space-x-3">
//           <div className="flex items-center justify-center w-10 h-10 bg-orange-500/10 rounded-lg border border-orange-500/20">
//             <History className="w-5 h-5 text-orange-400" />
//           </div>
//           <div>
//             <h2 className="text-lg font-semibold text-white">Attack History Logs</h2>
//             {/* <p className="text-sm text-gray-400">Security incident timeline (last 24 hours)</p> */}
//           </div>
//         </div>
//         <div className="text-right">
//           <p className="text-sm text-white font-medium">{filteredPackets.length} packets</p>
//           <p className="text-xs text-gray-400">Last 24 hours</p>
//         </div>
//       </div>

//       {/* Search */}
//       <div className="flex flex-col sm:flex-row gap-4 mb-6">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search label, IP, protocol..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors text-sm"
//           />
//         </div>
//       </div>

//       {/* Table of packets */}
//       <div className="overflow-x-auto scrollbar-thin scrollbar-track-gray-800/30 scrollbar-thumb-gray-600/50">
//         <table className="w-full text-sm min-w-[900px]">
//           <thead>
//             <tr className="border-b border-gray-700/50">
//               <th className="py-2 px-3 text-gray-300 font-medium">Time</th>
//               <th className="py-2 px-3 text-gray-300 font-medium">Source IP</th>
//               <th className="py-2 px-3 text-gray-300 font-medium">Dest IP</th>
//               <th className="py-2 px-3 text-gray-300 font-medium">Protocol</th>
//               <th className="py-2 px-3 text-gray-300 font-medium">Flow Duration</th>
//               <th className="py-2 px-3 text-gray-300 font-medium">Src Port</th>
//               <th className="py-2 px-3 text-gray-300 font-medium">Dst Port</th>
//               <th className="py-2 px-3 text-gray-300 font-medium">Label</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-700/30">
//             {loading ? (
//               <tr><td colSpan={8} className="py-8 text-center text-gray-400">Loading...</td></tr>
//             ) : error ? (
//               <tr><td colSpan={8} className="py-8 text-center text-red-400">{error}</td></tr>
//             ) : filteredPackets.length === 0 ? (
//               <tr><td colSpan={8} className="py-8 text-center text-gray-400">No packets found</td></tr>
//             ) : (
//               filteredPackets.map((p) => (
//                 <tr key={packet.id} className="hover:bg-gray-800/30 transition-colors">
//                   <td className="py-2 px-3 text-cyan-400 font-mono whitespace-nowrap">{formatTimeHHMMSS(packet.time)}</td>
//                   <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{packet.sourceIP}</td>
//                   <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{packet.destinationIP}</td>
//                   <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{packet.protocol}</td>
//                   <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{packet.flowDuration}</td>
//                   <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{packet.srcPort}</td>
//                   <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{packet.dstPort}</td>
//                   <td className="py-2 px-3 text-orange-400 font-mono whitespace-nowrap">{packet.label ?? 'N/A'}</td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };


// import React, { useState, useMemo } from 'react';
// import { History, Search } from 'lucide-react';
// import { useSupabasePackets } from '../../hooks/useSupabasePackets'; // Make sure this path is correct

// // --- START: Required Imports for Feature Parity with LogsPage ---
// // These imports are assumed to be correct and exist at these paths in your project.
// import { NetworkPacket, SupabasePacket } from '../../types/index'; // Keep NetworkPacket and SupabasePacket
// import { getProtocolName } from '../../services/protocolMapping'; // Re-introduce
// import { getAttackLabelString } from '../../services/labelMapping'; // Re-introduce
// import AttackTypeDropdown from '../Common/AttackTypeDropdown'; // Still needed
// // --- END: Required Imports ---

// // Helper function to format time (remains unchanged)
// const formatTimeHHMMSS = (dateTimeString: string | null) => {
//   if (!dateTimeString) return 'N/A';
//   if (/^\d{2}:\d{2}:\d{2}$/.test(dateTimeString)) return dateTimeString;
  
//   try {
//     const d = new Date(dateTimeString);
//     if (!isNaN(d.getTime())) {
//       const timeMatch = dateTimeString.match(/(\d{2}:\d{2}:\d{2})/);
//       if (timeMatch) {
//         return timeMatch[1];
//       }
//       const utcTime = d.getUTCHours().toString().padStart(2, '0') + ':' +
//                      d.getUTCMinutes().toString().padStart(2, '0') + ':' +
//                      d.getUTCSeconds().toString().padStart(2, '0');
//       return utcTime;
//     }
    
//     const parts = dateTimeString.split(/[ T]/);
//     if (parts.length > 1 && /^\d{2}:\d{2}:\d{2}/.test(parts[1])) {
//       return parts[1].slice(0, 8);
//     }
//   } catch (error) {
//     console.warn('Error parsing time in AttackHistoryLogs:', dateTimeString, error);
//   }
  
//   return dateTimeString;
// };

// const AttackHistoryLogs: React.FC = () => {
//   // Fetch packets from Supabase. We assume useSupabasePackets returns NetworkPacket[]
//   // but we know its internal transformation is partial for protocol and label.
//   const { packets: rawPacketsFromHook, loading, error } = useSupabasePackets(500, true);
//   const [searchTerm, setSearchTerm] = useState('');

//   // --- START: Corrected Data Transformation Logic in AttackHistoryLogs.tsx ---
//   /**
//    * Helper to determine status based on the *mapped* label string.
//    */
//   const getStatus = (mappedLabel: string | null): 'normal' | 'suspicious' | 'malicious' => {
//     if (!mappedLabel) return 'normal';
//     const l = mappedLabel.toLowerCase();
//     if (l.includes('normal traffic') || l.includes('normal') || l.includes('benign')) return 'normal';
//     if (l.includes('dns flood') || l.includes('ddos') || l.includes('syn flood') || l.includes('attack') || l.includes('drdos')) return 'malicious';
//     if (l.includes('apt') || l.includes('compromise') || l.includes('exfiltration') || l.includes('movement') || l.includes('pivoting') || l.includes('reconnaissance') || l.includes('suspicious')) return 'suspicious';
//     return 'normal';
//   };

//   /**
//    * Helper function to safely convert any value to a number, defaulting to 0 if NaN.
//    * This handles null, undefined, and non-numeric strings that would otherwise result in NaN.
//    */
//   const safeNumber = (value: any): number => {
//     const num = Number(value);
//     return isNaN(num) ? 0 : num;
//   };

//   /**
//    * Re-transforms the NetworkPacket received from useSupabasePackets to ensure
//    * protocol and label are correctly mapped for display.
//    * This handles the partial transformation done by useSupabasePackets.
//    */
//   const transformForDisplay = (packetFromHook: NetworkPacket): NetworkPacket => {
//     // Re-apply protocol mapping based on the (potentially uppercase string or number) protocol
//     // and correctly extract ports as numbers (they might still be numbers or strings after hook's transformation)
//     const protocolForMapping = safeNumber(packetFromHook.protocol); // getProtocolName expects number or string
//     const srcPortForMapping = safeNumber(packetFromHook.srcPort);
//     const dstPortForMapping = safeNumber(packetFromHook.dstPort);

//     const reMappedProtocol = getProtocolName(protocolForMapping, srcPortForMapping, dstPortForMapping);
    
//     // Re-apply label mapping, assuming packetFromHook.label is still the raw number from DB
//     // or the string "Normal (APT Context)" etc. from hook's partial mapping.
//     // We pass null for attack_type here since it's not available in the NetworkPacket itself.
//     // If attack_type is critical for label mapping, use `packetFromHook.attack_type` if available.
//     const reMappedLabel = getAttackLabelString(packetFromHook.attack_type || null, packetFromHook.label);

//     // Ensure numerical fields are safe in case hook's transformation was also partial/incorrect for NaNs
//     const safeFlowDuration = safeNumber(packetFromHook.flowDuration);

//     return {
//       ...packetFromHook, // Keep all other properties as is
//       protocol: reMappedProtocol, // Use the correctly re-mapped protocol
//       label: reMappedLabel,       // Use the correctly re-mapped label
//       flowDuration: safeFlowDuration, // Ensure numerical safety
//       srcPort: srcPortForMapping, // Ensure numerical safety
//       dstPort: dstPortForMapping, // Ensure numerical safety
//       status: getStatus(reMappedLabel), // Re-derive status based on the final label
//     };
//   };

//   // Memoize the final transformed packets for display
//   const transformedPackets: NetworkPacket[] = useMemo(() => {
//     // rawPacketsFromHook are the NetworkPacket[] as returned by useSupabasePackets.
//     return rawPacketsFromHook.map(transformForDisplay);
//   }, [rawPacketsFromHook]);
//   // --- END: Corrected Data Transformation Logic ---


//   // Filter for last 24 hours (remains unchanged)
//   const now = new Date();
//   const last24hPackets = transformedPackets.filter(p => {
//     if (!p.time) return false;
//     const packetDate = new Date(p.time);
//     return !isNaN(packetDate.getTime()) && (now.getTime() - packetDate.getTime() < 24 * 60 * 60 * 1000);
//   });

//   // Search by mapped label, source, dest, mapped protocol, etc. (remains unchanged)
//   const filteredPackets = last24hPackets.filter(p => {
//     const search = searchTerm.toLowerCase();
//     return (
//       (p.label || '').toLowerCase().includes(search) ||
//       (p.sourceIP || '').toLowerCase().includes(search) ||
//       (p.destinationIP || '').toLowerCase().includes(search) ||
//       (p.protocol || '').toLowerCase().includes(search)
//     );
//   });

//   return (
//     <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center space-x-3">
//           <div className="flex items-center justify-center w-10 h-10 bg-orange-500/10 rounded-lg border border-orange-500/20">
//             <History className="w-5 h-5 text-orange-400" />
//           </div>
//           <div>
//             <h2 className="text-lg font-semibold text-white">Attack History Logs</h2>
//           </div>
//         </div>
//         <div className="text-right">
//           <p className="text-sm text-white font-medium">{filteredPackets.length} flows</p>
//           <p className="text-xs text-gray-400">Last 24 hours</p>
//         </div>
//       </div>

//       {/* Search Bar (remains unchanged) */}
//       <div className="flex flex-col sm:flex-row gap-4 mb-6">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search label, IP, protocol..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors text-sm"
//           />
//         </div>
//       </div>

//       {/* Table of packets/flows (remains unchanged in structure) */}
//       <div className="overflow-x-auto scrollbar-thin scrollbar-track-gray-800/30 scrollbar-thumb-gray-600/50">
//         <table className="w-full text-sm min-w-[900px]">
//           <thead>
//             <tr className="border-b border-gray-700/50">
//               <th className="py-2 px-3 text-gray-300 font-medium text-left">Time</th>
//               <th className="py-2 px-3 text-gray-300 font-medium text-left">Source IP</th>
//               <th className="py-2 px-3 text-gray-300 font-medium text-left">Dest IP</th>
//               <th className="py-2 px-3 text-gray-300 font-medium text-left">Protocol</th>
//               <th className="py-2 px-3 text-gray-300 font-medium text-left">Flow Duration</th>
//               <th className="py-2 px-3 text-gray-300 font-medium text-left">Src Port</th>
//               <th className="py-2 px-3 text-gray-300 font-medium text-left">Dst Port</th>
//               <th className="py-2 px-3 text-gray-300 font-medium text-left">Label</th>
//               <th className="py-2 px-3 text-gray-300 font-medium text-left">Flag</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-700/30">
//             {loading ? (
//               <tr><td colSpan={9} className="py-8 text-center text-gray-400">Loading...</td></tr>
//             ) : error ? (
//               <tr><td colSpan={9} className="py-8 text-center text-red-400">{error}</td></tr>
//             ) : filteredPackets.length === 0 ? (
//               <tr><td colSpan={9} className="py-8 text-center text-gray-400">No flows found</td></tr>
//             ) : (
//               filteredPackets.map((p) => (
//                 <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
//                   <td className="py-2 px-3 text-cyan-400 font-mono whitespace-nowrap">{formatTimeHHMMSS(p.time)}</td>
//                   <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.sourceIP}</td>
//                   <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.destinationIP}</td>
//                   <td className="py-2 px-3 whitespace-nowrap">
//                     <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
//                       {p.protocol}
//                     </span>
//                   </td>
//                   <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.flowDuration}</td>
//                   <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.srcPort}</td>
//                   <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.dstPort}</td>
//                   <td className="py-2 px-3 whitespace-nowrap">
//                     <span className={`px-2 py-1 text-xs rounded border 
//                       ${p.status === 'malicious' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
//                       ${p.status === 'suspicious' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : ''}
//                       ${p.status === 'normal' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
//                     `}>
//                       {p.label ?? 'N/A'}
//                     </span>
//                   </td>
//                   <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">
//                     <AttackTypeDropdown 
//                       packetId={p.id.toString()}
//                       size="sm" 
//                       onFlag={(attackType) => {
//                         console.log(`Flagged packet ${p.id} as ${attackType}`);
//                         // Placeholder: Integrate your actual API call here to save the flag.
//                       }} 
//                     />
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default AttackHistoryLogs;



import React, { useState, useMemo } from 'react';
import { History, Search } from 'lucide-react';
import { useSupabasePackets } from '../../hooks/useSupabasePackets'; // Make sure this path is correct

// --- START: Required Imports for Feature Parity with LogsPage ---
// These imports are assumed to be correct and exist at these paths in your project.
import { NetworkPacket, SupabasePacket } from '../../types/index';
import { getProtocolName } from '../../services/protocolMapping';
import { getAttackLabelString } from '../../services/labelMapping';
import AttackTypeDropdown from '../Common/AttackTypeDropdown';
// --- END: Required Imports ---

// Helper function to format time (remains unchanged)
const formatTimeHHMMSS = (dateTimeString: string | null) => {
  if (!dateTimeString) return 'N/A';
  if (/^\d{2}:\d{2}:\d{2}$/.test(dateTimeString)) return dateTimeString;
  
  try {
    const d = new Date(dateTimeString);
    if (!isNaN(d.getTime())) {
      const timeMatch = dateTimeString.match(/(\d{2}:\d{2}:\d{2})/);
      if (timeMatch) {
        return timeMatch[1];
      }
      const utcTime = d.getUTCHours().toString().padStart(2, '0') + ':' +
                     d.getUTCMinutes().toString().padStart(2, '0') + ':' +
                     d.getUTCSeconds().toString().padStart(2, '0');
      return utcTime;
    }
    
    const parts = dateTimeString.split(/[ T]/);
    if (parts.length > 1 && /^\d{2}:\d{2}:\d{2}/.test(parts[1])) {
      return parts[1].slice(0, 8);
    }
  } catch (error) {
    console.warn('Error parsing time in AttackHistoryLogs:', dateTimeString, error);
  }
  
  return dateTimeString;
};

const AttackHistoryLogs: React.FC = () => {
  // Fetch packets from Supabase. We assume useSupabasePackets returns NetworkPacket[]
  const { packets: packetsFromHook, loading, error } = useSupabasePackets(500, true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- START: Corrected Data Transformation Logic in AttackHistoryLogs.tsx ---
  /**
   * Helper to determine status based on the *mapped* label string.
   */
  const getStatus = (mappedLabel: string | null): 'normal' | 'suspicious' | 'malicious' => {
    if (!mappedLabel) return 'normal';
    const l = mappedLabel.toLowerCase();
    if (l.includes('normal traffic') || l.includes('normal') || l.includes('benign')) return 'normal';
    if (l.includes('dns flood') || l.includes('ddos') || l.includes('syn flood') || l.includes('attack') || l.includes('drdos')) return 'malicious';
    if (l.includes('apt') || l.includes('compromise') || l.includes('exfiltration') || l.includes('movement') || l.includes('pivoting') || l.includes('reconnaissance') || l.includes('suspicious')) return 'suspicious';
    return 'normal';
  };

  /**
   * Helper function to safely convert any value to a number, defaulting to 0 if NaN.
   */
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  /**
   * Re-transforms the NetworkPacket received from useSupabasePackets to ensure
   * protocol and label are correctly mapped for display, and numerical fields are safe.
   */
  const transformForDisplay = (packetFromHook: NetworkPacket): NetworkPacket => {
    const protocolForMapping = safeNumber(packetFromHook.protocol);
    const srcPortForMapping = safeNumber(packetFromHook.srcPort);
    const dstPortForMapping = safeNumber(packetFromHook.dstPort);

    const reMappedProtocol = getProtocolName(protocolForMapping, srcPortForMapping, dstPortForMapping);
    
    const rawLabelValue = packetFromHook.label;
    const reMappedLabel = getAttackLabelString(packetFromHook.attack_type || null, rawLabelValue);

    const safeFlowDuration = safeNumber(packetFromHook.flowDuration);

    return {
      ...packetFromHook,
      protocol: reMappedProtocol,
      label: reMappedLabel,
      flowDuration: safeFlowDuration,
      srcPort: srcPortForMapping,
      dstPort: dstPortForMapping,
      status: getStatus(reMappedLabel),
    };
  };

  // Memoize the final transformed packets for display
  const transformedPackets: NetworkPacket[] = useMemo(() => {
    return packetsFromHook.map(transformForDisplay);
  }, [packetsFromHook]);
  // --- END: Corrected Data Transformation Logic ---


  // Filter for last 24 hours (remains unchanged)
  const now = new Date();
  const last24hPackets = transformedPackets.filter(p => {
    if (!p.time) return false;
    const packetDate = new Date(p.time);
    return !isNaN(packetDate.getTime()) && (now.getTime() - packetDate.getTime() < 24 * 60 * 60 * 1000);
  });

  // --- START: MODIFIED FILTERING LOGIC ---
  // Filter by search term AND exclude "Normal Traffic"
  const filteredPackets = last24hPackets.filter(p => {
    const search = searchTerm.toLowerCase();
    
    // Condition to exclude "Normal Traffic"
    const isNotNormalTraffic = (p.label || '').toLowerCase() !== 'normal traffic';

    // Search by mapped label, source, dest, mapped protocol, etc.
    const matchesSearchTerm = (
      (p.label || '').toLowerCase().includes(search) ||
      (p.sourceIP || '').toLowerCase().includes(search) ||
      (p.destinationIP || '').toLowerCase().includes(search) ||
      (p.protocol || '').toLowerCase().includes(search)
    );
    
    return isNotNormalTraffic && matchesSearchTerm;
  });
  // --- END: MODIFIED FILTERING LOGIC ---

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <History className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Attack History Logs</h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-white font-medium">{filteredPackets.length} flows</p>
          <p className="text-xs text-gray-400">Last 24 hours</p>
        </div>
      </div>

      {/* Search Bar (remains unchanged) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search label, IP, protocol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors text-sm"
          />
        </div>
      </div>

      {/* Table of packets/flows (remains unchanged in structure) */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-track-gray-800/30 scrollbar-thumb-gray-600/50">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="py-2 px-3 text-gray-300 font-medium text-left">Time</th>
              <th className="py-2 px-3 text-gray-300 font-medium text-left">Source IP</th>
              <th className="py-2 px-3 text-gray-300 font-medium text-left">Dest IP</th>
              <th className="py-2 px-3 text-gray-300 font-medium text-left">Protocol</th>
              <th className="py-2 px-3 text-gray-300 font-medium text-left">Flow Duration</th>
              <th className="py-2 px-3 text-gray-300 font-medium text-left">Src Port</th>
              <th className="py-2 px-3 text-gray-300 font-medium text-left">Dst Port</th>
              <th className="py-2 px-3 text-gray-300 font-medium text-left">Label</th>
              <th className="py-2 px-3 text-gray-300 font-medium text-left">Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {loading ? (
              <tr><td colSpan={9} className="py-8 text-center text-gray-400">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={9} className="py-8 text-center text-red-400">{error}</td></tr>
            ) : filteredPackets.length === 0 ? (
              <tr><td colSpan={9} className="py-8 text-center text-gray-400">No flows found</td></tr>
            ) : (
              filteredPackets.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-2 px-3 text-cyan-400 font-mono whitespace-nowrap">{formatTimeHHMMSS(p.time)}</td>
                  <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.sourceIP}</td>
                  <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.destinationIP}</td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                      {p.protocol}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.flowDuration}</td>
                  <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.srcPort}</td>
                  <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.dstPort}</td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded border 
                      ${p.status === 'malicious' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                      ${p.status === 'suspicious' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : ''}
                      ${p.status === 'normal' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                    `}>
                      {p.label ?? 'N/A'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">
                    <AttackTypeDropdown 
                      packetId={p.id.toString()} // Assuming packetId is the correct prop name for the dropdown
                      size="sm" 
                      onFlag={() => { // --- FIX: Explicitly type attackType as string ---
                        console.log(`Flagged packet ${p.id} uccessful. Refetching logs...`);
                        refetch();
                      }} 
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttackHistoryLogs;
