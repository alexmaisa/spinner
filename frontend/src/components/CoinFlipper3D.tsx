import React, { useState } from 'react';

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
    <div className="arena-card glass-panel" style={{ gridTemplateColumns: '1fr', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
      <h3 style={{ marginBottom: '8px', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '22px' }}>
        3D Coin Flipper
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Toss a premium cybernetic coin to make a decision</p>

      {/* Coin Play Area */}
      <div style={{
        perspective: '1200px',
        height: '320px',
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
            width: '180px',
            height: '180px',
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
            border: '5px solid var(--neon-cyan)',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.5), inset 0 0 20px rgba(6, 182, 212, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            transform: 'rotateY(0deg)',
          }}>
            <span style={{ fontSize: '72px', filter: 'drop-shadow(0 0 10px var(--neon-cyan))' }}>🪙</span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginTop: '6px' }}>HEADS</span>
          </div>

          {/* Back Face (Tails) */}
          <div className="coin-face back" style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '5px solid var(--neon-pink)',
            boxShadow: '0 0 30px rgba(236, 72, 153, 0.5), inset 0 0 20px rgba(236, 72, 153, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            transform: 'rotateY(180deg)',
          }}>
            <span style={{ fontSize: '72px', filter: 'drop-shadow(0 0 10px var(--neon-pink))' }}>💎</span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--neon-pink)', letterSpacing: '0.15em', marginTop: '6px' }}>TAILS</span>
          </div>
        </div>
      </div>

      {/* Bounce keyframe inline injection */}
      <style>{`
        @keyframes toss-up {
          0% { transform: translateY(0); }
          50% { transform: translateY(-130px); }
          100% { transform: translateY(0); }
        }
        .flipping-toss {
          animation: toss-up 2s cubic-bezier(0.15, 0.85, 0.3, 1) forwards;
        }
      `}</style>

      {/* Result Indicator */}
      {result && !isFlipping && (
        <div className="pulse-glow glass-panel floating" style={{
          padding: '12px 32px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid ${result === 'Heads' ? 'var(--neon-cyan)' : 'var(--neon-pink)'}`,
          color: 'var(--text-primary)',
          fontSize: '18px',
          fontWeight: 'bold',
          borderRadius: '25px',
          marginBottom: '28px',
        }}>
          Outcome: <span style={{ color: result === 'Heads' ? 'var(--neon-cyan)' : 'var(--neon-pink)', fontSize: '22px' }}>{result}</span>
        </div>
      )}

      {/* Stats Tracker & Controls */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Simple Stats Dashboard */}
        <div className="glass-panel" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          padding: '14px',
          borderRadius: '12px',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.01)',
          fontSize: '14px',
        }}>
          <div>
            <div style={{ color: 'var(--text-secondary)' }}>Heads</div>
            <div style={{ fontWeight: 'bold', color: 'var(--neon-cyan)', fontSize: '16px' }}>{stats.heads}</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--text-secondary)' }}>Tails</div>
            <div style={{ fontWeight: 'bold', color: 'var(--neon-pink)', fontSize: '16px' }}>{stats.tails}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)' }}>Total</div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{stats.total}</div>
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
