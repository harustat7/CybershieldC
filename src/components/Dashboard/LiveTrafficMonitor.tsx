



// import React, { useState, useEffect, useMemo } from 'react';
// import { Activity, Wifi, Play, Square, Zap, Network, AlertCircle, ExternalLink, RefreshCw, Send, Upload, Settings, Monitor, Info, Database } from 'lucide-react';
// import { NetworkPacket } from '../../types';
// import { useSupabasePackets } from '../../hooks/useSupabasePackets';
// import { UpdatedDemoTrafficApi } from '../../services/updatedDemoTrafficApi.ts';
// import { LiveTrafficApi } from '../../services/liveTrafficApi';
// import axios from 'axios';
// import { getProtocolName } from './../../services/protocolMapping.ts'; // <--- ADD THIS LINE
// import { getAttackLabelString as getAttackDetectionLabel } from './../../services/labelMapping';


// // Add at the top, after imports
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

// interface LiveTrafficMonitorProps {
//   onTrafficStatusChange: (isAnyTrafficActive: boolean, hasPacketsDisplayed: boolean) => void;
// }

// const LiveTrafficMonitor: React.FC<LiveTrafficMonitorProps> = ({ onTrafficStatusChange }) => {
//   const [isDemoTrafficLive, setIsDemoTrafficLive] = useState(false);
//   const [isLiveTrafficLive, setIsLiveTrafficLive] = useState(false);
//   const [isDemoApiConnected, setIsDemoApiConnected] = useState(false);
//   const [webhookUrl, setWebhookUrl] = useState('https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [csvFileExists, setCsvFileExists] = useState(false);
//   const [isLiveMonitorApiConnected, setIsLiveMonitorApiConnected] = useState(false);
//   const LIVE_MONITOR_API_URL = 'http://localhost:8000';
  
//   // Add state to track when live traffic started
//   const [liveTrafficStartTime, setLiveTrafficStartTime] = useState<Date | null>(null);
 
//   // Live traffic specific states
//   const [selectedInterface, setSelectedInterface] = useState('Wi-Fi');
//   const [availableInterfaces, setAvailableInterfaces] = useState<string[]>(['Wi-Fi']);
//   const [interfaceFriendlyNames, setInterfaceFriendlyNames] = useState<{ [key: string]: string }>({});
//   const [batchSize, setBatchSize] = useState(100);
//   const [liveTrafficStats, setLiveTrafficStats] = useState({
//     packet_count: 0,
//     flows_count: 0,
//     uptime: 0
//   });

//   const isAnyTrafficActive = isDemoTrafficLive || isLiveTrafficLive;

//   // Use Supabase packets instead of fake data
//   const { packets, loading: packetsLoading, error: packetsError, refetch } = useSupabasePackets(25, isDemoTrafficLive || isLiveTrafficLive);


//   // Filter packets based on live traffic start time
//   const filteredPackets = useMemo(() => {
//     if (!isLiveTrafficLive || !liveTrafficStartTime) {
//       // If not live traffic, show all packets
//       return packets;
//     }
//     // Filter packets to only show those from the last 4 minutes after live traffic started
//     const fourMinutesAgo = new Date(liveTrafficStartTime.getTime() - 4 * 60 * 1000);
//     return packets.filter(packet => {
//       if (!packet.time) return false;
//       try {
//         const packetTime = new Date(packet.time);
//         return packetTime >= fourMinutesAgo;
//       } catch (error) {
//         console.warn('Error parsing packet time:', packet.time, error);
//         return false;
//       }
//     });
//   }, [packets, isLiveTrafficLive, liveTrafficStartTime]);

//   // Sort packets in descending order (newest to oldest) for proper display order
//   const sortedFilteredPackets = useMemo(() => {
//     return [...filteredPackets].sort((a, b) => {
//       if (!a.time || !b.time) return 0;
//       return new Date(b.time).getTime() - new Date(a.time).getTime();
//     });
//   }, [filteredPackets]);

//   // Now declare all useState/useEffect that use sortedFilteredPackets below this
//   // New state for current packet index
//   const [currentPacketIndex, setCurrentPacketIndex] = useState(0);
//   // Remove displayedPackets state and all setDisplayedPackets logic

//   // Remove streaming/interval logic and related state
//   // Show the most recent 25 packets at once (sliding window, no streaming)
//   const [visiblePackets, setVisiblePackets] = useState<NetworkPacket[]>([]);
//   const [currentPacket, setCurrentPacket] = useState<NetworkPacket | null>(null);

//   // Update visiblePackets and currentPacket when sortedFilteredPackets changes
//   useEffect(() => {
//     if (!isAnyTrafficActive) {
//       setVisiblePackets([]);
//       setCurrentPacket(null);
//       return;
//     }
//     const latestPackets = sortedFilteredPackets.slice(0, 25); // newest to oldest
//     setVisiblePackets(latestPackets);
//     setCurrentPacket(latestPackets.length > 0 ? latestPackets[0] : null);
//   }, [sortedFilteredPackets, isAnyTrafficActive]);
//   // Notify parent about traffic and display status
//   useEffect(() => {
//     // Only call if the handler is provided
//     if (onTrafficStatusChange) {
//       onTrafficStatusChange(isAnyTrafficActive, visiblePackets.length > 0);
//     }
//   }, [isAnyTrafficActive, visiblePackets.length, onTrafficStatusChange]); // <-- Dependencies

//   // Sliding window packet display logic
//   useEffect(() => {
//     if (!isAnyTrafficActive) {
//       setVisiblePackets([]);
//       setCurrentPacketIndex(0);
//       return;
//     }

//     // Use sorted filtered packets instead of all packets
//     const latestPackets = sortedFilteredPackets.slice(-25);
//     setVisiblePackets(latestPackets);

//     // Add packets one by one with sliding window effect
//     if (latestPackets.length > visiblePackets.length) {
//       const newPackets = latestPackets.slice(visiblePackets.length);
      
//       newPackets.forEach((packet, index) => {
//         setTimeout(() => {
//           setVisiblePackets(prev => {
//             const newDisplayed = [...prev, packet];
//             // Keep only the last 25 packets (sliding window)
//             return newDisplayed.slice(-25);
//           });
//         }, index * 200); // 200ms delay between each packet
//       });
//     } else if (latestPackets.length < visiblePackets.length) {
//       // If we have fewer packets, reset to show all current packets
//       setVisiblePackets(latestPackets);
//     }
//   }, [sortedFilteredPackets, isDemoTrafficLive, isLiveTrafficLive]);


//   // Track the ID of the most recently added packet for animation
//   const [newPacketId, setNewPacketId] = useState<number | null>(null);

//   // When visiblePackets changes, highlight the newest packet
//   useEffect(() => {
//     if (visiblePackets.length > 0) {
//       setNewPacketId(visiblePackets[0].id);
//       const timeout = setTimeout(() => setNewPacketId(null), 1000); // Remove highlight after 1s
//       return () => clearTimeout(timeout);
//     }
//   }, [visiblePackets]);


//   // Check Live Monitor API health
//   useEffect(() => {
//     const checkLiveMonitorApiStatus = async () => {
//       try {
//         const response = await fetch(`${LIVE_MONITOR_API_URL}/`);
//         setIsLiveMonitorApiConnected(response.ok);
//       } catch (error) {
//         setIsLiveMonitorApiConnected(false);
//       }
//     };
   
//     checkLiveMonitorApiStatus();
//     const intervalId = setInterval(checkLiveMonitorApiStatus, 5000);
//     return () => clearInterval(intervalId);
//   }, []);


//   // Poll backend for live status
//   useEffect(() => {
//     let consecutiveFalseCount = 0;
//     const pollStatus = async () => {
//       try {
//         const res = await axios.get('http://localhost:8000/status');
//         console.log('[Frontend Poll] live_running:', res.data.live_running);
//         if (res.data.live_running) {
//           consecutiveFalseCount = 0;
//           const wasNotLive = !isLiveTrafficLive;
//           setIsLiveTrafficLive(true);
//           // Only set start time if this is the first time we're detecting live traffic
//           if (wasNotLive) {
//             setLiveTrafficStartTime(new Date());
//           }
//         } else {
//           consecutiveFalseCount++;
//           if (consecutiveFalseCount >= 2) {
//             setIsLiveTrafficLive(false);
//             setLiveTrafficStartTime(null); // Reset start time if live traffic stops
//           }
//         }
//       } catch (e) {
//         console.log('[Frontend Poll] Error:', e);
//         // Optionally increment false count on error
//         consecutiveFalseCount++;
//         if (consecutiveFalseCount >= 2) {
//           setIsLiveTrafficLive(false);
//           setLiveTrafficStartTime(null); // Reset start time on error
//         }
//       }
//     };
//     pollStatus();
//     const interval = setInterval(pollStatus, 2000);
//     return () => clearInterval(interval);
//   }, [isLiveTrafficLive]);


