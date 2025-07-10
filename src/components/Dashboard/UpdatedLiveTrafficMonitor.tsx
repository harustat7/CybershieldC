import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Play, Square, Zap, Network, AlertCircle, ExternalLink, RefreshCw, Send, Upload } from 'lucide-react';
import { NetworkPacket } from '../../types';
import { useRealTimePackets } from '../../hooks/useRealTimeData';
import { UpdatedDemoTrafficApi } from '../../services/updatedDemoTrafficApi';

const UpdatedLiveTrafficMonitor: React.FC = () => {
  const [isDemoTrafficLive, setIsDemoTrafficLive] = useState(false);
  const [isLiveTrafficLive, setIsLiveTrafficLive] = useState(false);
  const [isDemoApiConnected, setIsDemoApiConnected] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://metasage-ai.app.n8n.cloud/webhook-test/79975fb8-b60c-4261-a447-77ab1df4d99c');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvFileExists, setCsvFileExists] = useState(false);
  const [packets] = useRealTimePackets(25, isDemoTrafficLive || isLiveTrafficLive);

  // Check demo API health on component mount
  useEffect(() => {
    const checkDemoApiHealth = async () => {
      const isHealthy = await UpdatedDemoTrafficApi.checkHealth();
      setIsDemoApiConnected(isHealthy);
      
      if (isHealthy) {
        // Get current status
        try {
          const status = await UpdatedDemoTrafficApi.getDemoTrafficStatus();
          setIsDemoTrafficLive(status.running);
          if (status.webhook_url) {
            setWebhookUrl(status.webhook_url);
          }
          setCsvFileExists(!!status.csv_file);
        } catch (error) {
          console.error('Failed to get demo traffic status:', error);
        }
      }
    };

    checkDemoApiHealth();
    
    // Check health every 30 seconds
    const healthInterval = setInterval(checkDemoApiHealth, 30000);
    
    return () => clearInterval(healthInterval);
  }, []);

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

  const handleStartLiveTraffic = () => {
    setIsLiveTrafficLive(true);
  };

  const handleStopLiveTraffic = () => {
    setIsLiveTrafficLive(false);
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

  const isAnyTrafficActive = isDemoTrafficLive || isLiveTrafficLive;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-lg border border-green-500/20">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Live Traffic Monitor</h2>
            <p className="text-sm text-gray-400">Real-time network packets</p>
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
                className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200"
              >
                <Square className="w-4 h-4" />
                <span className="text-sm font-medium">Stop</span>
              </button>
            ) : (
              <button
                onClick={handleStartLiveTraffic}
                className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 rounded-lg text-green-400 hover:text-green-300 transition-all duration-200"
              >
                <Network className="w-4 h-4" />
                <span className="text-sm font-medium">Start</span>
              </button>
            )}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2 border-l border-gray-700 pl-4">
            <Wifi className={`w-5 h-5 ${isAnyTrafficActive ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
            <div className="text-sm">
              <div className={`font-medium ${isAnyTrafficActive ? 'text-green-400' : 'text-gray-400'}`}>
                {isAnyTrafficActive ? 'Active' : 'Stopped'}
              </div>
              <div className="text-xs text-gray-400">
                {isDemoTrafficLive && isLiveTrafficLive ? 'Both' : 
                 isDemoTrafficLive ? 'Demo' : 
                 isLiveTrafficLive ? 'Live' : 'None'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo API Status & Configuration */}
      <div className="mb-4 space-y-3">
        {/* API Status */}
        <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${isDemoApiConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-300">
              Demo API: {isDemoApiConnected ? 'Connected' : 'Disconnected'}
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
        </div>

        {/* CSV File Status */}
        <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
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
        </div>

        {/* Webhook Configuration */}
        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">n8n Webhook URL:</label>
            <span className="text-xs text-gray-400">CSV File Upload Destination</span>
          </div>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            disabled={isDemoTrafficLive}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="https://metasage-ai.app.n8n.cloud/webhook-test/79975fb8-b60c-4261-a447-77ab1df4d99c"
          />
          <div className="mt-2 text-xs text-blue-400 flex items-center space-x-1">
            <Upload className="w-3 h-3" />
            <span>Uploads CSV file as multipart/form-data</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-track-gray-800/30 scrollbar-thumb-gray-600/50">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Time</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Source IP</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Dest IP</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Protocol</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Size</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Port</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Flags</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Status</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Country</th>
                <th className="text-left py-3 px-3 text-gray-300 font-medium whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {packets.map((packet, index) => (
                <tr 
                  key={packet.id}
                  className={`hover:bg-gray-800/30 transition-colors ${
                    index === 0 && isAnyTrafficActive ? 'bg-cyan-500/5 animate-pulse' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">
                    {packet.timestamp}
                  </td>
                  <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">
                    {packet.sourceIP}
                  </td>
                  <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">
                    {packet.destinationIP}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                      {packet.protocol}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">
                    {packet.packetSize}B
                  </td>
                  <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">
                    {packet.port}
                  </td>
                  <td className="py-2 px-3 text-gray-300 font-mono text-xs whitespace-nowrap">
                    {packet.flags}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded border ${getStatusBg(packet.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusColor(packet.status)} ${isAnyTrafficActive ? 'animate-pulse' : ''}`}></span>
                      <span className={getStatusColor(packet.status)}>{packet.status}</span>
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-300 text-xs whitespace-nowrap">
                    {packet.country}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded border ${
                      packet.action === 'Allow' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {packet.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span>Showing {packets.length} recent packets</span>
        <div className="flex items-center space-x-4">
          {isDemoTrafficLive && (
            <span className="flex items-center space-x-1">
              <Upload className="w-3 h-3 text-orange-400" />
              <span>Demo active → CSV file → n8n</span>
            </span>
          )}
          {isLiveTrafficLive && (
            <span className="flex items-center space-x-1">
              <Network className="w-3 h-3 text-green-400" />
              <span>Live monitoring active</span>
            </span>
          )}
          {!isAnyTrafficActive && (
            <span>Traffic monitoring stopped</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatedLiveTrafficMonitor;