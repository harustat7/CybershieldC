import React from 'react';
import Navbar from './Navbar';
import LiveTrafficMonitor from './LiveTrafficMonitor';
import AIAttackDetection from './AIAttackDetection';
import AttackHistoryLogs from './AttackHistoryLogs';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-gray-950 to-purple-950/20">
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23374151" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20`}></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 border border-cyan-500/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 border border-purple-500/10 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-cyan-400/30 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-400/30 rounded-full animate-ping delay-700"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-green-400/30 rounded-full animate-ping delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar onLogout={onLogout} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Live Traffic Monitor */}
            <div className="lg:col-span-1">
              <LiveTrafficMonitor />
            </div>
            
            {/* AI Attack Detection */}
            <div className="lg:col-span-1">
              <AIAttackDetection />
            </div>
          </div>

          {/* Attack History Logs */}
          <div className="mb-6">
            <AttackHistoryLogs />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;