//   // Check demo API health and get network interfaces on component mount
//   useEffect(() => {
//     const checkApiHealth = async () => {
//       const isHealthy = await UpdatedDemoTrafficApi.checkHealth();
//       setIsDemoApiConnected(isHealthy);
     
//       if (isHealthy) {
//         // Get demo traffic status
//         try {
//           const demoStatus = await UpdatedDemoTrafficApi.getDemoTrafficStatus();
//           setIsDemoTrafficLive(demoStatus.running);
//           if (demoStatus.webhook_url) {
//             setWebhookUrl(demoStatus.webhook_url);
//           }
//           setCsvFileExists(!!demoStatus.csv_file);
//         } catch (error) {
//           console.error('Failed to get demo traffic status:', error);
//         }
       
//         // Get live traffic status
//         try {
//           const liveStatus = await LiveTrafficApi.getLiveTrafficStatus();
//           setIsLiveTrafficLive(liveStatus.running);
//           if (liveStatus.interface) {
//             setSelectedInterface(liveStatus.interface);
//           }
//           setLiveTrafficStats({
//             packet_count: liveStatus.packet_count,
//             flows_count: liveStatus.flows_count,
//             uptime: liveStatus.uptime
//           });
//         } catch (error) {
//           console.error('Failed to get live traffic status:', error);
//         }
       
//         // Get available network interfaces
//         try {
//           const interfacesResponse = await LiveTrafficApi.getNetworkInterfaces();
//           setAvailableInterfaces(interfacesResponse.interfaces);
//           setInterfaceFriendlyNames(interfacesResponse.friendly_names || {});
         
//           if (interfacesResponse.default && !selectedInterface) {
//             setSelectedInterface(interfacesResponse.default);
//           }
//         } catch (error) {
//           console.error('Failed to get network interfaces:', error);
//         }
//       }
//     };


//     checkApiHealth();
   
//     // Check health every 30 seconds
//     const healthInterval = setInterval(checkApiHealth, 30000);
   
//     // Update live traffic stats every 5 seconds when running
//     const statsInterval = setInterval(async () => {
//       if (isLiveTrafficLive) {
//         try {
//           const liveStatus = await LiveTrafficApi.getLiveTrafficStatus();
//           setLiveTrafficStats({
//             packet_count: liveStatus.packet_count,
//             flows_count: liveStatus.flows_count,
//             uptime: liveStatus.uptime
//           });
//         } catch (error) {
//           console.error('Failed to update live traffic stats:', error);
//         }
//       }
//     }, 5000);
   
//     return () => {
//       clearInterval(healthInterval);
//       clearInterval(statsInterval);
//     };
//   }, [isLiveTrafficLive, selectedInterface]);


//   const handleGenerateTraffic = async () => {
//     if (!isDemoApiConnected) {
//       setError('Demo Traffic API is not available. Please start the Python backend.');
//       return;
//     }


//     setIsLoading(true);
//     setError(null);
   
//     try {
//       const response = await UpdatedDemoTrafficApi.generateTraffic();
     
//       if (response.success) {
//         setCsvFileExists(true);
//         console.log('Traffic generated successfully:', response.message);
//       } else {
//         setError(response.message);
//       }
//     } catch (error: any) {
//       setError(error.message || 'Failed to generate traffic');
//       console.error('Failed to generate traffic:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const handleSendCSVOnce = async () => {
//     if (!isDemoApiConnected) {
//       setError('Demo Traffic API is not available. Please start the Python backend.');
//       return;
//     }


//     setIsLoading(true);
//     setError(null);
   
//     try {
//       const response = await UpdatedDemoTrafficApi.sendCSVOnce({ webhookUrl });
     
//       if (response.success) {
//         console.log('CSV file sent successfully:', response.message);
//       } else {
//         setError(response.message);
//       }
//     } catch (error: any) {
//       setError(error.message || 'Failed to send CSV file');
//       console.error('Failed to send CSV file:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const handleStartDemoTraffic = async () => {
//     if (!isDemoApiConnected) {
//       setError('Demo Traffic API is not available. Please start the Python backend.');
//       return;
//     }


//     setIsLoading(true);
//     setError(null);
   
//     try {
//       const response = await UpdatedDemoTrafficApi.startDemoTraffic({ webhookUrl });
     
//       if (response.success) {
//         setIsDemoTrafficLive(true);
//         console.log('Demo traffic started:', response.message);
//       } else {
//         setError(response.message);
//       }
//     } catch (error: any) {
//       setError(error.message || 'Failed to start demo traffic');
//       console.error('Failed to start demo traffic:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const handleStopDemoTraffic = async () => {
//     setIsLoading(true);
//     setError(null);
   
//     try {
//       const response = await UpdatedDemoTrafficApi.stopDemoTraffic();
     
//       if (response.success) {
//         setIsDemoTrafficLive(false);
//         console.log('Demo traffic stopped:', response.message);
//       } else {
//         setError(response.message);
//       }
//     } catch (error: any) {
//       setError(error.message || 'Failed to stop demo traffic');
//       console.error('Failed to stop demo traffic:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const handleStartLiveTraffic = async () => {
//     if (!isLiveMonitorApiConnected) {
//       setError('Live Monitor API (port 8000) is not connected.');
//       return;
//     }
//     setIsLoading(true);
//     setError(null);
//     try {
//       const response = await fetch(`${LIVE_MONITOR_API_URL}/start-monitoring`, {
//         method: 'POST',
//       });
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.detail || 'Failed to start monitoring.');
//       // Set the start time when live traffic starts
//       setLiveTrafficStartTime(new Date());
//       // setIsLiveTrafficLive(true); // Now handled by polling
//     } catch (error: any) {
//       setError(error.message);
//       console.error("Error starting live traffic:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const handleStopLiveTraffic = async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const response = await fetch(`${LIVE_MONITOR_API_URL}/stop-monitoring`, {
//         method: 'POST',
//       });
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.detail || 'Failed to stop monitoring.');
//       // Reset the start time when live traffic stops
//       setLiveTrafficStartTime(null);
//       // setIsLiveTrafficLive(false); // Now handled by polling
//       setLiveTrafficStats({ packet_count: 0, flows_count: 0, uptime: 0 });
//     } catch (error: any) {
//       setError(error.message);
//       console.error("Error stopping live traffic:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };



//   const formatUptime = (seconds: number) => {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };


//   const getFriendlyInterfaceName = (interfaceName: string) => {
//     return interfaceFriendlyNames[interfaceName] || interfaceName;
//   };


//   // Memoized sorted packets in ascending order by time (oldest to newest)
//   const sortedPackets = useMemo(() => {
//     return [...packets].sort((a, b) => {
//       if (a.time && b.time) {
//         return new Date(a.time).getTime() - new Date(b.time).getTime();
//       }
//       return a.id - b.id;
//     });
//   }, [packets]);




//   return (
//     <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 h-full">
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center space-x-3">
//           <div className="flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-lg border border-green-500/20">
//             <Activity className="w-5 h-5 text-green-400" />
//           </div>
//           <div>
//             <h2 className="text-lg font-semibold text-white">Live Traffic Monitor</h2>
//             {/* <p className="text-sm text-gray-400">Real-time network packets with AI predictions</p> */}
//           </div>
//         </div>
//         <div className="flex items-center space-x-4">
//           {/* Demo Traffic Controls */}
//           <div className="flex items-center space-x-2">
//             <div className="text-xs text-gray-400 font-medium">Demo:</div>
//             {isDemoTrafficLive ? (
//               <button
//                 onClick={handleStopDemoTraffic}
//                 disabled={isLoading}
//                 className="flex items-center space-x-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 rounded-lg text-orange-400 hover:text-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Square className="w-4 h-4" />
//                 <span className="text-sm font-medium">Stop</span>
//               </button>
//             ) : (
//               <button
//                 onClick={handleStartDemoTraffic}
//                 disabled={isLoading || !isDemoApiConnected || !csvFileExists}
//                 className="flex items-center space-x-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 rounded-lg text-orange-400 hover:text-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Zap className="w-4 h-4" />
//                 <span className="text-sm font-medium">
//                   {isLoading ? 'Starting...' : 'Start'}
//                 </span>
//               </button>
//             )}
//           </div>


