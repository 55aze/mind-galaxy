import React, { useState, useEffect } from 'react';
import { ThoughtNode, Persona, SparkResponse, GroupSummary } from '../types';
import { THINKERS } from '../constants';
import { generateSpark } from '../services/geminiService';
import { X, Sparkles, Network, Activity, ArrowRight, Trash2, Edit2, Save } from 'lucide-react';

interface InspectorProps {
  node: ThoughtNode;
  groupSummary?: GroupSummary | null;
  onClose: () => void;
  onAddSpark: (originalNode: ThoughtNode, text: string, persona: Persona) => void;
  onDelete: () => void;
  onUpdate: (content: string) => void;
}

export const Inspector: React.FC<InspectorProps> = ({ node, groupSummary, onClose, onAddSpark, onDelete, onUpdate }) => {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [sparkLoading, setSparkLoading] = useState(false);
  const [sparkResult, setSparkResult] = useState<SparkResponse | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content);

  useEffect(() => {
    // Reset edit state when node changes
    setIsEditing(false);
    setEditContent(node.content);
    setSparkResult(null);
  }, [node]);

  useEffect(() => {
    if (sparkResult?.text) {
      let i = 0;
      setDisplayedText("");
      const interval = setInterval(() => {
        setDisplayedText(sparkResult.text.substring(0, i));
        i++;
        if (i > sparkResult.text.length) clearInterval(interval);
      }, 20);
      return () => clearInterval(interval);
    }
  }, [sparkResult]);

  const handleSpark = async (persona: Persona) => {
    setSelectedPersona(persona);
    setSparkLoading(true);
    setSparkResult(null);
    setDisplayedText("");

    const responseText = await generateSpark(node.content, persona);
    
    setSparkResult({
      thinkerId: persona.id,
      text: responseText
    });
    setSparkLoading(false);
  };

  const saveEdit = () => {
      onUpdate(editContent);
      setIsEditing(false);
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full md:w-[480px] bg-black/80 backdrop-blur-2xl border-l border-white/10 p-8 flex flex-col z-50 animate-fade-in shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-1 rounded bg-white/5 text-white/50">
           Organic Node
        </span>
        <div className="flex items-center gap-2">
            {!isEditing && (
                <>
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                        title="Edit Thought"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={onDelete} 
                        className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-white/40 hover:text-red-400"
                        title="Delete Thought"
                    >
                        <Trash2 size={16} />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                </>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60">
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative mb-8 group">
        <div 
            className="absolute -left-4 top-0 bottom-0 w-1 transition-all rounded-full"
            style={{ background: node.gradient, boxShadow: `0 0 10px ${node.color}` }}
        ></div>
        
        {isEditing ? (
            <div className="animate-fade-in">
                <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-32 bg-white/5 border border-teal-500/30 rounded-lg p-3 text-white font-serif text-xl focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                />
                <div className="flex gap-2 mt-2 justify-end">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-xs uppercase tracking-widest text-white/50 hover:bg-white/10 rounded"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={saveEdit}
                        className="flex items-center gap-2 px-4 py-1.5 bg-teal-500/20 text-teal-200 hover:bg-teal-500/30 rounded text-xs uppercase tracking-widest border border-teal-500/30"
                    >
                        <Save size={12} /> Save
                    </button>
                </div>
            </div>
        ) : (
            <p className="text-2xl font-serif text-white/90 leading-relaxed italic">
                "{node.content}"
            </p>
        )}
      </div>

      {/* Connections List (The Rhizome) */}
      <div className="mb-8">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
              <Network size={12} /> Semantic Rhizome ({node.connections.length})
          </h4>
          <div className="flex flex-wrap gap-2">
             {node.connections.length > 0 ? (
                 <div className="text-xs text-white/50 italic">Connected to {node.connections.length} other thoughts in the web.</div>
             ) : (
                 <div className="text-xs text-white/30 italic">Floating in the void. No connections yet.</div>
             )}
          </div>
      </div>

      <div className="h-px bg-white/10 w-full mb-8" />

      {/* Spark Section */}
      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        {!sparkResult ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-white/80">
              <Sparkles className="w-4 h-4 text-yellow-200" />
              <h3 className="text-sm font-medium tracking-wide">IGNITE INSIGHT</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {THINKERS.map(thinker => (
                <button
                  key={thinker.id}
                  onClick={() => handleSpark(thinker)}
                  disabled={sparkLoading}
                  className="group relative flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-left overflow-hidden"
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r ${thinker.gradient} transition-opacity duration-500`} />
                  <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{thinker.avatar}</span>
                  <div>
                    <div className={`font-medium text-sm ${thinker.color} group-hover:text-white transition-colors`}>{thinker.name}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest">{thinker.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
               <span className="text-2xl">{THINKERS.find(t => t.id === sparkResult.thinkerId)?.avatar}</span>
               <div className="flex flex-col">
                   <span className={`text-sm font-bold uppercase tracking-widest ${THINKERS.find(t => t.id === sparkResult.thinkerId)?.color}`}>
                       {THINKERS.find(t => t.id === sparkResult.thinkerId)?.name}
                   </span>
               </div>
            </div>
            <div className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/10 font-serif text-lg leading-relaxed text-white/90 shadow-inner">
               {displayedText}
               <span className="animate-pulse inline-block w-1.5 h-4 ml-1 bg-white/50 align-middle"></span>
            </div>
            <div className="flex gap-2 mt-4">
                <button 
                    onClick={() => setSparkResult(null)}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs uppercase tracking-widest transition-colors"
                >
                    Clear
                </button>
                <button 
                    onClick={() => {
                    if(selectedPersona) onAddSpark(node, sparkResult.text, selectedPersona);
                    onClose();
                    }}
                    className="flex-1 py-3 rounded-xl bg-teal-500/20 text-teal-200 hover:bg-teal-500/30 text-xs uppercase tracking-widest transition-colors border border-teal-500/30"
                >
                    Crystallize
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}