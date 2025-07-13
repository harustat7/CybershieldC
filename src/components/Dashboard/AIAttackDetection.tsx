import React, { useEffect, useState, useRef } from 'react';
import { Brain, Shield, AlertTriangle, Flag } from 'lucide-react';
import { NetworkPacket } from '../../types';
import { useSupabasePackets } from '../../hooks/useSupabasePackets';
import AttackTypeDropdown from '../Common/AttackTypeDropdown';


/**
 * A helper function to map the raw attack_type and label from a packet
 * to a user-friendly display string, based on the provided business logic.
 * @param {NetworkPacket | null} packet The network packet to analyze.
 * @returns {string} The human-readable attack label.
 */
const getAttackLabelString = (packet: NetworkPacket): string => {
  console.log("PACKET DEBUG:", packet);

  // Guard clause for when there is no packet data.
  if (!packet || !packet.attack_type) {
    // If there's no attack type, just return the raw label if it exists.
    return packet?.attack_type?.toString() || 'Analyzing...';
  }


  // Ensure the label is treated as a number for the switch cases.
  const labelNumber = Number(packet.label);


  switch (packet.attack_type) {
    case 'APT':
      switch (labelNumber) {
        case 0: return 'Data Exfiltration';
        case 1: return 'Initial Compromise';
        case 2: return 'Lateral Movement';
        case 3: return 'Normal Traffic';
        case 4: return 'Pivoting';
        case 5: return 'Reconnaissance';
        default: return `Unknown APT (${packet.attack_type})`;
      }
    case 'DOS':
      switch (labelNumber) {
        case 0: return 'Normal Traffic';
        case 1: return 'DDOS DNS';
        case 2: return 'DDOS MSSQL';
        case 3: return 'DDOS NTP';
        case 4: return 'DDOS SSDP';
        case 5: return 'DOS Syn';
        default: return `Unknown DOS (${packet.attack_type})`;
      }
    // Fallback for any other attack_type or if the label is already a word like "Normal".
    default:
      return packet.attack_type.toString();
  }
};


const formatTimeHHMMSS = (dateTimeString: string | null) => {
  if (!dateTimeString) return 'N/A';
  if (/^\d{2}:\d{2}:\d{2}$/.test(dateTimeString)) return dateTimeString;
  
  try {
    // If it's date+time, extract time part without any timezone conversion
    const d = new Date(dateTimeString);
    if (!isNaN(d.getTime())) {
      // Get the time part directly from the original string to avoid timezone conversion
      const timeMatch = dateTimeString.match(/(\d{2}:\d{2}:\d{2})/);
      if (timeMatch) {
        return timeMatch[1];
      }
      // Fallback: use UTC time to avoid timezone conversion
      const utcTime = d.getUTCHours().toString().padStart(2, '0') + ':' +
                     d.getUTCMinutes().toString().padStart(2, '0') + ':' +
                     d.getUTCSeconds().toString().padStart(2, '0');
      return utcTime;
    }
    
    // Fallback: try splitting by space or T
    const parts = dateTimeString.split(/[ T]/);
    if (parts.length > 1 && /^\d{2}:\d{2}:\d{2}/.test(parts[1])) {
      return parts[1].slice(0, 8);
    }
  } catch (error) {
    console.warn('Error parsing time:', dateTimeString, error);
  }
  
  return dateTimeString;
};


const AIAttackDetection: React.FC = () => {
  // This hook correctly fetches the single latest packet.
  const { packets, loading, error } = useSupabasePackets(1, true);
 
  const [currentPacket, setCurrentPacket] = useState<NetworkPacket | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [flagged, setFlagged] = useState(false);
 
  const lastPacketId = useRef<number | null>(null);


  // This effect correctly updates the view only when a new, unique packet arrives.
  useEffect(() => {
    if (packets.length > 0) {
      const latestPacket = packets[0];
      if (latestPacket.id !== lastPacketId.current) {
        setCurrentPacket(latestPacket);
        lastPacketId.current = latestPacket.id;
        setFlagged(false);
        setIsUpdating(true);
        const timer = setTimeout(() => setIsUpdating(false), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [packets]);




  if (loading && !currentPacket) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading detection...</p>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Failed to load</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }


  if (!currentPacket) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Waiting for packet data...</p>
          <p className="text-gray-500 text-sm mt-2">Start traffic monitoring to see predictions</p>
        </div>
      </div>
    );
  }


  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 h-full transition-all duration-500 ${
      isUpdating ? 'ring-2 ring-cyan-500/50' : ''
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Attack Detection</h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Last updated</p>
          <p className="text-sm text-cyan-400 font-mono">{formatTimeHHMMSS(currentPacket.time)}</p>
        </div>
      </div>


      <div className="space-y-6">
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">Current Packet Analysis</h3>
          </div>
          <div className="space-y-3">
            <div>
              {/* ==================================================================== */}
              {/* THIS IS THE ONLY PART OF THE UI THAT HAS BEEN CHANGED             */}
              {/* It now calls the helper function to get the correct display string. */}
              {/* ==================================================================== */}
              <p className="text-white font-semibold text-lg mb-1">
                {getAttackLabelString(currentPacket)}
              </p>
              <div>Label: {currentPacket?.label ?? 'N/A'}</div>
             
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 mt-2">
                <div><span className="font-semibold text-gray-400">Protocol:</span> {currentPacket.protocol}</div>
                <div><span className="font-semibold text-gray-400">Time:</span> {formatTimeHHMMSS(currentPacket.time)}</div>
                <div><span className="font-semibold text-gray-400">Source IP:</span> {currentPacket.sourceIP}:{currentPacket.srcPort}</div>
                <div><span className="font-semibold text-gray-400">Destination IP:</span> {currentPacket.destinationIP}:{currentPacket.dstPort}</div>
                <div><span className="font-semibold text-gray-400">Flow Duration:</span> {currentPacket.flowDuration} ms</div>
                <div><span className="font-semibold text-gray-400">Packet ID:</span> {currentPacket.id}</div>
              </div>
              <div className="mt-3 text-xs text-gray-400 italic">
                {currentPacket.label && (currentPacket.label.toLowerCase().includes('normal') || currentPacket.label === '3')
                  ? 'Normal network traffic detected. No threats identified in this packet.'
                  : 'Malicious activity detected! This packet contains attack patterns and should be blocked.'
                }
              </div>
            </div>
          </div>
        </div>
       
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30 flex items-center space-x-4">
          <div className="flex-1 text-gray-400 text-sm">
            If you think this analysis is incorrect, you can flag it for review.
          </div>
          <AttackTypeDropdown
            packetId={currentPacket.id.toString()}
            onFlag={() => setFlagged(true)}
            disabled={flagged}
            size="md"
          />
          {flagged && (
            <span className="text-green-400 text-sm flex items-center space-x-1"><Flag className="w-4 h-4 mr-1" />Flagged!</span>
          )}
        </div>
      </div>
    </div>
  );
};


export default AIAttackDetection;