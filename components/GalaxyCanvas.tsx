import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { ThoughtNode, ViewState } from '../types';
import { PhysicsConfig } from './PhysicsControls';

interface GalaxyCanvasProps {
  thoughts: ThoughtNode[];
  viewState: ViewState;
  setViewState: (v: ViewState | ((prev: ViewState) => ViewState)) => void;
  onNodeClick: (node: ThoughtNode) => void;
  selectedNodeId: string | null;
  physicsConfig: PhysicsConfig;
}

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex.startsWith('#')) return hex;
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface Star {
  x: number; y: number; z: number; size: number; opacity: number;
}

// 3D Projection Helper
const projectPoint = (
    x: number, y: number, z: number, 
    angleX: number, angleY: number, 
    cameraZ: number, 
    width: number, height: number
) => {
    const radX = angleX * Math.PI / 180;
    const radY = angleY * Math.PI / 180;

    const x1 = x * Math.cos(radY) - z * Math.sin(radY);
    const z1 = x * Math.sin(radY) + z * Math.cos(radY);

    const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);

    const perspective = 1200;
    const worldZ = cameraZ + z2; 
    const scale = perspective / (perspective - worldZ);

    return { 
        x: width / 2 + x1 * scale, 
        y: height / 2 + y2 * scale, 
        scale, 
        isBehindCamera: worldZ > perspective 
    };
};

type PhysicsNode = ThoughtNode & { fx: number, fy: number, fz: number, isSleeping: boolean };

