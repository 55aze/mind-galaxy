import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ThoughtNode, ViewState, Cluster } from '../types';
import { PhysicsConfig } from './PhysicsControls';

interface GalaxyCanvasProps {
  thoughts: ThoughtNode[];
  viewState: ViewState;
  setViewState: (v: ViewState | ((prev: ViewState) => ViewState)) => void;
  onNodeClick: (node: ThoughtNode) => void;
  selectedNodeId: string | null;
  physicsConfig: PhysicsConfig;
  clusters: Cluster[];
}

type PhysicsNode = ThoughtNode & { fx: number, fy: number, isSleeping: boolean };

export const GalaxyCanvas: React.FC<GalaxyCanvasProps> = ({
  thoughts,
  viewState,
  setViewState,
  onNodeClick,
  selectedNodeId,
  physicsConfig,
  clusters
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // PHYSICS REFS
  const physicsNodes = useRef<Map<string, PhysicsNode>>(new Map());
  const configRef = useRef(physicsConfig);

  useEffect(() => {
    configRef.current = physicsConfig;
  }, [physicsConfig]);

  // Initialize Physics State from props
  useEffect(() => {
    thoughts.forEach(t => {
      if (!physicsNodes.current.has(t.id)) {
        physicsNodes.current.set(t.id, { ...t, fx: 0, fy: 0, isSleeping: false });
      } else {
        const existing = physicsNodes.current.get(t.id)!;
        const connectionsChanged = t.connections.length !== existing.connections.length;
        physicsNodes.current.set(t.id, {
          ...existing,
          ...t,
          x: existing.x, y: existing.y,
          isSleeping: connectionsChanged ? false : existing.isSleeping
        });
      }
    });

    // Remove deleted nodes
    const thoughtIds = new Set(thoughts.map(t => t.id));
    for (const id of physicsNodes.current.keys()) {
      if (!thoughtIds.has(id)) {
        physicsNodes.current.delete(id);
      }
    }
  }, [thoughts]);

  // Interaction State
  const isDragging = useRef(false);
  const dragTarget = useRef<string | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  const activeNodeId = hoveredNodeId || selectedNodeId;
  const activeNode = thoughts.find(t => t.id === activeNodeId);

  // Resize Handler
  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- THE 2D PHYSICS LOOP ---
  const animate = useCallback(() => {
    const nodes: PhysicsNode[] = Array.from(physicsNodes.current.values());
    const nodeCount = nodes.length;
    const P = configRef.current;

    // Reset forces
    for (let i = 0; i < nodeCount; i++) {
      nodes[i].fx = 0;
      nodes[i].fy = 0;
    }

    // 1. Calculate Forces
    for (let i = 0; i < nodeCount; i++) {
      const a = nodes[i];
      if (a.isSleeping && !dragTarget.current) continue;

      // Center Gravity
      a.fx -= a.x * P.CENTER_GRAVITY;
      a.fy -= a.y * P.CENTER_GRAVITY;

      // Attraction (Springs) - weighted by connection strength with exponential clustering
      for (const connId in a.connections) {
        const weight = a.connections[connId];
        const b = physicsNodes.current.get(connId);
        if (b) {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Relative spacing: exponential formula for dramatic clustering
          // NODE_DIAMETER = 40px
          // Weight 1.0 → 12px (almost touching)
          // Weight 0.3 → 110px (far apart)
          const NODE_DIAMETER = 40;
          const MIN_MULTIPLIER = 0.3;
          const MAX_MULTIPLIER = 3.0;
          const targetLength = NODE_DIAMETER * (MIN_MULTIPLIER +
            (MAX_MULTIPLIER - MIN_MULTIPLIER) * Math.pow(1 - weight, 2));

          const displacement = dist - targetLength;
          const force = displacement * P.STIFFNESS * weight; // Weight amplifies force

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          a.fx -= fx;
          a.fy -= fy;

          if (Math.abs(force) > 0.1) b.isSleeping = false;
        }
      }

      // Repulsion
      for (let j = i + 1; j < nodeCount; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy || 1;

        if (distSq > 1000000) continue; // Skip distant nodes

        const dist = Math.sqrt(distSq);
        const force = Math.min(P.REPULSION / distSq, 20);

        const rfx = (dx / dist) * force;
        const rfy = (dy / dist) * force;

        a.fx += rfx;
        a.fy += rfy;
        b.fx -= rfx;
        b.fy -= rfy;

        if (force > 0.05) b.isSleeping = false;
      }
    }

    // 2. Apply Velocity & Position
    for (let i = 0; i < nodeCount; i++) {
      const a = nodes[i];
      if (dragTarget.current === a.id) {
        a.vx = 0; a.vy = 0;
        a.isSleeping = false;
        continue;
      }

      if (a.isSleeping) continue;

      a.vx = (a.vx + a.fx) * P.DAMPING;
      a.vy = (a.vy + a.fy) * P.DAMPING;

      const speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);

      if (speed < 0.1) {
        a.vx = 0; a.vy = 0;
        a.isSleeping = true;
      } else {
        a.x += a.vx;
        a.y += a.vy;
      }
    }

    // 3. Clear Canvas (connections removed for now)
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      const { width, height } = canvasRef.current;
      ctx.clearRect(0, 0, width, height);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [viewState, activeNodeId]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragTarget.current = null;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current && !dragTarget.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setViewState(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    dragTarget.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setViewState(prev => ({
      ...prev,
      zoom: Math.min(Math.max(prev.zoom + delta, 0.3), 3)
    }));
  };

  const screenToWorld = (screenX: number, screenY: number) => {
    const centerX = dimensions.width / 2 + viewState.x;
    const centerY = dimensions.height / 2 + viewState.y;
    return {
      x: (screenX - centerX) / viewState.zoom,
      y: (screenY - centerY) / viewState.zoom
    };
  };

  const worldToScreen = (worldX: number, worldY: number) => {
    const centerX = dimensions.width / 2 + viewState.x;
    const centerY = dimensions.height / 2 + viewState.y;
    return {
      x: centerX + worldX * viewState.zoom,
      y: centerY + worldY * viewState.zoom
    };
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-[#05080a]"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
    >
      <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="absolute inset-0 pointer-events-none z-0" />

      {/* Cluster Theme Overlays */}
      <div className="absolute inset-0 pointer-events-none z-5">
        {clusters.map((cluster) => {
          if (!cluster.summary) return null;

          const { x, y } = worldToScreen(cluster.centerX, cluster.centerY);

          // Show cluster themes more prominently when zoomed out
          const opacity = viewState.zoom < 0.7 ? 0.9 : viewState.zoom < 1.0 ? 0.6 : 0.3;
          const scale = viewState.zoom < 0.7 ? 1.2 : 1.0;

          return (
            <div
              key={cluster.id}
              className="absolute"
              style={{
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity,
                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out'
              }}
            >
              <div
                className="px-6 py-3 rounded-lg backdrop-blur-md"
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)'
                }}
              >
                <h3 className="text-violet-300 font-semibold text-sm uppercase tracking-wide mb-1">
                  {cluster.summary.theme}
                </h3>
                <p className="text-white/70 text-xs max-w-xs">
                  {cluster.summary.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* DOM Elements Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {(() => {
          // Calculate top 3 strongest connections
          let top3Connections: string[] = [];
          if (activeNodeId && activeNode) {
            const connectionWeights: Array<{ nodeId: string, weight: number }> = [];

            thoughts.forEach(node => {
              if (node.id === activeNodeId) return; // Skip the active node itself

              // Check both directions for connections
              const weight = node.connections[activeNodeId] ||
                             activeNode.connections[node.id] || 0;

              if (weight > 0) {
                connectionWeights.push({ nodeId: node.id, weight });
              }
            });

            // Sort by weight descending and take top 3
            top3Connections = connectionWeights
              .sort((a, b) => b.weight - a.weight)
              .slice(0, 3)
              .map(c => c.nodeId);
          }

          return thoughts.map((node) => {
            // Calculate connection strength to active node
            let connectionWeight = 0;
            if (activeNodeId) {
              if (node.id === activeNodeId) {
                connectionWeight = 1;
              } else if (node.connections[activeNodeId]) {
                connectionWeight = node.connections[activeNodeId];
              } else if (activeNode && activeNode.connections[node.id]) {
                connectionWeight = activeNode.connections[node.id];
              }
            }

            const isDirectlyConnected = connectionWeight > 0;
            const isTop3Connected = top3Connections.includes(node.id);
            const isDimmed = activeNodeId && !isDirectlyConnected;
          const { x, y } = worldToScreen(node.x, node.y);

          // Calculate average connection strength for border intensity
          const connectionValues = Object.values(node.connections) as number[];
          const avgWeight = connectionValues.length > 0
            ? connectionValues.reduce((sum: number, w: number) => sum + w, 0) / connectionValues.length
            : 0;

          return (
            <div
              key={node.id}
              className="absolute pointer-events-auto"
              style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
                opacity: isDimmed ? 0.1 : 1,
                transition: 'opacity 0.4s ease-out',
                zIndex: isDirectlyConnected ? 100 : 1
              }}
            >
              <div
                onClick={(e) => { e.stopPropagation(); onNodeClick(node); }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  isDragging.current = true;
                  dragTarget.current = node.id;
                  const pNode = physicsNodes.current.get(node.id);
                  if (pNode) pNode.isSleeping = false;
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer"
              >
                {/* Calculate node size based on connection status */}
                {(() => {
                  const baseSize = isTop3Connected ? 48 : 40;  // 20% larger for top 3
                  const sizeMultiplier = isDirectlyConnected ? 1.3 : 1.0;
                  const finalSize = baseSize * sizeMultiplier * viewState.zoom;

                  return (
                    <>
                      {/* Minimal dot node - Apple Mindfulness style */}
                      <div
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: `${finalSize}px`,
                          height: `${finalSize}px`,
                          background: `rgba(226, 232, 240, ${0.2 + avgWeight * 0.3})`,
                          border: isTop3Connected
                            ? `4px solid rgba(56, 189, 248, 1.0)`  // Thick, fully opaque cyan for top 3
                            : isDirectlyConnected
                              ? `${2 + connectionWeight * 2}px solid rgba(56, 189, 248, ${0.4 + connectionWeight * 0.4})`
                              : `2px solid rgba(226, 232, 240, ${0.2 + avgWeight * 0.3})`,
                          boxShadow: isTop3Connected
                            ? `0 0 60px 15px rgba(56, 189, 248, 0.8), 0 0 30px 8px rgba(56, 189, 248, 0.6)`
                            : isDirectlyConnected
                              ? `0 0 ${20 + connectionWeight * 20}px ${3 + connectionWeight * 5}px rgba(56, 189, 248, ${0.3 + connectionWeight * 0.3})`
                              : `0 0 ${10 + avgWeight * 10}px ${1 + avgWeight * 2}px rgba(255, 255, 255, ${0.15 + avgWeight * 0.15})`,
                          backdropFilter: 'blur(10px)'
                        }}
                      />

                      {/* Floating text below node - Apple Mindfulness style */}
                      {/* Only show for hovered node to prevent overlapping text */}
                      {hoveredNodeId === node.id && (
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            top: `${finalSize / 2 + 16}px`,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 'max-content',
                            maxWidth: '280px',
                            animation: 'fadeIn 0.2s ease-out',
                            zIndex: 1000
                          }}
                        >
                          <div
                            className="px-4 py-2 rounded-lg"
                            style={{
                              background: 'rgba(10, 16, 20, 0.95)',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid rgba(56, 189, 248, 0.3)'
                            }}
                          >
                            <p
                              className="text-white/90 text-center leading-relaxed"
                              style={{
                                fontSize: '14px',
                                textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                              }}
                            >
                              {node.content}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          );
        });
        })()}
      </div>
    </div>
  );
};
