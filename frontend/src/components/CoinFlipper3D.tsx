import React, { useState } from 'react';
import { Play } from 'lucide-react';

export const CoinFlipper3D: React.FC = () => {
  const [result, setResult] = useState<'Heads' | 'Tails' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [stats, setStats] = useState({ heads: 0, tails: 0, total: 0 });

  const flipCoin = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setResult(null);

    const outcomes: ('Heads' | 'Tails')[] = ['Heads', 'Tails'];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    // Let the flip toss animation run for 2 seconds
    setTimeout(() => {
      setResult(outcome);
      setStats((prev) => {
        const isH = outcome === 'Heads';
        return {
          heads: prev.heads + (isH ? 1 : 0),
          tails: prev.tails + (isH ? 0 : 1),
          total: prev.total + 1,
        };
      });
      setIsFlipping(false);
    }, 2000);
  };

  // Determine final degrees of rotation based on heads/tails
  const rotationY = isFlipping
    ? 1800 + (result === 'Tails' ? 180 : 0)
    : (result === 'Tails' ? 180 : 0);

  return (
    <div className="arena-card glass-panel" style={{ gridTemplateColumns: '1fr', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h3 style={{ marginBottom: '8px', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '20px' }}>
        3D Premium Coin Flipper
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '32px' }}>Toss a premium cybernetic coin to make a decision</p>

      {/* Coin Play Area */}
      <div style={{
        perspective: '1000px',
        height: '240px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
      }}>
        {/* Coin Body */}
        <div 
          className={`coin ${isFlipping ? 'flipping-toss' : ''}`}
          style={{
            width: '130px',
            height: '130px',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotationY}deg)`,
            transition: isFlipping ? 'transform 2s cubic-bezier(0.15, 0.85, 0.3, 1)' : 'transform 0.5s ease',
            cursor: 'pointer',
          }}
          onClick={flipCoin}
        >
          {/* Front Face (Heads) */}
          <div className="coin-face front" style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '4px solid var(--neon-cyan)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4), inset 0 0 15px rgba(6, 182, 212, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            transform: 'rotateY(0deg)',
          }}>
            <span style={{ fontSize: '48px', filter: 'drop-shadow(0 0 8px var(--neon-cyan))' }}>🪙</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginTop: '4px' }}>HEADS</span>
          </div>

          {/* Back Face (Tails) */}
          <div className="coin-face back" style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '4px solid var(--neon-pink)',
            boxShadow: '0 0 20px rgba(236, 72, 153, 0.4), inset 0 0 15px rgba(236, 72, 153, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            transform: 'rotateY(180deg)',
          }}>
            <span style={{ fontSize: '48px', filter: 'drop-shadow(0 0 8px var(--neon-pink))' }}>💎</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--neon-pink)', letterSpacing: '0.15em', marginTop: '4px' }}>TAILS</span>
          </div>
        </div>
      </div>

      {/* Bounce keyframe inline injection */}
      <style>{`
        @keyframes toss-up {
          0% { transform: translateY(0); }
          50% { transform: translateY(-100px); }
          100% { transform: translateY(0); }
        }
        .flipping-toss {
          animation: toss-up 2s cubic-bezier(0.15, 0.85, 0.3, 1) forwards;
        }
      `}</style>

      {/* Result Indicator */}
      {result && !isFlipping && (
        <div className="pulse-glow glass-panel floating" style={{
          padding: '10px 28px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid ${result === 'Heads' ? 'var(--neon-cyan)' : 'var(--neon-pink)'}`,
          color: 'var(--text-primary)',
          fontSize: '16px',
          fontWeight: 'bold',
          borderRadius: '25px',
          marginBottom: '28px',
        }}>
          Outcome: <span style={{ color: result === 'Heads' ? 'var(--neon-cyan)' : 'var(--neon-pink)', fontSize: '20px' }}>{result}</span>
        </div>
      )}

      {/* Stats Tracker & Controls */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Simple Stats Dashboard */}
        <div className="glass-panel" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          padding: '12px',
          borderRadius: '10px',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.01)',
          fontSize: '13px',
        }}>
          <div>
            <div style={{ color: 'var(--text-secondary)' }}>Heads</div>
            <div style={{ fontWeight: 'bold', color: 'var(--neon-cyan)' }}>{stats.heads}</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--text-secondary)' }}>Tails</div>
            <div style={{ fontWeight: 'bold', color: 'var(--neon-pink)' }}>{stats.tails}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)' }}>Total</div>
            <div style={{ fontWeight: 'bold' }}>{stats.total}</div>
          </div>
        </div>

        {/* Trigger Button */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '15px', padding: '14px 20px', gap: '10px' }}
          onClick={flipCoin}
          disabled={isFlipping}
        >
          {isFlipping ? 'Flipping...' : 'Toss Coin!'}
        </button>
      </div>
    </div>
  );
};