//           {/* Live Traffic Controls */}
//           <div className="flex items-center space-x-2">
//             <div className="text-xs text-gray-400 font-medium">Live:</div>
//             {isLiveTrafficLive ? (
//               <button
//                 onClick={handleStopLiveTraffic}
//                 disabled={isLoading}
//                 className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Square className="w-4 h-4" />
//                 <span className="text-sm font-medium">Stop</span>
//               </button>
//             ) : (
//               <button
//                 onClick={handleStartLiveTraffic}
//                 disabled={isLoading || !isLiveMonitorApiConnected}
//                 className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 rounded-lg text-green-400 hover:text-green-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Network className="w-4 h-4" />
//                 <span className="text-sm font-medium">
//                   {isLoading ? 'Starting...' : 'Start'}
//                 </span>
//               </button>
//             )}
//           </div>


//           {/* Status Indicator */}
//           {/* <div className="flex items-center space-x-2 border-l border-gray-700 pl-4">
//             <Database className={`w-5 h-5 ${packets.length > 0 ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
//             <div className="text-sm">
//               <div className={`font-medium ${packets.length > 0 ? 'text-green-400' : 'text-gray-400'}`}>
//                 {packets.length > 0 ? 'Connected' : 'No Data'}
//               </div>
//               <div className="text-xs text-gray-400">
//                 {packets.length} packets
//               </div>
//             </div>
//           </div> */}
//         </div>
//       </div>


//       {/* Configuration & Status */}
//       <div className="mb-4 space-y-3">
        
//         {(error || packetsError) && (
//           <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
//             <div className="flex items-center space-x-2">
//               <AlertCircle className="w-4 h-4 text-red-400" />
//               <span className="text-sm text-red-400">{error || packetsError}</span>
//             </div>
//           </div>
//         )}
//       </div>


//       <div className="overflow-hidden">
//         {/* Live Traffic Filter Status */}
//         {isLiveTrafficLive && liveTrafficStartTime && (
//           <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
//             <div className="flex items-center space-x-2">
//               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//               <span className="text-sm text-green-400 font-medium">Live Traffic Active</span>
//               <span className="text-xs text-gray-400">
//                 (Showing packets from last 4 minutes since {liveTrafficStartTime.toLocaleTimeString()})
//               </span>
//             </div>
//           </div>
//         )}
        
//         {/* Show current packet details */}
//         {currentPacket && (
//           <div className="mb-4 p-4 bg-gray-800/30 rounded-lg border border-cyan-500/20">
//             <div className="text-xs text-gray-400 mb-2 font-medium">Current Packet:</div>
//             <div className="grid grid-cols-4 gap-y-1 gap-x-6 text-xs">
//               <div>
//                 <span className="text-gray-400">ID:</span>
//                 <span className="text-cyan-400 font-mono ml-1">{currentPacket.id}</span>
//               </div>
//               <div>
//                 <span className="text-gray-400">Time:</span>
//                 <span className="text-cyan-400 font-mono ml-1">{formatTimeHHMMSS(currentPacket.time)}</span>
//               </div>
//               <div>
//                 <span className="text-gray-400">Src:</span>
//                 <span className="text-cyan-400 font-mono ml-1">{currentPacket.sourceIP}</span>
//               </div>
//               <div>
//                 <span className="text-gray-400">Dst:</span>
//                 <span className="text-cyan-400 font-mono ml-1">{currentPacket.destinationIP}</span>
//               </div>
//               <div>
//                 <span className="text-gray-400">Proto:</span>
//                 <span className="text-cyan-400 font-mono ml-1">{getProtocolName(currentPacket.protocol, currentPacket.srcPort, currentPacket.dstPort)}</span>              </div>
//               <div>
//                 <span className="text-gray-400">Src Port:</span>
//                 <span className="text-cyan-400 font-mono ml-1">{currentPacket.srcPort}</span>
//               </div>
//               <div>
//                 <span className="text-gray-400">Dst Port:</span>
//                 <span className="text-cyan-400 font-mono ml-1">{currentPacket.dstPort}</span>
//               </div>
//               <div>
//                 <span className="text-gray-400">Label:</span>
//                 <span className="text-cyan-400 font-mono ml-1">{getAttackDetectionLabel(currentPacket.attack_type, currentPacket.label)}</span>
//               </div>
//               {/* <div>
//                 <span className="text-gray-400">Status:</span>
//                 <span className="text-cyan-400 font-mono ml-1">{currentPacket.status}</span>
//               </div> */}
//             </div>
//           </div>
//         )}
//         <div className="overflow-x-auto scrollbar-thin scrollbar-track-gray-800/30 scrollbar-thumb-gray-600/50">
//           <table className="w-full text-sm min-w-[800px]">
//             <thead>
//               <tr className="border-b border-gray-700/50">
//                 <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">ID</th>
//                 <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Time</th>
//                 <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Source IP</th>
//                 <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Dest IP</th>
//                 <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Protocol</th>
//                 <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Flow Duration</th>
//                 <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Src Port</th>
//                 <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Dst Port</th>
//                 {/* <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Flags</th> */}
//                 {/* <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">AI Prediction</th> */}
//                 {/* <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Country</th> */}
//                 {/* <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Action</th> */}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-700/30">
//               {packetsLoading && visiblePackets.length === 0 ? (
//                 <tr>
//                   <td colSpan={10} className="py-8 px-3 text-center text-gray-400">
//                     <div className="flex items-center justify-center space-x-2">
//                       <RefreshCw className="w-4 h-4 animate-spin" />
//                       <span>Loading packets...</span>
//                     </div>
//                   </td>
//                 </tr>
//               ) : visiblePackets.length === 0 ? (
//                 <tr>
//                   <td colSpan={10} className="py-8 px-3 text-center text-gray-400">
//                     <div className="flex items-center justify-center space-x-2">
//                       <Database className="w-4 h-4" />
//                       <span>No packets found</span>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 visiblePackets.map((packet) => (
//                   <tr key={packet.id} className={`hover:bg-gray-800/30 transition-colors bg-cyan-500/5 animate-pulse ${packet.id === newPacketId ? 'animate-pulse bg-green-900/40' : ''}`}>
//                     <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.id}</td>
//                     <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{formatTimeHHMMSS(packet.time)}</td>
//                     <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.sourceIP}</td>
//                     <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.destinationIP}</td>
//                     <td className="py-2 px-3 whitespace-nowrap">
//                       <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">{getProtocolName(packet.protocol, packet.srcPort, packet.dstPort)}</span>
//                     </td>
//                     <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.flowDuration}</td>
//                     <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.srcPort}</td>
//                     <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.dstPort}</td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>


//       {/* <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
//         <span>
//           {packetsLoading ? 'Loading...' : `Showing ${packets.length} packets from Supabase`}
//         </span>
//         <div className="flex items-center space-x-4">
//           {isDemoTrafficLive && (
//             <span className="flex items-center space-x-1">
//               <Upload className="w-3 h-3 text-orange-400" />
//               <span>Demo active → CSV file → n8n → Supabase</span>
//             </span>
//           )}
//           {isLiveTrafficLive && (
//             <span className="flex items-center space-x-1">
//               <Network className="w-3 h-3 text-green-400" />
//               <span>Live capture → {getFriendlyInterfaceName(selectedInterface)} → ML → Supabase</span>
//             </span>
//           )}
//           {!isAnyTrafficActive && (
//             <span className="flex items-center space-x-1">
//               <Database className="w-3 h-3 text-cyan-400" />
//               <span>Displaying stored predictions from Supabase</span>
//             </span>
//           )}
//         </div>
//       </div> */}
//     </div>
//   );
// };


// export default LiveTrafficMonitor;




// import React, { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
// import { Activity, Wifi, Play, Square, Zap, Network, AlertCircle, ExternalLink, RefreshCw, Send, Upload, Settings, Monitor, Info, Database } from 'lucide-react';
// import { NetworkPacket } from '../../types';
// // import { useSupabasePackets } from '../../hooks/useSupabasePackets'; // This line is correctly commented out
// import { UpdatedDemoTrafficApi } from '../../services/updatedDemoTrafficApi.ts';
// import { LiveTrafficApi } from '../../services/liveTrafficApi';
// import axios from 'axios';
// import { getProtocolName } from './../../services/protocolMapping.ts';
// import { getAttackLabelString as getAttackDetectionLabel } from './../../services/labelMapping';


// // Add at the top, after imports
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

// interface LiveTrafficMonitorProps {
//   packets: NetworkPacket[]; // ADDED: packets prop from Dashboard
//   currentPacket: NetworkPacket | null;
//   onSelectPacket: Dispatch<SetStateAction<NetworkPacket | null>>;
//   onTrafficStatusChange: (isActive: boolean, hasPackets: boolean) => void;
//   loading: boolean; // ADDED: loading prop from Dashboard
//   error: string | null; // ADDED: error prop from Dashboard (this is the one from useSupabasePackets)
// }


