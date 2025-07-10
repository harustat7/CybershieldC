import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Shield, 
  Bell, 
  Monitor, 
  Database, 
  Network, 
  User, 
  Lock, 
  Save,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  Download,
  Upload
} from 'lucide-react';
import Navbar from '../Dashboard/Navbar';
import { supabase, authHelpers } from '../../lib/supabase';

interface SettingsPageProps {
  onLogout: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
  // General Settings
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2);
  const [darkMode, setDarkMode] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);

  // Security Settings
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);

  // AI Detection Settings
  const [aiSensitivity, setAiSensitivity] = useState(75);
  const [autoBlock, setAutoBlock] = useState(false);
  const [learningMode, setLearningMode] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);

  // Network Monitoring
  const [maxPackets, setMaxPackets] = useState(25);
  const [packetRetention, setPacketRetention] = useState(24);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(true);

  // Notification Settings
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [alertEmail, setAlertEmail] = useState('admin@cybershield.com');

  // Profile Settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Add state for password update feedback
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Auto-logout timer logic
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(Date.now());

  // Reset timer on activity
  useEffect(() => {
    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = setTimeout(() => {
        alert('Session timed out. You have been logged out.');
        onLogout();
      }, sessionTimeout * 60 * 1000);
    };
    // Listen for user activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    // Start timer on mount and when sessionTimeout changes
    resetTimer();
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [sessionTimeout, onLogout]);

  // Save network monitoring settings to localStorage
  useEffect(() => {
    localStorage.setItem('cybershield_maxPackets', String(maxPackets));
    localStorage.setItem('cybershield_packetRetention', String(packetRetention));
  }, [maxPackets, packetRetention]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSaveMessage('Settings saved successfully!');
    setIsSaving(false);
    
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleExportSettings = () => {
    const settings = {
      general: { autoRefresh, refreshInterval, darkMode, soundAlerts },
      security: { sessionTimeout, twoFactorAuth, loginNotifications },
      ai: { aiSensitivity, autoBlock, learningMode, confidenceThreshold },
      network: { maxPackets, packetRetention, realTimeAnalysis },
      notifications: { emailAlerts, criticalAlerts, weeklyReports, alertEmail }
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cybershield-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdatePassword = async () => {
    setPasswordMessage('');
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setIsUpdatingPassword(true);
    // Re-authenticate user (Supabase requires the user to be logged in)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setPasswordError('You must be logged in to update your password.');
      setIsUpdatingPassword(false);
      return;
    }
    // Optionally, you could re-authenticate by signing in again with currentPassword
    // But Supabase only requires session to be valid
    const { data, error } = await authHelpers.updatePassword(newPassword);
    if (error) {
      setPasswordError(error.message || 'Failed to update password.');
    } else {
      setPasswordMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsUpdatingPassword(false);
  };

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
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar onLogout={onLogout} />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/25">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
              </div>
            </div>
            
            {/* Save Actions */}
            <div className="flex items-center justify-between bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save All Settings</span>
                    </>
                  )}
                </button>
                
              </div>
              
              {saveMessage && (
                <div className="flex items-center space-x-2 text-green-400 animate-fade-in">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">{saveMessage}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Settings */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Lock className="w-5 h-5 text-red-400" />
                <h2 className="text-xl font-semibold text-white">Security Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={480}>8 hours</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Network Monitoring */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Network className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-semibold text-white">Network Monitoring</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Packets Display
                  </label>
                  <select
                    value={maxPackets}
                    onChange={(e) => setMaxPackets(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                  >
                    <option value={10}>10 packets</option>
                    <option value={25}>25 packets</option>
                    <option value={50}>50 packets</option>
                    <option value={100}>100 packets</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Packet Retention (hours)
                  </label>
                  <select
                    value={packetRetention}
                    onChange={(e) => setPacketRetention(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                  >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>1 week</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Profile Settings */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Profile & Password</h2>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                    placeholder="Enter current password"
                  />
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <button
                  className="w-full px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 rounded-lg text-blue-400 hover:text-blue-300 transition-all duration-200 font-medium"
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
                {passwordMessage && (
                  <div className="mt-2 text-green-400 text-sm">{passwordMessage}</div>
                )}
                {passwordError && (
                  <div className="mt-2 text-red-400 text-sm">{passwordError}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;