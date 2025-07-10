import React, { useState } from 'react';
import { History, Search, Filter, Clock, Server, AlertCircle } from 'lucide-react';
import { AttackHistoryItem } from '../../types';
import { generateMockAttackHistory } from '../../utils/mockData';

const AttackHistoryLogs: React.FC = () => {
  const [logs] = useState<AttackHistoryItem[]>(generateMockAttackHistory());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.attackType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.affectedHost.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.sourceIP.includes(searchTerm);
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: AttackHistoryItem['severity']) => {
    switch (severity) {
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

  const getStatusColor = (status: AttackHistoryItem['status']) => {
    switch (status) {
      case 'Blocked':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'Monitored':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Investigating':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <History className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Attack History Logs</h2>
            <p className="text-sm text-gray-400">Security incident timeline</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-white font-medium">{filteredLogs.length} incidents</p>
          <p className="text-xs text-gray-400">Last 24 hours</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search attacks, hosts, or IPs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="pl-10 pr-8 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors text-sm appearance-none cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-gray-800/30 scrollbar-thumb-gray-600/50">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30 hover:border-gray-600/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <h3 className="text-white font-medium">{log.attackType}</h3>
                  <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Server className="w-3 h-3" />
                      <span>{log.affectedHost}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded border ${getSeverityColor(log.severity)}`}>
                  {log.severity}
                </span>
                <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(log.status)}`}>
                  {log.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Source: <span className="text-cyan-400 font-mono">{log.sourceIP}</span></span>
              <span className="text-gray-400">ID: <span className="text-gray-300 font-mono">{log.id.substring(0, 8)}</span></span>
            </div>
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No incidents found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default AttackHistoryLogs;