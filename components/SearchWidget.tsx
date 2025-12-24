import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, CornerDownLeft, Sparkles } from 'lucide-react';
import { ThoughtNode } from '../types';
import { findRelatedThoughts } from '../services/geminiService';

interface SearchWidgetProps {
    thoughts: ThoughtNode[];
    onSelectNode: (node: ThoughtNode) => void;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({ thoughts, onSelectNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [localResults, setLocalResults] = useState<ThoughtNode[]>([]);
    const [semanticResults, setSemanticResults] = useState<ThoughtNode[]>([]);
    const [isSearchingAI, setIsSearchingAI] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Local filter on typing
    useEffect(() => {
        if (!query.trim()) {
            setLocalResults([]);
            setSemanticResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const matches = thoughts.filter(t => 
            t.content.toLowerCase().includes(lowerQuery)
        ).slice(0, 5);
        
        setLocalResults(matches);
    }, [query, thoughts]);

    const handleSemanticSearch = async () => {
        if (!query.trim()) return;
        setIsSearchingAI(true);
        setSemanticResults([]);

        try {
            const relatedIds = await findRelatedThoughts(query, thoughts);
            const relatedNodes = thoughts.filter(t => relatedIds.includes(t.id));
            setSemanticResults(relatedNodes);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearchingAI(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSemanticSearch();
        }
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleSelect = (node: ThoughtNode) => {
        onSelectNode(node);
        setIsOpen(false);
        setQuery("");
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="group flex items-center gap-2 px-4 py-2 bg-[#0a1014]/60 hover:bg-[#0a1014]/90 backdrop-blur-md border border-white/10 hover:border-teal-500/50 rounded-full transition-all duration-300 text-white/60 hover:text-white shadow-lg"
            >
                <Search size={16} />
                <span className="text-xs uppercase tracking-widest hidden sm:inline">Search Galaxy</span>
            </button>
        );
    }

    return (
        <div className="relative w-[320px] animate-fade-in-up font-sans">
            {/* Input Container */}
            <div className="relative flex items-center w-full">
                <Search className="absolute left-4 text-teal-500" size={16} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search or 'Enter' for AI..."
                    className="w-full bg-[#0a1014]/90 backdrop-blur-xl border border-teal-500/50 rounded-2xl py-3 pl-10 pr-10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-teal-500/50 shadow-2xl"
                />
                {isSearchingAI ? (
                    <Loader2 className="absolute right-3 animate-spin text-teal-500" size={16} />
                ) : (
                    <div className="absolute right-3 text-[10px] text-white/30 border border-white/10 rounded px-1.5 py-0.5">
                        <CornerDownLeft size={10} className="inline mr-1"/>
                        AI
                    </div>
                )}
            </div>

            {/* Results Dropdown */}
            {(localResults.length > 0 || semanticResults.length > 0 || (query && !isSearchingAI)) && (
                <div className="absolute top-full mt-2 left-0 w-full bg-[#0a1014]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-[60vh] overflow-y-auto no-scrollbar z-50">
                    
                    {/* Local Results */}
                    {localResults.length > 0 && (
                        <div className="p-2">
                            <div className="px-2 py-1 text-[10px] text-white/30 uppercase tracking-widest font-semibold">Exact Matches</div>
                            {localResults.map(node => (
                                <button
                                    key={`local-${node.id}`}
                                    onClick={() => handleSelect(node)}
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 group"
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: node.color }}></div>
                                    <span className="text-sm text-white/80 group-hover:text-white truncate">{node.content}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Semantic Results */}
                    {semanticResults.length > 0 && (
                        <div className="border-t border-white/10 p-2 bg-teal-500/5">
                            <div className="px-2 py-1 text-[10px] text-teal-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                                <Sparkles size={10} /> Semantic Connections
                            </div>
                            {semanticResults.map(node => (
                                <button
                                    key={`ai-${node.id}`}
                                    onClick={() => handleSelect(node)}
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 group"
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: node.color }}></div>
                                    <span className="text-sm text-white/80 group-hover:text-white truncate">{node.content}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Empty State / Hint */}
                    {localResults.length === 0 && semanticResults.length === 0 && !isSearchingAI && (
                        <div className="p-4 text-center text-white/30 text-xs">
                            <p>Press <span className="text-white/60">Enter</span> to find deeper meanings.</p>
                        </div>
                    )}
                </div>
            )}
            
            {/* Close Overlay (Click outside) */}
            <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
        </div>
    );
};