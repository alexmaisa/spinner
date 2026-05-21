import React, { useState } from 'react';
import { X, Mail, ShieldAlert, CheckCircle, Send, ArrowLeft } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  apiUrl: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, apiUrl }) => {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const resp = await fetch(`${apiUrl}/api/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Failed to send magic link');
      }

      setIsSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setIsSent(false);
    setErrorMsg(null);
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
        maxWidth: '420px',
        padding: '36px',
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

        {!isSent ? (
          <>
            {/* Email Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(34, 211, 238, 0.15))',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Mail size={26} style={{ color: 'var(--neon-cyan)' }} />
              </div>
            </div>

            {/* Modal Title */}
            <h3 style={{
              fontSize: '22px',
              marginBottom: '8px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Sign In to Spinner
            </h3>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Enter your email address and we'll send you a magic link to sign in instantly — no password needed.
            </p>

            {/* Error display */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="glass-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  autoFocus
                  id="auth-email-input"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', marginTop: '4px', gap: '8px' }}
                disabled={isLoading}
                id="auth-send-magic-link"
              >
                <Send size={18} />
                {isLoading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>

            <p style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '20px',
              lineHeight: '1.5'
            }}>
              By signing in, you'll stay logged in for 30 days. New users are automatically registered.
            </p>
          </>
        ) : (
          <>
            {/* Success State: Check your inbox */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CheckCircle size={26} style={{ color: 'var(--neon-green)' }} />
              </div>
            </div>

            <h3 style={{
              fontSize: '22px',
              marginBottom: '8px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, var(--neon-green), var(--neon-cyan))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Check Your Inbox
            </h3>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginBottom: '8px',
              lineHeight: '1.5'
            }}>
              We've sent a magic sign-in link to:
            </p>
            <p style={{
              fontSize: '15px',
              color: 'var(--neon-cyan)',
              textAlign: 'center',
              fontWeight: 'bold',
              marginBottom: '24px',
              wordBreak: 'break-all'
            }}>
              {email.trim().toLowerCase()}
            </p>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Click the link in the email to sign in. The link expires in 15 minutes and can only be used once.
            </p>

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '10px', gap: '8px', fontSize: '13px' }}
              onClick={handleResend}
              id="auth-resend-link"
            >
              <ArrowLeft size={16} />
              Resend Magic Link
            </button>
          </>
        )}
      </div>
    </div>
  );
};