// const LiveTrafficMonitor: React.FC<LiveTrafficMonitorProps> = ({
//   packets, // DESTRUCTURED from props
//   currentPacket, // DESTRUCTURED from props
//   onSelectPacket, // DESTRUCTURED from props
//   onTrafficStatusChange, // DESTRUCTURED from props
//   loading, // DESTRUCTURED from props (loading status from useSupabasePackets)
//   error // DESTRUCTURED from props (error from useSupabasePackets)
// }) => {
//   const [isDemoTrafficLive, setIsDemoTrafficLive] = useState(false);
//   const [isLiveTrafficLive, setIsLiveTrafficLive] = useState(false);
//   const [isDemoApiConnected, setIsDemoApiConnected] = useState(false);
//   const [webhookUrl, setWebhookUrl] = useState('https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9');
//   const [isLoading, setIsLoading] = useState(false); // For local API calls (start/stop traffic)
  
//   // --- MODIFICATION: Renamed local error state to 'apiError' ---
//   const [apiError, setApiError] = useState<string | null>(null); 
//   // --- END MODIFICATION ---

//   const [csvFileExists, setCsvFileExists] = useState(false);
//   const [isLiveMonitorApiConnected, setIsLiveMonitorApiConnected] = useState(false);
//   const LIVE_MONITOR_API_URL = 'http://localhost:8000';
  
//   // Add state to track when live traffic started
//   const [liveTrafficStartTime, setLiveTrafficStartTime] = useState<Date | null>(null);
 
//   // Live traffic specific states
//   const [selectedInterface, setSelectedInterface] = useState('Wi-Fi');
//   const [availableInterfaces, setAvailableInterfaces] = useState<string[]>(['Wi-Fi']);
//   const [interfaceFriendlyNames, setInterfaceFriendlyNames] = useState<{ [key: string]: string }>({});
//   const [batchSize, setBatchSize] = useState(100);
//   const [liveTrafficStats, setLiveTrafficStats] = useState({
//     packet_count: 0,
//     flows_count: 0,
//     uptime: 0
//   });

//   const isAnyTrafficActive = isDemoTrafficLive || isLiveTrafficLive;

//   // Filter packets based on live traffic start time. Now uses the 'packets' prop.
//   const filteredPackets = useMemo(() => {
//     if (!isLiveTrafficLive || !liveTrafficStartTime) {
//       return packets; 
//     }
//     // Filter packets to only show those from the last 4 minutes after live traffic started
//     const fourMinutesAgo = new Date(liveTrafficStartTime.getTime() - 4 * 60 * 1000);
//     return packets.filter(packet => {
//       if (!packet.time) return false;
//       try {
//         const packetTime = new Date(packet.time);
//         return packetTime >= fourMinutesAgo;
//       } catch (filterError) { // Renamed error variable
//         console.warn('Error parsing packet time:', packet.time, filterError);
//         return false;
//       }
//     });
//   }, [packets, isLiveTrafficLive, liveTrafficStartTime]);

//   // Sort packets in descending order (newest to oldest) for proper display order
//   const sortedFilteredPackets = useMemo(() => {
//     return [...filteredPackets].sort((a, b) => {
//       if (!a.time || !b.time) return 0;
//       return new Date(b.time).getTime() - new Date(a.time).getTime();
//     });
//   }, [filteredPackets]);

//   // Now declare all useState/useEffect that use sortedFilteredPackets below this
//   // New state for current packet index
//   const [currentPacketIndex, setCurrentPacketIndex] = useState(0);

//   // Show the most recent 25 packets at once (sliding window, no streaming)
//   const [visiblePackets, setVisiblePackets] = useState<NetworkPacket[]>([]);

//   // Update visiblePackets and currentPacket when sortedFilteredPackets changes
//   useEffect(() => {
//     if (!isAnyTrafficActive) {
//       setVisiblePackets([]);
//        onSelectPacket(null);
//       return;
//     }
//     const latestPackets = sortedFilteredPackets.slice(0, 25); // newest to oldest
//     setVisiblePackets(latestPackets);
//     if (latestPackets.length > 0) {
//       onSelectPacket(latestPackets[0]); // <-- use parent's setter
//     } else {
//       onSelectPacket(null); // Clear parent's currentPacket if no packets
//     }
//    }, [sortedFilteredPackets, isAnyTrafficActive, onSelectPacket]);

  
//   // Notify parent about traffic and display status
//   useEffect(() => {
//     // Only call if the handler is provided
//     if (onTrafficStatusChange) {
//       onTrafficStatusChange(isAnyTrafficActive, visiblePackets.length > 0);
//     }
//   }, [isAnyTrafficActive, visiblePackets.length, onTrafficStatusChange]); // <-- Dependencies

//   // Sliding window packet display logic
//   useEffect(() => {
//     if (!isAnyTrafficActive) {
//       setVisiblePackets([]);
//       setCurrentPacketIndex(0);
//       return;
//     }

//     // Use sorted filtered packets instead of all packets
//     const latestPackets = sortedFilteredPackets.slice(-25);
//     setVisiblePackets(latestPackets);

//     // Add packets one by one with sliding window effect
//     if (latestPackets.length > visiblePackets.length) {
//       const newPackets = latestPackets.slice(visiblePackets.length);
      
//       newPackets.forEach((packet, index) => {
//         setTimeout(() => {
//           setVisiblePackets(prev => {
//             const newDisplayed = [...prev, packet];
//             // Keep only the last 25 packets (sliding window)
//             return newDisplayed.slice(-25);
//           });
//         }, index * 200); // 200ms delay between each packet
//       });
//     } else if (latestPackets.length < visiblePackets.length) {
//       // If we have fewer packets, reset to show all current packets
//       setVisiblePackets(latestPackets);
//     }
//   }, [sortedFilteredPackets, isDemoTrafficLive, isLiveTrafficLive]);


//   // Track the ID of the most recently added packet for animation
//   const [newPacketId, setNewPacketId] = useState<number | null>(null);

//   // When visiblePackets changes, highlight the newest packet
//   useEffect(() => {
//     if (visiblePackets.length > 0) {
//       setNewPacketId(visiblePackets[0].id);
//       const timeout = setTimeout(() => setNewPacketId(null), 1000); // Remove highlight after 1s
//       return () => clearTimeout(timeout);
//     }
//   }, [visiblePackets]);


//   // Check Live Monitor API health
//   useEffect(() => {
//     const checkLiveMonitorApiStatus = async () => {
//       try {
//         const response = await fetch(`${LIVE_MONITOR_API_URL}/`);
//         setIsLiveMonitorApiConnected(response.ok);
//       } catch (checkError) { // Renamed error variable
//         setIsLiveMonitorApiConnected(false);
//         setApiError(checkError instanceof Error ? checkError.message : 'Live Monitor API connection failed.'); // --- MODIFICATION: Use setApiError ---
//       }
//     };
   
//     checkLiveMonitorApiStatus();
//     const intervalId = setInterval(checkLiveMonitorApiStatus, 5000);
//     return () => clearInterval(intervalId);
//   }, []);


//   // Poll backend for live status
//   useEffect(() => {
//     let consecutiveFalseCount = 0;
//     const pollStatus = async () => {
//       try {
//         const res = await axios.get('http://localhost:8000/status');
//         console.log('[Frontend Poll] live_running:', res.data.live_running);
//         if (res.data.live_running) {
//           consecutiveFalseCount = 0;
//           const wasNotLive = !isLiveTrafficLive;
//           setIsLiveTrafficLive(true);
//           // Only set start time if this is the first time we're detecting live traffic
//           if (wasNotLive) {
//             setLiveTrafficStartTime(new Date());
//           }
//         } else {
//           consecutiveFalseCount++;
//           if (consecutiveFalseCount >= 2) {
//             setIsLiveTrafficLive(false);
//             setLiveTrafficStartTime(null); // Reset start time if live traffic stops
//           }
//         }
//       } catch (pollError) { // Renamed error variable
//         console.log('[Frontend Poll] Error:', pollError);
//         consecutiveFalseCount++;
//         if (consecutiveFalseCount >= 2) {
//           setIsLiveTrafficLive(false);
//           setLiveTrafficStartTime(null); // Reset start time on error
//         }
//         setApiError(pollError instanceof Error ? pollError.message : 'Live Monitor API polling failed.'); // --- MODIFICATION: Use setApiError ---
//       }
//     };
//     pollStatus();
//     const interval = setInterval(pollStatus, 2000);
//     return () => clearInterval(interval);
//   }, [isLiveTrafficLive]);


//   // Check demo API health and get network interfaces on component mount
//   useEffect(() => {
//     const checkApiHealth = async () => {
//       const isHealthy = await UpdatedDemoTrafficApi.checkHealth();
//       setIsDemoApiConnected(isHealthy);
     