export const GalaxyCanvas: React.FC<GalaxyCanvasProps> = ({ 
  thoughts, 
  viewState, 
  setViewState, 
  onNodeClick, 
  selectedNodeId,
  physicsConfig 
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // PHYSICS REFS (Mutable state for 60FPS)
  const physicsNodes = useRef<Map<string, PhysicsNode>>(new Map());
  const nodeElements = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Store physics config in ref to access inside animate loop without re-binding
  const configRef = useRef(physicsConfig);
  useEffect(() => {
      configRef.current = physicsConfig;
  }, [physicsConfig]);

  // Initialize Physics State from props
  useEffect(() => {
      thoughts.forEach(t => {
          if (!physicsNodes.current.has(t.id)) {
              // New node? Add it.
              physicsNodes.current.set(t.id, { ...t, fx: 0, fy: 0, fz: 0, isSleeping: false });
          } else {
              // Update connections/content/color but KEEP physics position
              const existing = physicsNodes.current.get(t.id)!;
              // If connections changed, wake up the node
              const connectionsChanged = t.connections.length !== existing.connections.length;
              physicsNodes.current.set(t.id, { 
                  ...existing, 
                  ...t, 
                  x: existing.x, y: existing.y, z: existing.z,
                  isSleeping: connectionsChanged ? false : existing.isSleeping
              });
          }
      });
  }, [thoughts]);
  
  // Interaction State
  const isDragging = useRef(false);
  const dragTarget = useRef<string | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0.1, y: 0 }); 
  const rafRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Atmosphere
  const [stars, setStars] = useState<Star[]>([]);
  useEffect(() => {
    const newStars: Star[] = [];
    for (let i = 0; i < 800; i++) { 
        const r = 1000 + Math.random() * 2000;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        newStars.push({
            x: r * Math.sin(phi) * Math.cos(theta),
            y: r * Math.sin(phi) * Math.sin(theta),
            z: r * Math.cos(phi),
            size: Math.random() * 1.5,
            opacity: 0.1 + Math.random() * 0.5
        });
    }
    setStars(newStars);
  }, []);

  const activeNodeId = hoveredNodeId || selectedNodeId;
  const activeNode = thoughts.find(t => t.id === activeNodeId);

  // Resize Handler
  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- THE PHYSICS LOOP ---
  const animate = useCallback(() => {
    const nodes: PhysicsNode[] = Array.from(physicsNodes.current.values());
    const nodeCount = nodes.length;
    const P = configRef.current; 
    
    // Total Energy Tracker to help systems settle
    let totalEnergy = 0;

    // Reset forces
    for (let i = 0; i < nodeCount; i++) {
        nodes[i].fx = 0;
        nodes[i].fy = 0;
        nodes[i].fz = 0;
    }

    // 1. Calculate Forces (Optimized)
    for (let i = 0; i < nodeCount; i++) {
        const a = nodes[i];
        if (a.isSleeping && !dragTarget.current) continue; // Skip force calc for sleeping nodes if not interacting

        // C. Center Gravity (Apply once per node)
        // Keeps the galaxy centered
        a.fx -= a.x * P.CENTER_GRAVITY;
        a.fy -= a.y * P.CENTER_GRAVITY;
        a.fz -= a.z * P.CENTER_GRAVITY;

        // B. Attraction (Springs)
        for (const connId of a.connections) {
            const b = physicsNodes.current.get(connId);
            if (b) {
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dz = a.z - b.z;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                
                const displacement = dist - P.SPRING_LENGTH;
                const force = displacement * P.STIFFNESS;

                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                const fz = (dz / dist) * force;

                a.fx -= fx;
                a.fy -= fy;
                a.fz -= fz;
                
                // Wake up neighbor if I pull them hard
                if (Math.abs(force) > 0.1) b.isSleeping = false;
            }
        }

        // A. Repulsion (Optimized to only check nearby or sample)
        // Full N^2 is too slow for 500 nodes (250,000 iterations). 
        // We will optimization: Check all nodes, but exit early if too far.
        for (let j = i + 1; j < nodeCount; j++) {
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dz = a.z - b.z;
            const distSq = dx*dx + dy*dy + dz*dz || 1;
            
            // Optimization: Ignore distant nodes for repulsion
            if (distSq > 1000000) continue; // 1000px distance squared

            const dist = Math.sqrt(distSq);
            // Limit max repulsion to prevent explosions (clamping)
            const force = Math.min(P.REPULSION / distSq, 20); 
            
            const rfx = (dx / dist) * force;
            const rfy = (dy / dist) * force;
            const rfz = (dz / dist) * force;

            a.fx += rfx;
            a.fy += rfy;
            a.fz += rfz;

            b.fx -= rfx;
            b.fy -= rfy;
            b.fz -= rfz;
            
            if (force > 0.05) b.isSleeping = false;
        }
    }

    // 2. Apply Velocity & Position
    for (let i = 0; i < nodeCount; i++) {
        const a = nodes[i];
        if (dragTarget.current === a.id) {
             a.vx = 0; a.vy = 0; a.vz = 0;
             a.isSleeping = false;
             continue;
        }
        
        if (a.isSleeping) continue;

        // Apply Forces to Velocity
        a.vx = (a.vx + a.fx) * P.DAMPING;
        a.vy = (a.vy + a.fy) * P.DAMPING;
        a.vz = (a.vz + a.fz) * P.DAMPING;

        const speed = Math.sqrt(a.vx*a.vx + a.vy*a.vy + a.vz*a.vz);
        totalEnergy += speed;

        // STABILIZATION / SLEEP
        // If moving extremely slowly, just stop to prevent jitter
        if (speed < 0.02) {
            a.vx = 0; a.vy = 0; a.vz = 0;
            a.isSleeping = true;
        } else {
            a.x += a.vx;
            a.y += a.vy;
            a.z += a.vz;
        }
    }

    // 3. Camera Rotation
    if (!isDragging.current) {
        velocity.current.x *= 0.95;
        velocity.current.y *= 0.95;
        if (Math.abs(velocity.current.x) > 0.001 || Math.abs(velocity.current.y) > 0.001) {
            setViewState(prev => ({
                ...prev,
                rotationY: prev.rotationY + velocity.current.x,
                rotationX: Math.max(-85, Math.min(85, prev.rotationX + velocity.current.y))
            }));
        }
    }

    // 4. Render DOM positions
    // Optimization: Batch style updates? No, direct DOM manipulation is fine for 500 if careful.
    nodes.forEach(node => {
        const el = nodeElements.current.get(node.id);
        if (el) {
            // Only update DOM if not sleeping or camera is moving
            // Actually, camera rotation affects transform even if x/y/z static.
            // So we must update every frame.
             el.style.transform = `
                translate3d(${node.x}px, ${node.y}px, ${node.z}px)
                rotateY(${-viewState.rotationY}deg) 
                rotateX(${-viewState.rotationX}deg)
            `;
        }
    });

    // 5. Render Canvas (Connections)
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
        const { width, height } = canvasRef.current;
        ctx.clearRect(0, 0, width, height);

        // Stars
        ctx.fillStyle = "#fff";
        stars.forEach(star => {
            const pos = projectPoint(star.x, star.y, star.z, viewState.rotationX, viewState.rotationY, viewState.z * 0.5, width, height);
            if (!pos.isBehindCamera) {
                ctx.globalAlpha = star.opacity * (pos.scale * 0.8);
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, star.size * pos.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Pre-calculate projections
        const projectedNodes = new Map();
        nodes.forEach(node => {
             projectedNodes.set(node.id, projectPoint(node.x, node.y, node.z, viewState.rotationX, viewState.rotationY, viewState.z, width, height));
        });

        ctx.lineCap = 'round';
        
        // Draw connections
        nodes.forEach(node => {
             const startPos = projectedNodes.get(node.id);
             if (startPos && !startPos.isBehindCamera) {
                 const isActive = activeNodeId === node.id;

                 node.connections.forEach(connId => {
                     // Draw only one direction
                     if (connId < node.id) return;

                     const endPos = projectedNodes.get(connId);
                     if (endPos && !endPos.isBehindCamera) {
                         const isHighlighed = isActive && (node.id === activeNodeId || connId === activeNodeId);
                         
                         // Visual Style: Organic & Minimal
                         const baseAlpha = isHighlighed ? 0.6 : 0.05; 
                         const lineWidth = isHighlighed ? 1.5 : 0.5;

                         ctx.beginPath();
                         ctx.moveTo(startPos.x, startPos.y);
                         ctx.lineTo(endPos.x, endPos.y);
                         
                         if (isHighlighed) {
                             ctx.strokeStyle = `rgba(255, 255, 255, ${baseAlpha})`;
                         } else {
                             // Very subtle connection lines for the organic web look
                             ctx.strokeStyle = `rgba(200, 220, 255, ${baseAlpha})`;
                         }
                         
                         ctx.lineWidth = lineWidth * startPos.scale;
                         ctx.stroke();
                     }
                 });
             }
        });
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [setViewState, activeNodeId, viewState.rotationX, viewState.rotationY, viewState.z, stars]);

  useEffect(() => {
      rafRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragTarget.current = null;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 }; 
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current && !dragTarget.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setViewState(prev => ({ 
        ...prev, 
        rotationY: prev.rotationY + dx * 0.3, 
        rotationX: Math.max(-85, Math.min(85, prev.rotationX - dy * 0.3))
      }));
      velocity.current = { x: dx * 0.3, y: -dy * 0.3 };
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    dragTarget.current = null;
  };

  return (
    <div 
      className="absolute inset-0 overflow-hidden bg-[#05080a]"
      onWheel={(e) => {
          const newZ = Math.min(Math.max(viewState.z - e.deltaY * 1.5, -4000), 1000);
          setViewState(prev => ({ ...prev, z: newZ }));
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ perspective: '1200px', cursor: isDragging.current ? 'grabbing' : 'grab' }} 
    >
      <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="absolute inset-0 pointer-events-none z-0" />

      {/* 3D DOM Elements Layer */}
      <div 
        className="absolute transform-style-3d will-change-transform"
        style={{ 
          top: '50%', left: '50%', width: 0, height: 0,
          transform: `translate3d(0, 0, ${viewState.z}px) rotateX(${viewState.rotationX}deg) rotateY(${viewState.rotationY}deg)`,
          zIndex: 1
        }}
      >
        {thoughts.map((node) => {
          const isActive = activeNodeId === node.id || activeNode?.connections.includes(node.id);
          const isDimmed = activeNodeId && !isActive;
          
          return (
            <div
              key={node.id}
              ref={el => { if(el) nodeElements.current.set(node.id, el); }}
              className={`absolute transform-style-3d`}
              style={{
                // Initial transform, updated by physics loop
                transform: `translate3d(${node.x}px, ${node.y}px, ${node.z}px)`,
                width: '0px', height: '0px',
                zIndex: isActive ? 100 : 1,
                opacity: isDimmed ? 0.1 : 0.8,
                transition: 'opacity 0.4s ease-out'
              }}
            >
               <div 
                 onClick={(e) => { e.stopPropagation(); onNodeClick(node); }}
                 onMouseDown={(e) => {
                     e.stopPropagation();
                     isDragging.current = true;
                     dragTarget.current = node.id;
                     // Wake up node on drag
                     const pNode = physicsNodes.current.get(node.id);
                     if (pNode) pNode.isSleeping = false;
                 }}
                 onMouseEnter={() => setHoveredNodeId(node.id)}
                 onMouseLeave={() => setHoveredNodeId(null)}
                 className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center group"
                 style={{ width: '40px', height: '40px' }} 
               >
                  {/* Organic Node Appearance: Simple, White/Blue Glow */}
                  <div 
                    className="rounded-full transition-all duration-300"
                    style={{
                        width: isActive ? '8px' : '4px', 
                        height: isActive ? '8px' : '4px',
                        background: '#e2e8f0', // Uniform Starlight Color
                        boxShadow: isActive 
                            ? `0 0 15px 2px #38bdf8` // Cyan glow when active
                            : `0 0 5px 0px rgba(255,255,255,0.3)` // Subtle glow normally
                    }}
                  />
                  
                  {/* Label - Visible on hover/active or if very close (LOD could go here) */}
                  <div 
                    className={`
                        absolute top-full mt-2 w-48 text-center
                        text-[8px] font-medium tracking-wide
                        transition-all duration-300 pointer-events-none select-none
                        ${isActive || hoveredNodeId === node.id ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                    `}
                  >
                      <span className="bg-black/80 backdrop-blur text-white/90 px-2 py-1 rounded border border-white/10">
                        {node.content.split(' ').slice(0, 4).join(' ')}...
                      </span>
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};