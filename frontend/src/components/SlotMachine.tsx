import React, { useState } from 'react';
import { Play, RotateCw } from 'lucide-react';

export const SlotMachine: React.FC = () => {
  const [optionsText, setOptionsText] = useState("Apple\nBanana\nCherry\nGrape\nOrange");
  const [isSpinning, setIsSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [guaranteedMatch, setGuaranteedMatch] = useState(true);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [stoppedItems, setStoppedItems] = useState<string[]>([]);

  // Reels states
  const [reelOffsets, setReelOffsets] = useState<number[]>([0, 0, 0]);
  const [optionsList, setOptionsList] = useState<string[]>(["Apple", "Banana", "Cherry", "Grape", "Orange"]);

  const itemHeight = 70; // Height of each reel item in px
  
  const spinReels = () => {
    if (isSpinning) return;
    
    // Parse list
    const items = optionsText.split('\n').map(s => s.trim()).filter(Boolean);
    if (items.length < 2) {
      alert("Please enter at least 2 items to spin.");
      return;
    }
    
    setIsSpinning(true);
    setLeverPulled(true);
    setWinner(null);
    setGameResult(null);
    setOptionsList(items);

    // Dynamic selection for the 3 reels
    let idx1 = 0;
    let idx2 = 0;
    let idx3 = 0;

    if (guaranteedMatch) {
      // All reels stop on the same winning item
      const winIdx = Math.floor(Math.random() * items.length);
      idx1 = winIdx;
      idx2 = winIdx;
      idx3 = winIdx;
    } else {
      // Independent reels stop on random items
      idx1 = Math.floor(Math.random() * items.length);
      idx2 = Math.floor(Math.random() * items.length);
      idx3 = Math.floor(Math.random() * items.length);
    }

    const item1 = items[idx1];
    const item2 = items[idx2];
    const item3 = items[idx3];

    // Trigger physical lever pull animation reset
    setTimeout(() => setLeverPulled(false), 400);

    // Calculate dynamic roll offsets (repeat lists 8 times for visual roll distance)
    const repeats = 8;
    const listHeight = items.length * itemHeight;

    const targetOffsets = [
      -(idx1 * itemHeight + listHeight * (repeats - 3)),
      -(idx2 * itemHeight + listHeight * (repeats - 2)),
      -(idx3 * itemHeight + listHeight * (repeats - 1))
    ];

    // Spin Reel 1
    setTimeout(() => {
      setReelOffsets(prev => [targetOffsets[0], prev[1], prev[2]]);
    }, 100);

    // Spin Reel 2
    setTimeout(() => {
      setReelOffsets(prev => [prev[0], targetOffsets[1], prev[2]]);
    }, 300);

    // Spin Reel 3
    setTimeout(() => {
      setReelOffsets(prev => [prev[0], prev[1], targetOffsets[2]]);
    }, 500);

    // Finished rolling trigger (Reel 3 finishes at 3.3 seconds total)
    setTimeout(() => {
      const isWin = item1 === item2 && item2 === item3;
      setStoppedItems([item1, item2, item3]);
      if (isWin) {
        setWinner(item1);
        setGameResult('win');
      } else {
        setWinner(null);
        setGameResult('lose');
      }

      // Silent reset: instantly snap offsets back to baseline copies without transition
      setReelOffsets([
        -(idx1 * itemHeight),
        -(idx2 * itemHeight),
        -(idx3 * itemHeight)
      ]);
      setIsSpinning(false);
    }, 3300);
  };

  // Double render items inside reels to facilitate looping look
  const renderedItems = [...optionsList, ...optionsList, ...optionsList, ...optionsList, ...optionsList, ...optionsList, ...optionsList, ...optionsList, ...optionsList];

  return (
    <div className="arena-card glass-panel" style={{ gridTemplateColumns: '1fr 340px', gap: '32px', padding: '32px', boxSizing: 'border-box', height: '100%', width: '100%', minHeight: 0 }}>
      {/* Visual Cabinet Arena */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', minHeight: 0 }}>
        <h3 style={{ marginBottom: '8px', background: 'linear-gradient(135deg, var(--neon-pink), var(--neon-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '22px' }}>
          🎰 Cyberpunk Slot Machine
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
          Pull the lever and let the neon reels line up your destiny.
        </p>

        {/* Slot Machine Chassis Layout */}
        <div style={{
          position: 'relative',
          width: '320px',
          height: '190px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* Main Slots Box */}
          <div className="glass-panel" style={{
            padding: '24px',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(8, 12, 20, 0.95) 100%)',
            border: '2px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '28px',
            boxShadow: isSpinning ? '0 0 35px rgba(236, 72, 153, 0.15)' : '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
            display: 'flex',
            gap: '16px',
            position: 'relative',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            {/* Specular Horizontal Lights */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
            }} />

            {/* Target Alignment Window Center Line */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '8px',
              right: '8px',
              height: `${itemHeight}px`,
              transform: 'translateY(-50%)',
              borderTop: '1px dashed var(--neon-cyan)',
              borderBottom: '1px dashed var(--neon-cyan)',
              background: 'rgba(6, 182, 212, 0.03)',
              boxShadow: 'inset 0 0 10px rgba(6, 182, 212, 0.05)',
              borderRadius: '8px',
              pointerEvents: 'none',
              zIndex: 10
            }} />

            {/* 3 REEL WINDOWS */}
            {[0, 1, 2].map(reelIdx => (
              <div key={reelIdx} style={{
                flex: 1,
                height: `${itemHeight}px`,
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'inset 0 10px 15px rgba(0,0,0,0.8)'
              }}>
                {/* Reel strip mapping items */}
                <div style={{
                  transform: `translateY(${reelOffsets[reelIdx]}px)`,
                  transition: isSpinning ? 'transform 2.6s cubic-bezier(0.15, 0.85, 0.3, 1)' : 'none',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {renderedItems.map((item, idx) => (
                    <div key={idx} style={{
                      height: `${itemHeight}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '800',
                      letterSpacing: '0.05em',
                      color: idx % 3 === 0 ? 'var(--neon-cyan)' : idx % 3 === 1 ? 'var(--neon-purple)' : 'var(--neon-pink)',
                      textShadow: idx % 3 === 0 ? '0 0 8px var(--neon-cyan-glow)' : idx % 3 === 1 ? '0 0 8px var(--neon-purple-glow)' : '0 0 8px var(--neon-pink-glow)',
                      textAlign: 'center',
                      padding: '0 4px',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.substring(0, 10).toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Physical Lever Mechanism */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'absolute',
            left: 'calc(100% + 16px)',
            bottom: '24px',
            cursor: 'pointer',
            height: '140px',
            width: '28px',
            perspective: '200px',
            zIndex: 20
          }} onClick={spinReels}>
            {/* Lever Base */}
            <div className="glass-panel" style={{
              width: '18px',
              height: '38px',
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px',
              position: 'absolute',
              bottom: '10px'
            }} />

            {/* Metal Arm Shaft */}
            <div className={`lever-shaft ${leverPulled ? 'lever-pulling' : ''}`} style={{
              width: '6px',
              height: '80px',
              background: 'linear-gradient(90deg, #94a3b8, #475569)',
              borderRadius: '3px',
              position: 'absolute',
              bottom: '30px',
              transformOrigin: 'bottom center',
              transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }} />

            {/* Glowing Ball Knob */}
            <div className={`lever-knob ${leverPulled ? 'lever-knob-pulling' : ''}`} style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, var(--neon-pink) 0%, #be185d 80%)',
              boxShadow: '0 0 15px rgba(236,72,153,0.7)',
              position: 'absolute',
              bottom: '100px',
              transition: 'bottom 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }} />
          </div>
        </div>

        {/* Animations styles injection */}
        <style>{`
          .lever-pulling {
            transform: rotateX(70deg) translateY(12px) !important;
          }
          .lever-knob-pulling {
            bottom: 45px !important;
            box-shadow: 0 0 25px rgba(236,72,153,1) !important;
          }
        `}</style>

        {/* Spin trigger & Winner message display */}
        <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isSpinning && gameResult === 'win' && winner && (
            <div className="pulse-glow glass-panel floating" style={{
              padding: '12px 24px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '2.5px solid var(--neon-pink)',
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontWeight: 'bold',
              borderRadius: '20px',
              textAlign: 'center',
              alignSelf: 'center',
              boxShadow: '0 0 20px var(--neon-pink-glow)'
            }}>
              🎉 JACKPOT! Winner: <span style={{ color: 'var(--neon-pink)', fontSize: '18px', textShadow: '0 0 8px var(--neon-pink-glow)' }}>{winner}</span>
            </div>
          )}

          {!isSpinning && gameResult === 'lose' && stoppedItems.length === 3 && (
            <div className="glass-panel" style={{
              padding: '12px 20px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              borderRadius: '16px',
              textAlign: 'center',
              alignSelf: 'center',
              lineHeight: '1.5'
            }}>
              ❌ No Match! Landed on:<br />
              <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>{stoppedItems[0]}</span> |{' '}
              <span style={{ color: 'var(--neon-purple)', fontWeight: 'bold' }}>{stoppedItems[1]}</span> |{' '}
              <span style={{ color: 'var(--neon-pink)', fontWeight: 'bold' }}>{stoppedItems[2]}</span>
              <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.8 }}>Pull the lever again for a Jackpot match!</div>
            </div>
          )}

          <button className="btn btn-primary" style={{ padding: '14px 20px', gap: '8px' }} onClick={spinReels} disabled={isSpinning}>
            <Play size={16} fill="#fff" />
            {isSpinning ? 'Rolling Reels...' : 'Pull Lever!'}
          </button>
        </div>
      </div>

      {/* Options Sidebar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, boxSizing: 'border-box' }}>
        <h4 style={{ fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>SLOT CABINET</h4>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '14px', minHeight: 0 }}>
          {/* Game Mode Settings Toggle */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Game Settings
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={guaranteedMatch}
                onChange={(e) => setGuaranteedMatch(e.target.checked)}
                disabled={isSpinning}
                style={{
                  accentColor: 'var(--neon-pink)',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                Guaranteed Match
              </span>
            </label>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              {guaranteedMatch 
                ? "Reels are guaranteed to land on a jackpot matching item to give you an instant decision." 
                : "Reels stop independently. Pull the lever and only get a decision if you hit a jackpot match!"}
            </p>
          </div>

          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Symbols list (one per line):</label>
          <textarea
            className="glass-input"
            value={optionsText}
            onChange={(e) => {
              setOptionsText(e.target.value);
              setReelOffsets([0, 0, 0]);
              setWinner(null);
              setGameResult(null);
            }}
            placeholder="Apple\nBanana\nCherry"
            style={{ flex: 1, minHeight: '150px', fontSize: '13px', fontFamily: 'monospace', resize: 'none' }}
            disabled={isSpinning}
          />
          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: '12px', gap: '6px' }}
            onClick={() => {
              setOptionsText("Jackpot\nLucky 7\nDiamond\nWild Card\nFree Spin");
              setReelOffsets([0, 0, 0]);
              setWinner(null);
              setGameResult(null);
            }}
            disabled={isSpinning}
          >
            <RotateCw size={12} /> Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};