//       if (isHealthy) {
//         // Get demo traffic status
//         try {
//           const demoStatus = await UpdatedDemoTrafficApi.getDemoTrafficStatus();
//           setIsDemoTrafficLive(demoStatus.running);
//           if (demoStatus.webhook_url) {
//             setWebhookUrl(demoStatus.webhook_url);
//           }
//           setCsvFileExists(!!demoStatus.csv_file);
//         } catch (demoError) { // Renamed error variable
//           console.error('Failed to get demo traffic status:', demoError);
//           setApiError(demoError instanceof Error ? demoError.message : 'Failed to get demo status.'); // --- MODIFICATION: Use setApiError ---
//         }
       
//         // Get live traffic status
//         try {
//           const liveStatus = await LiveTrafficApi.getLiveTrafficStatus();
//           setIsLiveTrafficLive(liveStatus.running);
//           if (liveStatus.interface) {
//             setSelectedInterface(liveStatus.interface);
//           }
//           setLiveTrafficStats({
//             packet_count: liveStatus.packet_count,
//             flows_count: liveStatus.flows_count,
//             uptime: liveStatus.uptime
//           });
//         } catch (liveError) { // Renamed error variable
//           console.error('Failed to get live traffic status:', liveError);
//           setApiError(liveError instanceof Error ? liveError.message : 'Failed to get live status.'); // --- MODIFICATION: Use setApiError ---
//         }
       
//         // Get available network interfaces
//         try {
//           const interfacesResponse = await LiveTrafficApi.getNetworkInterfaces();
//           setAvailableInterfaces(interfacesResponse.interfaces);
//           setInterfaceFriendlyNames(interfacesResponse.friendly_names || {});
         
//           if (interfacesResponse.default && !selectedInterface) {
//             setSelectedInterface(interfacesResponse.default);
//           }
//         } catch (interfaceError) { // Renamed error variable
//           console.error('Failed to get network interfaces:', interfaceError);
//           setApiError(interfaceError instanceof Error ? interfaceError.message : 'Failed to get interfaces.'); // --- MODIFICATION: Use setApiError ---
//         }
//       } else {
//         setApiError('Demo API is not connected.'); // --- MODIFICATION: Use setApiError ---
//       }
//     };


//     checkApiHealth();
   
//     // Check health every 30 seconds
//     const healthInterval = setInterval(checkApiHealth, 30000);
   
//     // Update live traffic stats every 5 seconds when running
//     const statsInterval = setInterval(async () => {
//       if (isLiveTrafficLive) {
//         try {
//           const liveStatus = await LiveTrafficApi.getLiveTrafficStatus();
//           setLiveTrafficStats({
//             packet_count: liveStatus.packet_count,
//             flows_count: liveStatus.flows_count,
//             uptime: liveStatus.uptime
//           });
//         } catch (statsError) { // Renamed error variable
//           console.error('Failed to update live traffic stats:', statsError);
//           setApiError(statsError instanceof Error ? statsError.message : 'Failed to update live stats.'); // --- MODIFICATION: Use setApiError ---
//         }
//       }
//     }, 5000);
   
//     return () => {
//       clearInterval(healthInterval);
//       clearInterval(statsInterval);
//     };
//   }, [isLiveTrafficLive, selectedInterface]);


//   const handleGenerateTraffic = async () => {
//     if (!isDemoApiConnected) {
//       setApiError('Demo Traffic API is not available. Please start the Python backend.'); // --- MODIFICATION: Use setApiError ---
//       return;
//     }


//     setIsLoading(true);
//     setApiError(null); // Clear local error before new attempt // --- MODIFICATION: Use setApiError ---
   
//     try {
//       const response = await UpdatedDemoTrafficApi.generateTraffic();
     
//       if (response.success) {
//         setCsvFileExists(true);
//         console.log('Traffic generated successfully:', response.message);
//       } else {
//         setApiError(response.message); // --- MODIFICATION: Use setApiError ---
//       }
//     } catch (apiError: any) {
//       setApiError(apiError.message || 'Failed to generate traffic'); // --- MODIFICATION: Use setApiError ---
//       console.error('Failed to generate traffic:', apiError);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const handleSendCSVOnce = async () => {
//     if (!isDemoApiConnected) {
//       setApiError('Demo Traffic API is not available. Please start the Python backend.'); // --- MODIFICATION: Use setApiError ---
//       return;
//     }


//     setIsLoading(true);
//     setApiError(null); // Clear local error before new attempt // --- MODIFICATION: Use setApiError ---
   
//     try {
//       const response = await UpdatedDemoTrafficApi.sendCSVOnce({ webhookUrl });
     
//       if (response.success) {
//         console.log('CSV file sent successfully:', response.message);
//       } else {
//         setApiError(response.message); // --- MODIFICATION: Use setApiError ---
//       }
//     } catch (apiError: any) {
//       setApiError(apiError.message || 'Failed to send CSV file'); // --- MODIFICATION: Use setApiError ---
//       console.error('Failed to send CSV file:', apiError);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const handleStartDemoTraffic = async () => {
//     if (!isDemoApiConnected) {
//       setApiError('Demo Traffic API is not available. Please start the Python backend.'); // --- MODIFICATION: Use setApiError ---
//       return;
//     }


//     setIsLoading(true);
//     setApiError(null); // Clear local error before new attempt // --- MODIFICATION: Use setApiError ---
   
//     try {
//       const response = await UpdatedDemoTrafficApi.startDemoTraffic({ webhookUrl });
     
//       if (response.success) {
//         setIsDemoTrafficLive(true);
//         console.log('Demo traffic started:', response.message);
//       } else {
//         setApiError(response.message); // --- MODIFICATION: Use setApiError ---
//       }
//     } catch (apiError: any) {
//       setApiError(apiError.message || 'Failed to start demo traffic'); // --- MODIFICATION: Use setApiError ---
//       console.error('Failed to start demo traffic:', apiError);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const handleStopDemoTraffic = async () => {
//     setIsLoading(true);
//     setApiError(null); // Clear local error before new attempt // --- MODIFICATION: Use setApiError ---
   
//     try {
//       const response = await UpdatedDemoTrafficApi.stopDemoTraffic();
     
//       if (response.success) {
//         setIsDemoTrafficLive(false);
//         console.log('Demo traffic stopped:', response.message);
//       } else {
//         setApiError(response.message); // --- MODIFICATION: Use setApiError ---
//       }
//     } catch (apiError: any) {
//       setApiError(apiError.message || 'Failed to stop demo traffic'); // --- MODIFICATION: Use setApiError ---
//       console.error('Failed to stop demo traffic:', apiError);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const handleStartLiveTraffic = async () => {
//     if (!isLiveMonitorApiConnected) {
//       setApiError('Live Monitor API (port 8000) is not connected.'); // --- MODIFICATION: Use setApiError ---
//       return;
//     }
//     setIsLoading(true);
//     setApiError(null); // Clear local error before new attempt // --- MODIFICATION: Use setApiError ---
//     try {
//       const response = await fetch(`${LIVE_MONITOR_API_URL}/start-monitoring`, {
//         method: 'POST',
//       });
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.detail || 'Failed to start monitoring.');
//       // Set the start time when live traffic starts
//       setLiveTrafficStartTime(new Date());
//     } catch (apiError: any) {
//       setApiError(apiError.message); // --- MODIFICATION: Use setApiError ---
//       console.error("Error starting live traffic:", apiError);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const handleStopLiveTraffic = async () => {
//     setIsLoading(true);
//     setApiError(null); // Clear local error before new attempt // --- MODIFICATION: Use setApiError ---
//     try {
//       const response = await fetch(`${LIVE_MONITOR_API_URL}/stop-monitoring`, {
//         method: 'POST',
//       });
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.detail || 'Failed to stop monitoring.');
//       // Reset the start time when live traffic stops
//       setLiveTrafficStartTime(null);
//       setLiveTrafficStats({ packet_count: 0, flows_count: 0, uptime: 0 });
//     } catch (apiError: any) {
//       setApiError(apiError.message); // --- MODIFICATION: Use setApiError ---
//       console.error("Error stopping live traffic:", apiError);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const formatUptime = (seconds: number) => {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };


//   const getFriendlyInterfaceName = (interfaceName: string) => {
//     return interfaceFriendlyNames[interfaceName] || interfaceName;
//   };


//   // Memoized sorted packets in ascending order by time (oldest to newest)
//   const sortedPackets = useMemo(() => {
//     return [...packets].sort((a, b) => {
//       if (a.time && b.time) {
//         return new Date(a.time).getTime() - new Date(b.time).getTime();
//       }
//       return a.id - b.id;
//     });
//   }, [packets]);


