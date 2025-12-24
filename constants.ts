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
export const INITIAL_THOUGHTS: ThoughtNode[] = [
    {
        id: "1",
        content: "What if we could visualize our thoughts in 3D space?",
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        mass: 1,
        connections: ["2", "3"],
        color: "#e2e8f0",
        gradient: "linear-gradient(135deg, #e2e8f0, #e2e8f0)",
        createdAt: Date.now() - 1000000
    },
    {
        id: "2",
        content: "The mind is like a galaxy, ideas are stars connected by gravity",
        x: -80, y: 50, z: 30,
        vx: 0, vy: 0, vz: 0,
        mass: 1,
        connections: ["1", "3"],
        color: "#cbd5e1",
        gradient: "linear-gradient(135deg, #cbd5e1, #cbd5e1)",
        createdAt: Date.now() - 900000
    },
    {
        id: "3",
        content: "Knowledge graphs could help us think better",
        x: 70, y: -40, z: -20,
        vx: 0, vy: 0, vz: 0,
        mass: 1,
        connections: ["1", "2"],
        color: "#f1f5f9",
        gradient: "linear-gradient(135deg, #f1f5f9, #f1f5f9)",
        createdAt: Date.now() - 800000
    },
    {
        id: "4",
        content: "I need to call mom this weekend",
        x: 300, y: 200, z: 100,
        vx: 0, vy: 0, vz: 0,
        mass: 1,
        connections: ["5"],
        color: "#e0f2fe",
        gradient: "linear-gradient(135deg, #e0f2fe, #e0f2fe)",
        createdAt: Date.now() - 700000
    },
    {
        id: "5",
        content: "Family time is more important than work deadlines",
        x: 280, y: 150, z: 80,
        vx: 0, vy: 0, vz: 0,
        mass: 1,
        connections: ["4"],
        color: "#f0f9ff",
        gradient: "linear-gradient(135deg, #f0f9ff, #f0f9ff)",
        createdAt: Date.now() - 600000
    },
    {
        id: "6",
        content: "Meditation helps clear mental clutter",
        x: -200, y: -180, z: -90,
        vx: 0, vy: 0, vz: 0,
        mass: 1,
        connections: ["7", "8"],
        color: "#e2e8f0",
        gradient: "linear-gradient(135deg, #e2e8f0, #e2e8f0)",
        createdAt: Date.now() - 500000
    },
    {
        id: "7",
        content: "Our thoughts create our reality",
        x: -170, y: -220, z: -60,
        vx: 0, vy: 0, vz: 0,
        mass: 1,
        connections: ["6", "8"],
        color: "#cbd5e1",
        gradient: "linear-gradient(135deg, #cbd5e1, #cbd5e1)",
        createdAt: Date.now() - 400000
    },
    {
        id: "8",
        content: "Mindfulness is the key to happiness",
        x: -240, y: -200, z: -120,
        vx: 0, vy: 0, vz: 0,
        mass: 1,
        connections: ["6", "7"],
        color: "#f1f5f9",
        gradient: "linear-gradient(135deg, #f1f5f9, #f1f5f9)",
        createdAt: Date.now() - 300000
    },
    {
        id: "9",
        content: "Why do we dream? Are dreams our brain's way of organizing memories?",
        x: 150, y: 250, z: -150,
        vx: 0, vy: 0, vz: 0,
        mass: 1,
        connections: ["10"],
        color: "#e0f2fe",
        gradient: "linear-gradient(135deg, #e0f2fe, #e0f2fe)",
        createdAt: Date.now() - 200000
    },
    {
        id: "10",
        content: "The subconscious mind processes more information than we realize",
        x: 180, y: 280, z: -180,
        vx: 0, vy: 0, vz: 0,
        mass: 1,
        connections: ["9"],
        color: "#f0f9ff",
        gradient: "linear-gradient(135deg, #f0f9ff, #f0f9ff)",
        createdAt: Date.now() - 100000
    }
];