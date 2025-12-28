import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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

  // Use refs for values that shouldn't trigger animation restart
  const viewStateRef = useRef(viewState);
  const activeNodeIdRef = useRef(activeNodeId);

  useEffect(() => {
    viewStateRef.current = viewState;
  }, [viewState]);

  useEffect(() => {
    activeNodeIdRef.current = activeNodeId;
  }, [activeNodeId]);

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

      // Repulsion - optimized for performance
      for (let j = i + 1; j < nodeCount; j++) {
        const b = nodes[j];

        // Skip if both nodes are sleeping
        if (a.isSleeping && b.isSleeping) continue;

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;

        // Increased threshold to skip more distant nodes (sqrt(500000) ≈ 707px)
        if (distSq > 500000 || distSq < 1) continue;

        const dist = Math.sqrt(distSq);
        const force = Math.min(P.REPULSION / distSq, 20);

        // Only apply force if significant
        if (force < 0.02) continue;

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
  }, []); // Remove viewState and activeNodeId to prevent animation restart on zoom

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

  // Memoize cluster data (structure only, no positioning)
  const clusterData = useMemo(() => {
    return clusters.map((cluster) => {
      if (!cluster.summary) return null;

      const clusterSize = cluster.nodeIds.length;

      // Pre-calculate size-based properties (don't change with zoom)
      const baseScale = cluster.level === 'major'
        ? 1.2 + (clusterSize / 30)
        : 0.7 + (clusterSize / 25);

      const glowIntensity = cluster.level === 'major'
        ? Math.min(clusterSize / 15, 1.0)
        : Math.min(clusterSize / 12, 0.8);

      const glowRadius = cluster.level === 'major'
        ? 50 + clusterSize * 4
        : 35 + clusterSize * 3;

      return {
        cluster,
        clusterSize,
        baseScale,
        glowIntensity,
        glowRadius
      };
    }).filter(Boolean);
  }, [clusters]); // Only recalculate when clusters change!

  // Render clusters with dynamic positioning (cheap operation)
  const clusterElements = clusterData.map((data) => {
    if (!data) return null;
    const { cluster, clusterSize, baseScale, glowIntensity, glowRadius } = data;

    // Dynamic calculations based on current viewState (cheap math)
    const { x, y } = worldToScreen(cluster.centerX, cluster.centerY);

    // Strict 3-layer zoom hierarchy
    // Layer 1 (zoom < 0.7): Only major clusters
    // Layer 2 (zoom 0.7-1.2): Only sub-clusters
    // Layer 3 (zoom >= 1.2): Sub-clusters fade out, nodes take over
    let shouldRender = false;

    if (cluster.level === 'major') {
      // Major clusters: visible only in Layer 1
      shouldRender = viewState.zoom < 0.7;
    } else {
      // Sub-clusters: visible in Layer 2 and early Layer 3
      shouldRender = viewState.zoom >= 0.7 && viewState.zoom < 1.5;
    }

    if (!shouldRender) return null;

    // Fixed scale per level (no zoom scaling for cleaner look)
    const finalScale = baseScale;

      return (
        <div
          key={cluster.id}
          className="absolute"
          style={{
            left: x,
            top: y,
            transform: `translate(-50%, -50%) scale(${finalScale})`,
          }}
        >
          {/* Nebula glow layers - GPU optimized */}
          <div className="relative">
            {/* Single combined glow - more performant, color varies by level */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                width: `${glowRadius * 1.5}px`,
                height: `${glowRadius * 1.5}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: cluster.level === 'major'
                  ? `radial-gradient(circle, rgba(139, 92, 246, ${0.30 * glowIntensity}) 0%, rgba(167, 139, 250, ${0.18 * glowIntensity}) 30%, rgba(139, 92, 246, ${0.08 * glowIntensity}) 60%, transparent 80%)`
                  : `radial-gradient(circle, rgba(96, 165, 250, ${0.20 * glowIntensity}) 0%, rgba(147, 197, 253, ${0.12 * glowIntensity}) 30%, rgba(96, 165, 250, ${0.05 * glowIntensity}) 60%, transparent 80%)`,
                filter: 'blur(18px)',
                willChange: 'transform, opacity',
              }}
            />

            {/* Floating text - minimal content for major, detailed for sub */}
            <div className="relative px-3 py-2">
              <h3
                className="font-semibold uppercase tracking-wider text-center"
                style={{
                  fontSize: cluster.level === 'major' ? '14px' : '13px',
                  color: '#FFFFFF',
                  textShadow: cluster.level === 'major'
                    ? '0 0 12px rgba(139, 92, 246, 0.8), 0 0 24px rgba(139, 92, 246, 0.5), 0 2px 8px rgba(0, 0, 0, 0.9)'
                    : '0 0 10px rgba(96, 165, 250, 0.8), 0 0 20px rgba(96, 165, 250, 0.4), 0 2px 6px rgba(0, 0, 0, 0.9)',
                  filter: cluster.level === 'major'
                    ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))'
                    : 'drop-shadow(0 0 6px rgba(96, 165, 250, 0.4))',
                  marginBottom: cluster.level === 'major' ? '4px' : '6px'
                }}
              >
                {cluster.summary.theme}
              </h3>
              {/* Only show description for sub-clusters */}
              {cluster.level === 'sub' && (
                <p
                  className="text-center italic max-w-xs"
                  style={{
                    fontSize: '10px',
                    color: 'rgba(226, 232, 240, 0.95)',
                    textShadow: '0 1px 4px rgba(0, 0, 0, 0.95)',
                    lineHeight: '1.4'
                  }}
                >
                  {cluster.summary.description}
                </p>
              )}
              <p
                className="text-center"
                style={{
                  fontSize: '9px',
                  color: cluster.level === 'major' ? 'rgba(167, 139, 250, 0.75)' : 'rgba(147, 197, 253, 0.75)',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)',
                  letterSpacing: '0.05em',
                  marginTop: cluster.level === 'major' ? '2px' : '4px'
                }}
              >
                {cluster.level === 'major'
                  ? `${clusterSize} thoughts`
                  : `${clusterSize} thoughts`
                }
              </p>
            </div>
          </div>
        </div>
      );
    });

  // Memoize top 3 connections calculation
  const top3Connections = useMemo(() => {
    if (!activeNodeId || !activeNode) return [];

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
    return connectionWeights
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(c => c.nodeId);
  }, [activeNodeId, activeNode, thoughts]);

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

      {/* Cluster Theme Overlays - Nebula Style (Memoized) */}
      <div className="absolute inset-0 pointer-events-none z-5">
        {clusterElements}
      </div>

      {/* DOM Elements Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {(() => {

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

            // Strict 3-layer node visibility
            // Layer 1 (zoom < 0.7): Nodes BARELY visible (hint)
            // Layer 2 (zoom 0.7-1.2): Nodes faded, NOT interactable
            // Layer 3 (zoom >= 1.2): Nodes full visibility and interactable
            let nodeOpacity = 0;
            let isNodeInteractable = false;

            if (viewState.zoom < 0.7) {
              // Layer 1: Very subtle hint (8% opacity, not interactable)
              nodeOpacity = 0.08;
              isNodeInteractable = false;
            } else if (viewState.zoom < 1.2) {
              // Layer 2: Visible but faded and not interactable
              nodeOpacity = 0.2;
              isNodeInteractable = false;
            } else {
              // Layer 3: Full visibility and interactable
              nodeOpacity = 1.0;
              isNodeInteractable = true;
            }

            const finalNodeOpacity = isDimmed ? 0.1 : nodeOpacity;

          const { x, y } = worldToScreen(node.x, node.y);

          // Calculate average connection strength for border intensity
          const connectionValues = Object.values(node.connections) as number[];
          const avgWeight = connectionValues.length > 0
            ? connectionValues.reduce((sum: number, w: number) => sum + w, 0) / connectionValues.length
            : 0;

          return (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
                opacity: finalNodeOpacity,
                transition: 'opacity 0.4s ease-out',
                zIndex: isDirectlyConnected ? 100 : 1,
                pointerEvents: isNodeInteractable ? 'auto' : 'none'
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
