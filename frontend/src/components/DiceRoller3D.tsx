import React, { useState, useRef } from 'react';
import { Play } from 'lucide-react';

interface DiceProps {
  value: number;
  isRolling: boolean;
  delay: number;
}

const Dice: React.FC<DiceProps> = ({ value, isRolling, delay }) => {
  const cubeRef = useRef<HTMLDivElement | null>(null);

  // Precise 3D rotation degrees for D6 faces
  const getFaceRotation = (val: number) => {
    switch (val) {
      case 1: return { x: 0, y: 0 };
      case 6: return { x: 180, y: 0 };
      case 5: return { x: 90, y: 0 };
      case 2: return { x: -90, y: 0 };
      case 3: return { x: 0, y: -90 };
      case 4: return { x: 0, y: 90 };
      default: return { x: 0, y: 0 };
    }
  };

  const rot = getFaceRotation(value);
  
  // Dramatic spins on roll
  const transformStyle = isRolling
    ? `rotateX(${rot.x + 1440}deg) rotateY(${rot.y + 1440}deg) rotateZ(720deg)`
    : `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;

  return (
    <div className="dice-wrapper" style={{
      perspective: '600px',
      width: '100px',
      height: '100px',
      display: 'inline-block',
      margin: '16px',
    }}>
      <div 
        ref={cubeRef}
        className="dice-cube" 
        style={{
          width: '80px',
          height: '80px',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: transformStyle,
          transition: isRolling ? 'transform 2s cubic-bezier(0.25, 1, 0.5, 1)' : 'transform 0.6s ease',
          transitionDelay: isRolling ? `${delay}ms` : '0ms',
          margin: '10px auto',
        }}
      >
        {/* Face 1 */}
        <div className="dice-face face-1" style={{
          position: 'absolute', width: '80px', height: '80px', background: '#1e293b', border: '2px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', transform: 'rotateY(0deg) translateZ(40px)', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
        }}>
          <div className="dot" style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--neon-purple)', filter: 'drop-shadow(0 0 3px var(--neon-purple))' }} />
        </div>

        {/* Face 6 */}
        <div className="dice-face face-6" style={{
          position: 'absolute', width: '80px', height: '80px', background: '#1e293b', border: '2px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '10px', alignContent: 'space-between', transform: 'rotateY(180deg) translateZ(40px)', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
        }}>
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          <div></div>
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          <div></div>
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          <div></div>
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
        </div>

        {/* Face 5 */}
        <div className="dice-face face-5" style={{
          position: 'absolute', width: '80px', height: '80px', background: '#1e293b', border: '2px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '10px', alignItems: 'center', transform: 'rotateX(-90deg) translateZ(40px)', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
        }}>
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          <div></div>
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          <div></div>
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          <div></div>
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          <div></div>
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
        </div>

        {/* Face 2 */}
        <div className="dice-face face-2" style={{
          position: 'absolute', width: '80px', height: '80px', background: '#1e293b', border: '2px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px', transform: 'rotateX(90deg) translateZ(40px)', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
        }}>
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', alignSelf: 'flex-start' }} />
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', alignSelf: 'flex-end' }} />
        </div>

        {/* Face 3 */}
        <div className="dice-face face-3" style={{
          position: 'absolute', width: '80px', height: '80px', background: '#1e293b', border: '2px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px', transform: 'rotateY(90deg) translateZ(40px)', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
        }}>
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', alignSelf: 'flex-start' }} />
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', alignSelf: 'center' }} />
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', alignSelf: 'flex-end' }} />
        </div>

        {/* Face 4 */}
        <div className="dice-face face-4" style={{
          position: 'absolute', width: '80px', height: '80px', background: '#1e293b', border: '2px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', padding: '12px', alignContent: 'space-between', transform: 'rotateY(-90deg) translateZ(40px)', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)'
        }}>
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          <div className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
        </div>
      </div>
    </div>
  );
};

export const DiceRoller3D: React.FC = () => {
  const [diceCount, setDiceCount] = useState(1);
  const [diceValues, setDiceValues] = useState<number[]>([1]);
  const [isRolling, setIsRolling] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  const handleDiceCountChange = (count: number) => {
    setDiceCount(count);
    setDiceValues(Array(count).fill(1));
    setTotal(null);
  };

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    setTotal(null);

    // Roll each dice
    const newValues = Array(diceCount).fill(1).map(() => Math.floor(Math.random() * 6) + 1);
    
    // Stagger slightly so roll finishes dynamically
    setTimeout(() => {
      setDiceValues(newValues);
    }, 50);

    // Let the roll animation conclude (2.5 seconds total transition)
    setTimeout(() => {
      setIsRolling(false);
      const sum = newValues.reduce((a, b) => a + b, 0);
      setTotal(sum);
    }, 2200);
  };

  return (
    <div className="arena-card glass-panel" style={{ gridTemplateColumns: '1fr', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h3 style={{ marginBottom: '24px', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '20px' }}>
        3D Premium Dice Roller
      </h3>

      {/* Dices Display Box */}
      <div style={{
        minHeight: '160px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px dashed rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        {diceValues.map((val, i) => (
          <Dice 
            key={i} 
            value={val} 
            isRolling={isRolling} 
            delay={i * 150} // Staggered delays
          />
        ))}
      </div>

      {/* Result Indicator */}
      {total !== null && (
        <div className="pulse-glow glass-panel floating" style={{
          padding: '12px 32px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--neon-purple)',
          color: 'var(--text-primary)',
          fontSize: '18px',
          fontWeight: 'bold',
          borderRadius: '30px',
          marginBottom: '32px',
        }}>
          Total Rolled: <span style={{ color: 'var(--neon-purple)', fontSize: '22px' }}>{total}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Count Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Number of Dice:</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                className={`btn btn-secondary`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: diceCount === num ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: diceCount === num ? 'var(--neon-purple)' : 'transparent',
                }}
                onClick={() => handleDiceCountChange(num)}
                disabled={isRolling}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Trigger Roll Button */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '15px', padding: '14px 20px', gap: '10px' }}
          onClick={rollDice}
          disabled={isRolling}
        >
          {isRolling ? 'Rolling...' : 'Roll Dice!'}
        </button>
      </div>
    </div>
  );
};
