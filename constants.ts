import { Persona, ThoughtNode } from "./types";

export const THINKERS: Persona[] = [
  { 
    id: "jobs", 
    name: "Steve Jobs", 
    role: "The Visionary", 
    avatar: "", 
    color: "text-zinc-300", 
    gradient: "from-zinc-400 to-zinc-600",
    description: "Direct. Brutal. Obsessed with simplicity." 
  },
  { 
    id: "feynman", 
    name: "Richard Feynman", 
    role: "The Explainer", 
    avatar: "⚛️", 
    color: "text-violet-300", 
    gradient: "from-violet-300 to-fuchsia-400",
    description: "Playful, curious. Nature is the ultimate truth." 
  },
  { 
    id: "jung", 
    name: "Carl Jung", 
    role: "The Analyst", 
    avatar: "🔮", 
    color: "text-indigo-300", 
    gradient: "from-indigo-400 to-purple-600",
    description: "Look into the shadow. Integrate the unconscious." 
  },
  { 
    id: "kahlo", 
    name: "Frida Kahlo", 
    role: "The Artist", 
    avatar: "🌺", 
    color: "text-rose-300", 
    gradient: "from-rose-300 to-pink-500",
    description: "Raw, emotional, surreal." 
  },
  { 
    id: "musk", 
    name: "Elon Musk", 
    role: "The Engineer", 
    avatar: "🚀", 
    color: "text-sky-300", 
    gradient: "from-sky-300 to-cyan-500",
    description: "First principles thinker." 
  }
];

// --- MINDFULNESS PALETTE ---
export const getRandomMindfulColor = () => {
    // A single unified palette for organic thoughts (Starlight / Ethereal)
    // We vary opacity and slight hue, but keep it cohesive.
    const PALETTE = ["#e2e8f0", "#cbd5e1", "#f1f5f9", "#e0f2fe", "#f0f9ff"];
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
};

// --- PHYSICS CONSTANTS (TUNED FOR ORGANIC CLUSTERING) ---
export const DEFAULT_PHYSICS = {
    // High repulsion ensures nodes don't overlap, creating volume
    REPULSION: 800,      
    // Short springs within clusters pull them tight
    SPRING_LENGTH: 50,   
    // High stiffness makes connections rigid, forming solid structures
    STIFFNESS: 0.15,      
    // Friction to stop the drift (0.85 = slippery, 0.5 = thick mud)
    // We use 0.90 to allow movement but eventually settle.
    DAMPING: 0.85,        
    // A weak center pull keeps the galaxy from drifting off screen
    CENTER_GRAVITY: 0.0001 
};

// Start from Zero
export const INITIAL_THOUGHTS: ThoughtNode[] = [];