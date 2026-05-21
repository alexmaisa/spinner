import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  RotateCw, 
  Coins, 
  Shuffle, 
  Share2, 
  Users, 
  LogOut, 
  LogIn, 
  Trash2, 
  Copy, 
  Check, 
  Link, 
  Radio, 
  Save, 
  History,
  Dices
} from 'lucide-react';
import './App.css';
import logoUrl from './assets/logo.webp';
import { WheelSpinner, type WheelSegment } from './components/WheelSpinner';
import { DiceRoller3D } from './components/DiceRoller3D';
import { CoinFlipper3D } from './components/CoinFlipper3D';
import { ExtraRandomizers } from './components/ExtraRandomizers';
import { AuthModal } from './components/AuthModal';

// Dynamically resolve API and WebSocket bases for local dev or dockerized production
const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://localhost:8080'
  : window.location.origin;

const WS_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'ws://localhost:8080'
  : (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host;

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  
  useEffect(() => {
    const handleWindowResize = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  // Navigation & Authentication states
  const [activeTab, setActiveTab] = useState<'wheel' | 'dice' | 'coin' | 'extra'>('wheel');
  const [token, setToken] = useState<string | null>(localStorage.getItem('spinner_token'));
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('spinner_email'));
  const [showAuthModal, setShowAuthModal] = useState(false);


  // Spinner Segment state
  const [wheelSegments, setWheelSegments] = useState<WheelSegment[]>([
    { label: 'Option A', weight: 1, color: 'hsl(260, 75%, 55%)' },
    { label: 'Option B', weight: 1, color: 'hsl(190, 80%, 50%)' },
    { label: 'Option C', weight: 1, color: 'hsl(330, 80%, 55%)' },
    { label: 'Option D', weight: 1, color: 'hsl(45, 90%, 50%)' },
    { label: 'Option E', weight: 1, color: 'hsl(145, 70%, 45%)' },
  ]);

  // Configurations list
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [newConfigTitle, setNewConfigTitle] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Multiplayer live room states
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false);
  const [roomID, setRoomID] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [membersCount, setMembersCount] = useState(1);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [spinDuration, setSpinDuration] = useState(5);
  const [spinTriggerToken, setSpinTriggerToken] = useState(0);

  // History state (Cloud synced)
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  // Decode JWT payload to extract email (without a library)
  const decodeJwtEmail = useCallback((jwt: string): string | null => {
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      return payload.email || null;
    } catch {
      return null;
    }
  }, []);

  // Initialize and check URL parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Handle magic-link auth callback
    const authToken = params.get('auth_token');
    const authError = params.get('auth_error');

    if (authToken) {
      const email = decodeJwtEmail(authToken);
      if (email) {
        setToken(authToken);
        setUserEmail(email);
        localStorage.setItem('spinner_token', authToken);
        localStorage.setItem('spinner_email', email);
      }
      // Clean auth params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      loadSavedSpinners();
      return;
    }

    if (authError) {
      alert(`Sign-in failed: ${authError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const roomParam = params.get('room');
    const shareParam = params.get('share');

    if (roomParam) {
      setActiveTab('wheel');
      joinLiveRoom(roomParam);
    } else if (shareParam) {
      setActiveTab('wheel');
      loadSharedConfig(shareParam);
    } else {
      loadSavedSpinners();
    }
  }, []);

  // Fetch saved spinners based on auth state
  const loadSavedSpinners = async () => {
    if (token) {
      try {
        const resp = await fetch(`${API_BASE}/api/spinners`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (resp.ok) {
          const data = await resp.json();
          setSavedConfigs(data);
          return;
        }
      } catch (e) {
        console.error('Failed to load cloud spinners:', e);
      }
    }

    // Fallback to local storage spinners
    const local = localStorage.getItem('local_spinners');
    if (local) {
      setSavedConfigs(JSON.parse(local));
    }
  };

  // Fetch Cloud History logs
  const loadHistory = async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/api/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        setSpinHistory(data);
      }
    } catch (e) {
      console.error('Failed to load spin history:', e);
    }
  };

  // Load a public shared config from DB
  const loadSharedConfig = async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE}/api/spinners/${id}`);
      if (resp.ok) {
        const cfg = await resp.json();
        const segments = JSON.parse(cfg.data);
        setWheelSegments(segments);
        setActiveConfigId(cfg.id);
        setNewConfigTitle(cfg.title);
        setShareUrl(`${window.location.origin}/?share=${cfg.id}`);
      }
    } catch (e) {
      console.error('Failed to fetch shared spinner:', e);
    }
  };

  // Save or update active spinner configuration
  const handleSaveSpinner = async () => {
    const title = newConfigTitle.trim() || 'Untitled Spinner';
    const type = 'wheel';
    const dataString = JSON.stringify(wheelSegments);

    if (token) {
      // Cloud database saving
      try {
        const payload: any = { title, type, data: dataString };
        if (activeConfigId) payload.id = activeConfigId;

        const resp = await fetch(`${API_BASE}/api/spinners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (resp.ok) {
          const saved = await resp.json();
          setActiveConfigId(saved.id);
          setShareUrl(`${window.location.origin}/?share=${saved.id}`);
          loadSavedSpinners();
          alert('Configuration successfully saved to cloud!');
        }
      } catch (e) {
        console.error('Cloud save failed:', e);
      }
    } else {
      // Local storage saving (Local-first)
      const local = localStorage.getItem('local_spinners');
      let currentList = local ? JSON.parse(local) : [];

      const targetId = activeConfigId || Math.random().toString(36).substring(2, 10);
      const newConfig = {
        id: targetId,
        title,
        type,
        data: wheelSegments
      };

      if (activeConfigId) {
        currentList = currentList.map((c: any) => c.id === activeConfigId ? newConfig : c);
      } else {
        currentList.push(newConfig);
      }

      localStorage.setItem('local_spinners', JSON.stringify(currentList));
      setActiveConfigId(targetId);
      setSavedConfigs(currentList);
      alert('Configuration saved locally! Sign in to back up on the cloud.');
    }
  };

  // Delete spinner configuration
  const handleDeleteSpinner = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    if (token) {
      try {
        const resp = await fetch(`${API_BASE}/api/spinners/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (resp.ok) {
          if (activeConfigId === id) {
            setActiveConfigId(null);
            setShareUrl(null);
          }
          loadSavedSpinners();
        }
      } catch (err) {
        console.error('Delete cloud spinner failed:', err);
      }
    } else {
      const local = localStorage.getItem('local_spinners');
      if (local) {
        let currentList = JSON.parse(local);
        currentList = currentList.filter((c: any) => c.id !== id);
        localStorage.setItem('local_spinners', JSON.stringify(currentList));
        if (activeConfigId === id) {
          setActiveConfigId(null);
          setShareUrl(null);
        }
        setSavedConfigs(currentList);
      }
    }
  };

  // Join an active WebSocket room (Viewer Mode)
  const joinLiveRoom = async (id: string) => {
    setRoomID(id);
    setIsMultiplayerMode(true);
    setIsHost(false);

    try {
      // Ensure local visual matches room segments on join
      await loadSharedConfig(id);

      const socketUrl = `${WS_BASE}/api/rooms/${id}/ws?token=${token || ''}`;
      const ws = new WebSocket(socketUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        // Connected successfully
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        switch (msg.action) {
          case 'welcome':
            setIsHost(msg.is_host);
            break;
          case 'member_count':
            setMembersCount(msg.count);
            break;
          case 'sync_config':
            if (msg.config && msg.config.segments) {
              setWheelSegments(msg.config.segments);
            }
            break;
          case 'spin':
            setTargetIndex(msg.target_index);
            setSpinDuration(msg.duration || 5);
            setSpinTriggerToken((prev) => prev + 1);
            break;
          case 'error':
            alert(`Live Room error: ${msg.message}`);
            break;
        }
      };

      ws.onclose = () => {
        disconnectLiveRoom();
      };
    } catch (e) {
      console.error('Failed to establish WebSocket session:', e);
    }
  };

  // Establish a live multiplayer session (Host Mode)
  const startLiveHostRoom = async () => {
    if (!activeConfigId) {
      alert('Please save the configuration before opening a live session.');
      return;
    }
    joinLiveRoom(activeConfigId);
  };

  // Disconnect from active WebSocket room session
  const disconnectLiveRoom = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsMultiplayerMode(false);
    setRoomID(null);
    setIsHost(false);
    setMembersCount(1);
    // Remove query parameters from URL safely
    window.history.pushState({}, document.title, window.location.pathname);
  };

  // Trigger CSPRNG server-side spin & broadcast to WebSocket
  const triggerMultiplayerSpin = async () => {
    if (!isHost || !roomID) return;

    try {
      // 1. Fetch server-side cryptographically secure random index
      const resp = await fetch(`${API_BASE}/api/spin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          type: 'wheel',
          weights: wheelSegments.map((s) => s.weight)
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        // 2. Broadcast result to all room participants
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            action: 'spin',
            target_index: data.index,
            duration: 5.0
          }));
        }
      }
    } catch (e) {
      console.error('CSPRNG Spin failed:', e);
    }
  };

  // Handle segment edits and push real-time updates over WebSocket if Host
  const handleSegmentsChange = (updated: WheelSegment[]) => {
    setWheelSegments(updated);

    if (isMultiplayerMode && isHost && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'sync_config',
        config: { segments: updated }
      }));
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserEmail(null);
    localStorage.removeItem('spinner_token');
    localStorage.removeItem('spinner_email');
    setSavedConfigs([]);
    loadSavedSpinners();
    setShowHistory(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="app-container">
      {/* Header Navigation Bar */}
      <header className="navbar">
        <div className="nav-brand" onClick={() => window.location.href = '/'}>
          <img src={logoUrl} alt="Spinner Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
          <span>SPINNER</span>
        </div>

        <div className="nav-links">
          {token ? (
            <div className="nav-user">
              <span style={{ color: 'var(--neon-cyan)', fontWeight: '500', fontSize: '13px' }}>{userEmail}</span>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', gap: '6px', fontSize: '13px' }}
                onClick={() => {
                  loadHistory();
                  setShowHistory(!showHistory);
                }}
              >
                <History size={16} />
                History
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', gap: '6px', fontSize: '13px' }}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-primary" 
              style={{ padding: '8px 16px', gap: '6px', fontSize: '13px' }}
              onClick={() => setShowAuthModal(true)}
            >
              <LogIn size={16} />
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Cloud History overlay panel */}
      {showHistory && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '20px',
          width: '320px',
          maxHeight: 'calc(100vh - 100px)',
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(15px)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--shadow-glass)',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto'
        }}>
          <h3 style={{ fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            📜 Cloud Spin History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {spinHistory.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', marginTop: '16px' }}>
                No recorded history yet
              </div>
            ) : (
              spinHistory.map((h: any, idx: number) => (
                <div key={idx} className="glass-card" style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div>
                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: 'var(--neon-purple)' }}>{h.type}</span>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{new Date(h.timestamp).toLocaleTimeString()}</div>
                  </div>
                  <span style={{ fontWeight: '800', color: 'var(--neon-cyan)' }}>{h.result}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Dashboard Grid Layout */}
      <div className="main-layout">
        {/* Navigation Sidebar */}
        <aside className="sidebar">
          {/* Methods Section */}
          <div style={{ marginBottom: '10px' }}>
            <h4 className="sidebar-title">Decision Methods</h4>
            <div className="method-list" style={{ marginTop: '8px' }}>
              <button 
                className={`method-item ${activeTab === 'wheel' ? 'active' : ''}`}
                onClick={() => setActiveTab('wheel')}
                disabled={isMultiplayerMode}
              >
                <RotateCw size={18} />
                <span>Wheel Spinner</span>
              </button>
              <button 
                className={`method-item ${activeTab === 'dice' ? 'active' : ''}`}
                onClick={() => setActiveTab('dice')}
                disabled={isMultiplayerMode}
              >
                <Dices size={18} />
                <span>3D Dice Roller</span>
              </button>
              <button 
                className={`method-item ${activeTab === 'coin' ? 'active' : ''}`}
                onClick={() => setActiveTab('coin')}
                disabled={isMultiplayerMode}
              >
                <Coins size={18} />
                <span>3D Coin Flipper</span>
              </button>
              <button 
                className={`method-item ${activeTab === 'extra' ? 'active' : ''}`}
                onClick={() => setActiveTab('extra')}
                disabled={isMultiplayerMode}
              >
                <Shuffle size={18} />
                <span>RNG & List Shuffler</span>
              </button>
            </div>
          </div>

          {/* Wheel Configurations List */}
          {activeTab === 'wheel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h4 className="sidebar-title">Saved Spinners</h4>
              
              {/* Spinner Creation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  className="glass-input"
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                  placeholder="Spinner title..."
                  value={newConfigTitle}
                  onChange={(e) => setNewConfigTitle(e.target.value)}
                  disabled={isMultiplayerMode}
                />
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '8px 16px', gap: '8px', fontSize: '13px' }}
                  onClick={handleSaveSpinner}
                  disabled={isMultiplayerMode}
                >
                  <Save size={16} />
                  {activeConfigId ? 'Update Configuration' : 'Save Configuration'}
                </button>
              </div>

              {/* Saved configs list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '180px' }}>
                {savedConfigs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', marginTop: '10px' }}>
                    No saved spinners yet
                  </div>
                ) : (
                  savedConfigs.map((cfg: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`method-item ${activeConfigId === cfg.id ? 'active' : ''}`}
                      style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => {
                        if (isMultiplayerMode) return;
                        setActiveConfigId(cfg.id);
                        setNewConfigTitle(cfg.title);
                        const segments = typeof cfg.data === 'string' ? JSON.parse(cfg.data) : cfg.data;
                        setWheelSegments(segments);
                        setShareUrl(`${window.location.origin}/?share=${cfg.id}`);
                      }}
                    >
                      <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        🎯 {cfg.title}
                      </span>
                      <button 
                        className="btn-remove" 
                        style={{ padding: '2px' }}
                        onClick={(e) => handleDeleteSpinner(cfg.id, e)}
                        disabled={isMultiplayerMode}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Playing Arena Pane */}
        <main className="arena">
          {activeTab === 'wheel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1280px', height: isMobile ? 'auto' : '100%', minHeight: 0 }}>
              {/* Multiplayer Banner Header */}
              {isMultiplayerMode && (
                <div className="pulse-glow glass-panel" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: isHost ? '1px solid var(--neon-purple)' : '1px solid var(--neon-cyan)',
                  borderRadius: '12px',
                  width: '100%'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Radio size={20} className="floating" style={{ color: isHost ? 'var(--neon-purple)' : 'var(--neon-cyan)' }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        {isHost ? '🔴 Live Room Host' : '🔴 Live Room Participant'}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                        Active Room Code: <span style={{ color: '#fff', fontWeight: 'bold' }}>{roomID}</span> | Members: <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>{membersCount}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {isHost && (
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
                        onClick={() => copyToClipboard(`${window.location.origin}/?room=${roomID}`)}
                      >
                        {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                        {copiedLink ? 'Link Copied!' : 'Copy Invitation Link'}
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--neon-pink)', color: 'var(--neon-pink)' }}
                      onClick={disconnectLiveRoom}
                    >
                      Leave Room
                    </button>
                  </div>
                </div>
              )}

              {/* Single Shared config banner */}
              {!isMultiplayerMode && shareUrl && (
                <div className="glass-panel" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '12px',
                  width: '100%'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Share2 size={18} style={{ color: 'var(--neon-cyan)' }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Share & Collaborate</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                        This spinner has been uploaded to the cloud database.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
                      onClick={() => copyToClipboard(shareUrl)}
                    >
                      {copiedLink ? <Check size={14} /> : <Link size={14} />}
                      {copiedLink ? 'Link Copied!' : 'Copy Shareable Link'}
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
                      onClick={startLiveHostRoom}
                    >
                      <Users size={14} />
                      Start Co-Spinning Room
                    </button>
                  </div>
                </div>
              )}

              {/* Main Interactive Wheel component */}
              <WheelSpinner 
                initialSegments={wheelSegments}
                onSegmentsChange={handleSegmentsChange}
                targetIndex={targetIndex}
                spinDuration={spinDuration}
                triggerSpinToken={spinTriggerToken}
                isMultiplayerMode={isMultiplayerMode}
              />

              {/* Host-only multiplayer triggers */}
              {isMultiplayerMode && (
                <div className="glass-panel" style={{ padding: '16px 24px', borderRadius: '12px', textAlign: 'center' }}>
                  {isHost ? (
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
                        You are the Host! Press co-spin to generate a cryptographically secure RNG outcome and broadcast it to everyone in the room.
                      </p>
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', maxWidth: '300px', padding: '12px', fontSize: '15px' }}
                        onClick={triggerMultiplayerSpin}
                      >
                        <Sparkles size={18} />
                        Co-Spin! (CSPRNG)
                      </button>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 'bold' }}>
                      🟢 Watching Host live. Waiting for Host to spin the wheel...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'dice' && <DiceRoller3D />}
          {activeTab === 'coin' && <CoinFlipper3D />}
          {activeTab === 'extra' && <ExtraRandomizers />}
        </main>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal 
          apiUrl={API_BASE}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
