import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCw } from 'lucide-react';

interface PlinkoPeg {
  x: number;
  y: number;
  radius: number;
  impactScale: number; // For hit animations
}

interface PlinkoBucket {
  label: string;
  color: string;
  xStart: number;
  xEnd: number;
}

export const PlinkoBoard3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [optionsText, setOptionsText] = useState("Burgers\nPizza\nSushi\nSalad\nTacos");
  const [isDropping, setIsDropping] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  
  // Physics parameters
  const pegRadius = 4;
  const ballRadius = 8;
  const gravity = 0.16;
  const restitution = 0.55; // Bounciness
  
  const [buckets, setBuckets] = useState<PlinkoBucket[]>([]);

  // Parse options and prepare buckets
  useEffect(() => {
    const list = optionsText.split('\n').map(s => s.trim()).filter(Boolean);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const bucketWidth = width / list.length;
    const colors = [
      '#06b6d4', // Cyan
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#f59e0b', // Yellow
      '#10b981', // Green
      '#3b82f6', // Blue
      '#ef4444', // Red
    ];

    const preparedBuckets = list.map((item, idx) => ({
      label: item,
      color: colors[idx % colors.length],
      xStart: idx * bucketWidth,
      xEnd: (idx + 1) * bucketWidth
    }));

    setBuckets(preparedBuckets);
  }, [optionsText]);

  const dropBall = () => {
    if (isDropping) return;
    setIsDropping(true);
    setWinner(null);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // 1. Generate peg grid dynamically
    const rows = 7;
    const pegList: PlinkoPeg[] = [];
    const startY = 60;
    const rowSpacing = 38;
    
    for (let r = 0; r < rows; r++) {
      const pegsInRow = r + 3;
      const xSpacing = width / (pegsInRow + 1);
      const y = startY + r * rowSpacing;
      
      for (let p = 0; p < pegsInRow; p++) {
        pegList.push({
          x: xSpacing * (p + 1),
          y: y,
          radius: pegRadius,
          impactScale: 1.0
        });
      }
    }

    // 2. Set ball parameters
    let bx = width / 2 + (Math.random() - 0.5) * 15; // Slightly randomized drop center
    let by = 15;
    let bvx = 0;
    let bvy = 1;

    // 3. Bucket height
    const bucketHeight = 45;
    
    let animationId: number;

    const updatePhysics = () => {
      // Apply gravity
      bvy += gravity;
      
      // Drag/air resistance
      bvx *= 0.995;
      bvy *= 0.995;

      // Update position
      bx += bvx;
      by += bvy;

      // Wall collisions (left/right)
      if (bx < ballRadius) {
        bx = ballRadius;
        bvx = -bvx * restitution;
      } else if (bx > width - ballRadius) {
        bx = width - ballRadius;
        bvx = -bvx * restitution;
      }

      // Check peg collisions
      pegList.forEach(peg => {
        const dx = bx - peg.x;
        const dy = by - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = ballRadius + peg.radius;

        if (dist < minDist) {
          // Push ball out of peg overlap
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          bx += nx * overlap;
          by += ny * overlap;

          // Reflect velocity vector about normal
          const dot = bvx * nx + bvy * ny;
          bvx = (bvx - 2 * dot * nx) * restitution;
          bvy = (bvy - 2 * dot * ny) * restitution;

          // Add random jitter to break static paths
          bvx += (Math.random() - 0.5) * 0.7;
          bvy += 0.2;

          // Trigger hit scale pulse animation
          peg.impactScale = 2.2;
        }

        // Cool down peg impact animations
        if (peg.impactScale > 1.0) {
          peg.impactScale -= 0.1;
        }
      });

      // Render loop
      ctx.clearRect(0, 0, width, height);

      // Draw peg grid
      pegList.forEach(peg => {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius * peg.impactScale, 0, Math.PI * 2);
        
        if (peg.impactScale > 1.05) {
          ctx.fillStyle = 'var(--neon-cyan)';
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'var(--neon-cyan)';
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // Draw Bucket Gradients and Divider lines
      const bucketWidth = width / buckets.length;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      
      buckets.forEach((bucket, i) => {
        // Draw bucket divider line
        if (i > 0) {
          ctx.beginPath();
          ctx.moveTo(bucket.xStart, height - bucketHeight);
          ctx.lineTo(bucket.xStart, height);
          ctx.stroke();
        }

        // Draw Bucket neon indicator tags
        ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
        ctx.fillRect(bucket.xStart, height - bucketHeight, bucketWidth, bucketHeight);

        ctx.fillStyle = bucket.color;
        ctx.font = '10px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          bucket.label.substring(0, 10).toUpperCase(),
          bucket.xStart + bucketWidth / 2,
          height - 18
        );

        ctx.fillStyle = bucket.color;
        ctx.fillRect(bucket.xStart, height - 3, bucketWidth, 3);
      });

      // Draw Ball
      ctx.beginPath();
      ctx.arc(bx, by, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'var(--neon-cyan)';
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Check if ball landed inside the buckets
      if (by >= height - bucketHeight - ballRadius) {
        // Find which bucket it landed inside
        const winIdx = Math.min(
          buckets.length - 1,
          Math.max(0, Math.floor(bx / bucketWidth))
        );
        const winBucket = buckets[winIdx];

        // Draw final ripple pulse in the winning bucket
        ctx.fillStyle = winBucket.color + '20';
        ctx.fillRect(winBucket.xStart, height - bucketHeight, bucketWidth, bucketHeight);

        setWinner(winBucket.label);
        setIsDropping(false);
        cancelAnimationFrame(animationId);
      } else {
        animationId = requestAnimationFrame(updatePhysics);
      }
    };

    updatePhysics();
  };

  return (
    <div className="arena-card glass-panel" style={{ gridTemplateColumns: '1fr 340px', gap: '32px', padding: '32px', boxSizing: 'border-box', height: '100%', width: '100%', minHeight: 0 }}>
      {/* Canvas Drop Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', minHeight: 0 }}>
        <h3 style={{ marginBottom: '8px', background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '22px' }}>
          🟢 Neon Plinko Board
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
          Drop the ball into the peg matrix and watch gravity make the decision.
        </p>

        {/* Board Canvas Wrapper */}
        <div className="glass-panel" style={{
          padding: '16px',
          background: 'rgba(8, 12, 20, 0.85)',
          borderRadius: '24px',
          boxShadow: isDropping ? '0 0 30px rgba(6, 182, 212, 0.15)' : '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
          position: 'relative',
          marginBottom: '20px',
          width: '100%',
          maxWidth: '460px',
          boxSizing: 'border-box'
        }}>
          <canvas
            ref={canvasRef}
            width={420}
            height={360}
            style={{
              width: '100%',
              display: 'block',
              background: 'radial-gradient(circle at center, rgba(16, 24, 48, 0.4) 0%, transparent 80%)'
            }}
          />
        </div>

        {/* Action button & outcome display */}
        <div style={{ width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {winner && !isDropping && (
            <div className="pulse-glow glass-panel floating" style={{
              padding: '10px 24px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--neon-cyan)',
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontWeight: 'bold',
              borderRadius: '20px',
              textAlign: 'center',
              alignSelf: 'center'
            }}>
              Landed on: <span style={{ color: 'var(--neon-cyan)', fontSize: '18px' }}>{winner}</span>
            </div>
          )}

          <button className="btn btn-primary" style={{ padding: '14px 20px', gap: '8px' }} onClick={dropBall} disabled={isDropping}>
            <Play size={16} fill="#fff" />
            {isDropping ? 'Dropping ball...' : 'Release Neon Ball!'}
          </button>
        </div>
      </div>

      {/* Options Sidebar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, boxSizing: 'border-box' }}>
        <h4 style={{ fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--text-secondary)' }}>PLINKO BUCKETS</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '10px', minHeight: 0 }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bucket items (one per line, 3-10 max):</label>
          <textarea
            className="glass-input"
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            placeholder="Burgers\nPizza\nSushi"
            style={{ flex: 1, minHeight: '180px', fontSize: '13px', fontFamily: 'monospace', resize: 'none' }}
            disabled={isDropping}
          />
          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: '12px', gap: '6px' }}
            onClick={() => setOptionsText("Option A\nOption B\nOption C\nOption D\nOption E")}
            disabled={isDropping}
          >
            <RotateCw size={12} /> Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};
