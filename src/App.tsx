import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthCard from './components/Auth/AuthCard';
import ResetPasswordPage from './components/Auth/ResetPasswordPage';
import Dashboard from './components/Dashboard/Dashboard';
import LogsPage from './components/Logs/LogsPage';
import SettingsPage from './components/Settings/SettingsPage';
import { authHelpers } from './lib/supabase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { user, error } = await authHelpers.getCurrentUser();
        
        // Check if the error indicates an invalid or expired JWT
        if (error && (
          error.message?.includes('Session from session_id claim in JWT does not exist') ||
          error.message?.includes('Invalid JWT') ||
          error.message?.includes('session_not_found')
        )) {
          // Clear invalid session data
          await authHelpers.signOut();
          setUser(null);
          setIsAuthenticated(false);
        } else if (user) {
          setUser(user);
          setIsAuthenticated(true);
        }
      } catch (error: any) {
        console.error('Error checking session:', error);
        
        // If the error is related to invalid session, clear it
        if (error?.message?.includes('Session from session_id claim in JWT does not exist') ||
            error?.message?.includes('Invalid JWT') ||
            error?.message?.includes('session_not_found')) {
          try {
            await authHelpers.signOut();
          } catch (signOutError) {
            console.error('Error signing out invalid session:', signOutError);
          }
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = authHelpers.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await authHelpers.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      <Router>
        <Routes>
          {/* Reset password route - accessible without authentication */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {isAuthenticated ? (
            <>
              <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
              <Route path="/logs" element={<LogsPage onLogout={handleLogout} />} />
.
              <Route path="/settings" element={<SettingsPage onLogout={handleLogout} />} />
            </>
          ) : (
            <Route path="*" element={<AuthCard onLogin={handleLogin} />} />
          )}
        </Routes>
      </Router>
    </div>
  );
}

export default App;