//   return (
//     <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 h-full">
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center space-x-3">
//           <div className="flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-lg border border-green-500/20">
//             <Activity className="w-5 h-5 text-green-400" />
//           </div>
//           <div>
//             <h2 className="text-lg font-semibold text-white">Live Traffic Monitor</h2>
//           </div>
//         </div>
//         <div className="flex items-center space-x-4">
//           {/* Demo Traffic Controls */}
//           <div className="flex items-center space-x-2">
//             <div className="text-xs text-gray-400 font-medium">Demo:</div>
//             {isDemoTrafficLive ? (
//               <button
//                 onClick={handleStopDemoTraffic}
//                 disabled={isLoading}
//                 className="flex items-center space-x-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 rounded-lg text-orange-400 hover:text-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Square className="w-4 h-4" />
//                 <span className="text-sm font-medium">Stop</span>
//               </button>
//             ) : (
//               <button
//                 onClick={handleStartDemoTraffic}
//                 disabled={isLoading || !isDemoApiConnected || !csvFileExists}
//                 className="flex items-center space-x-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 rounded-lg text-orange-400 hover:text-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Zap className="w-4 h-4" />
//                 <span className="text-sm font-medium">
//                   {isLoading ? 'Starting...' : 'Start'}
//                 </span>
//               </button>
//             )}
//           </div>


//           {/* Live Traffic Controls */}
//           <div className="flex items-center space-x-2">
//             <div className="text-xs text-gray-400 font-medium">Live:</div>
//             {isLiveTrafficLive ? (
//               <button
//                 onClick={handleStopLiveTraffic}
//                 disabled={isLoading}
//                 className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Square className="w-4 h-4" />
//                 <span className="text-sm font-medium">Stop</span>
//                </button>
//              ) : (
//                <button
//                  onClick={handleStartLiveTraffic}
//                  disabled={isLoading || !isLiveMonitorApiConnected}
//                  className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 rounded-lg text-green-400 hover:text-green-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//                >
//                  <Network className="w-4 h-4" />
//                  <span className="text-sm font-medium">
//                    {isLoading ? 'Starting...' : 'Start'}
//                  </span>
//                </button>
//              )}
//            </div>
//          </div>
//        </div>


//        {/* Configuration & Status */}
//        <div className="mb-4 space-y-3">
         
//          {/* Use the 'error' prop passed from Dashboard, OR the 'apiError' state */}
//          {(error || apiError || (isLoading && !isDemoApiConnected && !isLiveMonitorApiConnected)) && (
//            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
//              <div className="flex items-center space-x-2">
//                <AlertCircle className="w-4 h-4 text-red-400" />
//                <span className="text-sm text-red-400">{error || apiError || "Connection error or API not available."}</span>
//              </div>
//            </div>
//          )}
//        </div>


//        <div className="overflow-hidden">
//          {/* Live Traffic Filter Status */}
//          {isLiveTrafficLive && liveTrafficStartTime && (
//            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
//              <div className="flex items-center space-x-2">
//                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//                <span className="text-sm text-green-400 font-medium">Live Traffic Active</span>
//                <span className="text-xs text-gray-400">
//                  (Showing packets from last 4 minutes since {liveTrafficStartTime.toLocaleTimeString()})
//                </span>
//              </div>
//            </div>
//          )}
         
//          {/* Show current packet details */}
//          {currentPacket && ( // currentPacket is now directly from Dashboard's state
//            <div className="mb-4 p-4 bg-gray-800/30 rounded-lg border border-cyan-500/20">
//              <div className="text-xs text-gray-400 mb-2 font-medium">Current Packet:</div>
//              <div className="grid grid-cols-4 gap-y-1 gap-x-6 text-xs">
//                <div>
//                  <span className="text-gray-400">ID:</span>
//                  <span className="text-cyan-400 font-mono ml-1">{currentPacket.id}</span>
//                </div>
//                <div>
//                  <span className="text-gray-400">Time:</span>
//                  <span className="text-cyan-400 font-mono ml-1">{formatTimeHHMMSS(currentPacket.time)}</span>
//                </div>
//                <div>
//                  <span className="text-gray-400">Src:</span>
//                  <span className="text-cyan-400 font-mono ml-1">{currentPacket.sourceIP}</span>
//                </div>
//                <div>
//                  <span className="text-gray-400">Dst:</span>
//                  <span className="text-cyan-400 font-mono ml-1">{currentPacket.destinationIP}</span>
//                </div>
//                <div>
//                  <span className="text-gray-400">Proto:</span>
//                  <span className="text-cyan-400 font-mono ml-1">{getProtocolName(currentPacket.protocol, currentPacket.srcPort, currentPacket.dstPort)}</span>              </div>
//                <div>
//                  <span className="text-gray-400">Src Port:</span>
//                  <span className="text-cyan-400 font-mono ml-1">{currentPacket.srcPort}</span>
//                </div>
//                <div>
//                  <span className="text-gray-400">Dst Port:</span>
//                  <span className="text-cyan-400 font-mono ml-1">{currentPacket.dstPort}</span>
//                </div>
//                <div>
//                  <span className="text-gray-400">Label:</span>
//                  <span className="text-cyan-400 font-mono ml-1">{getAttackDetectionLabel(currentPacket.attack_type, currentPacket.label)}</span>
//                </div>
//              </div>
//            </div>
//          )}
//          <div className="overflow-x-auto scrollbar-thin scrollbar-track-gray-800/30 scrollbar-thumb-gray-600/50">
//            <table className="w-full text-sm min-w-[800px]">
//              <thead>
//                <tr className="border-b border-gray-700/50">
//                  <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">ID</th>
//                  <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Time</th>
//                  <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Source IP</th>
//                  <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Dest IP</th>
//                  <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Protocol</th>
//                  <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Flow Duration</th>
//                  <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Src Port</th>
//                  <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Dst Port</th>
//                </tr>
//              </thead>
//              <tbody className="divide-y divide-gray-700/30">
//                {/* Use the 'loading' prop from Dashboard */}
//                {loading && visiblePackets.length === 0 ? (
//                  <tr>
//                    <td colSpan={10} className="py-8 px-3 text-center text-gray-400">
//                      <div className="flex items-center justify-center space-x-2">
//                        <RefreshCw className="w-4 h-4 animate-spin" />
//                        <span>Loading packets...</span>
//                      </div>
//                    </td>
//                  </tr>
//                ) : visiblePackets.length === 0 ? (
//                  <tr>
//                    <td colSpan={10} className="py-8 px-3 text-center text-gray-400">
//                      <div className="flex items-center justify-center space-x-2">
//                        <Database className="w-4 h-4" />
//                        <span>No packets found</span>
//                      </div>
//                    </td>
//                  </tr>
//                ) : (
//                  visiblePackets.map((packet) => (
//                    <tr key={packet.id}
//                        className={`hover:bg-gray-800/30 transition-colors bg-cyan-500/5 ${packet.id === newPacketId ? 'animate-pulse bg-green-900/40' : ''}`}
//                        onClick={() => onSelectPacket(packet)}
//                    >
//                      <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.id}</td>
//                      <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{formatTimeHHMMSS(packet.time)}</td>
//                      <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.sourceIP}</td>
//                      <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.destinationIP}</td>
//                      <td className="py-2 px-3 whitespace-nowrap">
//                        <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">{getProtocolName(packet.protocol, packet.srcPort, packet.dstPort)}</span>
//                      </td>
//                      <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.flowDuration}</td>
//                      <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.srcPort}</td>
//                      <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.dstPort}</td>
//                    </tr>
//                  ))
//                )}
//              </tbody>
//            </table>
//          </div>
//        </div>
//      </div>
//    );
//  };


//  export default LiveTrafficMonitor;







import React, { useState, useEffect, useMemo, Dispatch, SetStateAction, useRef } from 'react';
import { Activity, Play, Square, Zap, Network, AlertCircle, RefreshCw, Database, Info } from 'lucide-react';
import { NetworkPacket } from '../../types';
import { UpdatedDemoTrafficApi } from '../../services/updatedDemoTrafficApi.ts';
import { LiveTrafficApi } from '../../services/liveTrafficApi';
import axios from 'axios';
import { getProtocolName } from './../../services/protocolMapping.ts';
import { getAttackLabelString as getAttackDetectionLabel } from './../../services/labelMapping';

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
    console.warn('Error parsing time:', dateTimeString, error);
  }

  return dateTimeString;
};

interface LiveTrafficMonitorProps {
  packets: NetworkPacket[];
  currentPacket: NetworkPacket | null;
  onSelectPacket: Dispatch<SetStateAction<NetworkPacket | null>>;
  onTrafficStatusChange: (isActive: boolean, hasPackets: boolean) => void;
  loading: boolean; // From useSupabasePackets
  error: string | null; // From useSupabasePackets
}

