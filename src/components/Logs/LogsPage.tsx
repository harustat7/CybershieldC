// export default LogsPage;
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../lib/supabase'; // Make sure this path is correct
import { NetworkPacket, SupabasePacket } from '../../types/index'; // Make sure this path is correct
import Navbar from '../Dashboard/Navbar';
import { RefreshCw, AlertTriangle, Database } from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import AttackTypeDropdown from '../Common/AttackTypeDropdown';


interface LogsPageProps {
  onLogout: () => void;
}

const formatTimeHHMMSS = (dateTimeString?: string | null) => {
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


const LogsPage: React.FC<LogsPageProps> = ({ onLogout }) => {
  // State for holding the logs, loading status, and any potential errors
  const [logs, setLogs] = useState<NetworkPacket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add search and filter state
  const [search, setSearch] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');

  // Add time window state
  const [timeWindowHours, setTimeWindowHours] = useState(2);

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 25; // Show 25 logs per page

  // Add state for total count from database
  const [totalLogsInDB, setTotalLogsInDB] = useState<number | null>(null);

  // Add state for fetching all logs
  const [isFetchingAll, setIsFetchingAll] = useState(false);

  // Compute filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Global search: match any field as string
      const matchesSearch = search === '' || Object.values(log).some(val =>
        val && val.toString().toLowerCase().includes(search.toLowerCase())
      );
      // Protocol filter
      const matchesProtocol = protocolFilter === '' || log.protocol === protocolFilter;
      // Label filter
      const matchesLabel = labelFilter === '' || (log.label && log.label.toString() === labelFilter);
      return matchesSearch && matchesProtocol && matchesLabel;
    });
  }, [logs, search, protocolFilter, labelFilter]);

  // Compute paginated logs
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + logsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, protocolFilter, labelFilter, timeWindowHours]);


  // Use a ref to hold the subscription channel to prevent duplicate listeners
  const channelRef = useRef<RealtimeChannel | null>(null);


  /**
   * Transforms a raw packet object from Supabase into the client-side NetworkPacket format.
   */
  const transformPacket = (supabasePacket: SupabasePacket): NetworkPacket => {
    const getStatus = (label: string | null): 'normal' | 'suspicious' | 'malicious' => {
      if (!label) return 'normal';
      const l = label.toLowerCase();
      if (l.includes('normal') || l.includes('benign')) return 'normal';
      if (l.includes('dos') || l.includes('ddos') || l.includes('attack')) return 'malicious';
      if (l.includes('apt') || l.includes('suspicious')) return 'suspicious';
      return 'normal';
    };
    return {
      id: supabasePacket.id,
      time: supabasePacket.time,
      sourceIP: supabasePacket.src_ip,
      destinationIP: supabasePacket.dest_ip,
      protocol: supabasePacket.protocol.toUpperCase(),
      srcPort: Number(supabasePacket.src_port),
      dstPort: Number(supabasePacket.dst_port),
      flowDuration: Number(supabasePacket.flow_duration),
      label: supabasePacket.label,
      status: getStatus(supabasePacket.label),
      attack_type: supabasePacket.attack_type,
    };
  };


  /**
   * Fetches all logs from the 'common_data' table that occurred within the last two hours.
   */
  const fetchLogs = async () => {
    // Only show the main loading spinner on the very first fetch
    if (!logs.length) {
        setLoading(true);
    }
    setError(null);
    setIsFetchingAll(true);

    // Replace time string logic with ISO timestamp logic
    const now = new Date();
    const windowAgo = new Date(now.getTime() - timeWindowHours * 60 * 60 * 1000);
    const nowIso = now.toISOString();
    const windowAgoIso = windowAgo.toISOString();

    console.log(`Fetching logs from ${windowAgoIso} to ${nowIso} (${timeWindowHours} hours)`);

    try {
      // First, get the total count
      const { count, error: countError } = await supabase
        .from('common_data')
        .select('*', { count: 'exact', head: true })
        .gte('time', windowAgoIso);

      if (countError) {
        console.warn('Could not get total count:', countError);
      } else {
        console.log(`Total logs in time window: ${count}`);
        setTotalLogsInDB(count);
      }

      // Fetch all logs in batches of 1000 (Supabase limit)
      const allLogs: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data, error: dbError } = await supabase
          .from('common_data')
          .select('*')
          .gte('time', windowAgoIso)
          .order('id', { ascending: false })
          .range(offset, offset + batchSize - 1);

        if (dbError) throw dbError;
        
        if (!data || data.length === 0) break;
        
        allLogs.push(...data);
        console.log(`Fetched batch ${Math.floor(offset / batchSize) + 1}: ${data.length} logs`);
        
        if (data.length < batchSize) break; // Last batch
        offset += batchSize;
      }

      console.log(`Total fetched: ${allLogs.length} logs`);

      const transformedLogs = allLogs.map(transformPacket);
      setLogs(transformedLogs);

    } catch (err: any) {
      console.error('Error fetching attack logs:', err);
      setError(err.message || 'An unknown error occurred while fetching logs.');
    } finally {
      setLoading(false);
      setIsFetchingAll(false);
    }
  };


  // This effect now handles the initial fetch, real-time updates, and periodic refreshing.
  useEffect(() => {
    // 1. Fetch the initial data.
    fetchLogs();


    // 2. Set up the real-time subscription to add new logs to the top.
    const handleInsert = (payload: { new: SupabasePacket }) => {
        console.log('New real-time log received!', payload.new.id);
        const newLog = transformPacket(payload.new);
        // Add the new log to the top of the existing list.
        setLogs(currentLogs => [newLog, ...currentLogs]);
    };


    const channel = supabase
      .channel('rt-logs-page')
      .on<SupabasePacket>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'common_data' },
        handleInsert
      )
      .subscribe();
   
    channelRef.current = channel;


    // 3. Set up an interval to periodically re-fetch the entire list.
    // This ensures that logs older than 2 hours are removed from the view.
    const refreshInterval = setInterval(() => {
        console.log('Refreshing 2-hour log window...');
        fetchLogs();
    }, 60000); // Refresh every 60 seconds.


    // 4. Cleanup function to run when the component unmounts.
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      clearInterval(refreshInterval);
    };
  }, []); // The empty dependency array `[]` ensures this effect runs only once.


  // Refetch logs when timeWindowHours changes
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [timeWindowHours]);


  return (
    <div className="min-h-screen bg-gray-950">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-gray-950 to-purple-950/20 -z-10">
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23374151" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20`}></div>
        <div className="absolute top-20 left-10 w-32 h-32 border border-cyan-500/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 border border-purple-500/10 rounded-full animate-bounce"></div>
      </div>


      <div className="relative z-10">
        <Navbar onLogout={onLogout} />
       
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Traffic Logs</h1>
                <p className="text-gray-400">View and analyze all traffic logs from the last {timeWindowHours} hour{timeWindowHours > 1 ? 's' : ''}.</p>
            </div>
            <button
                onClick={fetchLogs}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 text-white rounded-lg transition-colors disabled:opacity-50"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
            </button>
          </div>


          <div className="mb-6">
            {loading ? (
              <div className="text-center p-12 bg-gray-900/50 rounded-lg">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
                <p className="mt-4 text-gray-400">Loading historical logs...</p>
              </div>
            ) : error ? (
              <div className="text-center p-12 bg-red-900/20 border border-red-500/30 rounded-lg">
                <AlertTriangle className="w-8 h-8 mx-auto text-red-400" />
                <p className="mt-4 text-red-300">Error Loading Logs</p>
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={fetchLogs} className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-white rounded">
                  Try Again
                </button>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center p-12 bg-gray-900/50 rounded-lg">
                <Database className="w-8 h-8 mx-auto text-gray-500" />
                <p className="mt-4 text-gray-400">No traffic logs found in the last {timeWindowHours} hour{timeWindowHours > 1 ? 's' : ''}.</p>
              </div>
            ) : (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
                <div className="overflow-x-auto">
                  <div className="flex flex-wrap gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Search all fields..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:border-cyan-500"
                      style={{ minWidth: 200 }}
                    />
                    <select
                      value={protocolFilter}
                      onChange={e => setProtocolFilter(e.target.value)}
                      className="px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">All Protocols</option>
                      {[...new Set(logs.map(l => l.protocol))].filter(Boolean).map(proto => (
                        <option key={proto} value={proto}>{proto}</option>
                      ))}
                    </select>
                    <select
                      value={labelFilter}
                      onChange={e => setLabelFilter(e.target.value)}
                      className="px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">All Labels</option>
                      {[...new Set(logs.map(l => l.label))].filter(Boolean).map(label => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </select>
                    {/* Time window dropdown */}
                    <select
                      value={timeWindowHours}
                      onChange={e => setTimeWindowHours(Number(e.target.value))}
                      className="px-3 py-2 rounded border border-cyan-700 bg-cyan-900 text-cyan-200 text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value={1}>Last 1 hour</option>
                      <option value={2}>Last 2 hours</option>
                      <option value={4}>Last 4 hours</option>
                      <option value={8}>Last 8 hours</option>
                      <option value={12}>Last 12 hours</option>
                      <option value={24}>Last 24 hours</option>
                    </select>
                  </div>
                  {/* Debug info - show time range */}
                  <div className="mb-4 p-3 bg-gray-800/30 rounded border border-gray-600/30">
                    <p className="text-xs text-gray-400">
                      Showing logs from {new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toLocaleString()} to {new Date().toLocaleString()} 
                      {isFetchingAll && <span className="text-cyan-400"> • Fetching all logs...</span>}
                    </p>
                  </div>
                  <table className="w-full text-sm">
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
                        <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Label</th>
                        <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                      {paginatedLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-800/30 transition-colors bg-cyan-500/5">
                          <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{log.id}</td>
                          <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{formatTimeHHMMSS(log.time)}</td>
                          <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{log.sourceIP}</td>
                          <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{log.destinationIP}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">{log.protocol}</span>
                          </td>
                          <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{log.flowDuration}</td>
                          <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{log.srcPort}</td>
                          <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{log.dstPort}</td>
                          <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">{log.label ?? 'N/A'}</td>
                          <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">
                            <AttackTypeDropdown 
                              packetId={log.id.toString()} 
                              size="sm" 
                              onFlag={(attackType) => {
                                console.log(`Flagged packet ${log.id} as ${attackType}`);
                                // You can add API call here to save the flag
                              }} 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        Showing {startIndex + 1}-{Math.min(startIndex + logsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm bg-gray-700/50 text-gray-300 border border-gray-600 rounded hover:bg-gray-600/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-400">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm bg-gray-700/50 text-gray-300 border border-gray-600 rounded hover:bg-gray-600/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;


// import React, { useState, useEffect } from 'react';
// import { 
//   FileText, 
//   Search, 
//   Filter, 
//   Clock, 
//   Server, 
//   AlertCircle,
//   Download,
//   RefreshCw,
//   Eye,
//   Shield,
//   Activity
// } from 'lucide-react';
// import Navbar from '../Dashboard/Navbar';
// import { useSupabasePackets } from '../../hooks/useSupabasePackets';
// import AttackTypeDropdown from '../Common/AttackTypeDropdown';
// import { ApiService } from '../../services/api';
// import { FlagRequest } from '../../types';

// interface LogsPageProps {
//   onLogout: () => void;
// }

// const LogsPage: React.FC<LogsPageProps> = ({ onLogout }) => {
//   // State for settings
//   const [maxPackets, setMaxPackets] = useState(() => Number(localStorage.getItem('cybershield_maxPackets')) || 500);
//   const [packetRetention, setPacketRetention] = useState(() => Number(localStorage.getItem('cybershield_packetRetention')) || 2);
//   // Listen for changes in localStorage
//   useEffect(() => {
//     const handleStorage = () => {
//       setMaxPackets(Number(localStorage.getItem('cybershield_maxPackets')) || 500);
//       setPacketRetention(Number(localStorage.getItem('cybershield_packetRetention')) || 2);
//     };
//     window.addEventListener('storage', handleStorage);
//     return () => window.removeEventListener('storage', handleStorage);
//   }, []);
//   // Fetch packets using maxPackets
//   const { packets, loading, error } = useSupabasePackets(maxPackets, true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const logsPerPage = 20;

//   // Filter for last N hours (packetRetention)
//   const now = new Date();
//   const lastNPackets = packets.filter(p => {
//     if (!p.time) return false;
//     const packetTime = new Date(`1970-01-01T${p.time.length === 8 ? p.time : p.time.split('.')[0]}`);
//     return now.getTime() - packetTime.getTime() < packetRetention * 60 * 60 * 1000;
//   });

//   // Search by label, source, dest, protocol, etc.
//   const filteredPackets = lastNPackets.filter(p => {
//     const search = searchTerm.toLowerCase();
//     return (
//       (p.label || '').toLowerCase().includes(search) ||
//       p.sourceIP.includes(search) ||
//       p.destinationIP.includes(search) ||
//       p.protocol.toLowerCase().includes(search)
//     );
//   });

//   const totalPages = Math.ceil(filteredPackets.length / logsPerPage);
//   const startIndex = (currentPage - 1) * logsPerPage;
//   const paginatedPackets = filteredPackets.slice(startIndex, startIndex + logsPerPage);

//   const handleRefresh = async () => {
//     // No refresh logic needed here as data is fetched on mount
//   };

//   const handleExportLogs = () => {
//     const csvContent = [
//       'Timestamp,Source IP,Destination IP,Traffic Type,Port,Action,Details,Confidence',
//       ...filteredPackets.map(p => 
//         `${p.time},${p.sourceIP},${p.destinationIP},${p.protocol},${p.flowDuration},${p.srcPort},${p.dstPort},${p.label},${p.userFlagged?.attackType || 'N/A'}`
//       )
//     ].join('\n');
    
//     const blob = new Blob([csvContent], { type: 'text/csv' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `cybershield-logs-${new Date().toISOString().split('T')[0]}.csv`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const handleFlagLog = async (packet: any, attackType: string) => {
//     try {
//       const flagData: FlagRequest = {
//         packetId: packet.id,
//         attackType,
//         originalPrediction: packet.label,
//         confidence: 100, // Assuming 100% confidence for now
//         timestamp: packet.time,
//         sourceIP: packet.sourceIP,
//         destinationIP: packet.destinationIP,
//         protocol: packet.protocol,
//         port: packet.srcPort // Assuming srcPort is the port
//       };

//       await ApiService.flagPacket(flagData);
//       console.log('Packet flagged successfully');
//     } catch (error) {
//       console.error('Failed to flag packet:', error);
//     }
//   };

//   const getActionColor = (action: string) => {
//     // This function is no longer directly applicable as we are not using LogEntry['action']
//     // For now, we'll return a default or remove if not needed.
//     // Since we are using 'label' for the 'Action' column, we can't have specific colors here.
//     // For now, we'll return a generic color.
//     return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
//   };

//   const getTrafficTypeColor = (trafficType: string) => {
//     if (trafficType === 'Malicious') {
//       return 'text-red-400 bg-red-500/10 border-red-500/20';
//     }
//     return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
//   };

//   return (
//     <div className="min-h-screen bg-gray-950">
//       {/* Animated Background */}
//       <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-gray-950 to-purple-950/20">
//         <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23374151" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20`}></div>
        
//         {/* Floating Elements */}
//         <div className="absolute top-20 left-10 w-32 h-32 border border-cyan-500/10 rounded-full animate-pulse"></div>
//         <div className="absolute bottom-20 right-10 w-24 h-24 border border-purple-500/10 rounded-full animate-bounce"></div>
//         <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-cyan-400/30 rounded-full animate-ping"></div>
//         <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-400/30 rounded-full animate-ping delay-700"></div>
//       </div>

//       {/* Content */}
//       <div className="relative z-10">
//         <Navbar onLogout={onLogout} />
        
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           {/* Header */}
//           <div className="mb-8">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-3">
//                 <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/25">
//                   <FileText className="w-6 h-6 text-white" />
//                 </div>
//                 <div>
//                   <h1 className="text-3xl font-bold text-white">Security Logs</h1>
//                   {/* <p className="text-gray-400">Network traffic analysis and monitoring</p> */}
//                 </div>
//               </div>
              
//               <div className="flex items-center space-x-4">
//                 <button
//                   onClick={handleRefresh}
//                   disabled={loading}
//                   className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-600/50 hover:text-white transition-colors disabled:opacity-50"
//                 >
//                   <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
//                   <span>Refresh</span>
//                 </button>
                
//                 <button
//                   onClick={handleExportLogs}
//                   className="flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors"
//                 >
//                   <Download className="w-4 h-4" />
//                   <span>Export CSV</span>
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Filters and Search */}
//           <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 mb-6">
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//               <div className="relative w-full">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search logs..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors text-sm"
//                 />
//               </div>
//               <div className="text-sm text-gray-400 md:ml-4 flex-shrink-0 flex items-center justify-end w-full md:w-auto">
//                 <span>Showing {paginatedPackets.length} of {filteredPackets.length} packets</span>
//               </div>
//             </div>
//           </div>

//           {/* Logs Table */}
//           <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead className="bg-gray-800/50 border-b border-gray-700/50">
//                   <tr>
//                     <th className="text-left py-4 px-4 text-gray-300 font-medium">Time</th>
//                     <th className="text-left py-4 px-4 text-gray-300 font-medium">Source IP</th>
//                     <th className="text-left py-4 px-4 text-gray-300 font-medium">Destination IP</th>
//                     <th className="text-left py-4 px-4 text-gray-300 font-medium">Protocol</th>
//                     <th className="text-left py-4 px-4 text-gray-300 font-medium">Flow Duration</th>
//                     <th className="text-left py-4 px-4 text-gray-300 font-medium">Src Port</th>
//                     <th className="text-left py-4 px-4 text-gray-300 font-medium">Dst Port</th>
//                     <th className="text-left py-4 px-4 text-gray-300 font-medium">Label</th>
//                     <th className="text-left py-4 px-4 text-gray-300 font-medium">Flag</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-700/30">
//                   {loading ? (
//                     <tr><td colSpan={9} className="py-8 text-center text-gray-400">Loading...</td></tr>
//                   ) : error ? (
//                     <tr><td colSpan={9} className="py-8 text-center text-red-400">{error}</td></tr>
//                   ) : paginatedPackets.length === 0 ? (
//                     <tr><td colSpan={9} className="py-8 text-center text-gray-400">No packets found</td></tr>
//                   ) : (
//                     paginatedPackets.map((p) => (
//                       <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
//                         <td className="py-3 px-4 text-cyan-400 font-mono text-xs">{p.time ?? 'N/A'}</td>
//                         <td className="py-3 px-4 text-gray-300 font-mono text-xs">{p.sourceIP}</td>
//                         <td className="py-3 px-4 text-gray-300 font-mono text-xs">{p.destinationIP}</td>
//                         <td className="py-3 px-4 text-gray-300 font-mono text-xs">{p.protocol}</td>
//                         <td className="py-3 px-4 text-gray-300 font-mono text-xs">{p.flowDuration}</td>
//                         <td className="py-3 px-4 text-gray-300 font-mono text-xs">{p.srcPort}</td>
//                         <td className="py-3 px-4 text-gray-300 font-mono text-xs">{p.dstPort}</td>
//                         <td className="py-3 px-4 text-orange-400 font-mono text-xs">{p.label ?? 'N/A'}</td>
//                         <td className="py-3 px-4">
//                           <AttackTypeDropdown packetId={p.id.toString()} size="sm" onFlag={() => {}} />
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination */}
//             {totalPages > 1 && (
//               <div className="bg-gray-800/30 border-t border-gray-700/50 px-6 py-4">
//                 <div className="flex items-center justify-between">
//                   <div className="text-sm text-gray-400">
//                     Page {currentPage} of {totalPages}
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <button
//                       onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
//                       disabled={currentPage === 1}
//                       className="px-3 py-1 text-sm bg-gray-700/50 text-gray-300 border border-gray-600 rounded hover:bg-gray-600/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       Previous
//                     </button>
//                     <button
//                       onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
//                       disabled={currentPage === totalPages}
//                       className="px-3 py-1 text-sm bg-gray-700/50 text-gray-300 border border-gray-600 rounded hover:bg-gray-600/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       Next
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LogsPage;