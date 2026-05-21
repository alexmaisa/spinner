import React, { useState } from 'react';
import { Play, RotateCw } from 'lucide-react';

interface TarotCard {
  id: number;
  label: string;
  isFlipped: boolean;
  color: string;
}

export const TarotCardDealer: React.FC = () => {
  const [optionsText, setOptionsText] = useState("Fortune\nDestiny\nSuccess\nWisdom\nStrength");
  const [cards, setCards] = useState<TarotCard[]>([
    { id: 1, label: 'Fortune', isFlipped: false, color: 'var(--neon-cyan)' },
    { id: 2, label: 'Destiny', isFlipped: false, color: 'var(--neon-purple)' },
    { id: 3, label: 'Success', isFlipped: false, color: 'var(--neon-pink)' }
  ]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [drawnCard, setDrawnCard] = useState<TarotCard | null>(null);

  const shuffleAndDeal = () => {
    if (isShuffling) return;

    const list = optionsText.split('\n').map(s => s.trim()).filter(Boolean);
    if (list.length < 3) {
      alert("Please enter at least 3 items to deal Tarot cards.");
      return;
    }

    setIsShuffling(true);
    setDrawnCard(null);

    // Reset flips
    setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));

    // Let shuffle animation run for 1.2 seconds
    setTimeout(() => {
      // Pick 3 random distinct options from the list
      const pool = [...list];
      const selected: string[] = [];

      for (let i = 0; i < 3; i++) {
        if (pool.length === 0) break;
        const randIdx = Math.floor(Math.random() * pool.length);
        selected.push(pool.splice(randIdx, 1)[0]);
      }

      const colors = ['var(--neon-cyan)', 'var(--neon-purple)', 'var(--neon-pink)'];
      const newCards = selected.map((label, idx) => ({
        id: idx + 1,
        label: label,
        isFlipped: false,
        color: colors[idx % colors.length]
      }));

      // Shuffle order of cards visually
      setCards(newCards);
      setIsShuffling(false);
    }, 1200);
  };

  const drawCard = (cardId: number) => {
    if (isShuffling || drawnCard) return;

    const clickedCard = cards.find(c => c.id === cardId);
    if (!clickedCard) return;

    // Flip the clicked card
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c));
    setDrawnCard(clickedCard);
  };

  return (
    <div className="arena-card glass-panel" style={{ gridTemplateColumns: '1fr 340px', gap: '32px', padding: '32px', boxSizing: 'border-box', height: '100%', width: '100%', minHeight: 0 }}>
      {/* Tarot Deal Board Arena */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', minHeight: 0 }}>
        <h3 style={{ marginBottom: '8px', background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '22px' }}>
          🃏 Tarot Card Dealer
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '25px', textAlign: 'center' }}>
          Draw a card from the cybernetic spread to reveal your outcome.
        </p>

        {/* Tarot Cards Deck Field */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          height: '240px',
          width: '100%',
          perspective: '1000px',
          position: 'relative',
          marginBottom: '20px'
        }}>
          {cards.map(card => {
            const isTarget = drawnCard && drawnCard.id === card.id;
            const isOther = drawnCard && drawnCard.id !== card.id;

            return (
              <div
                key={card.id}
                onClick={() => drawCard(card.id)}
                className={`tarot-card ${isShuffling ? 'card-cascade' : ''}`}
                style={{
                  width: '120px',
                  height: '190px',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  transform: card.isFlipped ? 'rotateY(180deg) scale(1.05)' : 'rotateY(0deg)',
                  transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease',
                  cursor: drawnCard ? 'default' : 'pointer',
                  opacity: isOther ? 0.35 : 1,
                  boxShadow: isTarget ? `0 0 30px ${card.color}` : '0 8px 24px rgba(0,0,0,0.4)',
                  borderRadius: '16px'
                }}
              >
                {/* Back Face (Face-down card) */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #0b101c 0%, #1e293b 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 15px rgba(0,0,0,0.6)'
                }}>
                  {/* Cyber matrix design on card backs */}
                  <div style={{
                    width: '90px',
                    height: '160px',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(6, 182, 212, 0.01)',
                    position: 'relative'
                  }}>
                    <span style={{ fontSize: '24px', filter: 'opacity(0.35)' }}>🃏</span>
                  </div>
                </div>

                {/* Front Face (Face-up card) */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
                  border: `2.5px solid ${card.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotateY(180deg)'
                }}>
                  <div style={{
                    width: '94px',
                    height: '164px',
                    border: `1px solid ${card.color}25`,
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ fontSize: '32px', filter: `drop-shadow(0 0 8px ${card.color})`, marginBottom: '12px' }}>✨</span>
                    <span style={{
                      color: card.color,
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      lineHeight: '1.3',
                      textShadow: `0 0 8px ${card.color}60`
                    }}>
                      {card.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CSS cascade/shuffle animations injection */}
        <style>{`
          @keyframes cascade-shuffle {
            0% { transform: translateX(0) rotate(0); z-index: 1; }
            25% { transform: translateX(-150px) rotate(-10deg) scale(0.95); z-index: 10; }
            50% { transform: translateX(150px) rotate(10deg) scale(0.95); z-index: 10; }
            75% { transform: translateX(0) scale(1.02); z-index: 5; }
            100% { transform: translateX(0) rotate(0); z-index: 1; }
          }
          .card-cascade {
            animation: cascade-shuffle 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          }
        `}</style>

        {/* Shuffling Control & Drawn outcome container */}
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {drawnCard && !isShuffling && (
            <div className="pulse-glow glass-panel floating" style={{
              padding: '10px 24px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: `1px solid ${drawnCard.color}`,
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontWeight: 'bold',
              borderRadius: '20px',
              textAlign: 'center',
              alignSelf: 'center'
            }}>
              Drawn: <span style={{ color: drawnCard.color, fontSize: '18px' }}>{drawnCard.label}</span>
            </div>
          )}

          <button className="btn btn-primary" style={{ padding: '14px 20px', gap: '8px' }} onClick={shuffleAndDeal} disabled={isShuffling}>
            <Play size={16} fill="#fff" />
            {isShuffling ? 'Shuffling Deck...' : 'Shuffle & Deal Cards'}
          </button>
        </div>
      </div>

      {/* Options Sidebar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, boxSizing: 'border-box' }}>
        <h4 style={{ fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>TAROT DECK</h4>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '10px', minHeight: 0 }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Deck choices (one per line, 3 min):</label>
          <textarea
            className="glass-input"
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            placeholder="Fortune\nDestiny\nSuccess"
            style={{ flex: 1, minHeight: '180px', fontSize: '13px', fontFamily: 'monospace', resize: 'none' }}
            disabled={isShuffling || !!drawnCard}
          />
          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: '12px', gap: '6px' }}
            onClick={() => {
              setOptionsText("Career\nHealth\nWealth\nTravel\nFamily");
              setDrawnCard(null);
            }}
            disabled={isShuffling || !!drawnCard}
          >
            <RotateCw size={12} /> Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};
