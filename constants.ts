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

// --- PHYSICS CONSTANTS (TUNED FOR DRAMATIC CLUSTERING WITH RELATIVE SPACING) ---
export const DEFAULT_PHYSICS = {
    // Reduced repulsion to allow clustering (10x weaker than before)
    REPULSION: 5000,
    // Base spring length matches new node diameter
    SPRING_LENGTH: 40,
    // Stronger springs for tight clustering
    STIFFNESS: 0.3,
    // Slightly lower damping for smoother movement
    DAMPING: 0.88,
    // Stronger center pull to keep graph cohesive
    CENTER_GRAVITY: 0.0005
};

// Node sizing constants for relative spacing
export const NODE_DIAMETER = 40;
export const DIAMETER_MULTIPLIER = {
    MIN: 0.3,  // Strong connections (0.9+) → almost touching (12px)
    MAX: 3.0   // Weak connections (0.3-0.4) → far apart (120px)
};

// Start with 10 varied fleeting thoughts (2D layout with weighted connections)
export const INITIAL_THOUGHTS: ThoughtNode[] = [
    {
        id: "1",
        content: "I need to call mom this weekend",
        x: 0, y: 0,
        vx: 0, vy: 0,
        mass: 1,
        color: "#e2e8f0",
        gradient: "linear-gradient(135deg, #e2e8f0, #e2e8f0)",
        connections: { "2": 0.4, "6": 0.9 }, // Weak to creativity, strong to nostalgia
        createdAt: Date.now() - 9000
    },
    {
        id: "2",
        content: "Why do I always feel more creative at night?",
        x: 90, y: -60,
        vx: 0, vy: 0,
        mass: 1,
        color: "#cbd5e1",
        gradient: "linear-gradient(135deg, #cbd5e1, #cbd5e1)",
        connections: { "1": 0.4, "4": 0.85, "5": 0.75 }, // Strong to music/aesthetic
        createdAt: Date.now() - 8000
    },
    {
        id: "3",
        content: "Coffee tastes better when you make it slowly",
        x: -100, y: 80,
        vx: 0, vy: 0,
        mass: 1,
        color: "#f1f5f9",
        gradient: "linear-gradient(135deg, #f1f5f9, #f1f5f9)",
        connections: { "5": 0.7 }, // Moderate to aesthetic observation
        createdAt: Date.now() - 7000
    },
    {
        id: "4",
        content: "Should I learn guitar or stick with piano?",
        x: -80, y: 160,
        vx: 0, vy: 0,
        mass: 1,
        color: "#e0f2fe",
        gradient: "linear-gradient(135deg, #e0f2fe, #e0f2fe)",
        connections: { "2": 0.85, "5": 0.65 }, // Strong to creativity
        createdAt: Date.now() - 6000
    },
    {
        id: "5",
        content: "The way light hits the trees in autumn is magical",
        x: 60, y: 100,
        vx: 0, vy: 0,
        mass: 1,
        color: "#f0f9ff",
        gradient: "linear-gradient(135deg, #f0f9ff, #f0f9ff)",
        connections: { "2": 0.75, "3": 0.7, "4": 0.65, "9": 0.95 }, // Hub of aesthetic cluster
        createdAt: Date.now() - 5000
    },
    {
        id: "6",
        content: "I wonder if my old friends from college still think about me",
        x: 120, y: -120,
        vx: 0, vy: 0,
        mass: 1,
        color: "#e2e8f0",
        gradient: "linear-gradient(135deg, #e2e8f0, #e2e8f0)",
        connections: { "1": 0.9, "9": 0.85, "10": 0.5 }, // Strong nostalgia cluster
        createdAt: Date.now() - 4000
    },
    {
        id: "7",
        content: "Need to fix that leaky faucet before it gets worse",
        x: -140, y: -40,
        vx: 0, vy: 0,
        mass: 1,
        color: "#cbd5e1",
        gradient: "linear-gradient(135deg, #cbd5e1, #cbd5e1)",
        connections: { "8": 0.45 }, // Weak to existential thought
        createdAt: Date.now() - 3000
    },
    {
        id: "8",
        content: "What if I just quit and traveled for a year?",
        x: -170, y: -100,
        vx: 0, vy: 0,
        mass: 1,
        color: "#f1f5f9",
        gradient: "linear-gradient(135deg, #f1f5f9, #f1f5f9)",
        connections: { "7": 0.45, "10": 0.8 }, // Strong to meta-thinking
        createdAt: Date.now() - 2000
    },
    {
        id: "9",
        content: "The smell of rain always reminds me of childhood summers",
        x: 150, y: 140,
        vx: 0, vy: 0,
        mass: 1,
        color: "#e0f2fe",
        gradient: "linear-gradient(135deg, #e0f2fe, #e0f2fe)",
        connections: { "5": 0.95, "6": 0.85 }, // Strong sensory+nostalgia cluster
        createdAt: Date.now() - 1000
    },
    {
        id: "10",
        content: "Am I procrastinating or just resting? There's a difference",
        x: 40, y: -180,
        vx: 0, vy: 0,
        mass: 1,
        color: "#f0f9ff",
        gradient: "linear-gradient(135deg, #f0f9ff, #f0f9ff)",
        connections: { "6": 0.5, "8": 0.8 }, // Meta-thinking cluster
        createdAt: Date.now()
    }
];