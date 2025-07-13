import React, { useState } from 'react';
import { History, Search, Filter, Clock, Server, AlertCircle } from 'lucide-react';
import { useSupabasePackets } from '../../hooks/useSupabasePackets';

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

const AttackHistoryLogs: React.FC = () => {
  // Fetch up to 500 packets (adjust as needed)
  const { packets, loading, error } = useSupabasePackets(500, true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter for last 24 hours
  const now = new Date();
  const last24hPackets = packets.filter(p => {
    if (!p.time) return false;
    const packetTime = new Date(`1970-01-01T${p.time.length === 8 ? p.time : p.time.split('.')[0]}`); // fallback for HH:MM:SS
    return now.getTime() - packetTime.getTime() < 24 * 60 * 60 * 1000;
  });

  // Search by label, source, dest, protocol, etc.
  const filteredPackets = last24hPackets.filter(p => {
    const search = searchTerm.toLowerCase();
    return (
      (p.label || '').toLowerCase().includes(search) ||
      p.sourceIP.includes(search) ||
      p.destinationIP.includes(search) ||
      p.protocol.toLowerCase().includes(search)
    );
  });

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <History className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Attack History Logs</h2>
            {/* <p className="text-sm text-gray-400">Security incident timeline (last 24 hours)</p> */}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-white font-medium">{filteredPackets.length} packets</p>
          <p className="text-xs text-gray-400">Last 24 hours</p>
        </div>
      </div>

      {/* Search */}
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

      {/* Table of packets */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-track-gray-800/30 scrollbar-thumb-gray-600/50">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="py-2 px-3 text-gray-300 font-medium">Time</th>
              <th className="py-2 px-3 text-gray-300 font-medium">Source IP</th>
              <th className="py-2 px-3 text-gray-300 font-medium">Dest IP</th>
              <th className="py-2 px-3 text-gray-300 font-medium">Protocol</th>
              <th className="py-2 px-3 text-gray-300 font-medium">Flow Duration</th>
              <th className="py-2 px-3 text-gray-300 font-medium">Src Port</th>
              <th className="py-2 px-3 text-gray-300 font-medium">Dst Port</th>
              <th className="py-2 px-3 text-gray-300 font-medium">Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {loading ? (
              <tr><td colSpan={8} className="py-8 text-center text-gray-400">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={8} className="py-8 text-center text-red-400">{error}</td></tr>
            ) : filteredPackets.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-gray-400">No packets found</td></tr>
            ) : (
              filteredPackets.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-2 px-3 text-cyan-400 font-mono whitespace-nowrap">{formatTimeHHMMSS(p.time)}</td>
                  <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.sourceIP}</td>
                  <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.destinationIP}</td>
                  <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.protocol}</td>
                  <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.flowDuration}</td>
                  <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.srcPort}</td>
                  <td className="py-2 px-3 text-gray-300 font-mono whitespace-nowrap">{p.dstPort}</td>
                  <td className="py-2 px-3 text-orange-400 font-mono whitespace-nowrap">{p.label ?? 'N/A'}</td>
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