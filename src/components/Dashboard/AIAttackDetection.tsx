import React, { useEffect, useState, useRef } from 'react';
import { Brain, Shield, AlertTriangle, TrendingUp, Flag, Activity } from 'lucide-react';
import { NetworkPacket } from '../../types';
import { useSupabasePackets } from '../../hooks/useSupabasePackets';
import AttackTypeDropdown from '../Common/AttackTypeDropdown';

const AIAttackDetection: React.FC = () => {
  const { packets, loading, error } = useSupabasePackets(1, true); // Get only the latest packet
  const [currentPacket, setCurrentPacket] = useState<NetworkPacket | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  // Add state for flagging
  const [flagged, setFlagged] = useState(false);
  const handleFlagAttack = () => {
    setFlagged(true);
    // Optionally, send flag to backend or update state
  };

  // Track if this is the first mount
  const isFirstMount = useRef(true);

  // On initial mount, always clear currentPacket and store the initial packet id
  const initialPacketId = useRef<number | null>(null);
  useEffect(() => {
    setCurrentPacket(null);
    initialPacketId.current = packets.length > 0 ? packets[0].id : null;
    lastPacketId.current = null;
  }, []);

  // Track the last seen packet id
  const lastPacketId = useRef<number | null>(null);

  // Update current packet only when a new packet arrives after mount
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (packets.length > 0) {
      const latestPacket = packets[0];
      // Only set currentPacket if it's a new packet after initial mount
      if (
        (initialPacketId.current === null && lastPacketId.current !== latestPacket.id) ||
        (initialPacketId.current !== null && latestPacket.id !== initialPacketId.current && lastPacketId.current !== latestPacket.id)
      ) {
        setCurrentPacket(latestPacket);
        lastPacketId.current = latestPacket.id;
        setIsUpdating(true);
        const timer = setTimeout(() => setIsUpdating(false), 1000);
        return () => clearTimeout(timer);
      }
    } else {
      setCurrentPacket(null);
      lastPacketId.current = null;
    }
  }, [packets]);

  // Convert packet status to threat level
  // const getThreatLevel = (status: NetworkPacket['label']): 'Low' | 'Medium' | 'High' | 'Critical' => {
  //   switch (status) {
  //     case 'normal':
  //       return 'Low';
  //     case 'suspicious':
  //       return 'Medium';
  //     case 'malicious':
  //       return 'Critical';
  //     default:
  //       return 'Low';
  //   }
  // };

  // Get attack description based on status
  // const getAttackDescription = (status: NetworkPacket['status']): string => {
  //   switch (status) {
  //     case 'normal':
  //       return 'Normal network traffic detected. No threats identified in this packet.';
  //     case 'suspicious':
  //       return 'Suspicious activity detected. This packet shows unusual patterns that require monitoring.';
  //     case 'malicious':
  //       return 'Malicious activity detected! This packet contains attack patterns and should be blocked.';
  //     default:
  //       return 'Analyzing packet for potential threats...';
  //   }
  // };

  // Get confidence score based on status (simulated)
  // const getConfidenceScore = (status: NetworkPacket['label']): number => {
  //   switch (status) {
  //     case 'normal':
  //       return Math.floor(Math.random() * 20) + 80; // 80-99%
  //     case 'suspicious':
  //       return Math.floor(Math.random() * 30) + 60; // 60-89%
  //     case 'malicious':
  //       return Math.floor(Math.random() * 15) + 85; // 85-99%
  //     default:
  //       return 50;
  //   }
  // };

  // const getThreatLevelColor = (level: 'Low' | 'Medium' | 'High' | 'Critical') => {
  //   switch (level) {
  //     case 'Low':
  //       return 'text-green-400 bg-green-500/10 border-green-500/20';
  //     case 'Medium':
  //       return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  //     case 'High':
  //       return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  //     case 'Critical':
  //       return 'text-red-400 bg-red-500/10 border-red-500/20';
  //     default:
  //       return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  //   }
  // };

  // const getThreatIcon = (level: 'Low' | 'Medium' | 'High' | 'Critical') => {
  //   switch (level) {
  //     case 'Low':
  //       return <Shield className="w-5 h-5" />;
  //     case 'Medium':
  //     case 'High':
  //       return <AlertTriangle className="w-5 h-5" />;
  //     case 'Critical':
  //       return <AlertTriangle className="w-5 h-5 animate-pulse" />;
  //     default:
  //       return <Shield className="w-5 h-5" />;
  //   }
  // };

  if (loading && !currentPacket) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading AI detection from Supabase...</p>
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

  // const threatLevel = getThreatLevel(currentPacket.status);
  // const confidence = getConfidenceScore(currentPacket.status);

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
            {/* <p className="text-sm text-gray-400">Real-time packet analysis</p> */}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Last updated</p>
          <p className="text-sm text-cyan-400 font-mono">{currentPacket.time ?? 'N/A'}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Threat */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">Current Packet Analysis</h3>
            {/* Flag Attack Button removed, replaced with dropdown below */}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-white font-semibold text-lg mb-1">
                {currentPacket.label ? (
                  <>
                    {currentPacket.label.charAt(0).toUpperCase() + currentPacket.label.slice(1)}
                    {currentPacket.label.toLowerCase().includes('normal') ? ' (Normal Traffic)' : ''}
                    {currentPacket.label.toLowerCase().includes('malicious') ? ' (Malicious Activity Detected)' : ''}
                    {currentPacket.label.toLowerCase().includes('suspicious') ? ' (Suspicious Activity)' : ''}
                  </>
                ) : 'Unknown Traffic'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 mt-2">
                <div><span className="font-semibold text-gray-400">Protocol:</span> {currentPacket.protocol}</div>
                <div><span className="font-semibold text-gray-400">Time:</span> {currentPacket.time ?? 'N/A'}</div>
                <div><span className="font-semibold text-gray-400">Source IP:</span> {currentPacket.sourceIP}:{currentPacket.srcPort}</div>
                <div><span className="font-semibold text-gray-400">Destination IP:</span> {currentPacket.destinationIP}:{currentPacket.dstPort}</div>
                <div><span className="font-semibold text-gray-400">Flow Duration:</span> {currentPacket.flowDuration} ms</div>
                <div><span className="font-semibold text-gray-400">Packet ID:</span> {currentPacket.id}</div>
              </div>
              <div className="mt-3 text-xs text-gray-400 italic">
                {currentPacket.label && currentPacket.label.toLowerCase().includes('malicious') && (
                  'Malicious activity detected! This packet contains attack patterns and should be blocked.'
                )}
                {currentPacket.label && currentPacket.label.toLowerCase().includes('suspicious') && (
                  'Suspicious activity detected. This packet shows unusual patterns that require monitoring.'
                )}
                {currentPacket.label && currentPacket.label.toLowerCase().includes('normal') && (
                  'Normal network traffic detected. No threats identified in this packet.'
                )}
                {!currentPacket.label && 'Analyzing packet for potential threats...'}
              </div>
            </div>
          </div>
        </div>
        {/* AttackTypeDropdown for flagging */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30 flex items-center space-x-4">
          <div className="flex-1 text-gray-400 text-sm">
            If you think this analysis is incorrect, you can flag it for review.
          </div>
          <AttackTypeDropdown
            packetId={currentPacket.id.toString()}
            onFlag={(attackType) => {
              setFlagged(true);
              // Optionally, send flag to backend or update state
            }}
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