import React, { useState } from 'react';
import { Play, Shuffle, Users } from 'lucide-react';

export const ExtraRandomizers: React.FC = () => {
  // Tab control
  const [activeTab, setActiveTab] = useState<'number' | 'list'>('number');

  // RNG State
  const [minVal, setMinVal] = useState(1);
  const [maxVal, setMaxVal] = useState(100);
  const [rollingDigits, setRollingDigits] = useState('00');
  const [isRolling, setIsRolling] = useState(false);
  const [rngHistory, setRngHistory] = useState<number[]>([]);

  // List Shuffler / Team State
  const [inputText, setInputText] = useState("Alpha\nBeta\nGamma\nDelta\nEpsilon\nZeta\nEta\nTheta");
  const [shuffledList, setShuffledList] = useState<string[]>([]);
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<string[][]>([]);

  // 1. RNG Slot-machine Rolling Animation
  const rollNumber = () => {
    if (isRolling) return;
    if (minVal >= maxVal) {
      alert("Min value must be less than Max value.");
      return;
    }
    setIsRolling(true);

    const range = maxVal - minVal + 1;
    const finalOutcome = Math.floor(Math.random() * range) + minVal;

    let counter = 0;
    const intervalTime = 60;
    const totalDuration = 1800; // 1.8 seconds roll
    
    const interval = setInterval(() => {
      // Generate highly random digits for visual rolling effect
      const randNum = Math.floor(Math.random() * range) + minVal;
      setRollingDigits(String(randNum).padStart(String(maxVal).length, '0'));
      counter += intervalTime;

      if (counter >= totalDuration) {
        clearInterval(interval);
        setRollingDigits(String(finalOutcome).padStart(String(maxVal).length, '0'));
        setRngHistory((prev) => [finalOutcome, ...prev].slice(0, 10));
        setIsRolling(false);
      }
    }, intervalTime);
  };

  // 2. List Shuffling Logic
  const handleShuffleList = () => {
    const items = inputText.split('\n').map(s => s.trim()).filter(Boolean);
    if (items.length === 0) return;

    // Standard Fisher-Yates shuffle
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setShuffledList(shuffled);
    setTeams([]);
  };

  // 3. Team Division Logic
  const handleGenerateTeams = () => {
    const items = inputText.split('\n').map(s => s.trim()).filter(Boolean);
    if (items.length < teamCount) {
      alert("Not enough members to split into that many teams.");
      return;
    }

    // First shuffle
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Distribute into groups
    const resultTeams: string[][] = Array(teamCount).fill(null).map(() => []);
    shuffled.forEach((item, idx) => {
      const teamIdx = idx % teamCount;
      resultTeams[teamIdx].push(item);
    });

    setTeams(resultTeams);
    setShuffledList([]);
  };

  return (
    <div className="arena-card glass-panel" style={{ gridTemplateColumns: '1fr', display: 'flex', flexDirection: 'column', padding: '24px', height: '100%', width: '100%', boxSizing: 'border-box' }}>
      {/* Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', width: '100%' }}>
        <button 
          className={`btn ${activeTab === 'number' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 20px', borderRadius: '10px' }}
          onClick={() => setActiveTab('number')}
        >
          🎛️ Number Generator (RNG)
        </button>
        <button 
          className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 20px', borderRadius: '10px' }}
          onClick={() => setActiveTab('list')}
        >
          📋 List & Team Shuffler
        </button>
      </div>

      {/* RNG TAB */}
      {activeTab === 'number' && (
        <div className="rng-grid">
          {/* Main Visual Roll Box */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <div className="glass-panel" style={{
              width: '100%',
              maxWidth: '480px',
              height: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '100px',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: '800',
              letterSpacing: '0.05em',
              background: 'linear-gradient(135deg, rgba(8, 12, 20, 0.95), rgba(15, 23, 42, 0.95))',
              border: `2px solid ${isRolling ? 'var(--neon-cyan)' : 'var(--border-color-glow)'}`,
              borderRadius: '24px',
              boxShadow: isRolling ? '0 0 30px rgba(6, 182, 212, 0.3)' : '0 0 20px rgba(139, 92, 246, 0.2)',
              color: isRolling ? 'var(--neon-cyan)' : 'var(--text-primary)',
              transition: 'var(--transition-smooth)',
              marginBottom: '24px',
            }}>
              {rollingDigits}
            </div>

            {/* Config inputs & Spin Button */}
            <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Min Value</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    value={minVal} 
                    onChange={(e) => setMinVal(parseInt(e.target.value) || 0)} 
                    disabled={isRolling}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Max Value</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    value={maxVal} 
                    onChange={(e) => setMaxVal(parseInt(e.target.value) || 0)} 
                    disabled={isRolling}
                  />
                </div>
              </div>

              <button className="btn btn-primary" style={{ padding: '14px 20px', gap: '8px' }} onClick={rollNumber} disabled={isRolling}>
                <Play size={18} fill="#fff" />
                {isRolling ? 'Generating...' : 'Roll Number!'}
              </button>
            </div>
          </div>

          {/* History sidebar */}
          <div className="glass-panel rng-history-panel">
            <h4 style={{ fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--text-secondary)' }}>Recent Rolls</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
              {rngHistory.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', marginTop: '24px' }}>No rolls yet</div>
              ) : (
                rngHistory.map((num, i) => (
                  <div key={i} className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Roll #{rngHistory.length - i}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--neon-cyan)' }}>{num}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIST TAB */}
      {activeTab === 'list' && (
        <div className="shuffler-grid">
          {/* Inputs Column */}
          <div className="shuffler-inputs">
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Enter entries (one per line):</label>
            <textarea
              className="glass-input shuffler-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter list of items..."
            />

            {/* Direct Shuffle */}
            <button className="btn btn-secondary" style={{ width: '100%', gap: '8px' }} onClick={handleShuffleList}>
              <Shuffle size={16} /> Shuffle List
            </button>

            {/* Team config & Divide */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Team Count:</span>
                <input 
                  type="number" 
                  className="glass-input" 
                  style={{ width: '70px', padding: '6px 10px' }} 
                  min="2" 
                  max="10" 
                  value={teamCount} 
                  onChange={(e) => setTeamCount(parseInt(e.target.value) || 2)} 
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', gap: '8px' }} onClick={handleGenerateTeams}>
                <Users size={16} /> Split into Teams
              </button>
            </div>
          </div>

          {/* Outputs Column */}
          <div className="glass-panel shuffler-outputs" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Randomization Outputs</h4>

            {/* Flat Shuffled List */}
            {shuffledList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                {shuffledList.map((item, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: '10px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontWeight: '600' }}>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Divided Teams Grid */}
            {teams.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', overflowY: 'auto', flex: 1 }}>
                {teams.map((team, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                    <h5 style={{ fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px', marginBottom: '10px', color: idx % 2 === 0 ? 'var(--neon-cyan)' : 'var(--neon-purple)' }}>
                      Team {idx + 1}
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {team.map((member, i) => (
                        <div key={i} style={{ fontSize: '13px', fontWeight: '500' }}>• {member}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {shuffledList.length === 0 && teams.length === 0 && (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Configure inputs and select action to see output
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
