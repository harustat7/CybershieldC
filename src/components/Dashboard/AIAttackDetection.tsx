import React, { useEffect, useState } from 'react';
import { Brain, Shield, AlertTriangle, TrendingUp, Flag, Activity } from 'lucide-react';
import { AttackDetection, FlagRequest, NetworkPacket } from '../../types';
import { useRealTimeAttackDetection } from '../../hooks/useRealTimeData';
import { useRealTimePackets } from '../../hooks/useRealTimeData';
import { ApiService } from '../../services/api';
import AttackTypeDropdown from '../Common/AttackTypeDropdown';

const AIAttackDetection: React.FC = () => {
  const detection = useRealTimeAttackDetection();
  const [packets] = useRealTimePackets(10, true); // Show 10 recent packets
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (detection) {
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [detection]);

  const handleFlagDetection = async (attackType: string) => {
    if (!detection) return;

    try {
      const flagData: FlagRequest = {
        packetId: detection.id,
        attackType,
        originalPrediction: detection.type,
        confidence: detection.confidence,
        timestamp: detection.timestamp,
        sourceIP: '0.0.0.0', // AI detection doesn't have specific source IP
        destinationIP: '0.0.0.0',
        protocol: 'AI_DETECTION',
        port: 0
      };

      await ApiService.flagPacket(flagData);
      console.log('AI detection flagged successfully');
    } catch (error) {
      console.error('Failed to flag AI detection:', error);
    }
  };

  const handleFlagPacket = async (packet: NetworkPacket, attackType: string) => {
    try {
      const flagData: FlagRequest = {
        packetId: packet.id,
        attackType,
        originalPrediction: packet.status,
        timestamp: packet.timestamp,
        sourceIP: packet.sourceIP,
        destinationIP: packet.destinationIP,
        protocol: packet.protocol,
        port: packet.port
      };

      await ApiService.flagPacket(flagData);
      console.log('Packet flagged successfully');
    } catch (error) {
      console.error('Failed to flag packet:', error);
    }
  };

  const getThreatLevelColor = (level: AttackDetection['threatLevel']) => {
    switch (level) {
      case 'Low':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'Medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'High':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'Critical':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getThreatIcon = (level: AttackDetection['threatLevel']) => {
    switch (level) {
      case 'Low':
        return <Shield className="w-5 h-5" />;
      case 'Medium':
      case 'High':
        return <AlertTriangle className="w-5 h-5" />;
      case 'Critical':
        return <AlertTriangle className="w-5 h-5 animate-pulse" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: NetworkPacket['status']) => {
    switch (status) {
      case 'normal':
        return 'text-green-400';
      case 'suspicious':
        return 'text-yellow-400';
      case 'malicious':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBg = (status: NetworkPacket['status']) => {
    switch (status) {
      case 'normal':
        return 'bg-green-500/10 border-green-500/20';
      case 'suspicious':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'malicious':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  if (!detection) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing AI detection...</p>
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
            <h2 className="text-lg font-semibold text-white">AI Attack Detection</h2>
            <p className="text-sm text-gray-400">Neural network analysis</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Last updated</p>
          <p className="text-sm text-cyan-400 font-mono">{detection.timestamp}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Threat */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">Current Threat</h3>
            <span className={`inline-flex items-center px-3 py-1 text-sm rounded-full border ${getThreatLevelColor(detection.threatLevel)}`}>
              {getThreatIcon(detection.threatLevel)}
              <span className="ml-1.5">{detection.threatLevel}</span>
            </span>
          </div>
          <p className="text-white font-semibold text-lg mb-2">{detection.type}</p>
          <p className="text-gray-400 text-sm mb-4">{detection.description}</p>
          
          {/* Flag Detection Section */}
          <div className="border-t border-gray-700/50 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flag className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-gray-300 font-medium">Flag Detection:</span>
              </div>
              <AttackTypeDropdown
                packetId={detection.id}
                currentFlag={detection.userFlagged?.attackType}
                onFlag={handleFlagDetection}
                size="md"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Help improve AI accuracy by flagging this detection with the correct attack type
            </p>
          </div>
        </div>

        {/* AI Confidence */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">AI Confidence</h3>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-gray-700/50 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-1000 relative"
                style={{ width: `${detection.confidence}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
              </div>
            </div>
            <span className="text-lg font-bold text-cyan-400">{detection.confidence}%</span>
          </div>
        </div>

        {/* Packet Analysis Results */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-medium text-gray-300">Packet Analysis Results</h3>
            </div>
            <span className="text-xs text-gray-400">Live analysis</span>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-gray-800/30 scrollbar-thumb-gray-600/50">
            {packets.map((packet, index) => (
              <div
                key={packet.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  index === 0 ? 'bg-cyan-500/5 border-cyan-500/20 animate-pulse' : 'bg-gray-700/20 border-gray-700/30'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className={`inline-flex items-center px-2 py-1 text-xs rounded border ${getStatusBg(packet.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusColor(packet.status)}`}></span>
                    <span className={getStatusColor(packet.status)}>{packet.status}</span>
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-300 font-mono truncate">{packet.sourceIP}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-gray-300 font-mono truncate">{packet.destinationIP}</span>
                      <span className="text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded">{packet.protocol}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Port {packet.port} • {packet.packetSize}B • {packet.timestamp}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-2">
                  <span className={`px-2 py-1 text-xs rounded border ${
                    packet.action === 'Allow' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {packet.action}
                  </span>
                  
                  <AttackTypeDropdown
                    packetId={packet.id}
                    currentFlag={packet.userFlagged?.attackType}
                    onFlag={(attackType) => handleFlagPacket(packet, attackType)}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-xs text-gray-400 text-center">
            Showing {packets.length} recent packets • Updates in real-time
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAttackDetection;