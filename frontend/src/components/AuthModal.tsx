import React, { useState } from 'react';
import { X, LogIn, UserPlus, ShieldAlert, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (token: string, username: string) => void;
  apiUrl: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess, apiUrl }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Sync locally stored spinner configurations to the authenticated SQLite backend account
  const syncLocalSpinners = async (token: string) => {
    try {
      const localData = localStorage.getItem('local_spinners');
      if (!localData) return;

      const spinners = JSON.parse(localData);
      if (!Array.isArray(spinners) || spinners.length === 0) return;

      setSyncStatus(`Syncing ${spinners.length} local configurations...`);

      for (const spinner of spinners) {
        // Post each local spinner to the backend to persist in SQLite
        const resp = await fetch(`${apiUrl}/api/spinners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: spinner.title,
            type: spinner.type,
            data: JSON.stringify(spinner.data),
          }),
        });

        if (!resp.ok) {
          throw new Error('Failed to sync one or more spinners');
        }
      }

      // Clear local storage configurations since they are now safely in the cloud
      localStorage.removeItem('local_spinners');
      setSyncStatus('Local configurations successfully synchronized!');
    } catch (e: any) {
      console.error('Sync Error:', e);
      setSyncStatus('Authentication completed, but local sync had a minor error.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || password.length < 6) {
      setErrorMsg('Username is required, and password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSyncStatus(null);

    const endpoint = isLogin ? 'login' : 'register';

    try {
      const resp = await fetch(`${apiUrl}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Sync local spinners prior to completing the success callback
      await syncLocalSpinners(data.token);

      // Trigger success callback
      setTimeout(() => {
        onAuthSuccess(data.token, data.username);
        onClose();
      }, syncStatus ? 1500 : 0);

    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection failed');
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(5, 8, 16, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      {/* Modal Dialog Pane */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '32px',
        position: 'relative',
        animation: 'float 6s ease-in-out infinite'
      }}>
        {/* Close trigger */}
        <button 
          className="btn-remove" 
          style={{ position: 'absolute', top: '16px', right: '16px', padding: '6px' }}
          onClick={onClose}
          disabled={isLoading}
        >
          <X size={20} />
        </button>

        {/* Modal Title */}
        <h3 style={{
          fontSize: '22px',
          marginBottom: '8px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h3>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          {isLogin 
            ? 'Sign in to access saved spinners & cloud rooms' 
            : 'Access premium cloud saving & synchronization features'}
        </p>

        {/* Status displays */}
        {errorMsg && (
          <div style={{
            background: 'rgba(236, 72, 153, 0.08)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--neon-pink)',
            marginBottom: '16px'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {syncStatus && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--neon-green)',
            marginBottom: '16px'
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Username
            </label>
            <input
              type="text"
              className="glass-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter unique username..."
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters..."
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginTop: '8px', gap: '8px' }}
            disabled={isLoading}
          >
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {/* Toggle between register and login */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={{
              color: 'var(--neon-cyan)',
              fontWeight: 'bold',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg(null);
              setSyncStatus(null);
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </div>
      </div>
    </div>
  );
};
