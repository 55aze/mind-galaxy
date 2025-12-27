import React, { useState, useEffect } from 'react';
import { INITIAL_THOUGHTS, DEFAULT_PHYSICS } from './constants';
import { ThoughtNode, ViewState, Persona, GroupSummary, Cluster } from './types';
import { GalaxyCanvas } from './components/GalaxyCanvas';
import { Inspector } from './components/Inspector';
import { SearchWidget } from './components/SearchWidget';
import { PhysicsControls, PhysicsConfig } from './components/PhysicsControls';
import { findConnections, analyzeSemantics, summarizeGroup } from './services/geminiService';
import { detectClusters, buildClusters } from './utils/clusterDetection';
import { Plus, Sparkles } from 'lucide-react';

export default function App() {
  const [thoughts, setThoughts] = useState<ThoughtNode[]>(INITIAL_THOUGHTS);
  const [viewState, setViewState] = useState<ViewState>({
    x: 0,
    y: 0,
    zoom: 1
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [groupSummary, setGroupSummary] = useState<GroupSummary | null>(null);
  const [inputMode, setInputMode] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Physics State
  const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>(DEFAULT_PHYSICS);

  // Cluster State
  const [clusters, setClusters] = useState<Cluster[]>([]);

  useEffect(() => {
    if (!selectedNodeId) {
        setGroupSummary(null);
        return;
    }
    const node = thoughts.find(t => t.id === selectedNodeId);
    if (!node) return;
    const neighbors = thoughts.filter(t => node.connections[t.id] !== undefined);
    const cluster = [node, ...neighbors];
    if (cluster.length > 1) {
        summarizeGroup(cluster).then(setGroupSummary);
    }
  }, [selectedNodeId, thoughts]);

  // Detect clusters and generate summaries
  useEffect(() => {
    const detectAndSummarizeClusters = async () => {
      if (thoughts.length < 2) {
        setClusters([]);
        return;
      }

      // Detect cluster groups
      const clusterGroups = detectClusters(thoughts, 0.6);
      if (clusterGroups.length === 0) {
        setClusters([]);
        return;
      }

      // Build cluster objects
      const newClusters = buildClusters(clusterGroups, thoughts);

      // Generate summaries for each cluster
      const clustersWithSummaries = await Promise.all(
        newClusters.map(async (cluster) => {
          const clusterNodes = thoughts.filter(t => cluster.nodeIds.includes(t.id));
          const summary = await summarizeGroup(clusterNodes);
          return { ...cluster, summary };
        })
      );

      setClusters(clustersWithSummaries);
    };

    detectAndSummarizeClusters();
  }, [thoughts]);

  const handleNodeClick = (node: ThoughtNode) => {
    setSelectedNodeId(node.id);
    // Could zoom in here if desired: setViewState(prev => ({ ...prev, zoom: 1.2 }));
  };

  const handleDeleteNode = (id: string) => {
      setThoughts(prev => {
          // Remove the node
          const remaining = prev.filter(t => t.id !== id);
          // Remove connections to this node from all other nodes to prevent ghost links
          return remaining.map(t => {
              const newConnections = { ...t.connections };
              delete newConnections[id];
              return { ...t, connections: newConnections };
          });
      });
      setSelectedNodeId(null);
  };

  const handleUpdateNode = (id: string, newContent: string) => {
      setThoughts(prev => prev.map(t => 
          t.id === id ? { ...t, content: newContent } : t
      ));
  };

  const handleAddSpark = (originalNode: ThoughtNode, text: string, persona: Persona) => {
    // Sparks spawn directly connected to their origin
    const newNode: ThoughtNode = {
      id: Date.now().toString(),
      content: text,
      // Random offset near parent (accounting for larger nodes)
      x: originalNode.x + (Math.random() - 0.5) * 200,
      y: originalNode.y + (Math.random() - 0.5) * 200,
      vx: 0, vy: 0, mass: 1,
      connections: { [originalNode.id]: 1.0 }, // Strong direct connection
      color: persona.color.includes('zinc') ? '#d4d4d8' : persona.color.includes('rose') ? '#fb7185' : '#a78bfa',
      gradient: persona.gradient ? `linear-gradient(135deg, ${persona.gradient.split(' ')[1]}, ${persona.gradient.split(' ')[3]})` : originalNode.gradient,
      createdAt: Date.now()
    };

    // Update original node to include connection to spark
    setThoughts(prev => {
        const updatedPrev = prev.map(n =>
            n.id === originalNode.id
            ? { ...n, connections: { ...n.connections, [newNode.id]: 1.0 } }
            : n
        );
        return [...updatedPrev, newNode];
    });

    setSelectedNodeId(newNode.id);
  };

  const submitNewThought = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      // 1. Get Vibe/Color
      const semantics = await analyzeSemantics(inputValue);
      
      // 2. Find Connections (The Rhizome) - AI decides best fit
      const connectedIds = await findConnections(inputValue, thoughts);
      
      // 3. Determine Spawn Position - Smart Embedding (2D)
      let startX = 0, startY = 0;

      const connectedNodeIds = Object.keys(connectedIds);
      if (thoughts.length === 0) {
          // First thought: Center of the canvas
          startX = 0; startY = 0;
      } else if (connectedNodeIds.length > 0) {
          // Connected? Place at the Center of Gravity of related nodes
          const neighbors = thoughts.filter(t => connectedIds[t.id] !== undefined);
          if (neighbors.length > 0) {
            startX = neighbors.reduce((sum, n) => sum + n.x, 0) / neighbors.length;
            startY = neighbors.reduce((sum, n) => sum + n.y, 0) / neighbors.length;
            // Add jitter accounting for larger node sizes
            startX += (Math.random() - 0.5) * 160;
            startY += (Math.random() - 0.5) * 160;
          }
      } else {
          // No connections found? Spawn at moderate distance (circular placement)
          const r = 250 + Math.random() * 200;
          const theta = Math.random() * Math.PI * 2;
          startX = r * Math.cos(theta);
          startY = r * Math.sin(theta);
      }

      const newNode: ThoughtNode = {
        id: Date.now().toString(),
        content: inputValue,
        x: startX, y: startY,
        vx: 0, vy: 0, mass: 1,
        color: semantics.color || '#fff',
        gradient: semantics.gradient || 'linear-gradient(#fff, #fff)',
        connections: connectedIds, // Now it's { [id]: weight }
        createdAt: Date.now()
      };

      // Add new node
      setThoughts(prev => {
          // We also need to tell the OLD nodes that they are connected to the NEW node
          // if the connection is bidirectional (which physics prefers)
          const updatedPrev = prev.map(t => {
              if (connectedIds[t.id] !== undefined) {
                  return { ...t, connections: { ...t.connections, [newNode.id]: connectedIds[t.id] } };
              }
              return t;
          });
          return [...updatedPrev, newNode];
      });

      setInputValue("");
      setInputMode(false);
      handleNodeClick(newNode);
    } catch (error) {
      console.error("Failed to add thought", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedNode = thoughts.find(t => t.id === selectedNodeId);

  return (
    <div className="relative w-screen h-screen bg-[#0a1014] text-white overflow-hidden font-sans selection:bg-teal-500/30">
      <GalaxyCanvas
        thoughts={thoughts}
        viewState={viewState}
        setViewState={setViewState}
        onNodeClick={handleNodeClick}
        selectedNodeId={selectedNodeId}
        physicsConfig={physicsConfig}
        clusters={clusters}
      />

      <div className="absolute top-8 left-8 pointer-events-none z-40">
        <h1 className="text-3xl font-serif italic tracking-wide text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Mind Galaxy</h1>
        <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
            <span>Nodes: {thoughts.length}</span>
            <span>Organic Web</span>
        </div>
      </div>

      <div className="absolute top-8 right-8 z-50">
          <SearchWidget thoughts={thoughts} onSelectNode={handleNodeClick} />
      </div>

      <div className="absolute bottom-8 right-8 z-50">
          <PhysicsControls 
            config={physicsConfig} 
            onChange={setPhysicsConfig} 
            onReset={() => setPhysicsConfig(DEFAULT_PHYSICS)} 
          />
      </div>

      {/* Empty State Prompt */}
      {thoughts.length === 0 && !inputMode && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none animate-breathe-subtle">
              <Sparkles className="w-12 h-12 text-teal-500/30 mx-auto mb-4" />
              <h2 className="text-2xl font-serif text-white/20 italic">The void awaits your first spark.</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/10 mt-2">Click (+) to create</p>
          </div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-6">
        {inputMode ? (
          <form onSubmit={submitNewThought} className="relative w-full animate-fade-in-up">
            <input 
              autoFocus
              type="text" 
              placeholder="Weave a new thought..." 
              className="w-full bg-[#0a1014]/80 backdrop-blur-xl border border-teal-500/30 rounded-full py-4 pl-8 pr-16 text-white placeholder:text-white/20 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all shadow-2xl text-center font-serif italic"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={isProcessing}
            />
            <button 
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-teal-500/20 text-teal-100 rounded-full hover:bg-teal-500/40 disabled:opacity-50 transition-colors"
            >
                {isProcessing ? <div className="w-4 h-4 border-2 border-teal-200 border-t-transparent rounded-full animate-spin"/> : <Plus size={20} />}
            </button>
            <button 
                type="button"
                onClick={() => setInputMode(false)}
                className="absolute -top-10 left-1/2 -translate-x-1/2 text-white/20 hover:text-white/60 text-xs uppercase tracking-widest transition-colors"
            >
                Close
            </button>
          </form>
        ) : (
          <button 
            onClick={() => setInputMode(true)}
            className="flex items-center justify-center gap-3 w-16 h-16 mx-auto bg-teal-500/10 hover:bg-teal-500/20 backdrop-blur-md border border-teal-500/30 rounded-full transition-all group hover:scale-110 duration-500 shadow-[0_0_40px_rgba(20,184,166,0.15)]"
          >
            <Plus className="text-teal-100/70 group-hover:text-white" />
          </button>
        )}
      </div>

      {selectedNode && (
        <Inspector 
          node={selectedNode} 
          groupSummary={groupSummary}
          onClose={() => setSelectedNodeId(null)}
          onAddSpark={handleAddSpark}
          onDelete={() => handleDeleteNode(selectedNode.id)}
          onUpdate={(content) => handleUpdateNode(selectedNode.id, content)}
        />
      )}
    </div>
  );
}