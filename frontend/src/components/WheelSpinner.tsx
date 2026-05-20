import React, { useRef, useEffect, useState } from 'react';
import { Play, Plus, Trash2 } from 'lucide-react';

// Reusable Audio Engine to prevent resource leaks
class AudioEngine {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTick(frequency = 500) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playWin() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(523.25, now, 0.15);       // C5
      playTone(659.25, now + 0.12, 0.15); // E5
      playTone(783.99, now + 0.24, 0.15); // G5
      playTone(1046.50, now + 0.36, 0.4); // C6
    } catch (e) {
      // Ignore
    }
  }
}

const audio = new AudioEngine();

export interface WheelSegment {
  label: string;
  weight: number;
  color: string;
}

interface WheelSpinnerProps {
  initialSegments?: WheelSegment[];
  onSpinStart?: () => void;
  onSpinComplete?: (index: number, result: string) => void;
  targetIndex?: number | null;     // Enforced target from WebSocket
  spinDuration?: number;           // Enforced spin time in seconds
  isMultiplayerMode?: boolean;
  onSegmentsChange?: (segments: WheelSegment[]) => void;
  triggerSpinToken?: number;
}

export const WheelSpinner: React.FC<WheelSpinnerProps> = ({
  initialSegments,
  onSpinStart,
  onSpinComplete,
  targetIndex = null,
  spinDuration = 5,
  isMultiplayerMode = false,
  onSegmentsChange,
  triggerSpinToken = 0,
}) => {
  const [segments, setSegments] = useState<WheelSegment[]>(
    initialSegments || [
      { label: 'Option A', weight: 1, color: 'hsl(260, 75%, 55%)' },
      { label: 'Option B', weight: 1, color: 'hsl(190, 80%, 50%)' },
      { label: 'Option C', weight: 1, color: 'hsl(330, 80%, 55%)' },
      { label: 'Option D', weight: 1, color: 'hsl(45, 90%, 50%)' },
      { label: 'Option E', weight: 1, color: 'hsl(145, 70%, 45%)' },
    ]
  );

  const [newLabel, setNewLabel] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [winnerResult, setWinnerResult] = useState<string | null>(null);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [removeOnSpin, setRemoveOnSpin] = useState(false);


  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const angleRef = useRef(0);
  const spinningRef = useRef(false);

  // Sync internal segments when initialSegments from parent changes
  useEffect(() => {
    if (initialSegments) {
      const serializedInit = JSON.stringify(initialSegments);
      const serializedCurr = JSON.stringify(segments);
      if (serializedInit !== serializedCurr) {
        setSegments(initialSegments);
      }
    }
  }, [initialSegments]);

  // Sync back segment changes to parent component
  const lastEmittedSegmentsRef = useRef<string>('');
  useEffect(() => {
    const serialized = JSON.stringify(segments);
    if (serialized !== lastEmittedSegmentsRef.current) {
      lastEmittedSegmentsRef.current = serialized;
      if (onSegmentsChange) {
        onSegmentsChange(segments);
      }
    }
  }, [segments, onSegmentsChange]);

  // Trigger spin animation when triggerSpinToken changes
  useEffect(() => {
    if (triggerSpinToken && triggerSpinToken > 0) {
      spin();
    }
  }, [triggerSpinToken]);

  // Generate an esthetically pleasing HSL color based on segment count
  const getHarmoniousColor = (index: number, total: number) => {
    const hue = (index * (360 / total)) % 360;
    return `hsl(${hue}, 80%, 55%)`;
  };

  const rebalanceColors = (segs: WheelSegment[]) => {
    return segs.map((s, i) => ({
      ...s,
      color: getHarmoniousColor(i, segs.length),
    }));
  };

  const handleAddSegment = () => {
    if (!newLabel.trim()) return;
    const updated = [
      ...segments,
      { label: newLabel.trim(), weight: 1, color: '' },
    ];
    const rebalanced = rebalanceColors(updated);
    setSegments(rebalanced);
    setNewLabel('');
  };

  const handleRemoveSegment = (index: number) => {
    if (segments.length <= 2) return; // Keep at least 2 segments
    const updated = segments.filter((_, i) => i !== index);
    setSegments(rebalanceColors(updated));
  };

  const handleWeightChange = (index: number, val: string) => {
    const num = parseFloat(val) || 1;
    const updated = [...segments];
    updated[index].weight = num < 0 ? 0 : num;
    setSegments(updated);
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [wheelSize, setWheelSize] = useState(560);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wheelSizeRef = useRef(560);

  useEffect(() => {
    const handleWindowResize = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  useEffect(() => {
    wheelSizeRef.current = wheelSize;
  }, [wheelSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      // Symmetrical 32px padding on all sides (total 64px)
      // Account for 50px of title height inside visualizer pane
      const padding = 64;
      const titleHeight = 50;
      const newSize = Math.max(280, Math.min(width, height - titleHeight) - padding);
      setWheelSize(newSize);
    };

    handleResize();

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);


  const drawWheelFrame = (ctx: CanvasRenderingContext2D, size: number, angle: number) => {
    const radius = size / 2;
    const cx = radius;
    const cy = radius;
    
    ctx.clearRect(0, 0, size, size);

    const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
    let currentAngle = angle;

    // Draw segments
    segments.forEach((seg) => {
      const sliceAngle = (seg.weight / totalWeight) * 2 * Math.PI;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius - 12, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();

      ctx.fillStyle = seg.color;
      ctx.fill();

      // Stroke segment
      ctx.strokeStyle = 'rgba(8, 12, 20, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(currentAngle + sliceAngle / 2);
      
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      // Dynamically compute font size based on text length to prevent overlap while maintaining proportions
      const baseFontSize = Math.max(13, Math.round(size / 27)); // e.g. 20px for size = 550
      let segmentFontSize = baseFontSize;
      if (seg.label.length <= 6) {
        segmentFontSize = Math.min(26, Math.round(baseFontSize * 1.3)); // Make short text significantly larger (e.g. up to 26px)
      } else if (seg.label.length > 12) {
        // Linearly scale down long text, floor at 12px to keep it highly readable and elegant
        const scaleFactor = Math.max(0.6, 1 - (seg.label.length - 12) * 0.04);
        segmentFontSize = Math.max(12, Math.round(baseFontSize * scaleFactor));
      }
      ctx.font = `bold ${segmentFontSize}px "Plus Jakarta Sans", sans-serif`;
      
      // Clip labels if extremely long to avoid center overlap
      let label = seg.label;
      const maxLabelLength = 32;
      if (label.length > maxLabelLength) label = label.substring(0, maxLabelLength - 2) + '...';
      ctx.fillText(label, radius - Math.max(28, size * 0.06), 0);
      ctx.restore();

      currentAngle += sliceAngle;
    });

    // Draw inner glowing center circle
    ctx.beginPath();
    const innerRadius = Math.max(24, Math.min(36, size * 0.06));
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
    ctx.lineWidth = Math.max(2, size * 0.006);
    ctx.stroke();

    // Outer gold decorative border ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 12, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = Math.max(3, size * 0.009);
    ctx.stroke();

    // Draw Indicator Needle (pointing inward towards the center of the wheel)
    ctx.beginPath();
    ctx.moveTo(size - Math.max(24, size * 0.06), cy); // Sharp tip pointing inward (to the left)
    ctx.lineTo(size - 2, cy - Math.max(10, size * 0.02)); // Top-right base corner
    ctx.lineTo(size - 2, cy + Math.max(10, size * 0.02)); // Bottom-right base corner
    ctx.closePath();
    ctx.fillStyle = '#ec4899';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // Render the Wheel on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = wheelSize;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    ctx.scale(dpr, dpr);

    drawWheelFrame(ctx, size, angleRef.current);
  }, [segments, wheelSize]);

  // Decoupled Physics Spin Loop
  const spin = () => {
    if (spinningRef.current) return;
    
    // Play sound engine init
    if (soundEnabled) audio.init();

    spinningRef.current = true;
    setIsSpinning(true);
    setWinnerResult(null);
    if (onSpinStart) onSpinStart();

    const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);

    // 1. Pick a landing index based on weights
    let selectedIdx = 0;
    if (targetIndex !== null && targetIndex >= 0 && targetIndex < segments.length) {
      selectedIdx = targetIndex;
    } else {
      const r = Math.random() * totalWeight;
      let tempSum = 0;
      for (let i = 0; i < segments.length; i++) {
        tempSum += segments[i].weight;
        if (r <= tempSum) {
          selectedIdx = i;
          break;
        }
      }
    }

    // 2. Calculate the exact landing angle matching the index.
    // In Canvas, Ctr segment starts at currentAngle. Indicators is at 0 rad (right).
    // Let's compute segments boundary angles relative to 2PI.
    let startSegmentAngle = 0;
    for (let i = 0; i < selectedIdx; i++) {
      startSegmentAngle += (segments[i].weight / totalWeight) * 2 * Math.PI;
    }
    const segmentWidth = (segments[selectedIdx].weight / totalWeight) * 2 * Math.PI;
    
    // Land in the middle of the selected segment
    const targetOffset = startSegmentAngle + segmentWidth / 2;
    
    // To land on 0 rad indicator, final angle needs to be:
    // angle = 2PI * rotations - targetOffset
    const baseRotations = 5;
    const finalAngle = 2 * Math.PI * baseRotations - targetOffset;

    // 3. Physics Simulation over exact Duration
    const durationMs = spinDuration * 1000;
    const startTime = performance.now();
    const startAngle = angleRef.current % (2 * Math.PI);

    let lastTickIdx = -1;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const t = Math.min(elapsed / durationMs, 1);

      // Ease Out Cubic formulation for super smooth slowing down
      const easeOut = 1 - Math.pow(1 - t, 3);
      angleRef.current = startAngle + (finalAngle - startAngle) * easeOut;

      // Render the frame
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const size = wheelSizeRef.current;
          drawWheelFrame(ctx, size, angleRef.current);
        }
      }

      // 4. Synthesizer clicking engine
      if (soundEnabled) {
        // Find which segment index is currently pointing at the needle (right side, index derived from angle)
        const normalizedAngle = (2 * Math.PI - (angleRef.current % (2 * Math.PI))) % (2 * Math.PI);
        let accumulated = 0;
        let tickSegment = 0;
        for (let i = 0; i < segments.length; i++) {
          accumulated += (segments[i].weight / totalWeight) * 2 * Math.PI;
          if (normalizedAngle <= accumulated) {
            tickSegment = i;
            break;
          }
        }

        if (tickSegment !== lastTickIdx) {
          lastTickIdx = tickSegment;
          // Dynamically pitch the click frequency slightly depending on the slice colors/position
          audio.playTick(450 + tickSegment * 15);
        }
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        // Spin has concluded
        spinningRef.current = false;
        setIsSpinning(false);
        const resultLabel = segments[selectedIdx].label;
        setWinnerResult(resultLabel);
        setWinnerIndex(selectedIdx);

        if (soundEnabled) {
          audio.playWin();
        }

        if (onSpinComplete) {
          onSpinComplete(selectedIdx, resultLabel);
        }
      }
    };


    requestAnimationFrame(animate);
  };

  return (
    <div className="arena-card glass-panel" style={isMobile ? { width: '100%' } : { height: '100%', width: '100%', minHeight: 0, flex: 1 }}>
      {/* Visual Canvas Pane */}
      <div ref={containerRef} className="visualizer-pane">
        <h3 style={{
          marginBottom: '20px',
          background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '22px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          3D Wheel Spinner
        </h3>
        <canvas ref={canvasRef} />
        
        {/* Premium Winner Celebration Modal */}
        {winnerResult && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(8, 12, 20, 0.82)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'backdropFade 0.25s ease-out'
          }}>
            <div className="glass-panel pulse-glow" style={{
              width: '90%',
              maxWidth: '420px',
              padding: '36px 28px',
              textAlign: 'center',
              border: '2px solid var(--neon-cyan)',
              background: 'rgba(15, 23, 42, 0.95)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              animation: 'fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <div style={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: 'var(--neon-cyan)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em'
              }}>
                Spin Result
              </div>
              
              <h2 style={{
                fontSize: '32px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #ffffff, var(--text-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                We Have a Winner!
              </h2>

              <div style={{
                fontSize: '26px',
                fontWeight: 800,
                color: 'var(--neon-pink)',
                textShadow: '0 0 12px var(--neon-pink-glow)',
                margin: '12px 0',
                wordBreak: 'break-word',
                padding: '0 10px',
                lineHeight: '1.3'
              }}>
                {winnerResult}
              </div>

              {removeOnSpin && (
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(236, 72, 153, 0.05)',
                  border: '1px solid rgba(236, 72, 153, 0.1)',
                  marginTop: '-4px'
                }}>
                  This option will be removed for the next spin
                </div>
              )}

              <button
                className="btn btn-cyan"
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  marginTop: '8px'
                }}
                onClick={() => {
                  if (removeOnSpin && winnerIndex !== null) {
                    handleRemoveSegment(winnerIndex);
                  }
                  setWinnerResult(null);
                  setWinnerIndex(null);
                }}
              >
                Awesome!
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Configurations panel */}
      <div className="config-pane">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>Configure Options</h3>
        </div>

        {/* Premium Settings Controls (Immersive - No Border/Background) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Sound Effects</span>
            <label className="switch" style={{
              position: 'relative',
              display: 'inline-block',
              width: '38px',
              height: '20px'
            }}>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0,
                  position: 'absolute'
                }}
              />
              <span className="slider" style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: soundEnabled ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.1)',
                transition: '.3s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: soundEnabled ? '0 0 8px var(--neon-cyan-glow)' : 'none'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '14px',
                  width: '14px',
                  left: soundEnabled ? '20px' : '2px',
                  bottom: '2px',
                  backgroundColor: '#fff',
                  transition: '.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                }} />
              </span>
            </label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Remove winner after spin</span>
            <label className="switch" style={{
              position: 'relative',
              display: 'inline-block',
              width: '38px',
              height: '20px'
            }}>
              <input
                type="checkbox"
                checked={removeOnSpin}
                onChange={(e) => setRemoveOnSpin(e.target.checked)}
                disabled={isSpinning}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0,
                  position: 'absolute'
                }}
              />
              <span className="slider" style={{
                position: 'absolute',
                cursor: isSpinning ? 'not-allowed' : 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: removeOnSpin ? 'var(--neon-purple)' : 'rgba(255, 255, 255, 0.1)',
                transition: '.3s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: removeOnSpin ? '0 0 8px var(--neon-purple-glow)' : 'none'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '14px',
                  width: '14px',
                  left: removeOnSpin ? '20px' : '2px',
                  bottom: '2px',
                  backgroundColor: '#fff',
                  transition: '.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* List of segment options */}
        <div className="option-list">
          {segments.map((seg, idx) => (
            <div key={idx} className="option-row">
              <div className="option-color-dot" style={{ backgroundColor: seg.color }} />
              <input
                type="text"
                className="glass-input"
                style={{ padding: '6px 12px', flex: 1 }}
                value={seg.label}
                onChange={(e) => {
                  const updated = [...segments];
                  updated[idx].label = e.target.value;
                  setSegments(updated);
                }}
                disabled={isSpinning || isMultiplayerMode}
              />
              <input
                type="number"
                className="glass-input"
                style={{ padding: '6px 8px', width: '60px' }}
                value={seg.weight}
                min="0"
                step="0.5"
                onChange={(e) => handleWeightChange(idx, e.target.value)}
                disabled={isSpinning || isMultiplayerMode}
                title="Weight / Probability factor"
              />
              <button
                className="btn-remove"
                onClick={() => handleRemoveSegment(idx)}
                disabled={isSpinning || segments.length <= 2 || isMultiplayerMode}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Add option bar */}
        {!isMultiplayerMode && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="glass-input"
              style={{ padding: '8px 12px' }}
              placeholder="Add segment label..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSegment()}
              disabled={isSpinning}
            />
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={handleAddSegment} disabled={isSpinning}>
              <Plus size={18} />
            </button>
          </div>
        )}

        {/* Spin trigger buttons */}
        {!isMultiplayerMode && (
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', gap: '10px', fontSize: '15px', padding: '14px 20px' }}
              onClick={spin}
              disabled={isSpinning}
            >
              <Play size={20} fill="#fff" />
              {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