const LiveTrafficMonitor: React.FC<LiveTrafficMonitorProps> = ({
  packets,
  currentPacket,
  onSelectPacket,
  onTrafficStatusChange,
  loading,
  error // This error is specifically from useSupabasePackets
}) => {
  const [isDemoTrafficLive, setIsDemoTrafficLive] = useState(false);
  const [isLiveTrafficLive, setIsLiveTrafficLive] = useState(false);
  const [isDemoApiConnected, setIsDemoApiConnected] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://metasage-ai.app.n8n.cloud/webhook/e8525f42-b2c8-4432-9844-c723d6fe5ba9');
  const [isLoading, setIsLoading] = useState(false); // For local API calls (start/stop traffic)

  // --- NEW STATES FOR REFINED ERROR HANDLING ---
  const [networkConnectionError, setNetworkConnectionError] = useState<string | null>(null);
  const lastSuccessfulBackendCheck = useRef<number>(Date.now()); // Timestamp of last successful API check
  // --- END NEW STATES ---

  const [csvFileExists, setCsvFileExists] = useState(false);
  const [isLiveMonitorApiConnected, setIsLiveMonitorApiConnected] = useState(false);
  const LIVE_MONITOR_API_URL = 'http://localhost:8000';

  const [liveTrafficStartTime, setLiveTrafficStartTime] = useState<Date | null>(null);

  const [selectedInterface, setSelectedInterface] = useState('Wi-Fi');
  const [availableInterfaces, setAvailableInterfaces] = useState<string[]>(['Wi-Fi']);
  const [interfaceFriendlyNames, setInterfaceFriendlyNames] = useState<{ [key: string]: string }>({});
  const [liveTrafficStats, setLiveTrafficStats] = useState({
    packet_count: 0,
    flows_count: 0,
    uptime: 0
  });

  const isAnyTrafficActive = isDemoTrafficLive || isLiveTrafficLive;

  const filteredPackets = useMemo(() => {
    if (!isLiveTrafficLive || !liveTrafficStartTime) {
      return packets;
    }
    const fourMinutesAgo = new Date(liveTrafficStartTime.getTime() - 4 * 60 * 1000);
    return packets.filter(packet => {
      if (!packet.time) return false;
      try {
        const packetTime = new Date(packet.time);
        return packetTime >= fourMinutesAgo;
      } catch (filterError) {
        console.warn('Error parsing packet time in filter:', packet.time, filterError);
        return false;
      }
    });
  }, [packets, isLiveTrafficLive, liveTrafficStartTime]);

  const sortedFilteredPackets = useMemo(() => {
    return [...filteredPackets].sort((a, b) => {
      if (!a.time || !b.time) return 0;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });
  }, [filteredPackets]);

  const [visiblePackets, setVisiblePackets] = useState<NetworkPacket[]>([]);

  useEffect(() => {
    if (!isAnyTrafficActive) {
      setVisiblePackets([]);
      onSelectPacket(null);
      return;
    }
    const latestPackets = sortedFilteredPackets.slice(0, 25);
    setVisiblePackets(latestPackets);
    if (latestPackets.length > 0) {
      onSelectPacket(latestPackets[0]);
    } else {
      onSelectPacket(null);
    }
  }, [sortedFilteredPackets, isAnyTrafficActive, onSelectPacket]);

  useEffect(() => {
    if (onTrafficStatusChange) {
      onTrafficStatusChange(isAnyTrafficActive, visiblePackets.length > 0);
    }
  }, [isAnyTrafficActive, visiblePackets.length, onTrafficStatusChange]);

  useEffect(() => {
    if (!isAnyTrafficActive) {
      setVisiblePackets([]);
      return;
    }

    const latestPackets = sortedFilteredPackets.slice(-25);
    setVisiblePackets(latestPackets);

    // This section attempts a sliding window effect but might be simplified
    // if the goal is just to display the latest 25.
    // If you want a smooth animation for each new packet, this logic needs careful
    // comparison against `prev` state of `visiblePackets` to only add new ones.
    // For now, setting latest 25 directly.
  }, [sortedFilteredPackets, isDemoTrafficLive, isLiveTrafficLive]);

  const [newPacketId, setNewPacketId] = useState<number | null>(null);

  useEffect(() => {
    if (visiblePackets.length > 0) {
      setNewPacketId(visiblePackets[0].id);
      const timeout = setTimeout(() => setNewPacketId(null), 1000);
      return () => clearTimeout(timeout);
    }
  }, [visiblePackets]);

  // --- MODIFIED Check Live Monitor API health and Poll backend status ---
  useEffect(() => {
    let consecutivePollFails = 0; // Separate counter for API polling

    const checkAndPollBackend = async () => {
      try {
        // Check general API health (fast check)
        const healthResponse = await fetch(`${LIVE_MONITOR_API_URL}/`);
        setIsLiveMonitorApiConnected(healthResponse.ok);

        // Poll for live status (more detailed status)
        const statusResponse = await axios.get('http://localhost:8000/status');
        console.log('[Frontend Poll] live_running:', statusResponse.data.live_running);

        if (statusResponse.data.live_running) {
          consecutivePollFails = 0; // Reset consecutive fails on success
          setIsLiveTrafficLive(true);
          if (!liveTrafficStartTime) {
            setLiveTrafficStartTime(new Date());
          }
          lastSuccessfulBackendCheck.current = Date.now(); // Mark successful communication
          setNetworkConnectionError(null); // Clear any connection errors
        } else {
          // If backend reports not running, allow it to stop
          consecutivePollFails++;
          if (consecutivePollFails >= 2) {
            setIsLiveTrafficLive(false);
            setLiveTrafficStartTime(null);
          }
          // Do not set networkConnectionError here, allow it to clear if status is 'not running'
          // but connection is fine.
        }
      } catch (backendError: any) {
        setIsLiveMonitorApiConnected(false); // Immediate connection status reflects failure
        consecutivePollFails++;
        console.error('[Frontend Poll] Error:', backendError);

        // Only set the network connection error if traffic is supposed to be live
        // AND the connection has been down for a threshold period.
        if (isLiveTrafficLive && (Date.now() - lastSuccessfulBackendCheck.current > 5000)) { // 5-second threshold
          setNetworkConnectionError('Network Error: Could not connect to live traffic backend. Please ensure the Python server is running.');
        } else if (!isLiveTrafficLive) {
          // If live traffic is not active, clear any persistent errors.
          setNetworkConnectionError(null);
        }

        // If polling fails consistently, stop live traffic state
        if (consecutivePollFails >= 2) {
            setIsLiveTrafficLive(false);
            setLiveTrafficStartTime(null);
        }
      }
    };

    checkAndPollBackend(); // Initial check
    const intervalId = setInterval(checkAndPollBackend, 2000); // Poll every 2 seconds
    return () => clearInterval(intervalId);
  }, [isLiveTrafficLive, liveTrafficStartTime]); // Re-run if these states change, managing polling behavior

  // Check demo API health and get network interfaces (less frequent poll, not critical for live error display)
  useEffect(() => {
    const initialApiHealthCheck = async () => {
      try {
        const isHealthy = await UpdatedDemoTrafficApi.checkHealth();
        setIsDemoApiConnected(isHealthy);
        if (!isHealthy) {
          // Set a connection error if demo API isn't connected on startup
          setNetworkConnectionError('Demo Traffic API is not available. Please start the Python backend.');
        } else {
          // Clear it if it was previously set and is now healthy
          setNetworkConnectionError(null);
        }
      } catch (e) {
        setNetworkConnectionError('Failed to connect to Demo Traffic API.');
      }
    };
    initialApiHealthCheck(); // Run once on mount

    // Fetch initial demo and live traffic statuses, and network interfaces
    // This part runs regardless of connection status, but handles errors locally
    const fetchData = async () => {
      if (isDemoApiConnected) { // Only fetch if connected to demo API
        try {
          const demoStatus = await UpdatedDemoTrafficApi.getDemoTrafficStatus();
          setIsDemoTrafficLive(demoStatus.running);
          if (demoStatus.webhook_url) setWebhookUrl(demoStatus.webhook_url);
          setCsvFileExists(!!demoStatus.csv_file);
        } catch (e) { console.error('Failed to get demo traffic status:', e); }
      }

      if (isLiveMonitorApiConnected) { // Only fetch if connected to live API
        try {
          const liveStatus = await LiveTrafficApi.getLiveTrafficStatus();
          // isLiveTrafficLive is primarily managed by the polling useEffect now
          if (liveStatus.interface) setSelectedInterface(liveStatus.interface);
          setLiveTrafficStats({
            packet_count: liveStatus.packet_count,
            flows_count: liveStatus.flows_count,
            uptime: liveStatus.uptime
          });
        } catch (e) { console.error('Failed to get live traffic status:', e); }

        try {
          const interfacesResponse = await LiveTrafficApi.getNetworkInterfaces();
          setAvailableInterfaces(interfacesResponse.interfaces);
          setInterfaceFriendlyNames(interfacesResponse.friendly_names || {});
          if (interfacesResponse.default && !selectedInterface) setSelectedInterface(interfacesResponse.default);
        } catch (e) { console.error('Failed to get network interfaces:', e); }
      }
    };

    fetchData();
    const refreshInterval = setInterval(fetchData, 10000); // Refresh data every 10 seconds
    return () => clearInterval(refreshInterval);
  }, [isDemoApiConnected, isLiveMonitorApiConnected, selectedInterface]); // Dependencies for this useEffect

  // Handler functions updated to use setNetworkConnectionError
  const handleGenerateTraffic = async () => {
    if (!isDemoApiConnected) { setNetworkConnectionError('Demo Traffic API is not available. Please start the Python backend.'); return; }
    setIsLoading(true); setNetworkConnectionError(null);
    try { const response = await UpdatedDemoTrafficApi.generateTraffic(); if (response.success) setCsvFileExists(true); else setNetworkConnectionError(response.message);
    } catch (apiError: any) { setNetworkConnectionError(apiError.message || 'Failed to generate traffic'); } finally { setIsLoading(false); }
  };

  const handleSendCSVOnce = async () => {
    if (!isDemoApiConnected) { setNetworkConnectionError('Demo Traffic API is not available. Please start the Python backend.'); return; }
    setIsLoading(true); setNetworkConnectionError(null);
    try { const response = await UpdatedDemoTrafficApi.sendCSVOnce({ webhookUrl }); if (!response.success) setNetworkConnectionError(response.message);
    } catch (apiError: any) { setNetworkConnectionError(apiError.message || 'Failed to send CSV file'); } finally { setIsLoading(false); }
  };

  const handleStartDemoTraffic = async () => {
    if (!isDemoApiConnected) { setNetworkConnectionError('Demo Traffic API is not available. Please start the Python backend.'); return; }
    setIsLoading(true); setNetworkConnectionError(null);
    try { const response = await UpdatedDemoTrafficApi.startDemoTraffic({ webhookUrl }); if (response.success) setIsDemoTrafficLive(true); else setNetworkConnectionError(response.message);
    } catch (apiError: any) { setNetworkConnectionError(apiError.message || 'Failed to start demo traffic'); } finally { setIsLoading(false); }
  };

  const handleStopDemoTraffic = async () => {
    setIsLoading(true); setNetworkConnectionError(null);
    try { const response = await UpdatedDemoTrafficApi.stopDemoTraffic(); if (response.success) setIsDemoTrafficLive(false); else setNetworkConnectionError(response.message);
    } catch (apiError: any) { setNetworkConnectionError(apiError.message || 'Failed to stop demo traffic'); } finally { setIsLoading(false); }
  };

  const handleStartLiveTraffic = async () => {
    if (!isLiveMonitorApiConnected) { setNetworkConnectionError('Live Monitor API (port 8000) is not connected.'); return; }
    setIsLoading(true); setNetworkConnectionError(null);
    try { const response = await fetch(`${LIVE_MONITOR_API_URL}/start-monitoring`, { method: 'POST', }); const data = await response.json(); if (!response.ok) throw new Error(data.detail || 'Failed to start monitoring.'); setLiveTrafficStartTime(new Date());
    } catch (apiError: any) { setNetworkConnectionError(apiError.message); } finally { setIsLoading(false); }
  };

  const handleStopLiveTraffic = async () => {
    setIsLoading(true); setNetworkConnectionError(null);
    try { const response = await fetch(`${LIVE_MONITOR_API_URL}/stop-monitoring`, { method: 'POST', }); const data = await response.json(); if (!response.ok) throw new Error(data.detail || 'Failed to stop monitoring.'); setLiveTrafficStartTime(null); setLiveTrafficStats({ packet_count: 0, flows_count: 0, uptime: 0 });
    } catch (apiError: any) { setNetworkConnectionError(apiError.message); } finally { setIsLoading(false); }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFriendlyInterfaceName = (interfaceName: string) => {
    return interfaceFriendlyNames[interfaceName] || interfaceName;
  };

  const sortedPackets = useMemo(() => {
    return [...packets].sort((a, b) => {
      if (a.time && b.time) { return new Date(a.time).getTime() - new Date(b.time).getTime(); }
      return a.id - b.id;
    });
  }, [packets]);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-lg border border-green-500/20">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Live Traffic Monitor</h2>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Demo Traffic Controls */}
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400 font-medium">Demo:</div>
            {isDemoTrafficLive ? (
              <button onClick={handleStopDemoTraffic} disabled={isLoading} className="flex items-center space-x-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 rounded-lg text-orange-400 hover:text-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <Square className="w-4 h-4" /> <span className="text-sm font-medium">Stop</span>
              </button>
            ) : (
              <button onClick={handleStartDemoTraffic} disabled={isLoading || !isDemoApiConnected || !csvFileExists} className="flex items-center space-x-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 rounded-lg text-orange-400 hover:text-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <Zap className="w-4 h-4" /> <span className="text-sm font-medium">{isLoading ? 'Starting...' : 'Start'}</span>
              </button>
            )}
          </div>

          {/* Live Traffic Controls */}
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400 font-medium">Live:</div>
            {isLiveTrafficLive ? (
              <button onClick={handleStopLiveTraffic} disabled={isLoading} className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <Square className="w-4 h-4" /> <span className="text-sm font-medium">Stop</span>
              </button>
            ) : (
              <button onClick={handleStartLiveTraffic} disabled={isLoading || !isLiveMonitorApiConnected} className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 rounded-lg text-green-400 hover:text-green-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <Network className="w-4 h-4" /> <span className="text-sm font-medium">{isLoading ? 'Starting...' : 'Start'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Configuration & Status - MODIFIED ERROR DISPLAY */}
      <div className="mb-4 space-y-3">
        {(error || networkConnectionError) && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{error || networkConnectionError}</span>
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
              <div><span className="text-gray-400">ID:</span><span className="text-cyan-400 font-mono ml-1">{currentPacket.id}</span></div>
              <div><span className="text-gray-400">Time:</span><span className="text-cyan-400 font-mono ml-1">{formatTimeHHMMSS(currentPacket.time)}</span></div>
              <div><span className="text-gray-400">Src:</span><span className="text-cyan-400 font-mono ml-1">{currentPacket.sourceIP}</span></div>
              <div><span className="text-gray-400">Dst:</span><span className="text-cyan-400 font-mono ml-1">{currentPacket.destinationIP}</span></div>
              <div><span className="text-gray-400">Proto:</span><span className="text-cyan-400 font-mono ml-1">{getProtocolName(currentPacket.protocol, currentPacket.srcPort, currentPacket.dstPort)}</span></div>
              <div><span className="text-gray-400">Src Port:</span><span className="text-cyan-400 font-mono ml-1">{currentPacket.srcPort}</span></div>
              <div><span className="text-gray-400">Dst Port:</span><span className="text-cyan-400 font-mono ml-1">{currentPacket.dstPort}</span></div>
              <div><span className="text-gray-400">Label:</span><span className="text-cyan-400 font-mono ml-1">{getAttackDetectionLabel(currentPacket.attack_type, currentPacket.label)}</span></div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {loading && visiblePackets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 px-3 text-center text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading packets...</span>
                    </div>
                  </td>
                </tr>
              ) : visiblePackets.length === 0 && isAnyTrafficActive ? (
                <tr>
                  <td colSpan={10} className="py-8 px-3 text-center text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <Info className="w-4 h-4" />
                      <span>Monitoring active, waiting for packets...</span>
                    </div>
                  </td>
                </tr>
              ) : visiblePackets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 px-3 text-center text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <Database className="w-4 h-4" />
                      <span>No packets found. Start demo or live traffic.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                visiblePackets.map((packet) => (
                  <tr key={packet.id}
                      className={`hover:bg-gray-800/30 transition-colors bg-cyan-500/5 ${packet.id === newPacketId ? 'animate-pulse bg-green-900/40' : ''}`}
                      onClick={() => onSelectPacket(packet)}
                  >
                    <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.id}</td>
                    <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{formatTimeHHMMSS(packet.time)}</td>
                    <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.sourceIP}</td>
                    <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{packet.destinationIP}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">{getProtocolName(packet.protocol, packet.srcPort, packet.dstPort)}</span>
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
    </div>
  );
};

export default LiveTrafficMonitor;