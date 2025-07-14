import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Wifi, Play, Square, Zap, Network, AlertCircle, ExternalLink, RefreshCw, Send, Upload, Settings, Monitor, Info, Database } from 'lucide-react';
import { NetworkPacket } from '../../types';
import { useSupabasePackets } from '../../hooks/useSupabasePackets';
import { UpdatedDemoTrafficApi } from '../../services/updatedDemoTrafficApi.ts';
import { LiveTrafficApi } from '../../services/liveTrafficApi';
import axios from 'axios';

// Add at the top, after imports
const formatTimeHHMMSS = (dateTimeString: string | null) => {
  if (!dateTimeString) return 'N/A';
  // If it's already HH:MM:SS, return as is
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

const LiveTrafficMonitor: React.FC = () => {
  const [isDemoTrafficLive, setIsDemoTrafficLive] = useState(false);
  const [isLiveTrafficLive, setIsLiveTrafficLive] = useState(false);
  const [isDemoApiConnected, setIsDemoApiConnected] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvFileExists, setCsvFileExists] = useState(false);
  const [isLiveMonitorApiConnected, setIsLiveMonitorApiConnected] = useState(false);
  const LIVE_MONITOR_API_URL = 'http://localhost:8000';
  
  // Add state to track when live traffic started
  const [liveTrafficStartTime, setLiveTrafficStartTime] = useState<Date | null>(null);
 
  // Live traffic specific states
  const [selectedInterface, setSelectedInterface] = useState('Wi-Fi');
  const [availableInterfaces, setAvailableInterfaces] = useState<string[]>(['Wi-Fi']);
  const [interfaceFriendlyNames, setInterfaceFriendlyNames] = useState<{ [key: string]: string }>({});
  const [batchSize, setBatchSize] = useState(100);
  const [liveTrafficStats, setLiveTrafficStats] = useState({
    packet_count: 0,
    flows_count: 0,
    uptime: 0
  });

  const isAnyTrafficActive = isDemoTrafficLive || isLiveTrafficLive;

  // Use Supabase packets instead of fake data
  const { packets, loading: packetsLoading, error: packetsError, refetch } = useSupabasePackets(25, isDemoTrafficLive || isLiveTrafficLive);

  // Filter packets based on live traffic start time
  const filteredPackets = useMemo(() => {
    if (!isLiveTrafficLive || !liveTrafficStartTime) {
      // If not live traffic, show all packets
      return packets;
    }
    // Filter packets to only show those from the last 4 minutes after live traffic started
    const fourMinutesAgo = new Date(liveTrafficStartTime.getTime() - 4 * 60 * 1000);
    return packets.filter(packet => {
      if (!packet.time) return false;
      try {
        const packetTime = new Date(packet.time);
        return packetTime >= fourMinutesAgo;
      } catch (error) {
        console.warn('Error parsing packet time:', packet.time, error);
        return false;
      }
    });
  }, [packets, isLiveTrafficLive, liveTrafficStartTime]);

  // Sort packets in descending order (newest to oldest) for proper display order
  const sortedFilteredPackets = useMemo(() => {
    return [...filteredPackets].sort((a, b) => {
      if (!a.time || !b.time) return 0;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });
  }, [filteredPackets]);

  // Show the most recent 25 packets at once
  const [visiblePackets, setVisiblePackets] = useState<NetworkPacket[]>([]);
  const [currentPacket, setCurrentPacket] = useState<NetworkPacket | null>(null);

  // Update visiblePackets and currentPacket when sortedFilteredPackets changes
  useEffect(() => {
    if (!isAnyTrafficActive) {
      setVisiblePackets([]);
      setCurrentPacket(null);
      return;
    }
    // Always limit to 25 packets maximum
    const latestPackets = sortedFilteredPackets.slice(0, 25);
    setVisiblePackets(latestPackets);
    setCurrentPacket(latestPackets.length > 0 ? latestPackets[0] : null);
  }, [sortedFilteredPackets, isAnyTrafficActive]);

  // Update current packet every 100ms to the latest (top) packet
  useEffect(() => {
    if (!visiblePackets.length) {
      setCurrentPacket(null);
      return;
    }
    const interval = setInterval(() => {
      setCurrentPacket(visiblePackets[0]); // Always show the top (newest) packet
    }, 100);
    return () => clearInterval(interval);
  }, [visiblePackets]);

  // Track the ID of the most recently added packet for animation
  const [newPacketId, setNewPacketId] = useState<number | null>(null);

  // When visiblePackets changes, highlight the newest packet
  useEffect(() => {
    if (visiblePackets.length > 0) {
      setNewPacketId(visiblePackets[0].id);
      const timeout = setTimeout(() => setNewPacketId(null), 1000); // Remove highlight after 1s
      return () => clearTimeout(timeout);
    }
  }, [visiblePackets]);


  // Check Live Monitor API health
  useEffect(() => {
    const checkLiveMonitorApiStatus = async () => {
      try {
        const response = await fetch(`${LIVE_MONITOR_API_URL}/`);
        setIsLiveMonitorApiConnected(response.ok);
      } catch (error) {
        setIsLiveMonitorApiConnected(false);
      }
    };
   
    checkLiveMonitorApiStatus();
    const intervalId = setInterval(checkLiveMonitorApiStatus, 5000);
    return () => clearInterval(intervalId);
  }, []);


  // Poll backend for live status
  useEffect(() => {
    let consecutiveFalseCount = 0;
    const pollStatus = async () => {
      try {
        const res = await axios.get('http://localhost:8000/status');
        console.log('[Frontend Poll] live_running:', res.data.live_running);
        if (res.data.live_running) {
          consecutiveFalseCount = 0;
          const wasNotLive = !isLiveTrafficLive;
          setIsLiveTrafficLive(true);
          // Only set start time if this is the first time we're detecting live traffic
          if (wasNotLive) {
            setLiveTrafficStartTime(new Date());
          }
        } else {
          consecutiveFalseCount++;
          if (consecutiveFalseCount >= 2) {
            setIsLiveTrafficLive(false);
            setLiveTrafficStartTime(null); // Reset start time if live traffic stops
          }
        }
      } catch (e) {
        console.log('[Frontend Poll] Error:', e);
        // Optionally increment false count on error
        consecutiveFalseCount++;
        if (consecutiveFalseCount >= 2) {
          setIsLiveTrafficLive(false);
          setLiveTrafficStartTime(null); // Reset start time on error
        }
      }
    };
    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [isLiveTrafficLive]);


  // Check demo API health and get network interfaces on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      const isHealthy = await UpdatedDemoTrafficApi.checkHealth();
      setIsDemoApiConnected(isHealthy);
     
      if (isHealthy) {
        // Get demo traffic status
        try {
          const demoStatus = await UpdatedDemoTrafficApi.getDemoTrafficStatus();
          setIsDemoTrafficLive(demoStatus.running);
          if (demoStatus.webhook_url) {
            setWebhookUrl(demoStatus.webhook_url);
          }
          setCsvFileExists(!!demoStatus.csv_file);
        } catch (error) {
          console.error('Failed to get demo traffic status:', error);
        }
       
        // Get live traffic status
        try {
          const liveStatus = await LiveTrafficApi.getLiveTrafficStatus();
          setIsLiveTrafficLive(liveStatus.running);
          if (liveStatus.interface) {
            setSelectedInterface(liveStatus.interface);
          }
          setLiveTrafficStats({
            packet_count: liveStatus.packet_count,
            flows_count: liveStatus.flows_count,
            uptime: liveStatus.uptime
          });
        } catch (error) {
          console.error('Failed to get live traffic status:', error);
        }
       
        // Get available network interfaces
        try {
          const interfacesResponse = await LiveTrafficApi.getNetworkInterfaces();
          setAvailableInterfaces(interfacesResponse.interfaces);
          setInterfaceFriendlyNames(interfacesResponse.friendly_names || {});
         
          if (interfacesResponse.default && !selectedInterface) {
            setSelectedInterface(interfacesResponse.default);
          }
        } catch (error) {
          console.error('Failed to get network interfaces:', error);
        }
      }
    };


    checkApiHealth();
   
    // Check health every 30 seconds
    const healthInterval = setInterval(checkApiHealth, 30000);
   
    // Update live traffic stats every 5 seconds when running
    const statsInterval = setInterval(async () => {
      if (isLiveTrafficLive) {
        try {
          const liveStatus = await LiveTrafficApi.getLiveTrafficStatus();
          setLiveTrafficStats({
            packet_count: liveStatus.packet_count,
            flows_count: liveStatus.flows_count,
            uptime: liveStatus.uptime
          });
        } catch (error) {
          console.error('Failed to update live traffic stats:', error);
        }
      }
    }, 5000);
   
    return () => {
      clearInterval(healthInterval);
      clearInterval(statsInterval);
    };
  }, [isLiveTrafficLive, selectedInterface]);


  const handleGenerateTraffic = async () => {
    if (!isDemoApiConnected) {
      setError('Demo Traffic API is not available. Please start the Python backend.');
      return;
    }


    setIsLoading(true);
    setError(null);
   
    try {
      const response = await UpdatedDemoTrafficApi.generateTraffic();
     
      if (response.success) {
        setCsvFileExists(true);
        console.log('Traffic generated successfully:', response.message);
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate traffic');
      console.error('Failed to generate traffic:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSendCSVOnce = async () => {
    if (!isDemoApiConnected) {
      setError('Demo Traffic API is not available. Please start the Python backend.');
      return;
    }


    setIsLoading(true);
    setError(null);
   
    try {
      const response = await UpdatedDemoTrafficApi.sendCSVOnce({ webhookUrl });
     
      if (response.success) {
        console.log('CSV file sent successfully:', response.message);
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send CSV file');
      console.error('Failed to send CSV file:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleStartDemoTraffic = async () => {
    if (!isDemoApiConnected) {
      setError('Demo Traffic API is not available. Please start the Python backend.');
      return;
    }


    setIsLoading(true);
    setError(null);
   
    try {
      const response = await UpdatedDemoTrafficApi.startDemoTraffic({ webhookUrl });
     
      if (response.success) {
        setIsDemoTrafficLive(true);
        console.log('Demo traffic started:', response.message);
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to start demo traffic');
      console.error('Failed to start demo traffic:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleStopDemoTraffic = async () => {
    setIsLoading(true);
    setError(null);
   
    try {
      const response = await UpdatedDemoTrafficApi.stopDemoTraffic();
     
      if (response.success) {
        setIsDemoTrafficLive(false);
        console.log('Demo traffic stopped:', response.message);
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to stop demo traffic');
      console.error('Failed to stop demo traffic:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleStartLiveTraffic = async () => {
    if (!isLiveMonitorApiConnected) {
      setError('Live Monitor API (port 8000) is not connected.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${LIVE_MONITOR_API_URL}/start-monitoring`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to start monitoring.');
      // Set the start time when live traffic starts
      setLiveTrafficStartTime(new Date());
      // setIsLiveTrafficLive(true); // Now handled by polling
    } catch (error: any) {
      setError(error.message);
      console.error("Error starting live traffic:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleStopLiveTraffic = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${LIVE_MONITOR_API_URL}/stop-monitoring`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to stop monitoring.');
      // Reset the start time when live traffic stops
      setLiveTrafficStartTime(null);
      // setIsLiveTrafficLive(false); // Now handled by polling
      setLiveTrafficStats({ packet_count: 0, flows_count: 0, uptime: 0 });
    } catch (error: any) {
      setError(error.message);
      console.error("Error stopping live traffic:", error);
    } finally {
      setIsLoading(false);
    }
  };


  // const getStatusColor = (label: NetworkPacket['status']) => {
  //   switch (status) {
  //     case 'normal':
  //       return 'text-green-400';
  //     case 'suspicious':
  //       return 'text-yellow-400';
  //     case 'malicious':
  //       return 'text-red-400';
  //     default:
  //       return 'text-gray-400';
  //   }
  // };


  // const getStatusBg = (status: NetworkPacket['status']) => {
  //   switch (status) {
  //     case 'normal':
  //       return 'bg-green-500/10 border-green-500/20';
  //     case 'suspicious':
  //       return 'bg-yellow-500/10 border-yellow-500/20';
  //     case 'malicious':
  //       return 'bg-red-500/10 border-red-500/20';
  //     default:
  //       return 'bg-gray-500/10 border-gray-500/20';
  //   }
  // };


  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  const getFriendlyInterfaceName = (interfaceName: string) => {
    return interfaceFriendlyNames[interfaceName] || interfaceName;
  };


  // Memoized sorted packets in ascending order by time (oldest to newest)
  const sortedPackets = useMemo(() => {
    return [...packets].sort((a, b) => {
      if (a.time && b.time) {
        return new Date(a.time).getTime() - new Date(b.time).getTime();
      }
      return a.id - b.id;
    });
  }, [packets]);


  // State for current packet display
  // const [currentPacket, setCurrentPacket] = useState<NetworkPacket | null>(null);

  // Update current packet every 100ms to the latest (top) packet
  // useEffect(() => {
  //   if (!displayedPackets.length) {
  //     setCurrentPacket(null);
  //     return;
  //   }
  //   const interval = setInterval(() => {
  //     setCurrentPacket(displayedPackets[0]); // Always show the top (newest) packet
  //   }, 100);
  //   return () => clearInterval(interval);
  // }, [displayedPackets]);


  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-lg border border-green-500/20">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Live Traffic Monitor</h2>
            {/* <p className="text-sm text-gray-400">Real-time network packets with AI predictions</p> */}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Demo Traffic Controls */}
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400 font-medium">Demo:</div>
            {isDemoTrafficLive ? (
              <button
                onClick={handleStopDemoTraffic}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 rounded-lg text-orange-400 hover:text-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Square className="w-4 h-4" />
                <span className="text-sm font-medium">Stop</span>
              </button>
            ) : (
              <button
                onClick={handleStartDemoTraffic}
                disabled={isLoading || !isDemoApiConnected || !csvFileExists}
                className="flex items-center space-x-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 rounded-lg text-orange-400 hover:text-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isLoading ? 'Starting...' : 'Start'}
                </span>
              </button>
            )}
          </div>


          {/* Live Traffic Controls */}
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400 font-medium">Live:</div>
            {isLiveTrafficLive ? (
              <button
                onClick={handleStopLiveTraffic}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Square className="w-4 h-4" />
                <span className="text-sm font-medium">Stop</span>
              </button>
            ) : (
              <button
                onClick={handleStartLiveTraffic}
                disabled={isLoading || !isLiveMonitorApiConnected}
                className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 rounded-lg text-green-400 hover:text-green-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Network className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isLoading ? 'Starting...' : 'Start'}
                </span>
              </button>
            )}
          </div>


          {/* Status Indicator */}
          {/* <div className="flex items-center space-x-2 border-l border-gray-700 pl-4">
            <Database className={`w-5 h-5 ${packets.length > 0 ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
            <div className="text-sm">
              <div className={`font-medium ${packets.length > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                {packets.length > 0 ? 'Connected' : 'No Data'}
              </div>
              <div className="text-xs text-gray-400">
                {packets.length} packets
              </div>
            </div>
          </div> */}
        </div>
      </div>


      {/* Configuration & Status */}
      <div className="mb-4 space-y-3">
        {/* Supabase Status */}
        {/* <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${packets.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
            <span className="text-sm text-gray-300">
              Supabase: {packets.length > 0 ? 'Connected' : 'No Data'}
            </span>
            {packetsError && (
              <div className="flex items-center space-x-1 text-xs text-red-400">
                <AlertCircle className="w-3 h-3" />
                <span>{packetsError}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refetch}
              disabled={packetsLoading}
              className="flex items-center space-x-1 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 rounded text-cyan-400 hover:text-cyan-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${packetsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <span className="text-xs text-gray-400">Table: common_data</span>
          </div>
        </div> */}


        {/* Live Monitor API Status
        <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${isLiveMonitorApiConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-300">
              Live Monitor API: {isLiveMonitorApiConnected ? 'Connected' : 'Disconnected'}
            </span>
            {!isLiveMonitorApiConnected && (
              <div className="flex items-center space-x-1 text-xs text-yellow-400">
                <AlertCircle className="w-3 h-3" />
                <span>Run: uvicorn app:app --reload in pybackend</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Port 8000</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </div>
        </div> */}


        {/* API Status */}
        {/* <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${isDemoApiConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-300">
              API: {isDemoApiConnected ? 'Connected' : 'Disconnected'}
            </span>
            {!isDemoApiConnected && (
              <div className="flex items-center space-x-1 text-xs text-yellow-400">
                <AlertCircle className="w-3 h-3" />
                <span>Run: python server/start_csv_api.py</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Port 3002</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </div>
        </div> */}


        {/* Live Traffic Configuration */}
        {/* {isDemoApiConnected && (
          <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Live Capture Settings</span>
                <div className="group relative">
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Captures real network packets from your selected interface
                  </div>
                </div>
              </div>
              {isLiveTrafficLive && (
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <span>Packets: <span className="text-cyan-400 font-mono">{liveTrafficStats.packet_count}</span></span>
                  <span>Flows: <span className="text-purple-400 font-mono">{liveTrafficStats.flows_count}</span></span>
                  <span>Uptime: <span className="text-green-400 font-mono">{formatUptime(liveTrafficStats.uptime)}</span></span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Network Interface</label>
                <select
                  value={selectedInterface}
                  onChange={(e) => setSelectedInterface(e.target.value)}
                  disabled={isLiveTrafficLive}
                  className="w-full px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-white text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {availableInterfaces.map((iface) => (
                    <option key={iface} value={iface}>
                      {getFriendlyInterfaceName(iface)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Batch Size (packets)</label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  disabled={isLiveTrafficLive}
                  className="w-full px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-white text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value={50}>50 packets</option>
                  <option value={100}>100 packets</option>
                  <option value={200}>200 packets</option>
                  <option value={500}>500 packets</option>
                </select>
              </div>
            </div>
          </div>
        )} */}


        {/* CSV File Status */}
        {/* <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${csvFileExists ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-sm text-gray-300">
              CSV File: {csvFileExists ? 'Ready (complete_flow_features.csv)' : 'Not Found'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleGenerateTraffic}
              disabled={isLoading || !isDemoApiConnected}
              className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 rounded text-blue-400 hover:text-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Generate</span>
            </button>
            <button
              onClick={handleSendCSVOnce}
              disabled={isLoading || !isDemoApiConnected || !csvFileExists}
              className="flex items-center space-x-1 px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded text-purple-400 hover:text-purple-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <Upload className="w-3 h-3" />
              <span>Upload File</span>
            </button>
          </div>
        </div> */}


        {/* Webhook Configuration */}
        {/* <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">n8n Webhook URL:</label>
            <span className="text-xs text-gray-400">CSV File Upload Destination</span>
          </div>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            disabled={isDemoTrafficLive || isLiveTrafficLive}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="https://trialover098754321.app.n8n.cloud/webhook/646e1ad7-dd61-41b2-9893-997ee6157030"
          />
          <div className="mt-2 text-xs text-blue-400 flex items-center space-x-1">
            <Upload className="w-3 h-3" />
            <span>Uploads CSV file with 83 flow features as multipart/form-data</span>
          </div>
        </div> */}


        {/* Error Display */}
        {(error || packetsError) && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{error || packetsError}</span>
            </div>
          </div>
        )}
      </div>


      <div className="overflow-hidden">
        {/* Live Traffic Filter Status */}
        {isLiveTrafficLive && liveTrafficStartTime && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">Live Traffic Active</span>
              <span className="text-xs text-gray-400">
                (Showing packets from last 4 minutes since {liveTrafficStartTime.toLocaleTimeString()})
              </span>
            </div>
          </div>
        )}
        
        {/* Show current packet details */}
        {currentPacket && (
          <div className="mb-4 p-4 bg-gray-800/30 rounded-lg border border-cyan-500/20">
            <div className="text-xs text-gray-400 mb-2 font-medium">Current Packet:</div>
            <div className="grid grid-cols-4 gap-y-1 gap-x-6 text-xs">
              <div>
                <span className="text-gray-400">ID:</span>
                <span className="text-cyan-400 font-mono ml-1">{currentPacket.id}</span>
              </div>
              <div>
                <span className="text-gray-400">Time:</span>
                <span className="text-cyan-400 font-mono ml-1">{formatTimeHHMMSS(currentPacket.time)}</span>
              </div>
              <div>
                <span className="text-gray-400">Src:</span>
                <span className="text-cyan-400 font-mono ml-1">{currentPacket.sourceIP}</span>
              </div>
              <div>
                <span className="text-gray-400">Dst:</span>
                <span className="text-cyan-400 font-mono ml-1">{currentPacket.destinationIP}</span>
              </div>
              <div>
                <span className="text-gray-400">Proto:</span>
                <span className="text-cyan-400 font-mono ml-1">{currentPacket.protocol}</span>
              </div>
              <div>
                <span className="text-gray-400">Src Port:</span>
                <span className="text-cyan-400 font-mono ml-1">{currentPacket.srcPort}</span>
              </div>
              <div>
                <span className="text-gray-400">Dst Port:</span>
                <span className="text-cyan-400 font-mono ml-1">{currentPacket.dstPort}</span>
              </div>
              <div>
                <span className="text-gray-400">Label:</span>
                <span className="text-cyan-400 font-mono ml-1">{currentPacket.label ?? 'N/A'}</span>
              </div>
              {/* <div>
                <span className="text-gray-400">Status:</span>
                <span className="text-cyan-400 font-mono ml-1">{currentPacket.status}</span>
              </div> */}
            </div>
          </div>
        )}
        <div className="overflow-x-auto scrollbar-thin scrollbar-track-gray-800/30 scrollbar-thumb-gray-600/50">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">ID</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Time</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Source IP</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Dest IP</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Protocol</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Flow Duration</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Src Port</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Dst Port</th>
                {/* <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Flags</th> */}
                {/* <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">AI Prediction</th> */}
                {/* <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Country</th> */}
                {/* <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Action</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {packetsLoading && visiblePackets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 px-3 text-center text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading packets...</span>
                    </div>
                  </td>
                </tr>
              ) : visiblePackets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 px-3 text-center text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <Database className="w-4 h-4" />
                      <span>No packets found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                visiblePackets.map((packet) => (
                  <tr key={packet.id} className={`hover:bg-gray-800/30 transition-colors bg-cyan-500/5 animate-pulse ${packet.id === newPacketId ? 'animate-pulse bg-green-900/40' : ''}`}>
                    <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.id}</td>
                    <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{formatTimeHHMMSS(packet.time)}</td>
                    <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.sourceIP}</td>
                    <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.destinationIP}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">{packet.protocol}</span>
                    </td>
                    <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.flowDuration}</td>
                    <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.srcPort}</td>
                    <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.dstPort}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span>
          {packetsLoading ? 'Loading...' : `Showing ${packets.length} packets from Supabase`}
        </span>
        <div className="flex items-center space-x-4">
          {isDemoTrafficLive && (
            <span className="flex items-center space-x-1">
              <Upload className="w-3 h-3 text-orange-400" />
              <span>Demo active → CSV file → n8n → Supabase</span>
            </span>
          )}
          {isLiveTrafficLive && (
            <span className="flex items-center space-x-1">
              <Network className="w-3 h-3 text-green-400" />
              <span>Live capture → {getFriendlyInterfaceName(selectedInterface)} → ML → Supabase</span>
            </span>
          )}
          {!isAnyTrafficActive && (
            <span className="flex items-center space-x-1">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>Displaying stored predictions from Supabase</span>
            </span>
          )}
        </div>
      </div> */}
    </div>
  );
};


export default LiveTrafficMonitor;



