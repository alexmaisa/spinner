import React, { useState } from 'react';
import { HelpCircle, Play, RefreshCw } from 'lucide-react';

const DEFAULT_PREDICTIONS = [
  { text: "YES, DEFINITELY", type: 'positive', color: 'var(--neon-cyan)' },
  { text: "HIGHLY PROBABLE", type: 'positive', color: 'var(--neon-cyan)' },
  { text: "IT IS DECIDED", type: 'positive', color: 'var(--neon-cyan)' },
  { text: "ASK AGAIN LATER", type: 'neutral', color: 'var(--neon-yellow)' },
  { text: "CONCENTRATE & ASK", type: 'neutral', color: 'var(--neon-yellow)' },
  { text: "NOT RECOMMENDED", type: 'negative', color: 'var(--neon-pink)' },
  { text: "DEFINITELY NO", type: 'negative', color: 'var(--neon-pink)' },
  { text: "OUTLOOK DOUBTFUL", type: 'negative', color: 'var(--neon-pink)' }
];

export const Magic8Ball: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [prediction, setPrediction] = useState<string | null>(null);
  const [predictionColor, setPredictionColor] = useState<string>('var(--neon-cyan)');
  const [isShaking, setIsShaking] = useState(false);
  const [customAnswers, setCustomAnswers] = useState<string>("");
  const [useCustomAnswers, setUseCustomAnswers] = useState(false);

  const getPrediction = () => {
    if (isShaking) return;
    setIsShaking(true);
    setPrediction(null);

    // Dynamic animation sequence duration: 1.5 seconds
    setTimeout(() => {
      let pool = DEFAULT_PREDICTIONS;

      if (useCustomAnswers) {
        const lines = customAnswers
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);
        if (lines.length > 0) {
          pool = lines.map((text, idx) => ({
            text: text.toUpperCase(),
            type: 'custom',
            color: idx % 3 === 0 ? 'var(--neon-cyan)' : idx % 3 === 1 ? 'var(--neon-purple)' : 'var(--neon-pink)'
          }));
        }
      }

      const randomIdx = Math.floor(Math.random() * pool.length);
      const chosen = pool[randomIdx];
      setPrediction(chosen.text);
      setPredictionColor(chosen.color);
      setIsShaking(false);
    }, 1500);
  };

  return (
    <div className="arena-card glass-panel" style={{ gridTemplateColumns: '1fr 340px', gap: '32px', padding: '32px', boxSizing: 'border-box', height: '100%', width: '100%', minHeight: 0 }}>
      {/* Visual Play Area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', minHeight: 0 }}>
        <h3 style={{ marginBottom: '8px', background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-pink))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '22px' }}>
          🔮 Cyberpunk Magic 8-Ball
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
          Consult the cybernetic oracle. Click the orb or press "Ask Oracle" to find your answer.
        </p>

        {/* Floating 3D Orb Area */}
        <div style={{
          position: 'relative',
          height: '280px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: '1000px',
          marginBottom: '20px'
        }}>
          {/* Magic 8-Ball Body */}
          <div
            className={`cyber-orb ${isShaking ? 'orb-shake' : ''}`}
            onClick={getPrediction}
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(30, 41, 59, 0.95) 0%, rgba(8, 12, 20, 1) 70%)',
              border: '2px solid rgba(255, 255, 255, 0.08)',
              boxShadow: isShaking
                ? '0 0 50px rgba(139, 92, 246, 0.5), inset 0 0 30px rgba(6, 182, 212, 0.3)'
                : '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(255,255,255,0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'var(--transition-smooth)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Specular Highlight Overlay */}
            <div style={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '60px',
              height: '35px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 80%)',
              transform: 'rotate(-30deg)',
              pointerEvents: 'none'
            }} />

            {/* Inner Window Display */}
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'rgba(8, 12, 20, 0.9)',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Matrix Floating Triangle Reveal */}
              {!isShaking && prediction ? (
                <div
                  className="triangle-reveal"
                  style={{
                    width: '0',
                    height: '0',
                    borderLeft: '42px solid transparent',
                    borderRight: '42px solid transparent',
                    borderBottom: '76px solid rgba(15, 23, 42, 0.95)',
                    position: 'absolute',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: `drop-shadow(0 0 10px ${predictionColor})`,
                    borderBottomColor: 'rgba(15, 23, 42, 0.95)'
                  }}
                >
                  {/* Floating Triangle Borders */}
                  <div style={{
                    width: '0',
                    height: '0',
                    borderLeft: '40px solid transparent',
                    borderRight: '40px solid transparent',
                    borderBottom: '72px solid transparent',
                    borderBottomColor: 'rgba(8, 12, 20, 0.9)',
                    position: 'absolute',
                    top: '2px',
                    left: '-40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{
                      color: predictionColor,
                      fontSize: '7px',
                      fontWeight: '800',
                      width: '60px',
                      textAlign: 'center',
                      lineHeight: '1.2',
                      fontFamily: 'monospace',
                      position: 'absolute',
                      top: '24px',
                      letterSpacing: '0.02em',
                      textShadow: `0 0 5px ${predictionColor}`
                    }}>
                      {prediction}
                    </span>
                  </div>
                </div>
              ) : isShaking ? (
                <div style={{
                  color: 'var(--neon-purple)',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  animation: 'pulse-glow 0.5s ease-in-out infinite'
                }}>
                  ❔
                </div>
              ) : (
                <span style={{ fontSize: '32px', filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))' }}>🔮</span>
              )}
            </div>
          </div>
        </div>

        {/* Shake & pulse animation inline styling */}
        <style>{`
          @keyframes orb-shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-2px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(0px, 2px) rotate(0deg); }
            40% { transform: translate(2px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(2px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(2px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
          }
          .orb-shake {
            animation: orb-shake 0.15s linear infinite;
          }
          @keyframes triangle-float {
            0% { transform: scale(0) rotate(360deg) translateY(20px); opacity: 0; }
            100% { transform: scale(1) rotate(0deg) translateY(0); opacity: 1; }
          }
          .triangle-reveal {
            animation: triangle-float 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}</style>

        {/* Input box & Button Control */}
        <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ask your question:</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="glass-input"
                placeholder="Will I succeed today?..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isShaking}
                style={{ paddingRight: '40px' }}
              />
              <HelpCircle size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button className="btn btn-primary" style={{ padding: '14px 20px', gap: '8px' }} onClick={getPrediction} disabled={isShaking}>
            <Play size={16} fill="#fff" />
            {isShaking ? 'Consulting Core...' : 'Ask Oracle'}
          </button>
        </div>
      </div>

      {/* Answer Pools Customizer Sidebar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, boxSizing: 'border-box' }}>
        <h4 style={{ fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>PREDICTION POOL</h4>

        {/* Custom Answer toggle button */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`btn ${!useCustomAnswers ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px 10px', fontSize: '11px', borderRadius: '8px' }}
            onClick={() => setUseCustomAnswers(false)}
          >
            🔮 Classic Pool
          </button>
          <button
            className={`btn ${useCustomAnswers ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px 10px', fontSize: '11px', borderRadius: '8px' }}
            onClick={() => setUseCustomAnswers(true)}
          >
            ✍️ Custom
          </button>
        </div>

        {/* Classic Pool Listing */}
        {!useCustomAnswers ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {DEFAULT_PREDICTIONS.map((item, i) => (
              <div key={i} className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '600' }}>{item.text}</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '10px', minHeight: 0 }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Custom answers (one per line):</label>
            <textarea
              className="glass-input"
              value={customAnswers}
              onChange={(e) => setCustomAnswers(e.target.value)}
              placeholder="e.g.\nYes absolutely\nNo way\nTry again\nFocus on goals"
              style={{ flex: 1, minHeight: '120px', fontSize: '13px', fontFamily: 'monospace', resize: 'none' }}
            />
            <button
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '12px', gap: '6px' }}
              onClick={() => setCustomAnswers("YES INDEED\nNO CHANCE\nDEFINITELY\nRISKY\nBETTER NOT")}
            >
              <RefreshCw size={12} /> Reset to Samples
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
